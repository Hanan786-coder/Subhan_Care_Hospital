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

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev')); // Logging

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

// Basic route
app.get('/', (req, res) => {
  res.send('Subhan Care HMS API is running...');
});

// Global Error Handler Middleware
const { formatErrorMessage } = require('./utils/validators');
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  const cleanMsg = formatErrorMessage(err);
  res.status(err.status || 500).json({
    success: false,
    error: cleanMsg
  });
});

// Port configuration
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
