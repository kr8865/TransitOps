const express = require('express');
const FuelLog = require('../models/FuelLog');
const Expense = require('../models/Expense');
const Maintenance = require('../models/Maintenance');
const Vehicle = require('../models/Vehicle');
const Trip = require('../models/Trip');
const Driver = require('../models/Driver');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const router = express.Router();

// @route   GET /api/expenses/fuel
// @desc    Get all fuel logs
// @access  Private
router.get('/fuel', protect, async (req, res) => {
  try {
    const logs = await FuelLog.find().populate('vehicle').sort({ date: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/expenses/fuel
// @desc    Record fuel log
// @access  Private (Financial Analyst)
router.post('/fuel', protect, authorize('Financial Analyst'), async (req, res) => {
  const { vehicleId, liters, cost, date } = req.body;

  try {
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    const log = new FuelLog({
      vehicle: vehicleId,
      liters,
      cost,
      date: date || new Date(),
    });

    const savedLog = await log.save();
    res.status(201).json(savedLog);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @route   GET /api/expenses/other
// @desc    Get all other expenses
// @access  Private
router.get('/other', protect, async (req, res) => {
  try {
    const expenses = await Expense.find().populate('vehicle').sort({ date: -1 });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/expenses/other
// @desc    Record other expenses (tolls, permits, etc.)
// @access  Private (Financial Analyst)
router.post('/other', protect, authorize('Financial Analyst'), async (req, res) => {
  const { vehicleId, type, cost, description, date } = req.body;

  try {
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    const expense = new Expense({
      vehicle: vehicleId,
      type,
      cost,
      description,
      date: date || new Date(),
    });

    const savedExpense = await expense.save();
    res.status(201).json(savedExpense);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @route   GET /api/expenses/analytics
// @desc    Get operational dashboards & ROI metrics
// @access  Private
router.get('/analytics', protect, async (req, res) => {
  try {
    // 1. Overall stats
    const totalVehicles = await Vehicle.countDocuments();
    const activeVehiclesCount = await Vehicle.countDocuments({ status: 'On Trip' });
    const availableVehiclesCount = await Vehicle.countDocuments({ status: 'Available' });
    const inMaintenanceCount = await Vehicle.countDocuments({ status: 'In Shop' });
    
    const activeTripsCount = await Trip.countDocuments({ status: 'Dispatched' });
    const pendingTripsCount = await Trip.countDocuments({ status: 'Draft' });
    const driversOnDutyCount = await Driver.countDocuments({ status: 'On Trip' });

    // Fleet utilization = (Active Vehicles / Total Vehicles) * 100
    const fleetUtilization = totalVehicles > 0 ? Math.round((activeVehiclesCount / totalVehicles) * 100) : 0;

    // 2. Aggregate costs
    const totalFuelResult = await FuelLog.aggregate([
      { $group: { _id: null, totalCost: { $sum: '$cost' }, totalLiters: { $sum: '$liters' } } }
    ]);
    const fuelCostTotal = totalFuelResult.length > 0 ? totalFuelResult[0].totalCost : 0;
    const fuelLitersTotal = totalFuelResult.length > 0 ? totalFuelResult[0].totalLiters : 0;

    const totalMaintenanceResult = await Maintenance.aggregate([
      { $group: { _id: null, totalCost: { $sum: '$cost' } } }
    ]);
    const maintenanceCostTotal = totalMaintenanceResult.length > 0 ? totalMaintenanceResult[0].totalCost : 0;

    const totalOtherExpenseResult = await Expense.aggregate([
      { $group: { _id: null, totalCost: { $sum: '$cost' } } }
    ]);
    const otherExpenseCostTotal = totalOtherExpenseResult.length > 0 ? totalOtherExpenseResult[0].totalCost : 0;

    const totalOperationalCost = fuelCostTotal + maintenanceCostTotal + otherExpenseCostTotal;

    // 3. Fuel efficiency (Distance/Fuel)
    // Gather all completed trips that have fuel details
    const completedTrips = await Trip.find({ status: 'Completed', fuelConsumed: { $gt: 0 } });
    let totalCompletedDistance = 0;
    let totalCompletedFuel = 0;
    completedTrips.forEach(t => {
      totalCompletedDistance += t.plannedDistance || 0;
      totalCompletedFuel += t.fuelConsumed || 0;
    });

    const averageFuelEfficiency = totalCompletedFuel > 0 
      ? parseFloat((totalCompletedDistance / totalCompletedFuel).toFixed(2)) 
      : 0;

    // 4. Vehicle specific ROI and breakdown
    const vehicles = await Vehicle.find();
    const vehicleAnalytics = await Promise.all(vehicles.map(async (v) => {
      // Sum revenue from Completed trips for this vehicle
      const tripRevenueResult = await Trip.aggregate([
        { $match: { vehicle: v._id, status: 'Completed' } },
        { $group: { _id: null, totalRevenue: { $sum: '$revenue' } } }
      ]);
      const revenue = tripRevenueResult.length > 0 ? tripRevenueResult[0].totalRevenue : 0;

      // Sum Fuel costs (from FuelLog records)
      const fuelResult = await FuelLog.aggregate([
        { $match: { vehicle: v._id } },
        { $group: { _id: null, totalCost: { $sum: '$cost' } } }
      ]);
      const fuel = fuelResult.length > 0 ? fuelResult[0].totalCost : 0;

      // Sum Maintenance costs
      const maintResult = await Maintenance.aggregate([
        { $match: { vehicle: v._id } },
        { $group: { _id: null, totalCost: { $sum: '$cost' } } }
      ]);
      const maintenance = maintResult.length > 0 ? maintResult[0].totalCost : 0;

      // Sum Tolls/Other expenses
      const expResult = await Expense.aggregate([
        { $match: { vehicle: v._id } },
        { $group: { _id: null, totalCost: { $sum: '$cost' } } }
      ]);
      const otherExpenses = expResult.length > 0 ? expResult[0].totalCost : 0;

      // totalCosts = all operational costs (fuel + maintenance + other)
      const totalCosts = fuel + maintenance + otherExpenses;

      // netMoneyUsed = acquisition cost + all operational costs (total money spent on this truck)
      const acquisitionCost = v.acquisitionCost || 0;
      const netMoneyUsed = acquisitionCost + totalCosts;

      // netProfit = revenue earned - operational costs (profit from operations)
      const netProfit = revenue - totalCosts;

      // netProfitAfterAcquisition = revenue - operational costs - acquisition cost
      const netProfitAfterAcquisition = revenue - totalCosts - acquisitionCost;
      
      // ROI = (Revenue - (Maint + Fuel + Other)) / Acquisition Cost
      let roi = 0;
      if (acquisitionCost > 0) {
        roi = parseFloat(((revenue - totalCosts) / acquisitionCost).toFixed(4));
      }

      return {
        _id: v._id,
        regNo: v.regNo,
        name: v.name,
        type: v.type,
        status: v.status,
        acquisitionCost,
        revenue,
        fuelCost: fuel,
        maintenanceCost: maintenance,
        otherExpenseCost: otherExpenses,
        totalCosts,
        netMoneyUsed,
        netProfit,
        netProfitAfterAcquisition,
        roiPercentage: parseFloat((roi * 100).toFixed(2))
      };
    }));

    // Group completed trips revenue by month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyRevenueResult = await Trip.aggregate([
      {
        $match: {
          status: 'Completed',
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { $sum: '$revenue' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const formattedMonthlyRevenue = monthlyRevenueResult.map(item => {
      return {
        month: monthNames[item._id.month - 1],
        revenue: item.revenue
      };
    });

    const dynamicMonthlyRevenue = [];
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const mName = monthNames[d.getMonth()];
      dynamicMonthlyRevenue.push({ month: mName, revenue: 0 });
    }

    formattedMonthlyRevenue.forEach(item => {
      const monthIdx = dynamicMonthlyRevenue.findIndex(r => r.month === item.month);
      if (monthIdx !== -1) {
        dynamicMonthlyRevenue[monthIdx].revenue = item.revenue;
      }
    });

    // Fetch all completed trips and populate vehicle
    const completedTripsForProfit = await Trip.find({ status: 'Completed' }).populate('vehicle');
    
    // Fetch all expenses to associate tolls/permits
    const allExpensesList = await Expense.find();

    const tripWiseProfit = completedTripsForProfit.map(trip => {
      const tripCode = trip.tripCode;
      
      // Filter expenses where description starts with trip code, e.g. "TR001: Toll Fee"
      const otherCosts = allExpensesList
        .filter(exp => exp.description && exp.description.startsWith(tripCode))
        .reduce((sum, exp) => sum + exp.cost, 0);

      const fuelCost = trip.fuelCost || 0;
      const totalCost = fuelCost + otherCosts;
      const profit = trip.revenue - totalCost;

      return {
        _id: trip._id,
        tripCode,
        vehicleName: trip.vehicle ? `${trip.vehicle.name} (${trip.vehicle.regNo})` : 'Removed',
        revenue: trip.revenue,
        fuelCost,
        otherCosts,
        totalCost,
        profit
      };
    });

    // Consistent totals: derive from vehicleAnalytics to match displayed per-vehicle figures
    const totalRevenue = vehicleAnalytics.reduce((sum, v) => sum + v.revenue, 0);
    const totalAcquisitionCost = vehicleAnalytics.reduce((sum, v) => sum + v.acquisitionCost, 0);
    // totalOperationalCost is already computed above (fuelCostTotal + maintenanceCostTotal + otherExpenseCostTotal)
    // Net profit = revenue minus operational costs (does not include one-time acquisition)
    const totalNetProfit = totalRevenue - totalOperationalCost;
    // Total money used = acquisition cost + all operational costs
    const totalNetMoneyUsed = totalAcquisitionCost + totalOperationalCost;
    // Net profit after subtracting acquisition cost
    const totalNetProfitAfterAcquisition = totalRevenue - totalOperationalCost - totalAcquisitionCost;

    res.json({
      kpis: {
        activeVehicles: activeVehiclesCount,
        availableVehicles: availableVehiclesCount,
        vehiclesInMaintenance: inMaintenanceCount,
        activeTrips: activeTripsCount,
        pendingTrips: pendingTripsCount,
        driversOnDuty: driversOnDutyCount,
        fleetUtilization,
        totalVehicles,
      },
      costs: {
        fuelCostTotal,
        maintenanceCostTotal,
        otherExpenseCostTotal,
        totalOperationalCost,
        totalRevenue,
        totalAcquisitionCost,
        totalNetMoneyUsed,
        totalNetProfit,
        totalNetProfitAfterAcquisition,
      },
      fuelEfficiency: averageFuelEfficiency,
      vehicleAnalytics,
      monthlyRevenue: dynamicMonthlyRevenue,
      tripWiseProfit,
      totalProfit: totalNetProfit
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
