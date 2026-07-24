import React, { useEffect, useState } from 'react';
import { getDoctors, deactivateDoctor } from '../../services/doctorService';
import { Card, CardHeader, CardBody, Button, Badge, Spinner } from '../../components/ui';
import { Plus, Edit, Trash2 } from 'lucide-react';
import styles from '../Patients/Patients.module.css'; // Reuse styles

const DoctorList = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const data = await getDoctors();
      setDoctors(data.data || []);
      setError(null);
    } catch (err) {
      setError('Failed to load doctors.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to deactivate this doctor?')) {
      try {
        await deactivateDoctor(id);
        fetchDoctors();
      } catch (err) {
        alert('Failed to deactivate doctor.');
      }
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Doctor Management</h2>
        <Button variant="primary" icon={<Plus size={16} />}>
          Add Doctor
        </Button>
      </div>

      <Card>
        <CardBody>
          {loading ? (
            <div className={styles.loader}><Spinner /></div>
          ) : error ? (
            <div className={styles.error}>{error}</div>
          ) : doctors.length === 0 ? (
            <div className={styles.empty}>No doctors found.</div>
          ) : (
            <div className={styles.tableResponsive}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Doctor ID</th>
                    <th>Name</th>
                    <th>Specialization</th>
                    <th>License</th>
                    <th>Fee</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {doctors.map(doc => (
                    <tr key={doc._id}>
                      <td>{doc.doctorId}</td>
                      <td>{doc.fullName}</td>
                      <td>{doc.specialization}</td>
                      <td>{doc.licenseNumber}</td>
                      <td>Rs. {doc.consultationFee}</td>
                      <td>
                        <Badge variant={doc.status === 'active' ? 'success' : 'danger'}>
                          {doc.status}
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
                            onClick={() => handleDelete(doc._id)}
                            disabled={doc.status === 'inactive'}
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

export default DoctorList;
