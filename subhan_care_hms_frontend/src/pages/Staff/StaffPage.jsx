import React, { useEffect, useState } from 'react';
import { getStaffList, createStaff, updateStaff, deactivateStaff } from '../../services/staffService';
import { Card, CardBody, CardHeader, Button, Badge, Spinner, Input, Modal } from '../../components/ui';
import { Plus, Edit, Trash2, Search, UserCheck, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import styles from '../Patients/Patients.module.css';

const StaffList = () => {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    role: 'RECEPTIONIST',
    email: '',
    phone: '',
    address: '',
    password: '',
    shiftStart: '08:00',
    shiftEnd: '16:00',
    shiftDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  });

  useEffect(() => {
    fetchStaff();
  }, [statusFilter]);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const data = await getStaffList(statusFilter ? { status: statusFilter } : {});
      setStaffList(data.data || []);
      setError(null);
    } catch (err) {
      setError('Failed to load staff list.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
  };

  const handleOpenCreateModal = () => {
    setEditingStaff(null);
    setFormData({
      fullName: '',
      role: 'RECEPTIONIST',
      email: '',
      phone: '',
      address: '',
      password: '',
      shiftStart: '08:00',
      shiftEnd: '16:00',
      shiftDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (staff) => {
    setEditingStaff(staff);
    setFormData({
      fullName: staff.fullName || '',
      role: staff.role || 'RECEPTIONIST',
      email: staff.contactInfo?.email || '',
      phone: staff.contactInfo?.phone || '',
      address: staff.contactInfo?.address || '',
      password: '',
      shiftStart: staff.shiftTiming?.start || '08:00',
      shiftEnd: staff.shiftTiming?.end || '16:00',
      shiftDays: staff.shiftTiming?.days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      toast.error('Full name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        fullName: formData.fullName.trim(),
        role: formData.role,
        contactInfo: {
          phone: formData.phone,
          email: formData.email,
          address: formData.address
        },
        shiftTiming: {
          start: formData.shiftStart,
          end: formData.shiftEnd,
          days: formData.shiftDays
        },
        email: formData.email,
        password: formData.password || undefined
      };

      if (editingStaff) {
        await updateStaff(editingStaff._id, payload);
        toast.success('Staff updated successfully');
      } else {
        await createStaff(payload);
        toast.success('Staff created successfully');
      }
      setIsModalOpen(false);
      fetchStaff();
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Action failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to deactivate this staff member? Active sessions will be invalidated.')) {
      try {
        await deactivateStaff(id);
        toast.success('Staff member deactivated successfully');
        fetchStaff();
      } catch (err) {
        toast.error('Failed to deactivate staff.');
      }
    }
  };

  const filteredStaff = staffList.filter(s => {
    const q = search.toLowerCase();
    return !q || s.fullName?.toLowerCase().includes(q) || s.staffId?.toLowerCase().includes(q) || s.role?.toLowerCase().includes(q);
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <h2>Staff Management</h2>
          <p>
            Provision and manage front-desk, pharmacy, and billing staff accounts with role assignments.
          </p>
        </div>
        <Button variant="primary" icon={<Plus size={16} />} onClick={handleOpenCreateModal}>
          Add Staff Member
        </Button>
      </div>

      <Card>
        <CardHeader>
          <form className={styles.searchForm} onSubmit={handleSearchSubmit}>
            <div style={{ flex: 1 }}>
              <Input
                placeholder="Search staff by name, ID, or role..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                icon={<Search size={16} />}
              />
            </div>
            <Button type="submit" variant="secondary" icon={<Search size={16} />}>
              Search
            </Button>
            <select
              className={styles.filterSelect}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </form>
        </CardHeader>
        <CardBody>
          {loading ? (
            <div className={styles.loader}><Spinner /><span>Loading staff records...</span></div>
          ) : error ? (
            <div className={styles.error}>{error}</div>
          ) : filteredStaff.length === 0 ? (
            <div className={styles.empty}>
              <UserCheck size={32} color="var(--color-neutral-400)" />
              <span>No staff members found matching criteria.</span>
            </div>
          ) : (
            <div className={styles.tableResponsive}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Staff ID</th>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Contact</th>
                    <th>Shift Timing</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStaff.map(staff => (
                    <tr key={staff._id}>
                      <td style={{ fontWeight: 600, color: 'var(--color-primary-700)' }}>{staff.staffId}</td>
                      <td style={{ fontWeight: 500 }}>{staff.fullName}</td>
                      <td>
                        <Badge variant="info">{staff.role}</Badge>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.85rem' }}>{staff.contactInfo?.email || staff.userId?.email || 'N/A'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-neutral-400)' }}>{staff.contactInfo?.phone}</div>
                      </td>
                      <td>{staff.shiftTiming?.start || '08:00'} - {staff.shiftTiming?.end || '16:00'}</td>
                      <td>
                        <Badge variant={staff.status === 'active' ? 'success' : 'danger'}>
                          {staff.status}
                        </Badge>
                      </td>
                      <td>
                        <div className={styles.actions}>
                          <Button variant="ghost" size="sm" icon={<Edit size={15} />} title="Edit" onClick={() => handleOpenEditModal(staff)} />
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            icon={<Trash2 size={15} color="var(--color-danger-500)" />} 
                            title="Deactivate"
                            onClick={() => handleDelete(staff._id)}
                            disabled={staff.status === 'inactive'}
                          />
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

      {/* Create / Edit Staff Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingStaff ? 'Edit Staff Profile' : 'Add New Staff Member'}
        >
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingTop: '10px' }}>
            <Input
              label="Full Name"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              required
              placeholder="e.g. Tariq Mahmood"
            />

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600 }}>
                Role Assignment (FR-03.1)
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border-soft)', background: 'var(--color-surface-card)', color: 'var(--color-neutral-900)' }}
              >
                <option value="RECEPTIONIST">Receptionist</option>
                <option value="PHARMACIST">Pharmacist</option>
                <option value="BILLING_STAFF">Billing Staff</option>
              </select>
            </div>

            <Input
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="staff@subhancare.com"
            />

            <Input
              label="Phone Number"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="0300-1234567"
            />

            {!editingStaff && (
              <Input
                label="Account Password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Leave blank for default Password@123"
                showPasswordToggle
              />
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Input
                label="Shift Start"
                type="time"
                value={formData.shiftStart}
                onChange={(e) => setFormData({ ...formData, shiftStart: e.target.value })}
              />
              <Input
                label="Shift End"
                type="time"
                value={formData.shiftEnd}
                onChange={(e) => setFormData({ ...formData, shiftEnd: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting ? <Spinner size="sm" /> : (editingStaff ? 'Update Staff' : 'Create Staff')}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default StaffList;
