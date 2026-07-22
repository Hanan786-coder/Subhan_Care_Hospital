import React, { memo, useState, forwardRef } from 'react';
import styles from './Input.module.css';

/**
 * Input component
 * @param {Object} props
 */
const Input = memo(forwardRef(({
  label,
  error,
  helper,
  type = 'text',
  icon,
  className = '',
  disabled,
  readOnly,
  id,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const inputId = id || React.useId();
  
  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;

  const togglePassword = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <div className={`${styles.wrapper} ${className}`.trim()}>
      {label && (
        <label htmlFor={inputId} className={styles.label}>
          {label}
        </label>
      )}
      <div className={styles.inputContainer}>
        {icon && <span className={styles.icon}>{icon}</span>}
        <input
          ref={ref}
          id={inputId}
          type={inputType}
          disabled={disabled}
          readOnly={readOnly}
          className={`${styles.input} ${icon ? styles.hasIcon : ''} ${error ? styles.hasError : ''} ${isPassword ? styles.hasPasswordToggle : ''}`.trim()}
          aria-invalid={!!error}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            className={styles.passwordToggle}
            onClick={togglePassword}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        )}
      </div>
      {(error || helper) && (
        <p className={`${styles.message} ${error ? styles.errorMessage : styles.helperMessage}`}>
          {error || helper}
        </p>
      )}
    </div>
  );
}));

Input.displayName = 'Input';
export default Input;
