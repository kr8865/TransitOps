const express = require('express');
const Vehicle = require('../models/Vehicle');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const router = express.Router();

// @route   GET /api/vehicles
// @desc    Get all vehicles (supports filtering & search)
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { type, status, search } = req.query;
    let query = {};

    if (type && type !== 'All') {
      query.type = type;
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    if (search) {
      query.regNo = { $regex: search, $options: 'i' };
    }

    const vehicles = await Vehicle.find(query).sort({ createdAt: -1 });
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/vehicles
// @desc    Create a new vehicle
// @access  Private (Fleet Manager)
router.post('/', protect, authorize('Fleet Manager'), async (req, res) => {
  const { regNo, name, type, maxCapacity, odometer, acquisitionCost, status } = req.body;

  try {
    const formattedRegNo = regNo.toUpperCase().trim();
    const vehicleExists = await Vehicle.findOne({ regNo: formattedRegNo });

    if (vehicleExists) {
      return res.status(400).json({ message: `Vehicle with registration number ${formattedRegNo} already exists.` });
    }

    const vehicle = new Vehicle({
      regNo: formattedRegNo,
      name,
      type,
      maxCapacity,
      odometer,
      acquisitionCost,
      status: status || 'Available',
    });

    const savedVehicle = await vehicle.save();
    res.status(201).json(savedVehicle);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @route   GET /api/vehicles/:id
// @desc    Get single vehicle details
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }
    res.json(vehicle);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/vehicles/:id
// @desc    Update a vehicle
// @access  Private (Fleet Manager)
router.put('/:id', protect, authorize('Fleet Manager'), async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    // If changing regNo, check uniqueness
    if (req.body.regNo) {
      const formattedRegNo = req.body.regNo.toUpperCase().trim();
      if (formattedRegNo !== vehicle.regNo) {
        const vehicleExists = await Vehicle.findOne({ regNo: formattedRegNo });
        if (vehicleExists) {
          return res.status(400).json({ message: `Vehicle with registration number ${formattedRegNo} already exists.` });
        }
        vehicle.regNo = formattedRegNo;
      }
    }

    vehicle.name = req.body.name || vehicle.name;
    vehicle.type = req.body.type || vehicle.type;
    vehicle.maxCapacity = req.body.maxCapacity !== undefined ? req.body.maxCapacity : vehicle.maxCapacity;
    vehicle.odometer = req.body.odometer !== undefined ? req.body.odometer : vehicle.odometer;
    vehicle.acquisitionCost = req.body.acquisitionCost !== undefined ? req.body.acquisitionCost : vehicle.acquisitionCost;
    vehicle.status = req.body.status || vehicle.status;

    const updatedVehicle = await vehicle.save();
    res.json(updatedVehicle);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @route   DELETE /api/vehicles/:id
// @desc    Delete a vehicle
// @access  Private (Fleet Manager)
router.delete('/:id', protect, authorize('Fleet Manager'), async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    await Vehicle.deleteOne({ _id: req.params.id });
    res.json({ message: 'Vehicle removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
