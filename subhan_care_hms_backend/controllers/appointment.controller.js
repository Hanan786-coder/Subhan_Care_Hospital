/**
 * Appointment Controller
 * Handles booking, reschedule, conflict prevention & available slots calculations
 */
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const { safeErrorMessage } = require('../utils/validators');
const Patient = require('../models/Patient');
const User = require('../models/User');

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

const ensureDoctorLinked = async (user) => {
  if (user && user.role === 'DOCTOR' && !user.linkedEntityId) {
    let doc = await Doctor.findOne({
      $or: [
        { userId: user._id },
        { 'contactInfo.email': user.email },
        { fullName: new RegExp(user.name, 'i') }
      ]
    });
    if (doc) {
      user.linkedEntityId = doc._id;
      user.entityModel = 'Doctor';
      await User.findByIdAndUpdate(user._id, { linkedEntityId: doc._id, entityModel: 'Doctor' });
      if (!doc.userId) {
        doc.userId = user._id;
        await doc.save();
      }
    }
  }
};

const getDaySchedule = (doctor, dateStr) => {
  if (!dateStr || !doctor) return [];

  // Parse YYYY-MM-DD cleanly
  const dateParts = String(dateStr).split('T')[0].split('-');
  let d;
  if (dateParts.length === 3) {
    d = new Date(Number(dateParts[0]), Number(dateParts[1]) - 1, Number(dateParts[2]));
  } else {
    d = new Date(dateStr);
  }

  const dayName = DAY_NAMES[d.getDay()];

  // Array format: [{ day: 'Monday', isWorking: true, startTime: '09:00', endTime: '17:00' }]
  if (Array.isArray(doctor.schedule) && doctor.schedule.length > 0) {
    const dayItem = doctor.schedule.find((s) => s.day?.toLowerCase() === dayName);
    if (dayItem && dayItem.isWorking) {
      return [{ start: dayItem.startTime || '09:00', end: dayItem.endTime || '17:00' }];
    } else if (dayItem && !dayItem.isWorking) {
      return [];
    }
  }

  // Object format: { monday: [{ start: '09:00', end: '13:00' }] }
  if (doctor.schedule && typeof doctor.schedule === 'object' && !Array.isArray(doctor.schedule)) {
    const objSched = doctor.schedule[dayName];
    if (Array.isArray(objSched) && objSched.length > 0) {
      return objSched.map((s) => ({ start: s.start || s.startTime || '09:00', end: s.end || s.endTime || '17:00' }));
    }
  }

  // Default standard working schedule for Mon-Sat if active doctor
  if (dayName !== 'sunday' && doctor.status !== 'inactive') {
    return [
      { start: '09:00', end: '13:00' },
      { start: '14:00', end: '17:00' }
    ];
  }

  return [];
};

const getAvailableSlots = (doctor, date) => {
  const schedule = getDaySchedule(doctor, date);
  const existingAppointments = doctor.__appointments || [];
  const slots = [];

  schedule.forEach((segment) => {
    const [startHour, startMinute] = segment.start.split(':').map(Number);
    const [endHour, endMinute] = segment.end.split(':').map(Number);
    let current = startHour * 60 + startMinute;
    const end = endHour * 60 + endMinute;

    while (current + 30 <= end) {
      const slotStart = `${String(Math.floor(current / 60)).padStart(2, '0')}:${String(current % 60).padStart(2, '0')}`;
      const slotEndMinutes = current + 30;
      const slotEnd = `${String(Math.floor(slotEndMinutes / 60)).padStart(2, '0')}:${String(slotEndMinutes % 60).padStart(2, '0')}`;
      const hasConflict = existingAppointments.some(
        (appointment) => appointment.timeSlot?.start < slotEnd && appointment.timeSlot?.end > slotStart
      );
      if (!hasConflict) {
        slots.push({ start: slotStart, end: slotEnd });
      }
      current += 30;
    }
  });

  return slots;
};

const checkConflict = async (doctorId, date, start, end, excludeAppointmentId = null, patientId = null) => {
  const targetDate = new Date(date);
  const startOfDay = new Date(targetDate);
  startOfDay.setUTCHours(0, 0, 0, 0);
  const endOfDay = new Date(targetDate);
  endOfDay.setUTCHours(23, 59, 59, 999);

  // Check Doctor Conflict
  const docQuery = {
    doctorId,
    date: { $gte: startOfDay, $lte: endOfDay },
    status: { $in: ['Scheduled', 'Rescheduled'] },
    $or: [{ 'timeSlot.start': { $lt: end }, 'timeSlot.end': { $gt: start } }]
  };

  if (excludeAppointmentId) {
    docQuery._id = { $ne: excludeAppointmentId };
  }

  const conflictingDocAppt = await Appointment.findOne(docQuery);
  if (conflictingDocAppt) {
    return { conflict: true, message: 'Doctor already has an appointment booked at this time slot.' };
  }

  // Check Patient Conflict
  if (patientId) {
    const patientQuery = {
      patientId,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ['Scheduled', 'Rescheduled'] },
      $or: [{ 'timeSlot.start': { $lt: end }, 'timeSlot.end': { $gt: start } }]
    };

    if (excludeAppointmentId) {
      patientQuery._id = { $ne: excludeAppointmentId };
    }

    const conflictingPatientAppt = await Appointment.findOne(patientQuery);
    if (conflictingPatientAppt) {
      return { conflict: true, message: 'Patient already has an appointment booked in this time slot.' };
    }
  }

  return { conflict: false };
};

const getAppointments = async (req, res) => {
  try {
    await ensureDoctorLinked(req.user);

    const filter = {};
    if (req.query.patientId) filter.patientId = req.query.patientId;
    if (req.query.doctorId) filter.doctorId = req.query.doctorId;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.date) filter.date = new Date(req.query.date);

    if (req.user.role === 'DOCTOR') {
      if (!req.user.linkedEntityId) {
        return res.status(403).json({ success: false, error: 'Doctor profile is not linked to this account' });
      }
      filter.doctorId = req.user.linkedEntityId;
    }

    const appointments = await Appointment.find(filter)
      .populate('patientId', 'patientId fullName contactNumber cnic bloodGroup')
      .populate('doctorId', 'doctorId fullName specialization consultationFee')
      .populate('createdBy', 'name role')
      .sort({ date: -1, 'timeSlot.start': -1 });

    res.json({ success: true, data: appointments });
  } catch (error) {
    res.status(500).json({ success: false, error: safeErrorMessage(error) });
  }
};

const bookAppointment = async (req, res) => {
  try {
    const { patientId, doctorId, date, timeSlot } = req.body;

    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ success: false, error: 'Patient not found' });
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ success: false, error: 'Doctor not found' });
    }

    if (doctor.status === 'inactive') {
      return res.status(400).json({ success: false, error: 'Selected doctor is currently inactive.' });
    }

    const conflictResult = await checkConflict(doctorId, date, timeSlot.start, timeSlot.end, null, patientId);
    if (conflictResult.conflict) {
      return res.status(409).json({ success: false, error: conflictResult.message });
    }

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
    res.status(500).json({ success: false, error: safeErrorMessage(error) });
  }
};

const rescheduleAppointment = async (req, res) => {
  try {
    const { date, timeSlot } = req.body;
    const appointmentId = req.params.id;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ success: false, error: 'Appointment not found' });
    }

    const conflictResult = await checkConflict(appointment.doctorId, date, timeSlot.start, timeSlot.end, appointment._id, appointment.patientId);
    if (conflictResult.conflict) {
      return res.status(409).json({ success: false, error: conflictResult.message });
    }

    appointment.date = new Date(date);
    appointment.timeSlot = timeSlot;
    appointment.status = 'Rescheduled';
    await appointment.save();

    res.status(200).json({ success: true, data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, error: safeErrorMessage(error) });
  }
};

const cancelAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ success: false, error: 'Appointment not found' });
    }

    appointment.status = 'Cancelled';
    appointment.reasonForCancellation = req.body.reasonForCancellation || appointment.reasonForCancellation;
    await appointment.save();

    res.json({ success: true, data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, error: safeErrorMessage(error) });
  }
};

const completeAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ success: false, error: 'Appointment not found' });
    }

    appointment.status = 'Completed';
    await appointment.save();

    res.json({ success: true, data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, error: safeErrorMessage(error) });
  }
};

const getAvailableAppointmentSlots = async (req, res) => {
  try {
    await ensureDoctorLinked(req.user);

    const { doctorId, date } = req.query;
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ success: false, error: 'Doctor not found' });
    }

    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const appointments = await Appointment.find({
      doctorId,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ['Scheduled', 'Rescheduled'] }
    });
    doctor.__appointments = appointments;
    const slots = getAvailableSlots(doctor, date);

    res.json({ success: true, data: slots });
  } catch (error) {
    res.status(500).json({ success: false, error: safeErrorMessage(error) });
  }
};

module.exports = {
  getAppointments,
  bookAppointment,
  rescheduleAppointment,
  cancelAppointment,
  completeAppointment,
  getAvailableAppointmentSlots
};
