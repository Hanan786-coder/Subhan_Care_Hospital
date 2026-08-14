import { useEffect, useState, useMemo, memo } from 'react';
import { Card, Skeleton, Button, Badge } from '@/components/ui';
import {
  getSummaryReport,
  getRevenueReport,
  getPatientReport,
  getAppointmentReport,
  getInventoryReport
} from '@/services/reportService';
import {
  TrendingUp, Users, Calendar, DollarSign, Package,
  Printer, Download, Filter, AlertTriangle, RefreshCw,
  LayoutGrid
} from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './Reports.module.css';

const CHART_PALETTE = [
  '#0891b2', // Cyan / Primary
  '#10b981', // Green / Success
  '#f59e0b', // Amber / Warning
  '#ef4444', // Red / Danger
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#3b82f6', // Blue
  '#6366f1'  // Indigo
];

// Memoized Interactive SVG Donut/Pie Chart Component with Pop-out & Live Tooltips
const DonutChart = memo(({ data = {}, totalLabel = 'Total' }) => {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const entries = useMemo(() => Object.entries(data).filter(([, val]) => Number(val) > 0), [data]);
  const total = useMemo(() => entries.reduce((sum, [, val]) => sum + Number(val), 0), [entries]);

  if (entries.length === 0 || total === 0) {
    return <div className={styles.emptyState}>No data recorded for chart</div>;
  }

  let cumulativePercent = 0;
  const strokeWidth = 4;
  const radius = 15.91549430918954; // circumference = 100

  const segments = entries.map(([label, val], idx) => {
    const value = Number(val);
    const percent = (value / total) * 100;
    const dashArray = `${percent} ${100 - percent}`;
    const dashOffset = 100 - cumulativePercent;
    cumulativePercent += percent;

    return {
      label,
      value,
      percent: Math.round(percent),
      dashArray,
      dashOffset,
      color: CHART_PALETTE[idx % CHART_PALETTE.length]
    };
  });

  const activeItem = hoveredIdx !== null ? segments[hoveredIdx] : null;

  return (
    <div className={styles.donutWrapper}>
      <div className={styles.donutSvgContainer}>
        <svg viewBox="0 0 42 42" className={styles.donutSvg}>
          <circle cx="21" cy="21" r={radius} fill="none" stroke="var(--color-surface-muted)" strokeWidth={strokeWidth} />
          {segments.map((seg, idx) => (
            <circle
              key={seg.label}
              cx="21"
              cy="21"
              r={radius}
              className={`${styles.donutSegment} ${hoveredIdx === idx ? styles.donutSegmentActive : ''}`}
              stroke={seg.color}
              strokeDasharray={seg.dashArray}
              strokeDashoffset={seg.dashOffset}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            />
          ))}
        </svg>
        <div className={styles.donutCenterText}>
          <div className={styles.donutCenterVal}>
            {activeItem ? activeItem.value.toLocaleString() : total.toLocaleString()}
          </div>
          <div className={styles.donutCenterLbl} title={activeItem ? activeItem.label : totalLabel}>
            {activeItem ? `${activeItem.label} (${activeItem.percent}%)` : totalLabel}
          </div>
        </div>
      </div>

      <div className={styles.donutLegend}>
        {segments.map((seg, idx) => (
          <div
            key={seg.label}
            className={`${styles.donutLegendItem} ${hoveredIdx === idx ? styles.donutLegendItemActive : ''}`}
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
          >
            <div className={styles.donutLegendBadge}>
              <span className={styles.donutDot} style={{ backgroundColor: seg.color }} />
              <span>{seg.label}</span>
            </div>
            <div className={styles.donutLegendVal}>
              {seg.value.toLocaleString()} <span style={{ fontSize: '0.725rem', color: 'var(--color-neutral-500)', fontWeight: 500 }}>({seg.percent}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

// Memoized Radial Gauge Ring Component
const GaugeRing = memo(({ percentage = 0, title = 'Rate', subtitle = '' }) => {
  const clamped = Math.min(Math.max(percentage, 0), 100);
  const radius = 28;
  const circumference = 2 * Math.PI * radius; // ~175.9
  const offset = circumference - (clamped / 100) * circumference;
  const strokeColor = clamped >= 75 ? 'var(--color-success-500)' : clamped >= 50 ? 'var(--color-warning-500)' : 'var(--color-danger-500)';

  return (
    <div className={styles.gaugeContainer}>
      <div className={styles.gaugeCircle}>
        <svg viewBox="0 0 64 64" className={styles.gaugeSvg}>
          <circle cx="32" cy="32" r={radius} className={styles.gaugeBg} />
          <circle
            cx="32"
            cy="32"
            r={radius}
            className={styles.gaugeFill}
            stroke={strokeColor}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className={styles.gaugeText}>{clamped}%</div>
      </div>
      <div className={styles.gaugeMeta}>
        <h4>{title}</h4>
        <p>{subtitle}</p>
      </div>
    </div>
  );
});

// Memoized Animated Column / Bar Chart Component
const AnimatedBarChart = memo(({ data = {}, prefix = '' }) => {
  const entries = useMemo(() => Object.entries(data), [data]);
  const maxVal = useMemo(() => Math.max(...entries.map(([, val]) => Number(val) || 0), 1), [entries]);

  if (entries.length === 0) {
    return <div className={styles.emptyState}>No records available for chart</div>;
  }

  // Use vertical column chart when <= 8 items for maximum visual impact, or horizontal if more items
  const isVertical = entries.length <= 8;

  if (!isVertical) {
    return (
      <div className={styles.horizontalBarChart}>
        {entries.map(([label, val], idx) => {
          const numVal = Number(val) || 0;
          const percentage = Math.round((numVal / maxVal) * 100);
          const color = CHART_PALETTE[idx % CHART_PALETTE.length];

          return (
            <div key={label} className={styles.chartRow}>
              <div className={styles.chartLabel} title={label}>{label}</div>
              <div className={styles.chartBarTrack}>
                <div
                  className={styles.chartBarFill}
                  style={{
                    width: `${percentage}%`,
                    background: `linear-gradient(90deg, ${color}dd, ${color})`,
                    animationDelay: `${idx * 0.08}s`
                  }}
                />
              </div>
              <div className={styles.chartValue}>
                {prefix} {numVal.toLocaleString()}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Grid tick values (100%, 50%, 0%)
  const topTick = maxVal;
  const midTick = Math.round(maxVal / 2);

  return (
    <div className={styles.columnChartWrapper}>
      {/* Background Grid */}
      <div className={styles.columnChartGrid}>
        <div className={styles.gridLine}>
          <span className={styles.gridLineLabel}>{topTick > 999 ? `${(topTick/1000).toFixed(1)}k` : topTick}</span>
        </div>
        <div className={styles.gridLine}>
          <span className={styles.gridLineLabel}>{midTick > 999 ? `${(midTick/1000).toFixed(1)}k` : midTick}</span>
        </div>
        <div className={styles.gridLine}>
          <span className={styles.gridLineLabel}>0</span>
        </div>
      </div>

      {/* Vertical Animated Column Bars */}
      <div className={styles.columnBarsContainer}>
        {entries.map(([label, val], idx) => {
          const numVal = Number(val) || 0;
          const heightPercent = Math.max(Math.round((numVal / maxVal) * 100), 4);
          const color = CHART_PALETTE[idx % CHART_PALETTE.length];

          return (
            <div
              key={label}
              className={styles.columnBarSlot}
            >
              <div className={styles.columnBarTooltip}>
                {label}: {prefix} {numVal.toLocaleString()}
              </div>
              <div
                className={styles.columnBar}
                style={{
                  height: `${heightPercent}%`,
                  background: `linear-gradient(180deg, ${color}, ${color}cc)`,
                  animationDelay: `${idx * 0.08}s`
                }}
              />
            </div>
          );
        })}
      </div>

      {/* X-Axis Labels */}
      <div className={styles.columnXAxis}>
        {entries.map(([label]) => (
          <div key={label} className={styles.columnXLabel} title={label}>
            {label}
          </div>
        ))}
      </div>
    </div>
  );
});

const ReportsPage = () => {
  const [range, setRange] = useState('all');
  const [activeCategory, setActiveCategory] = useState('all'); // 'all', 'revenue', 'patients', 'appointments', 'inventory'
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // States
  const [summary, setSummary] = useState(null);
  const [revenue, setRevenue] = useState(null);
  const [patientStats, setPatientStats] = useState(null);
  const [appointmentStats, setAppointmentStats] = useState(null);
  const [inventoryStats, setInventoryStats] = useState(null);

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const [sumRes, revRes, patRes, appRes, invRes] = await Promise.all([
          getSummaryReport(range),
          getRevenueReport(range),
          getPatientReport(),
          getAppointmentReport(range),
          getInventoryReport()
        ]);

        if (isMounted) {
          setSummary(sumRes.data || {});
          setRevenue(revRes.data || {});
          setPatientStats(patRes.data || {});
          setAppointmentStats(appRes.data || {});
          setInventoryStats(invRes.data || {});
        }
      } catch (error) {
        if (isMounted) {
          toast.error(error.response?.data?.error || 'Failed to load report analytics');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, [range, refreshKey]);

  // Derived Collection Rate & Fulfillment Rate
  const collectionRate = useMemo(() => {
    if (!revenue?.totalBilled || revenue.totalBilled === 0) return 100;
    return Math.round((revenue.totalCollected / revenue.totalBilled) * 100);
  }, [revenue]);

  const completionRate = useMemo(() => {
    if (!summary?.totalAppointments || summary.totalAppointments === 0) return 100;
    return Math.round((summary.completedAppointments / summary.totalAppointments) * 100);
  }, [summary]);

  // Print Report Handler
  const handlePrintReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Popup blocker active. Please allow popups to print report.');
      return;
    }

    const todayStr = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Subhan Care HMS — Executive Report</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Figtree:wght@400;600;700&display=swap');
            body { font-family: 'Figtree', sans-serif; padding: 40px; color: #164e63; background: #ffffff; line-height: 1.5; }
            .header { border-bottom: 3px solid #0891b2; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end; }
            .header h1 { margin: 0; color: #164e63; font-size: 26px; }
            .header p { margin: 4px 0 0 0; color: #456a76; font-size: 13px; }
            .badge { background: #ecfeff; border: 1px solid #0891b2; color: #0891b2; padding: 4px 12px; border-radius: 99px; font-weight: 600; font-size: 12px; }
            .section-title { font-size: 16px; font-weight: 700; color: #164e63; margin-top: 30px; margin-bottom: 12px; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; }
            .grid-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 30px; }
            .stat-box { background: #f8fbfc; border: 1px solid #cffafe; padding: 14px; border-radius: 12px; text-align: center; }
            .stat-box strong { font-size: 22px; color: #0e7490; display: block; }
            .stat-box span { font-size: 11px; color: #456a76; text-transform: uppercase; letter-spacing: 0.05em; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; }
            th, td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: left; }
            th { background: #f8fafc; font-size: 11px; text-transform: uppercase; color: #456a76; font-weight: 600; }
            .footer { margin-top: 50px; border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; font-size: 11px; color: #94a3b8; }
          </style>
        </head>
        <body onload="window.print();">
          <div class="header">
            <div>
              <h1>Subhan Care Hospital Management System</h1>
              <p>Comprehensive Executive Operational & Financial Analytics Report</p>
            </div>
            <div>
              <span class="badge">Range: ${range.toUpperCase()}</span>
              <p style="font-size: 11px; color: #64748b; margin-top: 4px;">Generated: ${todayStr}</p>
            </div>
          </div>

          <div class="grid-stats">
            <div class="stat-box">
              <strong>${summary?.totalPatients || 0}</strong>
              <span>Total Patients</span>
            </div>
            <div class="stat-box">
              <strong>${summary?.totalAppointments || 0}</strong>
              <span>Appointments</span>
            </div>
            <div class="stat-box">
              <strong>Rs. ${(summary?.totalRevenue || 0).toLocaleString()}</strong>
              <span>Revenue Collected</span>
            </div>
            <div class="stat-box">
              <strong>Rs. ${(summary?.outstandingBalance || 0).toLocaleString()}</strong>
              <span>Outstanding Due</span>
            </div>
          </div>

          <div class="section-title">Revenue & Financial Breakdown</div>
          <table>
            <thead>
              <tr><th>Metric</th><th>Amount / Count</th></tr>
            </thead>
            <tbody>
              <tr><td>Total Revenue Billed</td><td><strong>Rs. ${(revenue?.totalBilled || 0).toLocaleString()}</strong></td></tr>
              <tr><td>Total Revenue Collected</td><td style="color: #059669;"><strong>Rs. ${(revenue?.totalCollected || 0).toLocaleString()}</strong></td></tr>
              <tr><td>Total Balance Outstanding</td><td style="color: #dc2626;"><strong>Rs. ${(revenue?.totalOutstanding || 0).toLocaleString()}</strong></td></tr>
              <tr><td>Total Invoices Issued</td><td>${revenue?.totalInvoices || 0}</td></tr>
            </tbody>
          </table>

          <div class="section-title">Payment Method Distribution</div>
          <table>
            <thead>
              <tr><th>Payment Method</th><th>Amount Collected (Rs.)</th></tr>
            </thead>
            <tbody>
              ${Object.entries(revenue?.paymentMethods || {}).map(([m, amt]) => `
                <tr><td>${m}</td><td>Rs. ${(amt || 0).toLocaleString()}</td></tr>
              `).join('')}
            </tbody>
          </table>

          <div class="section-title">Patient Demographics</div>
          <table>
            <thead>
              <tr><th>Category</th><th>Details</th></tr>
            </thead>
            <tbody>
              <tr><td>Total Registered Patients</td><td>${patientStats?.totalPatients || 0}</td></tr>
              <tr><td>Registered Today</td><td>${patientStats?.registeredToday || 0}</td></tr>
              <tr><td>Gender Breakdown</td><td>${Object.entries(patientStats?.genderStats || {}).map(([g, c]) => `${g}: ${c}`).join(' | ')}</td></tr>
            </tbody>
          </table>

          <div class="section-title">Low Inventory Stock Alerts</div>
          <table>
            <thead>
              <tr><th>Item Name</th><th>Category</th><th>Current Stock</th><th>Reorder Level</th></tr>
            </thead>
            <tbody>
              ${(inventoryStats?.lowStockItems || []).map(item => `
                <tr>
                  <td><strong>${item.name}</strong></td>
                  <td>${item.category}</td>
                  <td style="color: #dc2626;"><strong>${item.quantityInStock ?? item.quantity ?? 0} ${item.unit || 'units'}</strong></td>
                  <td>${item.reorderThreshold ?? item.reorderLevel ?? 0} ${item.unit || 'units'}</td>
                </tr>
              `).join('') || '<tr><td colSpan="4">No low stock items. Inventory healthy!</td></tr>'}
            </tbody>
          </table>

          <div class="footer">
            <p>Subhan Care HMS • Confidential Internal Executive Report • Printed automatically</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleSavePicture = () => {
    handlePrintReport();
    toast.success('Report print view opened. Choose "Save as PDF" or print as picture in your browser.');
  };

  if (loading && !summary) {
    return (
      <div className={styles.container}>
        <Skeleton variant="text" height={36} width={300} />
        <Skeleton variant="text" height={20} width={420} />
        <div className={styles.statsGrid} style={{ marginTop: 24 }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} variant="card" height={110} />
          ))}
        </div>
      </div>
    );
  }

  const showAll = activeCategory === 'all';
  const showRevenue = showAll || activeCategory === 'revenue';
  const showPatients = showAll || activeCategory === 'patients';
  const showAppointments = showAll || activeCategory === 'appointments';
  const showInventory = showAll || activeCategory === 'inventory';

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <h2>Hospital Analytics & Executive Dashboard</h2>
          <p>Real-time performance analytics, interactive data visualizer, and stock inventory metrics.</p>
        </div>
        <div className={styles.headerActions}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Filter size={16} style={{ color: 'var(--color-neutral-500)' }} />
            <select
              className={styles.rangeSelect}
              value={range}
              onChange={(e) => setRange(e.target.value)}
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
          </div>
          <Button variant="outline" icon={<RefreshCw size={14} />} onClick={handleRefresh}>
            Refresh
          </Button>
          <Button variant="outline" icon={<Download size={14} />} onClick={handleSavePicture}>
            Save Picture / PDF
          </Button>
          <Button variant="primary" icon={<Printer size={14} />} onClick={handlePrintReport}>
            Print Report
          </Button>
        </div>
      </div>

      {/* Category Tab Bar */}
      <div className={styles.tabsBar}>
        <button
          className={`${styles.tabBtn} ${activeCategory === 'all' ? styles.tabActive : ''}`}
          onClick={() => setActiveCategory('all')}
        >
          <LayoutGrid size={16} /> All Reports
        </button>
        <button
          className={`${styles.tabBtn} ${activeCategory === 'revenue' ? styles.tabActive : ''}`}
          onClick={() => setActiveCategory('revenue')}
        >
          <DollarSign size={16} /> Financials & Revenue
        </button>
        <button
          className={`${styles.tabBtn} ${activeCategory === 'patients' ? styles.tabActive : ''}`}
          onClick={() => setActiveCategory('patients')}
        >
          <Users size={16} /> Patients & Demographics
        </button>
        <button
          className={`${styles.tabBtn} ${activeCategory === 'appointments' ? styles.tabActive : ''}`}
          onClick={() => setActiveCategory('appointments')}
        >
          <Calendar size={16} /> Appointments & Operations
        </button>
        <button
          className={`${styles.tabBtn} ${activeCategory === 'inventory' ? styles.tabActive : ''}`}
          onClick={() => setActiveCategory('inventory')}
        >
          <Package size={16} /> Pharmacy & Stock Alerts
        </button>
      </div>

      {/* Animated KPI Cards Row */}
      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.animatedCard} ${styles.delay1}`}>
          <div className={styles.statTop}>
            <span className={styles.statLabel}>Total Patients</span>
            <div className={`${styles.statIcon} ${styles.iconCyan}`}>
              <Users size={20} />
            </div>
          </div>
          <div className={styles.statValue}>{summary?.totalPatients || 0}</div>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-neutral-500)' }}>
            +{summary?.newPatients || 0} new in range
          </span>
        </div>

        <div className={`${styles.statCard} ${styles.animatedCard} ${styles.delay2}`}>
          <div className={styles.statTop}>
            <span className={styles.statLabel}>Appointments</span>
            <div className={`${styles.statIcon} ${styles.iconGreen}`}>
              <Calendar size={20} />
            </div>
          </div>
          <div className={styles.statValue}>{summary?.totalAppointments || 0}</div>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-success-600)' }}>
            {summary?.completedAppointments || 0} Completed
          </span>
        </div>

        <div className={`${styles.statCard} ${styles.animatedCard} ${styles.delay3}`}>
          <div className={styles.statTop}>
            <span className={styles.statLabel}>Revenue Collected</span>
            <div className={`${styles.statIcon} ${styles.iconPurple}`}>
              <DollarSign size={20} />
            </div>
          </div>
          <div className={styles.statValue}>
            Rs. {(summary?.totalRevenue || 0).toLocaleString()}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-neutral-500)' }}>
            Rs. {(summary?.totalBilled || 0).toLocaleString()} Billed
          </span>
        </div>

        <div className={`${styles.statCard} ${styles.animatedCard} ${styles.delay4}`}>
          <div className={styles.statTop}>
            <span className={styles.statLabel}>Outstanding Balance</span>
            <div className={`${styles.statIcon} ${styles.iconOrange}`}>
              <TrendingUp size={20} />
            </div>
          </div>
          <div className={styles.statValue} style={{ color: summary?.outstandingBalance > 0 ? 'var(--color-warning-600)' : 'inherit' }}>
            Rs. {(summary?.outstandingBalance || 0).toLocaleString()}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-neutral-500)' }}>
            {summary?.totalInvoices || 0} Invoices Issued
          </span>
        </div>

        <div className={`${styles.statCard} ${styles.animatedCard} ${styles.delay5}`}>
          <div className={styles.statTop}>
            <span className={styles.statLabel}>Stock Alerts</span>
            <div className={`${styles.statIcon} ${styles.iconRed}`}>
              <AlertTriangle size={20} />
            </div>
          </div>
          <div className={styles.statValue} style={{ color: (inventoryStats?.lowStockCount ?? summary?.lowStockAlerts ?? 0) > 0 ? 'var(--color-danger-600)' : 'inherit' }}>
            {inventoryStats?.lowStockCount ?? summary?.lowStockAlerts ?? 0}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-neutral-500)' }}>
            Low Inventory Items
          </span>
        </div>
      </div>

      {/* Main Grid: Revenue & Patients */}
      <div className={styles.grid2Col}>
        {/* Revenue Analytics Card */}
        {showRevenue && (
          <div className={`${styles.animatedCard} ${styles.delay1}`}>
            <Card padding="24px">
              <div className={styles.cardTitle}>
                <div className={styles.cardTitleLeft}>
                  <DollarSign size={18} style={{ color: 'var(--color-success-600)' }} />
                  Revenue & Financial Collections
                </div>
                <Badge variant="success">Financials</Badge>
              </div>

              <GaugeRing
                percentage={collectionRate}
                title="Revenue Collection Rate"
                subtitle={`${collectionRate}% of total billed invoices collected`}
              />

              <div className={styles.metricsSummaryGrid}>
                <div className={styles.metricTile}>
                  <div className={styles.metricTileValue}>Rs. {(revenue?.totalCollected || 0).toLocaleString()}</div>
                  <div className={styles.metricTileLabel}>Collected</div>
                </div>
                <div className={styles.metricTile}>
                  <div className={styles.metricTileValue} style={{ color: 'var(--color-danger-600)' }}>
                    Rs. {(revenue?.totalOutstanding || 0).toLocaleString()}
                  </div>
                  <div className={styles.metricTileLabel}>Balance Due</div>
                </div>
                <div className={styles.metricTile}>
                  <div className={styles.metricTileValue}>{revenue?.totalInvoices || 0}</div>
                  <div className={styles.metricTileLabel}>Invoices</div>
                </div>
              </div>

              <h4 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: 12, color: 'var(--color-neutral-800)' }}>
                Payment Method Share (Donut Chart)
              </h4>
              <DonutChart data={revenue?.paymentMethods || {}} totalLabel="Collections" />

              <h4 style={{ fontSize: '0.875rem', fontWeight: 700, marginTop: 24, marginBottom: 12, color: 'var(--color-neutral-800)' }}>
                Revenue by Service Category (Bar Chart)
              </h4>
              <AnimatedBarChart data={revenue?.itemTypeRevenue || {}} prefix="Rs." />
            </Card>
          </div>
        )}

        {/* Patient Analytics Card */}
        {showPatients && (
          <div className={`${styles.animatedCard} ${styles.delay2}`}>
            <Card padding="24px">
              <div className={styles.cardTitle}>
                <div className={styles.cardTitleLeft}>
                  <Users size={18} style={{ color: 'var(--color-primary-600)' }} />
                  Patient Demographics & Distribution
                </div>
                <Badge variant="primary">Demographics</Badge>
              </div>

              <div className={styles.metricsSummaryGrid}>
                <div className={styles.metricTile}>
                  <div className={styles.metricTileValue}>{patientStats?.totalPatients || 0}</div>
                  <div className={styles.metricTileLabel}>Total Patients</div>
                </div>
                <div className={styles.metricTile}>
                  <div className={styles.metricTileValue}>{patientStats?.registeredToday || 0}</div>
                  <div className={styles.metricTileLabel}>New Today</div>
                </div>
              </div>

              <h4 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: 12, color: 'var(--color-neutral-800)' }}>
                Gender Breakdown (Donut Chart)
              </h4>
              <DonutChart data={patientStats?.genderStats || {}} totalLabel="Patients" />

              <h4 style={{ fontSize: '0.875rem', fontWeight: 700, marginTop: 24, marginBottom: 12, color: 'var(--color-neutral-800)' }}>
                Age Group Brackets (Bar Chart)
              </h4>
              <AnimatedBarChart data={patientStats?.ageGroupStats || {}} />

              <h4 style={{ fontSize: '0.875rem', fontWeight: 700, marginTop: 24, marginBottom: 12, color: 'var(--color-neutral-800)' }}>
                Blood Group Distribution (Bar Chart)
              </h4>
              <AnimatedBarChart data={patientStats?.bloodGroupStats || {}} />
            </Card>
          </div>
        )}
      </div>

      {/* Grid: Appointments & Inventory */}
      <div className={styles.grid2Col}>
        {/* Appointment Analytics Card */}
        {showAppointments && (
          <div className={`${styles.animatedCard} ${styles.delay3}`}>
            <Card padding="24px">
              <div className={styles.cardTitle}>
                <div className={styles.cardTitleLeft}>
                  <Calendar size={18} style={{ color: 'var(--color-primary-700)' }} />
                  Appointment Operational Analytics
                </div>
                <Badge variant="warning">Operations</Badge>
              </div>

              <GaugeRing
                percentage={completionRate}
                title="Appointment Fulfillment Rate"
                subtitle={`${completionRate}% of scheduled patient appointments completed`}
              />

              <h4 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: 12, color: 'var(--color-neutral-800)' }}>
                Status Distribution (Donut Chart)
              </h4>
              <DonutChart data={appointmentStats?.statusStats || {}} totalLabel="Visits" />

              <h4 style={{ fontSize: '0.875rem', fontWeight: 700, marginTop: 24, marginBottom: 12, color: 'var(--color-neutral-800)' }}>
                Appointments per Physician (Bar Chart)
              </h4>
              <AnimatedBarChart data={appointmentStats?.doctorStats || {}} />
            </Card>
          </div>
        )}

        {/* Inventory Stock Health Card */}
        {showInventory && (
          <div className={`${styles.animatedCard} ${styles.delay4}`}>
            <Card padding="24px">
              <div className={styles.cardTitle}>
                <div className={styles.cardTitleLeft}>
                  <Package size={18} style={{ color: 'var(--color-warning-500)' }} />
                  Pharmacy Inventory Health Report
                </div>
                <Badge variant="danger">Pharmacy</Badge>
              </div>

              <div className={styles.metricsSummaryGrid}>
                <div className={styles.metricTile}>
                  <div className={styles.metricTileValue}>{inventoryStats?.totalItems || 0}</div>
                  <div className={styles.metricTileLabel}>Medicines</div>
                </div>
                <div className={styles.metricTile}>
                  <div className={styles.metricTileValue} style={{ color: 'var(--color-danger-600)' }}>
                    {inventoryStats?.lowStockCount || 0}
                  </div>
                  <div className={styles.metricTileLabel}>Low Stock</div>
                </div>
                <div className={styles.metricTile}>
                  <div className={styles.metricTileValue}>
                    Rs. {(inventoryStats?.totalStockValue || 0).toLocaleString()}
                  </div>
                  <div className={styles.metricTileLabel}>Stock Value</div>
                </div>
              </div>

              <h4 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: 12, color: 'var(--color-neutral-800)' }}>
                Low Stock Medicines Requiring Supplier Reorder
              </h4>

              <div className={styles.tableResponsive}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Medicine Name</th>
                      <th>Category</th>
                      <th>Quantity Left</th>
                      <th>Reorder Limit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(inventoryStats?.lowStockItems || []).map((item) => (
                      <tr key={item._id}>
                        <td style={{ fontWeight: 600 }}>{item.name}</td>
                        <td>{item.category}</td>
                        <td style={{ color: 'var(--color-danger-600)', fontWeight: 700 }}>
                          {item.quantityInStock ?? item.quantity ?? 0} {item.unit || 'units'}
                        </td>
                        <td>{item.reorderThreshold ?? item.reorderLevel ?? 0} {item.unit || 'units'}</td>
                      </tr>
                    ))}
                    {(inventoryStats?.lowStockItems || []).length === 0 && (
                      <tr>
                        <td colSpan={4} className={styles.emptyState}>
                          All pharmacy items are sufficiently stocked. No reorder alerts!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(ReportsPage);
