const express = require('express');
const router = express.Router();
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const securityManager = require('../utils/security');

// Middleware to check admin access
const requireAdmin = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const user = await User.findById(userId);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    next();
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GDPR Compliance Routes
router.get('/gdpr/data-export', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const exportData = await securityManager.exportUserData(userId);

    if (!exportData) {
      return res.status(404).json({ message: 'User data not found' });
    }

    // Log the export request
    await AuditLog.log({
      user: userId,
      action: 'data_export_requested',
      resource: 'user',
      resourceId: userId,
      details: { exportType: 'gdpr' },
      compliance: {
        gdpr: {
          personalDataAccessed: true,
          consentRequired: true
        }
      }
    });

    res.json({
      success: true,
      data: exportData,
      exportedAt: new Date(),
      format: 'JSON'
    });

  } catch (error) {
    console.error('Error exporting user data:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/gdpr/data-deletion', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const result = await securityManager.handleDataDeletion(userId);

    res.json({
      success: result.success,
      message: result.message,
      requestedAt: new Date()
    });

  } catch (error) {
    console.error('Error processing data deletion:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/gdpr/consent', async (req, res) => {
  try {
    const userId = req.user?.id;
    const { marketingEmails, analyticsTracking, dataProcessing } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.consent = {
      ...user.consent,
      marketingEmails: marketingEmails ?? user.consent.marketingEmails,
      analyticsTracking: analyticsTracking ?? user.consent.analyticsTracking,
      dataProcessing: dataProcessing ?? user.consent.dataProcessing,
      consentDate: new Date(),
      consentVersion: '1.1'
    };

    await user.save();

    // Log consent update
    await AuditLog.log({
      user: userId,
      action: 'consent_updated',
      resource: 'user',
      resourceId: userId,
      details: { consent: user.consent },
      compliance: {
        gdpr: {
          personalDataAccessed: true,
          consentRequired: true
        }
      }
    });

    res.json({
      success: true,
      consent: user.consent
    });

  } catch (error) {
    console.error('Error updating consent:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Security Monitoring Routes (Admin only)
router.get('/audit-logs', requireAdmin, async (req, res) => {
  try {
    const {
      userId,
      organizationId,
      action,
      resource,
      riskLevel,
      startDate,
      endDate,
      limit = 50,
      skip = 0
    } = req.query;

    let query = {};

    if (userId) query.user = userId;
    if (organizationId) query.organization = organizationId;
    if (action) query.action = action;
    if (resource) query.resource = resource;
    if (riskLevel) query['risk.level'] = riskLevel;

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const logs = await AuditLog.find(query)
      .populate('user', 'name email')
      .populate('organization', 'name')
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await AuditLog.countDocuments(query);

    res.json({
      success: true,
      logs,
      pagination: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip),
        hasMore: total > parseInt(skip) + parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/security-events', requireAdmin, async (req, res) => {
  try {
    const { hours = 24 } = req.query;
    const startDate = new Date(Date.now() - (hours * 60 * 60 * 1000));

    const securityEvents = await AuditLog.getSecurityEvents({
      startDate,
      limit: 100
    });

    res.json({
      success: true,
      events: securityEvents,
      timeframe: `${hours} hours`
    });

  } catch (error) {
    console.error('Error fetching security events:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/compliance-report/:organizationId', requireAdmin, async (req, res) => {
  try {
    const { organizationId } = req.params;
    const { reportType = 'gdpr' } = req.query;

    const report = await AuditLog.getComplianceReport(organizationId, reportType);

    res.json({
      success: true,
      reportType,
      organizationId,
      data: report,
      generatedAt: new Date()
    });

  } catch (error) {
    console.error('Error generating compliance report:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Fraud Detection Routes
router.post('/check-fraud', requireAdmin, async (req, res) => {
  try {
    const { userId, action, context } = req.body;

    const fraudCheck = await securityManager.detectFraud(userId, action, context);

    res.json({
      success: true,
      fraudCheck,
      recommendation: fraudCheck.score > 60 ? 'BLOCK' :
                     fraudCheck.score > 30 ? 'REVIEW' : 'ALLOW'
    });

  } catch (error) {
    console.error('Error checking fraud:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Rate Limiting Status
router.get('/rate-limit/status', async (req, res) => {
  try {
    const userId = req.user?.id || req.ip;
    const action = req.query.action || 'api_call';

    const status = securityManager.checkRateLimit(userId, action, 1000, 60 * 60 * 1000); // 1000 requests per hour

    res.json({
      success: true,
      rateLimit: {
        allowed: status.allowed,
        remaining: status.remaining,
        resetTime: new Date(status.resetTime),
        limit: 1000,
        windowMs: 60 * 60 * 1000
      }
    });

  } catch (error) {
    console.error('Error checking rate limit:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Security Dashboard
router.get('/dashboard', requireAdmin, async (req, res) => {
  try {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get security metrics
    const [
      totalUsers,
      activeUsers,
      securityEvents24h,
      securityEvents7d,
      blockedIPs,
      blockedUsers
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ updatedAt: { $gte: last24h } }),
      AuditLog.countDocuments({
        timestamp: { $gte: last24h },
        'risk.level': { $in: ['high', 'critical'] }
      }),
      AuditLog.countDocuments({
        timestamp: { $gte: last7d },
        'risk.level': { $in: ['high', 'critical'] }
      }),
      AuditLog.distinct('context.ipAddress', {
        action: 'rate_limit_exceeded',
        timestamp: { $gte: last7d }
      }),
      User.countDocuments({ status: 'suspended' })
    ]);

    // Get recent alerts
    const alerts = await securityManager.monitorSecurityEvents();

    res.json({
      success: true,
      dashboard: {
        overview: {
          totalUsers,
          activeUsers,
          securityEvents24h,
          securityEvents7d,
          blockedIPs: blockedIPs.length,
          blockedUsers
        },
        alerts,
        generatedAt: now
      }
    });

  } catch (error) {
    console.error('Error fetching security dashboard:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Two-Factor Authentication
router.post('/2fa/enable', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate TOTP secret (simplified - in production use speakeasy or similar)
    const secret = securityManager.generateSecureToken(16);
    user.security.twoFactorSecret = secret;
    user.security.twoFactorEnabled = false; // Will be enabled after verification

    await user.save();

    res.json({
      success: true,
      secret,
      message: '2FA setup initiated. Please verify with an authenticator app.'
    });

  } catch (error) {
    console.error('Error enabling 2FA:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/2fa/verify', async (req, res) => {
  try {
    const userId = req.user?.id;
    const { token } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const user = await User.findById(userId);
    if (!user || !user.security.twoFactorSecret) {
      return res.status(400).json({ message: '2FA not set up' });
    }

    // Simplified TOTP verification (in production use proper TOTP library)
    const isValid = token && token.length === 6; // Basic check

    if (isValid) {
      user.security.twoFactorEnabled = true;
      await user.save();

      res.json({
        success: true,
        message: '2FA enabled successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid 2FA token'
      });
    }

  } catch (error) {
    console.error('Error verifying 2FA:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Password Security
router.post('/password/change', async (req, res) => {
  try {
    const userId = req.user?.id;
    const { currentPassword, newPassword } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isValid = await user.comparePassword(currentPassword);
    if (!isValid) {
      await user.recordLoginAttempt(false);
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Validate new password strength
    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }

    // Update password
    user.password = newPassword;
    user.security.passwordHistory.push({
      hash: securityManager.hashData(newPassword),
      changedAt: new Date()
    });

    await user.save();

    // Log password change
    await AuditLog.log({
      user: userId,
      action: 'password_change',
      resource: 'user',
      resourceId: userId,
      risk: { level: 'medium', score: 30 }
    });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;