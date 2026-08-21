/**
 * Main application entry point for AI Studio
 * Runs Express backend API and mounts Vite frontend middleware on port 3000
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const connectDB = require('./subhan_care_hms_backend/config/db');

const app = express();

// Initialize Database connection (handles MongoMemoryServer fallback & auto-seeding)
connectDB();

const helmet = require('helmet');
const crypto = require('crypto');

// Middlewares
app.use(helmet({
  contentSecurityPolicy: false, // Vite Dev server needs flexibility in dev mode
  frameguard: { action: 'deny' },
  hsts: {
    maxAge: 31536000,
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

const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:3000', 'http://localhost:5000', 'http://127.0.0.1:3000', 'http://127.0.0.1:5000'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS policy does not allow access from origin ${origin}`), false);
  },
  credentials: true
}));
app.use(express.json({ limit: '1mb' }));
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Backend API Routes
const authRoutes = require('./subhan_care_hms_backend/routes/auth.routes');
const patientRoutes = require('./subhan_care_hms_backend/routes/patient.routes');
const doctorRoutes = require('./subhan_care_hms_backend/routes/doctor.routes');
const staffRoutes = require('./subhan_care_hms_backend/routes/staff.routes');
const appointmentRoutes = require('./subhan_care_hms_backend/routes/appointment.routes');
const consultationRoutes = require('./subhan_care_hms_backend/routes/consultation.routes');
const prescriptionRoutes = require('./subhan_care_hms_backend/routes/prescription.routes');
const medicalHistoryRoutes = require('./subhan_care_hms_backend/routes/medicalHistory.routes');
const inventoryRoutes = require('./subhan_care_hms_backend/routes/inventory.routes');
const billingRoutes = require('./subhan_care_hms_backend/routes/billing.routes');
const auditLogRoutes = require('./subhan_care_hms_backend/routes/auditLog.routes');
const reportsRoutes = require('./subhan_care_hms_backend/routes/reports.routes');

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

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Subhan Care HMS API' });
});

// Graceful Mongoose Error Handling Middleware with Correlation ID
app.use((err, req, res, next) => {
  const correlationId = req.correlationId || crypto.randomUUID();
  if (err.name === 'MongooseError' || err.name === 'MongoNetworkError' || (err.message && err.message.includes('buffering timed out'))) {
    console.warn(`[${correlationId}] Database offline error caught in middleware`);
    if (req.method === 'GET') {
      return res.json(req.path.endsWith('s') || req.path.endsWith('s/') ? [] : {});
    }
    return res.status(503).json({ success: false, error: 'Database service temporarily unavailable', correlationId });
  }
  
  console.error(`[Error ID: ${correlationId}] Server error:`, err.message);
  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'An internal error occurred while processing the request' : err.message,
    correlationId
  });
});

// Frontend setup (Vite dev middleware or static serving)
const frontendPath = path.resolve(__dirname, 'subhan_care_hms_frontend');

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    try {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
        root: frontendPath,
      });
      app.use(vite.middlewares);
    } catch (viteErr) {
      console.warn('Vite dev server failed to start middleware, falling back to static build:', viteErr.message);
      app.use(express.static(path.join(frontendPath, 'dist')));
      app.get('*', (req, res) => {
        res.sendFile(path.join(frontendPath, 'dist', 'index.html'));
      });
    }
  } else {
    app.use(express.static(path.join(frontendPath, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(frontendPath, 'dist', 'index.html'));
    });
  }

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Subhan Care HMS application running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
