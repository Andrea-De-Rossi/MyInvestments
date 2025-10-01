const express = require('express');
const { body, validationResult } = require('express-validator');
const Dividend = require('../models/Dividend');
const Investment = require('../models/Investment');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all dividends for user
router.get('/', auth, async (req, res) => {
  try {
    const dividends = await Dividend.find({ userId: req.userId })
      .populate('investmentId', 'name')
      .sort({ date: -1 });
    
    res.json(dividends);
  } catch (error) {
    console.error('Get dividends error:', error);
    res.status(500).json({ error: 'Server error getting dividends' });
  }
});

// Get dividends for specific investment
router.get('/investment/:investmentId', auth, async (req, res) => {
  try {
    const dividends = await Dividend.find({ 
      userId: req.userId,
      investmentId: req.params.investmentId
    }).sort({ date: -1 });
    
    res.json(dividends);
  } catch (error) {
    console.error('Get investment dividends error:', error);
    res.status(500).json({ error: 'Server error getting investment dividends' });
  }
});

// Create new dividend
router.post('/', auth, [
  body('investmentId').isMongoId(),
  body('date').isISO8601(),
  body('grossAmount').isFloat({ min: 0 }),
  body('taxesWithheld').optional().isFloat({ min: 0 }),
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

    const dividendData = {
      ...req.body,
      userId: req.userId,
      investmentName: investment.name,
      taxesWithheld: req.body.taxesWithheld || 0
    };

    const dividend = new Dividend(dividendData);
    await dividend.save();

    res.status(201).json({
      message: 'Dividend created successfully',
      dividend
    });
  } catch (error) {
    console.error('Create dividend error:', error);
    res.status(500).json({ error: 'Server error creating dividend' });
  }
});

// Update dividend
router.put('/:id', auth, [
  body('date').optional().isISO8601(),
  body('grossAmount').optional().isFloat({ min: 0 }),
  body('taxesWithheld').optional().isFloat({ min: 0 }),
  body('notes').optional().trim().escape()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const dividend = await Dividend.findOne({ 
      _id: req.params.id, 
      userId: req.userId 
    });
    
    if (!dividend) {
      return res.status(404).json({ error: 'Dividend not found' });
    }

    // Update fields
    Object.keys(req.body).forEach(key => {
      if (key !== 'userId' && key !== 'investmentId') {
        dividend[key] = req.body[key];
      }
    });

    await dividend.save();

    res.json({
      message: 'Dividend updated successfully',
      dividend
    });
  } catch (error) {
    console.error('Update dividend error:', error);
    res.status(500).json({ error: 'Server error updating dividend' });
  }
});

// Delete dividend
router.delete('/:id', auth, async (req, res) => {
  try {
    const dividend = await Dividend.findOne({ 
      _id: req.params.id, 
      userId: req.userId 
    });
    
    if (!dividend) {
      return res.status(404).json({ error: 'Dividend not found' });
    }

    await Dividend.findByIdAndDelete(req.params.id);

    res.json({ message: 'Dividend deleted successfully' });
  } catch (error) {
    console.error('Delete dividend error:', error);
    res.status(500).json({ error: 'Server error deleting dividend' });
  }
});

// Get dividend statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const dividends = await Dividend.find({ userId: req.userId });
    
    const totalGross = dividends.reduce((sum, div) => sum + div.grossAmount, 0);
    const totalTaxes = dividends.reduce((sum, div) => sum + div.taxesWithheld, 0);
    const totalNet = dividends.reduce((sum, div) => sum + div.netAmount, 0);
    
    // Group by investment
    const byInvestment = dividends.reduce((acc, div) => {
      if (!acc[div.investmentName]) {
        acc[div.investmentName] = {
          count: 0,
          totalGross: 0,
          totalNet: 0,
          totalTaxes: 0
        };
      }
      acc[div.investmentName].count++;
      acc[div.investmentName].totalGross += div.grossAmount;
      acc[div.investmentName].totalNet += div.netAmount;
      acc[div.investmentName].totalTaxes += div.taxesWithheld;
      return acc;
    }, {});

    // Group by year
    const byYear = dividends.reduce((acc, div) => {
      const year = new Date(div.date).getFullYear();
      if (!acc[year]) {
        acc[year] = {
          count: 0,
          totalGross: 0,
          totalNet: 0,
          totalTaxes: 0
        };
      }
      acc[year].count++;
      acc[year].totalGross += div.grossAmount;
      acc[year].totalNet += div.netAmount;
      acc[year].totalTaxes += div.taxesWithheld;
      return acc;
    }, {});

    res.json({
      total: {
        count: dividends.length,
        totalGross,
        totalNet,
        totalTaxes
      },
      byInvestment,
      byYear
    });
  } catch (error) {
    console.error('Get dividend stats error:', error);
    res.status(500).json({ error: 'Server error getting dividend statistics' });
  }
});

module.exports = router;
