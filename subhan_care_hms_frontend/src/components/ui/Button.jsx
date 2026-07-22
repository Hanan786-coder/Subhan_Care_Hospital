import React, { memo } from 'react';
import styles from './Button.module.css';

/**
 * Button component
 * @param {Object} props
 * @param {'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'} [props.variant='primary']
 * @param {'sm' | 'md' | 'lg'} [props.size='md']
 * @param {boolean} [props.isLoading=false]
 * @param {React.ReactNode} [props.icon]
 * @param {boolean} [props.fullWidth=false]
 * @param {React.ReactNode} props.children
 */
const Button = memo(({ 
  variant = 'primary', 
  size = 'md', 
  isLoading = false, 
  icon, 
  fullWidth = false, 
  className = '', 
  children, 
  disabled,
  ...props 
}) => {
  const baseClass = styles.button;
  const variantClass = styles[`variant-${variant}`];
  const sizeClass = styles[`size-${size}`];
  const fullWidthClass = fullWidth ? styles.fullWidth : '';
  const loadingClass = isLoading ? styles.loading : '';

  return (
    <button
      className={`${baseClass} ${variantClass} ${sizeClass} ${fullWidthClass} ${loadingClass} ${className}`.trim()}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading && (
        <span className={styles.spinner} aria-hidden="true" />
      )}
      {!isLoading && icon && <span className={styles.icon}>{icon}</span>}
      <span className={styles.content}>{children}</span>
    </button>
  );
});

Button.displayName = 'Button';
export default Button;
