const express = require('express');
const router = express.Router();
const { getAuditLogs } = require('../controllers/auditLog.controller');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

// All authenticated staff members can view audit logs
router.get('/', protect, authorize('ADMIN', 'DOCTOR', 'RECEPTIONIST', 'PHARMACIST', 'BILLING_STAFF'), getAuditLogs);

module.exports = router;
