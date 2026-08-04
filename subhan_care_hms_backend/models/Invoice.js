const mongoose = require('mongoose');

const invoiceLineSchema = new mongoose.Schema({
  type: { type: String, enum: ['Consultation', 'Medicine', 'Service'], required: true },
  description: { type: String, required: true },
  quantity: { type: Number, default: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  amount: { type: Number, required: true, min: 0 }
}, { _id: false });

const invoiceSchema = new mongoose.Schema({
  invoiceId: {
    type: String,
    required: true,
    unique: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  consultationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Consultation'
  },
  prescriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prescription'
  },
  items: [invoiceLineSchema],
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Card', 'Bank Transfer', 'E-Wallet', 'Insurance', 'Pending'],
    default: 'Pending'
  },
  status: {
    type: String,
    enum: ['Unpaid', 'Partially Paid', 'Paid', 'Void'],
    default: 'Unpaid'
  },
  subtotal: { type: Number, required: true, min: 0 },
  discount: { type: Number, default: 0, min: 0 },
  tax: { type: Number, default: 0, min: 0 },
  total: { type: Number, required: true, min: 0 },
  amountPaid: { type: Number, default: 0, min: 0 },
  balanceDue: { type: Number, required: true, min: 0 },
  issuedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  issuedAt: {
    type: Date,
    default: Date.now
  },
  paidAt: Date,
  notes: String
}, { timestamps: true });

module.exports = mongoose.model('Invoice', invoiceSchema);
