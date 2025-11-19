const express = require('express');
const router = express.Router();
const Experiment = require('../models/Experiment');

// Get all experiments
router.get('/', async (req, res) => {
  try {
    const { status, type } = req.query;
    let query = {};

    if (status) query.status = status;
    if (type) query.type = type;

    const experiments = await Experiment.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      experiments
    });

  } catch (error) {
    console.error('Error fetching experiments:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a specific experiment
router.get('/:id', async (req, res) => {
  try {
    const experiment = await Experiment.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!experiment) {
      return res.status(404).json({ message: 'Experiment not found' });
    }

    res.json({
      success: true,
      experiment
    });

  } catch (error) {
    console.error('Error fetching experiment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new experiment
router.post('/', async (req, res) => {
  try {
    const {
      name,
      description,
      type,
      targetAudience,
      customAudienceRules,
      variants,
      controlVariantIndex,
      startDate,
      endDate,
      minimumSampleSize,
      confidenceLevel,
      tags,
      notes
    } = req.body;

    // Validate variants
    if (!variants || variants.length < 1) {
      return res.status(400).json({ message: 'At least one variant is required' });
    }

    // Validate traffic distribution
    const totalTraffic = variants.reduce((sum, v) => sum + v.trafficPercentage, 0);
    if (Math.abs(totalTraffic - 100) > 0.01) {
      return res.status(400).json({ message: 'Traffic percentages must sum to 100%' });
    }

    const experiment = new Experiment({
      name,
      description,
      type,
      targetAudience,
      customAudienceRules,
      variants,
      controlVariantIndex: controlVariantIndex || 0,
      startDate,
      endDate,
      minimumSampleSize,
      confidenceLevel,
      tags,
      notes,
      createdBy: req.user?.id // Assuming auth middleware sets req.user
    });

    await experiment.save();

    res.status(201).json({
      success: true,
      experiment
    });

  } catch (error) {
    console.error('Error creating experiment:', error);
    if (error.code === 11000) {
      res.status(400).json({ message: 'Experiment name already exists' });
    } else {
      res.status(500).json({ message: 'Server error' });
    }
  }
});

// Update an experiment
router.put('/:id', async (req, res) => {
  try {
    const experiment = await Experiment.findById(req.params.id);

    if (!experiment) {
      return res.status(404).json({ message: 'Experiment not found' });
    }

    // Prevent updates to running experiments (except status changes)
    if (experiment.status === 'running' && req.body.status !== 'paused' && req.body.status !== 'completed') {
      return res.status(400).json({ message: 'Cannot modify a running experiment' });
    }

    const updateFields = [
      'description', 'targetAudience', 'customAudienceRules',
      'startDate', 'endDate', 'minimumSampleSize', 'confidenceLevel',
      'tags', 'notes', 'status'
    ];

    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        experiment[field] = req.body[field];
      }
    });

    // Handle variant updates (only for non-running experiments)
    if (req.body.variants && experiment.status !== 'running') {
      const totalTraffic = req.body.variants.reduce((sum, v) => sum + v.trafficPercentage, 0);
      if (Math.abs(totalTraffic - 100) > 0.01) {
        return res.status(400).json({ message: 'Traffic percentages must sum to 100%' });
      }
      experiment.variants = req.body.variants;
    }

    await experiment.save();

    res.json({
      success: true,
      experiment
    });

  } catch (error) {
    console.error('Error updating experiment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete an experiment
router.delete('/:id', async (req, res) => {
  try {
    const experiment = await Experiment.findById(req.params.id);

    if (!experiment) {
      return res.status(404).json({ message: 'Experiment not found' });
    }

    // Only allow deletion of draft experiments
    if (experiment.status !== 'draft') {
      return res.status(400).json({ message: 'Can only delete draft experiments' });
    }

    await Experiment.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Experiment deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting experiment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get variant for a user (public endpoint for client-side experimentation)
router.get('/:experimentName/variant', async (req, res) => {
  try {
    const { experimentName } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const variant = await Experiment.getExperimentForUser(experimentName, userId);

    if (!variant) {
      return res.json({
        success: true,
        variant: null,
        reason: 'No active experiment found'
      });
    }

    // Record impression
    try {
      await Experiment.findOneAndUpdate(
        { name: experimentName, 'variants.name': variant.name },
        { $inc: { 'variants.$.impressions': 1, totalImpressions: 1 } }
      );
    } catch (impressionError) {
      console.error('Error recording impression:', impressionError);
    }

    res.json({
      success: true,
      variant: {
        name: variant.name,
        config: variant.config
      }
    });

  } catch (error) {
    console.error('Error getting variant:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Record conversion for an experiment
router.post('/:experimentName/conversion', async (req, res) => {
  try {
    const { experimentName } = req.params;
    const { userId, variantName, revenue = 0, customMetrics = {} } = req.body;

    if (!userId || !variantName) {
      return res.status(400).json({ message: 'User ID and variant name are required' });
    }

    const experiment = await Experiment.findOne({ name: experimentName });

    if (!experiment || !experiment.isActive()) {
      return res.status(404).json({ message: 'Active experiment not found' });
    }

    await experiment.recordConversion(variantName, revenue, customMetrics);

    res.json({
      success: true,
      message: 'Conversion recorded successfully'
    });

  } catch (error) {
    console.error('Error recording conversion:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Calculate statistical significance for an experiment
router.post('/:id/calculate-significance', async (req, res) => {
  try {
    const experiment = await Experiment.findById(req.params.id);

    if (!experiment) {
      return res.status(404).json({ message: 'Experiment not found' });
    }

    const hasSignificance = experiment.calculateStatisticalSignificance();
    await experiment.save();

    res.json({
      success: true,
      statisticalSignificance: experiment.statisticalSignificance,
      winnerVariant: experiment.winnerVariant,
      improvementPercentage: experiment.improvementPercentage,
      hasSignificance
    });

  } catch (error) {
    console.error('Error calculating significance:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get experiment results
router.get('/:id/results', async (req, res) => {
  try {
    const experiment = await Experiment.findById(req.params.id);

    if (!experiment) {
      return res.status(404).json({ message: 'Experiment not found' });
    }

    const results = {
      experiment: {
        name: experiment.name,
        status: experiment.status,
        totalImpressions: experiment.totalImpressions,
        totalConversions: experiment.totalConversions,
        conversionRate: experiment.conversionRate
      },
      variants: experiment.variants.map(variant => ({
        name: variant.name,
        trafficPercentage: variant.trafficPercentage,
        impressions: variant.impressions,
        conversions: variant.conversions,
        conversionRate: variant.impressions > 0 ? variant.conversions / variant.impressions : 0,
        revenue: variant.revenue,
        customMetrics: Object.fromEntries(variant.customMetrics)
      })),
      statisticalSignificance: experiment.statisticalSignificance,
      winnerVariant: experiment.winnerVariant,
      improvementPercentage: experiment.improvementPercentage
    };

    res.json({
      success: true,
      results
    });

  } catch (error) {
    console.error('Error getting experiment results:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get active experiments for a user
router.get('/active/for-user', async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const activeExperiments = await Experiment.getActiveExperiments();

    const userExperiments = [];
    for (const experiment of activeExperiments) {
      const variant = experiment.getVariantForUser(userId);
      userExperiments.push({
        experimentName: experiment.name,
        variant: variant.name,
        config: variant.config
      });
    }

    res.json({
      success: true,
      experiments: userExperiments
    });

  } catch (error) {
    console.error('Error getting active experiments:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;