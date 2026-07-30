import React, { useEffect, useState } from 'react';
import { getDoctors, createDoctor, updateDoctor, updateDoctorSchedule, deactivateDoctor } from '../../services/doctorService';
import { Card, CardBody, CardHeader, Button, Badge, Spinner, Input, Modal } from '../../components/ui';
import { Plus, Edit, Trash2, Search, Calendar, UserCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import styles from '../Patients/Patients.module.css';

const DoctorList = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [statusFilter, setStatusFilter] = useState('');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    specialization: 'General Physician',
    qualification: 'MBBS',
    licenseNumber: '',
    phone: '',
    email: '',
    password: '',
    consultationFee: 1500
  });

  const [scheduleData, setScheduleData] = useState([
    { day: 'Monday', isWorking: true, startTime: '09:00', endTime: '17:00', maxPatients: 20 },
    { day: 'Tuesday', isWorking: true, startTime: '09:00', endTime: '17:00', maxPatients: 20 },
    { day: 'Wednesday', isWorking: true, startTime: '09:00', endTime: '17:00', maxPatients: 20 },
    { day: 'Thursday', isWorking: true, startTime: '09:00', endTime: '17:00', maxPatients: 20 },
    { day: 'Friday', isWorking: true, startTime: '09:00', endTime: '17:00', maxPatients: 20 },
    { day: 'Saturday', isWorking: false, startTime: '09:00', endTime: '13:00', maxPatients: 10 },
    { day: 'Sunday', isWorking: false, startTime: '09:00', endTime: '13:00', maxPatients: 0 },
  ]);

  useEffect(() => {
    fetchDoctors();
  }, [statusFilter]);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const data = await getDoctors(statusFilter ? { status: statusFilter } : {});
      setDoctors(data.data || []);
      setError(null);
    } catch (err) {
      setError('Failed to load doctors.');
    } finally {
      setLoading(false);
    }
  };

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
    if (doc.schedule && doc.schedule.length > 0) {
      setScheduleData(doc.schedule);
    }
    setIsScheduleModalOpen(true);
  };

  const handleSubmitDoctor = async (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.licenseNumber) {
      toast.error('Name and License Number are required');
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
        toast.success('Doctor profile updated');
      } else {
        await createDoctor(payload);
        toast.success('Doctor created successfully');
      }
      setIsModalOpen(false);
      fetchDoctors();
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Failed to save doctor');
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
      toast.success('Doctor weekly schedule updated');
      setIsScheduleModalOpen(false);
      fetchDoctors();
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Failed to update schedule');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to deactivate this doctor? New appointment bookings will be blocked.')) {
      try {
        await deactivateDoctor(id);
        toast.success('Doctor profile deactivated');
        fetchDoctors();
      } catch (err) {
        toast.error('Failed to deactivate doctor.');
      }
    }
  };

  const filteredDoctors = doctors.filter(doc => {
    const q = debouncedSearch.toLowerCase();
    return !q || doc.fullName?.toLowerCase().includes(q) || doc.doctorId?.toLowerCase().includes(q) || doc.specialization?.toLowerCase().includes(q) || doc.licenseNumber?.toLowerCase().includes(q);
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <h2>Doctor Management</h2>
          <p>
            Manage clinical doctor profiles, license credentials, and weekly availability schedules.
          </p>
        </div>
        {isAdmin && (
          <Button variant="primary" icon={<Plus size={16} />} onClick={handleOpenCreateModal}>
            Add Doctor Profile
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className={styles.searchForm}>
            <div style={{ flex: 1 }}>
              <Input
                placeholder="Search doctor by name, ID, license, or specialization..."
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
              <option value="">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </CardHeader>
        <CardBody>
          {loading ? (
            <div className={styles.loader}><Spinner /><span>Loading doctor profiles...</span></div>
          ) : error ? (
            <div className={styles.error}>{error}</div>
          ) : filteredDoctors.length === 0 ? (
            <div className={styles.empty}>
              <UserCheck size={32} color="var(--color-neutral-400)" />
              <span>No doctor profiles found.</span>
            </div>
          ) : (
            <div className={styles.tableResponsive}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Doctor ID</th>
                    <th>Name</th>
                    <th>Specialization</th>
                    <th>License No.</th>
                    <th>Fee (PKR)</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDoctors.map(doc => (
                    <tr key={doc._id}>
                      <td style={{ fontWeight: 600, color: 'var(--color-primary-700)' }}>{doc.doctorId}</td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{doc.fullName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-neutral-400)' }}>{doc.qualification}</div>
                      </td>
                      <td>
                        <Badge variant="info">{doc.specialization}</Badge>
                      </td>
                      <td><code style={{ fontSize: '0.8rem', background: 'var(--color-surface-muted)', padding: '2px 6px', borderRadius: '4px' }}>{doc.licenseNumber}</code></td>
                      <td style={{ fontWeight: 600 }}>Rs. {doc.consultationFee}</td>
                      <td>
                        <Badge variant={doc.status === 'active' ? 'success' : 'danger'}>
                          {doc.status}
                        </Badge>
                      </td>
                      <td>
                        <div className={styles.actions}>
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<Calendar size={15} color="var(--color-primary-600)" />}
                            title="Schedule"
                            onClick={() => handleOpenScheduleModal(doc)}
                          />
                          {isAdmin && (
                            <>
                              <Button variant="ghost" size="sm" icon={<Edit size={15} />} title="Edit" onClick={() => handleOpenEditModal(doc)} />
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                icon={<Trash2 size={15} color="var(--color-danger-500)" />} 
                                title="Deactivate"
                                onClick={() => handleDelete(doc._id)}
                                disabled={doc.status === 'inactive'}
                              />
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Create / Edit Doctor Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingDoctor ? 'Edit Doctor Profile' : 'Add New Doctor Profile'}
        >
          <form onSubmit={handleSubmitDoctor} style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingTop: '10px' }}>
            <Input
              label="Full Name (e.g. Dr. Ahmed Khan)"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              required
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Input
                label="Specialization"
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                required
              />
              <Input
                label="Qualification"
                value={formData.qualification}
                onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Input
                label="PMDC / License Number"
                value={formData.licenseNumber}
                onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                required
                placeholder="PMDC-12345-P"
              />
              <Input
                label="Consultation Fee (PKR)"
                type="number"
                value={formData.consultationFee}
                onChange={(e) => setFormData({ ...formData, consultationFee: e.target.value })}
                required
              />
            </div>

            <Input
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="doctor@subhancare.com"
            />
            <Input
              label="Phone Number"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="0300-1234567"
            />
            <Input
              label="Clinic/Residential Address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="House #, Street, Area, City"
            />

            {!editingDoctor && (
              <Input
                label="User Account Password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Leave blank for default Password@123"
                showPasswordToggle
              />
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting ? <Spinner size="sm" /> : (editingDoctor ? 'Save Changes' : 'Create Profile')}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Schedule Modal */}
      {isScheduleModalOpen && (
        <Modal
          isOpen={isScheduleModalOpen}
          onClose={() => setIsScheduleModalOpen(false)}
          title={`Weekly Schedule — ${editingDoctor?.fullName || ''}`}
        >
          <form onSubmit={handleSaveSchedule} style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingTop: '10px' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-neutral-600)' }}>
              Configure working days, available time slots, and slot capacities (FR-02.2).
            </p>
            {scheduleData.map((item, index) => (
              <div key={item.day} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', border: '1px solid var(--color-border-soft)', borderRadius: '8px', background: 'var(--color-surface-muted)' }}>
                <label style={{ width: '100px', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    checked={item.isWorking}
                    onChange={(e) => {
                      const updated = [...scheduleData];
                      updated[index].isWorking = e.target.checked;
                      setScheduleData(updated);
                    }}
                  />
                  {item.day}
                </label>

                {item.isWorking ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="time"
                      value={item.startTime}
                      onChange={(e) => {
                        const updated = [...scheduleData];
                        updated[index].startTime = e.target.value;
                        setScheduleData(updated);
                      }}
                      style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--color-border-soft)', background: 'var(--color-surface-card)', color: 'var(--color-neutral-900)' }}
                    />
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-neutral-500)' }}>to</span>
                    <input
                      type="time"
                      value={item.endTime}
                      onChange={(e) => {
                        const updated = [...scheduleData];
                        updated[index].endTime = e.target.value;
                        setScheduleData(updated);
                      }}
                      style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--color-border-soft)', background: 'var(--color-surface-card)', color: 'var(--color-neutral-900)' }}
                    />
                  </div>
                ) : (
                  <span style={{ color: 'var(--color-neutral-400)', fontSize: '0.85rem' }}>Day Off / Unavailable</span>
                )}
              </div>
            ))}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
              <Button type="button" variant="ghost" onClick={() => setIsScheduleModalOpen(false)}>Cancel</Button>
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting ? <Spinner size="sm" /> : 'Save Schedule'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default DoctorList;
