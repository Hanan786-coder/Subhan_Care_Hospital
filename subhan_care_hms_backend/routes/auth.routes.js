/**
 * Auth Routes
 */
const express = require('express');
const { loginUser, getMe } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');
const { auditLogger } = require('../middleware/auditLog');

const router = express.Router();

router.post('/login', auditLogger('User'), loginUser);
router.get('/me', protect, getMe);

module.exports = router;
