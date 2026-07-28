import React, { memo } from 'react';
import styles from './Badge.module.css';

/**
 * Badge component
 * Supports both 'status' (active, inactive, etc.) and 'variant' (success, danger, info, warning) props.
 */
const Badge = memo(({ 
  status, 
  variant,
  children, 
  className = '', 
  ...props 
}) => {
  // Support both variant and status props for backwards compatibility
  const key = variant || status || 'active';
  const statusClass = styles[`status-${key}`] || styles[`variant-${key}`] || styles['status-active'];
  
  return (
    <span className={`${styles.badge} ${statusClass} ${className}`.trim()} {...props}>
      {children}
    </span>
  );
});

Badge.displayName = 'Badge';
export default Badge;
