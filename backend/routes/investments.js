const express = require('express');
const { body, validationResult } = require('express-validator');
const Investment = require('../models/Investment');
const Dividend = require('../models/Dividend');
const Divestment = require('../models/Divestment');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all investments for user
router.get('/', auth, async (req, res) => {
  try {
    const investments = await Investment.find({ userId: req.userId })
      .sort({ createdAt: -1 });
    
    res.json(investments);
  } catch (error) {
    console.error('Get investments error:', error);
    res.status(500).json({ error: 'Server error getting investments' });
  }
});

// Get investment by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const investment = await Investment.findOne({ 
      _id: req.params.id, 
      userId: req.userId 
    });
    
    if (!investment) {
      return res.status(404).json({ error: 'Investment not found' });
    }
    
    res.json(investment);
  } catch (error) {
    console.error('Get investment error:', error);
    res.status(500).json({ error: 'Server error getting investment' });
  }
});

// Create new investment
router.post('/', auth, [
  body('name').isLength({ min: 1 }).trim().escape(),
  body('initialAmount').isFloat({ min: 0 }),
  body('currentValue').isFloat({ min: 0 }),
  body('type').isIn(['stocks', 'bonds', 'crypto', 'etf', 'mutual-fund', 'real-estate', 'other']),
  body('paysDividends').isBoolean(),
  body('date').isISO8601(),
  body('notes').optional().trim().escape()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const investmentData = {
      ...req.body,
      userId: req.userId
    };

    const investment = new Investment(investmentData);
    await investment.save();

    res.status(201).json({
      message: 'Investment created successfully',
      investment
    });
  } catch (error) {
    console.error('Create investment error:', error);
    res.status(500).json({ error: 'Server error creating investment' });
  }
});

// Update investment
router.put('/:id', auth, [
  body('name').optional().isLength({ min: 1 }).trim().escape(),
  body('initialAmount').optional().isFloat({ min: 0 }),
  body('currentValue').optional().isFloat({ min: 0 }),
  body('type').optional().isIn(['stocks', 'bonds', 'crypto', 'etf', 'mutual-fund', 'real-estate', 'other']),
  body('paysDividends').optional().isBoolean(),
  body('notes').optional().trim().escape()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const investment = await Investment.findOne({ 
      _id: req.params.id, 
      userId: req.userId 
    });
    
    if (!investment) {
      return res.status(404).json({ error: 'Investment not found' });
    }

    // Update fields
    Object.keys(req.body).forEach(key => {
      if (key !== 'userId') {
        investment[key] = req.body[key];
      }
    });

    await investment.save();

    res.json({
      message: 'Investment updated successfully',
      investment
    });
  } catch (error) {
    console.error('Update investment error:', error);
    res.status(500).json({ error: 'Server error updating investment' });
  }
});

// Delete investment
router.delete('/:id', auth, async (req, res) => {
  try {
    const investment = await Investment.findOne({ 
      _id: req.params.id, 
      userId: req.userId 
    });
    
    if (!investment) {
      return res.status(404).json({ error: 'Investment not found' });
    }

    // Also delete associated dividends and divestments
    await Dividend.deleteMany({ investmentId: req.params.id, userId: req.userId });
    await Divestment.deleteMany({ investmentId: req.params.id, userId: req.userId });
    
    await Investment.findByIdAndDelete(req.params.id);

    res.json({ message: 'Investment and related data deleted successfully' });
  } catch (error) {
    console.error('Delete investment error:', error);
    res.status(500).json({ error: 'Server error deleting investment' });
  }
});

// Get portfolio summary
router.get('/stats/summary', auth, async (req, res) => {
  try {
    const investments = await Investment.find({ userId: req.userId });
    const dividends = await Dividend.find({ userId: req.userId });
    const divestments = await Divestment.find({ userId: req.userId });

    const totalInvested = investments.reduce((sum, inv) => sum + inv.initialAmount, 0);
    const currentValue = investments.reduce((sum, inv) => sum + inv.currentValue, 0);
    const totalDividends = dividends.reduce((sum, div) => sum + div.netAmount, 0);
    const totalDivested = divestments.reduce((sum, div) => sum + div.amount, 0);
    
    const gainLoss = currentValue - totalInvested;
    const gainLossPercentage = totalInvested > 0 ? (gainLoss / totalInvested) * 100 : 0;
    
    // Tax calculation (26% on gains in Italy)
    const taxOnGains = gainLoss > 0 ? gainLoss * 0.26 : 0;

    res.json({
      totalInvested,
      currentValue,
      gainLoss,
      gainLossPercentage,
      totalDividends,
      totalDivested,
      taxOnGains,
      investmentCount: investments.length
    });
  } catch (error) {
    console.error('Get portfolio summary error:', error);
    res.status(500).json({ error: 'Server error getting portfolio summary' });
  }
});

module.exports = router;
