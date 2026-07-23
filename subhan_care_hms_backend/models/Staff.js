/**
 * Staff Model
 * Stores administrative and support staff profiles.
 */
const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
  staffId: {
    type: String,
    required: true,
    unique: true
  },
  fullName: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['RECEPTIONIST', 'PHARMACIST', 'BILLING_STAFF'],
    required: true
  },
  contactInfo: {
    phone: String,
    email: String,
    address: String
  },
  shiftTiming: {
    start: String, // e.g., '08:00'
    end: String,   // e.g., '16:00'
    days: [String] // e.g., ['Monday', 'Tuesday', ...]
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

module.exports = mongoose.model('Staff', staffSchema);
