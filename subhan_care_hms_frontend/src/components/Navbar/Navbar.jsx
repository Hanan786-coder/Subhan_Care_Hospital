import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ROLE_LABELS, ROLES } from '@/constants/roles';
import { Menu, Bell, ChevronRight, Shield, Check, ChevronDown, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import styles from './Navbar.module.css';

const Navbar = ({ toggleSidebar, isSidebarOpen, isMobile }) => {
  const { user, switchRole } = useAuth();
  const location = useLocation();
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsRoleDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const generateBreadcrumbs = () => {
    const paths = location.pathname.split('/').filter(p => p);
    return paths.map(path =>
      path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, ' ')
    );
  };

  const breadcrumbs = generateBreadcrumbs();
  const currentRoleLabel = user?.role ? ROLE_LABELS[user.role] || user.role : 'Guest';
  const pageTitle = breadcrumbs.length ? breadcrumbs[breadcrumbs.length - 1] : 'Dashboard';

  const handleRoleSelect = (roleKey) => {
    switchRole(roleKey);
    setIsRoleDropdownOpen(false);
  };

  return (
    <header className={styles.navbar}>
      <div className={styles.left}>
        <button
          onClick={toggleSidebar}
          className={styles.menuBtn}
          aria-label={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {isMobile ? <Menu size={20} /> : isSidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
        </button>

        <div className={styles.contextBlock}>
          <div className={styles.pageTitleRow}>
            <h1 className={styles.pageTitle}>{pageTitle}</h1>
          </div>
          <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
            <ol className={styles.breadcrumbList}>
              {breadcrumbs.map((crumb, index) => (
                <li key={index} className={styles.breadcrumbItem}>
                  <span className={index === breadcrumbs.length - 1 ? styles.crumbActive : styles.crumbText}>
                    {crumb}
                  </span>
                  {index < breadcrumbs.length - 1 && (
                    <ChevronRight size={14} className={styles.crumbSep} />
                  )}
                </li>
              ))}
            </ol>
          </nav>
        </div>
      </div>

      <div className={styles.right}>
        <div className={styles.roleSwitcherContainer} ref={dropdownRef}>
          <button
            className={styles.rolePickerBtn}
            onClick={() => setIsRoleDropdownOpen(prev => !prev)}
            title="Switch preview role"
          >
            <Shield size={14} className={styles.roleIcon} />
            <span className={styles.rolePickerText}>{currentRoleLabel}</span>
            <ChevronDown size={14} />
          </button>

          {isRoleDropdownOpen && (
            <div className={styles.roleMenu}>
              <div className={styles.roleMenuHeader}>Switch role</div>
              {Object.keys(ROLES).map(roleKey => {
                const isSelected = user?.role === roleKey;
                return (
                  <button
                    key={roleKey}
                    className={`${styles.roleMenuItem} ${isSelected ? styles.roleMenuItemActive : ''}`}
                    onClick={() => handleRoleSelect(roleKey)}
                  >
                    <span>{ROLE_LABELS[roleKey]}</span>
                    {isSelected && <Check size={14} color="var(--color-primary-500)" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <button className={styles.iconBtn} aria-label="Notifications">
          <Bell size={18} />
          <span className={styles.notifDot}></span>
        </button>

        <div className={styles.userPill}>
          <div className={styles.userAvatar}>
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{user?.name || 'User'}</span>
            <span className={styles.userRole}>{currentRoleLabel}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default React.memo(Navbar);
