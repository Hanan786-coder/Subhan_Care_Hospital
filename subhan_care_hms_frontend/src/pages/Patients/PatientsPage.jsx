import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPatients, registerPatient, updatePatient, deactivatePatient } from '../../services/patientService';
import { Card, CardHeader, CardBody, CardFooter, Button, Badge, Spinner, Input, Modal } from '../../components/ui';
import {
  Plus, Edit, Trash2, Search, Eye, Filter, UserCheck, HeartPulse, 
  FileText, ChevronLeft, ChevronRight, AlertTriangle, User, Calendar, 
  Phone, Shield, MapPin, Activity, Stethoscope, Mail
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import styles from './Patients.module.css';

const ITEMS_PER_PAGE = 8;

const PatientList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const isReceptionist = user?.role === 'RECEPTIONIST';
  const canEdit = isAdmin || isReceptionist;

  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [genderFilter, setGenderFilter] = useState('all');
  const [bloodGroupFilter, setBloodGroupFilter] = useState('all');
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientToDelete, setPatientToDelete] = useState(null);
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
      setError('Failed to load patient records. Please ensure backend server is online.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchPatients(searchTerm);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
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

  const handleOpenDeleteModal = (patient) => {
    setPatientToDelete(patient);
    setIsDeleteModalOpen(true);
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

  const handleConfirmDelete = async () => {
    if (!patientToDelete) return;
    setIsSubmitting(true);
    try {
      await deactivatePatient(patientToDelete._id);
      toast.success(`Patient ${patientToDelete.patientId} soft-deleted successfully`);
      setIsDeleteModalOpen(false);
      setPatientToDelete(null);
      fetchPatients(searchTerm);
    } catch (err) {
      toast.error('Failed to deactivate patient record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNavigateMedicalHistory = (patientId) => {
    navigate(`/dashboard/medical-history?patientId=${patientId}`);
  };

  // Client-side filtering & pagination
  const filteredPatients = patients.filter(patient => {
    const matchesSearch = !searchTerm || (
      patient.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.patientId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.cnic?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.contactNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const matchesStatus = statusFilter === 'all' || patient.status === statusFilter;
    const matchesGender = genderFilter === 'all' || patient.gender === genderFilter;
    const matchesBlood = bloodGroupFilter === 'all' || patient.bloodGroup === bloodGroupFilter;

    return matchesSearch && matchesStatus && matchesGender && matchesBlood;
  });

  const totalPages = Math.ceil(filteredPatients.length / ITEMS_PER_PAGE) || 1;
  const paginatedPatients = filteredPatients.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <h2>Patient Management</h2>
          <p>
            Comprehensive patient demographic profiles, clinical history navigation, and role-restricted record management.
          </p>
        </div>
        {canEdit && (
          <Button variant="primary" icon={<Plus size={16} />} onClick={handleOpenCreateModal}>
            Register New Patient
          </Button>
        )}
      </div>

      {/* Main Card with Search, Filters, List, and Pagination */}
      <Card>
        <CardHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%' }}>
            {/* Search Bar */}
            <form className={styles.searchForm} onSubmit={handleSearchSubmit}>
              <div style={{ flex: 1 }}>
                <Input 
                  placeholder="Search by Patient ID, Name, CNIC, or Contact..." 
                  value={searchTerm}
                  onChange={handleSearchChange}
                  icon={<Search size={16} />}
                />
              </div>
              <Button type="submit" variant="secondary" icon={<Search size={16} />}>
                Search
              </Button>
            </form>

            {/* Filter Bar */}
            <div className={styles.controlsRow}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-neutral-600)' }}>
                <Filter size={15} /> Filters:
              </div>
              <select 
                className={styles.filterSelect}
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>

              <select 
                className={styles.filterSelect}
                value={genderFilter}
                onChange={(e) => { setGenderFilter(e.target.value); setCurrentPage(1); }}
              >
                <option value="all">All Genders</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>

              <select 
                className={styles.filterSelect}
                value={bloodGroupFilter}
                onChange={(e) => { setBloodGroupFilter(e.target.value); setCurrentPage(1); }}
              >
                <option value="all">All Blood Groups</option>
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
        </CardHeader>

        <CardBody>
          {loading ? (
            <div className={styles.loader}><Spinner /><span>Loading patient records...</span></div>
          ) : error ? (
            <div className={styles.error}>{error}</div>
          ) : paginatedPatients.length === 0 ? (
            <div className={styles.empty}>
              <UserCheck size={36} color="var(--color-neutral-400)" />
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
                  {paginatedPatients.map(patient => {
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
                              title="View Profile Card & Details" 
                              onClick={() => handleOpenDetailModal(patient)}
                            />
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              icon={<FileText size={15} color="var(--color-secondary-600)" />} 
                              title="View Medical History" 
                              onClick={() => handleNavigateMedicalHistory(patient.patientId)}
                            />
                            {canEdit && (
                              <Button variant="ghost" size="sm" icon={<Edit size={15} />} title="Edit Patient" onClick={() => handleOpenEditModal(patient)} />
                            )}
                            {isAdmin && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                icon={<Trash2 size={15} color="var(--color-danger-500)" />} 
                                title="Deactivate (Soft-delete)"
                                onClick={() => handleOpenDeleteModal(patient)}
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

        {/* Pagination Bar */}
        {!loading && filteredPatients.length > 0 && (
          <CardFooter>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <span style={{ fontSize: '0.825rem', color: 'var(--color-neutral-600)' }}>
                Showing <strong>{(currentPage - 1) * ITEMS_PER_PAGE + 1}</strong> to <strong>{Math.min(currentPage * ITEMS_PER_PAGE, filteredPatients.length)}</strong> of <strong>{filteredPatients.length}</strong> patients
              </span>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  icon={<ChevronLeft size={16} />}
                >
                  Previous
                </Button>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, padding: '0 8px', color: 'var(--color-neutral-800)' }}>
                  {currentPage} / {totalPages}
                </span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          </CardFooter>
        )}
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

      {/* Patient Detail Profile Card Modal */}
      {isDetailModalOpen && selectedPatient && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={`Patient Profile Card — ${selectedPatient.patientId}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', paddingTop: '6px' }}>
            {/* Profile Card Summary Banner */}
            <div style={{ 
              padding: '16px 20px', 
              borderRadius: '12px', 
              background: 'linear-gradient(135deg, var(--color-primary-600) 0%, var(--color-primary-800) 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ 
                  width: '50px', 
                  height: '50px', 
                  borderRadius: '50%', 
                  background: 'rgba(255, 255, 255, 0.2)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontSize: '1.4rem',
                  fontWeight: 700
                }}>
                  {selectedPatient.fullName?.charAt(0)}
                </div>
                <div>
                  <h3 style={{ margin: 0, color: '#ffffff', fontSize: '1.2rem' }}>{selectedPatient.fullName}</h3>
                  <div style={{ fontSize: '0.8rem', opacity: 0.85 }}>ID: {selectedPatient.patientId}</div>
                </div>
              </div>
              <Badge variant={selectedPatient.status === 'active' ? 'success' : 'danger'}>
                {selectedPatient.status}
              </Badge>
            </div>

            {/* Profile Details Grid */}
            <div className={styles.detailGrid}>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>CNIC / B-Form</span>
                <span className={styles.detailValue}>{selectedPatient.cnic}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Gender & Age</span>
                <span className={styles.detailValue}>
                  {selectedPatient.gender}, {
                    selectedPatient.dateOfBirth 
                      ? Math.floor((new Date() - new Date(selectedPatient.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000))
                      : 'N/A'
                  } yrs
                </span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Blood Group</span>
                <span className={styles.detailValue}>{selectedPatient.bloodGroup || 'Unknown'}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Contact Phone</span>
                <span className={styles.detailValue}>{selectedPatient.contactNumber}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Emergency Contact</span>
                <span className={styles.detailValue}>
                  {typeof selectedPatient.emergencyContact === 'string' ? selectedPatient.emergencyContact : (selectedPatient.emergencyContact?.phone || 'N/A')}
                </span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Date of Birth</span>
                <span className={styles.detailValue}>{new Date(selectedPatient.dateOfBirth).toLocaleDateString()}</span>
              </div>
            </div>

            <div style={{ padding: '14px', background: 'var(--color-surface-muted)', borderRadius: '10px', fontSize: '0.875rem' }}>
              <div style={{ marginBottom: '8px' }}><strong>Address:</strong> {selectedPatient.address || 'N/A'}</div>
              <div style={{ marginBottom: '8px' }}>
                <strong>Known Allergies:</strong> {
                  Array.isArray(selectedPatient.allergies) && selectedPatient.allergies.length > 0 
                    ? selectedPatient.allergies.map(a => typeof a === 'string' ? a : `${a.name} (${a.severity || 'Mild'})`).join(', ')
                    : (selectedPatient.allergies || 'None recorded')
                }
              </div>
              <div><strong>Registration Date:</strong> {new Date(selectedPatient.registrationDate || selectedPatient.createdAt).toLocaleString()}</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
              <Button 
                variant="secondary" 
                icon={<FileText size={16} />} 
                onClick={() => handleNavigateMedicalHistory(selectedPatient.patientId)}
              >
                View Medical History
              </Button>
              <Button variant="outline" onClick={() => setIsDetailModalOpen(false)}>
                Close Profile
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && patientToDelete && (
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          title="Confirm Soft-Delete Patient"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '6px' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              padding: '12px 16px', 
              borderRadius: '8px', 
              background: 'rgba(239, 68, 68, 0.12)', 
              color: 'var(--color-danger-700)',
              border: '1px solid rgba(239, 68, 68, 0.25)' 
            }}>
              <AlertTriangle size={24} style={{ flexShrink: 0 }} />
              <div style={{ fontSize: '0.875rem' }}>
                <strong>Warning:</strong> Deactivating <strong>{patientToDelete.fullName}</strong> ({patientToDelete.patientId}) will set status to inactive. Historical clinical records remain preserved.
              </div>
            </div>

            <p style={{ fontSize: '0.9rem', color: 'var(--color-neutral-700)', margin: 0 }}>
              Are you sure you want to proceed with this action?
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
              <Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
              <Button variant="danger" onClick={handleConfirmDelete} disabled={isSubmitting}>
                {isSubmitting ? <Spinner size="sm" /> : 'Confirm Deactivate'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default PatientList;
