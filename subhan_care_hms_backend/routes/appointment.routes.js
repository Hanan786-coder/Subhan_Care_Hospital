/**
 * Appointment Routes
 */
const express = require('express');
const { getAppointments, bookAppointment, rescheduleAppointment, cancelAppointment, completeAppointment, getAvailableAppointmentSlots } = require('../controllers/appointment.controller');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { auditLogger } = require('../middleware/auditLog');

const router = express.Router();

router.use(protect);

router.get('/', authorize('RECEPTIONIST', 'ADMIN', 'DOCTOR'), getAppointments);
router.get('/available-slots', authorize('RECEPTIONIST', 'ADMIN', 'DOCTOR'), getAvailableAppointmentSlots);
router.post('/', authorize('RECEPTIONIST', 'ADMIN'), auditLogger('Appointment'), bookAppointment);
router.put('/:id/reschedule', authorize('RECEPTIONIST', 'ADMIN'), auditLogger('Appointment'), rescheduleAppointment);
router.put('/:id/cancel', authorize('RECEPTIONIST', 'ADMIN'), auditLogger('Appointment'), cancelAppointment);
router.put('/:id/complete', authorize('DOCTOR', 'ADMIN'), auditLogger('Appointment'), completeAppointment);

module.exports = router;
