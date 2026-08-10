import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ROLE_LABELS, ROLES } from '@/constants/roles';
import { Card, Badge, Skeleton, Button } from '@/components/ui';
import {
  Users, Calendar, Activity, DollarSign,
  TrendingUp, Clock, AlertTriangle, FileText,
  Package, Plus, ShieldCheck, CheckCircle2, ArrowRight, RefreshCw, Pill
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getPatients } from '@/services/patientService';
import { getAppointments } from '@/services/appointmentService';
import { getPrescriptions, dispensePrescription } from '@/services/prescriptionService';
import { getInventory } from '@/services/inventoryService';
import { getInvoices } from '@/services/billingService';
import { getAuditLogs } from '@/services/auditLogService';
import toast from 'react-hot-toast';
import styles from './DashboardHome.module.css';

const StatCard = ({ title, value, icon: Icon, colorClass, subtitle }) => (
  <div className={styles.statCard}>
    <div className={styles.statTop}>
      <div className={`${styles.statIcon} ${styles[colorClass]}`}>
        <Icon size={20} />
      </div>
    </div>
    <h3 className={styles.statValue}>{value}</h3>
    <p className={styles.statTitle}>{title}</p>
    {subtitle && <span style={{ fontSize: '0.725rem', color: 'var(--color-neutral-500)', marginTop: '4px', display: 'block' }}>{subtitle}</span>}
  </div>
);

const DashboardHome = () => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  const roleLabel = user?.role ? ROLE_LABELS[user.role] || user.role : '';
  const isAdmin = user?.role === ROLES.ADMIN;
  const isDoctor = user?.role === ROLES.DOCTOR;
  const isReceptionist = user?.role === ROLES.RECEPTIONIST;
  const isPharmacist = user?.role === ROLES.PHARMACIST;
  const isBilling = user?.role === ROLES.BILLING_STAFF;

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        getPatients(),
        getAppointments(),
        getPrescriptions(),
        getInventory(),
        getInvoices(),
        isAdmin ? getAuditLogs({ limit: 8 }) : Promise.resolve({ data: [] })
      ]);

      if (results[0].status === 'fulfilled') setPatients(results[0].value.data || []);
      if (results[1].status === 'fulfilled') setAppointments(results[1].value.data || []);
      if (results[2].status === 'fulfilled') setPrescriptions(results[2].value.data || []);
      if (results[3].status === 'fulfilled') setInventory(results[3].value.data || []);
      if (results[4].status === 'fulfilled') setInvoices(results[4].value.data || []);
      if (results[5].status === 'fulfilled') setAuditLogs(results[5].value.data || []);
    } catch (error) {
      toast.error('Failed to update dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [user?.role]);

  // Derived Dynamic Analytics
  const analytics = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];

    // Patients
    const totalPatients = patients.length;
    const todayPatients = patients.filter(p => p.createdAt && String(p.createdAt).startsWith(todayStr)).length;

    // Appointments
    const todayAppointments = appointments.filter(a => a.date && String(a.date).startsWith(todayStr));
    const pendingAppointments = appointments.filter(a => a.status === 'Scheduled' || a.status === 'Rescheduled');
    const todayCompleted = todayAppointments.filter(a => a.status === 'Completed').length;
    
    // Doctor-specific appointments
    const docAppts = isDoctor
      ? appointments.filter(a => {
          const dId = typeof a.doctorId === 'object' ? a.doctorId?._id : a.doctorId;
          return dId === user?.linkedEntityId;
        })
      : appointments;
    const docTodayAppts = docAppts.filter(a => a.date && String(a.date).startsWith(todayStr));

    // Prescriptions
    const pendingDispense = prescriptions.filter(p => p.status === 'Issued');
    const todayDispensed = prescriptions.filter(p => p.status === 'Dispensed' && p.dispensedAt && String(p.dispensedAt).startsWith(todayStr));
    const docPrescriptions = isDoctor
      ? prescriptions.filter(p => {
          const dId = typeof p.doctorId === 'object' ? p.doctorId?._id : p.doctorId;
          return dId === user?.linkedEntityId;
        })
      : prescriptions;

    // Inventory
    const lowStockItems = inventory.filter(i => Number(i.quantity) <= Number(i.reorderLevel));

    // Billing / Financials
    const totalRevenue = invoices
      .filter(i => i.status === 'Paid' || i.status === 'Partial')
      .reduce((sum, i) => sum + (Number(i.amountPaid) || 0), 0);
    const todayRevenue = invoices
      .filter(i => (i.createdAt && String(i.createdAt).startsWith(todayStr)) || (i.updatedAt && String(i.updatedAt).startsWith(todayStr)))
      .reduce((sum, i) => sum + (Number(i.amountPaid) || 0), 0);
    const unpaidInvoices = invoices.filter(i => i.status === 'Unpaid' || i.status === 'Partial');

    return {
      totalPatients,
      todayPatients,
      todayAppointments: todayAppointments.length,
      pendingAppointments: pendingAppointments.length,
      todayCompleted,
      docAppts,
      docTodayAppts,
      pendingDispense,
      todayDispensed: todayDispensed.length,
      docPrescriptions,
      totalInventory: inventory.length,
      lowStockItems,
      totalRevenue,
      todayRevenue,
      unpaidInvoices
    };
  }, [patients, appointments, prescriptions, inventory, invoices, user?.linkedEntityId, isDoctor]);

  const handleDispenseQuick = async (rxId) => {
    try {
      await dispensePrescription(rxId, { pharmacistNotes: 'Quick dispense from dashboard' });
      toast.success('Prescription dispensed');
      loadDashboardData();
    } catch (err) {
      toast.error('Failed to dispense prescription');
    }
  };

  if (isAuthLoading || loading) {
    return (
      <div className={styles.container}>
        <Skeleton variant="text" height={36} width={300} />
        <Skeleton variant="text" height={20} width={420} />
        <div className={styles.statsGrid} style={{ marginTop: 24 }}>
          {[1, 2, 3, 4].map(i => <Skeleton key={i} variant="card" height={130} />)}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header Bar */}
      <div className={styles.hero}>
        <div className={styles.header}>
          <div>
            <div className={styles.heroKicker}>Active Hospital Workspace</div>
            <h1 className={styles.greeting}>
              Welcome back, {user?.name || 'User'}
            </h1>
            <p className={styles.subtitle}>
              Role: <strong>{roleLabel}</strong> • Real-time operational data overview
            </p>
          </div>
          <div className={styles.headerActions}>
            <Button variant="outline" size="sm" icon={<RefreshCw size={14} />} onClick={loadDashboardData}>
              Refresh
            </Button>
            {isDoctor && (
              <Button variant="primary" size="sm" icon={<Pill size={14} />} onClick={() => navigate('/prescriptions')}>
                New Prescription
              </Button>
            )}
            {isReceptionist && (
              <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={() => navigate('/appointments')}>
                Book Appointment
              </Button>
            )}
            {isPharmacist && (
              <Button variant="primary" size="sm" icon={<Package size={14} />} onClick={() => navigate('/inventory')}>
                Manage Inventory
              </Button>
            )}
            {isBilling && (
              <Button variant="primary" size="sm" icon={<DollarSign size={14} />} onClick={() => navigate('/billing')}>
                New Invoice
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Role-Specific Metric Cards */}
      <div className={styles.statsGrid}>
        {isAdmin && (
          <>
            <StatCard title="Total Patients" value={analytics.totalPatients} icon={Users} colorClass="iconBlue" subtitle={`${analytics.todayPatients} registered today`} />
            <StatCard title="Today's Appointments" value={analytics.todayAppointments} icon={Calendar} colorClass="iconGreen" subtitle={`${analytics.todayCompleted} completed`} />
            <StatCard title="Total Hospital Revenue" value={`Rs. ${analytics.totalRevenue.toLocaleString()}`} icon={DollarSign} colorClass="iconPurple" subtitle={`Rs. ${analytics.todayRevenue.toLocaleString()} today`} />
            <StatCard title="Low Stock Alerts" value={analytics.lowStockItems.length} icon={AlertTriangle} colorClass="iconOrange" subtitle={`${analytics.totalInventory} total medicine items`} />
          </>
        )}

        {isDoctor && (
          <>
            <StatCard title="My Appointments Today" value={analytics.docTodayAppts.length} icon={Calendar} colorClass="iconBlue" subtitle="Scheduled for today" />
            <StatCard title="Total Consultations" value={analytics.docAppts.length} icon={Activity} colorClass="iconGreen" subtitle="Assigned to your care" />
            <StatCard title="Prescriptions Issued" value={analytics.docPrescriptions.length} icon={FileText} colorClass="iconPurple" subtitle="Issued digital scripts" />
            <StatCard title="Total Patients" value={analytics.totalPatients} icon={Users} colorClass="iconOrange" subtitle="Hospital database" />
          </>
        )}

        {isReceptionist && (
          <>
            <StatCard title="Total Registered Patients" value={analytics.totalPatients} icon={Users} colorClass="iconBlue" subtitle={`${analytics.todayPatients} added today`} />
            <StatCard title="Today's Appointments" value={analytics.todayAppointments} icon={Calendar} colorClass="iconGreen" subtitle={`${analytics.todayCompleted} completed`} />
            <StatCard title="Pending Appointments" value={analytics.pendingAppointments} icon={Clock} colorClass="iconOrange" subtitle="Awaiting consultation" />
            <StatCard title="Checked-In / Completed" value={analytics.todayCompleted} icon={CheckCircle2} colorClass="iconPurple" subtitle="Today's visits" />
          </>
        )}

        {isPharmacist && (
          <>
            <StatCard title="Prescriptions to Dispense" value={analytics.pendingDispense.length} icon={FileText} colorClass="iconBlue" subtitle="Awaiting pharmacy fulfilment" />
            <StatCard title="Dispensed Today" value={analytics.todayDispensed} icon={CheckCircle2} colorClass="iconGreen" subtitle="Successfully fulfilled" />
            <StatCard title="Medicines in Stock" value={analytics.totalInventory} icon={Package} colorClass="iconPurple" subtitle="Total inventory records" />
            <StatCard title="Low Stock Alerts" value={analytics.lowStockItems.length} icon={AlertTriangle} colorClass="iconOrange" subtitle="At or below reorder limit" />
          </>
        )}

        {isBilling && (
          <>
            <StatCard title="Today's Collections" value={`Rs. ${analytics.todayRevenue.toLocaleString()}`} icon={DollarSign} colorClass="iconGreen" subtitle="Payments recorded today" />
            <StatCard title="Unpaid Invoices" value={analytics.unpaidInvoices.length} icon={Clock} colorClass="iconOrange" subtitle="Outstanding balance pending" />
            <StatCard title="Total Revenue Collected" value={`Rs. ${analytics.totalRevenue.toLocaleString()}`} icon={TrendingUp} colorClass="iconPurple" subtitle="Lifetime revenue" />
            <StatCard title="Total Invoices" value={invoices.length} icon={FileText} colorClass="iconBlue" subtitle="Billing records generated" />
          </>
        )}
      </div>

      {/* Main Useful Dashboard Widgets */}
      <div className={styles.grid2Col}>
        {/* DOCTOR WIDGETS */}
        {isDoctor && (
          <>
            <Card padding="20px">
              <div className={styles.cardHeaderTitle} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3>Today's Patient Schedule</h3>
                  <p>Appointments assigned to you for today.</p>
                </div>
                <Button size="sm" variant="ghost" icon={<ArrowRight size={14} />} onClick={() => navigate('/appointments')}>View All</Button>
              </div>
              <div className={styles.activityList}>
                {analytics.docTodayAppts.length > 0 ? (
                  analytics.docTodayAppts.map(app => (
                    <div key={app._id} className={styles.activityItem}>
                      <div className={`${styles.activityDot} ${app.status === 'Completed' ? styles.dot_success : styles.dot_info}`} />
                      <div className={styles.activityContent}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong style={{ fontSize: '0.85rem' }}>{app.patientId?.fullName || 'Patient'}</strong>
                          <Badge variant={app.status === 'Completed' ? 'success' : 'primary'}>{app.status}</Badge>
                        </div>
                        <span className={styles.activityTime}>Slot: {app.timeSlot?.start} - {app.timeSlot?.end} | ID: {app.appointmentId}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={styles.emptyStateText}>No appointments scheduled for today.</div>
                )}
              </div>
            </Card>

            <Card padding="20px">
              <div className={styles.cardHeaderTitle} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3>My Issued Prescriptions</h3>
                  <p>Recent prescriptions created under your account.</p>
                </div>
                <Button size="sm" variant="ghost" icon={<ArrowRight size={14} />} onClick={() => navigate('/prescriptions')}>View All</Button>
              </div>
              <div className={styles.activityList}>
                {analytics.docPrescriptions.slice(0, 5).length > 0 ? (
                  analytics.docPrescriptions.slice(0, 5).map(rx => (
                    <div key={rx._id} className={styles.activityItem}>
                      <div className={styles.activityContent}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong style={{ fontSize: '0.85rem' }}>{rx.patientId?.fullName || 'Patient'} ({rx.prescriptionId})</strong>
                          <Badge variant={rx.status === 'Dispensed' ? 'success' : 'primary'}>{rx.status}</Badge>
                        </div>
                        <span className={styles.activityTime}>
                          Issued: {new Date(rx.issuedAt).toLocaleDateString()} | {rx.items?.length || 0} medications
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={styles.emptyStateText}>No prescriptions issued yet.</div>
                )}
              </div>
            </Card>
          </>
        )}

        {/* PHARMACIST WIDGETS */}
        {isPharmacist && (
          <>
            <Card padding="20px">
              <div className={styles.cardHeaderTitle} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3>Pending Dispense Queue</h3>
                  <p>Prescriptions issued by doctors ready for pharmacy dispensing.</p>
                </div>
                <Button size="sm" variant="ghost" icon={<ArrowRight size={14} />} onClick={() => navigate('/prescriptions')}>View All</Button>
              </div>
              <div className={styles.activityList}>
                {analytics.pendingDispense.slice(0, 5).length > 0 ? (
                  analytics.pendingDispense.slice(0, 5).map(rx => (
                    <div key={rx._id} className={styles.activityItem} style={{ alignItems: 'center' }}>
                      <div className={styles.activityContent}>
                        <strong style={{ fontSize: '0.85rem' }}>{rx.prescriptionId} - {rx.patientId?.fullName}</strong>
                        <p style={{ margin: '2px 0', fontSize: '0.78rem', color: 'var(--color-neutral-600)' }}>
                          Doctor: {rx.doctorId?.fullName} | {rx.items?.map(i => i.medicineName).join(', ')}
                        </p>
                      </div>
                      <Button size="sm" variant="secondary" onClick={() => handleDispenseQuick(rx._id)}>
                        Dispense
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className={styles.emptyStateText}>No pending prescriptions in queue.</div>
                )}
              </div>
            </Card>

            <Card padding="20px">
              <div className={styles.cardHeaderTitle} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3>Low Stock Reorder Alerts</h3>
                  <p>Medicines requiring immediate supplier restocking.</p>
                </div>
                <Button size="sm" variant="ghost" icon={<ArrowRight size={14} />} onClick={() => navigate('/inventory')}>Inventory</Button>
              </div>
              <div className={styles.alertList}>
                {analytics.lowStockItems.length > 0 ? (
                  analytics.lowStockItems.map(item => (
                    <div key={item._id} className={`${styles.alertBox} ${styles.alertWarning}`}>
                      <AlertTriangle size={18} className={styles.alertIcon} />
                      <div style={{ flex: 1 }}>
                        <strong>{item.name} ({item.category})</strong>
                        <p>Stock: {item.quantity} {item.unit} | Reorder Level: {item.reorderLevel} {item.unit}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={`${styles.alertBox} ${styles.alertSuccess}`}>
                    <CheckCircle2 size={18} className={styles.alertIcon} />
                    <div>
                      <strong>Stock Levels Optimal</strong>
                      <p>All pharmacy items are above minimum reorder thresholds.</p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </>
        )}

        {/* RECEPTIONIST WIDGETS */}
        {isReceptionist && (
          <>
            <Card padding="20px">
              <div className={styles.cardHeaderTitle} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3>Today's Appointment Queue</h3>
                  <p>Live schedule for patient check-ins and appointments.</p>
                </div>
                <Button size="sm" variant="ghost" icon={<ArrowRight size={14} />} onClick={() => navigate('/appointments')}>View All</Button>
              </div>
              <div className={styles.activityList}>
                {appointments.slice(0, 5).length > 0 ? (
                  appointments.slice(0, 5).map(app => (
                    <div key={app._id} className={styles.activityItem}>
                      <div className={`${styles.activityDot} ${app.status === 'Completed' ? styles.dot_success : styles.dot_info}`} />
                      <div className={styles.activityContent}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong style={{ fontSize: '0.85rem' }}>{app.patientId?.fullName || 'Patient'}</strong>
                          <Badge variant={app.status === 'Completed' ? 'success' : 'primary'}>{app.status}</Badge>
                        </div>
                        <span className={styles.activityTime}>
                          Doctor: {app.doctorId?.fullName} | Slot: {app.timeSlot?.start}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={styles.emptyStateText}>No appointments recorded today.</div>
                )}
              </div>
            </Card>

            <Card padding="20px">
              <div className={styles.cardHeaderTitle} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3>Recently Registered Patients</h3>
                  <p>Newest patient records added to the hospital directory.</p>
                </div>
                <Button size="sm" variant="ghost" icon={<ArrowRight size={14} />} onClick={() => navigate('/patients')}>Patients</Button>
              </div>
              <div className={styles.activityList}>
                {patients.slice(0, 5).map(patient => (
                  <div key={patient._id} className={styles.activityItem}>
                    <div className={styles.activityContent}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <strong style={{ fontSize: '0.85rem' }}>{patient.fullName} ({patient.patientId})</strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-neutral-500)' }}>CNIC: {patient.cnic || 'N/A'}</span>
                      </div>
                      <span className={styles.activityTime}>Gender: {patient.gender} | Contact: {patient.contactNumber}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}

        {/* BILLING STAFF WIDGETS */}
        {isBilling && (
          <>
            <Card padding="20px">
              <div className={styles.cardHeaderTitle} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3>Unpaid / Outstanding Invoices</h3>
                  <p>Invoices requiring payment processing and collection.</p>
                </div>
                <Button size="sm" variant="ghost" icon={<ArrowRight size={14} />} onClick={() => navigate('/billing')}>Billing Page</Button>
              </div>
              <div className={styles.activityList}>
                {analytics.unpaidInvoices.slice(0, 5).length > 0 ? (
                  analytics.unpaidInvoices.slice(0, 5).map(inv => (
                    <div key={inv._id} className={styles.activityItem}>
                      <div className={styles.activityContent}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <strong style={{ fontSize: '0.85rem' }}>{inv.invoiceId} - {inv.patientId?.fullName}</strong>
                          <Badge variant="warning">{inv.status}</Badge>
                        </div>
                        <span className={styles.activityTime}>
                          Total: Rs. {inv.totalAmount?.toLocaleString()} | Paid: Rs. {inv.amountPaid?.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={styles.emptyStateText}>No unpaid invoices. All balances cleared!</div>
                )}
              </div>
            </Card>

            <Card padding="20px">
              <div className={styles.cardHeaderTitle} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3>Recent Invoices Generated</h3>
                  <p>Latest billing transactions in the system.</p>
                </div>
                <Button size="sm" variant="ghost" icon={<ArrowRight size={14} />} onClick={() => navigate('/billing')}>All Invoices</Button>
              </div>
              <div className={styles.activityList}>
                {invoices.slice(0, 5).map(inv => (
                  <div key={inv._id} className={styles.activityItem}>
                    <div className={styles.activityContent}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <strong style={{ fontSize: '0.85rem' }}>{inv.invoiceId} - {inv.patientId?.fullName}</strong>
                        <Badge variant={inv.status === 'Paid' ? 'success' : 'warning'}>{inv.status}</Badge>
                      </div>
                      <span className={styles.activityTime}>
                        Amount: Rs. {inv.totalAmount?.toLocaleString()} | Date: {new Date(inv.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}

        {/* ADMIN WIDGETS */}
        {isAdmin && (
          <>
            <Card padding="20px">
              <div className={styles.cardHeaderTitle} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3>Real-Time System Audit Trail</h3>
                  <p>Live events and operational logs recorded across all roles.</p>
                </div>
                <Button size="sm" variant="ghost" icon={<ArrowRight size={14} />} onClick={() => navigate('/audit-logs')}>Audit Logs</Button>
              </div>
              <div className={styles.activityList}>
                {auditLogs.length > 0 ? (
                  auditLogs.slice(0, 6).map(log => (
                    <div key={log._id} className={styles.activityItem}>
                      <div className={`${styles.activityDot} ${styles.dot_info}`} />
                      <div className={styles.activityContent}>
                        <p className={styles.activityText}>
                          <strong>{log.performedBy?.name || 'System'}</strong> ({log.role || 'User'}): {log.action} ({log.module})
                        </p>
                        <span className={styles.activityTime}>
                          {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'Just now'}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={styles.emptyStateText}>No audit logs available.</div>
                )}
              </div>
            </Card>

            <Card padding="20px">
              <div className={styles.cardHeaderTitle}>
                <h3>Critical Operational Alerts</h3>
                <p>System inventory and stock alert status.</p>
              </div>
              <div className={styles.alertList}>
                {analytics.lowStockItems.length > 0 ? (
                  analytics.lowStockItems.map(item => (
                    <div key={item._id} className={`${styles.alertBox} ${styles.alertWarning}`}>
                      <AlertTriangle size={18} className={styles.alertIcon} />
                      <div>
                        <strong>Low Inventory Alert: {item.name}</strong>
                        <p>Remaining: {item.quantity} {item.unit} (Reorder Limit: {item.reorderLevel})</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={`${styles.alertBox} ${styles.alertSuccess}`}>
                    <CheckCircle2 size={18} className={styles.alertIcon} />
                    <div>
                      <strong>All Systems Nominal</strong>
                      <p>Inventory stock levels and database operations running normally.</p>
                    </div>
                  </div>
                )}

                <div className={`${styles.alertBox} ${styles.alertInfo}`}>
                  <ShieldCheck size={18} className={styles.alertIcon} />
                  <div>
                    <strong>Role-Based Access Control Active</strong>
                    <p>All endpoints and data fields protected by strict authorization rules.</p>
                  </div>
                </div>
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default DashboardHome;
