/**
 * Auth Routes
 */
const express = require('express');
const { loginUser, getMe, forgotPassword, resetPassword, verifyOTP, updateProfile, changePassword, verifyPasswordChangeOtp, confirmPasswordChange, deleteAccount } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');
const { auditLogger } = require('../middleware/auditLog');

const router = express.Router();

router.post('/login', auditLogger('User'), loginUser);
router.post('/forgot-password', auditLogger('User'), forgotPassword);
router.post('/verify-otp', auditLogger('User'), verifyOTP);
router.post('/reset-password', auditLogger('User'), resetPassword);
router.get('/me', protect, getMe);

router.put('/profile', protect, auditLogger('User'), updateProfile);
router.put('/change-password', protect, auditLogger('User'), changePassword);
router.post('/verify-password-change', protect, auditLogger('User'), verifyPasswordChangeOtp);
router.put('/confirm-password-change', protect, auditLogger('User'), confirmPasswordChange);
router.delete('/account', protect, auditLogger('User'), deleteAccount);

module.exports = router;

