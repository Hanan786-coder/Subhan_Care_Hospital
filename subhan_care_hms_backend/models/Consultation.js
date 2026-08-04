const mongoose = require('mongoose');

const prescriptionSnapshotSchema = new mongoose.Schema({
  medicineName: { type: String, required: true },
  dosage: { type: String, required: true },
  frequency: { type: String, required: true },
  duration: { type: String, required: true },
  instructions: { type: String }
}, { _id: false });

const consultationSchema = new mongoose.Schema({
  consultationId: {
    type: String,
    required: true,
    unique: true
  },
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
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
  symptoms: [{ type: String }],
  diagnosis: {
    type: String,
    required: true
  },
  notes: {
    type: String,
    required: true
  },
  followUpInstructions: {
    type: String
  },
  status: {
    type: String,
    enum: ['Open', 'Completed'],
    default: 'Open'
  },
  prescriptionSnapshot: [prescriptionSnapshotSchema],
  version: {
    type: Number,
    default: 1
  },
  versionHistory: [{
    version: Number,
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedAt: { type: Date, default: Date.now },
    changes: String
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  completedAt: Date
}, { timestamps: true });

module.exports = mongoose.model('Consultation', consultationSchema);
