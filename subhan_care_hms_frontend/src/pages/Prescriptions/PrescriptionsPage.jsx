import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardBody, CardHeader, Button, Badge, Input, Modal, Spinner, SearchSelect } from '@/components/ui';
import useDebounce from '@/hooks/useDebounce';
import { createPrescription, dispensePrescription, getPrescriptions } from '@/services/prescriptionService';
import { getPatients } from '@/services/patientService';
import { getDoctors } from '@/services/doctorService';
import { getAppointments } from '@/services/appointmentService';
import { getInventory } from '@/services/inventoryService';
import { ROLES } from '@/constants/roles';
import { useAuth } from '@/context/AuthContext';
import { Pill, Search, ShieldCheck, Plus, Trash2, Printer, X } from 'lucide-react';
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
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [printablePrescription, setPrintablePrescription] = useState(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const getInitialFormState = (docId) => ({
    patientId: '',
    doctorId: docId || '',
    consultationId: 'SC-CON-' + Date.now().toString().slice(-5),
    appointmentId: '',
    items: [{ inventoryItemId: '', medicineName: '', dosage: '1 tablet', frequency: '1-0-1', duration: '5 days', instructions: 'After meals', quantity: 1, availableStock: 0 }],
    precautions: ['Take medication after meals', 'Drink plenty of water'],
    labTests: [],
    generalAdvice: '',
    followUpDate: ''
  });

  const [formData, setFormData] = useState(() => getInitialFormState(user?.linkedEntityId));
  const [newPrecaution, setNewPrecaution] = useState('');
  const [newTestName, setNewTestName] = useState('');
  const [newTestInstructions, setNewTestInstructions] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [prescriptionData, patientData, doctorData, appointmentData, inventoryData] = await Promise.all([
        getPrescriptions(),
        getPatients(),
        getDoctors(),
        getAppointments(),
        getInventory()
      ]);
      setPrescriptions(prescriptionData.data || []);
      setPatients(patientData.data || []);
      setDoctors(doctorData.data || []);
      setDoctorAppointments(appointmentData.data || []);
      setInventory(inventoryData.data || []);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to load prescriptions data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    if (active) {
      fetchData();
    }
    return () => {
      active = false;
    };
  }, [fetchData]);


  // Filter patients based on doctor appointment association
  const eligiblePatients = useMemo(() => {
    if (!isDoctor) return patients;

    const currentDocId = user?.linkedEntityId || formData.doctorId;
    if (!currentDocId) return patients;

    const docAppts = doctorAppointments.filter(
      app => app.doctorId?._id === currentDocId || app.doctorId === currentDocId
    );

    const patientIdsWithDoc = new Set(
      docAppts.map(app => (typeof app.patientId === 'object' ? app.patientId?._id : app.patientId)).filter(Boolean)
    );

    const filtered = patients.filter(p => patientIdsWithDoc.has(p._id));
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

  // Available medicines from inventory
  const availableMedicines = useMemo(() => {
    return inventory.filter(item => item.quantityInStock > 0);
  }, [inventory]);

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
      items: [...prev.items, { inventoryItemId: '', medicineName: '', dosage: '1 tablet', frequency: '1-0-1', duration: '5 days', instructions: 'After meals', quantity: 1, availableStock: 0 }]
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

  const handleMedicineSelect = (index, selectedItem) => {
    const updatedItems = [...formData.items];
    if (selectedItem) {
      updatedItems[index].inventoryItemId = selectedItem._id;
      updatedItems[index].medicineName = selectedItem.name;
      updatedItems[index].availableStock = selectedItem.quantityInStock;
      updatedItems[index].quantity = Math.min(updatedItems[index].quantity || 1, selectedItem.quantityInStock);
    } else {
      updatedItems[index].inventoryItemId = '';
      updatedItems[index].medicineName = '';
      updatedItems[index].availableStock = 0;
    }
    setFormData((prev) => ({ ...prev, items: updatedItems }));
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    updatedItems[index][field] = value;

    // If manual text entry for medicineName, attempt to match inventory item
    if (field === 'medicineName') {
      const match = inventory.find(inv => inv.name.toLowerCase() === value.trim().toLowerCase());
      if (match) {
        updatedItems[index].inventoryItemId = match._id;
        updatedItems[index].availableStock = match.quantityInStock;
      } else {
        updatedItems[index].inventoryItemId = '';
        updatedItems[index].availableStock = 0;
      }
    }

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

    // Validate medicine entries and stock limit
    for (let i = 0; i < formData.items.length; i++) {
      const item = formData.items[i];
      if (!item.medicineName.trim() || !item.dosage.trim()) {
        toast.error(`Please fill medicine name and dosage for item #${i + 1}`);
        return;
      }

      const reqQty = Number(item.quantity) || 1;
      const matchedInv = inventory.find(
        inv => inv._id === item.inventoryItemId || inv.name.toLowerCase() === item.medicineName.trim().toLowerCase()
      );

      if (!matchedInv) {
        toast.error(`Medicine "${item.medicineName}" is not available in hospital inventory. Please select an available medicine from stock.`);
        return;
      }

      if (matchedInv.quantityInStock <= 0 || matchedInv.status === 'Out of Stock') {
        toast.error(`Medicine "${matchedInv.name}" is currently out of stock.`);
        return;
      }

      if (reqQty > matchedInv.quantityInStock) {
        toast.error(`Requested quantity (${reqQty}) for "${matchedInv.name}" exceeds available stock (${matchedInv.quantityInStock} units)`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const res = await createPrescription(formData);
      toast.success('Prescription created successfully!');
      setIsModalOpen(false);
      setFormData(getInitialFormState(user?.linkedEntityId));
      fetchData();
      if (res?.data) {
        openPrintModal(res.data);
      }
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
      items: [{ inventoryItemId: '', medicineName: '', dosage: '1 tablet', frequency: '1-0-1', duration: '5 days', instructions: 'After meals', quantity: 1, availableStock: 0 }],
      precautions: ['Take medication after meals', 'Drink plenty of water'],
      labTests: [],
      generalAdvice: '',
      followUpDate: ''
    });
    setIsModalOpen(true);
  };

  const openPrintModal = (prescription) => {
    setPrintablePrescription(prescription);
    setIsPrintModalOpen(true);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <h2>Prescription Management</h2>
          <p>Create digital prescriptions with searchable available medicines, stock deduction, lab tests, precautions, and printable receipts.</p>
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
                      <td style={{ fontWeight: 600, color: 'var(--color-primary-700)' }}>{prescription.prescriptionId}</td>
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
                              • <strong>{item.medicineName}</strong> ({item.dosage}) - Qty: {item.quantity || 1}
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
                        <div className={styles.actions} style={{ display: 'flex', gap: '6px' }}>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            icon={<Printer size={14} />} 
                            onClick={() => openPrintModal(prescription)}
                            title="Print Prescription"
                          >
                            Print
                          </Button>
                          {canDispense && prescription.status !== 'Dispensed' && (
                            <Button 
                              size="sm" 
                              variant="secondary" 
                              icon={<ShieldCheck size={14} />} 
                              onClick={() => handleDispense(prescription)}
                            >
                              Dispense
                            </Button>
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

      {/* Create Prescription Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Prescription (Auto-Deducts Inventory)" size="xl">
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

          {/* Active Appointment Link & Ref Code */}
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
              <h4>1. Prescribed Medications (Select Available Medicine from Stock)</h4>
              <Button type="button" size="sm" variant="outline" icon={<Plus size={14} />} onClick={handleAddItem}>
                Add Medicine
              </Button>
            </div>

            {formData.items.map((item, index) => {
              const selectedInv = inventory.find(i => i._id === item.inventoryItemId || i.name.toLowerCase() === item.medicineName.trim().toLowerCase());
              const availStock = selectedInv ? selectedInv.quantityInStock : (item.availableStock || 0);

              return (
                <div key={index} style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: 'var(--color-neutral-50)', borderRadius: '8px', border: '1px solid var(--color-neutral-200)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr auto', gap: '0.5rem', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <SearchSelect
                        label={`Medicine #${index + 1}`}
                        options={availableMedicines}
                        value={item.inventoryItemId}
                        onChange={(val) => {
                          const inv = availableMedicines.find(m => m._id === val);
                          handleMedicineSelect(index, inv);
                        }}
                        placeholder="Search available medicine..."
                        getOptionLabel={(m) => `${m.name} (Stock: ${m.quantityInStock})`}
                        getOptionSublabel={(m) => `Batch: ${m.batchNumber} | Expiry: ${new Date(m.expiryDate).toLocaleDateString()}`}
                        getOptionValue={(m) => m._id}
                      />
                    </div>

                    <Input 
                      label="Dosage"
                      placeholder="e.g. 500mg" 
                      value={item.dosage} 
                      onChange={(e) => handleItemChange(index, 'dosage', e.target.value)} 
                      required 
                    />
                    <Input 
                      label="Frequency"
                      placeholder="1-0-1" 
                      value={item.frequency} 
                      onChange={(e) => handleItemChange(index, 'frequency', e.target.value)} 
                    />
                    <Input 
                      label="Duration"
                      placeholder="5 days" 
                      value={item.duration} 
                      onChange={(e) => handleItemChange(index, 'duration', e.target.value)} 
                    />
                    <Input 
                      label="Quantity"
                      type="number"
                      min="1"
                      max={availStock || 999}
                      value={item.quantity || 1} 
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} 
                      required
                    />
                    <Input 
                      label="Instructions"
                      placeholder="After meals" 
                      value={item.instructions} 
                      onChange={(e) => handleItemChange(index, 'instructions', e.target.value)} 
                    />
                    <div style={{ paddingTop: '22px' }}>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        style={{ color: 'var(--color-danger-500)', padding: '8px' }}
                        onClick={() => handleRemoveItem(index)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>

                  {/* Available Stock Indicator */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', fontSize: '0.75rem' }}>
                    {selectedInv ? (
                      <Badge variant={availStock > 10 ? 'success' : availStock > 0 ? 'warning' : 'danger'}>
                        Available Stock: {availStock} units
                      </Badge>
                    ) : (
                      <span style={{ color: 'var(--color-neutral-500)' }}>
                        Select medicine from stock list to view live availability.
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
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

      {/* Printable Prescription Modal */}
      <Modal isOpen={isPrintModalOpen} onClose={() => setIsPrintModalOpen(false)} title="Prescription Document View" size="lg">
        {printablePrescription && (
          <div>
            <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginBottom: '1rem' }}>
              <Button variant="primary" icon={<Printer size={16} />} onClick={handlePrint}>
                Print Document
              </Button>
              <Button variant="ghost" onClick={() => setIsPrintModalOpen(false)}>
                Close
              </Button>
            </div>

            <div id="printable-prescription-sheet" className={styles.prescriptionPrintSheet}>
              {/* Hospital Banner */}
              <div className={styles.rxHospitalHeader}>
                <div className={styles.rxHospitalLogo}>
                  <div style={{ width: '42px', height: '42px', backgroundColor: '#0891b2', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', fontSize: '1.2rem' }}>
                    SC
                  </div>
                  <div>
                    <h3 className={styles.rxHospitalTitle}>SUBHAN CARE HOSPITAL</h3>
                    <p className={styles.rxHospitalSubtitle}>Clinical Excellence & Outpatient Care Facility</p>
                  </div>
                </div>
                <div style={{ textAlign: 'right', fontSize: '0.75rem', color: '#64748b' }}>
                  <p style={{ margin: 0, fontWeight: 700, color: '#0f172a' }}>Rx No: {printablePrescription.prescriptionId}</p>
                  <p style={{ margin: 0 }}>Date: {new Date(printablePrescription.issuedAt).toLocaleDateString()}</p>
                  <p style={{ margin: 0 }}>Status: {printablePrescription.status}</p>
                </div>
              </div>

              {/* Patient & Doctor Meta Grid */}
              <div className={styles.rxMetaGrid}>
                <div className={styles.rxMetaBox}>
                  <h5>Patient Details</h5>
                  <p><strong>Name:</strong> {printablePrescription.patientId?.fullName || 'N/A'}</p>
                  <p><strong>CNIC:</strong> {printablePrescription.patientId?.cnic || 'N/A'}</p>
                  <p><strong>Age/Gender:</strong> {printablePrescription.patientId?.age || printablePrescription.patientId?.gender ? `${printablePrescription.patientId?.age || 'N/A'} Yrs / ${printablePrescription.patientId?.gender || ''}` : 'N/A'}</p>
                  <p><strong>Phone:</strong> {printablePrescription.patientId?.contactNumber || 'N/A'}</p>
                </div>
                <div className={styles.rxMetaBox}>
                  <h5>Attending Physician</h5>
                  <p><strong>Doctor:</strong> Dr. {printablePrescription.doctorId?.fullName || 'N/A'}</p>
                  <p><strong>Specialization:</strong> {printablePrescription.doctorId?.specialization || 'Consultant Physician'}</p>
                  <p><strong>Qualifications:</strong> {printablePrescription.doctorId?.qualification || 'MBBS, FCPS'}</p>
                  <p><strong>Department:</strong> {printablePrescription.doctorId?.department || 'Outpatient Clinic'}</p>
                </div>
              </div>

              {/* Rx Symbol */}
              <div className={styles.rxSymbol}>Rx</div>

              {/* Prescribed Medicines Table */}
              <table className={styles.rxTable}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Medicine Name</th>
                    <th>Dosage</th>
                    <th>Frequency</th>
                    <th>Duration</th>
                    <th>Qty</th>
                    <th>Instructions</th>
                  </tr>
                </thead>
                <tbody>
                  {(printablePrescription.items || []).map((item, idx) => (
                    <tr key={idx}>
                      <td>{idx + 1}</td>
                      <td style={{ fontWeight: 600 }}>{item.medicineName}</td>
                      <td>{item.dosage}</td>
                      <td>{item.frequency || '-'}</td>
                      <td>{item.duration || '-'}</td>
                      <td>{item.quantity || 1}</td>
                      <td>{item.instructions || 'As directed'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Recommended Diagnostic Lab Tests */}
              {(printablePrescription.labTests || []).length > 0 && (
                <div style={{ marginBottom: '1rem', padding: '10px 12px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <h5 style={{ margin: '0 0 4px 0', fontSize: '0.75rem', textTransform: 'uppercase', color: '#0891b2' }}>
                    Recommended Lab & Diagnostic Tests
                  </h5>
                  <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.825rem', color: '#334155' }}>
                    {printablePrescription.labTests.map((t, idx) => (
                      <li key={idx}>
                        <strong>{t.testName}</strong> {t.instructions ? `— ${t.instructions}` : ''}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Precautions & Clinical Advice */}
              {((printablePrescription.precautions || []).length > 0 || printablePrescription.generalAdvice || printablePrescription.followUpDate) && (
                <div style={{ marginBottom: '1rem', padding: '10px 12px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <h5 style={{ margin: '0 0 4px 0', fontSize: '0.75rem', textTransform: 'uppercase', color: '#475569' }}>
                    Precautions & Instructions
                  </h5>
                  <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.825rem', color: '#334155' }}>
                    {(printablePrescription.precautions || []).map((p, idx) => (
                      <li key={idx}>{p}</li>
                    ))}
                  </ul>
                  {printablePrescription.generalAdvice && (
                    <p style={{ margin: '6px 0 0 0', fontSize: '0.825rem', color: '#334155' }}>
                      <strong>General Advice / Diet:</strong> {printablePrescription.generalAdvice}
                    </p>
                  )}
                  {printablePrescription.followUpDate && (
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.825rem', color: '#0891b2', fontWeight: 600 }}>
                      <strong>Follow-up Visit:</strong> {printablePrescription.followUpDate}
                    </p>
                  )}
                </div>
              )}

              {/* Signatures Footer */}
              <div className={styles.rxFooter}>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                  <p style={{ margin: 0 }}>Subhan Care Hospital Management System</p>
                  <p style={{ margin: 0 }}>Digitally signed & verified medical record</p>
                </div>
                <div className={styles.rxSignBox}>
                  <p>Dr. {printablePrescription.doctorId?.fullName || 'Physician'}</p>
                  <span>Authorized Medical Officer</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PrescriptionsPage;
