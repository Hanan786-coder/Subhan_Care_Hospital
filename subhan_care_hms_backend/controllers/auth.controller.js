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

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  loginUser,
  getMe
};
