/**
 * Main application entry point
 * Sets up Express server, middleware, and routes.
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');

// Initialize Express app
const app = express();
app.set('trust proxy', true);

// Connect to database
connectDB();

const helmet = require('helmet');
const crypto = require('crypto');

// Security Headers via Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'", "http://localhost:3000", "http://localhost:5000", "http://127.0.0.1:3000", "http://127.0.0.1:5000"]
    }
  },
  crossOriginEmbedderPolicy: false,
  frameguard: { action: 'deny' },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  noSniff: true
}));

// Request Correlation ID Middleware
app.use((req, res, next) => {
  req.correlationId = req.headers['x-correlation-id'] || crypto.randomUUID();
  res.setHeader('x-correlation-id', req.correlationId);
  next();
});

// CORS Configuration (Restrict allowed origins)
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:3000', 'http://localhost:5000', 'http://127.0.0.1:3000', 'http://127.0.0.1:5000'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl, same-origin)
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS policy does not allow access from origin ${origin}`), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-correlation-id', 'x-auth-token']
}));

// Dotfile blocking middleware (prevents direct URL access to .env, .git, etc.)
app.use((req, res, next) => {
  if (req.path.includes('/.') || req.path.startsWith('/.') || req.url.includes('/.')) {
    return res.status(403).json({ success: false, error: 'Forbidden: Access to hidden files is denied' });
  }
  next();
});

const rateLimit = require('express-rate-limit');
// Global API rate limiter (prevents DDoS & brute force scanning)
const globalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // max 300 requests per 15 min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests. Please slow down.' }
});
app.use('/api', globalApiLimiter);

app.use(express.json({ limit: '1mb' }));
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Routes
const authRoutes = require('./routes/auth.routes');
const patientRoutes = require('./routes/patient.routes');
const doctorRoutes = require('./routes/doctor.routes');
const staffRoutes = require('./routes/staff.routes');
const appointmentRoutes = require('./routes/appointment.routes');
const consultationRoutes = require('./routes/consultation.routes');
const prescriptionRoutes = require('./routes/prescription.routes');
const medicalHistoryRoutes = require('./routes/medicalHistory.routes');
const inventoryRoutes = require('./routes/inventory.routes');
const billingRoutes = require('./routes/billing.routes');
const auditLogRoutes = require('./routes/auditLog.routes');
const reportsRoutes = require('./routes/reports.routes');

app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/consultations', consultationRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/medical-history', medicalHistoryRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/reports', reportsRoutes);

// Basic route
app.get('/', (req, res) => {
  res.send('Subhan Care HMS API is running...');
});

// Global Error Handler Middleware with Correlation ID & Safe Error Reporting
const { formatErrorMessage } = require('./utils/validators');
app.use((err, req, res, next) => {
  const correlationId = req.correlationId || crypto.randomUUID();
  console.error(`[Error ID: ${correlationId}] Unhandled Server Error:`, err.message);
  if (process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }

  const isProduction = process.env.NODE_ENV === 'production';
  const cleanMsg = isProduction 
    ? 'An internal error occurred while processing the request' 
    : formatErrorMessage(err);

  res.status(err.status || 500).json({
    success: false,
    error: cleanMsg,
    correlationId
  });
});

// Port configuration
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
