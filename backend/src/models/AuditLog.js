const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  // Who performed the action
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    index: true
  },

  // What action was performed
  action: {
    type: String,
    required: true,
    enum: [
      // Authentication
      'login', 'logout', 'login_failed', 'password_change', 'password_reset',

      // User management
      'user_created', 'user_updated', 'user_deleted', 'user_suspended', 'user_activated',

      // Organization management
      'organization_created', 'organization_updated', 'organization_deleted',
      'member_added', 'member_removed', 'member_role_changed',

      // Experience management
      'experience_created', 'experience_updated', 'experience_deleted', 'experience_published',

      // Booking management
      'booking_created', 'booking_updated', 'booking_cancelled', 'booking_completed',

      // Payment
      'payment_processed', 'payment_failed', 'refund_processed',

      // Security
      'suspicious_activity', 'rate_limit_exceeded', 'permission_denied',

      // GDPR
      'data_export_requested', 'data_deletion_requested', 'consent_updated',

      // System
      'api_called', 'error_occurred', 'system_config_changed'
    ],
    index: true
  },

  // Resource affected
  resource: {
    type: String,
    enum: ['user', 'organization', 'experience', 'booking', 'payment', 'system'],
    index: true
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    index: true
  },

  // Details of the action
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },

  // Context information
  context: {
    ipAddress: String,
    userAgent: String,
    sessionId: String,
    apiEndpoint: String,
    method: String,
    statusCode: Number,
    duration: Number, // in milliseconds
    location: {
      country: String,
      city: String,
      coordinates: {
        latitude: Number,
        longitude: Number
      }
    }
  },

  // Risk assessment
  risk: {
    level: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'low'
    },
    score: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    flags: [{
      type: String,
      enum: [
        'unusual_location',
        'unusual_time',
        'multiple_failed_attempts',
        'suspicious_ip',
        'admin_action',
        'sensitive_data_access'
      ]
    }]
  },

  // Compliance tracking
  compliance: {
    gdpr: {
      personalDataAccessed: { type: Boolean, default: false },
      consentRequired: { type: Boolean, default: false },
      dataRetentionPeriod: Number // in days
    },
    soc2: {
      controlCategory: {
        type: String,
        enum: ['security', 'availability', 'processing_integrity', 'confidentiality', 'privacy']
      }
    }
  },

  // Metadata
    timestamp: {
      type: Date,
      default: Date.now
    },
  processed: {
    type: Boolean,
    default: false,
    index: true
  }
}, {
  timestamps: false // We use custom timestamp field
});

// Indexes for efficient querying
AuditLogSchema.index({ user: 1, timestamp: -1 });
AuditLogSchema.index({ organization: 1, timestamp: -1 });
AuditLogSchema.index({ action: 1, timestamp: -1 });
AuditLogSchema.index({ resource: 1, resourceId: 1, timestamp: -1 });
AuditLogSchema.index({ 'risk.level': 1, timestamp: -1 });
AuditLogSchema.index({ 'context.ipAddress': 1, timestamp: -1 });

// TTL index for automatic cleanup (retain logs for 7 years for compliance)
AuditLogSchema.index({ timestamp: 1 }, {
  expireAfterSeconds: 7 * 365 * 24 * 60 * 60
});

// Static methods
AuditLogSchema.statics.log = async function(data) {
  try {
    const logEntry = new this(data);

    // Assess risk level
    logEntry.assessRisk();

    // Set compliance flags
    logEntry.setComplianceFlags();

    await logEntry.save();
    return logEntry;
  } catch (error) {
    console.error('Error creating audit log:', error);
    // Don't throw error to avoid breaking the main flow
    return null;
  }
};

AuditLogSchema.statics.getUserActivity = function(userId, options = {}) {
  const {
    startDate,
    endDate,
    actions,
    limit = 100,
    skip = 0
  } = options;

  let query = { user: userId };

  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = startDate;
    if (endDate) query.timestamp.$lte = endDate;
  }

  if (actions && actions.length > 0) {
    query.action = { $in: actions };
  }

  return this.find(query)
    .sort({ timestamp: -1 })
    .limit(limit)
    .skip(skip)
    .populate('user', 'name email')
    .populate('organization', 'name');
};

AuditLogSchema.statics.getSecurityEvents = function(options = {}) {
  const {
    riskLevel,
    startDate,
    endDate,
    organizationId,
    limit = 100
  } = options;

  let query = {};

  if (riskLevel) {
    query['risk.level'] = riskLevel;
  } else {
    query['risk.level'] = { $in: ['high', 'critical'] };
  }

  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = startDate;
    if (endDate) query.timestamp.$lte = endDate;
  }

  if (organizationId) {
    query.organization = organizationId;
  }

  return this.find(query)
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate('user', 'name email')
    .populate('organization', 'name');
};

AuditLogSchema.statics.getComplianceReport = function(organizationId, reportType) {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 1); // Last 30 days

  let query = {
    organization: organizationId,
    timestamp: { $gte: startDate }
  };

  switch (reportType) {
    case 'gdpr':
      query['compliance.gdpr.personalDataAccessed'] = true;
      break;
    case 'security':
      query['risk.level'] = { $in: ['high', 'critical'] };
      break;
    case 'access':
      query.action = { $in: ['login', 'api_called'] };
      break;
    default:
      break;
  }

  return this.find(query)
    .sort({ timestamp: -1 })
    .populate('user', 'name email');
};

// Instance methods
AuditLogSchema.methods.assessRisk = function() {
  let score = 0;
  const flags = [];

  // Risk assessment based on action type
  const highRiskActions = [
    'user_deleted', 'organization_deleted', 'data_deletion_requested',
    'password_reset', 'payment_failed'
  ];

  const mediumRiskActions = [
    'user_suspended', 'member_role_changed', 'experience_deleted',
    'booking_cancelled', 'permission_denied'
  ];

  if (highRiskActions.includes(this.action)) {
    score += 70;
    flags.push('admin_action');
  } else if (mediumRiskActions.includes(this.action)) {
    score += 40;
  }

  // Risk based on context
  if (this.context) {
    // Unusual login times (between 2 AM and 6 AM)
    if (this.action === 'login') {
      const hour = new Date(this.timestamp).getHours();
      if (hour >= 2 && hour <= 6) {
        score += 20;
        flags.push('unusual_time');
      }
    }

    // Failed login attempts
    if (this.action === 'login_failed') {
      score += 30;
      flags.push('multiple_failed_attempts');
    }

    // Suspicious IP (this would need IP reputation service integration)
    // For now, just flag unusual patterns
  }

  // Determine risk level
  if (score >= 80) {
    this.risk.level = 'critical';
  } else if (score >= 60) {
    this.risk.level = 'high';
  } else if (score >= 30) {
    this.risk.level = 'medium';
  } else {
    this.risk.level = 'low';
  }

  this.risk.score = Math.min(score, 100);
  this.risk.flags = flags;
};

AuditLogSchema.methods.setComplianceFlags = function() {
  // GDPR compliance
  const gdprActions = [
    'user_created', 'user_updated', 'user_deleted',
    'data_export_requested', 'data_deletion_requested',
    'consent_updated'
  ];

  if (gdprActions.includes(this.action)) {
    this.compliance.gdpr.personalDataAccessed = true;
    this.compliance.gdpr.consentRequired = true;
    this.compliance.gdpr.dataRetentionPeriod = 2555; // 7 years in days
  }

  // SOC 2 compliance categories
  const soc2Mapping = {
    security: ['login', 'login_failed', 'password_change', 'user_suspended'],
    availability: ['system_config_changed', 'error_occurred'],
    processing_integrity: ['payment_processed', 'booking_created'],
    confidentiality: ['data_export_requested', 'user_updated'],
    privacy: ['consent_updated', 'data_deletion_requested']
  };

  for (const [category, actions] of Object.entries(soc2Mapping)) {
    if (actions.includes(this.action)) {
      this.compliance.soc2.controlCategory = category;
      break;
    }
  }
};

module.exports = mongoose.model('AuditLog', AuditLogSchema);