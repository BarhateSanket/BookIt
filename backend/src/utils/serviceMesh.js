const axios = require('axios');
const distributedTracer = require('./tracing');

class ServiceMesh {
  constructor() {
    this.services = new Map();
    this.serviceInstances = new Map();
    this.healthChecks = new Map();
    this.loadBalancers = new Map();

    // Service discovery
    this.discoveryInterval = setInterval(() => this.discoverServices(), 60000); // Every minute
    this.healthCheckInterval = setInterval(() => this.performHealthChecks(), 30000); // Every 30 seconds
  }

  // Register a service instance
  registerService(serviceName, instance) {
    if (!this.services.has(serviceName)) {
      this.services.set(serviceName, new Set());
      this.serviceInstances.set(serviceName, []);
      this.healthChecks.set(serviceName, new Map());
    }

    const instances = this.services.get(serviceName);
    const instanceKey = `${instance.host}:${instance.port}`;

    if (!instances.has(instanceKey)) {
      instances.add(instanceKey);
      this.serviceInstances.get(serviceName).push({
        ...instance,
        key: instanceKey,
        status: 'unknown',
        lastHealthCheck: null,
        consecutiveFailures: 0
      });

      // Initialize load balancer for this service
      this.initializeLoadBalancer(serviceName);
    }
  }

  // Unregister a service instance
  unregisterService(serviceName, instanceKey) {
    const instances = this.services.get(serviceName);
    if (instances) {
      instances.delete(instanceKey);

      const serviceInstances = this.serviceInstances.get(serviceName);
      const index = serviceInstances.findIndex(inst => inst.key === instanceKey);
      if (index > -1) {
        serviceInstances.splice(index, 1);
      }
    }
  }

  // Get healthy instances for a service
  getHealthyInstances(serviceName) {
    const serviceInstances = this.serviceInstances.get(serviceName) || [];
    return serviceInstances.filter(instance => instance.status === 'healthy');
  }

  // Load balancing strategies
  initializeLoadBalancer(serviceName) {
    const strategies = {
      roundRobin: (instances) => {
        if (!this.loadBalancers.has(serviceName)) {
          this.loadBalancers.set(serviceName, { index: 0 });
        }

        const balancer = this.loadBalancers.get(serviceName);
        const healthyInstances = this.getHealthyInstances(serviceName);

        if (healthyInstances.length === 0) return null;

        const instance = healthyInstances[balancer.index % healthyInstances.length];
        balancer.index = (balancer.index + 1) % healthyInstances.length;

        return instance;
      },

      leastConnections: (instances) => {
        const healthyInstances = this.getHealthyInstances(serviceName);
        if (healthyInstances.length === 0) return null;

        // Sort by active connections (simplified - in real implementation track actual connections)
        return healthyInstances.sort((a, b) => (a.activeConnections || 0) - (b.activeConnections || 0))[0];
      },

      random: (instances) => {
        const healthyInstances = this.getHealthyInstances(serviceName);
        if (healthyInstances.length === 0) return null;

        return healthyInstances[Math.floor(Math.random() * healthyInstances.length)];
      }
    };

    this.loadBalancers.set(serviceName, {
      strategy: strategies.roundRobin, // Default to round-robin
      index: 0
    });
  }

  // Get next instance using load balancing
  getNextInstance(serviceName) {
    const balancer = this.loadBalancers.get(serviceName);
    if (!balancer) return null;

    const serviceInstances = this.serviceInstances.get(serviceName) || [];
    return balancer.strategy(serviceInstances);
  }

  // Make inter-service call with tracing and load balancing
  async callService(serviceName, endpoint, options = {}) {
    const instance = this.getNextInstance(serviceName);
    if (!instance) {
      throw new Error(`No healthy instances available for service ${serviceName}`);
    }

    const url = `http://${instance.host}:${instance.port}${endpoint}`;
    const spanId = options.parentSpanId;

    // Start tracing span
    let callSpanId = null;
    if (spanId) {
      callSpanId = distributedTracer.startSpan(
        `service-call.${serviceName}`,
        spanId,
        {
          'service.name': serviceName,
          'service.endpoint': endpoint,
          'service.instance': instance.key
        }
      );
    }

    try {
      const response = await axios({
        method: options.method || 'GET',
        url,
        data: options.data,
        headers: {
          ...options.headers,
          'X-Trace-ID': options.traceId,
          'X-Span-ID': callSpanId
        },
        timeout: options.timeout || 5000
      });

      // Record success
      if (callSpanId) {
        distributedTracer.setSpanStatus(callSpanId, 'ok');
        distributedTracer.endSpan(callSpanId);
      }

      return response.data;

    } catch (error) {
      // Record error
      if (callSpanId) {
        distributedTracer.setSpanStatus(callSpanId, 'error', error.message);
        distributedTracer.endSpan(callSpanId);
      }

      // Mark instance as potentially unhealthy
      instance.consecutiveFailures = (instance.consecutiveFailures || 0) + 1;
      if (instance.consecutiveFailures >= 3) {
        instance.status = 'unhealthy';
        console.log(`Marked instance ${instance.key} as unhealthy after ${instance.consecutiveFailures} failures`);
      }

      throw error;
    }
  }

  // Service discovery (simplified - in production use Consul, Eureka, etc.)
  async discoverServices() {
    try {
      // In a real implementation, this would query a service registry
      // For now, we'll use environment variables or a local registry

      const services = [
        {
          name: 'recommendations',
          instances: [
            { host: 'localhost', port: 5001, weight: 1 },
            // Add more instances as needed
          ]
        },
        {
          name: 'analytics',
          instances: [
            { host: 'localhost', port: 5002, weight: 1 }
          ]
        },
        {
          name: 'pricing',
          instances: [
            { host: 'localhost', port: 5003, weight: 1 }
          ]
        }
      ];

      services.forEach(service => {
        service.instances.forEach(instance => {
          this.registerService(service.name, instance);
        });
      });

    } catch (error) {
      console.error('Service discovery error:', error);
    }
  }

  // Health checks for all service instances
  async performHealthChecks() {
    for (const [serviceName, instances] of this.serviceInstances) {
      for (const instance of instances) {
        try {
          const response = await axios.get(`http://${instance.host}:${instance.port}/health`, {
            timeout: 5000
          });

          if (response.status === 200) {
            instance.status = 'healthy';
            instance.consecutiveFailures = 0;
            instance.lastHealthCheck = new Date();
          } else {
            throw new Error(`Health check returned status ${response.status}`);
          }

        } catch (error) {
          instance.status = 'unhealthy';
          instance.consecutiveFailures = (instance.consecutiveFailures || 0) + 1;
          instance.lastHealthCheck = new Date();

          console.log(`Health check failed for ${serviceName}:${instance.key} - ${error.message}`);
        }
      }
    }
  }

  // Circuit breaker pattern for service calls
  async callWithCircuitBreaker(serviceName, endpoint, options = {}) {
    const circuitKey = `${serviceName}:${endpoint}`;

    // Simplified circuit breaker (in production use a proper library)
    const recentCalls = this.getRecentCalls(circuitKey);

    if (recentCalls.failureRate > 0.5 && recentCalls.count > 10) {
      throw new Error(`Circuit breaker open for ${circuitKey}`);
    }

    try {
      const result = await this.callService(serviceName, endpoint, options);
      this.recordCall(circuitKey, true);
      return result;
    } catch (error) {
      this.recordCall(circuitKey, false);
      throw error;
    }
  }

  // Track recent calls for circuit breaker
  recordCall(key, success) {
    if (!this.callHistory) this.callHistory = new Map();

    if (!this.callHistory.has(key)) {
      this.callHistory.set(key, []);
    }

    const history = this.callHistory.get(key);
    history.push({ success, timestamp: Date.now() });

    // Keep only last 100 calls
    if (history.length > 100) {
      history.shift();
    }
  }

  getRecentCalls(key) {
    if (!this.callHistory || !this.callHistory.has(key)) {
      return { count: 0, failureRate: 0 };
    }

    const history = this.callHistory.get(key);
    const recent = history.filter(call => Date.now() - call.timestamp < 60000); // Last minute

    const failures = recent.filter(call => !call.success).length;
    const failureRate = recent.length > 0 ? failures / recent.length : 0;

    return { count: recent.length, failureRate };
  }

  // Get service mesh status
  getStatus() {
    const status = {};

    for (const [serviceName, instances] of this.serviceInstances) {
      const healthy = instances.filter(inst => inst.status === 'healthy').length;
      const total = instances.length;

      status[serviceName] = {
        totalInstances: total,
        healthyInstances: healthy,
        unhealthyInstances: total - healthy,
        instances: instances.map(inst => ({
          key: inst.key,
          status: inst.status,
          lastHealthCheck: inst.lastHealthCheck,
          consecutiveFailures: inst.consecutiveFailures
        }))
      };
    }

    return status;
  }

  // Graceful shutdown
  shutdown() {
    if (this.discoveryInterval) {
      clearInterval(this.discoveryInterval);
    }
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    console.log('Service mesh shut down');
  }

  // Middleware for service-to-service authentication
  serviceAuthMiddleware() {
    return (req, res, next) => {
      // Verify service-to-service authentication
      const serviceToken = req.headers['x-service-token'];
      const expectedToken = process.env.SERVICE_MESH_TOKEN;

      if (!serviceToken || serviceToken !== expectedToken) {
        return res.status(401).json({ error: 'Invalid service authentication' });
      }

      next();
    };
  }
}

module.exports = new ServiceMesh();