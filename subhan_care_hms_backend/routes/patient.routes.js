/**
 * Patient Routes
 */
const express = require('express');
const {
  registerPatient,
  getPatients,
  getPatientById,
  updatePatient,
  deletePatient
} = require('../controllers/patient.controller');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { auditLogger } = require('../middleware/auditLog');

const router = express.Router();

router.use(protect); // All patient routes require auth

router.route('/')
  .post(
    authorize('RECEPTIONIST'), 
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
  )
  .delete(
    authorize('ADMIN'),
    auditLogger('Patient'),
    deletePatient
  );

module.exports = router;
