const express = require('express');
const router = express.Router();
const Trip = require('../models/Trip');
const { protect } = require('../middleware/authMiddleware');

// GET /api/trips - return all trips populated with vehicle and driver
router.get('/', protect, async (req, res, next) => {
  try {
    const trips = await Trip.find()
      .populate('vehicle')
      .populate('driver')
      .sort({ createdAt: -1 });

    res.json(trips);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
