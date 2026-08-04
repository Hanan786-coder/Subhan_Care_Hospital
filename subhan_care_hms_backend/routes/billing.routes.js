const express = require('express');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { auditLogger } = require('../middleware/auditLog');
const { getInvoices, createInvoice, recordPayment } = require('../controllers/billing.controller');

const router = express.Router();

router.use(protect);

router.get('/', authorize('ADMIN', 'BILLING_STAFF'), getInvoices);
router.post('/', authorize('ADMIN', 'BILLING_STAFF'), auditLogger('Invoice'), createInvoice);
router.put('/:id/payment', authorize('ADMIN', 'BILLING_STAFF'), auditLogger('Invoice'), recordPayment);

module.exports = router;
