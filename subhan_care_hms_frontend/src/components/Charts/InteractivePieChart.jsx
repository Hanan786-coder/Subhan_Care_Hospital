import React, { useState, useMemo, memo } from 'react';
import { CountUp } from '@/components/ui';
import styles from './InteractivePieChart.module.css';

const DEFAULT_PALETTE = [
  '#0891b2', // Cyan / Primary
  '#10b981', // Green / Success
  '#f59e0b', // Amber / Warning
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#3b82f6', // Blue
  '#ef4444', // Red
  '#14b8a6'  // Teal
];

// Helper to convert polar to cartesian coordinates
function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians)
  };
}

// Helper to generate SVG Arc / Donut slice path
function describeArc(x, y, innerRadius, outerRadius, startAngle, endAngle) {
  const isFullCircle = endAngle - startAngle >= 359.99;
  const safeEndAngle = isFullCircle ? 359.99 : endAngle;

  const startOuter = polarToCartesian(x, y, outerRadius, safeEndAngle);
  const endOuter = polarToCartesian(x, y, outerRadius, startAngle);
  const largeArcFlag = safeEndAngle - startAngle <= 180 ? '0' : '1';

  if (innerRadius <= 0) {
    // Solid Pie Wedge
    return [
      'M', x, y,
      'L', endOuter.x, endOuter.y,
      'A', outerRadius, outerRadius, 0, largeArcFlag, 1, startOuter.x, startOuter.y,
      'Z'
    ].join(' ');
  }

  // Donut Arc Wedge
  const startInner = polarToCartesian(x, y, innerRadius, safeEndAngle);
  const endInner = polarToCartesian(x, y, innerRadius, startAngle);

  return [
    'M', endOuter.x, endOuter.y,
    'A', outerRadius, outerRadius, 0, largeArcFlag, 1, startOuter.x, startOuter.y,
    'L', startInner.x, startInner.y,
    'A', innerRadius, innerRadius, 0, largeArcFlag, 0, endInner.x, endInner.y,
    'Z'
  ].join(' ');
}

const InteractivePieChart = ({
  data = {},
  totalLabel = 'Total',
  prefix = '',
  palette = DEFAULT_PALETTE,
  allowModeSwitch = true,
  defaultMode = 'donut' // 'donut', 'pie', 'polar'
}) => {
  const [mode, setMode] = useState(defaultMode);
  const [hoveredIdx, setHoveredIdx] = useState(null);

  // Normalize entries
  const entries = useMemo(() => {
    return Object.entries(data)
      .filter(([, val]) => Number(val) > 0)
      .map(([label, val], idx) => ({
        label,
        value: Number(val),
        color: palette[idx % palette.length]
      }));
  }, [data, palette]);

  const total = useMemo(() => entries.reduce((sum, item) => sum + item.value, 0), [entries]);
  const maxValue = useMemo(() => Math.max(...entries.map((e) => e.value), 1), [entries]);

  if (entries.length === 0 || total === 0) {
    return <div className={styles.emptyState}>No data recorded for chart</div>;
  }

  // Calculate slice geometry
  const cx = 100;
  const cy = 100;
  const baseOuterRadius = 88;
  const donutInnerRadius = 55;
  const polarMinRadius = 38;

  let currentAngle = 0;
  const sliceAngles = entries.map((item, idx) => {
    const isPolar = mode === 'polar';
    const sweepAngle = isPolar ? 360 / entries.length : (item.value / total) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + sweepAngle;
    currentAngle = endAngle;

    const midAngle = startAngle + sweepAngle / 2;
    const rad = ((midAngle - 90) * Math.PI) / 180.0;
    const hoverDx = Math.cos(rad) * 6;
    const hoverDy = Math.sin(rad) * 6;

    let innerR = mode === 'donut' ? donutInnerRadius : mode === 'polar' ? 24 : 0;
    let outerR = baseOuterRadius;

    if (isPolar) {
      outerR = polarMinRadius + (item.value / maxValue) * (baseOuterRadius - polarMinRadius);
    }

    const pathData = describeArc(cx, cy, innerR, outerR, startAngle, endAngle);
    const percent = Math.round((item.value / total) * 100);

    return {
      ...item,
      idx,
      startAngle,
      endAngle,
      midAngle,
      hoverDx,
      hoverDy,
      percent,
      pathData
    };
  });

  const activeItem = hoveredIdx !== null ? sliceAngles[hoveredIdx] : null;

  return (
    <div className={styles.container}>
      {allowModeSwitch && (
        <div className={styles.chartControls}>
          <div className={styles.modeToggleGroup}>
            <button
              type="button"
              className={`${styles.modeBtn} ${mode === 'donut' ? styles.modeBtnActive : ''}`}
              onClick={() => setMode('donut')}
            >
              Donut
            </button>
            <button
              type="button"
              className={`${styles.modeBtn} ${mode === 'pie' ? styles.modeBtnActive : ''}`}
              onClick={() => setMode('pie')}
            >
              Pie
            </button>
            <button
              type="button"
              className={`${styles.modeBtn} ${mode === 'polar' ? styles.modeBtnActive : ''}`}
              onClick={() => setMode('polar')}
            >
              Polar
            </button>
          </div>
        </div>
      )}

      <div className={styles.chartBody}>
        <div className={styles.svgWrapper}>
          <svg viewBox="0 0 200 200" className={styles.chartSvg}>
            {sliceAngles.map((slice) => {
              const isHovered = hoveredIdx === slice.idx;
              const isDimmed = hoveredIdx !== null && !isHovered;

              return (
                <path
                  key={slice.label}
                  d={slice.pathData}
                  fill={slice.color}
                  className={`${styles.slicePath} ${isHovered ? styles.slicePathActive : ''} ${isDimmed ? styles.slicePathDimmed : ''}`}
                  style={{
                    transform: isHovered ? `translate(${slice.hoverDx}px, ${slice.hoverDy}px)` : 'none'
                  }}
                  onMouseEnter={() => setHoveredIdx(slice.idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                />
              );
            })}
          </svg>

          {/* Center Dynamic Statistics Badge */}
          {mode !== 'pie' && (
            <div className={styles.centerHud}>
              <div className={styles.centerValue}>
                <CountUp
                  value={activeItem ? activeItem.value : total}
                  prefix={prefix}
                  duration={1000}
                />
              </div>
              <div className={styles.centerLabel} title={activeItem ? activeItem.label : totalLabel}>
                {activeItem ? activeItem.label : totalLabel}
              </div>
              {activeItem && (
                <div className={styles.centerPercent}>
                  {activeItem.percent}% share
                </div>
              )}
            </div>
          )}
        </div>

        {/* Interactive Legend with Synchronized Cross-Hover */}
        <div className={styles.legend}>
          {sliceAngles.map((slice) => {
            const isHovered = hoveredIdx === slice.idx;
            const isDimmed = hoveredIdx !== null && !isHovered;

            return (
              <div
                key={slice.label}
                className={`${styles.legendItem} ${isHovered ? styles.legendItemActive : ''} ${isDimmed ? styles.legendItemDimmed : ''}`}
                onMouseEnter={() => setHoveredIdx(slice.idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                <div className={styles.legendBadge} title={slice.label}>
                  <span className={styles.legendDot} style={{ backgroundColor: slice.color }} />
                  <span>{slice.label}</span>
                </div>
                <div className={styles.legendVal}>
                  <span>{prefix}{slice.value.toLocaleString()}</span>
                  <span className={styles.legendPercent}>({slice.percent}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default memo(InteractivePieChart);
