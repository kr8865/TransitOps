const express = require('express');
const Trip = require('../models/Trip');
const Vehicle = require('../models/Vehicle');
const Driver = require('../models/Driver');
const FuelLog = require('../models/FuelLog');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const router = express.Router();

// Helper to generate next trip code, e.g., TR001, TR002...
const generateTripCode = async () => {
  const count = await Trip.countDocuments();
  const nextNum = String(count + 1).padStart(3, '0');
  return `TR${nextNum}`;
};

// Calculate ETA dynamically based on planned distance (average speed = 50 km/h)
const calculateETA = (distance) => {
  if (!distance || distance <= 0) return '--';
  const hours = distance / 50;
  const totalMinutes = Math.round(hours * 60);
  if (totalMinutes < 60) {
    return `${totalMinutes} min`;
  } else {
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
};

// @route   GET /api/trips
// @desc    Get all trips
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const trips = await Trip.find()
      .populate('vehicle')
      .populate('driver')
      .sort({ createdAt: -1 });
    res.json(trips);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/trips
// @desc    Create a trip (Draft or directly Dispatched)
// @access  Private (Dispatcher)
router.post('/', protect, authorize('Dispatcher'), async (req, res) => {
  const { source, destination, vehicleId, driverId, cargoWeight, plannedDistance, status, revenue } = req.body;

  try {
    const tripCode = await generateTripCode();
    let vehicle = null;
    let driver = null;

    if (vehicleId) {
      vehicle = await Vehicle.findById(vehicleId);
      if (!vehicle) {
        return res.status(404).json({ message: 'Vehicle not found' });
      }
    }

    if (driverId) {
      driver = await Driver.findById(driverId);
      if (!driver) {
        return res.status(404).json({ message: 'Driver not found' });
      }
    }

    // Business validations when status is set to Dispatched
    if (status === 'Dispatched') {
      if (!vehicle || !driver) {
        return res.status(400).json({ message: 'Vehicle and Driver are required to dispatch a trip.' });
      }

      // 1. Cargo weight check
      if (cargoWeight > vehicle.maxCapacity) {
        return res.status(400).json({
          message: `Dispatch blocked: Cargo weight (${cargoWeight} kg) exceeds vehicle max capacity (${vehicle.maxCapacity} kg) by ${cargoWeight - vehicle.maxCapacity} kg.`
        });
      }

      // 2. Retired or In Shop vehicle check
      if (['In Shop', 'Retired'].includes(vehicle.status)) {
        return res.status(400).json({
          message: `Dispatch blocked: Selected vehicle status is "${vehicle.status}". Only "Available" vehicles can be dispatched.`
        });
      }

      // 3. Vehicle already On Trip check
      if (vehicle.status === 'On Trip') {
        return res.status(400).json({ message: 'Dispatch blocked: Vehicle is already assigned to an active trip.' });
      }

      // 4. Driver suspended or license expired check
      if (driver.status === 'Suspended') {
        return res.status(400).json({ message: 'Dispatch blocked: Driver is suspended.' });
      }

      const today = new Date();
      if (new Date(driver.licenseExpiryDate) < today) {
        return res.status(400).json({ message: 'Dispatch blocked: Driver driving license has expired.' });
      }

      // 5. Driver already On Trip check
      if (driver.status === 'On Trip') {
        return res.status(400).json({ message: 'Dispatch blocked: Driver is already assigned to an active trip.' });
      }

      // Update statuses
      vehicle.status = 'On Trip';
      driver.status = 'On Trip';
      await vehicle.save();
      await driver.save();
    }

    const trip = new Trip({
      tripCode,
      source,
      destination,
      vehicle: vehicleId || null,
      driver: driverId || null,
      cargoWeight,
      plannedDistance,
      status: status || 'Draft',
      revenue: revenue || 0,
      eta: status === 'Dispatched' ? calculateETA(plannedDistance) : '--'
    });

    const savedTrip = await trip.save();
    res.status(201).json(savedTrip);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @route   PUT /api/trips/:id/dispatch
// @desc    Dispatch a draft trip
// @access  Private (Dispatcher)
router.put('/:id/dispatch', protect, authorize('Dispatcher'), async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    if (trip.status !== 'Draft') {
      return res.status(400).json({ message: `Cannot dispatch a trip in "${trip.status}" status.` });
    }

    if (!trip.vehicle || !trip.driver) {
      return res.status(400).json({ message: 'Trip must have an assigned vehicle and driver before dispatching.' });
    }

    const vehicle = await Vehicle.findById(trip.vehicle);
    const driver = await Driver.findById(trip.driver);

    if (!vehicle || !driver) {
      return res.status(400).json({ message: 'Assigned Vehicle or Driver was not found in registry.' });
    }

    // Enforce validations
    if (trip.cargoWeight > vehicle.maxCapacity) {
      return res.status(400).json({
        message: `Dispatch blocked: Cargo weight (${trip.cargoWeight} kg) exceeds vehicle max capacity (${vehicle.maxCapacity} kg) by ${trip.cargoWeight - vehicle.maxCapacity} kg.`
      });
    }

    if (['In Shop', 'Retired'].includes(vehicle.status)) {
      return res.status(400).json({
        message: `Dispatch blocked: Selected vehicle status is "${vehicle.status}". Only "Available" vehicles can be dispatched.`
      });
    }

    if (vehicle.status === 'On Trip') {
      return res.status(400).json({ message: 'Dispatch blocked: Vehicle is already assigned to an active trip.' });
    }

    if (driver.status === 'Suspended') {
      return res.status(400).json({ message: 'Dispatch blocked: Driver is suspended.' });
    }

    const today = new Date();
    if (new Date(driver.licenseExpiryDate) < today) {
      return res.status(400).json({ message: 'Dispatch blocked: Driver license has expired.' });
    }

    if (driver.status === 'On Trip') {
      return res.status(400).json({ message: 'Dispatch blocked: Driver is already assigned to an active trip.' });
    }

    // Set status to On Trip
    vehicle.status = 'On Trip';
    driver.status = 'On Trip';
    await vehicle.save();
    await driver.save();

    trip.status = 'Dispatched';
    trip.eta = calculateETA(trip.plannedDistance);
    const updatedTrip = await trip.save();

    res.json(updatedTrip);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @route   PUT /api/trips/:id/complete
// @desc    Complete a trip (enters final odometer and fuel consumed)
// @access  Private (Dispatcher)
router.put('/:id/complete', protect, authorize('Dispatcher'), async (req, res) => {
  const { actualOdometerEnd, fuelConsumed, fuelCost, revenue } = req.body;

  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    if (trip.status !== 'Dispatched') {
      return res.status(400).json({ message: `Cannot complete a trip that is in status "${trip.status}".` });
    }

    const vehicle = await Vehicle.findById(trip.vehicle);
    const driver = await Driver.findById(trip.driver);

    if (!vehicle || !driver) {
      return res.status(400).json({ message: 'Vehicle or Driver not found.' });
    }

    if (actualOdometerEnd < vehicle.odometer) {
      return res.status(400).json({
        message: `Validation Error: Final odometer reading (${actualOdometerEnd} km) must be greater than or equal to the vehicle's current odometer (${vehicle.odometer} km).`
      });
    }

    // Complete the trip
    trip.status = 'Completed';
    trip.actualOdometerEnd = actualOdometerEnd;
    trip.fuelConsumed = fuelConsumed;
    trip.fuelCost = fuelCost || 0;
    trip.eta = '--';
    if (revenue !== undefined) {
      trip.revenue = revenue;
    }
    await trip.save();

    // Log fuel if provided
    if (fuelConsumed > 0 && fuelCost > 0) {
      await FuelLog.create({
        vehicle: vehicle._id,
        liters: fuelConsumed,
        cost: fuelCost,
        date: new Date(),
      });
    }

    // Restore vehicle and driver status to Available
    vehicle.odometer = actualOdometerEnd;
    vehicle.status = 'Available';
    await vehicle.save();

    driver.status = 'Available';
    driver.tripsCompleted += 1;
    await driver.save();

    res.json(trip);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @route   PUT /api/trips/:id/cancel
// @desc    Cancel a trip
// @access  Private (Dispatcher)
router.put('/:id/cancel', protect, authorize('Dispatcher'), async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    if (['Completed', 'Cancelled'].includes(trip.status)) {
      return res.status(400).json({ message: `Trip is already in status "${trip.status}".` });
    }

    // If it was Dispatched, restore vehicle and driver to Available
    if (trip.status === 'Dispatched') {
      if (trip.vehicle) {
        const vehicle = await Vehicle.findById(trip.vehicle);
        if (vehicle && vehicle.status === 'On Trip') {
          vehicle.status = 'Available';
          await vehicle.save();
        }
      }

      if (trip.driver) {
        const driver = await Driver.findById(trip.driver);
        if (driver && driver.status === 'On Trip') {
          driver.status = 'Available';
          await driver.save();
        }
      }
    }

    trip.status = 'Cancelled';
    trip.eta = '--';
    const updatedTrip = await trip.save();

    res.json(updatedTrip);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
