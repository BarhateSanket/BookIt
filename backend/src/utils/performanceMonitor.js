const os = require('os');
const v8 = require('v8');

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      responseTimes: [],
      memoryUsage: [],
      cpuUsage: [],
      errorRates: [],
      throughput: []
    };

    this.monitoringInterval = setInterval(() => this.collectMetrics(), 60000); // Every minute
    this.alerts = [];
  }

  // Collect system and application metrics
  collectMetrics() {
    try {
      const now = Date.now();

      // Memory usage
      const memUsage = process.memoryUsage();
      const heapStats = v8.getHeapStatistics();

      this.metrics.memoryUsage.push({
        timestamp: now,
        rss: memUsage.rss,
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        external: memUsage.external,
        heapSizeLimit: heapStats.heap_size_limit,
        totalHeapSize: heapStats.total_heap_size,
        usedHeapSize: heapStats.used_heap_size
      });

      // CPU usage
      const cpuUsage = process.cpuUsage();
      this.metrics.cpuUsage.push({
        timestamp: now,
        user: cpuUsage.user,
        system: cpuUsage.system
      });

      // System info
      const systemInfo = {
        platform: os.platform(),
        arch: os.arch(),
        cpus: os.cpus().length,
        totalMemory: os.totalmem(),
        freeMemory: os.freemem(),
        loadAverage: os.loadavg(),
        uptime: os.uptime()
      };

      // Keep only last 24 hours of metrics
      this.cleanupOldMetrics();

      // Check for alerts
      this.checkAlerts(systemInfo);

    } catch (error) {
      console.error('Metrics collection error:', error);
    }
  }

  // Record response time
  recordResponseTime(method, path, duration, statusCode) {
    this.metrics.responseTimes.push({
      timestamp: Date.now(),
      method,
      path,
      duration,
      statusCode
    });

    // Keep only last 1000 response times
    if (this.metrics.responseTimes.length > 1000) {
      this.metrics.responseTimes = this.metrics.responseTimes.slice(-1000);
    }
  }

  // Record error
  recordError(error, context = {}) {
    this.metrics.errorRates.push({
      timestamp: Date.now(),
      error: error.message,
      stack: error.stack,
      context
    });

    // Keep only last 100 errors
    if (this.metrics.errorRates.length > 100) {
      this.metrics.errorRates = this.metrics.errorRates.slice(-100);
    }
  }

  // Record throughput
  recordThroughput(requestsPerMinute) {
    this.metrics.throughput.push({
      timestamp: Date.now(),
      requestsPerMinute
    });
  }

  // Get performance summary
  getPerformanceSummary(timeframe = 3600000) { // Last hour default
    const now = Date.now();
    const cutoff = now - timeframe;

    // Filter metrics by timeframe
    const recentResponses = this.metrics.responseTimes.filter(m => m.timestamp > cutoff);
    const recentMemory = this.metrics.memoryUsage.filter(m => m.timestamp > cutoff);
    const recentCpu = this.metrics.cpuUsage.filter(m => m.timestamp > cutoff);
    const recentErrors = this.metrics.errorRates.filter(m => m.timestamp > cutoff);

    // Calculate averages
    const avgResponseTime = recentResponses.length > 0
      ? recentResponses.reduce((sum, r) => sum + r.duration, 0) / recentResponses.length
      : 0;

    const avgMemoryUsage = recentMemory.length > 0
      ? recentMemory.reduce((sum, m) => sum + m.heapUsed, 0) / recentMemory.length
      : 0;

    const errorRate = recentResponses.length > 0
      ? (recentErrors.length / recentResponses.length) * 100
      : 0;

    // Response time percentiles
    const sortedResponses = recentResponses.map(r => r.duration).sort((a, b) => a - b);
    const p95 = sortedResponses[Math.floor(sortedResponses.length * 0.95)] || 0;
    const p99 = sortedResponses[Math.floor(sortedResponses.length * 0.99)] || 0;

    return {
      timeframe: `${timeframe / 1000 / 60} minutes`,
      summary: {
        totalRequests: recentResponses.length,
        averageResponseTime: Math.round(avgResponseTime),
        p95ResponseTime: Math.round(p95),
        p99ResponseTime: Math.round(p99),
        errorRate: errorRate.toFixed(2),
        memoryUsage: Math.round(avgMemoryUsage / 1024 / 1024), // MB
        activeConnections: 0 // Would need to track this separately
      },
      health: this.getHealthStatus(avgResponseTime, errorRate, avgMemoryUsage)
    };
  }

  // Get health status
  getHealthStatus(avgResponseTime, errorRate, memoryUsage) {
    let score = 100;
    const issues = [];

    // Response time check
    if (avgResponseTime > 2000) {
      score -= 30;
      issues.push('High response time');
    } else if (avgResponseTime > 1000) {
      score -= 15;
      issues.push('Elevated response time');
    }

    // Error rate check
    if (errorRate > 5) {
      score -= 40;
      issues.push('High error rate');
    } else if (errorRate > 1) {
      score -= 20;
      issues.push('Elevated error rate');
    }

    // Memory usage check
    const memoryMB = memoryUsage / 1024 / 1024;
    if (memoryMB > 500) {
      score -= 25;
      issues.push('High memory usage');
    }

    let status = 'healthy';
    if (score < 50) status = 'critical';
    else if (score < 70) status = 'warning';
    else if (score < 90) status = 'degraded';

    return {
      status,
      score: Math.max(0, score),
      issues
    };
  }

  // Check for performance alerts
  checkAlerts(systemInfo) {
    const alerts = [];

    // Memory usage alert
    const latestMemory = this.metrics.memoryUsage[this.metrics.memoryUsage.length - 1];
    if (latestMemory) {
      const memoryUsagePercent = (latestMemory.heapUsed / latestMemory.heapSizeLimit) * 100;
      if (memoryUsagePercent > 85) {
        alerts.push({
          type: 'memory',
          severity: 'critical',
          message: `High memory usage: ${memoryUsagePercent.toFixed(1)}%`,
          value: memoryUsagePercent
        });
      } else if (memoryUsagePercent > 70) {
        alerts.push({
          type: 'memory',
          severity: 'warning',
          message: `Elevated memory usage: ${memoryUsagePercent.toFixed(1)}%`,
          value: memoryUsagePercent
        });
      }
    }

    // Response time alert
    const recentResponses = this.metrics.responseTimes.slice(-100);
    if (recentResponses.length > 0) {
      const avgResponseTime = recentResponses.reduce((sum, r) => sum + r.duration, 0) / recentResponses.length;
      if (avgResponseTime > 5000) {
        alerts.push({
          type: 'response_time',
          severity: 'critical',
          message: `Very high response time: ${avgResponseTime.toFixed(0)}ms`,
          value: avgResponseTime
        });
      } else if (avgResponseTime > 2000) {
        alerts.push({
          type: 'response_time',
          severity: 'warning',
          message: `High response time: ${avgResponseTime.toFixed(0)}ms`,
          value: avgResponseTime
        });
      }
    }

    // Error rate alert
    const recentErrors = this.metrics.errorRates.slice(-50);
    const recentRequests = this.metrics.responseTimes.slice(-200);
    if (recentRequests.length > 0) {
      const errorRate = (recentErrors.length / recentRequests.length) * 100;
      if (errorRate > 10) {
        alerts.push({
          type: 'error_rate',
          severity: 'critical',
          message: `Very high error rate: ${errorRate.toFixed(1)}%`,
          value: errorRate
        });
      } else if (errorRate > 5) {
        alerts.push({
          type: 'error_rate',
          severity: 'warning',
          message: `High error rate: ${errorRate.toFixed(1)}%`,
          value: errorRate
        });
      }
    }

    // System load alert
    if (systemInfo.loadAverage && systemInfo.loadAverage[0] > systemInfo.cpus * 2) {
      alerts.push({
        type: 'system_load',
        severity: 'warning',
        message: `High system load: ${systemInfo.loadAverage[0].toFixed(1)}`,
        value: systemInfo.loadAverage[0]
      });
    }

    // Store alerts
    this.alerts.push(...alerts.map(alert => ({
      ...alert,
      timestamp: Date.now()
    })));

    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }

    // Log critical alerts
    alerts.filter(a => a.severity === 'critical').forEach(alert => {
      console.error(`CRITICAL ALERT: ${alert.message}`);
    });
  }

  // Get recent alerts
  getRecentAlerts(limit = 10) {
    return this.alerts.slice(-limit).reverse();
  }

  // Get detailed metrics
  getDetailedMetrics(timeframe = 3600000) {
    const cutoff = Date.now() - timeframe;

    return {
      responseTimes: this.metrics.responseTimes.filter(m => m.timestamp > cutoff),
      memoryUsage: this.metrics.memoryUsage.filter(m => m.timestamp > cutoff),
      cpuUsage: this.metrics.cpuUsage.filter(m => m.timestamp > cutoff),
      errorRates: this.metrics.errorRates.filter(m => m.timestamp > cutoff),
      throughput: this.metrics.throughput.filter(m => m.timestamp > cutoff),
      alerts: this.getRecentAlerts(20)
    };
  }

  // Cleanup old metrics
  cleanupOldMetrics(maxAge = 24 * 60 * 60 * 1000) { // 24 hours
    const cutoff = Date.now() - maxAge;

    Object.keys(this.metrics).forEach(key => {
      this.metrics[key] = this.metrics[key].filter(m => m.timestamp > cutoff);
    });
  }

  // Export metrics for external monitoring
  exportMetrics() {
    return {
      service: 'bookit-api',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      metrics: this.getPerformanceSummary(),
      system: {
        platform: os.platform(),
        arch: os.arch(),
        nodeVersion: process.version,
        cpus: os.cpus().length,
        totalMemory: os.totalmem(),
        freeMemory: os.freemem()
      }
    };
  }

  // Middleware for response time tracking
  responseTimeMiddleware() {
    return (req, res, next) => {
      const start = process.hrtime.bigint();

      res.on('finish', () => {
        const end = process.hrtime.bigint();
        const duration = Number(end - start) / 1000000; // Convert to milliseconds

        this.recordResponseTime(req.method, req.path, duration, res.statusCode);
      });

      next();
    };
  }

  // Shutdown
  shutdown() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    console.log('Performance monitor shut down');
  }
}

module.exports = new PerformanceMonitor();