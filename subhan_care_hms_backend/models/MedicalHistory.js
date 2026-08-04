const mongoose = require('mongoose');

const medicalHistoryEntrySchema = new mongoose.Schema({
  consultationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Consultation',
    required: true
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
  visitDate: {
    type: Date,
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
  prescriptions: [{
    prescriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Prescription' },
    prescriptionNumber: String,
    summary: String
  }],
  followUpInstructions: String,
  immutable: {
    type: Boolean,
    default: true
  },
  version: {
    type: Number,
    default: 1
  },
  correctionNotes: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('MedicalHistory', medicalHistoryEntrySchema);
