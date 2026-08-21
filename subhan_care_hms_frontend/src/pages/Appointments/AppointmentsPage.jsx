import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardBody, CardHeader, Button, Badge, Input, Modal, ConfirmationModal, Spinner, SearchSelect, CountUp, Skeleton } from '@/components/ui';
import useDebounce from '@/hooks/useDebounce';
import {
  getAppointments,
  bookAppointment,
  rescheduleAppointment,
  cancelAppointment,
  completeAppointment,
  getAvailableAppointmentSlots
} from '@/services/appointmentService';
import { getPatients } from '@/services/patientService';
import { getDoctors } from '@/services/doctorService';
import { ROLES } from '@/constants/roles';
import { useAuth } from '@/context/AuthContext';
import { CalendarDays, Search, Clock3, XCircle, RefreshCw, CheckCircle2, Filter, AlertCircle, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './Appointments.module.css';

const STATUS_VARIANTS = {
  Scheduled: 'info',
  Completed: 'success',
  Cancelled: 'danger',
  'No-Show': 'warning',
  Rescheduled: 'primary'
};

const DEFAULT_SLOTS = [
  { start: '09:00', end: '09:30' },
  { start: '09:30', end: '10:00' },
  { start: '10:00', end: '10:30' },
  { start: '10:30', end: '11:00' },
  { start: '11:00', end: '11:30' },
  { start: '11:30', end: '12:00' },
  { start: '12:00', end: '12:30' },
  { start: '12:30', end: '13:00' },
  { start: '14:00', end: '14:30' },
  { start: '14:30', end: '15:00' },
  { start: '15:00', end: '15:30' },
  { start: '15:30', end: '16:00' },
  { start: '16:00', end: '16:30' },
  { start: '16:30', end: '17:00' }
];

const AppointmentsPage = () => {
  const { user } = useAuth();
  const isDoctor = user?.role === ROLES.DOCTOR;
  const isReceptionist = user?.role === ROLES.RECEPTIONIST;
  const isAdmin = user?.role === ROLES.ADMIN;

  const canBook = isAdmin || isReceptionist;
  const canRescheduleCancel = isAdmin || isReceptionist;
  const canComplete = isAdmin || isDoctor;

  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDoctorScheduleModalOpen, setIsDoctorScheduleModalOpen] = useState(false);
  const [selectedDoctorForSchedule, setSelectedDoctorForSchedule] = useState(null);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ patientId: '', doctorId: '', date: '', slotValue: '', start: '', end: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [appointmentData, patientData, doctorData] = await Promise.all([
        getAppointments(statusFilter ? { status: statusFilter } : {}),
        getPatients(),
        getDoctors()
      ]);
      setAppointments(appointmentData.data || []);
      setPatients(patientData.data || []);
      setDoctors(doctorData.data || []);
      if (doctorData.data?.length > 0) {
        setSelectedDoctorForSchedule(doctorData.data[0]);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  // Fetch available slots dynamically when Doctor or Date changes
  useEffect(() => {
    const loadSlots = async () => {
      if (!formData.doctorId || !formData.date) {
        setSlots(DEFAULT_SLOTS);
        return;
      }
      setLoadingSlots(true);
      try {
        const response = await getAvailableAppointmentSlots({ doctorId: formData.doctorId, date: formData.date });
        if (response.data && Array.isArray(response.data)) {
          setSlots(response.data);
        } else {
          setSlots([]);
        }
      } catch (error) {
        setSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };
    loadSlots();
  }, [formData.doctorId, formData.date]);

  const filteredAppointments = useMemo(() => {
    const query = debouncedSearch.toLowerCase().trim();
    return appointments.filter((appointment) => {
      const matchesSearch =
        !query ||
        appointment.appointmentId?.toLowerCase().includes(query) ||
        appointment.patientId?.fullName?.toLowerCase().includes(query) ||
        appointment.doctorId?.fullName?.toLowerCase().includes(query);
      return matchesSearch;
    });
  }, [appointments, debouncedSearch]);

  const openCreateModal = () => {
    setEditingAppointment(null);
    const todayStr = new Date().toISOString().split('T')[0];
    setFormData({ patientId: '', doctorId: '', date: todayStr, slotValue: '', start: '', end: '' });
    setSlots(DEFAULT_SLOTS);
    setIsModalOpen(true);
  };

  const openRescheduleModal = (appointment) => {
    setEditingAppointment(appointment);
    const start = appointment.timeSlot?.start || '';
    const end = appointment.timeSlot?.end || '';
    const slotVal = start && end ? `${start} - ${end}` : '';

    setFormData({
      patientId: appointment.patientId?._id || '',
      doctorId: appointment.doctorId?._id || '',
      date: appointment.date?.split('T')[0] || new Date().toISOString().split('T')[0],
      slotValue: slotVal,
      start,
      end
    });
    setIsModalOpen(true);
  };

  const handleSlotSelect = (val) => {
    if (!val) {
      setFormData((prev) => ({ ...prev, slotValue: '', start: '', end: '' }));
      return;
    }
    const [s, e] = val.split(' - ');
    setFormData((prev) => ({
      ...prev,
      slotValue: val,
      start: s ? s.trim() : '',
      end: e ? e.trim() : ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.patientId || !formData.doctorId || !formData.date || !formData.start || !formData.end) {
      toast.error('Please select a patient, doctor, date, and time slot');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        patientId: formData.patientId,
        doctorId: formData.doctorId,
        date: formData.date,
        timeSlot: { start: formData.start, end: formData.end }
      };

      if (editingAppointment) {
        await rescheduleAppointment(editingAppointment._id, { date: formData.date, timeSlot: payload.timeSlot });
        toast.success('Appointment successfully rescheduled');
      } else {
        await bookAppointment(payload);
        toast.success('Appointment successfully booked');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save appointment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const [appointmentToCancel, setAppointmentToCancel] = useState(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  const handleCancel = (appointment) => {
    setAppointmentToCancel(appointment);
    setIsCancelModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!appointmentToCancel) return;
    setIsSubmitting(true);
    try {
      await cancelAppointment(appointmentToCancel._id, { reasonForCancellation: 'Cancelled by staff' });
      toast.success('Appointment cancelled successfully');
      setIsCancelModalOpen(false);
      setAppointmentToCancel(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to cancel appointment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleComplete = async (appointment) => {
    try {
      await completeAppointment(appointment._id, {});
      toast.success('Appointment marked as Completed');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to complete appointment');
    }
  };

  const formattedSlotsOptions = useMemo(() => {
    return slots.map((s) => ({
      value: `${s.start} - ${s.end}`,
      label: `${s.start} - ${s.end}`,
      sublabel: '30 min consultation'
    }));
  }, [slots]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerTitle}>
            <Skeleton variant="text" height={28} width={240} />
            <Skeleton variant="text" height={16} width={400} />
          </div>
        </div>
        <div className={styles.statsGrid}>
          {[1, 2, 3].map(i => <Skeleton key={i} variant="card" height={110} />)}
        </div>
        <Card>
          <CardBody>
            {[1,2,3,4,5,6,7].map(i => (
              <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--color-neutral-100)' }}>
                {[80,140,130,110,100,90,80,70].map((w, j) => <Skeleton key={j} variant="text" width={w} height={14} />)}
              </div>
            ))}
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <h2>Appointment Scheduling</h2>
          <p>Book new consultation sessions, reschedule timings, and view real-time doctor slot allocations.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Button variant="outline" icon={<Calendar size={16} />} onClick={() => setIsDoctorScheduleModalOpen(true)}>
            Doctors' Weekly Schedule
          </Button>
          {canBook && (
            <Button variant="primary" icon={<CalendarDays size={16} />} onClick={openCreateModal}>
              Book Appointment
            </Button>
          )}
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statInfo}>
            <div className={styles.statValue}><CountUp value={appointments.length} /></div>
            <div className={styles.statLabel}>Total Appointments</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>
              <CountUp value={appointments.filter((a) => a.status === 'Scheduled' || a.status === 'Rescheduled').length} />
            </div>
            <div className={styles.statLabel}>Active / Scheduled</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>
              <CountUp value={appointments.filter((a) => a.status === 'Completed').length} />
            </div>
            <div className={styles.statLabel}>Completed Visits</div>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className={styles.controlsRow}>
            <div style={{ flex: 1, minWidth: '260px' }}>
              <Input
                placeholder="Search by ID, patient, or doctor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                icon={<Search size={16} />}
              />
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <Filter size={16} style={{ color: 'var(--color-neutral-500)' }} />
              <select
                className={styles.filterSelect}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
                <option value="No-Show">No-Show</option>
                <option value="Rescheduled">Rescheduled</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardBody>
          {false ? null : (
            <div className={styles.tableResponsive}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Patient Name</th>
                    <th>Doctor Name</th>
                    <th>Specialization</th>
                    <th>Scheduled Date</th>
                    <th>Time Slot</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAppointments.map((appointment) => (
                    <tr key={appointment._id}>
                      <td style={{ fontWeight: 600 }}>{appointment.appointmentId}</td>
                      <td>{appointment.patientId?.fullName || 'N/A'}</td>
                      <td>{appointment.doctorId?.fullName || 'N/A'}</td>
                      <td>
                        <Badge variant="primary">
                          {appointment.doctorId?.specialization || 'General'}
                        </Badge>
                      </td>
                      <td>{new Date(appointment.date).toLocaleDateString()}</td>
                      <td>
                        {appointment.timeSlot?.start} - {appointment.timeSlot?.end}
                      </td>
                      <td>
                        <Badge variant={STATUS_VARIANTS[appointment.status] || 'secondary'}>
                          {appointment.status}
                        </Badge>
                      </td>
                      <td>
                        <div className={styles.actions}>
                          {canRescheduleCancel &&
                            (appointment.status === 'Scheduled' || appointment.status === 'Rescheduled') && (
                              <>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  icon={<RefreshCw size={14} />}
                                  onClick={() => openRescheduleModal(appointment)}
                                >
                                  Reschedule
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  icon={<XCircle size={14} />}
                                  onClick={() => handleCancel(appointment)}
                                >
                                  Cancel
                                </Button>
                              </>
                            )}
                          {canComplete &&
                            (appointment.status === 'Scheduled' || appointment.status === 'Rescheduled') && (
                              <Button
                                size="sm"
                                variant="primary"
                                icon={<CheckCircle2 size={14} />}
                                onClick={() => handleComplete(appointment)}
                              >
                                Complete
                              </Button>
                            )}
                          {appointment.status !== 'Scheduled' && appointment.status !== 'Rescheduled' && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-neutral-400)' }}>None</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredAppointments.length === 0 && (
                    <tr>
                      <td colSpan={8} className={styles.emptyState}>
                        No appointments found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingAppointment ? 'Reschedule Appointment' : 'Book Appointment'}
      >
        <form onSubmit={handleSubmit} className={styles.modalForm}>
          {!editingAppointment && (
            <SearchSelect
              label="Select Patient"
              required
              placeholder="Search & select patient by name, CNIC or phone..."
              options={patients}
              value={formData.patientId}
              onChange={(val) => setFormData((prev) => ({ ...prev, patientId: val }))}
              getOptionLabel={(pat) => pat.fullName}
              getOptionValue={(pat) => pat._id}
              getOptionSublabel={(pat) => pat.cnic ? `CNIC: ${pat.cnic}` : pat.contactNumber || ''}
            />
          )}

          <SearchSelect
            label="Select Doctor"
            required
            disabled={!!editingAppointment}
            placeholder="Search & select doctor by name or specialization..."
            options={doctors}
            value={formData.doctorId}
            onChange={(val) => setFormData((prev) => ({ ...prev, doctorId: val }))}
            getOptionLabel={(doc) => doc.fullName}
            getOptionValue={(doc) => doc._id}
            getOptionSublabel={(doc) => doc.specialization || ''}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-neutral-700)' }}>
              Consultation Date <span style={{ color: 'var(--color-danger-500)' }}>*</span>
            </label>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
              required
            />
          </div>

          <SearchSelect
            label="Select Available Time Slot"
            required
            placeholder={loadingSlots ? 'Loading doctor slots...' : formattedSlotsOptions.length === 0 ? 'No slots available for this date' : 'Search & select time slot (e.g. 09:00 - 09:30)...'}
            options={formattedSlotsOptions}
            value={formData.slotValue}
            onChange={handleSlotSelect}
            getOptionLabel={(opt) => opt.label}
            getOptionValue={(opt) => opt.value}
            getOptionSublabel={(opt) => opt.sublabel}
          />
          {formData.doctorId && formData.date && !loadingSlots && formattedSlotsOptions.length === 0 && (
            <div style={{ fontSize: '0.8rem', color: 'var(--color-danger-600)', padding: '8px 12px', backgroundColor: 'var(--color-danger-50)', borderRadius: '6px', border: '1px solid var(--color-danger-200)', marginTop: '-8px' }}>
              ⚠️ No available time slots for this doctor on the selected date (All slots booked or doctor is off-duty).
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={isSubmitting}>
              {editingAppointment ? 'Reschedule Booking' : 'Confirm Appointment'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Doctors Weekly Schedule Modal for Receptionist & Staff */}
      {isDoctorScheduleModalOpen && (
        <Modal
          isOpen={isDoctorScheduleModalOpen}
          onClose={() => setIsDoctorScheduleModalOpen(false)}
          size="lg"
          title="Doctors' Weekly Schedules & Capacity"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '8px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-neutral-700)' }}>Select Doctor</label>
              <select
                className={styles.filterSelect}
                style={{ width: '100%', height: '42px' }}
                value={selectedDoctorForSchedule?._id || ''}
                onChange={(e) => {
                  const doc = doctors.find(d => d._id === e.target.value);
                  setSelectedDoctorForSchedule(doc);
                }}
              >
                {doctors.map((doc) => (
                  <option key={doc._id} value={doc._id}>
                    {doc.fullName} ({doc.specialization}) — Fee: Rs. {doc.consultationFee}
                  </option>
                ))}
              </select>
            </div>

            {selectedDoctorForSchedule ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--color-neutral-50)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--color-neutral-200)' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>Dr. {selectedDoctorForSchedule.fullName}</h4>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-neutral-600)' }}>
                      {selectedDoctorForSchedule.specialization} • {selectedDoctorForSchedule.qualification}
                    </p>
                  </div>
                  <Badge variant={selectedDoctorForSchedule.status === 'active' ? 'success' : 'danger'}>
                    {selectedDoctorForSchedule.status}
                  </Badge>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '350px', overflowY: 'auto' }}>
                  {(selectedDoctorForSchedule.schedule || []).length > 0 ? (
                    selectedDoctorForSchedule.schedule.map((item) => (
                      <div
                        key={item.day}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          border: '1px solid var(--color-neutral-200)',
                          backgroundColor: item.isWorking ? '#ffffff' : 'var(--color-neutral-50)',
                          opacity: item.isWorking ? 1 : 0.65
                        }}
                      >
                        <span style={{ fontWeight: 600, fontSize: '0.875rem', width: '100px' }}>{item.day}</span>
                        {item.isWorking ? (
                          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', fontSize: '0.85rem' }}>
                            <span><strong>Hours:</strong> {item.startTime} - {item.endTime}</span>
                            <span><strong>Max Patients:</strong> {item.maxPatients || 20}</span>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.85rem', color: 'var(--color-neutral-500)', italic: 'true' }}>
                            Day Off / Unavailable
                          </span>
                        )}
                      </div>
                    ))
                  ) : (
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-neutral-500)', textAlign: 'center', padding: '1rem' }}>
                      Standard Monday - Saturday schedule applies (09:00 AM - 05:00 PM)
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <p style={{ fontSize: '0.875rem', color: 'var(--color-neutral-500)' }}>Please select a doctor to view schedule.</p>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
              <Button variant="ghost" onClick={() => setIsDoctorScheduleModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Cancellation Confirmation Modal */}
      <ConfirmationModal
        isOpen={isCancelModalOpen}
        onClose={() => {
          setIsCancelModalOpen(false);
          setAppointmentToCancel(null);
        }}
        onConfirm={handleConfirmCancel}
        title="Cancel Appointment"
        message={
          appointmentToCancel ? (
            <span>
              Are you sure you want to cancel the appointment for{' '}
              <strong>{appointmentToCancel.patientId?.fullName || 'the patient'}</strong> with{' '}
              <strong>{appointmentToCancel.doctorId?.fullName || 'the doctor'}</strong> on{' '}
              <strong>{new Date(appointmentToCancel.date).toLocaleDateString()} ({appointmentToCancel.timeSlot?.start} - {appointmentToCancel.timeSlot?.end})</strong>?
            </span>
          ) : 'Are you sure you want to cancel this appointment?'
        }
        confirmText="Yes, Cancel Appointment"
        cancelText="Keep Appointment"
        variant="danger"
        loading={isSubmitting}
      />
    </div>
  );
};

export default AppointmentsPage;
