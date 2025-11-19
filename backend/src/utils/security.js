const crypto = require('crypto');
const AuditLog = require('../models/AuditLog');
const User = require('../models/User');

class SecurityManager {
  constructor() {
    this.rateLimitWindows = new Map();
    this.suspiciousPatterns = new Map();
    this.blockedIPs = new Set();
    this.blockedUsers = new Set();
  }

  // Rate limiting
  checkRateLimit(identifier, action, maxRequests = 100, windowMs = 15 * 60 * 1000) {
    const key = `${action}:${identifier}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    if (!this.rateLimitWindows.has(key)) {
      this.rateLimitWindows.set(key, []);
    }

    const requests = this.rateLimitWindows.get(key);
    // Remove old requests outside the window
    const validRequests = requests.filter(time => time > windowStart);
    validRequests.push(now);
    this.rateLimitWindows.set(key, validRequests);

    if (validRequests.length > maxRequests) {
      // Log rate limit violation
      AuditLog.log({
        user: identifier,
        action: 'rate_limit_exceeded',
        resource: 'system',
        details: { action, maxRequests, windowMs },
        context: { ipAddress: identifier },
        risk: { level: 'medium', score: 50 }
      });

      return { allowed: false, remaining: 0, resetTime: windowStart + windowMs };
    }

    return {
      allowed: true,
      remaining: maxRequests - validRequests.length,
      resetTime: windowStart + windowMs
    };
  }

  // Fraud detection
  async detectFraud(userId, action, context = {}) {
    const riskFactors = {
      score: 0,
      flags: []
    };

    try {
      const user = await User.findById(userId);
      if (!user) return riskFactors;

      // Check login patterns
      if (action === 'login') {
        const recentLogins = await AuditLog.find({
          user: userId,
          action: 'login',
          timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }).sort({ timestamp: -1 });

        // Check for unusual locations
        if (context.location && recentLogins.length > 0) {
          const usualLocations = recentLogins
            .filter(log => log.context?.location)
            .map(log => log.context.location);

          const isUnusualLocation = !usualLocations.some(loc =>
            this.calculateDistance(loc, context.location) < 500 // 500km threshold
          );

          if (isUnusualLocation) {
            riskFactors.score += 40;
            riskFactors.flags.push('unusual_location');
          }
        }

        // Check for rapid successive logins from different IPs
        const recentIPs = recentLogins
          .slice(0, 5)
          .map(log => log.context?.ipAddress)
          .filter(ip => ip);

        if (recentIPs.length > 1 && new Set(recentIPs).size > 1) {
          riskFactors.score += 30;
          riskFactors.flags.push('multiple_ip_logins');
        }
      }

      // Check booking patterns for fraud
      if (action === 'booking_created') {
        const recentBookings = await AuditLog.countDocuments({
          user: userId,
          action: 'booking_created',
          timestamp: { $gte: new Date(Date.now() - 60 * 60 * 1000) } // Last hour
        });

        if (recentBookings > 10) { // More than 10 bookings in an hour
          riskFactors.score += 60;
          riskFactors.flags.push('bulk_bookings');
        }

        // Check for bookings with same payment method rapidly
        const recentPayments = await AuditLog.find({
          user: userId,
          action: 'payment_processed',
          timestamp: { $gte: new Date(Date.now() - 10 * 60 * 1000) } // Last 10 minutes
        });

        if (recentPayments.length > 3) {
          riskFactors.score += 50;
          riskFactors.flags.push('rapid_payments');
        }
      }

      // Check for account takeover indicators
      if (user.security?.loginAttempts > 3) {
        riskFactors.score += 25;
        riskFactors.flags.push('multiple_failed_attempts');
      }

      // Check device fingerprinting (simplified)
      if (context.userAgent) {
        const knownDevices = user.security?.trustedDevices || [];
        const isKnownDevice = knownDevices.some(device =>
          device.userAgent === context.userAgent
        );

        if (!isKnownDevice && knownDevices.length > 0) {
          riskFactors.score += 20;
          riskFactors.flags.push('unknown_device');
        }
      }

      // Determine risk level
      if (riskFactors.score >= 80) {
        riskFactors.level = 'critical';
      } else if (riskFactors.score >= 60) {
        riskFactors.level = 'high';
      } else if (riskFactors.score >= 30) {
        riskFactors.level = 'medium';
      } else {
        riskFactors.level = 'low';
      }

    } catch (error) {
      console.error('Error in fraud detection:', error);
    }

    return riskFactors;
  }

  // IP reputation checking (simplified)
  async checkIPReputation(ipAddress) {
    // In a real implementation, this would integrate with services like:
    // - MaxMind GeoIP
    // - AbuseIPDB
    // - IP reputation databases

    // For now, implement basic checks
    const suspiciousPatterns = [
      /^192\.168\./,  // Private IP
      /^10\./,        // Private IP
      /^172\./,       // Private IP
      /tor-exit/,     // TOR exit node
      /proxy/,        // Known proxy
    ];

    const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(ipAddress));

    if (isSuspicious) {
      return { reputation: 'suspicious', score: 80 };
    }

    // Check if IP is in blocked list
    if (this.blockedIPs.has(ipAddress)) {
      return { reputation: 'blocked', score: 100 };
    }

    return { reputation: 'clean', score: 0 };
  }

  // Input validation and sanitization
  sanitizeInput(input, type = 'text') {
    if (typeof input !== 'string') return input;

    let sanitized = input;

    // Remove null bytes
    sanitized = sanitized.replace(/\0/g, '');

    // Remove potential script tags
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    // Remove potential SQL injection patterns
    sanitized = sanitized.replace(/(\b(union|select|insert|update|delete|drop|create|alter)\b)/gi, '');

    // Type-specific sanitization
    switch (type) {
      case 'email':
        sanitized = sanitized.replace(/[<>'"&]/g, '');
        break;
      case 'url':
        sanitized = sanitized.replace(/javascript:/gi, '');
        sanitized = sanitized.replace(/data:/gi, '');
        break;
      case 'sql':
        // Additional SQL injection prevention
        sanitized = sanitized.replace(/['";\\]/g, '');
        break;
      default:
        sanitized = sanitized.replace(/[<>]/g, '');
    }

    return sanitized.trim();
  }

  // Data encryption/decryption
  encryptData(data, key = process.env.ENCRYPTION_KEY) {
    try {
      const cipher = crypto.createCipher('aes-256-cbc', key);
      let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
      encrypted += cipher.final('hex');
      return encrypted;
    } catch (error) {
      console.error('Encryption error:', error);
      return null;
    }
  }

  decryptData(encryptedData, key = process.env.ENCRYPTION_KEY) {
    try {
      const decipher = crypto.createDecipher('aes-256-cbc', key);
      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Decryption error:', error);
      return null;
    }
  }

  // GDPR compliance helpers
  async handleDataDeletion(userId) {
    try {
      // Mark user for deletion
      const user = await User.findById(userId);
      if (!user) return { success: false, message: 'User not found' };

      user.status = 'pending_deletion';
      user.consent.dataProcessing = false;
      await user.save();

      // Log the deletion request
      await AuditLog.log({
        user: userId,
        action: 'data_deletion_requested',
        resource: 'user',
        resourceId: userId,
        compliance: {
          gdpr: {
            personalDataAccessed: true,
            consentRequired: true
          }
        }
      });

      // In a real implementation, you would:
      // 1. Schedule actual data deletion after retention period
      // 2. Anonymize data instead of deleting
      // 3. Notify user of deletion timeline
      // 4. Handle related data in other collections

      return { success: true, message: 'Data deletion request processed' };
    } catch (error) {
      console.error('Error handling data deletion:', error);
      return { success: false, message: 'Failed to process deletion request' };
    }
  }

  async exportUserData(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) return null;

      const exportData = user.exportPersonalData();

      // Log the export
      await AuditLog.log({
        user: userId,
        action: 'data_export_requested',
        resource: 'user',
        resourceId: userId,
        compliance: {
          gdpr: {
            personalDataAccessed: true,
            consentRequired: true
          }
        }
      });

      return exportData;
    } catch (error) {
      console.error('Error exporting user data:', error);
      return null;
    }
  }

  // Security monitoring
  async monitorSecurityEvents() {
    try {
      // Check for suspicious patterns in recent logs
      const recentLogs = await AuditLog.find({
        timestamp: { $gte: new Date(Date.now() - 60 * 60 * 1000) }, // Last hour
        'risk.level': { $in: ['high', 'critical'] }
      });

      const alerts = [];

      // Group by risk patterns
      const riskPatterns = {};
      recentLogs.forEach(log => {
        const key = `${log.action}:${log.user}`;
        if (!riskPatterns[key]) {
          riskPatterns[key] = [];
        }
        riskPatterns[key].push(log);
      });

      // Generate alerts for patterns
      Object.entries(riskPatterns).forEach(([key, logs]) => {
        if (logs.length >= 5) { // 5 or more similar events
          alerts.push({
            type: 'pattern_detected',
            severity: 'high',
            message: `Multiple suspicious activities detected for ${key}`,
            logs: logs.length
          });
        }
      });

      // Check for brute force attempts
      const failedLogins = recentLogs.filter(log => log.action === 'login_failed');
      const failedByIP = {};
      failedLogins.forEach(log => {
        const ip = log.context?.ipAddress;
        if (ip) {
          failedByIP[ip] = (failedByIP[ip] || 0) + 1;
        }
      });

      Object.entries(failedByIP).forEach(([ip, count]) => {
        if (count >= 10) {
          alerts.push({
            type: 'brute_force_attempt',
            severity: 'critical',
            message: `Brute force attack detected from IP ${ip}`,
            attempts: count
          });
          this.blockedIPs.add(ip);
        }
      });

      return alerts;
    } catch (error) {
      console.error('Error monitoring security events:', error);
      return [];
    }
  }

  // Utility functions
  calculateDistance(loc1, loc2) {
    // Haversine formula for distance calculation
    const R = 6371; // Earth's radius in km
    const dLat = this.toRadians(loc2.latitude - loc1.latitude);
    const dLon = this.toRadians(loc2.longitude - loc1.longitude);

    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.toRadians(loc1.latitude)) * Math.cos(this.toRadians(loc2.latitude)) *
              Math.sin(dLon/2) * Math.sin(dLon/2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  // Generate secure tokens
  generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  // Hash sensitive data
  hashData(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
  }
}

module.exports = new SecurityManager();