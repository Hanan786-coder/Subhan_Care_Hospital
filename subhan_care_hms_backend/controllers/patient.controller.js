/**
 * Patient Controller
 * Handles CRUD operations for Patient entity.
 */
const Patient = require('../models/Patient');
const { generateId } = require('../utils/generateId');
const { formatCNIC } = require('../utils/validators');

const registerPatient = async (req, res) => {
  try {
    const {
      fullName, dateOfBirth, gender, cnic, contactNumber, address,
      emergencyContact, occupation, bloodGroup, allergies, maritalStatus
    } = req.body;

    // Validate and format CNIC
    let formattedCNIC;
    try {
      formattedCNIC = formatCNIC(cnic);
    } catch (err) {
      return res.status(400).json({ success: false, error: err.message });
    }

    const existingPatient = await Patient.findOne({ cnic: formattedCNIC });
    if (existingPatient) {
      return res.status(400).json({ success: false, error: 'Patient with this CNIC already exists' });
    }

    const patientId = await generateId('Patient');

    const patient = await Patient.create({
      patientId,
      fullName,
      dateOfBirth,
      gender,
      cnic: formattedCNIC,
      contactNumber,
      address,
      emergencyContact,
      occupation,
      bloodGroup,
      allergies,
      maritalStatus,
      registeredBy: req.user._id
    });

    res.status(201).json({ success: true, data: patient });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getPatients = async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};

    if (search) {
      query = {
        $or: [
          { patientId: { $regex: search, $options: 'i' } },
          { fullName: { $regex: search, $options: 'i' } },
          { cnic: { $regex: search, $options: 'i' } },
          { contactNumber: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const patients = await Patient.find(query).sort({ registrationDate: -1 });
    res.status(200).json({ success: true, count: patients.length, data: patients });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getPatientById = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ success: false, error: 'Patient not found' });
    }
    res.status(200).json({ success: true, data: patient });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const updatePatient = async (req, res) => {
  try {
    // If CNIC is being updated, format it
    if (req.body.cnic) {
      req.body.cnic = formatCNIC(req.body.cnic);
    }

    const patient = await Patient.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!patient) {
      return res.status(404).json({ success: false, error: 'Patient not found' });
    }

    res.status(200).json({ success: true, data: patient });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const deactivatePatient = async (req, res) => {
  try {
    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      { status: 'inactive' },
      { new: true }
    );

    if (!patient) {
      return res.status(404).json({ success: false, error: 'Patient not found' });
    }

    res.status(200).json({ success: true, data: patient });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  registerPatient,
  getPatients,
  getPatientById,
  updatePatient,
  deactivatePatient
};
