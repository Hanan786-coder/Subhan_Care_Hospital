import React, { memo } from 'react';
import styles from './Badge.module.css';

/**
 * Badge component
 */
const Badge = memo(({ 
  status = 'active', 
  children, 
  className = '', 
  ...props 
}) => {
  const statusClass = styles[`status-${status}`] || styles['status-active'];
  
  return (
    <span className={`${styles.badge} ${statusClass} ${className}`.trim()} {...props}>
      {children}
    </span>
  );
});

Badge.displayName = 'Badge';
export default Badge;
