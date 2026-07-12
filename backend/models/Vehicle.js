const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  regNo: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['Van', 'Truck', 'Mini', 'Bus', 'Other'],
  },
  maxCapacity: {
    type: Number, // in kg
    required: true,
  },
  odometer: {
    type: Number, // in km
    required: true,
    default: 0,
  },
  acquisitionCost: {
    type: Number,
    required: true,
    default: 0,
  },
  status: {
    type: String,
    required: true,
    enum: ['Available', 'On Trip', 'In Shop', 'Retired'],
    default: 'Available',
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Vehicle', vehicleSchema);
