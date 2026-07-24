import React, { useEffect, useState } from 'react';
import { getPatients, registerPatient, updatePatient, deactivatePatient } from '../../services/patientService';
import { Card, CardHeader, CardBody, Button, Badge, Spinner, Input, Modal } from '../../components/ui';
import { Plus, Edit, Trash2, Search, Eye } from 'lucide-react';
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
      setError('Failed to load patients.');
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
      emergencyContact: patient.emergencyContact || '',
      bloodGroup: patient.bloodGroup || 'O+',
      allergies: patient.allergies || '',
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
        toast.success('Patient record updated');
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
    if (window.confirm('Are you sure you want to deactivate (soft-delete) this patient record? Historical data will be preserved for audit (FR-01.4).')) {
      try {
        await deactivatePatient(id);
        toast.success('Patient record soft-deleted');
        fetchPatients(searchTerm);
      } catch (err) {
        toast.error('Failed to deactivate patient.');
      }
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2>Patient Management</h2>
          <p style={{ color: 'var(--color-neutral-500)', fontSize: '0.85rem' }}>
            Register new patients, maintain demographic records, and soft-delete inactive profiles.
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
          <form className={styles.searchForm} onSubmit={handleSearch}>
            <input 
              type="text" 
              placeholder="Search by Patient ID, Name, CNIC, or Contact Number (FR-01.5)..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
            <Button type="submit" variant="secondary" icon={<Search size={16} />}>Search</Button>
          </form>
        </CardHeader>
        <CardBody>
          {loading ? (
            <div className={styles.loader}><Spinner /></div>
          ) : error ? (
            <div className={styles.error}>{error}</div>
          ) : patients.length === 0 ? (
            <div className={styles.empty}>No patients found matching query.</div>
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
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map(patient => {
                    const age = patient.dateOfBirth 
                      ? Math.floor((new Date() - new Date(patient.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000))
                      : 'N/A';
                    return (
                      <tr key={patient._id}>
                        <td style={{ fontWeight: 600 }}>{patient.patientId}</td>
                        <td style={{ fontWeight: 500 }}>{patient.fullName}</td>
                        <td><code>{patient.cnic}</code></td>
                        <td>{patient.gender}, {age} yrs</td>
                        <td>{patient.contactNumber}</td>
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
                              icon={<Eye size={16} color="var(--color-primary-600)" />} 
                              title="View Details" 
                              onClick={() => handleOpenDetailModal(patient)}
                            />
                            {canEdit && (
                              <Button variant="ghost" size="sm" icon={<Edit size={16} />} title="Edit" onClick={() => handleOpenEditModal(patient)} />
                            )}
                            {isAdmin && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                icon={<Trash2 size={16} color="var(--danger)" />} 
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
          title={editingPatient ? `Edit Patient — ${editingPatient.patientId}` : 'Register New Patient (FR-01.1)'}
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
                helper="Must be unique (FR-01.6)"
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
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--color-border)' }}
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
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--color-border)' }}
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
          title={`Patient Record — ${selectedPatient.patientId}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingTop: '10px' }}>
            <div style={{ padding: '12px', borderRadius: '8px', background: 'var(--color-surface-soft)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div><strong>Full Name:</strong> {selectedPatient.fullName}</div>
              <div><strong>CNIC:</strong> {selectedPatient.cnic}</div>
              <div><strong>Gender:</strong> {selectedPatient.gender}</div>
              <div><strong>Date of Birth:</strong> {new Date(selectedPatient.dateOfBirth).toLocaleDateString()}</div>
              <div><strong>Blood Group:</strong> {selectedPatient.bloodGroup || 'N/A'}</div>
              <div><strong>Contact:</strong> {selectedPatient.contactNumber}</div>
              <div><strong>Emergency Contact:</strong> {selectedPatient.emergencyContact || 'N/A'}</div>
              <div><strong>Status:</strong> {selectedPatient.status}</div>
            </div>

            <div><strong>Address:</strong> {selectedPatient.address || 'N/A'}</div>
            <div><strong>Known Allergies:</strong> {selectedPatient.allergies || 'None recorded'}</div>
            <div><strong>Registration Date:</strong> {new Date(selectedPatient.registrationDate || selectedPatient.createdAt).toLocaleString()}</div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
              <Button variant="secondary" onClick={() => setIsDetailModalOpen(false)}>Close</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default PatientList;
