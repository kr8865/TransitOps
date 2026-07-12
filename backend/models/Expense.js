const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['Toll', 'Permit', 'Other'],
  },
  cost: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Expense', expenseSchema);
