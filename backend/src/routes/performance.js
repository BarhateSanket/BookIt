const express = require('express');
const router = express.Router();
const performanceMonitor = require('../utils/performanceMonitor');
const cacheManager = require('../utils/cache');
const databaseOptimizer = require('../utils/databaseOptimizer');

// Get performance summary
router.get('/summary', async (req, res) => {
  try {
    const timeframe = req.query.timeframe ? parseInt(req.query.timeframe) : 3600000; // 1 hour default
    const summary = performanceMonitor.getPerformanceSummary(timeframe);

    res.json({
      success: true,
      performance: summary
    });

  } catch (error) {
    console.error('Error getting performance summary:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get detailed performance metrics
router.get('/metrics', async (req, res) => {
  try {
    const timeframe = req.query.timeframe ? parseInt(req.query.timeframe) : 3600000;
    const metrics = performanceMonitor.getDetailedMetrics(timeframe);

    res.json({
      success: true,
      metrics
    });

  } catch (error) {
    console.error('Error getting performance metrics:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get recent alerts
router.get('/alerts', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;
    const alerts = performanceMonitor.getRecentAlerts(limit);

    res.json({
      success: true,
      alerts
    });

  } catch (error) {
    console.error('Error getting performance alerts:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get cache statistics
router.get('/cache/stats', async (req, res) => {
  try {
    const stats = await cacheManager.getStats();

    res.json({
      success: true,
      cache: stats
    });

  } catch (error) {
    console.error('Error getting cache stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Warm up cache
router.post('/cache/warmup', async (req, res) => {
  try {
    await cacheManager.warmCache();

    res.json({
      success: true,
      message: 'Cache warmup completed'
    });

  } catch (error) {
    console.error('Error warming up cache:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Clear cache
router.post('/cache/clear', async (req, res) => {
  try {
    // This is a simplified cache clear - in production you'd want more granular control
    const cacheStats = await cacheManager.getStats();
    // Note: Redis doesn't have a simple "clear all" without being careful about keys

    res.json({
      success: true,
      message: 'Cache clear requested (manual intervention may be required)',
      cacheStats
    });

  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get database performance metrics
router.get('/database/metrics', async (req, res) => {
  try {
    const metrics = await databaseOptimizer.getPerformanceMetrics();

    res.json({
      success: true,
      database: metrics
    });

  } catch (error) {
    console.error('Error getting database metrics:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Run database optimizations
router.post('/database/optimize', async (req, res) => {
  try {
    await databaseOptimizer.runOptimizations();

    res.json({
      success: true,
      message: 'Database optimization completed'
    });

  } catch (error) {
    console.error('Error running database optimization:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create database backup
router.post('/database/backup', async (req, res) => {
  try {
    const backupPath = req.body.path || `./backups/backup_${Date.now()}`;
    const result = await databaseOptimizer.createBackup(backupPath);

    if (result.success) {
      res.json({
        success: true,
        message: 'Database backup created successfully',
        path: result.path
      });
    } else {
      res.status(500).json({
        success: false,
        message: result.error
      });
    }

  } catch (error) {
    console.error('Error creating database backup:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get system health check
router.get('/health', async (req, res) => {
  try {
    const health = performanceMonitor.getPerformanceSummary(300000); // Last 5 minutes
    const cacheHealth = await cacheManager.getStats();

    const overallHealth = {
      status: 'healthy',
      services: {
        api: health.health.status,
        cache: cacheHealth.connected ? 'healthy' : 'unhealthy',
        database: 'unknown' // Would need to check DB connection
      },
      metrics: {
        responseTime: health.summary.averageResponseTime,
        errorRate: health.summary.errorRate,
        memoryUsage: health.summary.memoryUsage
      },
      timestamp: new Date()
    };

    // Determine overall status
    if (overallHealth.services.api === 'critical' ||
        overallHealth.services.cache === 'unhealthy' ||
        health.summary.errorRate > 10) {
      overallHealth.status = 'critical';
    } else if (overallHealth.services.api === 'warning' ||
               health.summary.errorRate > 5) {
      overallHealth.status = 'warning';
    }

    res.status(overallHealth.status === 'healthy' ? 200 :
               overallHealth.status === 'warning' ? 200 : 503)
       .json(overallHealth);

  } catch (error) {
    console.error('Error getting health status:', error);
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date()
    });
  }
});

// Performance testing endpoint
router.post('/load-test', async (req, res) => {
  try {
    const { duration = 10, concurrency = 10 } = req.body; // seconds, concurrent requests

    console.log(`Starting load test: ${duration}s with ${concurrency} concurrent requests`);

    const results = {
      duration,
      concurrency,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      minResponseTime: Infinity,
      maxResponseTime: 0,
      responseTimes: []
    };

    const startTime = Date.now();
    const endTime = startTime + (duration * 1000);

    // Simple load test (in production, use proper load testing tools)
    const makeRequest = async () => {
      const requestStart = Date.now();
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
        const responseTime = Date.now() - requestStart;

        results.totalRequests++;
        results.successfulRequests++;
        results.responseTimes.push(responseTime);
        results.averageResponseTime = results.responseTimes.reduce((a, b) => a + b, 0) / results.responseTimes.length;
        results.minResponseTime = Math.min(results.minResponseTime, responseTime);
        results.maxResponseTime = Math.max(results.maxResponseTime, responseTime);

        return responseTime;
      } catch (error) {
        results.totalRequests++;
        results.failedRequests++;
        return 0;
      }
    };

    // Run concurrent requests
    const promises = [];
    while (Date.now() < endTime) {
      for (let i = 0; i < concurrency; i++) {
        promises.push(makeRequest());
      }

      // Wait for batch to complete
      await Promise.all(promises.splice(0, concurrency));
    }

    results.duration = (Date.now() - startTime) / 1000;
    results.requestsPerSecond = results.totalRequests / results.duration;

    res.json({
      success: true,
      loadTest: results
    });

  } catch (error) {
    console.error('Error running load test:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Export metrics for external monitoring
router.get('/export', async (req, res) => {
  try {
    const format = req.query.format || 'json';

    const metrics = {
      performance: performanceMonitor.exportMetrics(),
      cache: await cacheManager.getStats(),
      database: await databaseOptimizer.getPerformanceMetrics(),
      timestamp: new Date().toISOString()
    };

    if (format === 'prometheus') {
      // Convert to Prometheus format
      let prometheusOutput = '';

      prometheusOutput += `# HELP bookit_api_response_time Average response time\n`;
      prometheusOutput += `# TYPE bookit_api_response_time gauge\n`;
      prometheusOutput += `bookit_api_response_time ${metrics.performance.metrics.summary.averageResponseTime}\n`;

      prometheusOutput += `# HELP bookit_api_error_rate Error rate percentage\n`;
      prometheusOutput += `# TYPE bookit_api_error_rate gauge\n`;
      prometheusOutput += `bookit_api_error_rate ${metrics.performance.metrics.summary.errorRate}\n`;

      prometheusOutput += `# HELP bookit_api_memory_usage Memory usage in MB\n`;
      prometheusOutput += `# TYPE bookit_api_memory_usage gauge\n`;
      prometheusOutput += `bookit_api_memory_usage ${metrics.performance.metrics.summary.memoryUsage}\n`;

      res.set('Content-Type', 'text/plain');
      res.send(prometheusOutput);
    } else {
      res.json(metrics);
    }

  } catch (error) {
    console.error('Error exporting metrics:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;