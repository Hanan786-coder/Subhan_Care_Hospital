const Prescription = require('../models/Prescription');
const Consultation = require('../models/Consultation');
const MedicalHistory = require('../models/MedicalHistory');
const Invoice = require('../models/Invoice');
const Doctor = require('../models/Doctor');
const User = require('../models/User');

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

    const { consultationId, appointmentId, patientId, doctorId, items, pharmacistNotes = '' } = req.body;

    let validConsultationId = null;
    if (consultationId) {
      const consultation = await Consultation.findById(consultationId);
      if (consultation) {
        validConsultationId = consultation._id;
      }
    }

    const docId = doctorId || (req.user.role === 'DOCTOR' ? req.user.linkedEntityId : null);

    const prescriptionId = await buildId(Prescription, 'SC-RX-');
    const prescription = await Prescription.create({
      prescriptionId,
      consultationId: validConsultationId,
      appointmentId: appointmentId || null,
      patientId,
      doctorId: docId,
      items,
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

    res.status(201).json({ success: true, data: prescription });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
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
      .populate('patientId', 'patientId fullName contactNumber cnic')
      .populate('doctorId', 'doctorId fullName specialization')
      .populate('appointmentId', 'appointmentId date timeSlot status')
      .populate('consultationId', 'consultationId diagnosis notes')
      .sort({ issuedAt: -1 });
    res.json({ success: true, data: prescriptions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
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

    res.json({ success: true, data: prescription });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  createPrescription,
  getPrescriptions,
  dispensePrescription
};
