require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const compression = require('compression');
const connectDB = require('./config/db');
const apiGateway = require('./utils/apiGateway');
const distributedTracer = require('./utils/tracing');
const serviceMesh = require('./utils/serviceMesh');
const cacheManager = require('./utils/cache');
const performanceMonitor = require('./utils/performanceMonitor');
const databaseOptimizer = require('./utils/databaseOptimizer');

const experiencesRoutes = require('./routes/experiences');
const bookingsRoutes = require('./routes/bookings');
const promoRoutes = require('./routes/promo');
const authRoutes = require('./routes/auth');
const paymentsRoutes = require('./routes/payments');
const savedSearchesRoutes = require('./routes/savedSearches');
const chatRoutes = require('./routes/chat');
const waitlistRoutes = require('./routes/waitlist');
const groupBookingsRoutes = require('./routes/groupBookings');
const adminRoutes = require('./routes/admin');
const recommendationsRoutes = require('./routes/recommendations');
const pricingRoutes = require('./routes/pricing');
const analyticsRoutes = require('./routes/analytics');
const experimentsRoutes = require('./routes/experiments');
const integrationsRoutes = require('./routes/integrations');
const organizationsRoutes = require('./routes/organizations');
const securityRoutes = require('./routes/security');
const microservicesRoutes = require('./routes/microservices');
const performanceRoutes = require('./routes/performance');
const { startReminderScheduler } = require('./utils/reminderScheduler');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5174', 'http://localhost:5176'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Configure CORS
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5174', 'http://localhost:5176'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Enable gzip compression
app.use(compression({
  level: 6, // Good balance between compression and speed
  threshold: 1024, // Only compress responses larger than 1KB
  filter: (req, res) => {
    // Don't compress responses with this request header
    if (req.headers['x-no-compression']) {
      return false;
    }
    // Use compression filter function
    return compression.filter(req, res);
  }
}));

// Stripe webhook must use raw body, mount it before JSON parser
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), require('./routes/paymentsWebhook'));

// Parse JSON bodies for everything else
app.use(express.json());

// Add distributed tracing middleware
app.use(distributedTracer.middleware());

// Add performance monitoring middleware
app.use(performanceMonitor.responseTimeMiddleware());

// Add API Gateway middleware for microservice routing
app.use(apiGateway.middleware());

// Add caching headers middleware
app.use((req, res, next) => {
  // Set cache control headers based on route
  if (req.method === 'GET') {
    if (req.path.startsWith('/api/experiences') || req.path.startsWith('/api/recommendations')) {
      // Cache API responses for 5 minutes
      res.set('Cache-Control', 'public, max-age=300');
    } else if (req.path.startsWith('/api/analytics') || req.path.startsWith('/api/microservices/status')) {
      // Cache analytics for 1 minute
      res.set('Cache-Control', 'public, max-age=60');
    } else {
      // Don't cache other API responses
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
  }

  // Add ETags for better caching
  const originalJson = res.json;
  res.json = function(data) {
    const etag = require('crypto').createHash('md5').update(JSON.stringify(data)).digest('hex');
    res.set('ETag', `"${etag}"`);

    // Check if client sent If-None-Match
    if (req.headers['if-none-match'] === `"${etag}"`) {
      res.status(304).end();
      return res;
    }

    return originalJson.call(this, data);
  };

  next();
});

// Serve uploaded files
app.use('/uploads', express.static(require('path').join(__dirname, 'uploads')));

// Add security headers
app.use((req, res, next) => {
  const origin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
  const stripe = 'https://js.stripe.com https://api.stripe.com';
  const csp = [
    `default-src 'self' ${origin}`,
    `connect-src 'self' ${origin} ws://localhost:5173 ${stripe} chrome-extension: chrome-devtools:`,
    `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${stripe}`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: blob: https://images.unsplash.com ${origin}`,
    `frame-src ${stripe}`,
  ].join('; ');
  res.setHeader('Content-Security-Policy', csp);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Add root route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to BookIt API' });
});

app.use('/api/experiences', experiencesRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/promo', promoRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/saved-searches', savedSearchesRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/waitlist', waitlistRoutes);
app.use('/api/group-bookings', groupBookingsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/recommendations', recommendationsRoutes);
app.use('/api/pricing', pricingRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/experiments', experimentsRoutes);
app.use('/api/integrations', integrationsRoutes);
app.use('/api/organizations', organizationsRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/microservices', microservicesRoutes);
app.use('/api/performance', performanceRoutes);

const PORT = process.env.PORT || 5000;

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join user-specific room for personalized notifications
  socket.on('join-user-room', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`User ${userId} joined their room`);
  });

  // Join experience-specific room for availability updates
  socket.on('join-experience-room', (experienceId) => {
    socket.join(`experience_${experienceId}`);
    console.log(`User joined experience room: ${experienceId}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Make io available to routes
app.set('io', io);

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('Received shutdown signal, closing server gracefully...');

  server.close(async () => {
    console.log('HTTP server closed');

    // Close microservices components
    await apiGateway.shutdown();
    serviceMesh.shutdown();
    distributedTracer.cleanup();
    await cacheManager.close();
    performanceMonitor.shutdown();
    databaseOptimizer.shutdown();

    process.exit(0);
  });

  // Force close after 10 seconds
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('WebSocket server initialized');
    console.log('Microservices infrastructure initialized');
    // Start the reminder email scheduler
    startReminderScheduler();
  });
}).catch(err => {
  console.error('Failed to connect DB:', err);
  process.exit(1);
});
