/**
 * Reports & Analytics Routes
 */
const express = require('express');
const {
  getSummaryReport,
  getRevenueReport,
  getPatientReport,
  getAppointmentReport,
  getInventoryReport
} = require('../controllers/reports.controller');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Protected routes (Admin & Billing Staff only)
router.get('/summary', protect, getSummaryReport);
router.get('/revenue', protect, getRevenueReport);
router.get('/patients', protect, getPatientReport);
router.get('/appointments', protect, getAppointmentReport);
router.get('/inventory', protect, getInventoryReport);

module.exports = router;
