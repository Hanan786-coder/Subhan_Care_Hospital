import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { getStaffList, createStaff, updateStaff, deactivateStaff } from '../../services/staffService';
import { Card, CardBody, CardHeader, Button, Badge, Spinner, Input, Modal, PasswordValidator, isPasswordValid } from '../../components/ui';
import { 
  Plus, Edit, Trash2, Search, UserCheck, Shield, Clock, 
  Phone, Mail, MapPin, Users, AlertTriangle, Eye, Check, XCircle, RotateCcw
} from 'lucide-react';
import useDebounce from '../../hooks/useDebounce';
import toast from 'react-hot-toast';
import { ROLES, ROLE_LABELS, ROLE_PERMISSIONS } from '../../constants/roles';
import styles from './StaffPage.module.css';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_ABBR = { Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed', Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat', Sunday: 'Sun' };

const ROLE_BADGE_VARIANTS = {
  [ROLES.RECEPTIONIST]: 'info',
  [ROLES.PHARMACIST]: 'warning',
  [ROLES.BILLING_STAFF]: 'success',
  [ROLES.ADMIN]: 'primary',
  [ROLES.DOCTOR]: 'secondary'
};

const StaffPage = () => {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Search & Filter state
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Add / Edit Modal state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Deactivate Modal state
  const [deactivateTarget, setDeactivateTarget] = useState(null);
  const [isDeactivating, setIsDeactivating] = useState(false);

  // View Details Modal state
  const [viewingStaff, setViewingStaff] = useState(null);

  // Form State
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

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (roleFilter) params.role = roleFilter;

      const response = await getStaffList(params);
      setStaffList(response.data || []);
      setError(null);
    } catch (err) {
      setError('Failed to load staff list. Please check connection and permissions.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, roleFilter]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = staffList.length;
    const active = staffList.filter(s => s.status === 'active').length;
    const receptionists = staffList.filter(s => s.role === ROLES.RECEPTIONIST).length;
    const pharmacists = staffList.filter(s => s.role === ROLES.PHARMACIST).length;
    const billing = staffList.filter(s => s.role === ROLES.BILLING_STAFF).length;
    return { total, active, receptionists, pharmacists, billing };
  }, [staffList]);

  // Handle modal open for Create
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
    setIsFormModalOpen(true);
  };

  // Handle modal open for Edit
  const handleOpenEditModal = (staff) => {
    setEditingStaff(staff);
    setFormData({
      fullName: staff.fullName || '',
      role: staff.role || 'RECEPTIONIST',
      email: staff.contactInfo?.email || staff.userId?.email || '',
      phone: staff.contactInfo?.phone || '',
      address: staff.contactInfo?.address || '',
      password: '',
      shiftStart: staff.shiftTiming?.start || '08:00',
      shiftEnd: staff.shiftTiming?.end || '16:00',
      shiftDays: staff.shiftTiming?.days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    });
    setIsFormModalOpen(true);
  };

  // Toggle Shift Day in form
  const handleToggleDay = (day) => {
    setFormData(prev => {
      const exists = prev.shiftDays.includes(day);
      if (exists) {
        if (prev.shiftDays.length === 1) {
          toast.error('Staff must work at least 1 day per week');
          return prev;
        }
        return { ...prev, shiftDays: prev.shiftDays.filter(d => d !== day) };
      } else {
        return { ...prev, shiftDays: [...prev.shiftDays, day] };
      }
    });
  };

  // Form Submit Handler (Add or Edit)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      toast.error('Full Name is required');
      return;
    }
    if (formData.password && !isPasswordValid(formData.password)) {
      toast.error('Password does not meet complexity requirements');
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
        toast.success('Staff member updated successfully');
      } else {
        await createStaff(payload);
        toast.success('Staff member created successfully');
      }
      setIsFormModalOpen(false);
      fetchStaff();
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirm Deactivation
  const handleConfirmDeactivate = async () => {
    if (!deactivateTarget) return;
    setIsDeactivating(true);
    try {
      await deactivateStaff(deactivateTarget._id);
      toast.success(`Staff member "${deactivateTarget.fullName}" deactivated. Active sessions invalidated.`);
      setDeactivateTarget(null);
      fetchStaff();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to deactivate staff member.');
    } finally {
      setIsDeactivating(false);
    }
  };

  // Filter staff list based on debounced search, role, and status
  const filteredStaff = useMemo(() => {
    return staffList.filter(s => {
      const q = debouncedSearch.toLowerCase().trim();
      const matchesSearch = !q || 
        s.fullName?.toLowerCase().includes(q) || 
        s.staffId?.toLowerCase().includes(q) || 
        s.role?.toLowerCase().includes(q) ||
        s.contactInfo?.email?.toLowerCase().includes(q) ||
        s.contactInfo?.phone?.includes(q);
      
      const matchesRole = !roleFilter || s.role === roleFilter;
      const matchesStatus = !statusFilter || s.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [staffList, debouncedSearch, roleFilter, statusFilter]);

  // Reset all filters
  const handleResetFilters = () => {
    setSearch('');
    setRoleFilter('');
    setStatusFilter('');
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <h2>Staff Management</h2>
          <p>
            Provision, schedule, and assign roles for front-desk, pharmacy, and billing personnel.
          </p>
        </div>
        <Button variant="primary" icon={<Plus size={16} />} onClick={handleOpenCreateModal}>
          Add Staff Member
        </Button>
      </div>

      {/* Summary KPI Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(8, 145, 178, 0.15)', color: 'var(--color-primary-600)' }}>
            <Users size={24} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{stats.total}</span>
            <span className={styles.statLabel}>Total Staff Members</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#059669' }}>
            <UserCheck size={24} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{stats.active}</span>
            <span className={styles.statLabel}>Active Staff Accounts</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#2563eb' }}>
            <Shield size={24} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{stats.receptionists}</span>
            <span className={styles.statLabel}>Receptionists</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#d97706' }}>
            <Clock size={24} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{stats.pharmacists}</span>
            <span className={styles.statLabel}>Pharmacists</span>
          </div>
        </div>
      </div>

      {/* Main Staff Card & Table */}
      <Card>
        <CardHeader>
          <div className={styles.searchForm}>
            <div className={styles.searchInputWrapper}>
              <Input
                placeholder="Search by staff name, ID, email, or role..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                icon={<Search size={16} />}
              />
            </div>
            
            <select
              className={styles.filterSelect}
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="">All Roles</option>
              <option value={ROLES.RECEPTIONIST}>Receptionist</option>
              <option value={ROLES.PHARMACIST}>Pharmacist</option>
              <option value={ROLES.BILLING_STAFF}>Billing Staff</option>
              <option value={ROLES.ADMIN}>Administrator</option>
            </select>

            <select
              className={styles.filterSelect}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>

            {(search || roleFilter || statusFilter) && (
              <Button variant="ghost" icon={<RotateCcw size={14} />} onClick={handleResetFilters}>
                Reset
              </Button>
            )}
          </div>
        </CardHeader>

        <CardBody>
          {loading ? (
            <div className={styles.loader}>
              <Spinner />
              <span>Fetching staff records...</span>
            </div>
          ) : error ? (
            <div className={styles.error}>{error}</div>
          ) : filteredStaff.length === 0 ? (
            <div className={styles.empty}>
              <UserCheck size={36} color="var(--color-neutral-400)" />
              <span>No staff members match the specified filters.</span>
            </div>
          ) : (
            <div className={styles.tableResponsive}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Staff ID</th>
                    <th>Name</th>
                    <th>Role Badge</th>
                    <th>Contact Information</th>
                    <th>Shift & Working Days</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStaff.map(staff => {
                    const days = staff.shiftTiming?.days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
                    return (
                      <tr key={staff._id}>
                        <td style={{ fontWeight: 600, color: 'var(--color-primary-700)', fontFamily: 'monospace' }}>
                          {staff.staffId || 'STF-???'}
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--color-neutral-900)' }}>{staff.fullName}</div>
                          {staff.contactInfo?.address && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-neutral-500)', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}>
                              <MapPin size={11} /> {staff.contactInfo.address}
                            </div>
                          )}
                        </td>
                        <td>
                          <Badge variant={ROLE_BADGE_VARIANTS[staff.role] || 'info'}>
                            {ROLE_LABELS[staff.role] || staff.role}
                          </Badge>
                        </td>
                        <td>
                          <div style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Mail size={12} color="var(--color-neutral-400)" />
                            {staff.contactInfo?.email || staff.userId?.email || 'N/A'}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-neutral-500)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                            <Phone size={11} color="var(--color-neutral-400)" />
                            {staff.contactInfo?.phone || 'No phone'}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize: '0.85rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={13} color="var(--color-primary-600)" />
                            {staff.shiftTiming?.start || '08:00'} - {staff.shiftTiming?.end || '16:00'}
                          </div>
                          <div className={styles.shiftPills}>
                            {DAYS_OF_WEEK.map(day => (
                              <span 
                                key={day} 
                                className={`${styles.dayPill} ${days.includes(day) ? styles.dayPillActive : ''}`}
                              >
                                {DAY_ABBR[day]}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td>
                          <Badge variant={staff.status === 'active' ? 'success' : 'danger'}>
                            {staff.status === 'active' ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td>
                          <div className={styles.actions}>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              icon={<Eye size={15} />} 
                              title="View Details" 
                              onClick={() => setViewingStaff(staff)} 
                            />
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              icon={<Edit size={15} />} 
                              title="Edit Staff" 
                              onClick={() => handleOpenEditModal(staff)} 
                            />
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              icon={<Trash2 size={15} color={staff.status === 'inactive' ? 'var(--color-neutral-400)' : 'var(--color-danger-500)'} />} 
                              title={staff.status === 'inactive' ? 'Already Deactivated' : 'Deactivate Staff'}
                              onClick={() => setDeactivateTarget(staff)}
                              disabled={staff.status === 'inactive'}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Create / Edit Staff Modal */}
      {isFormModalOpen && (
        <Modal
          isOpen={isFormModalOpen}
          onClose={() => setIsFormModalOpen(false)}
          title={editingStaff ? `Edit Staff Profile: ${editingStaff.staffId}` : 'Add New Staff Member'}
        >
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingTop: '10px' }}>
            <Input
              label="Full Name *"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              required
              placeholder="e.g. Tariq Mahmood"
            />

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-neutral-800)' }}>
                Role Assignment
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border-soft)',
                  background: 'var(--color-surface-card)',
                  color: 'var(--color-neutral-900)',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              >
                <option value={ROLES.RECEPTIONIST}>Receptionist (Front Desk)</option>
                <option value={ROLES.PHARMACIST}>Pharmacist (Medication & Inventory)</option>
                <option value={ROLES.BILLING_STAFF}>Billing Staff (Invoices & Payments)</option>
                <option value={ROLES.ADMIN}>System Administrator</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Input
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="staff@subhancare.com"
                icon={<Mail size={16} />}
              />

              <Input
                label="Phone Number"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="0300-1234567"
                icon={<Phone size={16} />}
              />
            </div>

            <Input
              label="Contact Address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="House/Street, Area, City"
              icon={<MapPin size={16} />}
            />

            {!editingStaff && (
              <>
                <Input
                  label="Account Password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Default: Password@123 if left blank"
                  showPasswordToggle
                />
                {formData.password && <PasswordValidator password={formData.password} />}
              </>
            )}

            {/* Shift & Working Hours */}
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-neutral-800)' }}>
                Shift Timing & Working Hours
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <Input
                  label="Shift Start Time"
                  type="time"
                  value={formData.shiftStart}
                  onChange={(e) => setFormData({ ...formData, shiftStart: e.target.value })}
                />
                <Input
                  label="Shift End Time"
                  type="time"
                  value={formData.shiftEnd}
                  onChange={(e) => setFormData({ ...formData, shiftEnd: e.target.value })}
                />
              </div>
            </div>

            {/* Working Shift Days Selector */}
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-neutral-800)' }}>
                Shift Working Days
              </label>
              <div className={styles.shiftDaysGrid}>
                {DAYS_OF_WEEK.map(day => {
                  const selected = formData.shiftDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      className={`${styles.daySelectBtn} ${selected ? styles.daySelectBtnSelected : ''}`}
                      onClick={() => handleToggleDay(day)}
                    >
                      {selected && <Check size={12} style={{ display: 'inline', marginRight: '4px' }} />}
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Form Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '14px', borderTop: '1px solid var(--color-border-soft)', paddingTop: '12px' }}>
              <Button type="button" variant="ghost" onClick={() => setIsFormModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting ? <Spinner size="sm" /> : (editingStaff ? 'Update Staff Member' : 'Create Staff Member')}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Deactivation Confirmation Modal */}
      {deactivateTarget && (
        <Modal
          isOpen={Boolean(deactivateTarget)}
          onClose={() => setDeactivateTarget(null)}
          title="Deactivate Staff Account"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--color-neutral-800)' }}>
              Are you sure you want to deactivate staff member <strong>{deactivateTarget.fullName}</strong> ({deactivateTarget.staffId})?
            </p>

            <div className={styles.deactivateWarning}>
              <AlertTriangle size={24} />
              <div>
                <strong>Security Notice:</strong>
                <div style={{ marginTop: '4px', fontSize: '0.825rem' }}>
                  Deactivating this staff profile will immediately set their linked user account to <em>inactive</em>, invalidating any active login sessions and blocking system access.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
              <Button variant="ghost" onClick={() => setDeactivateTarget(null)} disabled={isDeactivating}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleConfirmDeactivate} disabled={isDeactivating}>
                {isDeactivating ? <Spinner size="sm" /> : 'Confirm Deactivation'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Viewing Details Modal */}
      {viewingStaff && (
        <Modal
          isOpen={Boolean(viewingStaff)}
          onClose={() => setViewingStaff(null)}
          title={`Staff Profile: ${viewingStaff.fullName}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-surface-muted)', padding: '12px 16px', borderRadius: '8px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-neutral-500)' }}>Staff ID</span>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-primary-700)', fontFamily: 'monospace' }}>{viewingStaff.staffId}</div>
              </div>
              <Badge variant={ROLE_BADGE_VARIANTS[viewingStaff.role] || 'info'}>
                {ROLE_LABELS[viewingStaff.role] || viewingStaff.role}
              </Badge>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.9rem' }}>
              <div>
                <strong style={{ color: 'var(--color-neutral-500)', fontSize: '0.8rem' }}>Email Address:</strong>
                <div>{viewingStaff.contactInfo?.email || viewingStaff.userId?.email || 'N/A'}</div>
              </div>
              <div>
                <strong style={{ color: 'var(--color-neutral-500)', fontSize: '0.8rem' }}>Phone Number:</strong>
                <div>{viewingStaff.contactInfo?.phone || 'N/A'}</div>
              </div>
              <div>
                <strong style={{ color: 'var(--color-neutral-500)', fontSize: '0.8rem' }}>Shift Hours:</strong>
                <div>{viewingStaff.shiftTiming?.start || '08:00'} - {viewingStaff.shiftTiming?.end || '16:00'}</div>
              </div>
              <div>
                <strong style={{ color: 'var(--color-neutral-500)', fontSize: '0.8rem' }}>Status:</strong>
                <div>
                  <Badge variant={viewingStaff.status === 'active' ? 'success' : 'danger'}>
                    {viewingStaff.status}
                  </Badge>
                </div>
              </div>
            </div>

            <div>
              <strong style={{ color: 'var(--color-neutral-500)', fontSize: '0.8rem' }}>Address:</strong>
              <div>{viewingStaff.contactInfo?.address || 'No address registered'}</div>
            </div>

            <div>
              <strong style={{ color: 'var(--color-neutral-500)', fontSize: '0.8rem' }}>Assigned Shift Days:</strong>
              <div className={styles.shiftPills} style={{ marginTop: '4px' }}>
                {DAYS_OF_WEEK.map(day => {
                  const active = (viewingStaff.shiftTiming?.days || []).includes(day);
                  return (
                    <span key={day} className={`${styles.dayPill} ${active ? styles.dayPillActive : ''}`}>
                      {day}
                    </span>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <Button variant="ghost" onClick={() => setViewingStaff(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default StaffPage;
