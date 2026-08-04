const Prescription = require('../models/Prescription');
const Consultation = require('../models/Consultation');
const MedicalHistory = require('../models/MedicalHistory');
const Invoice = require('../models/Invoice');

const buildId = async (model, prefix) => {
  const count = await model.countDocuments();
  return `${prefix}${String(count + 1).padStart(5, '0')}`;
};

const createPrescription = async (req, res) => {
  try {
    const { consultationId, appointmentId, patientId, doctorId, items, pharmacistNotes = '' } = req.body;

    const consultation = await Consultation.findById(consultationId);
    if (!consultation) {
      return res.status(404).json({ success: false, error: 'Consultation not found' });
    }

    const prescriptionId = await buildId(Prescription, 'SC-RX-');
    const prescription = await Prescription.create({
      prescriptionId,
      consultationId,
      appointmentId,
      patientId,
      doctorId,
      items,
      pharmacistNotes,
      createdBy: req.user._id
    });

    await MedicalHistory.findOneAndUpdate(
      { consultationId: consultation._id },
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

    res.status(201).json({ success: true, data: prescription });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getPrescriptions = async (req, res) => {
  try {
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
      .populate('patientId', 'patientId fullName')
      .populate('doctorId', 'doctorId fullName')
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
