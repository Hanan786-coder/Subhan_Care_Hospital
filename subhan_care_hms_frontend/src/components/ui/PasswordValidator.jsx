import React from 'react';
import { Check, X } from 'lucide-react';
import styles from './PasswordValidator.module.css';

export const getPasswordRequirements = (pwd = '') => {
  return [
    { id: 'length', label: 'At least 8 characters', met: pwd.length >= 8 },
    { id: 'uppercase', label: 'At least one uppercase letter (A-Z)', met: /[A-Z]/.test(pwd) },
    { id: 'lowercase', label: 'At least one lowercase letter (a-z)', met: /[a-z]/.test(pwd) },
    { id: 'number', label: 'At least one number (0-9)', met: /[0-9]/.test(pwd) },
    { id: 'special', label: 'At least one special character (@$!%*?&)', met: /[@$!%*?&]/.test(pwd) }
  ];
};

export const isPasswordValid = (pwd = '') => {
  return getPasswordRequirements(pwd).every(req => req.met);
};

const PasswordValidator = ({ password = '' }) => {
  const requirements = getPasswordRequirements(password);

  return (
    <div className={styles.container}>
      <div className={styles.title}>Password Requirements:</div>
      <div className={styles.list}>
        {requirements.map((req) => (
          <div
            key={req.id}
            className={`${styles.item} ${req.met ? styles.met : styles.unmet}`}
          >
            <span className={styles.icon}>
              {req.met ? <Check size={14} /> : <X size={14} />}
            </span>
            <span className={styles.label}>{req.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PasswordValidator;
