const express = require('express');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { auditLogger } = require('../middleware/auditLog');
const { getInventory, createInventoryItem, updateInventoryItem, createSupplier, getSuppliers } = require('../controllers/inventory.controller');

const router = express.Router();

router.use(protect);

router.get('/suppliers', authorize('ADMIN', 'PHARMACIST'), getSuppliers);
router.post('/suppliers', authorize('ADMIN', 'PHARMACIST'), auditLogger('Supplier'), createSupplier);
router.get('/', authorize('ADMIN', 'PHARMACIST'), getInventory);
router.post('/', authorize('ADMIN', 'PHARMACIST'), auditLogger('InventoryItem'), createInventoryItem);
router.put('/:id', authorize('ADMIN', 'PHARMACIST'), auditLogger('InventoryItem'), updateInventoryItem);

module.exports = router;
