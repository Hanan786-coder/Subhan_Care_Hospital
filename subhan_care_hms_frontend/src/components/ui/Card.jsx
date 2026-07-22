import React, { memo } from 'react';
import styles from './Card.module.css';

/**
 * Card component
 */
const Card = memo(({ 
  children, 
  className = '', 
  hoverable = false, 
  onClick,
  ...props 
}) => {
  const isClickable = !!onClick;
  
  return (
    <div 
      className={`${styles.card} ${hoverable ? styles.hoverable : ''} ${isClickable ? styles.clickable : ''} ${className}`.trim()}
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      {...props}
    >
      {children}
    </div>
  );
});

Card.displayName = 'Card';

export const CardHeader = memo(({ children, className = '', ...props }) => (
  <div className={`${styles.header} ${className}`.trim()} {...props}>
    {children}
  </div>
));
CardHeader.displayName = 'CardHeader';

export const CardBody = memo(({ children, className = '', ...props }) => (
  <div className={`${styles.body} ${className}`.trim()} {...props}>
    {children}
  </div>
));
CardBody.displayName = 'CardBody';

export const CardFooter = memo(({ children, className = '', ...props }) => (
  <div className={`${styles.footer} ${className}`.trim()} {...props}>
    {children}
  </div>
));
CardFooter.displayName = 'CardFooter';

export default Card;
