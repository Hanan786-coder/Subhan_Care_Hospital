import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { ROLE_LABELS, ROLES, ROLE_MENU_CONFIG } from '@/constants/roles';
import { Card, Badge, Skeleton, Button } from '@/components/ui';
import {
  Users, Calendar, Activity, DollarSign,
  TrendingUp, Clock, AlertTriangle, FileText,
  Package, Plus, ShieldCheck, CheckCircle2
} from 'lucide-react';
import styles from './DashboardHome.module.css';

const HERO_FEATURES = [
  { title: 'Accessible by design', body: 'Clear contrast and focused pathways for every care role.' },
  { title: 'Built for trust', body: 'Professional, calm visuals that support critical hospital operations.' },
  { title: 'Operational clarity', body: 'See the status of care, billing, and inventory at a glance.' },
];

const StatCard = ({ title, value, icon: Icon, trend, colorClass }) => (
  <div className={styles.statCard}>
    <div className={styles.statTop}>
      <div className={`${styles.statIcon} ${styles[colorClass]}`}>
        <Icon size={20} />
      </div>
      {trend !== undefined && (
        <span className={`${styles.statTrend} ${trend >= 0 ? styles.trendUp : styles.trendDown}`}>
          <TrendingUp size={12} />
          {Math.abs(trend)}%
        </span>
      )}
    </div>
    <h3 className={styles.statValue}>{value}</h3>
    <p className={styles.statTitle}>{title}</p>
  </div>
);

const getStatsForRole = (role) => {
  switch (role) {
    case ROLES.ADMIN:
      return [
        { title: 'Total Registered Patients', value: '1,245', icon: Users, trend: 12, colorClass: 'iconBlue' },
        { title: "Today's Appointments", value: '42', icon: Calendar, trend: 5, colorClass: 'iconGreen' },
        { title: 'Active Doctors', value: '18', icon: Activity, trend: 0, colorClass: 'iconPurple' },
        { title: 'Monthly Revenue', value: 'Rs. 2.4M', icon: DollarSign, trend: 8, colorClass: 'iconOrange' },
      ];
    case ROLES.DOCTOR:
      return [
        { title: 'My Consultations Today', value: '8', icon: Users, trend: 2, colorClass: 'iconBlue' },
        { title: 'Upcoming Appointments', value: '5', icon: Calendar, trend: 0, colorClass: 'iconGreen' },
        { title: 'Prescriptions Issued', value: '23', icon: FileText, colorClass: 'iconPurple' },
        { title: 'Consultations (MTD)', value: '67', icon: Activity, trend: 15, colorClass: 'iconOrange' },
      ];
    case ROLES.RECEPTIONIST:
      return [
        { title: 'New Registrations Today', value: '12', icon: Users, trend: 3, colorClass: 'iconBlue' },
        { title: "Today's Appointments", value: '42', icon: Calendar, trend: 5, colorClass: 'iconGreen' },
        { title: 'Checked-in Patients', value: '28', icon: Activity, colorClass: 'iconPurple' },
        { title: 'Pending Check-ins', value: '14', icon: Clock, colorClass: 'iconOrange' },
      ];
    case ROLES.PHARMACIST:
      return [
        { title: 'Prescriptions to Dispense', value: '7', icon: FileText, colorClass: 'iconBlue' },
        { title: 'Items in Stock', value: '342', icon: Package, trend: -2, colorClass: 'iconGreen' },
        { title: 'Low Stock Alerts', value: '5', icon: AlertTriangle, colorClass: 'iconOrange' },
        { title: 'Dispensed Today', value: '19', icon: Activity, trend: 10, colorClass: 'iconPurple' },
      ];
    case ROLES.BILLING_STAFF:
      return [
        { title: "Today's Revenue", value: 'Rs. 87K', icon: DollarSign, trend: 6, colorClass: 'iconGreen' },
        { title: 'Invoices Issued', value: '15', icon: FileText, colorClass: 'iconBlue' },
        { title: 'Pending Payments', value: '8', icon: Clock, colorClass: 'iconOrange' },
        { title: 'Monthly Revenue', value: 'Rs. 2.4M', icon: TrendingUp, trend: 8, colorClass: 'iconPurple' },
      ];
    default:
      return [];
  }
};

const RECENT_ACTIVITIES = [
  { id: 1, text: 'Patient SC-PAT-01245 registered by Reception desk', time: '2 min ago', type: 'info' },
  { id: 2, text: 'Consultation completed — Dr. Ahmed Khan', time: '15 min ago', type: 'success' },
  { id: 3, text: 'Low stock alert: Paracetamol 500mg (12 units left)', time: '1 hour ago', type: 'warning' },
  { id: 4, text: 'Invoice #INV-3421 generated — Rs. 4,500', time: '2 hours ago', type: 'info' },
  { id: 5, text: 'Automated encrypted database backup completed', time: '02:00 AM', type: 'success' },
];

const ROLE_FOCUS = {
  [ROLES.DOCTOR]: [
    'Review assigned patients',
    'Close today\'s consultations',
    'Finalize prescriptions',
  ],
  [ROLES.RECEPTIONIST]: [
    'Register new patients',
    'Confirm appointment slots',
    'Keep check-ins moving',
  ],
  [ROLES.PHARMACIST]: [
    'Dispense pending prescriptions',
    'Review low-stock medicines',
    'Update inventory receipts',
  ],
  [ROLES.BILLING_STAFF]: [
    'Clear pending invoices',
    'Record today\'s collections',
    'Audit payment exceptions',
  ],
};

const DashboardHome = () => {
  const { user, isLoading } = useAuth();

  const stats = getStatsForRole(user?.role);
  const roleLabel = user?.role ? ROLE_LABELS[user.role] || user.role : '';
  const isAdmin = user?.role === ROLES.ADMIN;
  const accessibleModules = user?.role ? (ROLE_MENU_CONFIG[user.role] || []).length : 0;
  const focusItems = ROLE_FOCUS[user?.role] || [];

  if (isLoading) {
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
      <div className={styles.hero}>
        <div className={styles.header}>
          <div>
            <div className={styles.heroKicker}>Operational dashboard</div>
            <h1 className={styles.greeting}>
              Welcome back, {user?.name || 'User'}
            </h1>
            <p className={styles.subtitle}>
              Logged in as <strong>{roleLabel}</strong>. You currently have access to {accessibleModules} modules in Subhan Care HMS.
            </p>
          </div>
          <div className={styles.headerActions}>
            <Badge variant="active">{user?.role}</Badge>
            <Button variant="secondary" icon={<Plus size={16} />}>New Task</Button>
          </div>
        </div>

        <div className={styles.heroStrip}>
          <div className={styles.heroMetric}>
            <span>Role</span>
            <strong>{roleLabel}</strong>
          </div>
          <div className={styles.heroMetric}>
            <span>Access</span>
            <strong>{accessibleModules} modules</strong>
          </div>
          <div className={styles.heroMetric}>
            <span>Status</span>
            <strong>Live workspace</strong>
          </div>
        </div>

        <div className={styles.heroFeatures}>
          {HERO_FEATURES.map((feature) => (
            <div key={feature.title} className={styles.heroFeatureCard}>
              <strong>{feature.title}</strong>
              <p>{feature.body}</p>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.statsGrid}>
        {stats.map((stat, i) => (
          <StatCard key={i} {...stat} />
        ))}
      </div>

      <div className={styles.grid2Col}>
        {isAdmin ? (
          <>
            <Card padding="20px">
              <div className={styles.cardHeaderTitle}>
                <h3>Recent Hospital Activity</h3>
                <p>Live operational events visible to administration only.</p>
              </div>
              <div className={styles.activityList}>
                {RECENT_ACTIVITIES.map(item => (
                  <div key={item.id} className={styles.activityItem}>
                    <div className={`${styles.activityDot} ${styles['dot_' + item.type]}`} />
                    <div className={styles.activityContent}>
                      <p className={styles.activityText}>{item.text}</p>
                      <span className={styles.activityTime}>{item.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card padding="20px">
              <div className={styles.cardHeaderTitle}>
                <h3>System Status & Security</h3>
                <p>Only the admin can view system-level alerts and operational risk signals.</p>
              </div>
              <div className={styles.alertList}>
                <div className={`${styles.alertBox} ${styles.alertWarning}`}>
                  <AlertTriangle size={18} className={styles.alertIcon} />
                  <div>
                    <strong>Inventory Alert</strong>
                    <p>Paracetamol 500mg is below reorder threshold.</p>
                  </div>
                </div>

                <div className={`${styles.alertBox} ${styles.alertInfo}`}>
                  <Clock size={18} className={styles.alertIcon} />
                  <div>
                    <strong>Auto-Session Timeout</strong>
                    <p>Sessions automatically terminate after 15 minutes of inactivity.</p>
                  </div>
                </div>

                <div className={`${styles.alertBox} ${styles.alertSuccess}`}>
                  <CheckCircle2 size={18} className={styles.alertIcon} />
                  <div>
                    <strong>AES-256 Cloud Backup</strong>
                    <p>24-hour encrypted database snapshot saved securely.</p>
                  </div>
                </div>
              </div>
            </Card>
          </>
        ) : (
          <>
            <Card padding="20px">
              <div className={styles.cardHeaderTitle}>
                <h3>Your Focus Today</h3>
                <p>Concise actions aligned with your current role.</p>
              </div>
              <div className={styles.focusList}>
                {focusItems.map((item, index) => (
                  <div key={item} className={styles.focusItem}>
                    <span className={styles.focusIndex}>{index + 1}</span>
                    <span className={styles.focusText}>{item}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card padding="20px">
              <div className={styles.cardHeaderTitle}>
                <h3>Workspace Snapshot</h3>
                <p>What your role can access right now.</p>
              </div>
              <div className={styles.snapshotGrid}>
                <div className={styles.snapshotItem}>
                  <span>Access level</span>
                  <strong>{accessibleModules} modules</strong>
                </div>
                <div className={styles.snapshotItem}>
                  <span>Mode</span>
                  <strong>Role-aware</strong>
                </div>
                <div className={styles.snapshotItem}>
                  <span>Security</span>
                  <strong>RBAC enforced</strong>
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
