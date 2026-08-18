import React, { memo } from 'react';
import styles from './RadialGauge.module.css';

const RadialGauge = ({
  percentage = 0,
  title = 'Fulfillment Rate',
  subtitle = '',
  successThreshold = 75,
  warningThreshold = 50
}) => {
  const clamped = Math.min(Math.max(percentage, 0), 100);
  const radius = 32;
  const circumference = 2 * Math.PI * radius; // ~201.06
  const offset = circumference - (clamped / 100) * circumference;

  let strokeColor = 'var(--color-danger-500)';
  let tierLabel = 'Needs Attention';
  let tierClass = styles.tierDanger;

  if (clamped >= successThreshold) {
    strokeColor = 'var(--color-success-500)';
    tierLabel = 'Optimal';
    tierClass = styles.tierSuccess;
  } else if (clamped >= warningThreshold) {
    strokeColor = 'var(--color-warning-500)';
    tierLabel = 'Moderate';
    tierClass = styles.tierWarning;
  }

  return (
    <div className={styles.gaugeContainer}>
      <div className={styles.gaugeCircle}>
        <svg viewBox="0 0 74 74" className={styles.gaugeSvg}>
          <circle cx="37" cy="37" r={radius} className={styles.gaugeBg} />
          <circle
            cx="37"
            cy="37"
            r={radius}
            className={styles.gaugeFill}
            stroke={strokeColor}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className={styles.gaugeCenterText}>
          <span className={styles.gaugePercent}>{clamped}%</span>
        </div>
      </div>
      <div className={styles.gaugeMeta}>
        <div className={styles.gaugeHeader}>
          <h4 className={styles.gaugeTitle}>{title}</h4>
          <span className={`${styles.gaugeTierBadge} ${tierClass}`}>{tierLabel}</span>
        </div>
        {subtitle && <p className={styles.gaugeSubtitle}>{subtitle}</p>}
      </div>
    </div>
  );
};

export default memo(RadialGauge);
