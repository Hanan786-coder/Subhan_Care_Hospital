import React, { useEffect, useState } from 'react';
import { getPatients, deactivatePatient } from '../../services/patientService';
import { Card, CardHeader, CardBody, Button, Badge, Spinner } from '../../components/ui';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import styles from './Patients.module.css';

const PatientList = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);

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

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to deactivate this patient?')) {
      try {
        await deactivatePatient(id);
        fetchPatients(); // refresh
      } catch (err) {
        alert('Failed to deactivate patient.');
      }
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Patient Management</h2>
        <Button variant="primary" icon={<Plus size={16} />}>
          Add Patient
        </Button>
      </div>

      <Card>
        <CardHeader>
          <form className={styles.searchForm} onSubmit={handleSearch}>
            <input 
              type="text" 
              placeholder="Search by name, CNIC, ID..." 
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
            <div className={styles.empty}>No patients found.</div>
          ) : (
            <div className={styles.tableResponsive}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Patient ID</th>
                    <th>Name</th>
                    <th>CNIC</th>
                    <th>Contact</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map(patient => (
                    <tr key={patient._id}>
                      <td>{patient.patientId}</td>
                      <td>{patient.fullName}</td>
                      <td>{patient.cnic}</td>
                      <td>{patient.contactNumber}</td>
                      <td>
                        <Badge variant={patient.status === 'active' ? 'success' : 'danger'}>
                          {patient.status}
                        </Badge>
                      </td>
                      <td>
                        <div className={styles.actions}>
                          <Button variant="ghost" size="sm" icon={<Edit size={16} />} title="Edit" />
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            icon={<Trash2 size={16} color="var(--danger)" />} 
                            title="Deactivate"
                            onClick={() => handleDelete(patient._id)}
                            disabled={patient.status === 'inactive'}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};

export default PatientList;
