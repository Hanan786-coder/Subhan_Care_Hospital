/**
 * Patient Model
 * Stores comprehensive patient demographic and medical profile information.
 */
const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  patientId: {
    type: String,
    required: true,
    unique: true
  },
  fullName: {
    type: String,
    required: true
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    required: true
  },
  cnic: {
    type: String,
    required: true,
    unique: true
  },
  contactNumber: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String // Added per feedback
  },
  occupation: {
    type: String // Added per feedback
  },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'],
    default: 'Unknown'
  },
  allergies: [{
    name: String,
    severity: {
      type: String,
      enum: ['Mild', 'Moderate', 'Severe'], // Needed for 2.3 Allergy Severity Colour Coding
      default: 'Mild'
    }
  }],
  maritalStatus: {
    type: String,
    enum: ['Single', 'Married', 'Divorced', 'Widowed', 'Other'],
    default: 'Single'
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  registeredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: { createdAt: 'registrationDate', updatedAt: 'updatedAt' } });

module.exports = mongoose.model('Patient', patientSchema);
