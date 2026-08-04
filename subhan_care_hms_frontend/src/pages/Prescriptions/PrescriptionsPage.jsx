import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardBody, CardHeader, Button, Badge, Input, Modal, Spinner } from '@/components/ui';
import { createPrescription, dispensePrescription, getPrescriptions } from '@/services/prescriptionService';
import { getPatients } from '@/services/patientService';
import { getDoctors } from '@/services/doctorService';
import { ROLES } from '@/constants/roles';
import { useAuth } from '@/context/AuthContext';
import { Pill, Search, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

const PrescriptionsPage = () => {
  const { user } = useAuth();
  const canCreate = [ROLES.ADMIN, ROLES.DOCTOR].includes(user?.role);
  const canDispense = [ROLES.ADMIN, ROLES.PHARMACIST].includes(user?.role);

  const [prescriptions, setPrescriptions] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ patientId: '', doctorId: '', consultationId: '', appointmentId: '', items: [{ medicineName: '', dosage: '', frequency: '', duration: '', instructions: '' }] });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prescriptionData, patientData, doctorData] = await Promise.all([getPrescriptions(), getPatients(), getDoctors()]);
      setPrescriptions(prescriptionData.data || []);
      setPatients(patientData.data || []);
      setDoctors(doctorData.data || []);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to load prescriptions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filteredPrescriptions = useMemo(() => {
    const query = search.toLowerCase().trim();
    return prescriptions.filter((prescription) => !query || prescription.prescriptionId?.toLowerCase().includes(query) || prescription.patientId?.fullName?.toLowerCase().includes(query) || prescription.doctorId?.fullName?.toLowerCase().includes(query));
  }, [prescriptions, search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createPrescription(formData);
      toast.success('Prescription issued');
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save prescription');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDispense = async (prescription) => {
    try {
      await dispensePrescription(prescription._id, { pharmacistNotes: 'Dispensed from UI' });
      toast.success('Prescription dispensed');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to dispense prescription');
    }
  };

  return (
    <div style={{ display: 'grid', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ margin: 0 }}>Prescription Module</h2>
          <p style={{ margin: '8px 0 0', color: 'var(--color-neutral-600)' }}>Issue medicines during consultation and let pharmacy process them without altering dosage.</p>
        </div>
        {canCreate && <Button variant="primary" icon={<Pill size={16} />} onClick={() => setIsModalOpen(true)}>Create Prescription</Button>}
      </div>

      <Card>
        <CardHeader>
          <Input placeholder="Search prescriptions" value={search} onChange={(e) => setSearch(e.target.value)} icon={<Search size={16} />} />
        </CardHeader>
        <CardBody>
          {loading ? <Spinner /> : (
            <div style={{ display: 'grid', gap: '14px' }}>
              {filteredPrescriptions.map((prescription) => (
                <div key={prescription._id} style={{ border: '1px solid var(--color-neutral-200)', borderRadius: '16px', padding: '16px', display: 'grid', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{prescription.prescriptionId}</div>
                      <div style={{ color: 'var(--color-neutral-600)' }}>{prescription.patientId?.fullName || 'Unknown Patient'} • {prescription.doctorId?.fullName || 'Unknown Doctor'}</div>
                    </div>
                    <Badge variant={prescription.status === 'Dispensed' ? 'success' : prescription.status === 'Cancelled' ? 'danger' : 'primary'}>{prescription.status}</Badge>
                  </div>
                  <div style={{ color: 'var(--color-neutral-600)' }}>{(prescription.items || []).map((item) => `${item.medicineName} (${item.dosage})`).join(', ')}</div>
                  {canDispense && <Button size="sm" variant="secondary" icon={<ShieldCheck size={14} />} onClick={() => handleDispense(prescription)}>Mark Dispensed</Button>}
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Prescription">
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '14px' }}>
          <select value={formData.patientId} onChange={(e) => setFormData((prev) => ({ ...prev, patientId: e.target.value }))} style={{ padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--color-neutral-200)' }}>
            <option value="">Select patient</option>
            {patients.map((patient) => <option key={patient._id} value={patient._id}>{patient.fullName}</option>)}
          </select>
          <select value={formData.doctorId} onChange={(e) => setFormData((prev) => ({ ...prev, doctorId: e.target.value }))} style={{ padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--color-neutral-200)' }}>
            <option value="">Select doctor</option>
            {doctors.map((doctor) => <option key={doctor._id} value={doctor._id}>{doctor.fullName}</option>)}
          </select>
          <Input label="Consultation ID" value={formData.consultationId} onChange={(e) => setFormData((prev) => ({ ...prev, consultationId: e.target.value }))} />
          <Input label="Appointment ID" value={formData.appointmentId} onChange={(e) => setFormData((prev) => ({ ...prev, appointmentId: e.target.value }))} />
          <Button type="submit" variant="primary" loading={isSubmitting}>Issue Prescription</Button>
        </form>
      </Modal>
    </div>
  );
};

export default PrescriptionsPage;
