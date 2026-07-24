/**
 * Staff Controller
 * Handles CRUD operations for Staff entity.
 */
const Staff = require('../models/Staff');
const { generateId } = require('../utils/generateId');

const User = require('../models/User');

const createStaff = async (req, res) => {
  try {
    const { fullName, role, contactInfo, shiftTiming, email, password } = req.body;

    const staffId = await generateId('Staff');

    // Create staff entity first
    const staff = new Staff({
      staffId,
      fullName,
      role,
      contactInfo: {
        ...contactInfo,
        email: email || (contactInfo && contactInfo.email)
      },
      shiftTiming
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
        role: role,
        linkedEntityId: staff._id,
        entityModel: 'Staff',
        status: 'active'
      });

      staff.userId = user._id;
    }

    await staff.save();

    res.status(201).json({ success: true, data: staff });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getStaff = async (req, res) => {
  try {
    const query = {};
    if (req.query.status) {
      query.status = req.query.status;
    }
    if (req.query.role) {
      query.role = req.query.role;
    }

    const staff = await Staff.find(query).populate('userId', 'name email status role');
    res.status(200).json({ success: true, count: staff.length, data: staff });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getStaffById = async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id).populate('userId', 'name email status role');
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

    // Update linked user role/name if present
    if (staff.userId) {
      await User.findByIdAndUpdate(staff.userId, {
        name: staff.fullName,
        role: staff.role,
        status: staff.status
      });
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

    // FR-03.4: Invalidate user's active login sessions by deactivating user account
    if (staff.userId) {
      await User.findByIdAndUpdate(staff.userId, { status: 'inactive' });
    } else {
      await User.updateMany({ linkedEntityId: staff._id }, { status: 'inactive' });
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
