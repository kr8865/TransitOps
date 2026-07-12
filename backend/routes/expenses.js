const express = require('express');
const router = express.Router();
const Vehicle = require('../models/Vehicle');
const Trip = require('../models/Trip');
const Expense = require('../models/Expense');
const FuelLog = require('../models/FuelLog');
const Maintenance = require('../models/Maintenance');
const { protect } = require('../middleware/authMiddleware');

// Helper to safely sum
const sum = (arr, key) => arr.reduce((s, i) => s + (Number(i[key]) || 0), 0);

// GET /api/expenses/analytics - compute basic analytics
router.get('/analytics', protect, async (req, res, next) => {
  try {
    const [vehicles, trips, expenses, fuels, maints] = await Promise.all([
      Vehicle.find().lean(),
      Trip.find().lean(),
      Expense.find().lean(),
      FuelLog.find().lean(),
      Maintenance.find().lean()
    ]);

    const totalVehicles = vehicles.length;
    const activeVehicles = vehicles.filter(v => v.status === 'On Trip').length;
    const availableVehicles = vehicles.filter(v => v.status === 'Available').length;
    const vehiclesInMaintenance = vehicles.filter(v => v.status === 'In Shop').length;

    const activeTrips = trips.filter(t => t.status === 'Dispatched').length;
    const pendingTrips = trips.filter(t => t.status === 'Draft').length;

    const driversOnDuty = await require('../models/Driver').countDocuments({ status: 'On Trip' });

    const fleetUtilization = totalVehicles > 0 ? Math.round((activeVehicles / totalVehicles) * 100) : 0;

    // Per-vehicle analytics aggregation
    const vehicleAnalytics = vehicles.map(v => {
      const vid = v._id.toString();
      const vTrips = trips.filter(t => t.vehicle && t.vehicle.toString() === vid);
      const revenue = sum(vTrips, 'revenue');
      const fuelCost = sum(fuels.filter(f => f.vehicle && f.vehicle.toString() === vid), 'cost');
      const maintenanceCost = sum(maints.filter(m => m.vehicle && m.vehicle.toString() === vid), 'cost');
      const otherExpenseCost = sum(expenses.filter(e => e.vehicle && e.vehicle.toString() === vid), 'cost');
      const totalCosts = fuelCost + maintenanceCost + otherExpenseCost;
      const acquisitionCost = Number(v.acquisitionCost || 0);
      const netMoneyUsed = acquisitionCost + totalCosts;
      const netProfit = revenue - totalCosts;
      const netProfitAfterAcq = revenue - totalCosts - acquisitionCost;
      const roiPercentage = acquisitionCost > 0 ? Number(((revenue - totalCosts) / acquisitionCost) * 100).toFixed(1) : 0;

      return {
        _id: v._id,
        name: v.name,
        regNo: v.regNo,
        type: v.type,
        status: v.status,
        revenue,
        fuelCost,
        maintenanceCost,
        otherExpenseCost,
        totalCosts,
        acquisitionCost,
        netMoneyUsed,
        netProfit,
        netProfitAfterAcq,
        roiPercentage: Number(roiPercentage)
      };
    });

    const totalRevenue = sum(trips, 'revenue');
    const totalOperationalCost = sum(fuels, 'cost') + sum(maints, 'cost') + sum(expenses, 'cost');
    const totalAcquisitionCost = sum(vehicles, 'acquisitionCost');
    const totalNetMoneyUsed = totalOperationalCost + totalAcquisitionCost;
    const totalProfit = totalRevenue - totalOperationalCost;
    const totalNetProfitAfterAcquisition = totalRevenue - totalOperationalCost - totalAcquisitionCost;

    // Monthly revenue (group by month name)
    const monthly = {};
    trips.forEach(t => {
      const date = t.createdAt ? new Date(t.createdAt) : new Date();
      const month = date.toLocaleString('default', { month: 'short' });
      monthly[month] = (monthly[month] || 0) + Number(t.revenue || 0);
    });
    const monthlyRevenue = Object.keys(monthly).map(month => ({ month, revenue: monthly[month] }));

    // Simple fuel efficiency: total distance / total liters if available
    const totalDistance = sum(trips, 'plannedDistance') + sum(trips, 'actualOdometerEnd');
    const totalLiters = sum(fuels, 'liters');
    const fuelEfficiency = totalLiters > 0 ? (totalDistance / totalLiters) : 0;

    const kpis = {
      activeVehicles,
      availableVehicles,
      vehiclesInMaintenance,
      activeTrips,
      pendingTrips,
      driversOnDuty,
      fleetUtilization,
      totalVehicles
    };

    const costs = {
      totalRevenue,
      totalAcquisitionCost,
      totalNetMoneyUsed,
      totalNetProfitAfterAcquisition,
      totalOperationalCost,
      fuelCostTotal: sum(fuels, 'cost'),
      maintenanceCostTotal: sum(maints, 'cost'),
      otherExpenseCostTotal: sum(expenses, 'cost')
    };

    res.json({
      kpis,
      costs,
      fuelEfficiency,
      vehicleAnalytics,
      monthlyRevenue,
      totalProfit
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
