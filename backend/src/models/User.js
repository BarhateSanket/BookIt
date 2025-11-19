const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isAdmin: { type: Boolean, default: false },
  // Multi-tenancy fields
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    index: true
  },
  roles: [{
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true
    },
    role: {
      type: String,
      enum: ['owner', 'admin', 'manager', 'staff', 'viewer'],
      required: true
    },
    permissions: [{
      type: String,
      enum: [
        'manage_organization',
        'manage_users',
        'manage_experiences',
        'manage_bookings',
        'view_analytics',
        'manage_billing',
        'manage_integrations'
      ]
    }],
    assignedAt: { type: Date, default: Date.now }
  }],
  // Profile fields
  avatar: { type: String, default: '' },
  bio: { type: String, default: '' },
  phone: { type: String, default: '' },
  dateOfBirth: { type: Date },
  location: { type: String, default: '' },
  preferences: {
    notifications: { type: Boolean, default: true },
    newsletter: { type: Boolean, default: true },
    theme: { type: String, default: 'light' },
    language: { type: String, default: 'en' }
  },
  // Social features
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Experience' }],
  savedSearches: [{
    name: { type: String, required: true },
    filters: {
      search: String,
      category: String,
      priceMin: Number,
      priceMax: Number,
      rating: Number,
      duration: String,
      location: String,
      latitude: Number,
      longitude: Number,
      radius: Number // in km
    },
    createdAt: { type: Date, default: Date.now }
  }],
  // Security & Compliance
  security: {
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: String,
    lastLogin: Date,
    loginAttempts: { type: Number, default: 0 },
    lockedUntil: Date,
    passwordHistory: [{
      hash: String,
      changedAt: { type: Date, default: Date.now }
    }],
    trustedDevices: [{
      deviceId: String,
      deviceName: String,
      lastUsed: Date,
      ipAddress: String
    }]
  },
  // GDPR compliance
  consent: {
    marketingEmails: { type: Boolean, default: false },
    analyticsTracking: { type: Boolean, default: true },
    dataProcessing: { type: Boolean, default: true },
    consentDate: { type: Date, default: Date.now },
    consentVersion: { type: String, default: '1.0' }
  },
  // Account status
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'pending_verification'],
    default: 'active'
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

UserSchema.methods.comparePassword = function(candidate) {
  return bcrypt.compare(candidate, this.password);
};

// RBAC Methods
UserSchema.methods.hasRole = function(organizationId, role) {
  const orgRole = this.roles.find(r =>
    r.organization.toString() === organizationId.toString()
  );
  return orgRole && orgRole.role === role;
};

UserSchema.methods.hasPermission = function(organizationId, permission) {
  const orgRole = this.roles.find(r =>
    r.organization.toString() === organizationId.toString()
  );
  return orgRole && orgRole.permissions.includes(permission);
};

UserSchema.methods.getRoleForOrganization = function(organizationId) {
  const orgRole = this.roles.find(r =>
    r.organization.toString() === organizationId.toString()
  );
  return orgRole ? orgRole.role : null;
};

UserSchema.methods.canAccessOrganization = function(organizationId) {
  return this.roles.some(r =>
    r.organization.toString() === organizationId.toString()
  );
};

// Security Methods
UserSchema.methods.isLocked = function() {
  return this.security.lockedUntil && this.security.lockedUntil > Date.now();
};

UserSchema.methods.recordLoginAttempt = function(success = false, ipAddress = '') {
  if (success) {
    this.security.lastLogin = new Date();
    this.security.loginAttempts = 0;
    this.security.lockedUntil = undefined;

    // Record trusted device
    if (ipAddress) {
      const existingDevice = this.security.trustedDevices.find(d => d.ipAddress === ipAddress);
      if (existingDevice) {
        existingDevice.lastUsed = new Date();
      } else {
        this.security.trustedDevices.push({
          deviceId: `device_${Date.now()}`,
          deviceName: 'Unknown Device',
          lastUsed: new Date(),
          ipAddress
        });
      }
    }
  } else {
    this.security.loginAttempts++;
    if (this.security.loginAttempts >= 5) {
      this.security.lockedUntil = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours
    }
  }
  return this.save();
};

// GDPR Methods
UserSchema.methods.requestDataDeletion = function() {
  // Mark for deletion but don't actually delete yet
  this.status = 'pending_deletion';
  this.consent.dataProcessing = false;
  return this.save();
};

UserSchema.methods.exportPersonalData = function() {
  return {
    personalInfo: {
      name: this.name,
      email: this.email,
      phone: this.phone,
      dateOfBirth: this.dateOfBirth,
      location: this.location,
      avatar: this.avatar,
      bio: this.bio
    },
    preferences: this.preferences,
    consent: this.consent,
    security: {
      twoFactorEnabled: this.security.twoFactorEnabled,
      lastLogin: this.security.lastLogin,
      trustedDevices: this.security.trustedDevices.map(d => ({
        deviceName: d.deviceName,
        lastUsed: d.lastUsed
      }))
    },
    activity: {
      favoritesCount: this.favorites.length,
      savedSearchesCount: this.savedSearches.length,
      createdAt: this.createdAt,
      lastUpdated: this.updatedAt
    }
  };
};

module.exports = mongoose.model('User', UserSchema);
