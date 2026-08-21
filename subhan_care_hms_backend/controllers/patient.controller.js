/**
 * Patient Controller
 * Handles CRUD operations for Patient entity.
 */
const Patient = require('../models/Patient');
const { generateId } = require('../utils/generateId');
const { formatCNIC, safeErrorMessage } = require('../utils/validators');

const parseAllergies = (allergies) => {
  if (!allergies) return [];

  // If it's already an array
  if (Array.isArray(allergies)) {
    return allergies.map(item => {
      if (typeof item === 'string') {
        const trimmed = item.trim();
        if (!trimmed || trimmed.toLowerCase() === 'none') return null;
        return { name: trimmed, severity: 'Mild' };
      }
      if (item && typeof item === 'object') {
        const name = (item.name || '').trim();
        if (!name || name.toLowerCase() === 'none') return null;
        return {
          name,
          severity: item.severity || 'Mild'
        };
      }
      return null;
    }).filter(item => item !== null);
  }

  // If it's a string (e.g., "None", "Penicillin, Dust")
  if (typeof allergies === 'string') {
    const trimmed = allergies.trim();
    if (!trimmed || trimmed.toLowerCase() === 'none') {
      return [];
    }
    return trimmed
      .split(',')
      .map(item => item.trim())
      .filter(item => item && item.toLowerCase() !== 'none')
      .map(name => ({ name, severity: 'Mild' }));
  }

  return [];
};

const parseEmergencyContact = (contact) => {
  if (!contact) return { name: '', phone: '', relationship: '' };
  
  if (typeof contact === 'string') {
    const trimmed = contact.trim();
    if (!trimmed) return { name: '', phone: '', relationship: '' };
    
    // Check if it has a relationship/name in parentheses like "0312-3456789 (Spouse)"
    const match = trimmed.match(/^([^(]+)\s*(?:\(([^)]+)\))?$/);
    if (match) {
      const phoneOrInfo = match[1].trim();
      const info = match[2] ? match[2].trim() : '';
      
      // If the part inside parentheses is a common relationship
      const relationships = ['spouse', 'husband', 'wife', 'father', 'mother', 'brother', 'sister', 'friend', 'guardian', 'kin', 'parent'];
      if (info && relationships.includes(info.toLowerCase())) {
        return {
          name: '',
          phone: phoneOrInfo,
          relationship: info
        };
      } else if (info) {
        return {
          name: info,
          phone: phoneOrInfo,
          relationship: ''
        };
      }
      return {
        name: '',
        phone: phoneOrInfo,
        relationship: ''
      };
    }
    return { name: '', phone: trimmed, relationship: '' };
  }
  
  if (typeof contact === 'object') {
    return {
      name: contact.name || '',
      phone: contact.phone || '',
      relationship: contact.relationship || ''
    };
  }
  
  return { name: '', phone: '', relationship: '' };
};

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
      emergencyContact: parseEmergencyContact(emergencyContact),
      occupation,
      bloodGroup,
      allergies: parseAllergies(allergies),
      maritalStatus,
      registeredBy: req.user._id
    });

    res.status(201).json({ success: true, data: patient });
  } catch (error) {
    res.status(500).json({ success: false, error: safeErrorMessage(error) });
  }
};

const getPatients = async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};

    if (search && typeof search === 'string') {
      const sanitizedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query = {
        $or: [
          { patientId: { $regex: sanitizedSearch, $options: 'i' } },
          { fullName: { $regex: sanitizedSearch, $options: 'i' } },
          { cnic: { $regex: sanitizedSearch, $options: 'i' } },
          { contactNumber: { $regex: sanitizedSearch, $options: 'i' } }
        ]
      };
    }

    const patients = await Patient.find(query).sort({ registrationDate: -1 });
    res.status(200).json({ success: true, count: patients.length, data: patients });
  } catch (error) {
    res.status(500).json({ success: false, error: safeErrorMessage(error) });
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
    res.status(500).json({ success: false, error: safeErrorMessage(error) });
  }
};

const updatePatient = async (req, res) => {
  try {
    // If CNIC is being updated, format it
    if (req.body.cnic) {
      req.body.cnic = formatCNIC(req.body.cnic);
    }

    if (req.body.hasOwnProperty('allergies')) {
      req.body.allergies = parseAllergies(req.body.allergies);
    }

    if (req.body.hasOwnProperty('emergencyContact')) {
      req.body.emergencyContact = parseEmergencyContact(req.body.emergencyContact);
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
    res.status(500).json({ success: false, error: safeErrorMessage(error) });
  }
};

const deletePatient = async (req, res) => {
  try {
    const patient = await Patient.findByIdAndDelete(req.params.id);

    if (!patient) {
      return res.status(404).json({ success: false, error: 'Patient not found' });
    }

    res.status(200).json({ success: true, message: 'Patient permanently deleted', data: patient });
  } catch (error) {
    res.status(500).json({ success: false, error: safeErrorMessage(error) });
  }
};

module.exports = {
  registerPatient,
  getPatients,
  getPatientById,
  updatePatient,
  deletePatient
};

