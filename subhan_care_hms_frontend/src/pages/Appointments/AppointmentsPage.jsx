import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardBody, CardHeader, Button, Badge, Input, Modal, Spinner } from '@/components/ui';
import { getAppointments, bookAppointment, rescheduleAppointment, cancelAppointment, completeAppointment, getAvailableAppointmentSlots } from '@/services/appointmentService';
import { getPatients } from '@/services/patientService';
import { getDoctors } from '@/services/doctorService';
import { ROLES } from '@/constants/roles';
import { useAuth } from '@/context/AuthContext';
import { CalendarDays, Search, Clock3, XCircle, RefreshCw, CheckCircle2 } from 'lucide-react';
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
  const canManage = [ROLES.ADMIN, ROLES.DOCTOR, ROLES.RECEPTIONIST].includes(user?.role);

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

  useEffect(() => { fetchData(); }, [statusFilter]);

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
      const matchesSearch = !query || appointment.appointmentId?.toLowerCase().includes(query) || appointment.patientId?.fullName?.toLowerCase().includes(query) || appointment.doctorId?.fullName?.toLowerCase().includes(query);
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
      toast.error('Select patient, doctor, date, and slot');
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
        toast.success('Appointment rescheduled');
      } else {
        await bookAppointment(payload);
        toast.success('Appointment booked');
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
    try {
      await cancelAppointment(appointment._id, { reasonForCancellation: 'Cancelled from UI' });
      toast.success('Appointment cancelled');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to cancel appointment');
    }
  };

  const handleComplete = async (appointment) => {
    try {
      await completeAppointment(appointment._id, {});
      toast.success('Appointment completed');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to complete appointment');
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Appointment Module</h2>
          <p className={styles.subtitle}>Schedule visits, reschedule slots, and manage consultation status.</p>
        </div>
        {canManage && <Button variant="primary" icon={<CalendarDays size={16} />} onClick={openCreateModal}>Book Appointment</Button>}
      </div>

      <div className={styles.statsGrid}>
        <Card><CardBody><div className={styles.statLabel}>Appointments</div><div className={styles.statValue}>{appointments.length}</div></CardBody></Card>
        <Card><CardBody><div className={styles.statLabel}>Scheduled</div><div className={styles.statValue}>{appointments.filter((appointment) => appointment.status === 'Scheduled').length}</div></CardBody></Card>
        <Card><CardBody><div className={styles.statLabel}>Completed</div><div className={styles.statValue}>{appointments.filter((appointment) => appointment.status === 'Completed').length}</div></CardBody></Card>
      </div>

      <Card>
        <CardHeader>
          <div className={styles.controls}>
            <Input placeholder="Search by appointment, patient, or doctor" value={search} onChange={(e) => setSearch(e.target.value)} icon={<Search size={16} />} />
            <select className={styles.filterSelect} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
              <option value="No-Show">No-Show</option>
              <option value="Rescheduled">Rescheduled</option>
            </select>
          </div>
        </CardHeader>
        <CardBody>
          {loading ? <Spinner /> : (
            <div className={styles.list}>
              {filteredAppointments.map((appointment) => (
                <div key={appointment._id} className={styles.appointmentCard}>
                  <div className={styles.appointmentHeader}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{appointment.appointmentId}</div>
                      <div className={styles.appointmentMeta}>{appointment.patientId?.fullName || 'Unknown Patient'} • {appointment.doctorId?.fullName || 'Unknown Doctor'}</div>
                    </div>
                    <Badge variant={STATUS_VARIANTS[appointment.status] || 'secondary'}>{appointment.status}</Badge>
                  </div>
                  <div className={styles.appointmentMeta}>{new Date(appointment.date).toLocaleDateString()} • {appointment.timeSlot?.start} - {appointment.timeSlot?.end}</div>
                  <div className={styles.actions}>
                    <Button size="sm" variant="secondary" icon={<RefreshCw size={14} />} onClick={() => openRescheduleModal(appointment)}>Reschedule</Button>
                    <Button size="sm" variant="outline" icon={<XCircle size={14} />} onClick={() => handleCancel(appointment)}>Cancel</Button>
                    <Button size="sm" variant="primary" icon={<CheckCircle2 size={14} />} onClick={() => handleComplete(appointment)}>Complete</Button>
                  </div>
                </div>
              ))}
              {!filteredAppointments.length && <div className={styles.emptyState}>No appointments found.</div>}
            </div>
          )}
        </CardBody>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingAppointment ? 'Reschedule Appointment' : 'Book Appointment'}>
        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <select value={formData.patientId} onChange={(e) => setFormData((prev) => ({ ...prev, patientId: e.target.value }))} className={styles.slotSelect}>
            <option value="">Select patient</option>
            {patients.map((patient) => <option key={patient._id} value={patient._id}>{patient.fullName}</option>)}
          </select>
          <select value={formData.doctorId} onChange={(e) => setFormData((prev) => ({ ...prev, doctorId: e.target.value }))} className={styles.slotSelect}>
            <option value="">Select doctor</option>
            {doctors.map((doctor) => <option key={doctor._id} value={doctor._id}>{doctor.fullName} - {doctor.specialization}</option>)}
          </select>
          <Input type="date" value={formData.date} onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))} />
          <select value={formData.start} onChange={(e) => setFormData((prev) => ({ ...prev, start: e.target.value, end: slots.find((slot) => slot.start === e.target.value)?.end || prev.end }))} className={styles.slotSelect}>
            <option value="">Select available slot</option>
            {slots.map((slot) => <option key={`${slot.start}-${slot.end}`} value={slot.start}>{slot.start} - {slot.end}</option>)}
          </select>
          <Input value={formData.end} readOnly placeholder="End time auto-filled" />
          <Button type="submit" variant="primary" loading={isSubmitting}>{editingAppointment ? 'Save Changes' : 'Confirm Booking'}</Button>
        </form>
      </Modal>
    </div>
  );
};

export default AppointmentsPage;
