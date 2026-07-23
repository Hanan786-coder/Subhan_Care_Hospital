/**
 * Appointment Model
 * Manages scheduling, reschedules, and conflicts.
 */
const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  appointmentId: {
    type: String,
    required: true,
    unique: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  timeSlot: {
    start: { type: String, required: true },
    end: { type: String, required: true }
  },
  status: {
    type: String,
    enum: ['Scheduled', 'Completed', 'Cancelled', 'No-Show', 'Rescheduled'],
    default: 'Scheduled'
  },
  reasonForCancellation: {
    type: String
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Appointment', appointmentSchema);
