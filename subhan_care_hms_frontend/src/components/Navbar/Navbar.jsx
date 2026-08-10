import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { ROLE_LABELS} from '@/constants/roles';
import { Menu, Bell, PanelLeftClose, PanelLeftOpen, MoonStar, SunMedium } from 'lucide-react';
import styles from './Navbar.module.css';

const Navbar = ({ toggleSidebar, isSidebarOpen, isMobile }) => {
  const { user, switchRole } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const breadcrumbs = useMemo(() => {
    const paths = location.pathname.split('/').filter(p => p);
    return paths.map(path =>
      path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, ' ')
    );
  }, [location.pathname]);

  const currentRoleLabel = user?.role ? ROLE_LABELS[user.role] || user.role : 'Guest';
  const pageTitle = breadcrumbs.length ? breadcrumbs[breadcrumbs.length - 1] : 'Dashboard';

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = currentTime.toLocaleDateString('en-US', { 
    weekday: 'short', 
    day: 'numeric', 
    month: 'short' 
  });
  
  const formattedTime = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

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
            <div className={styles.statusIndicator}>
              <span className={styles.statusDot}></span>
              <span className={styles.statusText}>System Live</span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.right}>
        <div className={styles.dateTimeBlock}>
          <span className={styles.navDate}>{formattedDate}</span>
          <span className={styles.navTime}>{formattedTime}</span>
        </div>

        <button
          className={styles.iconBtn}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          onClick={toggleTheme}
          type="button"
        >
          {theme === 'dark' ? <SunMedium size={18} /> : <MoonStar size={18} />}
        </button>

        <button className={styles.iconBtn} aria-label="Notifications" type="button">
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
