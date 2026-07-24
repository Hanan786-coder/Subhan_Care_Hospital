/**
 * Authentication Controller
 * Handles user login, logout, and token generation.
 */
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { validatePasswordComplexity } = require('../utils/validators');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '15m'
  });
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).select('+passwordHash');
    
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    if (user.status === 'locked') {
      if (user.lockoutUntil && user.lockoutUntil > Date.now()) {
        return res.status(403).json({ success: false, error: 'Account locked. Try again later.' });
      } else {
        // Unlock
        user.status = 'active';
        user.failedAttempts = 0;
        user.lockoutUntil = null;
        await user.save();
      }
    } else if (user.status === 'inactive') {
      return res.status(403).json({ success: false, error: 'Account is inactive' });
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      user.failedAttempts += 1;
      if (user.failedAttempts >= 5) {
        user.status = 'locked';
        user.lockoutUntil = Date.now() + 15 * 60 * 1000; // 15 mins
      }
      await user.save();
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    // Reset failed attempts on success
    user.failedAttempts = 0;
    user.lockoutUntil = null;
    user.lastLogin = Date.now();
    await user.save();

    const token = generateToken(user._id);

    // Return user without password
    const userResponse = await User.findById(user._id);

    res.status(200).json({
      success: true,
      token,
      user: userResponse
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const crypto = require('crypto');

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Forgot Password - Generates reset token (valid for 15 mins per SR-11)
 */
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, error: 'No user found with that email address' });
    }

    if (user.status === 'inactive') {
      return res.status(403).json({ success: false, error: 'Account is inactive' });
    }

    // Generate unhashed reset token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash token and set to resetPasswordToken field
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Set expire: 15 minutes (SR-11)
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset token generated successfully. Valid for 15 minutes.',
      resetToken // Return token for dev / verification workflow
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Reset Password - Uses reset token to set new password
 */
const resetPassword = async (req, res) => {
  const { token, password } = req.body;

  try {
    if (!token || !password) {
      return res.status(400).json({ success: false, error: 'Token and new password are required' });
    }

    // Hash token from request to compare with DB
    const resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, error: 'Invalid or expired password reset token' });
    }

    // Validate password complexity if needed (or basic length check if standard)
    if (password.length < 8) {
      return res.status(400).json({ success: false, error: 'Password must be at least 8 characters long' });
    }

    // Update password
    user.passwordHash = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    user.failedAttempts = 0;
    user.lockoutUntil = null;
    if (user.status === 'locked') {
      user.status = 'active';
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successful. You can now log in with your new password.'
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  loginUser,
  getMe,
  forgotPassword,
  resetPassword
};
