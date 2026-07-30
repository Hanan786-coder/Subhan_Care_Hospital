import React, { useCallback, useMemo } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ROLE_MENU_CONFIG, ROLE_LABELS } from '@/constants/roles';
import {
  LayoutDashboard, Users, UserCheck, UserPlus, Calendar,
  FileText, ClipboardList, CreditCard, Package, BarChart3,
  ShieldCheck, Settings, LogOut, ChevronLeft, ChevronRight,
  HeartPulse, Layers3
} from 'lucide-react';
import styles from './Sidebar.module.css';

const FULL_MENU = [
  { id: 'dashboard', path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'patients', path: '/patients', label: 'Patients', icon: Users },
  { id: 'doctors', path: '/doctors', label: 'Doctors', icon: UserCheck },
  { id: 'staff', path: '/staff', label: 'Staff Management', icon: UserPlus },
  { id: 'appointments', path: '/appointments', label: 'Appointments', icon: Calendar },
  { id: 'prescriptions', path: '/prescriptions', label: 'Prescriptions', icon: FileText },
  { id: 'medical-history', path: '/medical-history', label: 'Medical History', icon: ClipboardList },
  { id: 'billing', path: '/billing', label: 'Billing & Invoices', icon: CreditCard },
  { id: 'inventory', path: '/inventory', label: 'Inventory', icon: Package },
  { id: 'reports', path: '/reports', label: 'Reports', icon: BarChart3 },
  { id: 'audit-logs', path: '/audit-logs', label: 'Audit Logs', icon: ShieldCheck },
  { id: 'settings', path: '/settings', label: 'Settings', icon: Settings },
];

const Sidebar = ({ isOpen, isMobile, onClose, onToggle }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const allowedItemIds = user && user.role ? ROLE_MENU_CONFIG[user.role] : [];
  const menuItems = useMemo(() => FULL_MENU.filter(item => allowedItemIds.includes(item.id)), [allowedItemIds]);

  const handleLogout = useCallback(() => {
    logout();
    navigate('/login');
  }, [logout, navigate]);

  const handleNavClick = useCallback(() => {
    if (isMobile) onClose();
  }, [isMobile, onClose]);

  const roleLabel = user?.role ? ROLE_LABELS[user.role] || user.role : 'Guest';

  return (
    <aside
      className={`${styles.sidebar} ${isOpen ? styles.open : styles.collapsed} ${isMobile ? styles.mobile : ''}`}
      aria-label="Main Navigation"
    >
      <div className={`${styles.brand} ${!isOpen ? styles.brandCollapsed : ''}`}>
        <div className={`${styles.brandInner} ${!isOpen ? styles.brandInnerCollapsed : ''}`}>
          <div className={`${styles.logoMark} ${!isOpen ? styles.logoMarkCollapsed : ''}`}>
            <HeartPulse size={isOpen ? 22 : 16} color="#ffffff" />
          </div>
          {isOpen && (
            <div className={styles.brandText}>
              <span className={styles.brandName}>Subhan Care</span>
              <span className={styles.brandSub}>Operational Workspace</span>
            </div>
          )}
        </div>
        {!isMobile && (
          <button onClick={onToggle} className={`${styles.collapseBtn} ${!isOpen ? styles.collapseBtnCollapsed : ''}`} aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}>
            {isOpen ? <ChevronLeft size={16} /> : <ChevronRight size={14} />}
          </button>
        )}
      </div>

      {isOpen && (
        <div className={styles.sidebarSummary}>
          <div className={styles.summaryIcon}>
            <Layers3 size={14} />
          </div>
          <div className={styles.summaryText}>
            <span className={styles.summaryLabel}>Signed in as</span>
            <strong>{ROLE_LABELS[user?.role] || user?.role || 'Guest'}</strong>
          </div>
        </div>
      )}

      <nav className={styles.nav}>
        <ul className={styles.navList}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <NavLink
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `${styles.navLink} ${isActive ? styles.active : ''}`
                  }
                  onClick={handleNavClick}
                  title={!isOpen ? item.label : undefined}
                >
                  <span className={styles.navIcon}><Icon size={19} /></span>
                  {isOpen && <span className={styles.navLabel}>{item.label}</span>}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className={styles.footer}>
        <div className={styles.userCard}>
          <div className={styles.avatar}>
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          {isOpen && (
            <div className={styles.userInfo}>
              <span className={styles.userName}>{user?.name || 'User'}</span>
              <span className={styles.userRoleBadge}>{roleLabel}</span>
            </div>
          )}
        </div>
        <button
          onClick={handleLogout}
          className={styles.logoutBtn}
          title="Sign Out"
        >
          <LogOut size={18} />
          {isOpen && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
};

export default React.memo(Sidebar);
