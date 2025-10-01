const mongoose = require('mongoose');

const investmentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['fondo', 'azione', 'azione-dividendi', 'etf', 'etf-dividendi', 'obbligazione', 'reit']
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currentValue: {
    type: Number,
    required: true,
    min: 0
  },
  quantity: {
    type: Number,
    min: 0
  },
  date: {
    type: Date,
    required: true
  },
  notes: {
    type: String,
    trim: true
  },
  updates: [{
    date: {
      type: Date,
      required: true
    },
    value: {
      type: Number,
      required: true,
      min: 0
    },
    note: {
      type: String,
      trim: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  isExistingInvestment: {
    type: Boolean,
    default: false
  },
  initialPerformance: {
    type: Number
  }
}, {
  timestamps: true
});

// Index for efficient queries
investmentSchema.index({ userId: 1, createdAt: -1 });
investmentSchema.index({ userId: 1, type: 1 });

// Virtual for calculated performance
investmentSchema.virtual('performance').get(function() {
  if (this.amount === 0) return 0;
  return ((this.currentValue - this.amount) / this.amount) * 100;
});

// Virtual for gain/loss
investmentSchema.virtual('gainLoss').get(function() {
  return this.currentValue - this.amount;
});

module.exports = mongoose.model('Investment', investmentSchema);
