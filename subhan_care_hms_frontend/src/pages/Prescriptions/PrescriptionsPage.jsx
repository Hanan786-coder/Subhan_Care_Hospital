import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardBody, CardHeader, Button, Badge, Input, Modal, Spinner, SearchSelect } from '@/components/ui';
import useDebounce from '@/hooks/useDebounce';
import { createPrescription, dispensePrescription, getPrescriptions } from '@/services/prescriptionService';
import { getPatients } from '@/services/patientService';
import { getDoctors } from '@/services/doctorService';
import { getAppointments } from '@/services/appointmentService';
import { ROLES } from '@/constants/roles';
import { useAuth } from '@/context/AuthContext';
import { Pill, Search, ShieldCheck, Plus, Trash2, AlertCircle, FileSpreadsheet, Calendar, Stethoscope, X } from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './Prescriptions.module.css';

const PrescriptionsPage = () => {
  const { user } = useAuth();
  const isDoctor = user?.role === ROLES.DOCTOR;
  const isPharmacist = user?.role === ROLES.PHARMACIST;
  const isAdmin = user?.role === ROLES.ADMIN;

  const canCreate = isDoctor;
  const canDispense = isAdmin || isPharmacist;

  const [prescriptions, setPrescriptions] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [doctorAppointments, setDoctorAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getInitialFormState = (docId) => ({
    patientId: '',
    doctorId: docId || '',
    consultationId: 'SC-CON-' + Date.now().toString().slice(-5),
    appointmentId: '',
    items: [{ medicineName: '', dosage: '', frequency: '', duration: '', instructions: '' }],
    precautions: ['Take medication after meals', 'Drink plenty of water'],
    labTests: [],
    generalAdvice: '',
    followUpDate: ''
  });

  const [formData, setFormData] = useState(() => getInitialFormState(user?.linkedEntityId));
  const [newPrecaution, setNewPrecaution] = useState('');
  const [newTestName, setNewTestName] = useState('');
  const [newTestInstructions, setNewTestInstructions] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prescriptionData, patientData, doctorData, appointmentData] = await Promise.all([
        getPrescriptions(),
        getPatients(),
        getDoctors(),
        getAppointments()
      ]);
      setPrescriptions(prescriptionData.data || []);
      setPatients(patientData.data || []);
      setDoctors(doctorData.data || []);
      setDoctorAppointments(appointmentData.data || []);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to load prescriptions data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter patients based on doctor appointment association
  const eligiblePatients = useMemo(() => {
    if (!isDoctor) return patients;

    const currentDocId = user?.linkedEntityId || formData.doctorId;
    if (!currentDocId) return patients;

    // Filter appointments for this doctor that are Scheduled, Rescheduled, or Completed
    const docAppts = doctorAppointments.filter(
      app => app.doctorId?._id === currentDocId || app.doctorId === currentDocId
    );

    // Get unique patient IDs who have an appointment with this doctor
    const patientIdsWithDoc = new Set(
      docAppts.map(app => (typeof app.patientId === 'object' ? app.patientId?._id : app.patientId)).filter(Boolean)
    );

    const filtered = patients.filter(p => patientIdsWithDoc.has(p._id));
    // If no specific appointments found yet, fall back to all patients so doctor is not blocked
    return filtered.length > 0 ? filtered : patients;
  }, [patients, doctorAppointments, isDoctor, user?.linkedEntityId, formData.doctorId]);

  // Appointments for selected patient with current doctor
  const availableAppointmentsForPatient = useMemo(() => {
    if (!formData.patientId) return [];
    const currentDocId = user?.linkedEntityId || formData.doctorId;
    return doctorAppointments.filter(app => {
      const pId = typeof app.patientId === 'object' ? app.patientId?._id : app.patientId;
      const dId = typeof app.doctorId === 'object' ? app.doctorId?._id : app.doctorId;
      const matchP = pId === formData.patientId;
      const matchD = !currentDocId || dId === currentDocId;
      return matchP && matchD;
    });
  }, [formData.patientId, formData.doctorId, doctorAppointments, user?.linkedEntityId]);

  const filteredPrescriptions = useMemo(() => {
    const query = debouncedSearch.toLowerCase().trim();
    return prescriptions.filter((prescription) => 
      !query || 
      prescription.prescriptionId?.toLowerCase().includes(query) || 
      prescription.patientId?.fullName?.toLowerCase().includes(query) || 
      prescription.patientId?.cnic?.toLowerCase().includes(query) ||
      prescription.doctorId?.fullName?.toLowerCase().includes(query)
    );
  }, [prescriptions, debouncedSearch]);

  const handleAddItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { medicineName: '', dosage: '', frequency: '', duration: '', instructions: '' }]
    }));
  };

  const handleRemoveItem = (index) => {
    if (formData.items.length === 1) {
      toast.error('At least one medicine is required');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    updatedItems[index][field] = value;
    setFormData((prev) => ({ ...prev, items: updatedItems }));
  };

  const handleAddPrecaution = () => {
    if (!newPrecaution.trim()) return;
    setFormData(prev => ({
      ...prev,
      precautions: [...prev.precautions, newPrecaution.trim()]
    }));
    setNewPrecaution('');
  };

  const handleRemovePrecaution = (index) => {
    setFormData(prev => ({
      ...prev,
      precautions: prev.precautions.filter((_, i) => i !== index)
    }));
  };

  const handleAddLabTest = () => {
    if (!newTestName.trim()) {
      toast.error('Test name is required');
      return;
    }
    setFormData(prev => ({
      ...prev,
      labTests: [...prev.labTests, { testName: newTestName.trim(), instructions: newTestInstructions.trim() }]
    }));
    setNewTestName('');
    setNewTestInstructions('');
  };

  const handleRemoveLabTest = (index) => {
    setFormData(prev => ({
      ...prev,
      labTests: prev.labTests.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.patientId || !formData.doctorId) {
      toast.error('Please select both a patient and issuing doctor');
      return;
    }

    const invalidItem = formData.items.some(item => !item.medicineName.trim() || !item.dosage.trim());
    if (invalidItem) {
      toast.error('Please fill medicine name and dosage for all medication items');
      return;
    }

    setIsSubmitting(true);
    try {
      await createPrescription(formData);
      toast.success('Prescription issued successfully');
      setIsModalOpen(false);
      setFormData(getInitialFormState(user?.linkedEntityId));
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save prescription');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDispense = async (prescription) => {
    if (prescription.status === 'Dispensed') return;
    try {
      await dispensePrescription(prescription._id, { pharmacistNotes: 'Dispensed by pharmacy staff' });
      toast.success('Prescription marked as Dispensed');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to dispense prescription');
    }
  };

  const openCreateModal = () => {
    setFormData({
      patientId: '',
      doctorId: user?.linkedEntityId || (doctors.length > 0 ? doctors[0]._id : ''),
      consultationId: 'SC-CON-' + Math.floor(10000 + Math.random() * 90000),
      appointmentId: '',
      items: [{ medicineName: '', dosage: '', frequency: '', duration: '', instructions: '' }],
      precautions: ['Take medication after meals', 'Drink plenty of water'],
      labTests: [],
      generalAdvice: '',
      followUpDate: ''
    });
    setIsModalOpen(true);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <h2>Prescription Management</h2>
          <p>Create digital prescriptions with medicines, lab tests, precautions, and general clinical advice.</p>
        </div>
        {canCreate && (
          <Button variant="primary" icon={<Pill size={16} />} onClick={openCreateModal}>
            Create Prescription
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className={styles.controlsRow}>
            <div style={{ flex: 1, minWidth: '260px' }}>
              <Input 
                placeholder="Search by ID, Patient Name, CNIC, or Doctor..." 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                icon={<Search size={16} />} 
              />
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
                    <th>Prescription ID</th>
                    <th>Patient Name & CNIC</th>
                    <th>Doctor Name</th>
                    <th>Issued Date</th>
                    <th>Medications & Tests</th>
                    <th>Precautions / Advice</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPrescriptions.map((prescription) => (
                    <tr key={prescription._id}>
                      <td style={{ fontWeight: 600 }}>{prescription.prescriptionId}</td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 600 }}>{prescription.patientId?.fullName || 'N/A'}</span>
                          {prescription.patientId?.cnic && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-neutral-500)' }}>
                              CNIC: {prescription.patientId.cnic}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>{prescription.doctorId?.fullName || 'N/A'}</td>
                      <td>{new Date(prescription.issuedAt).toLocaleDateString()}</td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8rem' }}>
                          {(prescription.items || []).map((item, idx) => (
                            <span key={idx} style={{ color: 'var(--color-neutral-700)' }}>
                              • <strong>{item.medicineName}</strong> ({item.dosage}) - {item.frequency}
                            </span>
                          ))}
                          {(prescription.labTests || []).length > 0 && (
                            <div style={{ marginTop: '4px', color: 'var(--color-primary-700)', fontWeight: 500 }}>
                              Tests: {prescription.labTests.map(t => t.testName).join(', ')}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.78rem', color: 'var(--color-neutral-600)', maxWidth: '220px' }}>
                          {prescription.precautions && prescription.precautions.length > 0 && (
                            <span><strong>Precautions:</strong> {prescription.precautions.slice(0, 2).join(', ')}{prescription.precautions.length > 2 ? '...' : ''}</span>
                          )}
                          {prescription.generalAdvice && (
                            <span><strong>Advice:</strong> {prescription.generalAdvice}</span>
                          )}
                          {prescription.followUpDate && (
                            <span><strong>Follow-up:</strong> {prescription.followUpDate}</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <Badge variant={prescription.status === 'Dispensed' ? 'success' : 'primary'}>
                          {prescription.status}
                        </Badge>
                      </td>
                      <td>
                        <div className={styles.actions}>
                          {canDispense && prescription.status !== 'Dispensed' ? (
                            <Button 
                              size="sm" 
                              variant="secondary" 
                              icon={<ShieldCheck size={14} />} 
                              onClick={() => handleDispense(prescription)}
                            >
                              Dispense
                            </Button>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-neutral-400)' }}>Locked</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredPrescriptions.length === 0 && (
                    <tr>
                      <td colSpan={8} className={styles.emptyState}>No prescriptions found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Complete Digital Prescription" size="xl">
        <form onSubmit={handleSubmit} className={styles.modalForm}>
          {/* Patient & Doctor Selection */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <SearchSelect
                label="Select Patient (Searchable by Name, CNIC, Phone)"
                required
                options={eligiblePatients}
                value={formData.patientId}
                onChange={(val) => setFormData((prev) => ({ ...prev, patientId: val, appointmentId: '' }))}
                placeholder="Search patient name, CNIC or ID..."
                getOptionLabel={(p) => p.fullName}
                getOptionSublabel={(p) => p.cnic ? `CNIC: ${p.cnic}` : p.contactNumber ? `Ph: ${p.contactNumber}` : ''}
                getOptionValue={(p) => p._id}
              />
              {isDoctor && eligiblePatients.length === patients.length && (
                <span style={{ fontSize: '0.725rem', color: 'var(--color-neutral-500)', marginTop: '2px', display: 'block' }}>
                  Showing all registered patients.
                </span>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-neutral-700)' }}>Issuing Doctor</label>
              <select 
                value={formData.doctorId} 
                onChange={(e) => setFormData((prev) => ({ ...prev, doctorId: e.target.value }))} 
                className={styles.filterSelect}
                required
                disabled={isDoctor}
              >
                <option value="">-- Choose Doctor --</option>
                {doctors.map((doctor) => <option key={doctor._id} value={doctor._id}>{doctor.fullName} ({doctor.specialization})</option>)}
              </select>
            </div>
          </div>

          {/* Active Appointment Link (Optional) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-neutral-700)' }}>
                Link Active Appointment (Optional)
              </label>
              <select
                value={formData.appointmentId}
                onChange={(e) => setFormData((prev) => ({ ...prev, appointmentId: e.target.value }))}
                className={styles.filterSelect}
                disabled={!formData.patientId}
              >
                <option value="">-- No linked appointment --</option>
                {availableAppointmentsForPatient.map((app) => (
                  <option key={app._id} value={app._id}>
                    {app.appointmentId} ({new Date(app.date).toLocaleDateString()} - {app.timeSlot?.start} [{app.status}])
                  </option>
                ))}
              </select>
            </div>

            <Input 
              label="Consultation Ref Code" 
              value={formData.consultationId} 
              onChange={(e) => setFormData((prev) => ({ ...prev, consultationId: e.target.value }))} 
              required
            />
          </div>

          {/* Section 1: Prescribed Medications */}
          <div className={styles.itemsSection}>
            <div className={styles.itemsHeader}>
              <h4>1. Prescribed Medications</h4>
              <Button type="button" size="sm" variant="outline" icon={<Plus size={14} />} onClick={handleAddItem}>
                Add Medicine
              </Button>
            </div>

            {formData.items.map((item, index) => (
              <div key={index} className={styles.itemRow}>
                <Input 
                  placeholder="Medicine name" 
                  value={item.medicineName} 
                  onChange={(e) => handleItemChange(index, 'medicineName', e.target.value)} 
                  required 
                />
                <Input 
                  placeholder="Dosage (e.g. 500mg)" 
                  value={item.dosage} 
                  onChange={(e) => handleItemChange(index, 'dosage', e.target.value)} 
                  required 
                />
                <Input 
                  placeholder="Frequency (1-0-1)" 
                  value={item.frequency} 
                  onChange={(e) => handleItemChange(index, 'frequency', e.target.value)} 
                />
                <Input 
                  placeholder="Duration (5 days)" 
                  value={item.duration} 
                  onChange={(e) => handleItemChange(index, 'duration', e.target.value)} 
                />
                <Input 
                  placeholder="Instructions (after food)" 
                  value={item.instructions} 
                  onChange={(e) => handleItemChange(index, 'instructions', e.target.value)} 
                />
                <Button 
                  type="button" 
                  variant="ghost" 
                  style={{ color: 'var(--color-danger-500)', padding: '8px' }}
                  onClick={() => handleRemoveItem(index)}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            ))}
          </div>

          {/* Section 2: Recommended Lab Tests */}
          <div className={styles.itemsSection}>
            <div className={styles.itemsHeader}>
              <h4>2. Diagnostic / Lab Tests Recommended</h4>
            </div>
            
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <Input 
                placeholder="Test Name (e.g. CBC, Serum Creatinine, Chest X-Ray)" 
                value={newTestName} 
                onChange={(e) => setNewTestName(e.target.value)} 
                style={{ flex: 2 }}
              />
              <Input 
                placeholder="Fasting or Special instructions" 
                value={newTestInstructions} 
                onChange={(e) => setNewTestInstructions(e.target.value)} 
                style={{ flex: 2 }}
              />
              <Button type="button" variant="secondary" onClick={handleAddLabTest} icon={<Plus size={14} />}>
                Add Test
              </Button>
            </div>

            {formData.labTests.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', backgroundColor: 'var(--color-neutral-50)', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--color-neutral-200)' }}>
                {formData.labTests.map((test, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                    <span><strong>• {test.testName}</strong> {test.instructions ? `(${test.instructions})` : ''}</span>
                    <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveLabTest(i)} style={{ color: 'var(--color-danger-500)' }}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 3: Precautions & Advice */}
          <div className={styles.itemsSection}>
            <div className={styles.itemsHeader}>
              <h4>3. Precautions & General Clinical Advice</h4>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <Input 
                placeholder="Add precaution / instruction (e.g. Avoid cold drinks, Bed rest for 3 days)..." 
                value={newPrecaution} 
                onChange={(e) => setNewPrecaution(e.target.value)} 
                style={{ flex: 1 }}
              />
              <Button type="button" variant="secondary" onClick={handleAddPrecaution} icon={<Plus size={14} />}>
                Add
              </Button>
            </div>

            {formData.precautions.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                {formData.precautions.map((p, i) => (
                  <Badge key={i} variant="neutral" style={{ padding: '6px 10px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {p}
                    <X size={12} style={{ cursor: 'pointer' }} onClick={() => handleRemovePrecaution(i)} />
                  </Badge>
                ))}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginTop: '8px' }}>
              <Input 
                label="General Advice / Diet Plan" 
                placeholder="e.g. High protein diet, low sodium, light walking daily" 
                value={formData.generalAdvice} 
                onChange={(e) => setFormData((prev) => ({ ...prev, generalAdvice: e.target.value }))} 
              />
              <Input 
                label="Follow-up Date / Period" 
                placeholder="e.g. After 1 week or 2026-08-15" 
                value={formData.followUpDate} 
                onChange={(e) => setFormData((prev) => ({ ...prev, followUpDate: e.target.value }))} 
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" loading={isSubmitting}>Issue Prescription</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PrescriptionsPage;
