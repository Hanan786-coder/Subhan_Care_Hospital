/**
 * Appointment Routes
 */
const express = require('express');
const { bookAppointment, rescheduleAppointment } = require('../controllers/appointment.controller');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { auditLogger } = require('../middleware/auditLog');

const router = express.Router();

router.use(protect);

router.post('/', authorize('RECEPTIONIST', 'ADMIN'), auditLogger('Appointment'), bookAppointment);
router.put('/:id/reschedule', authorize('RECEPTIONIST', 'ADMIN'), auditLogger('Appointment'), rescheduleAppointment);

module.exports = router;
