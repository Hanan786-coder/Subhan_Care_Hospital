import React, { useEffect, useState } from 'react';
import { getStaffList, deactivateStaff } from '../../services/staffService';
import { Card, CardHeader, CardBody, Button, Badge, Spinner } from '../../components/ui';
import { Plus, Edit, Trash2 } from 'lucide-react';
import styles from '../Patients/Patients.module.css';

const StaffList = () => {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const data = await getStaffList();
      setStaffList(data.data || []);
      setError(null);
    } catch (err) {
      setError('Failed to load staff.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to deactivate this staff member?')) {
      try {
        await deactivateStaff(id);
        fetchStaff();
      } catch (err) {
        alert('Failed to deactivate staff.');
      }
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Staff Management</h2>
        <Button variant="primary" icon={<Plus size={16} />}>
          Add Staff
        </Button>
      </div>

      <Card>
        <CardBody>
          {loading ? (
            <div className={styles.loader}><Spinner /></div>
          ) : error ? (
            <div className={styles.error}>{error}</div>
          ) : staffList.length === 0 ? (
            <div className={styles.empty}>No staff members found.</div>
          ) : (
            <div className={styles.tableResponsive}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Staff ID</th>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Shift</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {staffList.map(staff => (
                    <tr key={staff._id}>
                      <td>{staff.staffId}</td>
                      <td>{staff.fullName}</td>
                      <td>{staff.role}</td>
                      <td>{staff.shiftTiming?.start} - {staff.shiftTiming?.end}</td>
                      <td>
                        <Badge variant={staff.status === 'active' ? 'success' : 'danger'}>
                          {staff.status}
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
                            onClick={() => handleDelete(staff._id)}
                            disabled={staff.status === 'inactive'}
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

export default StaffList;
