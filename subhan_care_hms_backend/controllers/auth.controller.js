/**
 * Authentication Controller
 * Handles user login, logout, and token generation.
 */
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
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
    const normalizedEmail = email ? String(email).trim().toLowerCase() : '';
    const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');
    
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid email or password. Please check your credentials.' });
    }

    if (user.status === 'locked') {
      if (user.lockoutUntil && user.lockoutUntil > Date.now()) {
        return res.status(403).json({ success: false, error: 'Account locked due to multiple failed login attempts. Try again later.' });
      } else {
        // Unlock
        user.status = 'active';
        user.failedAttempts = 0;
        user.lockoutUntil = null;
        await user.save();
      }
    } else if (user.status === 'inactive') {
      return res.status(403).json({ success: false, error: 'Account is inactive. Please contact system administrator.' });
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      user.failedAttempts += 1;
      if (user.failedAttempts >= 5) {
        user.status = 'locked';
        user.lockoutUntil = Date.now() + 15 * 60 * 1000; // 15 mins
      }
      await user.save();
      return res.status(401).json({ success: false, error: 'Invalid email or password. Please check your credentials.' });
    }

    // Reset failed attempts on success
    user.failedAttempts = 0;
    user.lockoutUntil = null;
    user.lastLogin = Date.now();
    await user.save();

    // Log LOGIN audit event
    try {
      await AuditLog.create({
        userId: user._id,
        action: 'LOGIN',
        affectedEntity: 'User',
        affectedRecordId: user.userId,
        details: { email: user.email, role: user.role },
        ipAddress: req.ip || req.connection?.remoteAddress || '127.0.0.1'
      });
    } catch (auditErr) {
      console.error('Failed to create login audit log:', auditErr.message);
    }

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
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

/**
 * Helper to send email using SMTP or fallback to simulated file logging
 */
const sendEmail = async ({ to, subject, text, html }) => {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    try {
      const transporter = nodemailer.createTransport({
        host,
        port: parseInt(port, 10),
        secure: port == 465,
        auth: { user, pass }
      });
      await transporter.sendMail({
        from: `"Subhan Care HMS" <${user}>`,
        to,
        subject,
        text,
        html
      });
      console.log(`Email successfully sent to ${to} via SMTP`);
      return;
    } catch (smtpError) {
      console.error('SMTP sending failed, falling back to local file logging:', smtpError);
    }
  }

  // Fallback: Write email to a local directory "sent_emails" and log to console
  const emailsDir = path.join(__dirname, '..', 'sent_emails');
  if (!fs.existsSync(emailsDir)) {
    fs.mkdirSync(emailsDir, { recursive: true });
  }

  const fileName = `${to.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.txt`;
  const filePath = path.join(emailsDir, fileName);
  const content = `To: ${to}\nSubject: ${subject}\nDate: ${new Date().toISOString()}\n\nText Content:\n${text}\n\nHTML Content:\n${html}`;
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`[SIMULATED EMAIL] Reset OTP sent to ${to}. Saved to ${filePath}`);
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Forgot Password - Generates 6-digit numeric OTP (valid for 15 mins per SR-11)
 */
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ success: false, error: 'Please enter your registered email address' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({ success: false, error: 'No account found with this registered email address' });
    }

    if (user.status === 'inactive') {
      return res.status(403).json({ success: false, error: 'Account is inactive. Please contact administrator.' });
    }

    // Generate a 6-digit numeric OTP for user convenience
    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash token and set to resetPasswordToken field
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Set expire: 15 minutes (SR-11)
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

    await user.save();

    // Send email
    const subject = 'Subhan Care HMS — Password Reset OTP';
    const text = `Hello,\n\nYou requested a password reset. Your 6-digit verification OTP is: ${resetToken}\n\nThis OTP is valid for 15 minutes. If you did not request this, please ignore this email.`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #4f46e5; text-align: center;">Subhan Care HMS</h2>
        <p>Hello,</p>
        <p>You requested a password reset. Please use the following 6-digit One-Time Password (OTP) to reset your password:</p>
        <div style="font-size: 24px; font-weight: bold; letter-spacing: 2px; text-align: center; margin: 30px 0; padding: 15px; background-color: #f3f4f6; color: #111827; border-radius: 6px;">
          ${resetToken}
        </div>
        <p style="color: #6b7280; font-size: 14px;">This OTP is valid for 15 minutes. If you did not request this, you can safely ignore this email.</p>
      </div>
    `;

    await sendEmail({ to: email, subject, text, html });

    res.status(200).json({
      success: true,
      message: 'Password reset OTP generated and sent to email successfully. Valid for 15 minutes.',
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
    const resetPasswordToken = crypto.createHash('sha256').update(token.trim()).digest('hex');

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

/**
 * Verify OTP - Confirms if the OTP is valid and not expired
 */
const verifyOTP = async (req, res) => {
  const { token, otp } = req.body;
  const receivedToken = token || otp;

  try {
    if (!receivedToken) {
      return res.status(400).json({ success: false, error: 'OTP code is required' });
    }

    const resetPasswordToken = crypto.createHash('sha256').update(receivedToken.trim()).digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, error: 'Invalid or expired OTP code' });
    }

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully.'
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  loginUser,
  getMe,
  forgotPassword,
  resetPassword,
  verifyOTP
};
