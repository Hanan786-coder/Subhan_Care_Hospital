import React, { memo, useState } from 'react';
import styles from './Avatar.module.css';

/**
 * Avatar component
 */
const Avatar = memo(({ 
  src, 
  alt = 'Avatar', 
  initials, 
  size = 'md', 
  status, 
  className = '', 
  ...props 
}) => {
  const [imgError, setImgError] = useState(false);
  const sizeClass = styles[`size-${size}`];
  
  return (
    <div className={`${styles.avatarContainer} ${sizeClass} ${className}`.trim()} {...props}>
      <div className={styles.avatar}>
        {src && !imgError ? (
          <img 
            src={src} 
            alt={alt} 
            loading="lazy"
            decoding="async"
            className={styles.image} 
            onError={() => setImgError(true)} 
          />
        ) : (
          <span className={styles.initials}>{initials || alt.charAt(0).toUpperCase()}</span>
        )}
      </div>
      {status && (
        <span 
          className={`${styles.statusDot} ${styles[`status-${status}`]}`} 
          title={status}
          aria-label={`Status: ${status}`}
        />
      )}
    </div>
  );
});

Avatar.displayName = 'Avatar';
export default Avatar;
