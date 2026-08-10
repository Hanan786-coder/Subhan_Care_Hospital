const mongoose = require('mongoose');
const Prescription = require('../models/Prescription');
const Consultation = require('../models/Consultation');
const Appointment = require('../models/Appointment');
const MedicalHistory = require('../models/MedicalHistory');
const Invoice = require('../models/Invoice');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const InventoryItem = require('../models/InventoryItem');
const { logAuditEvent } = require('../middleware/auditLog');
const { formatErrorMessage } = require('../utils/validators');

const buildId = async (model, prefix) => {
  const count = await model.countDocuments();
  return `${prefix}${String(count + 1).padStart(5, '0')}`;
};

const ensureDoctorLinked = async (user) => {
  if (user && user.role === 'DOCTOR' && !user.linkedEntityId) {
    let doc = await Doctor.findOne({
      $or: [
        { userId: user._id },
        { 'contactInfo.email': user.email },
        { fullName: new RegExp(user.name, 'i') }
      ]
    });
    if (doc) {
      user.linkedEntityId = doc._id;
      user.entityModel = 'Doctor';
      await User.findByIdAndUpdate(user._id, { linkedEntityId: doc._id, entityModel: 'Doctor' });
      if (!doc.userId) {
        doc.userId = user._id;
        await doc.save();
      }
    }
  }
};

const createPrescription = async (req, res) => {
  try {
    await ensureDoctorLinked(req.user);

    const { consultationId, appointmentId, patientId, doctorId, items = [], precautions = [], labTests = [], generalAdvice = '', followUpDate = '', pharmacistNotes = '' } = req.body;

    // Safely lookup consultation reference without throwing CastError on custom string codes
    let validConsultationId = null;
    if (consultationId) {
      let consultation = null;
      if (mongoose.Types.ObjectId.isValid(consultationId)) {
        consultation = await Consultation.findById(consultationId);
      } else {
        consultation = await Consultation.findOne({ consultationId });
      }
      if (consultation) {
        validConsultationId = consultation._id;
      }
    }

    // Safely lookup appointment reference
    let validAppointmentId = null;
    if (appointmentId) {
      if (mongoose.Types.ObjectId.isValid(appointmentId)) {
        validAppointmentId = appointmentId;
      } else {
        const appt = await Appointment.findOne({ appointmentId });
        if (appt) validAppointmentId = appt._id;
      }
    }

    // Validate that prescribed medicines exist in hospital inventory and have stock
    for (const item of items) {
      if (!item.medicineName) continue;
      let inventoryItem = null;
      if (item.inventoryItemId && mongoose.Types.ObjectId.isValid(item.inventoryItemId)) {
        inventoryItem = await InventoryItem.findById(item.inventoryItemId);
      }
      if (!inventoryItem) {
        inventoryItem = await InventoryItem.findOne({
          name: new RegExp(`^${item.medicineName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')
        });
      }

      if (!inventoryItem) {
        return res.status(400).json({
          success: false,
          error: `Medicine "${item.medicineName}" is not available in hospital inventory.`
        });
      }

      if (inventoryItem.quantityInStock <= 0 || inventoryItem.status === 'Out of Stock') {
        return res.status(400).json({
          success: false,
          error: `Medicine "${inventoryItem.name}" is currently out of stock in hospital inventory.`
        });
      }
    }


    const docId = doctorId || (req.user.role === 'DOCTOR' ? req.user.linkedEntityId : null);
    const prescriptionId = await buildId(Prescription, 'SC-RX-');

    const prescription = await Prescription.create({
      prescriptionId,
      consultationId: validConsultationId,
      appointmentId: validAppointmentId,
      patientId,
      doctorId: docId,
      items,
      precautions,
      labTests,
      generalAdvice,
      followUpDate,
      pharmacistNotes,
      createdBy: req.user._id
    });

    if (validConsultationId) {
      await MedicalHistory.findOneAndUpdate(
        { consultationId: validConsultationId },
        {
          $push: {
            prescriptions: {
              prescriptionId: prescription._id,
              prescriptionNumber: prescription.prescriptionId,
              summary: items.map((item) => `${item.medicineName} ${item.dosage}`).join(', ')
            }
          }
        }
      );
    }

    await logAuditEvent(req, 'CREATE', 'Prescription', prescription._id, {
      prescriptionId: prescription.prescriptionId,
      patientId,
      itemsCount: items.length
    });

    const populatedPrescription = await Prescription.findById(prescription._id)
      .populate('patientId', 'patientId fullName contactNumber cnic gender dateOfBirth age')
      .populate('doctorId', 'doctorId fullName specialization qualification department contactInfo');

    res.status(201).json({ success: true, data: populatedPrescription || prescription });
  } catch (error) {
    res.status(500).json({ success: false, error: formatErrorMessage(error) });
  }
};

const getPrescriptions = async (req, res) => {
  try {
    await ensureDoctorLinked(req.user);

    const filter = {};
    if (req.query.patientId) filter.patientId = req.query.patientId;
    if (req.query.doctorId) filter.doctorId = req.query.doctorId;
    if (req.query.status) filter.status = req.query.status;

    if (req.user.role === 'DOCTOR') {
      if (!req.user.linkedEntityId) {
        return res.status(403).json({ success: false, error: 'Doctor profile is not linked to this account' });
      }
      filter.doctorId = req.user.linkedEntityId;
    }

    const prescriptions = await Prescription.find(filter)
      .populate('patientId', 'patientId fullName contactNumber cnic gender dateOfBirth age')
      .populate('doctorId', 'doctorId fullName specialization qualification department contactInfo')
      .populate('appointmentId', 'appointmentId date timeSlot status')
      .populate('consultationId', 'consultationId diagnosis notes')
      .sort({ issuedAt: -1 });
    res.json({ success: true, data: prescriptions });
  } catch (error) {
    res.status(500).json({ success: false, error: formatErrorMessage(error) });
  }
};

const dispensePrescription = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id);
    if (!prescription) {
      return res.status(404).json({ success: false, error: 'Prescription not found' });
    }

    prescription.status = 'Dispensed';
    prescription.dispensedAt = new Date();
    prescription.pharmacistNotes = req.body.pharmacistNotes || prescription.pharmacistNotes;
    await prescription.save();

    const invoice = await Invoice.findOne({ prescriptionId: prescription._id });
    if (invoice) {
      invoice.status = 'Paid';
      invoice.paymentMethod = req.body.paymentMethod || invoice.paymentMethod;
      invoice.amountPaid = invoice.total;
      invoice.balanceDue = 0;
      invoice.paidAt = new Date();
      await invoice.save();
    }

    await logAuditEvent(req, 'UPDATE', 'Prescription', prescription._id, {
      prescriptionId: prescription.prescriptionId,
      status: 'Dispensed'
    });

    res.json({ success: true, data: prescription });
  } catch (error) {
    res.status(500).json({ success: false, error: formatErrorMessage(error) });
  }
};


module.exports = {
  createPrescription,
  getPrescriptions,
  dispensePrescription
};
