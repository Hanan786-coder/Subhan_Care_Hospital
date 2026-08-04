const MedicalHistory = require('../models/MedicalHistory');

const getMedicalHistory = async (req, res) => {
  try {
    const filter = {};
    if (req.query.patientId) filter.patientId = req.query.patientId;
    const history = await MedicalHistory.find(filter)
      .populate('patientId', 'patientId fullName bloodGroup gender')
      .populate('doctorId', 'doctorId fullName specialization')
      .populate('consultationId', 'consultationId diagnosis notes followUpInstructions')
      .sort({ visitDate: -1 });

    res.json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const addHistoryCorrection = async (req, res) => {
  try {
    const history = await MedicalHistory.findById(req.params.id);
    if (!history) {
      return res.status(404).json({ success: false, error: 'History entry not found' });
    }

    history.version += 1;
    history.correctionNotes = req.body.correctionNotes;
    await history.save();

    res.json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getMedicalHistory,
  addHistoryCorrection
};
