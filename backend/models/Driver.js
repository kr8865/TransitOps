const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  licenseNo: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  licenseCategory: {
    type: String,
    required: true,
    enum: ['LMV', 'HMV', 'Other'],
  },
  licenseExpiryDate: {
    type: Date,
    required: true,
  },
  contactNo: {
    type: String,
    required: true,
    trim: true,
  },
  safetyScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 100,
  },
  status: {
    type: String,
    required: true,
    enum: ['Available', 'On Trip', 'Off Duty', 'Suspended'],
    default: 'Available',
  },
  tripsCompleted: {
    type: Number,
    default: 0,
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Driver', driverSchema);
