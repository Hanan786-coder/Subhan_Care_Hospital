/**
 * Doctor Model
 * Stores clinical staff profiles and schedule details.
 */
const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  start: { type: String, required: true }, // e.g., '09:00'
  end: { type: String, required: true }    // e.g., '13:00'
}, { _id: false });

const doctorSchema = new mongoose.Schema({
  doctorId: {
    type: String,
    required: true,
    unique: true
  },
  fullName: {
    type: String,
    required: true
  },
  specialization: {
    type: String,
    required: true
  },
  qualification: {
    type: String,
    required: true
  },
  licenseNumber: {
    type: String,
    required: true,
    unique: true
  },
  contactInfo: {
    phone: String,
    email: String,
    address: String
  },
  consultationFee: {
    type: Number,
    required: true
  },
  schedule: {
    monday: [scheduleSchema],
    tuesday: [scheduleSchema],
    wednesday: [scheduleSchema],
    thursday: [scheduleSchema],
    friday: [scheduleSchema],
    saturday: [scheduleSchema],
    sunday: [scheduleSchema]
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

module.exports = mongoose.model('Doctor', doctorSchema);
