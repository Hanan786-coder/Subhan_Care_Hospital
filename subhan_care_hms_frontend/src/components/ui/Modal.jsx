import React, { memo, useEffect } from 'react';
import styles from './Modal.module.css';

/**
 * Modal component
 */
const Modal = memo(({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  className = '' 
}) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div 
        className={`${styles.modal} ${className}`.trim()} 
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className={styles.header}>
            <h2 id="modal-title" className={styles.title}>{title}</h2>
            <button className={styles.closeButton} onClick={onClose} aria-label="Close modal">
              &times;
            </button>
          </div>
        )}
        <div className={styles.body}>
          {children}
        </div>
      </div>
    </div>
  );
});

Modal.displayName = 'Modal';
export default Modal;
