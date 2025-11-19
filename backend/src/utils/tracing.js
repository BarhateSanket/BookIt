const crypto = require('crypto');

class DistributedTracer {
  constructor() {
    this.spans = new Map();
    this.activeSpans = new Map();
    this.serviceName = process.env.SERVICE_NAME || 'bookit-api';
  }

  // Start a new trace
  startTrace(name, parentSpanId = null, tags = {}) {
    const traceId = this.generateTraceId();
    const spanId = this.generateSpanId();

    const span = {
      traceId,
      spanId,
      parentSpanId,
      name,
      serviceName: this.serviceName,
      startTime: Date.now(),
      tags: { ...tags },
      events: [],
      children: []
    };

    this.spans.set(spanId, span);
    this.activeSpans.set(spanId, span);

    return { traceId, spanId };
  }

  // Start a child span
  startSpan(name, parentSpanId, tags = {}) {
    const parentSpan = this.spans.get(parentSpanId);
    if (!parentSpan) {
      throw new Error(`Parent span ${parentSpanId} not found`);
    }

    const spanId = this.generateSpanId();
    const span = {
      traceId: parentSpan.traceId,
      spanId,
      parentSpanId,
      name,
      serviceName: this.serviceName,
      startTime: Date.now(),
      tags: { ...tags },
      events: [],
      children: []
    };

    this.spans.set(spanId, span);
    this.activeSpans.set(spanId, span);

    // Add to parent's children
    parentSpan.children.push(spanId);

    return spanId;
  }

  // Add tags to a span
  addTags(spanId, tags) {
    const span = this.spans.get(spanId);
    if (span) {
      span.tags = { ...span.tags, ...tags };
    }
  }

  // Add an event to a span
  addEvent(spanId, name, attributes = {}) {
    const span = this.spans.get(spanId);
    if (span) {
      span.events.push({
        name,
        timestamp: Date.now(),
        attributes
      });
    }
  }

  // Set span status
  setSpanStatus(spanId, status, message = '') {
    const span = this.spans.get(spanId);
    if (span) {
      span.status = status;
      span.statusMessage = message;
    }
  }

  // End a span
  endSpan(spanId) {
    const span = this.spans.get(spanId);
    if (span) {
      span.endTime = Date.now();
      span.duration = span.endTime - span.startTime;

      this.activeSpans.delete(spanId);

      // Log span completion (in production, send to tracing backend)
      this.logSpan(span);
    }
  }

  // Get span information
  getSpan(spanId) {
    return this.spans.get(spanId);
  }

  // Get trace information
  getTrace(traceId) {
    const spans = Array.from(this.spans.values()).filter(span => span.traceId === traceId);
    return {
      traceId,
      spans: spans.map(span => ({
        ...span,
        children: span.children.map(childId => this.spans.get(childId)).filter(Boolean)
      }))
    };
  }

  // Middleware for Express
  middleware() {
    return (req, res, next) => {
      // Extract trace context from headers
      const traceId = req.headers['x-trace-id'] || req.headers['x-request-id'];
      const parentSpanId = req.headers['x-span-id'];

      // Start a new span for this request
      const spanId = this.startSpan(
        `${req.method} ${req.path}`,
        parentSpanId,
        {
          'http.method': req.method,
          'http.url': req.originalUrl,
          'http.user_agent': req.get('User-Agent'),
          'http.remote_addr': req.ip
        }
      );

      // Add trace ID to response headers
      const span = this.spans.get(spanId);
      if (span) {
        res.set('X-Trace-ID', span.traceId);
        res.set('X-Span-ID', span.spanId);
      }

      // Store span ID in request for use in routes
      req.spanId = spanId;

      // End span when response is finished
      res.on('finish', () => {
        this.addTags(spanId, {
          'http.status_code': res.statusCode,
          'http.response_size': res.get('Content-Length') || 0
        });

        this.setSpanStatus(spanId,
          res.statusCode >= 400 ? 'error' : 'ok',
          res.statusCode >= 400 ? `HTTP ${res.statusCode}` : ''
        );

        this.endSpan(spanId);
      });

      next();
    };
  }

  // Database operation tracing
  traceDatabaseOperation(operation, collection, query = {}, spanId = null) {
    if (!spanId) return null;

    const dbSpanId = this.startSpan(
      `db.${operation}`,
      spanId,
      {
        'db.operation': operation,
        'db.collection': collection,
        'db.query': JSON.stringify(query).substring(0, 100) // Truncate for performance
      }
    );

    return dbSpanId;
  }

  // External service call tracing
  traceExternalCall(serviceName, method, url, spanId = null) {
    if (!spanId) return null;

    const externalSpanId = this.startSpan(
      `external.${serviceName}`,
      spanId,
      {
        'external.service': serviceName,
        'http.method': method,
        'http.url': url
      }
    );

    return externalSpanId;
  }

  // Log span to console (in production, send to Jaeger, Zipkin, etc.)
  logSpan(span) {
    const logData = {
      timestamp: new Date(span.startTime).toISOString(),
      level: span.status === 'error' ? 'ERROR' : 'INFO',
      service: span.serviceName,
      traceId: span.traceId,
      spanId: span.spanId,
      parentSpanId: span.parentSpanId,
      operation: span.name,
      duration: span.duration,
      tags: span.tags,
      events: span.events.length,
      status: span.status
    };

    console.log(JSON.stringify(logData));
  }

  // Generate trace ID
  generateTraceId() {
    return crypto.randomBytes(16).toString('hex');
  }

  // Generate span ID
  generateSpanId() {
    return crypto.randomBytes(8).toString('hex');
  }

  // Get active spans count
  getActiveSpansCount() {
    return this.activeSpans.size;
  }

  // Get total spans count
  getTotalSpansCount() {
    return this.spans.size;
  }

  // Clean up old spans (memory management)
  cleanup(maxAge = 3600000) { // 1 hour default
    const cutoff = Date.now() - maxAge;
    const toDelete = [];

    for (const [spanId, span] of this.spans) {
      if (span.endTime && span.endTime < cutoff) {
        toDelete.push(spanId);
      }
    }

    toDelete.forEach(spanId => {
      this.spans.delete(spanId);
    });

    return toDelete.length;
  }

  // Export traces for debugging
  exportTraces(traceId = null) {
    if (traceId) {
      return this.getTrace(traceId);
    }

    // Export recent traces
    const recentSpans = Array.from(this.spans.values())
      .filter(span => span.endTime)
      .sort((a, b) => b.startTime - a.startTime)
      .slice(0, 100);

    const traces = {};
    recentSpans.forEach(span => {
      if (!traces[span.traceId]) {
        traces[span.traceId] = [];
      }
      traces[span.traceId].push(span);
    });

    return traces;
  }
}

module.exports = new DistributedTracer();