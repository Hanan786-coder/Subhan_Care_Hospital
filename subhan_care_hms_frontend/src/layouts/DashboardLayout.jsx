import React, { useState, useEffect, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '@/components/Sidebar/Sidebar';
import Navbar from '@/components/Navbar/Navbar';
import styles from './DashboardLayout.module.css';

const DashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      setIsSidebarOpen((current) => (mobile ? false : current));
    };

    checkMobile();

    let timeoutId;
    const throttledResize = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(checkMobile, 150);
    };

    window.addEventListener('resize', throttledResize);
    return () => {
      window.removeEventListener('resize', throttledResize);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);

  const closeSidebarMobile = useCallback(() => {
    if (isMobile) setIsSidebarOpen(false);
  }, [isMobile]);

  return (
    <div className={styles.layout}>
      <Sidebar
        isOpen={isSidebarOpen}
        isMobile={isMobile}
        onClose={closeSidebarMobile}
        onToggle={toggleSidebar}
      />

      {isMobile && isSidebarOpen && (
        <div
          className={styles.backdrop}
          onClick={closeSidebarMobile}
          aria-hidden="true"
        />
      )}

      <div className={styles.main}>
        <Navbar
          toggleSidebar={toggleSidebar}
          isSidebarOpen={isSidebarOpen}
          isMobile={isMobile}
        />
        <div className={styles.pageContent}>
          <div className={styles.pageInner}>
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
