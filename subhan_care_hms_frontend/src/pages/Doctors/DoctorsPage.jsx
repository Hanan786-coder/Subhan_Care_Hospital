import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { getDoctors, createDoctor, updateDoctor, updateDoctorSchedule, deactivateDoctor } from '../../services/doctorService';
import { Card, CardBody, CardHeader, Button, Badge, Spinner, Input, Modal, PasswordValidator, isPasswordValid, CountUp, Skeleton } from '../../components/ui';
import { Plus, Edit, Trash2, Search, Calendar, UserCheck, Stethoscope, Clock, ShieldAlert, CheckCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import useDebounce from '../../hooks/useDebounce';
import toast from 'react-hot-toast';
import styles from './Doctors.module.css';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const SPECIALIZATIONS = [
  'General Physician',
  'Cardiologist',
  'Dermatologist',
  'Neurologist',
  'Orthopedic Surgeon',
  'Pediatrician',
  'Gynecologist',
  'Psychiatrist',
  'ENT Specialist',
  'Ophthalmologist',
  'Gastroenterologist',
  'Pulmonologist',
  'Urologist',
  'Nephrologist'
];

const DEFAULT_SCHEDULE = DAYS.map(day => ({
  day,
  isWorking: day !== 'Sunday',
  startTime: '09:00',
  endTime: '17:00',
  maxPatients: 20
}));

const normalizeSchedule = (schedule) => {
  if (Array.isArray(schedule) && schedule.length > 0) {
    return DAYS.map(day => {
      const existing = schedule.find(s => s.day?.toLowerCase() === day.toLowerCase());
      if (existing) {
        return {
          day,
          isWorking: existing.isWorking !== undefined ? Boolean(existing.isWorking) : true,
          startTime: existing.startTime || existing.start || '09:00',
          endTime: existing.endTime || existing.end || '17:00',
          maxPatients: existing.maxPatients !== undefined ? Number(existing.maxPatients) : 20
        };
      }
      return { day, isWorking: false, startTime: '09:00', endTime: '17:00', maxPatients: 20 };
    });
  }

  if (schedule && typeof schedule === 'object') {
    return DAYS.map(day => {
      const key = day.toLowerCase();
      const daySlots = schedule[key];
      const hasSlots = Array.isArray(daySlots) && daySlots.length > 0;
      return {
        day,
        isWorking: hasSlots,
        startTime: hasSlots ? (daySlots[0].start || daySlots[0].startTime || '09:00') : '09:00',
        endTime: hasSlots ? (daySlots[0].end || daySlots[0].endTime || '17:00') : '17:00',
        maxPatients: hasSlots ? (daySlots[0].maxPatients || 20) : 20
      };
    });
  }

  return DEFAULT_SCHEDULE;
};

const getDoctorAvailability = (doc) => {
  if (doc.status === 'inactive') {
    return { label: 'Inactive', className: styles.availInactive, icon: <ShieldAlert size={12} /> };
  }

  const scheduleList = normalizeSchedule(doc.schedule);
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayName = dayNames[new Date().getDay()];

  const todaySchedule = scheduleList.find(s => s.day.toLowerCase() === todayName.toLowerCase());

  if (!todaySchedule || !todaySchedule.isWorking) {
    return { label: 'Day Off Today', className: styles.availDayOff, icon: <AlertTriangle size={12} /> };
  }

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [startH, startM] = (todaySchedule.startTime || '09:00').split(':').map(Number);
  const [endH, endM] = (todaySchedule.endTime || '17:00').split(':').map(Number);

  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  if (currentMinutes >= startMinutes && currentMinutes <= endMinutes) {
    return { 
      label: 'Available Now', 
      className: styles.availAvailable, 
      isPulse: true,
      icon: null
    };
  } else {
    return { 
      label: `Off Shift (${todaySchedule.startTime} - ${todaySchedule.endTime})`, 
      className: styles.availOffShift, 
      icon: <Clock size={12} /> 
    };
  }
};

const DoctorsPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);
  const [statusFilter, setStatusFilter] = useState('');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [deactivatingDoctor, setDeactivatingDoctor] = useState(null);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    specialization: 'General Physician',
    qualification: 'MBBS',
    licenseNumber: '',
    phone: '',
    email: '',
    address: '',
    password: '',
    consultationFee: 1500
  });

  const [scheduleData, setScheduleData] = useState(DEFAULT_SCHEDULE);

  const fetchDoctors = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getDoctors(statusFilter ? { status: statusFilter } : {});
      setDoctors(data.data || []);
      setError(null);
    } catch (err) {
      setError('Failed to load doctor profiles. Please check server connection.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  const handleOpenCreateModal = () => {
    setEditingDoctor(null);
    setFormData({
      fullName: '',
      specialization: 'General Physician',
      qualification: 'MBBS',
      licenseNumber: '',
      phone: '',
      email: '',
      address: '',
      password: '',
      consultationFee: 1500
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (doc) => {
    setEditingDoctor(doc);
    setFormData({
      fullName: doc.fullName || '',
      specialization: doc.specialization || 'General Physician',
      qualification: doc.qualification || 'MBBS',
      licenseNumber: doc.licenseNumber || '',
      phone: doc.contactInfo?.phone || '',
      email: doc.contactInfo?.email || doc.userId?.email || '',
      address: doc.contactInfo?.address || '',
      password: '',
      consultationFee: doc.consultationFee || 1500
    });
    setIsModalOpen(true);
  };

  const handleOpenScheduleModal = (doc) => {
    setEditingDoctor(doc);
    setScheduleData(normalizeSchedule(doc.schedule));
    setIsScheduleModalOpen(true);
  };

  const handleSubmitDoctor = async (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.licenseNumber || !formData.specialization) {
      toast.error('Doctor Name, License Number, and Specialization are required.');
      return;
    }
    if (formData.password && !isPasswordValid(formData.password)) {
      toast.error('Password does not meet complexity requirements');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        fullName: formData.fullName,
        specialization: formData.specialization,
        qualification: formData.qualification,
        licenseNumber: formData.licenseNumber,
        contactInfo: {
          phone: formData.phone,
          email: formData.email,
          address: formData.address
        },
        consultationFee: Number(formData.consultationFee),
        email: formData.email,
        password: formData.password || undefined,
        schedule: scheduleData
      };

      if (editingDoctor) {
        await updateDoctor(editingDoctor._id, payload);
        toast.success('Doctor profile updated successfully');
      } else {
        await createDoctor(payload);
        toast.success('Doctor profile created successfully');
      }
      setIsModalOpen(false);
      fetchDoctors();
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Failed to save doctor profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveSchedule = async (e) => {
    e.preventDefault();
    if (!editingDoctor) return;

    setIsSubmitting(true);
    try {
      await updateDoctorSchedule(editingDoctor._id, scheduleData);
      toast.success('Doctor weekly schedule updated successfully');
      setIsScheduleModalOpen(false);
      fetchDoctors();
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Failed to update schedule');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDeactivate = async () => {
    if (!deactivatingDoctor) return;
    setIsSubmitting(true);
    try {
      await deactivateDoctor(deactivatingDoctor._id);
      toast.success(`Dr. ${deactivatingDoctor.fullName} deactivated. New bookings blocked.`);
      setDeactivatingDoctor(null);
      fetchDoctors();
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Failed to deactivate doctor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredDoctors = useMemo(() => {
    return doctors.filter((doc) => {
      // Role constraint: Logged-in doctor only sees his own profile details
      if (user?.role === 'DOCTOR') {
        const isSelf =
          (user.linkedEntityId && String(doc._id) === String(user.linkedEntityId)) ||
          (doc.userId && String(doc.userId._id || doc.userId) === String(user._id)) ||
          (doc.contactInfo?.email && doc.contactInfo.email.toLowerCase() === user.email?.toLowerCase()) ||
          (doc.userId?.email && doc.userId.email.toLowerCase() === user.email?.toLowerCase());

        if (!isSelf) return false;
      }

      const q = debouncedSearch.toLowerCase().trim();
      const matchesQuery =
        !q ||
        doc.fullName?.toLowerCase().includes(q) ||
        doc.doctorId?.toLowerCase().includes(q) ||
        doc.specialization?.toLowerCase().includes(q) ||
        doc.licenseNumber?.toLowerCase().includes(q);

      const matchesStatus = !statusFilter || doc.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [doctors, debouncedSearch, statusFilter, user]);

  const stats = useMemo(() => {
    const total = doctors.length;
    const active = doctors.filter(d => d.status === 'active').length;
    const available = doctors.filter(d => {
      const status = getDoctorAvailability(d);
      return status.label === 'Available Now';
    }).length;
    const dayOff = doctors.filter(d => {
      const status = getDoctorAvailability(d);
      return status.label === 'Day Off Today';
    }).length;
    return { total, active, available, dayOff };
  }, [doctors]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerTitle}>
            <Skeleton variant="text" height={28} width={210} />
            <Skeleton variant="text" height={16} width={460} />
          </div>
        </div>
        <div className={styles.statsGrid}>
          {[1, 2, 3, 4].map(i => <Skeleton key={i} variant="card" height={100} />)}
        </div>
        <Card>
          <CardBody>
            {[1,2,3,4,5,6,7].map(i => (
              <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--color-neutral-100)' }}>
                <Skeleton variant="circle" width={40} height={40} />
                {[140,120,110,100,90,80,70].map((w, j) => <Skeleton key={j} variant="text" width={w} height={14} />)}
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
          <h2>Doctor Management</h2>
          <p>
            Manage clinical doctor profiles, PMDC license credentials, consultation fees, and weekly schedule capacities.
          </p>
        </div>
        {isAdmin && (
          <Button variant="primary" icon={<Plus size={16} />} onClick={handleOpenCreateModal}>
            Add Doctor Profile
          </Button>
        )}
      </div>

      {/* Stats Summary Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#ecfeff', color: '#0891b2' }}>
            <Stethoscope size={22} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}><CountUp value={stats.total} /></span>
            <span className={styles.statLabel}>Total Doctors</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#f0fdf4', color: '#16a34a' }}>
            <UserCheck size={22} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}><CountUp value={stats.active} /></span>
            <span className={styles.statLabel}>Active Clinical Staff</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#f0fdf4', color: '#10b981' }}>
            <CheckCircle size={22} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}><CountUp value={stats.available} /></span>
            <span className={styles.statLabel}>Available Right Now</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#fffbeb', color: '#d97706' }}>
            <AlertTriangle size={22} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}><CountUp value={stats.dayOff} /></span>
            <span className={styles.statLabel}>Day Off Today</span>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className={styles.searchForm}>
            <div className={styles.searchInputWrapper}>
              <Input
                placeholder="Search by Doctor Name, ID (DOC-...), PMDC License, or Specialization..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                icon={<Search size={16} />}
              />
            </div>
            <select
              className={styles.filterSelect}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Account Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </CardHeader>
        <CardBody>
          {loading ? (
            <div className={styles.loader}><Spinner /><span>Loading doctor registry...</span></div>
          ) : error ? (
            <div className={styles.error}>{error}</div>
          ) : filteredDoctors.length === 0 ? (
            <div className={styles.empty}>
              <UserCheck size={36} color="var(--color-neutral-400)" />
              <span>No doctor profiles match your filter criteria.</span>
            </div>
          ) : (
            <>
              {/* Desktop / Tablet Table View */}
              <div className={styles.tableResponsive}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Doctor ID</th>
                      <th>Name & Qualification</th>
                      <th>Specialization</th>
                      <th>PMDC License</th>
                      <th>Fee (PKR)</th>
                      <th>Availability Today</th>
                      <th>Account Status</th>
                      {isAdmin && <th>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDoctors.map(doc => {
                      const avail = getDoctorAvailability(doc);
                      return (
                        <tr key={doc._id}>
                          <td style={{ fontWeight: 600, color: 'var(--color-primary-700)' }}>
                            {doc.doctorId}
                          </td>
                          <td>
                            <div className={styles.doctorMeta}>
                              <span className={styles.doctorName}>{doc.fullName}</span>
                              <span className={styles.doctorSub}>{doc.qualification}</span>
                            </div>
                          </td>
                          <td>
                            <Badge variant="info">{doc.specialization}</Badge>
                          </td>
                          <td>
                            <span className={styles.licenseBadge}>{doc.licenseNumber}</span>
                          </td>
                          <td style={{ fontWeight: 600, color: 'var(--color-neutral-900)' }}>
                            Rs. {doc.consultationFee?.toLocaleString()}
                          </td>
                          <td>
                            <span className={`${styles.availabilityTag} ${avail.className}`}>
                              {avail.isPulse && <span className={styles.pulseDot} />}
                              {avail.icon}
                              {avail.label}
                            </span>
                          </td>
                          <td>
                            <Badge variant={doc.status === 'active' ? 'success' : 'danger'}>
                              {doc.status?.toUpperCase()}
                            </Badge>
                          </td>
                          {isAdmin && (
                          <td>
                            <div className={styles.actions}>
                              <Button
                                variant="ghost"
                                size="sm"
                                icon={<Calendar size={15} color="var(--color-primary-600)" />}
                                title="Manage Weekly Schedule & Capacity"
                                onClick={() => handleOpenScheduleModal(doc)}
                              />
                              {isAdmin && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    icon={<Edit size={15} />}
                                    title="Edit Profile"
                                    onClick={() => handleOpenEditModal(doc)}
                                  />
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    icon={<Trash2 size={15} color="var(--color-danger-500)" />}
                                    title="Deactivate Doctor"
                                    onClick={() => setDeactivatingDoctor(doc)}
                                    disabled={doc.status === 'inactive'}
                                  />
                                </>
                              )}
                            </div>
                          </td>
                        )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards View */}
              <div className={styles.mobileCardsGrid}>
                {filteredDoctors.map(doc => {
                  const avail = getDoctorAvailability(doc);
                  return (
                    <div key={doc._id} className={styles.mobileCard}>
                      <div className={styles.mobileCardHeader}>
                        <div className={styles.doctorMeta}>
                          <span className={styles.doctorName}>{doc.fullName}</span>
                          <span className={styles.doctorSub}>{doc.qualification} • {doc.doctorId}</span>
                        </div>
                        <Badge variant={doc.status === 'active' ? 'success' : 'danger'}>
                          {doc.status}
                        </Badge>
                      </div>

                      <div className={styles.mobileCardBody}>
                        <div className={styles.mobileCardMetaItem}>
                          <span className={styles.mobileCardLabel}>Specialization</span>
                          <span className={styles.mobileCardValue}>{doc.specialization}</span>
                        </div>
                        <div className={styles.mobileCardMetaItem}>
                          <span className={styles.mobileCardLabel}>License No.</span>
                          <span className={styles.licenseBadge}>{doc.licenseNumber}</span>
                        </div>
                        <div className={styles.mobileCardMetaItem}>
                          <span className={styles.mobileCardLabel}>Fee</span>
                          <span className={styles.mobileCardValue}>Rs. {doc.consultationFee?.toLocaleString()}</span>
                        </div>
                        <div className={styles.mobileCardMetaItem}>
                          <span className={styles.mobileCardLabel}>Today's Status</span>
                          <span className={`${styles.availabilityTag} ${avail.className}`}>
                            {avail.isPulse && <span className={styles.pulseDot} />}
                            {avail.label}
                          </span>
                        </div>
                      </div>

                      <div className={styles.mobileCardFooter}>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Calendar size={14} />}
                          onClick={() => handleOpenScheduleModal(doc)}
                        >
                          Schedule
                        </Button>
                        {isAdmin && (
                          <div className={styles.actions}>
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<Edit size={14} />}
                              onClick={() => handleOpenEditModal(doc)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<Trash2 size={14} color="var(--color-danger-500)" />}
                              onClick={() => setDeactivatingDoctor(doc)}
                              disabled={doc.status === 'inactive'}
                            >
                              Deactivate
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </CardBody>
      </Card>

      {/* 1 & 2. Create / Edit Doctor Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingDoctor ? `Edit Profile — ${editingDoctor.fullName}` : 'Add New Doctor Profile'}
        >
          <form onSubmit={handleSubmitDoctor} style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingTop: '10px' }}>
            <div className={styles.formGrid}>
              <Input
                label="Full Name (e.g. Dr. Ahmed Khan)"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
                placeholder="Dr. Full Name"
              />
              <Input
                label="PMDC / License Number"
                value={formData.licenseNumber}
                onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                required
                placeholder="PMDC-12345-P"
              />
            </div>

            <div className={styles.formGrid}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-neutral-700)', marginBottom: '4px' }}>
                  Specialization *
                </label>
                <select
                  className={styles.filterSelect}
                  style={{ width: '100%' }}
                  value={formData.specialization}
                  onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  required
                >
                  {SPECIALIZATIONS.map(spec => (
                    <option key={spec} value={spec}>{spec}</option>
                  ))}
                </select>
              </div>

              <Input
                label="Qualification"
                value={formData.qualification}
                onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                required
                placeholder="e.g. MBBS, FCPS (Cardiology)"
              />
            </div>

            <div className={styles.formGrid}>
              <Input
                label="Consultation Fee (PKR)"
                type="number"
                min="0"
                step="50"
                value={formData.consultationFee}
                onChange={(e) => setFormData({ ...formData, consultationFee: e.target.value })}
                required
                placeholder="1500"
              />
              <Input
                label="Phone Number"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="0300-1234567"
              />
            </div>

            <div className={styles.formGrid}>
              <Input
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="doctor@subhancare.com"
              />
              <Input
                label="Clinic / Residential Address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="House #, Street, Area, City"
              />
            </div>

            {!editingDoctor && (
              <>
                <Input
                  label="User Login Password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Leave blank for default: Password@123"
                  showPasswordToggle
                />
                {formData.password && <PasswordValidator password={formData.password} />}
              </>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting ? <Spinner size="sm" /> : (editingDoctor ? 'Save Changes' : 'Create Profile')}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* 3. Deactivation Confirmation Modal */}
      {deactivatingDoctor && (
        <Modal
          isOpen={Boolean(deactivatingDoctor)}
          onClose={() => setDeactivatingDoctor(null)}
          title="Deactivate Doctor Profile"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '10px' }}>
            <div className={styles.deactivateWarningBox}>
              <div className={styles.deactivateWarningTitle}>
                <ShieldAlert size={20} />
                <span>Confirm Doctor Deactivation</span>
              </div>
              <div>
                Are you sure you want to deactivate <strong>Dr. {deactivatingDoctor.fullName}</strong> ({deactivatingDoctor.doctorId})?
              </div>
            </div>

            <p style={{ fontSize: '0.875rem', color: 'var(--color-neutral-600)', margin: 0 }}>
              Deactivating this doctor will <strong>block new appointment bookings</strong> across the portal. Historical medical records and billing entries will remain safely preserved.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
              <Button type="button" variant="ghost" onClick={() => setDeactivatingDoctor(null)}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                disabled={isSubmitting}
                onClick={handleConfirmDeactivate}
              >
                {isSubmitting ? <Spinner size="sm" /> : 'Confirm Deactivation'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* 6. Interactive Weekly Schedule & Patient Capacity Modal */}
      {isScheduleModalOpen && (
        <Modal
          isOpen={isScheduleModalOpen}
          onClose={() => setIsScheduleModalOpen(false)}
          size="lg"
          title={`Weekly Schedule & Slot Capacity — Dr. ${editingDoctor?.fullName || ''}`}
        >
          <form onSubmit={handleSaveSchedule} style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingTop: '10px' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-neutral-600)', margin: 0 }}>
              {isAdmin 
                ? "Configure working days, available shift times, and maximum patient capacity limit per working day."
                : "Weekly consultation schedule and daily patient capacity limit for front-desk scheduling."}
            </p>

            <div className={styles.scheduleList}>
              {scheduleData.map((item, index) => (
                <div
                  key={item.day}
                  className={`${styles.scheduleRow} ${!item.isWorking ? styles.scheduleRowInactive : ''}`}
                >
                  <label className={styles.dayCheckboxLabel}>
                    <input
                      type="checkbox"
                      checked={item.isWorking}
                      disabled={!isAdmin}
                      onChange={(e) => {
                        const updated = [...scheduleData];
                        updated[index].isWorking = e.target.checked;
                        setScheduleData(updated);
                      }}
                    />
                    {item.day}
                  </label>

                  {item.isWorking ? (
                    <>
                      <div className={styles.timeGroup}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-neutral-500)' }}>Start:</span>
                        <input
                          type="time"
                          className={styles.timeInput}
                          value={item.startTime}
                          disabled={!isAdmin}
                          onChange={(e) => {
                            const updated = [...scheduleData];
                            updated[index].startTime = e.target.value;
                            setScheduleData(updated);
                          }}
                        />
                      </div>
                      <div className={styles.timeGroup}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-neutral-500)' }}>End:</span>
                        <input
                          type="time"
                          className={styles.timeInput}
                          value={item.endTime}
                          disabled={!isAdmin}
                          onChange={(e) => {
                            const updated = [...scheduleData];
                            updated[index].endTime = e.target.value;
                            setScheduleData(updated);
                          }}
                        />
                      </div>
                      <div className={styles.timeGroup}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-neutral-500)', whiteSpace: 'nowrap' }}>Max Patients:</span>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          className={styles.capacityInput}
                          value={item.maxPatients || 20}
                          disabled={!isAdmin}
                          onChange={(e) => {
                            const updated = [...scheduleData];
                            updated[index].maxPatients = Number(e.target.value);
                            setScheduleData(updated);
                          }}
                        />
                      </div>
                    </>
                  ) : (
                    <span className={styles.dayOffText}>Day Off / Not Available</span>
                  )}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <Button type="button" variant="ghost" onClick={() => setIsScheduleModalOpen(false)}>
                {isAdmin ? 'Cancel' : 'Close'}
              </Button>
              {isAdmin && (
                <Button type="submit" variant="primary" disabled={isSubmitting}>
                  {isSubmitting ? <Spinner size="sm" /> : 'Save Schedule'}
                </Button>
              )}
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default DoctorsPage;
