const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  tripCode: {
    type: String,
    required: true,
    unique: true,
  },
  source: {
    type: String,
    required: true,
    trim: true,
  },
  destination: {
    type: String,
    required: true,
    trim: true,
  },
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: false, // can be unassigned in Draft
  },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    required: false, // can be unassigned in Draft
  },
  cargoWeight: {
    type: Number, // in kg
    required: true,
  },
  plannedDistance: {
    type: Number, // in km
    required: true,
  },
  status: {
    type: String,
    required: true,
    enum: ['Draft', 'Dispatched', 'Completed', 'Cancelled'],
    default: 'Draft',
  },
  eta: {
    type: String, // e.g. "45 min" or "1h 10m"
    default: '--',
  },
  actualOdometerEnd: {
    type: Number,
  },
  fuelConsumed: {
    type: Number, // in liters
  },
  fuelCost: {
    type: Number,
    default: 0,
  },
  revenue: {
    type: Number,
    default: 0,
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Trip', tripSchema);
