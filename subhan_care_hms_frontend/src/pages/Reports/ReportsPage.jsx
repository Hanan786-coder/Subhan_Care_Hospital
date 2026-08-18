import React, { useEffect, useState, useMemo, memo } from 'react';
import { Card, Skeleton, Button, Badge, CountUp } from '@/components/ui';
import {
  InteractivePieChart,
  InteractiveHistogramChart,
  RadialGauge
} from '@/components/Charts';
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
          <title>Subhan Care HMS — Executive Analytics Report</title>
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
              <p>Executive Operational, Clinical & Financial Analytics Report</p>
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

          <div class="section-title">Revenue & Financial Summary</div>
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

          <div class="section-title">Payment Method Breakdown</div>
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

          <div class="section-title">Pharmacy Low Stock Alerts</div>
          <table>
            <thead>
              <tr><th>Item Name</th><th>Category</th><th>Current Stock</th><th>Reorder Threshold</th></tr>
            </thead>
            <tbody>
              ${(inventoryStats?.lowStockItems || []).map(item => `
                <tr>
                  <td><strong>${item.name}</strong></td>
                  <td>${item.category}</td>
                  <td style="color: #dc2626;"><strong>${item.quantityInStock ?? item.quantity ?? 0} ${item.unit || 'units'}</strong></td>
                  <td>${item.reorderThreshold ?? item.reorderLevel ?? 0} ${item.unit || 'units'}</td>
                </tr>
              `).join('') || '<tr><td colSpan="4">All items sufficiently stocked!</td></tr>'}
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
    toast.success('Report print view opened. Choose "Save as PDF" in your browser print window.');
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
          <h2>Hospital Analytics & Reports</h2>
          <p>Interactive data visualizer, smooth animated multi-mode charts, and hospital performance KPIs.</p>
        </div>
        <div className={styles.headerActions}>
          <div className={styles.rangeSelectWrapper}>
            <Filter size={15} style={{ color: 'var(--color-neutral-500)' }} />
            <select
              className={styles.rangeSelect}
              value={range}
              onChange={(e) => setRange(e.target.value)}
              aria-label="Filter range"
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
            Export / PDF
          </Button>
          <Button variant="primary" icon={<Printer size={14} />} onClick={handlePrintReport}>
            Print Report
          </Button>
        </div>
      </div>

      {/* Category Tab Bar */}
      <div className={styles.tabsBar}>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeCategory === 'all' ? styles.tabActive : ''}`}
          onClick={() => setActiveCategory('all')}
        >
          <LayoutGrid size={15} /> All Reports
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeCategory === 'revenue' ? styles.tabActive : ''}`}
          onClick={() => setActiveCategory('revenue')}
        >
          <DollarSign size={15} /> Financials & Revenue
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeCategory === 'patients' ? styles.tabActive : ''}`}
          onClick={() => setActiveCategory('patients')}
        >
          <Users size={15} /> Patients & Demographics
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeCategory === 'appointments' ? styles.tabActive : ''}`}
          onClick={() => setActiveCategory('appointments')}
        >
          <Calendar size={15} /> Appointments & Clinical Flow
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeCategory === 'inventory' ? styles.tabActive : ''}`}
          onClick={() => setActiveCategory('inventory')}
        >
          <Package size={15} /> Pharmacy & Stock Health
        </button>
      </div>

      {/* Modern KPI Summary Stat Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statTop}>
            <span className={styles.statLabel}>Total Patients</span>
            <div className={`${styles.statIcon} ${styles.iconCyan}`}>
              <Users size={20} />
            </div>
          </div>
          <div className={styles.statValue}>
            <CountUp value={summary?.totalPatients || 0} />
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-neutral-500)' }}>
            +<CountUp value={summary?.newPatients || 0} /> registered in range
          </span>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statTop}>
            <span className={styles.statLabel}>Appointments</span>
            <div className={`${styles.statIcon} ${styles.iconGreen}`}>
              <Calendar size={20} />
            </div>
          </div>
          <div className={styles.statValue}>
            <CountUp value={summary?.totalAppointments || 0} />
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-success-600)', fontWeight: 600 }}>
            <CountUp value={summary?.completedAppointments || 0} /> Completed
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
            <CountUp value={summary?.totalRevenue || 0} prefix="Rs. " />
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-neutral-500)' }}>
            <CountUp value={summary?.totalBilled || 0} prefix="Rs. " /> Billed
          </span>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statTop}>
            <span className={styles.statLabel}>Outstanding Due</span>
            <div className={`${styles.statIcon} ${styles.iconOrange}`}>
              <TrendingUp size={20} />
            </div>
          </div>
          <div className={styles.statValue} style={{ color: (summary?.outstandingBalance || 0) > 0 ? 'var(--color-warning-600)' : 'inherit' }}>
            <CountUp value={summary?.outstandingBalance || 0} prefix="Rs. " />
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-neutral-500)' }}>
            <CountUp value={summary?.totalInvoices || 0} /> Total Invoices Issued
          </span>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statTop}>
            <span className={styles.statLabel}>Stock Alerts</span>
            <div className={`${styles.statIcon} ${styles.iconRed}`}>
              <AlertTriangle size={20} />
            </div>
          </div>
          <div className={styles.statValue} style={{ color: (inventoryStats?.lowStockCount ?? summary?.lowStockAlerts ?? 0) > 0 ? 'var(--color-danger-600)' : 'inherit' }}>
            <CountUp value={inventoryStats?.lowStockCount ?? summary?.lowStockAlerts ?? 0} />
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-neutral-500)' }}>
            Medicines below threshold
          </span>
        </div>
      </div>

      {/* Grid: Revenue & Patients */}
      <div className={styles.grid2Col}>
        {/* Revenue Analytics Card */}
        {showRevenue && (
          <Card padding="24px">
            <div className={styles.cardTitle}>
              <div className={styles.cardTitleLeft}>
                <DollarSign size={18} style={{ color: 'var(--color-success-600)' }} />
                Revenue & Financial Collections
              </div>
              <Badge variant="success">Financials</Badge>
            </div>

            <RadialGauge
              percentage={collectionRate}
              title="Revenue Collection Rate"
              subtitle={`${collectionRate}% of total billed invoices have been successfully collected`}
            />

            <div className={styles.metricsSummaryGrid}>
              <div className={styles.metricTile}>
                <div className={styles.metricTileValue}>
                  <CountUp value={revenue?.totalCollected || 0} prefix="Rs. " />
                </div>
                <div className={styles.metricTileLabel}>Collected</div>
              </div>
              <div className={styles.metricTile}>
                <div className={styles.metricTileValue} style={{ color: 'var(--color-danger-600)' }}>
                  <CountUp value={revenue?.totalOutstanding || 0} prefix="Rs. " />
                </div>
                <div className={styles.metricTileLabel}>Balance Due</div>
              </div>
              <div className={styles.metricTile}>
                <div className={styles.metricTileValue}>
                  <CountUp value={revenue?.totalInvoices || 0} />
                </div>
                <div className={styles.metricTileLabel}>Invoices</div>
              </div>
            </div>

            <div className={styles.chartSectionHeading}>
              <span>Payment Method Distribution</span>
            </div>
            <InteractivePieChart
              data={revenue?.paymentMethods || {}}
              totalLabel="Collections"
              prefix="Rs. "
              defaultMode="donut"
            />

            <div className={styles.chartSectionHeading}>
              <span>Revenue by Service Category</span>
            </div>
            <InteractiveHistogramChart
              data={revenue?.itemTypeRevenue || {}}
              prefix="Rs. "
              defaultMode="columns"
            />

            {revenue?.invoiceStatuses && (
              <>
                <div className={styles.chartSectionHeading}>
                  <span>Invoice Settlement Status</span>
                </div>
                <InteractivePieChart
                  data={revenue?.invoiceStatuses || {}}
                  totalLabel="Invoices"
                  defaultMode="donut"
                />
              </>
            )}
          </Card>
        )}

        {/* Patient Demographics Card */}
        {showPatients && (
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
                <div className={styles.metricTileValue}>
                  <CountUp value={patientStats?.totalPatients || 0} />
                </div>
                <div className={styles.metricTileLabel}>Total Patients</div>
              </div>
              <div className={styles.metricTile}>
                <div className={styles.metricTileValue}>
                  <CountUp value={patientStats?.registeredToday || 0} />
                </div>
                <div className={styles.metricTileLabel}>Registered Today</div>
              </div>
            </div>

            <div className={styles.chartSectionHeading}>
              <span>Gender Distribution</span>
            </div>
            <InteractivePieChart
              data={patientStats?.genderStats || {}}
              totalLabel="Patients"
              defaultMode="donut"
            />

            <div className={styles.chartSectionHeading}>
              <span>Age Group Brackets (Distribution)</span>
            </div>
            <InteractiveHistogramChart
              data={patientStats?.ageGroupStats || {}}
              defaultMode="columns"
            />

            <div className={styles.chartSectionHeading}>
              <span>Blood Group Demographics</span>
            </div>
            <InteractiveHistogramChart
              data={patientStats?.bloodGroupStats || {}}
              defaultMode="columns"
            />
          </Card>
        )}
      </div>

      {/* Grid: Appointments & Pharmacy Inventory */}
      <div className={styles.grid2Col}>
        {/* Appointment Operational Analytics Card */}
        {showAppointments && (
          <Card padding="24px">
            <div className={styles.cardTitle}>
              <div className={styles.cardTitleLeft}>
                <Calendar size={18} style={{ color: 'var(--color-primary-700)' }} />
                Appointment Operational Analytics
              </div>
              <Badge variant="warning">Operations</Badge>
            </div>

            <RadialGauge
              percentage={completionRate}
              title="Appointment Fulfillment Rate"
              subtitle={`${completionRate}% of scheduled patient appointments successfully completed`}
            />

            <div className={styles.chartSectionHeading}>
              <span>Visit Status Breakdown</span>
            </div>
            <InteractivePieChart
              data={appointmentStats?.statusStats || {}}
              totalLabel="Visits"
              defaultMode="donut"
            />

            <div className={styles.chartSectionHeading}>
              <span>Appointments per Physician</span>
            </div>
            <InteractiveHistogramChart
              data={appointmentStats?.doctorStats || {}}
              defaultMode="columns"
            />

            {appointmentStats?.typeStats && (
              <>
                <div className={styles.chartSectionHeading}>
                  <span>Appointment Types</span>
                </div>
                <InteractiveHistogramChart
                  data={appointmentStats?.typeStats || {}}
                  defaultMode="bars"
                />
              </>
            )}
          </Card>
        )}

        {/* Inventory Stock Health Card */}
        {showInventory && (
          <Card padding="24px">
            <div className={styles.cardTitle}>
              <div className={styles.cardTitleLeft}>
                <Package size={18} style={{ color: 'var(--color-warning-500)' }} />
                Pharmacy Inventory Health & Stock
              </div>
              <Badge variant="danger">Pharmacy</Badge>
            </div>

            <div className={styles.metricsSummaryGrid}>
              <div className={styles.metricTile}>
                <div className={styles.metricTileValue}>
                  <CountUp value={inventoryStats?.totalItems || 0} />
                </div>
                <div className={styles.metricTileLabel}>Total Items</div>
              </div>
              <div className={styles.metricTile}>
                <div className={styles.metricTileValue} style={{ color: 'var(--color-danger-600)' }}>
                  <CountUp value={inventoryStats?.lowStockCount || 0} />
                </div>
                <div className={styles.metricTileLabel}>Low Stock</div>
              </div>
              <div className={styles.metricTile}>
                <div className={styles.metricTileValue}>
                  <CountUp value={inventoryStats?.totalStockValue || 0} prefix="Rs. " />
                </div>
                <div className={styles.metricTileLabel}>Stock Value</div>
              </div>
            </div>

            {inventoryStats?.categoryStats && (
              <>
                <div className={styles.chartSectionHeading}>
                  <span>Medicine Category Breakdown</span>
                </div>
                <InteractivePieChart
                  data={inventoryStats?.categoryStats || {}}
                  totalLabel="Categories"
                  defaultMode="donut"
                />
              </>
            )}

            <div className={styles.chartSectionHeading}>
              <span>Low Stock Alerts Requiring Supplier Reorder</span>
            </div>

            <div className={styles.tableResponsive}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Medicine Name</th>
                    <th>Category</th>
                    <th>Stock Left</th>
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
        )}
      </div>
    </div>
  );
};

export default memo(ReportsPage);
