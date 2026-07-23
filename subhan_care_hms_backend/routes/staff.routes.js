/**
 * Staff Routes
 */
const express = require('express');
const {
  createStaff,
  getStaff,
  getStaffById,
  updateStaff,
  deactivateStaff
} = require('../controllers/staff.controller');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { auditLogger } = require('../middleware/auditLog');

const router = express.Router();

router.use(protect); // All staff routes require auth
router.use(authorize('ADMIN')); // Only admin can manage staff

router.route('/')
  .post(auditLogger('Staff'), createStaff)
  .get(getStaff);

router.route('/:id')
  .get(getStaffById)
  .put(auditLogger('Staff'), updateStaff);

router.patch('/:id/deactivate', auditLogger('Staff'), deactivateStaff);

module.exports = router;
