const axios = require('axios');
const CircuitBreaker = require('opossum');

class APIGateway {
  constructor() {
    this.services = new Map();
    this.circuitBreakers = new Map();
    this.serviceDiscovery = new Map();
    this.requestQueue = [];
    this.isProcessing = false;

    // Initialize circuit breakers for each service
    this.initializeCircuitBreakers();

    // Health check interval
    setInterval(() => this.healthCheck(), 30000); // Every 30 seconds
  }

  // Register a microservice
  registerService(name, config) {
    this.services.set(name, {
      name,
      baseUrl: config.baseUrl,
      endpoints: config.endpoints || [],
      healthCheck: config.healthCheck || '/health',
      timeout: config.timeout || 5000,
      retries: config.retries || 3,
      weight: config.weight || 1, // For load balancing
      status: 'unknown'
    });

    // Initialize circuit breaker for this service
    this.initializeCircuitBreaker(name);

    console.log(`Service ${name} registered at ${config.baseUrl}`);
  }

  // Initialize circuit breaker for a service
  initializeCircuitBreaker(serviceName) {
    const service = this.services.get(serviceName);
    if (!service) return;

    const breaker = new CircuitBreaker(async (request) => {
      return await this.makeRequest(request);
    }, {
      timeout: service.timeout,
      errorThresholdPercentage: 50,
      resetTimeout: 30000,
      name: serviceName
    });

    breaker.on('open', () => {
      console.log(`Circuit breaker opened for service: ${serviceName}`);
      service.status = 'unhealthy';
    });

    breaker.on('close', () => {
      console.log(`Circuit breaker closed for service: ${serviceName}`);
      service.status = 'healthy';
    });

    this.circuitBreakers.set(serviceName, breaker);
  }

  // Initialize circuit breakers for all services
  initializeCircuitBreakers() {
    // Default services (can be extended)
    this.registerService('recommendations', {
      baseUrl: process.env.RECOMMENDATIONS_SERVICE_URL || 'http://localhost:5001',
      endpoints: ['/personalized', '/trending', '/similar'],
      healthCheck: '/health'
    });

    this.registerService('analytics', {
      baseUrl: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:5002',
      endpoints: ['/clv', '/funnel', '/business-intelligence'],
      healthCheck: '/health'
    });

    this.registerService('pricing', {
      baseUrl: process.env.PRICING_SERVICE_URL || 'http://localhost:5003',
      endpoints: ['/calculate', '/rules', '/update-bulk'],
      healthCheck: '/health'
    });
  }

  // Route request to appropriate service
  async routeRequest(serviceName, endpoint, method = 'GET', data = null, headers = {}) {
    const service = this.services.get(serviceName);
    if (!service) {
      throw new Error(`Service ${serviceName} not found`);
    }

    const breaker = this.circuitBreakers.get(serviceName);
    if (!breaker) {
      throw new Error(`Circuit breaker not found for service ${serviceName}`);
    }

    // Check if endpoint is allowed for this service
    if (!service.endpoints.some(ep => endpoint.startsWith(ep))) {
      throw new Error(`Endpoint ${endpoint} not allowed for service ${serviceName}`);
    }

    const request = {
      serviceName,
      endpoint,
      method,
      data,
      headers: {
        ...headers,
        'X-Service-Name': serviceName,
        'X-Request-ID': this.generateRequestId(),
        'X-Timestamp': Date.now()
      }
    };

    try {
      const response = await breaker.fire(request);
      return response;
    } catch (error) {
      console.error(`Request to ${serviceName}${endpoint} failed:`, error.message);
      throw error;
    }
  }

  // Make actual HTTP request
  async makeRequest(request) {
    const service = this.services.get(request.serviceName);
    const url = `${service.baseUrl}${request.endpoint}`;

    const axiosConfig = {
      method: request.method,
      url,
      headers: request.headers,
      timeout: service.timeout
    };

    if (request.data && (request.method === 'POST' || request.method === 'PUT' || request.method === 'PATCH')) {
      axiosConfig.data = request.data;
    }

    // Add distributed tracing headers
    axiosConfig.headers['X-Trace-ID'] = request.headers['X-Request-ID'];

    const response = await axios(axiosConfig);
    return response.data;
  }

  // Health check all services
  async healthCheck() {
    const promises = Array.from(this.services.entries()).map(async ([name, service]) => {
      try {
        const response = await axios.get(`${service.baseUrl}${service.healthCheck}`, {
          timeout: 5000
        });

        service.status = response.status === 200 ? 'healthy' : 'unhealthy';
        service.lastHealthCheck = new Date();
      } catch (error) {
        service.status = 'unhealthy';
        service.lastHealthCheck = new Date();
        console.log(`Health check failed for service ${name}:`, error.message);
      }
    });

    await Promise.allSettled(promises);
  }

  // Get service status
  getServiceStatus() {
    const status = {};
    for (const [name, service] of this.services) {
      const breaker = this.circuitBreakers.get(name);
      status[name] = {
        status: service.status,
        baseUrl: service.baseUrl,
        circuitBreakerState: breaker ? breaker.status : 'unknown',
        lastHealthCheck: service.lastHealthCheck
      };
    }
    return status;
  }

  // Load balancing (simple round-robin for now)
  getServiceInstance(serviceName) {
    const service = this.services.get(serviceName);
    if (!service) return null;

    // For now, return the single instance
    // In a real implementation, you'd have multiple instances
    return service;
  }

  // Service discovery
  discoverService(serviceName) {
    return this.services.get(serviceName);
  }

  // Generate unique request ID
  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Middleware for Express to handle microservice routing
  middleware() {
    return async (req, res, next) => {
      // Check if this is a microservice route
      const pathParts = req.path.split('/');
      if (pathParts[1] === 'microservice') {
        const serviceName = pathParts[2];
        const endpoint = '/' + pathParts.slice(3).join('/');

        try {
          const result = await this.routeRequest(
            serviceName,
            endpoint,
            req.method,
            req.body,
            req.headers
          );

          res.json(result);
        } catch (error) {
          res.status(500).json({
            error: 'Microservice request failed',
            message: error.message
          });
        }
      } else {
        next();
      }
    };
  }

  // Graceful shutdown
  async shutdown() {
    console.log('Shutting down API Gateway...');

    // Close all circuit breakers
    for (const breaker of this.circuitBreakers.values()) {
      breaker.shutdown();
    }

    this.services.clear();
    this.circuitBreakers.clear();
  }
}

module.exports = new APIGateway();