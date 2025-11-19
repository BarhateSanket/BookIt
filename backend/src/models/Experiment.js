const mongoose = require('mongoose');

const VariantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
  trafficPercentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  config: {
    type: mongoose.Schema.Types.Mixed, // Flexible configuration object
    default: {}
  },
  // Metrics tracking
  impressions: {
    type: Number,
    default: 0
  },
  conversions: {
    type: Number,
    default: 0
  },
  revenue: {
    type: Number,
    default: 0
  },
  customMetrics: {
    type: Map,
    of: Number,
    default: {}
  }
});

const ExperimentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['feature_flag', 'ab_test', 'multivariate'],
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'running', 'paused', 'completed', 'cancelled'],
    default: 'draft'
  },
  targetAudience: {
    type: String,
    enum: ['all_users', 'new_users', 'returning_users', 'premium_users', 'custom'],
    default: 'all_users'
  },
  customAudienceRules: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  variants: [VariantSchema],
  // Control variant (usually the first variant)
  controlVariantIndex: {
    type: Number,
    default: 0
  },
  // Experiment settings
  startDate: Date,
  endDate: Date,
  minimumSampleSize: {
    type: Number,
    default: 1000
  },
  confidenceLevel: {
    type: Number,
    default: 95,
    min: 80,
    max: 99.9
  },
  // Statistical results
  statisticalSignificance: {
    type: Boolean,
    default: false
  },
  winnerVariant: String,
  improvementPercentage: Number,
  // Tracking
  totalImpressions: {
    type: Number,
    default: 0
  },
  totalConversions: {
    type: Number,
    default: 0
  },
  conversionRate: {
    type: Number,
    default: 0
  },
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  tags: [String],
  notes: String
}, {
  timestamps: true
});

// Indexes for performance
ExperimentSchema.index({ status: 1, type: 1 });
ExperimentSchema.index({ 'variants.name': 1 });

// Instance methods
ExperimentSchema.methods.isActive = function() {
  const now = new Date();
  return this.status === 'running' &&
         (!this.startDate || this.startDate <= now) &&
         (!this.endDate || this.endDate >= now);
};

ExperimentSchema.methods.getVariantForUser = function(userId) {
  // Simple hash-based distribution for consistency
  const hash = this.simpleHash(userId + this._id.toString());
  const randomValue = (hash % 100) / 100;

  let cumulativePercentage = 0;
  for (const variant of this.variants) {
    cumulativePercentage += variant.trafficPercentage / 100;
    if (randomValue <= cumulativePercentage) {
      return variant;
    }
  }

  // Fallback to first variant
  return this.variants[0];
};

ExperimentSchema.methods.recordImpression = function(variantName) {
  const variant = this.variants.find(v => v.name === variantName);
  if (variant) {
    variant.impressions++;
    this.totalImpressions++;
    return this.save();
  }
  return Promise.reject(new Error('Variant not found'));
};

ExperimentSchema.methods.recordConversion = function(variantName, revenue = 0, customMetrics = {}) {
  const variant = this.variants.find(v => v.name === variantName);
  if (variant) {
    variant.conversions++;
    variant.revenue += revenue;
    this.totalConversions++;

    // Update custom metrics
    for (const [key, value] of Object.entries(customMetrics)) {
      variant.customMetrics.set(key, (variant.customMetrics.get(key) || 0) + value);
    }

    this.conversionRate = this.totalConversions / this.totalImpressions;
    return this.save();
  }
  return Promise.reject(new Error('Variant not found'));
};

ExperimentSchema.methods.calculateStatisticalSignificance = function() {
  if (this.variants.length < 2) return false;

  const control = this.variants[this.controlVariantIndex];
  if (!control || control.impressions < this.minimumSampleSize) return false;

  // Simple statistical significance test (Chi-square for proportions)
  for (let i = 0; i < this.variants.length; i++) {
    if (i === this.controlVariantIndex) continue;

    const variant = this.variants[i];
    if (variant.impressions < this.minimumSampleSize) continue;

    const significance = this.calculateChiSquareSignificance(control, variant);
    if (significance >= this.confidenceLevel / 100) {
      this.statisticalSignificance = true;
      this.winnerVariant = variant.name;
      this.improvementPercentage = ((variant.conversions / variant.impressions) - (control.conversions / control.impressions)) * 100;
      return true;
    }
  }

  return false;
};

// Simple hash function for consistent user distribution
ExperimentSchema.methods.simpleHash = function(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
};

// Chi-square test for statistical significance
ExperimentSchema.methods.calculateChiSquareSignificance = function(control, variant) {
  const totalImpressions = control.impressions + variant.impressions;
  const totalConversions = control.conversions + variant.conversions;

  if (totalImpressions === 0 || totalConversions === 0) return 0;

  // Expected values
  const expectedControlConversions = (control.impressions / totalImpressions) * totalConversions;
  const expectedVariantConversions = (variant.impressions / totalImpressions) * totalConversions;

  // Chi-square calculation
  const chiSquare = Math.pow(control.conversions - expectedControlConversions, 2) / expectedControlConversions +
                   Math.pow(variant.conversions - expectedVariantConversions, 2) / expectedVariantConversions;

  // For 1 degree of freedom, chi-square value of 3.84 corresponds to p < 0.05 (95% confidence)
  // We'll use a simplified approach
  const criticalValue = 3.84; // 95% confidence
  return chiSquare > criticalValue ? 95 : 0;
};

// Static methods
ExperimentSchema.statics.getActiveExperiments = function(userId = null) {
  const query = { status: 'running' };
  const now = new Date();

  query.$or = [
    { startDate: { $lte: now }, endDate: { $gte: now } },
    { startDate: null, endDate: { $gte: now } },
    { startDate: { $lte: now }, endDate: null },
    { startDate: null, endDate: null }
  ];

  return this.find(query);
};

ExperimentSchema.statics.getExperimentForUser = function(experimentName, userId) {
  return this.findOne({ name: experimentName })
    .then(experiment => {
      if (!experiment || !experiment.isActive()) return null;
      return experiment.getVariantForUser(userId);
    });
};

module.exports = mongoose.model('Experiment', ExperimentSchema);