const Consultation = require('../models/Consultation');
const Appointment = require('../models/Appointment');
const { safeErrorMessage } = require('../utils/validators');
const MedicalHistory = require('../models/MedicalHistory');
const Prescription = require('../models/Prescription');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');

const buildId = async (model, prefix) => {
  const count = await model.countDocuments();
  return `${prefix}${String(count + 1).padStart(5, '0')}`;
};

const createConsultation = async (req, res) => {
  try {
    const { appointmentId, symptoms = [], diagnosis, notes, followUpInstructions = '', prescriptionItems = [] } = req.body;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ success: false, error: 'Appointment not found' });
    }

    const patient = await Patient.findById(appointment.patientId);
    const doctor = await Doctor.findById(appointment.doctorId);
    if (!patient || !doctor) {
      return res.status(404).json({ success: false, error: 'Related patient or doctor not found' });
    }

    if (req.user.role === 'DOCTOR') {
      if (req.user.linkedEntityId && req.user.linkedEntityId.toString() !== appointment.doctorId.toString()) {
        return res.status(403).json({ success: false, error: 'Not authorized: You can only create consultations for your own appointments' });
      }
    }

    const consultationId = await buildId(Consultation, 'SC-CON-');
    const consultation = await Consultation.create({
      consultationId,
      appointmentId,
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      symptoms,
      diagnosis,
      notes,
      followUpInstructions,
      prescriptionSnapshot: prescriptionItems,
      status: 'Open',
      createdBy: req.user._id
    });

    appointment.status = 'Completed';
    await appointment.save();

    const medicalHistory = await MedicalHistory.create({
      consultationId: consultation._id,
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      visitDate: new Date(),
      symptoms,
      diagnosis,
      notes,
      followUpInstructions,
      prescriptions: [],
      createdBy: req.user._id
    });

    res.status(201).json({ success: true, data: { consultation, medicalHistory } });
  } catch (error) {
    res.status(500).json({ success: false, error: safeErrorMessage(error) });
  }
};

const completeConsultation = async (req, res) => {
  try {
    const consultation = await Consultation.findById(req.params.id);
    if (!consultation) {
      return res.status(404).json({ success: false, error: 'Consultation not found' });
    }

    if (req.user.role === 'DOCTOR') {
      if (req.user.linkedEntityId && req.user.linkedEntityId.toString() !== consultation.doctorId.toString()) {
        return res.status(403).json({ success: false, error: 'Not authorized: You can only complete your own consultations' });
      }
    }

    consultation.status = 'Completed';
    consultation.completedAt = new Date();
    consultation.version += 1;
    consultation.versionHistory.push({
      version: consultation.version,
      updatedBy: req.user._id,
      changes: 'Consultation marked as completed'
    });
    await consultation.save();

    await MedicalHistory.findOneAndUpdate(
      { consultationId: consultation._id },
      { $set: { version: consultation.version, immutable: true } }
    );

    res.json({ success: true, data: consultation });
  } catch (error) {
    res.status(500).json({ success: false, error: safeErrorMessage(error) });
  }
};

const getConsultations = async (req, res) => {
  try {
    const filter = {};
    if (req.query.patientId) filter.patientId = req.query.patientId;
    if (req.query.doctorId) filter.doctorId = req.query.doctorId;
    const consultations = await Consultation.find(filter)
      .populate('patientId', 'patientId fullName')
      .populate('doctorId', 'doctorId fullName specialization')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: consultations });
  } catch (error) {
    res.status(500).json({ success: false, error: safeErrorMessage(error) });
  }
};

module.exports = {
  createConsultation,
  completeConsultation,
  getConsultations
};
