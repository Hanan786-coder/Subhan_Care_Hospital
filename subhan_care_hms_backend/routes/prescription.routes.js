const express = require('express');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { auditLogger } = require('../middleware/auditLog');
const { createPrescription, getPrescriptions, dispensePrescription } = require('../controllers/prescription.controller');

const router = express.Router();

router.use(protect);

router.get('/', authorize('ADMIN', 'DOCTOR', 'PHARMACIST'), getPrescriptions);
router.post('/', authorize('DOCTOR'), auditLogger('Prescription'), createPrescription);
router.put('/:id/dispense', authorize('ADMIN', 'PHARMACIST'), auditLogger('Prescription'), dispensePrescription);

module.exports = router;
