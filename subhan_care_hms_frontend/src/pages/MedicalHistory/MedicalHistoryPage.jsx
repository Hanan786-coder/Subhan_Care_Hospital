import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardBody, CardHeader, Button, Badge, Input, Modal, Spinner, SearchSelect } from '@/components/ui';
import useDebounce from '@/hooks/useDebounce';
import { getMedicalHistory, correctHistoryEntry } from '@/services/medicalHistoryService';
import { getPatients } from '@/services/patientService';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, MessageSquareCode, PlusCircle, UserCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { ROLES } from '@/constants/roles';
import toast from 'react-hot-toast';
import styles from './MedicalHistory.module.css';

const MedicalHistoryPage = () => {
  const { user } = useAuth();
  const isDoctor = user?.role === ROLES.DOCTOR;

  const [searchParams] = useSearchParams();
  const [selectedPatientId, setSelectedPatientId] = useState(searchParams.get('patientId') || '');
  const [patients, setPatients] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);

  // Correction Form Modal State
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [correctionNotes, setCorrectionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [patientData, historyData] = await Promise.all([
        getPatients(),
        getMedicalHistory(selectedPatientId ? { patientId: selectedPatientId } : {})
      ]);
      setPatients(patientData.data || []);
      setHistory(historyData.data || []);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to load medical history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedPatientId]);

  const filteredHistory = useMemo(() => {
    const query = debouncedSearch.toLowerCase().trim();
    return history.filter((entry) => 
      !query || 
      entry.patientId?.fullName?.toLowerCase().includes(query) || 
      entry.patientId?.cnic?.toLowerCase().includes(query) || 
      entry.patientId?.contactNumber?.toLowerCase().includes(query) || 
      entry.diagnosis?.toLowerCase().includes(query) || 
      entry.notes?.toLowerCase().includes(query)
    );
  }, [history, debouncedSearch]);

  const openCorrectionModal = (entry) => {
    setSelectedEntry(entry);
    setCorrectionNotes(entry.correctionNotes || '');
    setIsCorrectionModalOpen(true);
  };

  const handleCorrectionSubmit = async (e) => {
    e.preventDefault();
    if (!correctionNotes.trim()) {
      toast.error('Correction notes cannot be empty');
      return;
    }

    setIsSubmitting(true);
    try {
      await correctHistoryEntry(selectedEntry._id, { correctionNotes: correctionNotes.trim() });
      toast.success('Medical record correction saved successfully');
      setIsCorrectionModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to correct history entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <h2>Medical History Management</h2>
          <p>Immutable chronological clinical logs. Authorized doctors can submit versioned record corrections.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className={styles.controlsRow}>
            <div style={{ flex: 1, minWidth: '280px' }}>
              <SearchSelect
                placeholder="Search & filter by Patient (Name/CNIC)..."
                options={patients}
                value={selectedPatientId}
                onChange={(val) => setSelectedPatientId(val)}
                getOptionLabel={(pat) => pat.fullName}
                getOptionValue={(pat) => pat._id}
                getOptionSublabel={(pat) => pat.cnic ? `CNIC: ${pat.cnic}` : pat.contactNumber || ''}
              />
            </div>

            <div style={{ flex: 1, minWidth: '260px' }}>
              <Input 
                placeholder="Search by Patient Name, CNIC, Diagnosis, or Notes..." 
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
                    <th>Visit Date</th>
                    <th>Patient Name & CNIC</th>
                    <th>Casing Doctor</th>
                    <th>Diagnosis</th>
                    <th>Clinical Notes / Expiry Info</th>
                    <th>Prescriptions</th>
                    <th>Version & Corrections</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.map((entry) => (
                    <tr key={entry._id}>
                      <td>{new Date(entry.visitDate).toLocaleString()}</td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 600 }}>{entry.patientId?.fullName || 'N/A'}</span>
                          {entry.patientId?.cnic && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-neutral-500)' }}>
                              CNIC: {entry.patientId.cnic}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>{entry.doctorId?.fullName || 'N/A'}</td>
                      <td>
                        <Badge variant="primary">{entry.diagnosis || 'Undiagnosed'}</Badge>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '0.85rem' }}>{entry.notes || 'No description'}</span>
                          {entry.correctionNotes && (
                            <div className={styles.correctionBox}>
                              <strong>Correction Addendum:</strong> {entry.correctionNotes}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.75rem' }}>
                          {entry.prescriptions?.length > 0 ? (
                            entry.prescriptions.map((p, i) => (
                              <span key={i} style={{ color: 'var(--color-neutral-600)' }}>
                                • {p.prescriptionNumber}
                              </span>
                            ))
                          ) : (
                            <span style={{ color: 'var(--color-neutral-400)' }}>None</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <Badge variant={entry.version > 1 ? 'danger' : 'success'}>
                          Ver. {entry.version}
                        </Badge>
                      </td>
                      <td>
                        <div className={styles.actions}>
                          {isDoctor && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              icon={<MessageSquareCode size={14} />} 
                              onClick={() => openCorrectionModal(entry)}
                            >
                              Correction
                            </Button>
                          )}
                          {!isDoctor && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-neutral-400)' }}>None</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredHistory.length === 0 && (
                    <tr>
                      <td colSpan={8} className={styles.emptyState}>No medical history records found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      <Modal isOpen={isCorrectionModalOpen} onClose={() => setIsCorrectionModalOpen(false)} title="Record Correction Addendum">
        <form onSubmit={handleCorrectionSubmit} className={styles.modalForm}>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-neutral-600)' }}>
            Note: The original clinical logs cannot be deleted or modified. Your correction notes will be appended as an addendum log (incrementing record version).
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-neutral-700)' }}>Correction Notes</label>
            <textarea 
              value={correctionNotes} 
              onChange={(e) => setCorrectionNotes(e.target.value)} 
              className={styles.filterSelect}
              style={{ width: '100%', height: '120px', padding: '10px' }}
              placeholder="Enter correction notes..."
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <Button type="button" variant="ghost" onClick={() => setIsCorrectionModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" loading={isSubmitting}>Submit Correction</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MedicalHistoryPage;
