import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardBody, CardHeader, Badge, Input, Spinner } from '@/components/ui';
import { getMedicalHistory } from '@/services/medicalHistoryService';
import { getPatients } from '@/services/patientService';
import { useSearchParams } from 'react-router-dom';
import { History, Search } from 'lucide-react';
import toast from 'react-hot-toast';

const MedicalHistoryPage = () => {
  const [searchParams] = useSearchParams();
  const [selectedPatientId, setSelectedPatientId] = useState(searchParams.get('patientId') || '');
  const [patients, setPatients] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [patientData, historyData] = await Promise.all([getPatients(), getMedicalHistory(selectedPatientId ? { patientId: selectedPatientId } : {})]);
      setPatients(patientData.data || []);
      setHistory(historyData.data || []);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to load medical history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [selectedPatientId]);

  const filteredHistory = useMemo(() => {
    const query = search.toLowerCase().trim();
    return history.filter((entry) => !query || entry.patientId?.fullName?.toLowerCase().includes(query) || entry.diagnosis?.toLowerCase().includes(query) || entry.notes?.toLowerCase().includes(query));
  }, [history, search]);

  return (
    <div style={{ display: 'grid', gap: '20px' }}>
      <div>
        <h2 style={{ margin: 0 }}>Medical History</h2>
        <p style={{ margin: '8px 0 0', color: 'var(--color-neutral-600)' }}>Chronological consultation records with immutable clinical notes and prescriptions.</p>
      </div>

      <Card>
        <CardHeader>
          <div style={{ display: 'grid', gap: '12px', width: '100%' }}>
            <select value={selectedPatientId} onChange={(e) => setSelectedPatientId(e.target.value)} style={{ padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--color-neutral-200)' }}>
              <option value="">All Patients</option>
              {patients.map((patient) => <option key={patient._id} value={patient._id}>{patient.fullName}</option>)}
            </select>
            <Input placeholder="Search history" value={search} onChange={(e) => setSearch(e.target.value)} icon={<Search size={16} />} />
          </div>
        </CardHeader>
        <CardBody>
          {loading ? <Spinner /> : (
            <div style={{ display: 'grid', gap: '14px' }}>
              {filteredHistory.map((entry) => (
                <div key={entry._id} style={{ border: '1px solid var(--color-neutral-200)', borderRadius: '16px', padding: '16px', display: 'grid', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{entry.patientId?.fullName || 'Unknown Patient'}</div>
                      <div style={{ color: 'var(--color-neutral-600)' }}>{new Date(entry.visitDate).toLocaleString()}</div>
                    </div>
                    <Badge variant="info">Version {entry.version}</Badge>
                  </div>
                  <div style={{ color: 'var(--color-neutral-600)' }}>{entry.diagnosis}</div>
                  <div style={{ color: 'var(--color-neutral-500)' }}>{entry.notes}</div>
                  {entry.prescriptions?.length ? <div style={{ color: 'var(--color-neutral-600)' }}>Prescriptions: {entry.prescriptions.map((item) => item.prescriptionNumber).join(', ')}</div> : null}
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};

export default MedicalHistoryPage;
