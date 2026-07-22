import React, { memo } from 'react';
import styles from './Spinner.module.css';

/**
 * Spinner component
 */
const Spinner = memo(({ 
  size = 'md', 
  color = 'primary', 
  className = '', 
  ...props 
}) => {
  const sizeClass = styles[`size-${size}`];
  const colorClass = styles[`color-${color}`] || styles['color-primary'];
  
  return (
    <div 
      className={`${styles.spinner} ${sizeClass} ${colorClass} ${className}`.trim()} 
      role="status"
      aria-label="Loading"
      {...props}
    >
      <span className={styles.srOnly}>Loading...</span>
    </div>
  );
});

Spinner.displayName = 'Spinner';
export default Spinner;
