const express = require('express');
const Driver = require('../models/Driver');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const router = express.Router();

// @route   GET /api/drivers
// @desc    Get all drivers
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { status } = req.query;
    let query = {};
    if (status && status !== 'All') {
      query.status = status;
    }
    const drivers = await Driver.find(query).sort({ createdAt: -1 });
    res.json(drivers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/drivers
// @desc    Create a new driver
// @access  Private (Safety Officer)
router.post('/', protect, authorize('Safety Officer', 'Fleet Manager'), async (req, res) => {
  const { name, licenseNo, licenseCategory, licenseExpiryDate, contactNo, safetyScore, status } = req.body;

  try {
    const driverExists = await Driver.findOne({ licenseNo });

    if (driverExists) {
      return res.status(400).json({ message: `Driver with license number ${licenseNo} already exists.` });
    }

    const driver = new Driver({
      name,
      licenseNo,
      licenseCategory,
      licenseExpiryDate,
      contactNo,
      safetyScore: safetyScore !== undefined ? safetyScore : 100,
      status: status || 'Available',
    });

    const savedDriver = await driver.save();
    res.status(201).json(savedDriver);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @route   GET /api/drivers/:id
// @desc    Get single driver details
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }
    res.json(driver);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/drivers/:id
// @desc    Update a driver
// @access  Private (Safety Officer)
router.put('/:id', protect, authorize('Safety Officer', 'Fleet Manager'), async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    if (req.body.licenseNo && req.body.licenseNo !== driver.licenseNo) {
      const driverExists = await Driver.findOne({ licenseNo: req.body.licenseNo });
      if (driverExists) {
        return res.status(400).json({ message: `Driver with license number ${req.body.licenseNo} already exists.` });
      }
      driver.licenseNo = req.body.licenseNo;
    }

    driver.name = req.body.name || driver.name;
    driver.licenseCategory = req.body.licenseCategory || driver.licenseCategory;
    driver.licenseExpiryDate = req.body.licenseExpiryDate || driver.licenseExpiryDate;
    driver.contactNo = req.body.contactNo || driver.contactNo;
    driver.safetyScore = req.body.safetyScore !== undefined ? req.body.safetyScore : driver.safetyScore;
    driver.status = req.body.status || driver.status;

    const updatedDriver = await driver.save();
    res.json(updatedDriver);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @route   DELETE /api/drivers/:id
// @desc    Delete a driver
// @access  Private (Safety Officer)
router.delete('/:id', protect, authorize('Safety Officer', 'Fleet Manager'), async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    await Driver.deleteOne({ _id: req.params.id });
    res.json({ message: 'Driver removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
