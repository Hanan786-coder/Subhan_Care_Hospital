import React, { memo, useState, forwardRef } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import styles from './Input.module.css';

/**
 * Input component with rich Form Error & Success States
 * @param {Object} props
 */
const Input = memo(forwardRef(({
  label,
  error,
  success,
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

  const isSuccess = Boolean(success);
  const successMessage = typeof success === 'string' ? success : null;

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
          className={`${styles.input} ${icon ? styles.hasIcon : ''} ${error ? styles.hasError : isSuccess ? styles.hasSuccess : ''} ${isPassword ? styles.hasPasswordToggle : (error || isSuccess) ? styles.hasStatusIcon : ''}`.trim()}
          aria-invalid={!!error}
          {...props}
        />
        {isPassword ? (
          <button
            type="button"
            className={styles.passwordToggle}
            onClick={togglePassword}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        ) : error ? (
          <span className={styles.statusIconError} aria-hidden="true">
            <AlertCircle size={16} />
          </span>
        ) : isSuccess ? (
          <span className={styles.statusIconSuccess} aria-hidden="true">
            <CheckCircle2 size={16} />
          </span>
        ) : null}
      </div>
      {(error || successMessage || helper) && (
        <p className={`${styles.message} ${error ? styles.errorMessage : successMessage ? styles.successMessage : styles.helperMessage}`}>
          {error || successMessage || helper}
        </p>
      )}
    </div>
  );
}));

Input.displayName = 'Input';
export default Input;
