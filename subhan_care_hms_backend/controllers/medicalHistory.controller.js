const MedicalHistory = require('../models/MedicalHistory');
const Doctor = require('../models/Doctor');
const { safeErrorMessage } = require('../utils/validators');

const getMedicalHistory = async (req, res) => {
  try {
    const filter = {};
    if (req.query.patientId) filter.patientId = req.query.patientId;

    if (req.user.role === 'DOCTOR') {
      if (!req.user.linkedEntityId) {
        return res.status(403).json({ success: false, error: 'Doctor profile is not linked to this account' });
      }
      filter.doctorId = req.user.linkedEntityId;
    }

    const history = await MedicalHistory.find(filter)
      .populate('patientId', 'patientId fullName bloodGroup gender')
      .populate('doctorId', 'doctorId fullName specialization')
      .populate('consultationId', 'consultationId diagnosis notes followUpInstructions')
      .sort({ visitDate: -1 });

    res.json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, error: safeErrorMessage(error) });
  }
};

const addHistoryCorrection = async (req, res) => {
  try {
    const history = await MedicalHistory.findById(req.params.id);
    if (!history) {
      return res.status(404).json({ success: false, error: 'History entry not found' });
    }

    if (req.user.role === 'DOCTOR') {
      if (!req.user.linkedEntityId) {
        return res.status(403).json({ success: false, error: 'Doctor profile is not linked to this account' });
      }
      if (history.doctorId.toString() !== req.user.linkedEntityId.toString()) {
        return res.status(403).json({ success: false, error: 'You are not authorized to correct this medical history entry' });
      }
    }

    history.version += 1;
    history.correctionNotes = req.body.correctionNotes;
    await history.save();

    res.json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, error: safeErrorMessage(error) });
  }
};

module.exports = {
  getMedicalHistory,
  addHistoryCorrection
};
