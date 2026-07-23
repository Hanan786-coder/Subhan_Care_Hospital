/**
 * Appointment Controller
 * Handles booking, reschedule, conflict prevention (Feature 2.2, 2.4)
 */
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');

// Feature 2.2: Conflict Prevention Helper
const checkConflict = async (doctorId, date, start, end, excludeAppointmentId = null) => {
  const query = {
    doctorId,
    date: new Date(date),
    status: { $in: ['Scheduled', 'Rescheduled'] },
    $or: [
      { 'timeSlot.start': { $lt: end }, 'timeSlot.end': { $gt: start } }
    ]
  };

  if (excludeAppointmentId) {
    query._id = { $ne: excludeAppointmentId };
  }

  const conflictingAppt = await Appointment.findOne(query);
  return !!conflictingAppt;
};

const bookAppointment = async (req, res) => {
  try {
    const { patientId, doctorId, date, timeSlot } = req.body;

    // Check doctor availability (simplify check for slot format here)
    const isConflict = await checkConflict(doctorId, date, timeSlot.start, timeSlot.end);
    if (isConflict) {
      return res.status(409).json({ success: false, error: 'Time slot conflict detected. Please choose another slot.' });
    }

    // Generate Appointment ID (simple format for demo)
    const count = await Appointment.countDocuments();
    const appointmentId = `SC-APT-${String(count + 1).padStart(5, '0')}`;

    const appointment = await Appointment.create({
      appointmentId,
      patientId,
      doctorId,
      date: new Date(date),
      timeSlot,
      createdBy: req.user._id
    });

    res.status(201).json({ success: true, data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Feature 2.4: Reschedule Flow
const rescheduleAppointment = async (req, res) => {
  try {
    const { date, timeSlot } = req.body;
    const appointmentId = req.params.id;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ success: false, error: 'Appointment not found' });
    }

    // Check for conflict excluding current appointment
    const isConflict = await checkConflict(appointment.doctorId, date, timeSlot.start, timeSlot.end, appointment._id);
    if (isConflict) {
      return res.status(409).json({ success: false, error: 'Time slot conflict detected for reschedule.' });
    }

    appointment.date = new Date(date);
    appointment.timeSlot = timeSlot;
    appointment.status = 'Rescheduled';
    await appointment.save();

    res.status(200).json({ success: true, data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  bookAppointment,
  rescheduleAppointment
};
