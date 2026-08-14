import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardBody, Skeleton, Button, Badge } from '@/components/ui';
import {
  getSummaryReport,
  getRevenueReport,
  getPatientReport,
  getAppointmentReport,
  getInventoryReport
} from '@/services/reportService';
import {
  TrendingUp, Users, Calendar, DollarSign, Package,
  Printer, Download, Filter, FileText, AlertTriangle, CheckCircle2,
  PieChart, RefreshCw, BarChart2, ShieldAlert
} from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './Reports.module.css';

const BAR_COLORS = [
  'var(--color-primary-600)',
  'var(--color-secondary-500)',
  'var(--color-warning-500)',
  'var(--color-danger-500)',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#10b981'
];

const ReportsPage = () => {
  const [range, setRange] = useState('all');
  const [loading, setLoading] = useState(true);

  // Report States
  const [summary, setSummary] = useState(null);
  const [revenue, setRevenue] = useState(null);
  const [patientStats, setPatientStats] = useState(null);
  const [appointmentStats, setAppointmentStats] = useState(null);
  const [inventoryStats, setInventoryStats] = useState(null);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const [sumRes, revRes, patRes, appRes, invRes] = await Promise.all([
        getSummaryReport(range),
        getRevenueReport(range),
        getPatientReport(),
        getAppointmentReport(range),
        getInventoryReport()
      ]);

      setSummary(sumRes.data || {});
      setRevenue(revRes.data || {});
      setPatientStats(patRes.data || {});
      setAppointmentStats(appRes.data || {});
      setInventoryStats(invRes.data || {});
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [range]);

  // CSS Bar Component Helper
  const RenderBarChart = ({ data = {}, totalValue = 0, prefix = '' }) => {
    const entries = Object.entries(data);
    const maxVal = Math.max(...entries.map(([, val]) => Number(val) || 0), 1);

    if (entries.length === 0) {
      return <div className={styles.emptyState}>No data available</div>;
    }

    return (
      <div className={styles.chartContainer}>
        {entries.map(([label, val], idx) => {
          const numVal = Number(val) || 0;
          const percentage = Math.round((numVal / maxVal) * 100);
          const color = BAR_COLORS[idx % BAR_COLORS.length];

          return (
            <div key={label} className={styles.chartRow}>
              <div className={styles.chartLabel} title={label}>{label}</div>
              <div className={styles.chartBarTrack}>
                <div
                  className={styles.chartBarFill}
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: color
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
  };

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
          <title>Subhan Care HMS — Operational & Financial Report</title>
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
                  <td style="color: #dc2626;"><strong>${item.quantity} ${item.unit}</strong></td>
                  <td>${item.reorderLevel} ${item.unit}</td>
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

  // Save Image / PDF simulation
  const handleSavePicture = () => {
    handlePrintReport();
    toast.success('Report print preview opened. Select "Save as PDF" or print as image from your browser dialog.');
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

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <h2>Hospital Reports & Executive Analytics</h2>
          <p>Real-time operational metrics, financial collections, patient demographics, and stock alerts.</p>
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
          <Button variant="outline" icon={<RefreshCw size={14} />} onClick={fetchReports}>
            Refresh
          </Button>
          <Button variant="outline" icon={<Download size={14} />} onClick={handleSavePicture}>
            Save Image / PDF
          </Button>
          <Button variant="primary" icon={<Printer size={14} />} onClick={handlePrintReport}>
            Print Report
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards Row */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statTop}>
            <span className={styles.statLabel}>Total Patients</span>
            <div className={`${styles.statIcon} ${styles.iconCyan}`}>
              <Users size={20} />
            </div>
          </div>
          <div className={styles.statValue}>{summary?.totalPatients || 0}</div>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-neutral-500)' }}>
            +{summary?.newPatients || 0} added in range
          </span>
        </div>

        <div className={styles.statCard}>
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

        <div className={styles.statCard}>
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

        <div className={styles.statCard}>
          <div className={styles.statTop}>
            <span className={styles.statLabel}>Outstanding Due</span>
            <div className={`${styles.statIcon} ${styles.iconOrange}`}>
              <TrendingUp size={20} />
            </div>
          </div>
          <div className={styles.statValue} style={{ color: summary?.outstandingBalance > 0 ? 'var(--color-warning-600)' : 'inherit' }}>
            Rs. {(summary?.outstandingBalance || 0).toLocaleString()}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-neutral-500)' }}>
            {summary?.totalInvoices || 0} Total Invoices
          </span>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statTop}>
            <span className={styles.statLabel}>Stock Alerts</span>
            <div className={`${styles.statIcon} ${styles.iconRed}`}>
              <AlertTriangle size={20} />
            </div>
          </div>
          <div className={styles.statValue} style={{ color: summary?.lowStockAlerts > 0 ? 'var(--color-danger-600)' : 'inherit' }}>
            {summary?.lowStockAlerts || 0}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-neutral-500)' }}>
            Low Inventory Items
          </span>
        </div>
      </div>

      {/* Main Grid: Revenue & Patients */}
      <div className={styles.grid2Col}>
        {/* Revenue Report Card */}
        <Card padding="20px">
          <div className={styles.cardTitle}>
            <DollarSign size={18} style={{ color: 'var(--color-success-600)' }} />
            Revenue & Payment Analytics
          </div>

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

          <h4 style={{ fontSize: '0.85rem', marginBottom: 12, color: 'var(--color-neutral-700)' }}>
            Collections by Payment Method (Rs.)
          </h4>
          <RenderBarChart data={revenue?.paymentMethods || {}} prefix="Rs." />

          <h4 style={{ fontSize: '0.85rem', marginTop: 24, marginBottom: 12, color: 'var(--color-neutral-700)' }}>
            Revenue by Service / Item Type (Rs.)
          </h4>
          <RenderBarChart data={revenue?.itemTypeRevenue || {}} prefix="Rs." />
        </Card>

        {/* Patient Demographics Card */}
        <Card padding="20px">
          <div className={styles.cardTitle}>
            <Users size={18} style={{ color: 'var(--color-primary-600)' }} />
            Patient Demographics & Distribution
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

          <h4 style={{ fontSize: '0.85rem', marginBottom: 12, color: 'var(--color-neutral-700)' }}>
            Gender Breakdown
          </h4>
          <RenderBarChart data={patientStats?.genderStats || {}} />

          <h4 style={{ fontSize: '0.85rem', marginTop: 24, marginBottom: 12, color: 'var(--color-neutral-700)' }}>
            Age Group Distribution
          </h4>
          <RenderBarChart data={patientStats?.ageGroupStats || {}} />

          <h4 style={{ fontSize: '0.85rem', marginTop: 24, marginBottom: 12, color: 'var(--color-neutral-700)' }}>
            Blood Group Distribution
          </h4>
          <RenderBarChart data={patientStats?.bloodGroupStats || {}} />
        </Card>
      </div>

      {/* Grid: Appointments & Inventory */}
      <div className={styles.grid2Col}>
        {/* Appointment Analytics Card */}
        <Card padding="20px">
          <div className={styles.cardTitle}>
            <Calendar size={18} style={{ color: 'var(--color-primary-700)' }} />
            Appointment Analytics
          </div>

          <h4 style={{ fontSize: '0.85rem', marginBottom: 12, color: 'var(--color-neutral-700)' }}>
            Status Breakdown
          </h4>
          <RenderBarChart data={appointmentStats?.statusStats || {}} />

          <h4 style={{ fontSize: '0.85rem', marginTop: 24, marginBottom: 12, color: 'var(--color-neutral-700)' }}>
            Appointments by Doctor
          </h4>
          <RenderBarChart data={appointmentStats?.doctorStats || {}} />
        </Card>

        {/* Inventory Health & Low Stock Card */}
        <Card padding="20px">
          <div className={styles.cardTitle}>
            <Package size={18} style={{ color: 'var(--color-warning-600)' }} />
            Pharmacy Inventory Health Report
          </div>

          <div className={styles.metricsSummaryGrid}>
            <div className={styles.metricTile}>
              <div className={styles.metricTileValue}>{inventoryStats?.totalItems || 0}</div>
              <div className={styles.metricTileLabel}>Total Medicines</div>
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

          <h4 style={{ fontSize: '0.85rem', marginBottom: 12, color: 'var(--color-neutral-700)' }}>
            Low Stock Medicines Requiring Reorder
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
                      {item.quantity} {item.unit}
                    </td>
                    <td>{item.reorderLevel} {item.unit}</td>
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
    </div>
  );
};

export default ReportsPage;
