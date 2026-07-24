/**
 * User Account Model
 * Stores authentication credentials, role mapping, and lockout data.
 */
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please add a valid email']
  },
  passwordHash: {
    type: String,
    required: true,
    select: false // Do not return in queries by default
  },
  role: {
    type: String,
    enum: ['ADMIN', 'DOCTOR', 'RECEPTIONIST', 'PHARMACIST', 'BILLING_STAFF'],
    required: true
  },
  linkedEntityId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'entityModel'
  },
  entityModel: {
    type: String,
    enum: ['Doctor', 'Staff', null],
    default: null
  },
  lastLogin: {
    type: Date
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'locked'],
    default: 'active'
  },
  failedAttempts: {
    type: Number,
    default: 0
  },
  lockoutUntil: {
    type: Date
  },
  resetPasswordToken: {
    type: String
  },
  resetPasswordExpire: {
    type: Date
  }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('passwordHash')) {
    return;
  }
  const salt = await bcrypt.genSalt(12);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.passwordHash);
};

module.exports = mongoose.model('User', userSchema);
