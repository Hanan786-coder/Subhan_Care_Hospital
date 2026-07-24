/**
 * Auth Routes
 */
const express = require('express');
const { loginUser, getMe, forgotPassword, resetPassword } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');
const { auditLogger } = require('../middleware/auditLog');

const router = express.Router();

router.post('/login', auditLogger('User'), loginUser);
router.post('/forgot-password', auditLogger('User'), forgotPassword);
router.post('/reset-password', auditLogger('User'), resetPassword);
router.get('/me', protect, getMe);

module.exports = router;
