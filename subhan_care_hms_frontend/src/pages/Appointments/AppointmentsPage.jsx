import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardBody, CardHeader, Button, Badge, Input, Modal, Spinner } from '@/components/ui';
import { getAppointments, bookAppointment, rescheduleAppointment, cancelAppointment, completeAppointment, getAvailableAppointmentSlots } from '@/services/appointmentService';
import { getPatients } from '@/services/patientService';
import { getDoctors } from '@/services/doctorService';
import { ROLES } from '@/constants/roles';
import { useAuth } from '@/context/AuthContext';
import { CalendarDays, Search, Clock3, XCircle, RefreshCw, CheckCircle2, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './Appointments.module.css';

const STATUS_VARIANTS = {
  Scheduled: 'info',
  Completed: 'success',
  Cancelled: 'danger',
  'No-Show': 'warning',
  Rescheduled: 'primary'
};

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
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ patientId: '', doctorId: '', date: '', start: '', end: '' });

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
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  useEffect(() => {
    const loadSlots = async () => {
      if (!formData.doctorId || !formData.date) {
        setSlots([]);
        return;
      }
      try {
        const response = await getAvailableAppointmentSlots({ doctorId: formData.doctorId, date: formData.date });
        setSlots(response.data || []);
      } catch (error) {
        setSlots([]);
      }
    };
    loadSlots();
  }, [formData.doctorId, formData.date]);

  const filteredAppointments = useMemo(() => {
    const query = search.toLowerCase().trim();
    return appointments.filter((appointment) => {
      const matchesSearch = !query || 
        appointment.appointmentId?.toLowerCase().includes(query) || 
        appointment.patientId?.fullName?.toLowerCase().includes(query) || 
        appointment.doctorId?.fullName?.toLowerCase().includes(query);
      return matchesSearch;
    });
  }, [appointments, search]);

  const openCreateModal = () => {
    setEditingAppointment(null);
    setFormData({ patientId: '', doctorId: '', date: '', start: '', end: '' });
    setSlots([]);
    setIsModalOpen(true);
  };

  const openRescheduleModal = (appointment) => {
    setEditingAppointment(appointment);
    setFormData({
      patientId: appointment.patientId?._id || '',
      doctorId: appointment.doctorId?._id || '',
      date: appointment.date?.split('T')[0] || '',
      start: appointment.timeSlot?.start || '',
      end: appointment.timeSlot?.end || ''
    });
    setIsModalOpen(true);
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

  const handleCancel = async (appointment) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      await cancelAppointment(appointment._id, { reasonForCancellation: 'Cancelled by staff' });
      toast.success('Appointment cancelled successfully');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to cancel appointment');
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

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <h2>Appointment Scheduling</h2>
          <p>Book new consultation sessions, reschedule timings, and view real-time doctor slot allocations.</p>
        </div>
        {canBook && (
          <Button variant="primary" icon={<CalendarDays size={16} />} onClick={openCreateModal}>
            Book Appointment
          </Button>
        )}
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>{appointments.length}</div>
            <div className={styles.statLabel}>Total Appointments</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>
              {appointments.filter((a) => a.status === 'Scheduled' || a.status === 'Rescheduled').length}
            </div>
            <div className={styles.statLabel}>Active / Scheduled</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>
              {appointments.filter((a) => a.status === 'Completed').length}
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
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}><Spinner /></div>
          ) : (
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
                      <td>{appointment.timeSlot?.start} - {appointment.timeSlot?.end}</td>
                      <td>
                        <Badge variant={STATUS_VARIANTS[appointment.status] || 'secondary'}>
                          {appointment.status}
                        </Badge>
                      </td>
                      <td>
                        <div className={styles.actions}>
                          {canRescheduleCancel && (appointment.status === 'Scheduled' || appointment.status === 'Rescheduled') && (
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
                          {canComplete && (appointment.status === 'Scheduled' || appointment.status === 'Rescheduled') && (
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
                      <td colSpan={8} className={styles.emptyState}>No appointments found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingAppointment ? 'Reschedule Appointment' : 'Book Appointment'}>
        <form onSubmit={handleSubmit} className={styles.modalForm}>
          {!editingAppointment && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-neutral-700)' }}>Select Patient</label>
              <select 
                value={formData.patientId} 
                onChange={(e) => setFormData((prev) => ({ ...prev, patientId: e.target.value }))} 
                className={styles.filterSelect}
                style={{ width: '100%' }}
                required
              >
                <option value="">-- Choose Patient --</option>
                {patients.map((patient) => <option key={patient._id} value={patient._id}>{patient.fullName} (CNIC: {patient.cnic})</option>)}
              </select>
            </div>
          )}
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-neutral-700)' }}>Select Doctor</label>
            <select 
              value={formData.doctorId} 
              onChange={(e) => setFormData((prev) => ({ ...prev, doctorId: e.target.value }))} 
              className={styles.filterSelect}
              style={{ width: '100%' }}
              required
              disabled={!!editingAppointment}
            >
              <option value="">-- Choose Doctor --</option>
              {doctors.map((doctor) => <option key={doctor._id} value={doctor._id}>{doctor.fullName} ({doctor.specialization})</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-neutral-700)' }}>Choose Consultation Date</label>
            <Input type="date" value={formData.date} onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))} required />
          </div>

          <div className={styles.slotGrid}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-neutral-700)' }}>Available Slots</label>
              <select 
                value={formData.start} 
                onChange={(e) => setFormData((prev) => ({ ...prev, start: e.target.value, end: slots.find((slot) => slot.start === e.target.value)?.end || prev.end }))} 
                className={styles.filterSelect}
                style={{ width: '100%' }}
                required
              >
                <option value="">-- Choose Time Slot --</option>
                {slots.map((slot) => <option key={`${slot.start}-${slot.end}`} value={slot.start}>{slot.start} - {slot.end}</option>)}
              </select>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-neutral-700)' }}>End Time</label>
              <Input value={formData.end} readOnly placeholder="Auto-filled" style={{ height: '44px' }} />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" loading={isSubmitting}>
              {editingAppointment ? 'Reschedule Booking' : 'Confirm Appointment'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AppointmentsPage;
