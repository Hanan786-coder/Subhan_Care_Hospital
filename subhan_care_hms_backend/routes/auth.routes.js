/**
 * Auth Routes
 */
const express = require('express');
const { loginUser, getMe, forgotPassword, resetPassword, verifyOTP, updateProfile, changePassword, verifyPasswordChangeOtp, confirmPasswordChange, deleteAccount } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');
const { auditLogger } = require('../middleware/auditLog');

const rateLimit = require('express-rate-limit');

// Rate limiting: 5 attempts per minute per IP for login
const loginLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many login attempts from this IP. Please try again after 1 minute.'
  }
});

// Rate limiting: 3 attempts per hour per IP for password reset & OTP
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many password reset attempts from this IP. Please try again after 1 hour.'
  }
});

const router = express.Router();

router.post('/login', loginLimiter, auditLogger('User'), loginUser);
router.post('/forgot-password', passwordResetLimiter, auditLogger('User'), forgotPassword);
router.post('/verify-otp', passwordResetLimiter, auditLogger('User'), verifyOTP);
router.post('/reset-password', passwordResetLimiter, auditLogger('User'), resetPassword);
router.get('/me', protect, getMe);

router.put('/profile', protect, auditLogger('User'), updateProfile);
router.put('/change-password', protect, passwordResetLimiter, auditLogger('User'), changePassword);
router.post('/verify-password-change', protect, passwordResetLimiter, auditLogger('User'), verifyPasswordChangeOtp);
router.put('/confirm-password-change', protect, passwordResetLimiter, auditLogger('User'), confirmPasswordChange);
router.delete('/account', protect, auditLogger('User'), deleteAccount);

module.exports = router;

