const express = require('express');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { auditLogger } = require('../middleware/auditLog');
const { createConsultation, completeConsultation, getConsultations } = require('../controllers/consultation.controller');

const router = express.Router();

router.use(protect);

router.get('/', authorize('ADMIN', 'DOCTOR'), getConsultations);
router.post('/', authorize('ADMIN', 'DOCTOR'), auditLogger('Consultation'), createConsultation);
router.put('/:id/complete', authorize('ADMIN', 'DOCTOR'), auditLogger('Consultation'), completeConsultation);

module.exports = router;
