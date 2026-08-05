import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardBody, CardHeader, Button, Badge, Input, Modal, Spinner } from '@/components/ui';
import useDebounce from '@/hooks/useDebounce';
import { createPrescription, dispensePrescription, getPrescriptions } from '@/services/prescriptionService';
import { getPatients } from '@/services/patientService';
import { getDoctors } from '@/services/doctorService';
import { ROLES } from '@/constants/roles';
import { useAuth } from '@/context/AuthContext';
import { Pill, Search, ShieldCheck, Plus, Trash2 } from 'lucide-react';
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
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initialFormState = {
    patientId: '',
    doctorId: user?.linkedEntityId || '',
    consultationId: 'SC-CON-' + Math.floor(10000 + Math.random() * 90000), // auto mock if missing
    appointmentId: '',
    items: [{ medicineName: '', dosage: '', frequency: '', duration: '', instructions: '' }]
  };

  const [formData, setFormData] = useState(initialFormState);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prescriptionData, patientData, doctorData] = await Promise.all([
        getPrescriptions(),
        getPatients(),
        getDoctors()
      ]);
      setPrescriptions(prescriptionData.data || []);
      setPatients(patientData.data || []);
      setDoctors(doctorData.data || []);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to load prescriptions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredPrescriptions = useMemo(() => {
    const query = debouncedSearch.toLowerCase().trim();
    return prescriptions.filter((prescription) => 
      !query || 
      prescription.prescriptionId?.toLowerCase().includes(query) || 
      prescription.patientId?.fullName?.toLowerCase().includes(query) || 
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.patientId || !formData.doctorId) {
      toast.error('Select patient and doctor');
      return;
    }

    const invalidItem = formData.items.some(item => !item.medicineName.trim() || !item.dosage.trim());
    if (invalidItem) {
      toast.error('Please fill medicine name and dosage for all items');
      return;
    }

    setIsSubmitting(true);
    try {
      await createPrescription(formData);
      toast.success('Prescription issued successfully');
      setIsModalOpen(false);
      setFormData(initialFormState);
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

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <h2>Prescription Management</h2>
          <p>Create and retrieve prescriptions, assign medication details, and manage pharmacist dispensing statuses.</p>
        </div>
        {canCreate && (
          <Button variant="primary" icon={<Pill size={16} />} onClick={() => setIsModalOpen(true)}>
            Create Prescription
          </Button>
        )}
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
                    <th>Patient Name</th>
                    <th>Doctor Name</th>
                    <th>Issued Date</th>
                    <th>Medications</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPrescriptions.map((prescription) => (
                    <tr key={prescription._id}>
                      <td style={{ fontWeight: 600 }}>{prescription.prescriptionId}</td>
                      <td>{prescription.patientId?.fullName || 'N/A'}</td>
                      <td>{prescription.doctorId?.fullName || 'N/A'}</td>
                      <td>{new Date(prescription.issuedAt).toLocaleDateString()}</td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.8rem' }}>
                          {(prescription.items || []).map((item, idx) => (
                            <span key={idx} style={{ color: 'var(--color-neutral-700)' }}>
                              • <strong>{item.medicineName}</strong> ({item.dosage}) - {item.frequency} for {item.duration}
                            </span>
                          ))}
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
                      <td colSpan={7} className={styles.emptyState}>No prescriptions found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Prescription" size="xl">
        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-neutral-700)' }}>Select Patient</label>
              <select 
                value={formData.patientId} 
                onChange={(e) => setFormData((prev) => ({ ...prev, patientId: e.target.value }))} 
                className={styles.filterSelect}
                required
              >
                <option value="">-- Choose Patient --</option>
                {patients.map((patient) => <option key={patient._id} value={patient._id}>{patient.fullName}</option>)}
              </select>
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
                {doctors.map((doctor) => <option key={doctor._id} value={doctor._id}>{doctor.fullName}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Input 
              label="Consultation Ref Code" 
              value={formData.consultationId} 
              onChange={(e) => setFormData((prev) => ({ ...prev, consultationId: e.target.value }))} 
              required
            />
            <Input 
              label="Appointment Reference (Optional)" 
              value={formData.appointmentId} 
              onChange={(e) => setFormData((prev) => ({ ...prev, appointmentId: e.target.value }))} 
            />
          </div>

          <div className={styles.itemsSection}>
            <div className={styles.itemsHeader}>
              <h4>Medication Details</h4>
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
                  placeholder="Dosage" 
                  value={item.dosage} 
                  onChange={(e) => handleItemChange(index, 'dosage', e.target.value)} 
                  required 
                />
                <Input 
                  placeholder="Frequency" 
                  value={item.frequency} 
                  onChange={(e) => handleItemChange(index, 'frequency', e.target.value)} 
                />
                <Input 
                  placeholder="Duration" 
                  value={item.duration} 
                  onChange={(e) => handleItemChange(index, 'duration', e.target.value)} 
                />
                <Input 
                  placeholder="Instructions (e.g. after food)" 
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
