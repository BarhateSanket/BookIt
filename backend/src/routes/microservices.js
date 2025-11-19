const express = require('express');
const router = express.Router();
const apiGateway = require('../utils/apiGateway');
const serviceMesh = require('../utils/serviceMesh');
const distributedTracer = require('../utils/tracing');

// Get microservices status
router.get('/status', (req, res) => {
  try {
    const gatewayStatus = apiGateway.getServiceStatus();
    const meshStatus = serviceMesh.getStatus();
    const tracingStatus = {
      activeSpans: distributedTracer.getActiveSpansCount(),
      totalSpans: distributedTracer.getTotalSpansCount()
    };

    res.json({
      success: true,
      microservices: {
        apiGateway: gatewayStatus,
        serviceMesh: meshStatus,
        distributedTracing: tracingStatus,
        timestamp: new Date()
      }
    });

  } catch (error) {
    console.error('Error getting microservices status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Manually trigger service discovery
router.post('/discover', async (req, res) => {
  try {
    await serviceMesh.discoverServices();
    res.json({
      success: true,
      message: 'Service discovery completed'
    });

  } catch (error) {
    console.error('Error triggering service discovery:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Manually trigger health checks
router.post('/health-check', async (req, res) => {
  try {
    await serviceMesh.performHealthChecks();
    await apiGateway.healthCheck();

    res.json({
      success: true,
      message: 'Health checks completed'
    });

  } catch (error) {
    console.error('Error triggering health checks:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get distributed traces
router.get('/traces', (req, res) => {
  try {
    const { traceId, limit = 10 } = req.query;

    let traces;
    if (traceId) {
      traces = distributedTracer.getTrace(traceId);
    } else {
      traces = distributedTracer.exportTraces();
    }

    res.json({
      success: true,
      traces,
      limit: parseInt(limit)
    });

  } catch (error) {
    console.error('Error getting traces:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Clean up old traces
router.post('/traces/cleanup', (req, res) => {
  try {
    const { maxAge = 3600000 } = req.body; // Default 1 hour
    const deletedCount = distributedTracer.cleanup(maxAge);

    res.json({
      success: true,
      message: `Cleaned up ${deletedCount} old traces`,
      maxAge
    });

  } catch (error) {
    console.error('Error cleaning up traces:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Test microservice call
router.post('/test-call', async (req, res) => {
  try {
    const { serviceName, endpoint, method = 'GET', data } = req.body;

    if (!serviceName || !endpoint) {
      return res.status(400).json({ message: 'Service name and endpoint are required' });
    }

    // Test via API Gateway
    const gatewayResult = await apiGateway.routeRequest(
      serviceName,
      endpoint,
      method,
      data,
      req.headers
    );

    // Test via Service Mesh
    const meshResult = await serviceMesh.callService(
      serviceName,
      endpoint,
      { method, data, headers: req.headers }
    );

    res.json({
      success: true,
      results: {
        apiGateway: gatewayResult,
        serviceMesh: meshResult
      }
    });

  } catch (error) {
    console.error('Error testing microservice call:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Register a service instance (for development/testing)
router.post('/register-service', (req, res) => {
  try {
    const { serviceName, host, port, weight = 1 } = req.body;

    if (!serviceName || !host || !port) {
      return res.status(400).json({ message: 'Service name, host, and port are required' });
    }

    serviceMesh.registerService(serviceName, { host, port, weight });

    res.json({
      success: true,
      message: `Service ${serviceName} registered at ${host}:${port}`
    });

  } catch (error) {
    console.error('Error registering service:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get service instances
router.get('/services/:serviceName/instances', (req, res) => {
  try {
    const { serviceName } = req.params;
    const instances = serviceMesh.serviceInstances.get(serviceName) || [];

    res.json({
      success: true,
      serviceName,
      instances: instances.map(inst => ({
        key: inst.key,
        host: inst.host,
        port: inst.port,
        status: inst.status,
        lastHealthCheck: inst.lastHealthCheck,
        consecutiveFailures: inst.consecutiveFailures
      }))
    });

  } catch (error) {
    console.error('Error getting service instances:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Circuit breaker status
router.get('/circuit-breakers', (req, res) => {
  try {
    const breakers = {};

    for (const [serviceName, breaker] of apiGateway.circuitBreakers) {
      breakers[serviceName] = {
        state: breaker.status,
        failures: breaker.stats.failures || 0,
        successes: breaker.stats.successes || 0,
        timeouts: breaker.stats.timeouts || 0,
        lastFailure: breaker.stats.lastFailure || null
      };
    }

    res.json({
      success: true,
      circuitBreakers: breakers
    });

  } catch (error) {
    console.error('Error getting circuit breaker status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Load balancer status
router.get('/load-balancers', (req, res) => {
  try {
    const balancers = {};

    for (const [serviceName, balancer] of serviceMesh.loadBalancers) {
      const healthyInstances = serviceMesh.getHealthyInstances(serviceName);
      balancers[serviceName] = {
        strategy: 'roundRobin', // Currently only round-robin
        totalInstances: serviceMesh.serviceInstances.get(serviceName)?.length || 0,
        healthyInstances: healthyInstances.length,
        currentIndex: balancer.index
      };
    }

    res.json({
      success: true,
      loadBalancers: balancers
    });

  } catch (error) {
    console.error('Error getting load balancer status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Service mesh configuration
router.get('/config', (req, res) => {
  try {
    const config = {
      apiGateway: {
        services: Array.from(apiGateway.services.keys()),
        circuitBreakerTimeout: 5000,
        healthCheckInterval: 30000
      },
      serviceMesh: {
        services: Array.from(serviceMesh.services.keys()),
        discoveryInterval: 60000,
        healthCheckInterval: 30000
      },
      distributedTracing: {
        serviceName: distributedTracer.serviceName,
        activeSpans: distributedTracer.getActiveSpansCount(),
        totalSpans: distributedTracer.getTotalSpansCount()
      }
    };

    res.json({
      success: true,
      config
    });

  } catch (error) {
    console.error('Error getting microservices config:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;