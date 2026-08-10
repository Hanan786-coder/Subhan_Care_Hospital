const express = require('express');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { auditLogger } = require('../middleware/auditLog');
const { getInventory, createInventoryItem, updateInventoryItem, restockInventoryItem, createSupplier, getSuppliers } = require('../controllers/inventory.controller');

const router = express.Router();

router.use(protect);

router.get('/suppliers', authorize('ADMIN', 'PHARMACIST'), getSuppliers);
router.post('/suppliers', authorize('ADMIN', 'PHARMACIST'), auditLogger('Supplier'), createSupplier);
router.get('/', authorize('ADMIN', 'PHARMACIST', 'DOCTOR', 'RECEPTIONIST', 'BILLING_STAFF'), getInventory);
router.post('/', authorize('ADMIN', 'PHARMACIST'), auditLogger('InventoryItem'), createInventoryItem);
router.patch('/:id/restock', authorize('ADMIN', 'PHARMACIST'), auditLogger('InventoryItem'), restockInventoryItem);
router.put('/:id', authorize('ADMIN', 'PHARMACIST'), auditLogger('InventoryItem'), updateInventoryItem);

module.exports = router;
