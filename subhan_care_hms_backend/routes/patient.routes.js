/**
 * Patient Routes
 */
const express = require('express');
const {
  registerPatient,
  getPatients,
  getPatientById,
  updatePatient,
  deactivatePatient
} = require('../controllers/patient.controller');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { auditLogger } = require('../middleware/auditLog');

const router = express.Router();

router.use(protect); // All patient routes require auth

router.route('/')
  .post(
    authorize('ADMIN', 'RECEPTIONIST'), 
    auditLogger('Patient'), 
    registerPatient
  )
  .get(
    authorize('ADMIN', 'RECEPTIONIST', 'DOCTOR', 'PHARMACIST', 'BILLING_STAFF'), 
    getPatients
  );

router.route('/:id')
  .get(
    authorize('ADMIN', 'RECEPTIONIST', 'DOCTOR', 'PHARMACIST', 'BILLING_STAFF'), 
    getPatientById
  )
  .put(
    authorize('ADMIN', 'RECEPTIONIST'), 
    auditLogger('Patient'), 
    updatePatient
  );

router.patch('/:id/deactivate', 
  authorize('ADMIN'), 
  auditLogger('Patient'), 
  deactivatePatient
);

module.exports = router;
