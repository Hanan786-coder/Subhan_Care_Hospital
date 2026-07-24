/**
 * Doctor Controller
 * Handles CRUD operations for Doctor entity.
 */
const Doctor = require('../models/Doctor');
const { generateId } = require('../utils/generateId');

const User = require('../models/User');

const createDoctor = async (req, res) => {
  try {
    const { fullName, specialization, qualification, licenseNumber, contactInfo, consultationFee, schedule, email, password } = req.body;

    const existingDoctor = await Doctor.findOne({ licenseNumber });
    if (existingDoctor) {
      return res.status(400).json({ success: false, error: 'Doctor with this license number already exists' });
    }

    const doctorId = await generateId('Doctor');

    const doctor = new Doctor({
      doctorId,
      fullName,
      specialization,
      qualification,
      licenseNumber,
      contactInfo: {
        ...contactInfo,
        email: email || (contactInfo && contactInfo.email)
      },
      consultationFee,
      schedule
    });

    const userEmail = email || (contactInfo && contactInfo.email);

    if (userEmail) {
      const existingUser = await User.findOne({ email: userEmail });
      if (existingUser) {
        return res.status(400).json({ success: false, error: 'A user account with this email already exists' });
      }

      const userId = await generateId('User');
      const user = await User.create({
        userId,
        name: fullName,
        email: userEmail,
        passwordHash: password || 'Password@123',
        role: 'DOCTOR',
        linkedEntityId: doctor._id,
        entityModel: 'Doctor',
        status: 'active'
      });

      doctor.userId = user._id;
    }

    await doctor.save();

    res.status(201).json({ success: true, data: doctor });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getDoctors = async (req, res) => {
  try {
    const query = {};
    if (req.query.status) {
      query.status = req.query.status;
    }

    const doctors = await Doctor.find(query).populate('userId', 'name email status role');
    res.status(200).json({ success: true, count: doctors.length, data: doctors });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getDoctorById = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id).populate('userId', 'name email status role');
    if (!doctor) {
      return res.status(404).json({ success: false, error: 'Doctor not found' });
    }
    res.status(200).json({ success: true, data: doctor });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getMyDoctorProfile = async (req, res) => {
  try {
    let doctor;
    if (req.user.linkedEntityId) {
      doctor = await Doctor.findById(req.user.linkedEntityId).populate('userId', 'name email');
    } else {
      doctor = await Doctor.findOne({ userId: req.user._id }).populate('userId', 'name email');
    }

    if (!doctor) {
      return res.status(404).json({ success: false, error: 'Doctor profile not found for current user' });
    }

    res.status(200).json({ success: true, data: doctor });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateDoctor = async (req, res) => {
  try {
    // Check permission: Admin or own doctor profile
    if (req.user.role !== 'ADMIN') {
      const isOwnProfile = req.user.linkedEntityId && req.user.linkedEntityId.toString() === req.params.id;
      if (!isOwnProfile) {
        return res.status(403).json({ success: false, error: 'Not authorized to edit another doctor profile' });
      }
    }

    const doctor = await Doctor.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!doctor) {
      return res.status(404).json({ success: false, error: 'Doctor not found' });
    }

    res.status(200).json({ success: true, data: doctor });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateSchedule = async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      const isOwnProfile = req.user.linkedEntityId && req.user.linkedEntityId.toString() === req.params.id;
      if (!isOwnProfile) {
        return res.status(403).json({ success: false, error: 'Not authorized to update another doctor schedule' });
      }
    }

    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      { schedule: req.body.schedule },
      { new: true }
    );

    if (!doctor) {
      return res.status(404).json({ success: false, error: 'Doctor not found' });
    }

    res.status(200).json({ success: true, data: doctor });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const deactivateDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      { status: 'inactive' },
      { new: true }
    );

    if (!doctor) {
      return res.status(404).json({ success: false, error: 'Doctor not found' });
    }

    // Invalidate linked user account if present
    if (doctor.userId) {
      await User.findByIdAndUpdate(doctor.userId, { status: 'inactive' });
    } else {
      await User.updateMany({ linkedEntityId: doctor._id }, { status: 'inactive' });
    }

    res.status(200).json({ success: true, data: doctor });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  createDoctor,
  getDoctors,
  getDoctorById,
  getMyDoctorProfile,
  updateDoctor,
  updateSchedule,
  deactivateDoctor
};
