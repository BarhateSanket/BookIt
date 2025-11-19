const express = require('express');
const router = express.Router();
const Experience = require('../models/Experience');
const dynamicPricingEngine = require('../utils/dynamicPricing');

// Get dynamic price for a specific slot
router.get('/calculate/:experienceId/:slotDate/:slotTime', async (req, res) => {
  try {
    const { experienceId, slotDate, slotTime } = req.params;

    const experience = await Experience.findById(experienceId);
    if (!experience) {
      return res.status(404).json({ message: 'Experience not found' });
    }

    const pricing = await dynamicPricingEngine.calculateDynamicPrice(
      experienceId,
      slotDate,
      slotTime,
      experience.price
    );

    res.json({
      success: true,
      pricing: {
        experienceId,
        slotDate,
        slotTime,
        ...pricing
      }
    });

  } catch (error) {
    console.error('Error calculating dynamic price:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get pricing rules
router.get('/rules', (req, res) => {
  try {
    const rules = dynamicPricingEngine.getPricingRules();
    res.json({
      success: true,
      rules
    });
  } catch (error) {
    console.error('Error getting pricing rules:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Apply bulk pricing updates (admin only)
router.post('/update-bulk', async (req, res) => {
  try {
    const result = await dynamicPricingEngine.applyBulkPricingUpdates();
    res.json({
      success: result.success,
      message: result.success
        ? `Updated pricing for ${result.updatedCount} experiences`
        : 'Failed to update pricing',
      ...result
    });
  } catch (error) {
    console.error('Error updating bulk pricing:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get pricing analytics
router.get('/analytics', async (req, res) => {
  try {
    const experiences = await Experience.find({ isActive: true });

    let totalSlots = 0;
    let dynamicSlots = 0;
    let totalPriceIncrease = 0;
    let totalPriceDecrease = 0;

    experiences.forEach(exp => {
      exp.slots.forEach(slot => {
        totalSlots++;
        if (slot.dynamicPrice) {
          dynamicSlots++;
          const priceDiff = slot.dynamicPrice - exp.price;
          if (priceDiff > 0) {
            totalPriceIncrease += priceDiff;
          } else {
            totalPriceDecrease += Math.abs(priceDiff);
          }
        }
      });
    });

    const analytics = {
      totalSlots,
      dynamicSlots,
      coverage: totalSlots > 0 ? (dynamicSlots / totalSlots * 100).toFixed(1) : 0,
      averagePriceIncrease: dynamicSlots > 0 ? (totalPriceIncrease / dynamicSlots).toFixed(2) : 0,
      averagePriceDecrease: dynamicSlots > 0 ? (totalPriceDecrease / dynamicSlots).toFixed(2) : 0,
      totalRevenueImpact: (totalPriceIncrease - totalPriceDecrease).toFixed(2)
    };

    res.json({
      success: true,
      analytics
    });

  } catch (error) {
    console.error('Error getting pricing analytics:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update pricing for a specific experience
router.post('/update/:experienceId', async (req, res) => {
  try {
    const { experienceId } = req.params;

    const experience = await Experience.findById(experienceId);
    if (!experience) {
      return res.status(404).json({ message: 'Experience not found' });
    }

    // Update pricing for all slots
    for (const slot of experience.slots) {
      const pricing = await dynamicPricingEngine.calculateDynamicPrice(
        experienceId,
        slot.date,
        slot.time,
        experience.price
      );

      slot.dynamicPrice = pricing.dynamicPrice;
      slot.pricingFactors = pricing.appliedMultipliers;
      slot.lastPriceUpdate = new Date();
    }

    await experience.save();

    res.json({
      success: true,
      message: 'Pricing updated successfully',
      slotsUpdated: experience.slots.length
    });

  } catch (error) {
    console.error('Error updating experience pricing:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;