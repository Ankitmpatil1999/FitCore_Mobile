require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 7000;

// ── CORS CONFIGURATION ───────────────────────────────────
// Restrict to known web origins — mobile app (React Native) is not affected by CORS
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:5174,http://localhost:3000').split(',').map(o => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, curl)
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS: Origin '${origin}' not allowed.`), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── SECURITY HEADERS ─────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: false, // Allow static uploads on mobile
}));

// ── NOSQL INJECTION SANITIZATION ─────────────────────────
// Strips MongoDB operator keys ($gt, $ne etc.) from all request inputs
function sanitizeMongoInput(obj) {
  if (Array.isArray(obj)) return obj.map(sanitizeMongoInput);
  if (obj !== null && typeof obj === 'object') {
    const clean = {};
    for (const key of Object.keys(obj)) {
      // Block MongoDB operators in keys
      if (key.startsWith('$') || key.includes('.')) continue;
      clean[key] = sanitizeMongoInput(obj[key]);
    }
    return clean;
  }
  return obj;
}

app.use((req, res, next) => {
  if (req.body) req.body = sanitizeMongoInput(req.body);
  if (req.query) req.query = sanitizeMongoInput(req.query);
  if (req.params) req.params = sanitizeMongoInput(req.params);
  next();
});

// ── RATE LIMITING ─────────────────────────────────────────
// Strict limit on auth endpoints — 10 attempts per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  skipSuccessfulRequests: false,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many login attempts. Please wait 15 minutes and try again.',
  },
});

// General API rate limit — 300 requests per 15 minutes per IP
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests. Please slow down.',
  },
});


// ── STANDARD MIDDLEWARE ───────────────────────────────────
app.use(morgan('dev'));
app.use(compression());
app.use(cookieParser());
app.use(express.json({ limit: '10mb' })); // Reduced from 50mb — no reason to allow 50mb JSON
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply general rate limit to all API routes
app.use('/api/', generalLimiter);

// ── STATIC UPLOADS ────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── DATABASE ──────────────────────────────────────────────
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

prisma.$connect()
  .then(() => console.log('🔌 Successfully connected to MongoDB database.'))
  .catch((err) => {
    console.error('❌ MongoDB Connection Error:', err.message);
    console.log('⚠️  Please make sure MongoDB is running on port 27017.');
  });

// ── AUTH MIDDLEWARE ───────────────────────────────────────
const { verifyToken, requireRole } = require('./src/middleware/auth');

// ── ROUTE IMPORTS ─────────────────────────────────────────
const authRoutes = require('./src/routes/auth');
const vendorRoutes = require('./src/routes/vendors');
const productRoutes = require('./src/routes/products');
const orderRoutes = require('./src/routes/orders');
const analyticsRoutes = require('./src/routes/analytics');
const notificationRoutes = require('./src/routes/notifications');
const memberRoutes = require('./src/routes/memberRoutes');
const exerciseRoutes = require('./src/routes/exerciseRoutes');
const adminRoutes = require('./src/routes/admin');
const gymAdminRoutes = require('./src/routes/gymAdmin');
const gymOpsRoutes = require('./src/routes/gymOps');

// ── PUBLIC ROUTES (No auth required) ─────────────────────
// Apply strict rate limiting to all auth endpoints
app.use('/api/auth', authLimiter, authRoutes);

// Exercises & products are public (browsable without login)
app.use('/api/exercises', exerciseRoutes);
app.use('/api/products', productRoutes);

// ── PROTECTED ROUTES (JWT required) ──────────────────────
// Super Admin & Admin — web portal dashboard
app.use('/api/admin',
  verifyToken,
  requireRole('super_admin', 'admin'),
  adminRoutes
);

// Gym Admin + Super Admin — gym franchise management
app.use('/api/gym-admin',
  verifyToken,
  requireRole('super_admin', 'admin', 'gym_owner'),
  gymAdminRoutes
);
app.use('/api/gym-admin',
  verifyToken,
  requireRole('super_admin', 'admin', 'gym_owner'),
  gymOpsRoutes
);

// Members — self-service APIs (any authenticated user for their own data)
app.use('/api/members', verifyToken, memberRoutes);

// Vendors — vendor store management
app.use('/api/vendors', verifyToken, vendorRoutes);

// Orders — authenticated purchase flow
app.use('/api/orders', verifyToken, orderRoutes);

// Analytics — vendor and admin analytics
app.use('/api/analytics', verifyToken, analyticsRoutes);

// Notifications — authenticated broadcast/read
app.use('/api/notifications', verifyToken, notificationRoutes);

// ── SWAGGER DOCUMENTATION ────────────────────────────────
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./src/config/swagger');
// Only serve Swagger in non-production environments
if (process.env.NODE_ENV !== 'production') {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  console.log('📄 Swagger docs: http://localhost:' + PORT + '/api-docs');
}

// ── BASE ROUTE ────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    message: 'FitCore API 🏋️',
    status: 'healthy',
    version: '2.0.0',
  });
});

// ── UPLOADS FOLDER ────────────────────────────────────────
const fs = require('fs');
if (!fs.existsSync('./uploads')) {
  fs.mkdirSync('./uploads');
}

// ── ERROR HANDLING ────────────────────────────────────────
// CORS errors
app.use((err, req, res, next) => {
  if (err.message && err.message.startsWith('CORS:')) {
    return res.status(403).json({ success: false, error: err.message });
  }
  next(err);
});

// Generic error handler — never expose internal error details to client
app.use((err, req, res, next) => {
  console.error('💥 Server Error:', err.stack);
  const status = err.status || err.statusCode || 500;
  // In production, never send stack traces or internal messages
  const message = process.env.NODE_ENV === 'production'
    ? 'An internal server error occurred.'
    : (err.message || 'Internal Server Error');
  res.status(status).json({ success: false, error: message });
});

// ── START SERVER ──────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 FitCore Server running on http://localhost:${PORT}`);
  console.log(`🔐 Security: Rate limiting ✅ | Auth middleware ✅ | CORS restricted ✅ | NoSQL sanitization ✅`);
  if (!process.env.JWT_SECRET) {
    console.warn('⚠️  WARNING: JWT_SECRET not set in .env! Set it before production deployment.');
  }
});

module.exports = app;
