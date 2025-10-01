const express = require('express');
const { body, validationResult } = require('express-validator');
const Divestment = require('../models/Divestment');
const Investment = require('../models/Investment');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all divestments for user
router.get('/', auth, async (req, res) => {
  try {
    const divestments = await Divestment.find({ userId: req.userId })
      .populate('investmentId', 'name')
      .sort({ date: -1 });
    
    res.json(divestments);
  } catch (error) {
    console.error('Get divestments error:', error);
    res.status(500).json({ error: 'Server error getting divestments' });
  }
});

// Get divestments for specific investment
router.get('/investment/:investmentId', auth, async (req, res) => {
  try {
    const divestments = await Divestment.find({ 
      userId: req.userId,
      investmentId: req.params.investmentId
    }).sort({ date: -1 });
    
    res.json(divestments);
  } catch (error) {
    console.error('Get investment divestments error:', error);
    res.status(500).json({ error: 'Server error getting investment divestments' });
  }
});

// Create new divestment
router.post('/', auth, [
  body('investmentId').isMongoId(),
  body('date').isISO8601(),
  body('amount').isFloat({ min: 0 }),
  body('reason').isLength({ min: 1 }).trim().escape(),
  body('notes').optional().trim().escape()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Verify investment exists and belongs to user
    const investment = await Investment.findOne({
      _id: req.body.investmentId,
      userId: req.userId
    });

    if (!investment) {
      return res.status(404).json({ error: 'Investment not found' });
    }

    const divestmentData = {
      ...req.body,
      userId: req.userId,
      investmentName: investment.name
    };

    const divestment = new Divestment(divestmentData);
    await divestment.save();

    res.status(201).json({
      message: 'Divestment created successfully',
      divestment
    });
  } catch (error) {
    console.error('Create divestment error:', error);
    res.status(500).json({ error: 'Server error creating divestment' });
  }
});

// Update divestment
router.put('/:id', auth, [
  body('date').optional().isISO8601(),
  body('amount').optional().isFloat({ min: 0 }),
  body('reason').optional().isLength({ min: 1 }).trim().escape(),
  body('notes').optional().trim().escape()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const divestment = await Divestment.findOne({ 
      _id: req.params.id, 
      userId: req.userId 
    });
    
    if (!divestment) {
      return res.status(404).json({ error: 'Divestment not found' });
    }

    // Update fields
    Object.keys(req.body).forEach(key => {
      if (key !== 'userId' && key !== 'investmentId') {
        divestment[key] = req.body[key];
      }
    });

    await divestment.save();

    res.json({
      message: 'Divestment updated successfully',
      divestment
    });
  } catch (error) {
    console.error('Update divestment error:', error);
    res.status(500).json({ error: 'Server error updating divestment' });
  }
});

// Delete divestment
router.delete('/:id', auth, async (req, res) => {
  try {
    const divestment = await Divestment.findOne({ 
      _id: req.params.id, 
      userId: req.userId 
    });
    
    if (!divestment) {
      return res.status(404).json({ error: 'Divestment not found' });
    }

    await Divestment.findByIdAndDelete(req.params.id);

    res.json({ message: 'Divestment deleted successfully' });
  } catch (error) {
    console.error('Delete divestment error:', error);
    res.status(500).json({ error: 'Server error deleting divestment' });
  }
});

// Get divestment statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const divestments = await Divestment.find({ userId: req.userId });
    
    const totalAmount = divestments.reduce((sum, div) => sum + div.amount, 0);
    
    // Group by investment
    const byInvestment = divestments.reduce((acc, div) => {
      if (!acc[div.investmentName]) {
        acc[div.investmentName] = {
          count: 0,
          totalAmount: 0
        };
      }
      acc[div.investmentName].count++;
      acc[div.investmentName].totalAmount += div.amount;
      return acc;
    }, {});

    // Group by reason
    const byReason = divestments.reduce((acc, div) => {
      if (!acc[div.reason]) {
        acc[div.reason] = {
          count: 0,
          totalAmount: 0
        };
      }
      acc[div.reason].count++;
      acc[div.reason].totalAmount += div.amount;
      return acc;
    }, {});

    // Group by year
    const byYear = divestments.reduce((acc, div) => {
      const year = new Date(div.date).getFullYear();
      if (!acc[year]) {
        acc[year] = {
          count: 0,
          totalAmount: 0
        };
      }
      acc[year].count++;
      acc[year].totalAmount += div.amount;
      return acc;
    }, {});

    res.json({
      total: {
        count: divestments.length,
        totalAmount
      },
      byInvestment,
      byReason,
      byYear
    });
  } catch (error) {
    console.error('Get divestment stats error:', error);
    res.status(500).json({ error: 'Server error getting divestment statistics' });
  }
});

module.exports = router;
