const mongoose = require('mongoose');

const BrandingSchema = new mongoose.Schema({
  logo: {
    type: String, // URL to logo image
    default: ''
  },
  primaryColor: {
    type: String, // Hex color code
    default: '#007bff'
  },
  secondaryColor: {
    type: String,
    default: '#6c757d'
  },
  fontFamily: {
    type: String,
    default: 'Inter, sans-serif'
  },
  customCSS: {
    type: String,
    default: ''
  },
  favicon: {
    type: String,
    default: ''
  }
});

const SubscriptionSchema = new mongoose.Schema({
  plan: {
    type: String,
    enum: ['free', 'starter', 'professional', 'enterprise'],
    default: 'free'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'cancelled'],
    default: 'active'
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: Date,
  features: {
    maxUsers: {
      type: Number,
      default: 10
    },
    maxExperiences: {
      type: Number,
      default: 50
    },
    apiCallsPerMonth: {
      type: Number,
      default: 10000
    },
    customDomain: {
      type: Boolean,
      default: false
    },
    whiteLabel: {
      type: Boolean,
      default: false
    },
    advancedAnalytics: {
      type: Boolean,
      default: false
    },
    prioritySupport: {
      type: Boolean,
      default: false
    }
  },
  billing: {
    stripeCustomerId: String,
    paymentMethod: String,
    lastPaymentDate: Date,
    nextBillingDate: Date
  }
});

const OrganizationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Contact information
  contact: {
    email: {
      type: String,
      required: true
    },
    phone: String,
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    }
  },
  // Branding
  branding: BrandingSchema,
  // Subscription
  subscription: SubscriptionSchema,
  // Settings
  settings: {
    timezone: {
      type: String,
      default: 'UTC'
    },
    currency: {
      type: String,
      default: 'USD'
    },
    language: {
      type: String,
      default: 'en'
    },
    allowPublicBookings: {
      type: Boolean,
      default: true
    },
    requireApproval: {
      type: Boolean,
      default: false
    },
    autoConfirmBookings: {
      type: Boolean,
      default: true
    },
    notificationSettings: {
      emailEnabled: { type: Boolean, default: true },
      smsEnabled: { type: Boolean, default: false },
      pushEnabled: { type: Boolean, default: true }
    }
  },
  // Domain configuration
  domain: {
    customDomain: String,
    isVerified: {
      type: Boolean,
      default: false
    },
    verificationToken: String,
    sslCertificate: {
      type: Boolean,
      default: false
    }
  },
  // API usage tracking
  apiUsage: {
    currentMonth: {
      calls: { type: Number, default: 0 },
      lastReset: { type: Date, default: Date.now }
    },
    totalCalls: {
      type: Number,
      default: 0
    }
  },
  // Metadata
  isActive: {
    type: Boolean,
    default: true
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes
OrganizationSchema.index({ owner: 1 });
OrganizationSchema.index({ 'subscription.status': 1 });
OrganizationSchema.index({ isActive: 1 });

// Virtual for checking subscription limits
OrganizationSchema.virtual('canAddUsers').get(function() {
  const currentUsers = this.members?.length || 0;
  return currentUsers < this.subscription.features.maxUsers;
});

OrganizationSchema.virtual('canAddExperiences').get(function() {
  const currentExperiences = this.experiences?.length || 0;
  return currentExperiences < this.subscription.features.maxExperiences;
});

// Methods
OrganizationSchema.methods.checkApiLimit = function() {
  const now = new Date();
  const currentMonth = now.getMonth();
  const lastResetMonth = this.apiUsage.currentMonth.lastReset.getMonth();

  // Reset counter if it's a new month
  if (currentMonth !== lastResetMonth) {
    this.apiUsage.currentMonth.calls = 0;
    this.apiUsage.currentMonth.lastReset = now;
  }

  return this.apiUsage.currentMonth.calls < this.subscription.features.apiCallsPerMonth;
};

OrganizationSchema.methods.incrementApiUsage = function() {
  this.apiUsage.currentMonth.calls++;
  this.apiUsage.totalCalls++;
  return this.save();
};

OrganizationSchema.methods.getBrandingConfig = function() {
  return {
    ...this.branding.toObject(),
    organizationName: this.name,
    organizationSlug: this.slug
  };
};

// Static methods
OrganizationSchema.statics.findBySlug = function(slug) {
  return this.findOne({ slug, isActive: true });
};

OrganizationSchema.statics.getActiveOrganizations = function() {
  return this.find({
    isActive: true,
    'subscription.status': 'active'
  });
};

module.exports = mongoose.model('Organization', OrganizationSchema);