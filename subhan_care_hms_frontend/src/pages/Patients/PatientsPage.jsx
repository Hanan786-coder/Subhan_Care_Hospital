import React, { useEffect, useState } from 'react';
import { getPatients, registerPatient, updatePatient, deactivatePatient } from '../../services/patientService';
import { Card, CardHeader, CardBody, Button, Badge, Spinner, Input, Modal } from '../../components/ui';
import { Plus, Edit, Trash2, Search, Eye, Filter, UserCheck, HeartPulse, Activity } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import styles from './Patients.module.css';

const PatientList = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const isReceptionist = user?.role === 'RECEPTIONIST';
  const canEdit = isAdmin || isReceptionist;

  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [error, setError] = useState(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    dateOfBirth: '',
    gender: 'Male',
    cnic: '',
    contactNumber: '',
    address: '',
    emergencyContact: '',
    bloodGroup: 'O+',
    allergies: '',
    occupation: ''
  });

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async (search = '') => {
    setLoading(true);
    try {
      const data = await getPatients(search);
      setPatients(data.data || []);
      setError(null);
    } catch (err) {
      setError('Failed to load patients list. Please ensure the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchPatients(searchTerm);
  };

  const handleOpenCreateModal = () => {
    setEditingPatient(null);
    setFormData({
      fullName: '',
      dateOfBirth: '',
      gender: 'Male',
      cnic: '',
      contactNumber: '',
      address: '',
      emergencyContact: '',
      bloodGroup: 'O+',
      allergies: '',
      occupation: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (patient) => {
    setEditingPatient(patient);
    setFormData({
      fullName: patient.fullName || '',
      dateOfBirth: patient.dateOfBirth ? patient.dateOfBirth.split('T')[0] : '',
      gender: patient.gender || 'Male',
      cnic: patient.cnic || '',
      contactNumber: patient.contactNumber || '',
      address: patient.address || '',
      emergencyContact: typeof patient.emergencyContact === 'string' ? patient.emergencyContact : (patient.emergencyContact?.phone || ''),
      bloodGroup: patient.bloodGroup || 'O+',
      allergies: Array.isArray(patient.allergies) ? patient.allergies.map(a => typeof a === 'string' ? a : a.name).join(', ') : (patient.allergies || ''),
      occupation: patient.occupation || ''
    });
    setIsModalOpen(true);
  };

  const handleOpenDetailModal = (patient) => {
    setSelectedPatient(patient);
    setIsDetailModalOpen(true);
  };

  const handleSubmitPatient = async (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.cnic) {
      toast.error('Full Name and CNIC / B-Form number are required');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingPatient) {
        await updatePatient(editingPatient._id, formData);
        toast.success('Patient record updated successfully');
      } else {
        await registerPatient(formData);
        toast.success('Patient registered successfully (FR-01.1)');
      }
      setIsModalOpen(false);
      fetchPatients(searchTerm);
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Failed to save patient');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to deactivate (soft-delete) this patient record? Historical data will be preserved for audit compliance.')) {
      try {
        await deactivatePatient(id);
        toast.success('Patient record soft-deleted');
        fetchPatients(searchTerm);
      } catch (err) {
        toast.error('Failed to deactivate patient.');
      }
    }
  };

  const filteredPatients = patients.filter(patient => {
    if (statusFilter === 'active') return patient.status === 'active';
    if (statusFilter === 'inactive') return patient.status === 'inactive';
    return true;
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <h2>Patient Management</h2>
          <p>
            Register patients, manage medical demographics, and maintain audit-compliant records.
          </p>
        </div>
        {canEdit && (
          <Button variant="primary" icon={<Plus size={16} />} onClick={handleOpenCreateModal}>
            Register New Patient
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className={styles.controlsRow} style={{ width: '100%' }}>
            <form className={styles.searchForm} onSubmit={handleSearch} style={{ flex: 1 }}>
              <div style={{ flex: 1 }}>
                <Input 
                  placeholder="Search by Patient ID, Name, CNIC, or Phone..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  icon={<Search size={16} />}
                />
              </div>
              <Button type="submit" variant="secondary" icon={<Search size={16} />}>Search</Button>
            </form>
            <select 
              className={styles.filterSelect}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </CardHeader>
        <CardBody>
          {loading ? (
            <div className={styles.loader}><Spinner /><span>Loading patient records...</span></div>
          ) : error ? (
            <div className={styles.error}>{error}</div>
          ) : filteredPatients.length === 0 ? (
            <div className={styles.empty}>
              <UserCheck size={32} color="var(--color-neutral-400)" />
              <span>No patients found matching query.</span>
            </div>
          ) : (
            <div className={styles.tableResponsive}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Patient ID</th>
                    <th>Name</th>
                    <th>CNIC / B-Form</th>
                    <th>Gender & Age</th>
                    <th>Contact</th>
                    <th>Blood Group</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPatients.map(patient => {
                    const age = patient.dateOfBirth 
                      ? Math.floor((new Date() - new Date(patient.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000))
                      : 'N/A';
                    return (
                      <tr key={patient._id}>
                        <td style={{ fontWeight: 600, color: 'var(--color-primary-700)' }}>{patient.patientId}</td>
                        <td style={{ fontWeight: 500 }}>{patient.fullName}</td>
                        <td><code style={{ fontSize: '0.8rem', background: 'var(--color-surface-muted)', padding: '2px 6px', borderRadius: '4px' }}>{patient.cnic}</code></td>
                        <td>{patient.gender}, {age} yrs</td>
                        <td>{patient.contactNumber}</td>
                        <td>
                          <Badge variant="info">{patient.bloodGroup || 'Unknown'}</Badge>
                        </td>
                        <td>
                          <Badge variant={patient.status === 'active' ? 'success' : 'danger'}>
                            {patient.status}
                          </Badge>
                        </td>
                        <td>
                          <div className={styles.actions}>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              icon={<Eye size={15} color="var(--color-primary-600)" />} 
                              title="View Details" 
                              onClick={() => handleOpenDetailModal(patient)}
                            />
                            {canEdit && (
                              <Button variant="ghost" size="sm" icon={<Edit size={15} />} title="Edit" onClick={() => handleOpenEditModal(patient)} />
                            )}
                            {isAdmin && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                icon={<Trash2 size={15} color="var(--color-danger-500)" />} 
                                title="Deactivate (Soft-delete)"
                                onClick={() => handleDelete(patient._id)}
                                disabled={patient.status === 'inactive'}
                              />
                            )}
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

      {/* Create / Edit Patient Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingPatient ? `Edit Patient — ${editingPatient.patientId}` : 'Register New Patient'}
        >
          <form onSubmit={handleSubmitPatient} style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingTop: '10px' }}>
            <Input
              label="Full Name"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              required
              placeholder="e.g. Mohammad Ali"
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Input
                label="CNIC / B-Form Number (13 Digits)"
                value={formData.cnic}
                onChange={(e) => setFormData({ ...formData, cnic: e.target.value })}
                required
                placeholder="42101-1234567-1"
                helper="Must be unique"
              />
              <Input
                label="Date of Birth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600 }}>Gender</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border-soft)', background: 'var(--color-surface-card)', color: 'var(--color-neutral-900)' }}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600 }}>Blood Group</label>
                <select
                  value={formData.bloodGroup}
                  onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border-soft)', background: 'var(--color-surface-card)', color: 'var(--color-neutral-900)' }}
                >
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Input
                label="Contact Number"
                value={formData.contactNumber}
                onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                required
                placeholder="0300-9876543"
              />
              <Input
                label="Emergency Contact"
                value={formData.emergencyContact}
                onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                placeholder="0312-3456789 (Kin/Guardian)"
              />
            </div>

            <Input
              label="Address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="House #, Street, City"
            />

            <Input
              label="Known Allergies"
              value={formData.allergies}
              onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
              placeholder="e.g. Penicillin, Dust, Nuts (or None)"
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting ? <Spinner size="sm" /> : (editingPatient ? 'Update Patient' : 'Register Patient')}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Patient Detail Modal */}
      {isDetailModalOpen && selectedPatient && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={`Patient Profile — ${selectedPatient.patientId}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '10px' }}>
            <div className={styles.detailGrid}>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Full Name</span>
                <span className={styles.detailValue}>{selectedPatient.fullName}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>CNIC / B-Form</span>
                <span className={styles.detailValue}>{selectedPatient.cnic}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Gender</span>
                <span className={styles.detailValue}>{selectedPatient.gender}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Date of Birth</span>
                <span className={styles.detailValue}>{new Date(selectedPatient.dateOfBirth).toLocaleDateString()}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Blood Group</span>
                <span className={styles.detailValue}>{selectedPatient.bloodGroup || 'N/A'}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Contact</span>
                <span className={styles.detailValue}>{selectedPatient.contactNumber}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Emergency Contact</span>
                <span className={styles.detailValue}>
                  {typeof selectedPatient.emergencyContact === 'string' ? selectedPatient.emergencyContact : (selectedPatient.emergencyContact?.phone || 'N/A')}
                </span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Status</span>
                <span className={styles.detailValue}>
                  <Badge variant={selectedPatient.status === 'active' ? 'success' : 'danger'}>{selectedPatient.status}</Badge>
                </span>
              </div>
            </div>

            <div style={{ padding: '12px', background: 'var(--color-surface-muted)', borderRadius: '8px', fontSize: '0.875rem' }}>
              <div style={{ marginBottom: '6px' }}><strong>Address:</strong> {selectedPatient.address || 'N/A'}</div>
              <div style={{ marginBottom: '6px' }}>
                <strong>Known Allergies:</strong> {
                  Array.isArray(selectedPatient.allergies) && selectedPatient.allergies.length > 0 
                    ? selectedPatient.allergies.map(a => typeof a === 'string' ? a : `${a.name} (${a.severity || 'Mild'})`).join(', ')
                    : (selectedPatient.allergies || 'None recorded')
                }
              </div>
              <div><strong>Registered On:</strong> {new Date(selectedPatient.registrationDate || selectedPatient.createdAt).toLocaleString()}</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
              <Button variant="secondary" onClick={() => setIsDetailModalOpen(false)}>Close</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default PatientList;
