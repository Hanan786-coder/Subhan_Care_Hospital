import React, { memo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import styles from './Modal.module.css';

// Global counter to track open modals and lock/unlock background scroll
let activeModalCount = 0;
let originalBodyOverflow = '';
let originalDocOverflow = '';
let originalPageContentOverflows = [];

function lockBackgroundScroll() {
  if (activeModalCount === 0) {
    originalBodyOverflow = document.body.style.overflow;
    originalDocOverflow = document.documentElement.style.overflow;

    // Prevent body and html scroll
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    // Also lock all dashboard scroll containers (.pageContent)
    const pageContainers = document.querySelectorAll('[class*="pageContent"]');
    originalPageContentOverflows = [];
    pageContainers.forEach((container) => {
      originalPageContentOverflows.push({
        element: container,
        overflow: container.style.overflow
      });
      container.style.overflow = 'hidden';
    });
  }
  activeModalCount += 1;
}

function unlockBackgroundScroll() {
  activeModalCount = Math.max(0, activeModalCount - 1);
  if (activeModalCount === 0) {
    document.body.style.overflow = originalBodyOverflow;
    document.documentElement.style.overflow = originalDocOverflow;

    // Restore page containers
    originalPageContentOverflows.forEach(({ element, overflow }) => {
      if (element) {
        element.style.overflow = overflow;
      }
    });
    originalPageContentOverflows = [];
  }
}

/**
 * Modern Accessible Modal Component
 * Features:
 * - Direct DOM portal rendering (escapes parent stacking context)
 * - Complete background scroll lock for body and dashboard layout
 * - Overscroll containment (prevents background scroll bleed)
 * - Keyboard Escape listener
 * - Backdrop click to dismiss
 */
const Modal = memo(({ 
  isOpen, 
  onClose, 
  title, 
  size = 'md',
  children, 
  className = '' 
}) => {
  const overlayRef = useRef(null);

  // Escape key and Scroll Locking
  useEffect(() => {
    if (!isOpen) return;

    lockBackgroundScroll();

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('keydown', handleEscape);
      unlockBackgroundScroll();
    };
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  const sizeClass = styles[size] || styles.md;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose?.();
    }
  };

  const handleOverlayWheel = (e) => {
    // If scrolling directly on the dark backdrop, block scroll bubbling
    if (e.target === e.currentTarget) {
      e.preventDefault();
    }
  };

  const modalContent = (
    <div 
      ref={overlayRef}
      className={styles.overlay} 
      onClick={handleOverlayClick}
      onWheel={handleOverlayWheel}
      role="dialog" 
      aria-modal="true" 
      aria-labelledby="modal-title"
    >
      <div 
        className={`${styles.modal} ${sizeClass} ${className}`.trim()} 
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className={styles.header}>
            <h2 id="modal-title" className={styles.title}>{title}</h2>
            <button 
              className={styles.closeButton} 
              onClick={onClose} 
              aria-label="Close modal"
              type="button"
            >
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

  return createPortal(modalContent, document.body);
});

Modal.displayName = 'Modal';
export default Modal;
