const express = require('express');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { auditLogger } = require('../middleware/auditLog');
const { getMedicalHistory, addHistoryCorrection } = require('../controllers/medicalHistory.controller');

const router = express.Router();

router.use(protect);

router.get('/', authorize('ADMIN', 'DOCTOR'), getMedicalHistory);
router.put('/:id/correct', authorize('DOCTOR'), auditLogger('MedicalHistory'), addHistoryCorrection);

module.exports = router;
