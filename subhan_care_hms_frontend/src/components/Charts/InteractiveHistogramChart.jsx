import React, { useState, useMemo, memo } from 'react';
import { BarChart2, AlignLeft, TrendingUp } from 'lucide-react';
import styles from './InteractiveHistogramChart.module.css';

const DEFAULT_PALETTE = [
  '#0891b2', // Cyan / Primary
  '#10b981', // Green / Success
  '#f59e0b', // Amber / Warning
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#3b82f6', // Blue
  '#ef4444', // Red
  '#6366f1'  // Indigo
];

// Helper to format large numbers compactly (e.g. 1.2k, 50k, 1.5M)
function formatCompact(num, prefix = '') {
  if (num >= 1000000) {
    return `${prefix}${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${prefix}${(num / 1000).toFixed(1)}k`;
  }
  return `${prefix}${num}`;
}

const InteractiveHistogramChart = ({
  data = {},
  prefix = '',
  palette = DEFAULT_PALETTE,
  allowModeSwitch = true,
  defaultMode = 'columns' // 'columns', 'bars', 'trend'
}) => {
  const [mode, setMode] = useState(defaultMode);
  const [hoveredIdx, setHoveredIdx] = useState(null);

  // Normalize entries
  const entries = useMemo(() => {
    const list = Object.entries(data).map(([label, val]) => ({
      label,
      value: Number(val) || 0
    }));

    return list.map((item, idx) => ({
      ...item,
      color: palette[idx % palette.length]
    }));
  }, [data, palette]);

  const total = useMemo(() => entries.reduce((sum, item) => sum + item.value, 0), [entries]);
  const maxVal = useMemo(() => Math.max(...entries.map((e) => e.value), 1), [entries]);

  // Ranked sorted list for horizontal bars
  const rankedEntries = useMemo(() => {
    return [...entries].sort((a, b) => b.value - a.value);
  }, [entries]);

  if (entries.length === 0) {
    return <div className={styles.emptyState}>No data records available for chart</div>;
  }

  // Grid tick values (100%, 75%, 50%, 25%, 0%)
  const topTick = maxVal;
  const midTick = Math.round(maxVal / 2);

  // Dynamic SVG Trend calculations
  const trendPoints = useMemo(() => {
    if (entries.length < 2) return null;
    const width = 500;
    const height = 180;
    const paddingX = 30;
    const paddingY = 20;

    const availableW = width - paddingX * 2;
    const availableH = height - paddingY * 2;

    const coords = entries.map((item, idx) => {
      const x = paddingX + (idx / (entries.length - 1)) * availableW;
      const y = height - paddingY - (item.value / maxVal) * availableH;
      return { x, y, ...item, idx };
    });

    // Generate smooth cubic bezier SVG path
    let pathD = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const p0 = coords[i];
      const p1 = coords[i + 1];
      const cpX1 = p0.x + (p1.x - p0.x) / 2;
      const cpY1 = p0.y;
      const cpX2 = p0.x + (p1.x - p0.x) / 2;
      const cpY2 = p1.y;
      pathD += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
    }

    const areaD = `${pathD} L ${coords[coords.length - 1].x} ${height - paddingY} L ${coords[0].x} ${height - paddingY} Z`;

    return { coords, pathD, areaD, width, height };
  }, [entries, maxVal]);

  const activeEntry = hoveredIdx !== null ? entries[hoveredIdx] : null;
  const activePercent = activeEntry && total > 0 ? Math.round((activeEntry.value / total) * 100) : 0;
  const activeRank = activeEntry ? rankedEntries.findIndex((r) => r.label === activeEntry.label) + 1 : 0;

  return (
    <div className={styles.container}>
      {allowModeSwitch && (
        <div className={styles.chartControls}>
          <div className={styles.chartSummaryInfo}>
            Total: <strong>{prefix}{total.toLocaleString()}</strong> across {entries.length} categories
          </div>
          <div className={styles.modeToggleGroup}>
            <button
              type="button"
              className={`${styles.modeBtn} ${mode === 'columns' ? styles.modeBtnActive : ''}`}
              onClick={() => setMode('columns')}
              title="Vertical Histogram / Columns"
            >
              <BarChart2 size={13} />
              Histogram
            </button>
            <button
              type="button"
              className={`${styles.modeBtn} ${mode === 'bars' ? styles.modeBtnActive : ''}`}
              onClick={() => setMode('bars')}
              title="Ranked Horizontal Bars"
            >
              <AlignLeft size={13} />
              Bars
            </button>
            <button
              type="button"
              className={`${styles.modeBtn} ${mode === 'trend' ? styles.modeBtnActive : ''}`}
              onClick={() => setMode('trend')}
              title="Smooth Spline Trend"
            >
              <TrendingUp size={13} />
              Trend
            </button>
          </div>
        </div>
      )}

      {/* MODE 1: VERTICAL HISTOGRAM / COLUMNS */}
      {mode === 'columns' && (
        <div className={styles.columnChartWrapper}>
          {/* Background Grid */}
          <div className={styles.columnChartGrid}>
            <div className={styles.gridLine}>
              <span className={styles.gridLineLabel}>{formatCompact(topTick, prefix)}</span>
            </div>
            <div className={styles.gridLine}>
              <span className={styles.gridLineLabel}>{formatCompact(midTick, prefix)}</span>
            </div>
            <div className={styles.gridLine}>
              <span className={styles.gridLineLabel}>0</span>
            </div>
          </div>

          {/* Vertical Animated Column Bars */}
          <div className={styles.columnBarsContainer}>
            {entries.map((item, idx) => {
              const heightPercent = Math.max(Math.round((item.value / maxVal) * 100), 4);
              const isHovered = hoveredIdx === idx;
              const isDimmed = hoveredIdx !== null && !isHovered;

              return (
                <div
                  key={item.label}
                  className={styles.columnBarSlot}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                >
                  {/* Top Value Pill */}
                  <div className={styles.columnBarPill}>
                    {formatCompact(item.value, prefix)}
                  </div>

                  {/* Rich Floating Tooltip */}
                  {isHovered && (
                    <div className={styles.richTooltip}>
                      <span className={styles.richTooltipTitle}>{item.label}</span>
                      <span className={styles.richTooltipValue}>{prefix}{item.value.toLocaleString()}</span>
                      <span className={styles.richTooltipSub}>
                        <span>{total > 0 ? Math.round((item.value / total) * 100) : 0}% share</span>
                        <span>•</span>
                        <span>#{activeRank} Ranked</span>
                      </span>
                    </div>
                  )}

                  <div
                    className={`${styles.columnBar} ${isHovered ? styles.columnBarActive : ''} ${isDimmed ? styles.columnBarDimmed : ''}`}
                    style={{
                      height: `${heightPercent}%`,
                      background: `linear-gradient(180deg, ${item.color}, ${item.color}cc)`
                    }}
                  />
                </div>
              );
            })}
          </div>

          {/* X-Axis Labels */}
          <div className={styles.columnXAxis}>
            {entries.map((item, idx) => (
              <div
                key={item.label}
                className={`${styles.columnXLabel} ${hoveredIdx === idx ? styles.columnXLabelActive : ''}`}
                title={item.label}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                {item.label}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODE 2: RANKED HORIZONTAL BARS */}
      {mode === 'bars' && (
        <div className={styles.horizontalBarList}>
          {rankedEntries.map((item, rankIdx) => {
            const percentage = Math.round((item.value / maxVal) * 100);
            const sharePercent = total > 0 ? Math.round((item.value / total) * 100) : 0;
            const originalIdx = entries.findIndex((e) => e.label === item.label);
            const isHovered = hoveredIdx === originalIdx;

            return (
              <div
                key={item.label}
                className={`${styles.barRow} ${isHovered ? styles.barRowActive : ''}`}
                onMouseEnter={() => setHoveredIdx(originalIdx)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                <div className={styles.barRank}>#{rankIdx + 1}</div>
                <div className={styles.barLabel} title={item.label}>
                  {item.label}
                </div>
                <div className={styles.barTrack}>
                  <div
                    className={styles.barFill}
                    style={{
                      width: `${percentage}%`,
                      background: `linear-gradient(90deg, ${item.color}bb, ${item.color})`
                    }}
                  />
                </div>
                <div className={styles.barValueCol}>
                  <span>{prefix}{item.value.toLocaleString()}</span>
                  <span className={styles.barPercent}>{sharePercent}%</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODE 3: SMOOTH SPLINE / AREA TREND */}
      {mode === 'trend' && trendPoints && (
        <div className={styles.trendChartWrapper}>
          <svg viewBox={`0 0 ${trendPoints.width} ${trendPoints.height}`} className={styles.trendSvg}>
            <defs>
              <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-primary-500)" stopOpacity="0.5" />
                <stop offset="100%" stopColor="var(--color-primary-500)" stopOpacity="0.02" />
              </linearGradient>
            </defs>

            {/* Filled Area */}
            <path d={trendPoints.areaD} fill="url(#trendGradient)" className={styles.trendArea} />

            {/* Spline Line */}
            <path d={trendPoints.pathD} stroke="var(--color-primary-500)" className={styles.trendLine} />

            {/* Interactive Data Nodes */}
            {trendPoints.coords.map((pt) => {
              const isHovered = hoveredIdx === pt.idx;
              return (
                <g key={pt.label}>
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isHovered ? 7 : 4.5}
                    fill={pt.color}
                    stroke="#ffffff"
                    strokeWidth={2}
                    className={`${styles.trendNode} ${isHovered ? styles.trendNodeActive : ''}`}
                    onMouseEnter={() => setHoveredIdx(pt.idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                  />
                  {isHovered && (
                    <g transform={`translate(${pt.x}, ${pt.y - 14})`}>
                      <rect
                        x="-45"
                        y="-22"
                        width="90"
                        height="20"
                        rx="4"
                        fill="var(--color-neutral-900)"
                      />
                      <text
                        x="0"
                        y="-8"
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="10"
                        fontWeight="700"
                      >
                        {prefix}{pt.value.toLocaleString()}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      )}
    </div>
  );
};

export default memo(InteractiveHistogramChart);
