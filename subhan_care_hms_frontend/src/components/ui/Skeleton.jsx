import React, { memo } from 'react';
import styles from './Skeleton.module.css';

/**
 * Skeleton component
 */
const Skeleton = memo(({ 
  variant = 'text', 
  width, 
  height, 
  className = '', 
  ...props 
}) => {
  const variantClass = styles[`variant-${variant}`];
  const customStyles = { width, height };
  
  return (
    <div 
      className={`${styles.skeleton} ${variantClass} ${className}`.trim()} 
      style={customStyles}
      aria-hidden="true"
      {...props}
    />
  );
});

Skeleton.displayName = 'Skeleton';
export default Skeleton;
