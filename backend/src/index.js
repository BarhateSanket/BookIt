require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const experiencesRoutes = require('./routes/experiences');
const bookingsRoutes = require('./routes/bookings');
const promoRoutes = require('./routes/promo');
const authRoutes = require('./routes/auth');
const paymentsRoutes = require('./routes/payments');

const app = express();
// Configure CORS
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Stripe webhook must use raw body, mount it before JSON parser
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), require('./routes/paymentsWebhook'));

// Parse JSON bodies for everything else
app.use(express.json());

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

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}).catch(err => {
  console.error('Failed to connect DB:', err);
  process.exit(1);
});
