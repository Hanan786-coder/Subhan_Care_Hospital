/**
 * Staff Controller
 * Handles CRUD operations for Staff entity.
 */
const Staff = require('../models/Staff');
const { generateId } = require('../utils/generateId');

const createStaff = async (req, res) => {
  try {
    const { fullName, role, contactInfo, shiftTiming } = req.body;

    const staffId = await generateId('Staff');

    const staff = await Staff.create({
      staffId,
      fullName,
      role,
      contactInfo,
      shiftTiming
    });

    res.status(201).json({ success: true, data: staff });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getStaff = async (req, res) => {
  try {
    const staff = await Staff.find({ status: 'active' }).populate('userId', 'name email');
    res.status(200).json({ success: true, count: staff.length, data: staff });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getStaffById = async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id).populate('userId', 'name email');
    if (!staff) {
      return res.status(404).json({ success: false, error: 'Staff member not found' });
    }
    res.status(200).json({ success: true, data: staff });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateStaff = async (req, res) => {
  try {
    const staff = await Staff.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!staff) {
      return res.status(404).json({ success: false, error: 'Staff member not found' });
    }

    res.status(200).json({ success: true, data: staff });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const deactivateStaff = async (req, res) => {
  try {
    const staff = await Staff.findByIdAndUpdate(
      req.params.id,
      { status: 'inactive' },
      { new: true }
    );

    if (!staff) {
      return res.status(404).json({ success: false, error: 'Staff member not found' });
    }

    res.status(200).json({ success: true, data: staff });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  createStaff,
  getStaff,
  getStaffById,
  updateStaff,
  deactivateStaff
};
