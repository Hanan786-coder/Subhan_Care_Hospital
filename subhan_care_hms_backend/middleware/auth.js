/**
 * Authentication Middleware
 * Verifies JWT and handles sliding session (inactivity timeout).
 */
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, error: 'Not authorized to access this route' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if token was issued more than 15 mins ago
    const timeSinceIssue = (Date.now() - (decoded.iat * 1000)) / 1000 / 60;
    
    // Inactivity check handled here. If the token is still valid (it expires in 15 mins),
    // and the user makes a request, we can issue a new one to extend the session.
    // To implement "inactivity" timeout properly, we can set token expiration to 15m.
    // If a request comes in and token is valid but older than say, 2 mins, issue a new one.
    if (timeSinceIssue > 2) {
      const newToken = jwt.sign({ id: decoded.id }, process.env.JWT_SECRET, {
        expiresIn: '15m'
      });
      res.setHeader('x-auth-token', newToken);
    }

    req.user = await User.findById(decoded.id);
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'User not found' });
    }

    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Not authorized or session expired' });
  }
};

module.exports = { protect };
