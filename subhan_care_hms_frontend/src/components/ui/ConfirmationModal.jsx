import React, { memo } from 'react';
import Modal from './Modal';
import Button from './Button';
import { AlertTriangle, Info, CheckCircle2, Trash2 } from 'lucide-react';
import styles from './ConfirmationModal.module.css';

/**
 * ConfirmationModal component
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether modal is visible
 * @param {Function} props.onClose - Callback when cancelled/dismissed
 * @param {Function} props.onConfirm - Callback when action confirmed
 * @param {string} props.title - Modal title
 * @param {string|React.ReactNode} props.message - Descriptive text
 * @param {string} [props.confirmText='Confirm'] - Text on confirm button
 * @param {string} [props.cancelText='Cancel'] - Text on cancel button
 * @param {'danger'|'warning'|'primary'|'success'} [props.variant='danger'] - Visual style of confirm action
 * @param {boolean} [props.loading=false] - Loading state for confirm button
 * @param {React.ReactNode} [props.icon] - Custom icon
 */
const ConfirmationModal = memo(({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  loading = false,
  icon,
}) => {
  if (!isOpen) return null;

  const renderIcon = () => {
    if (icon) return icon;
    switch (variant) {
      case 'danger':
        return <Trash2 size={24} className={styles.iconDanger} />;
      case 'warning':
        return <AlertTriangle size={24} className={styles.iconWarning} />;
      case 'success':
        return <CheckCircle2 size={24} className={styles.iconSuccess} />;
      case 'primary':
      default:
        return <Info size={24} className={styles.iconPrimary} />;
    }
  };

  const getButtonVariant = () => {
    switch (variant) {
      case 'danger':
        return 'danger';
      case 'warning':
        return 'warning';
      case 'success':
        return 'success';
      case 'primary':
      default:
        return 'primary';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className={styles.container}>
        <div className={`${styles.iconWrapper} ${styles[`iconWrapper_${variant}`]}`}>
          {renderIcon()}
        </div>
        
        <h3 className={styles.title}>{title}</h3>
        <div className={styles.message}>{message}</div>

        <div className={styles.actions}>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className={styles.cancelButton}
          >
            {cancelText}
          </Button>
          <Button
            variant={getButtonVariant()}
            onClick={onConfirm}
            loading={loading}
            disabled={loading}
            className={styles.confirmButton}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
});

ConfirmationModal.displayName = 'ConfirmationModal';
export default ConfirmationModal;
