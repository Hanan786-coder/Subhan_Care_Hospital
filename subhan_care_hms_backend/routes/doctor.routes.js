/**
 * Doctor Routes
 */
const express = require('express');
const {
  createDoctor,
  getDoctors,
  getDoctorById,
  getMyDoctorProfile,
  updateDoctor,
  updateSchedule,
  deactivateDoctor
} = require('../controllers/doctor.controller');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { auditLogger } = require('../middleware/auditLog');

const router = express.Router();

router.use(protect); // All doctor routes require auth

router.get('/me', authorize('DOCTOR'), getMyDoctorProfile);

router.route('/')
  .post(authorize('ADMIN'), auditLogger('Doctor'), createDoctor)
  .get(authorize('ADMIN', 'RECEPTIONIST', 'DOCTOR'), getDoctors);

router.route('/:id')
  .get(authorize('ADMIN', 'RECEPTIONIST', 'DOCTOR'), getDoctorById)
  .put(authorize('ADMIN', 'DOCTOR'), auditLogger('Doctor'), updateDoctor);

router.put('/:id/schedule', authorize('ADMIN', 'DOCTOR'), auditLogger('Doctor'), updateSchedule);
router.patch('/:id/deactivate', authorize('ADMIN'), auditLogger('Doctor'), deactivateDoctor);

module.exports = router;
