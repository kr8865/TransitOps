const express = require('express');
const Maintenance = require('../models/Maintenance');
const Vehicle = require('../models/Vehicle');
const Expense = require('../models/Expense');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const router = express.Router();

// @route   GET /api/maintenance
// @desc    Get all maintenance logs
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const logs = await Maintenance.find().populate('vehicle').sort({ createdAt: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/maintenance
// @desc    Create a new active maintenance record
// @access  Private (Fleet Manager)
router.post('/', protect, authorize('Fleet Manager'), async (req, res) => {
  const { vehicleId, description, cost, startDate } = req.body;

  try {
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    if (vehicle.status === 'Retired') {
      return res.status(400).json({ message: 'Cannot place a Retired vehicle in maintenance.' });
    }

    if (vehicle.status === 'On Trip') {
      return res.status(400).json({ message: 'Vehicle is currently On Trip. Complete the trip before logging maintenance.' });
    }

    // Change vehicle status to In Shop
    vehicle.status = 'In Shop';
    await vehicle.save();

    const log = new Maintenance({
      vehicle: vehicleId,
      description,
      cost,
      startDate: startDate || new Date(),
      status: 'Active',
    });

    const savedLog = await log.save();

    // Log the maintenance cost under general expenses for operational calculations
    await Expense.create({
      vehicle: vehicleId,
      type: 'Other',
      cost,
      description: `Maintenance: ${description}`,
      date: startDate || new Date()
    });

    res.status(201).json(savedLog);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @route   PUT /api/maintenance/:id/close
// @desc    Close a maintenance record
// @access  Private (Fleet Manager)
router.put('/:id/close', protect, authorize('Fleet Manager'), async (req, res) => {
  try {
    const log = await Maintenance.findById(req.params.id);
    if (!log) {
      return res.status(404).json({ message: 'Maintenance record not found' });
    }

    if (log.status === 'Closed') {
      return res.status(400).json({ message: 'Maintenance record is already closed.' });
    }

    const vehicle = await Vehicle.findById(log.vehicle);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle associated with this maintenance not found.' });
    }

    // Close log
    log.status = 'Closed';
    log.endDate = new Date();
    await log.save();

    // Restore vehicle to Available (unless already retired)
    if (vehicle.status !== 'Retired') {
      vehicle.status = 'Available';
      await vehicle.save();
    }

    res.json(log);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
