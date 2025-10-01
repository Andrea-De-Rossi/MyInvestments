const mongoose = require('mongoose');

const dividendSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  investmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Investment',
    required: true
  },
  investmentName: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  grossAmount: {
    type: Number,
    required: true,
    min: 0
  },
  taxesWithheld: {
    type: Number,
    default: 0,
    min: 0
  },
  netAmount: {
    type: Number,
    required: true,
    min: 0
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
dividendSchema.index({ userId: 1, date: -1 });
dividendSchema.index({ userId: 1, investmentId: 1 });

// Calculate net amount before saving
dividendSchema.pre('save', function(next) {
  this.netAmount = this.grossAmount - this.taxesWithheld;
  next();
});

module.exports = mongoose.model('Dividend', dividendSchema);
