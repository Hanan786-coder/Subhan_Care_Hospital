const mongoose = require('mongoose');

const prescriptionItemSchema = new mongoose.Schema({
  medicineName: { type: String, required: true },
  dosage: { type: String, required: true },
  frequency: { type: String, required: true },
  duration: { type: String, required: true },
  instructions: { type: String },
  quantity: { type: Number, default: 1 }
}, { _id: false });

const labTestSchema = new mongoose.Schema({
  testName: { type: String, required: true },
  instructions: { type: String }
}, { _id: false });

const prescriptionSchema = new mongoose.Schema({
  prescriptionId: {
    type: String,
    required: true,
    unique: true
  },
  consultationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Consultation',
    required: false
  },
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: false
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
  items: [prescriptionItemSchema],
  precautions: [{ type: String }],
  labTests: [labTestSchema],
  generalAdvice: { type: String },
  followUpDate: { type: String },
  pharmacistNotes: {
    type: String
  },
  status: {
    type: String,
    enum: ['Draft', 'Issued', 'Dispensed', 'Cancelled'],
    default: 'Issued'
  },
  issuedAt: {
    type: Date,
    default: Date.now
  },
  dispensedAt: Date,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Prescription', prescriptionSchema);
