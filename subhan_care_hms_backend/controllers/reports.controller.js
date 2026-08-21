/**
 * Reports & Analytics Controller
 * Aggregates hospital-wide operational metrics for reporting dashboards.
 */
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const { safeErrorMessage } = require('../utils/validators');
const Invoice = require('../models/Invoice');
const Prescription = require('../models/Prescription');
const InventoryItem = require('../models/InventoryItem');
const Doctor = require('../models/Doctor');
const Staff = require('../models/Staff');

/**
 * Get overall hospital summary metrics
 * GET /api/reports/summary
 */
const getSummaryReport = async (req, res) => {
  try {
    const { range } = req.query; // 'today', 'week', 'month', 'year', 'all'
    const dateFilter = getDateRangeFilter(range);

    const [
      totalPatients,
      newPatients,
      totalAppointments,
      completedAppointments,
      cancelledAppointments,
      invoices,
      totalPrescriptions,
      inventoryItems,
      totalDoctors,
      totalStaff
    ] = await Promise.all([
      Patient.countDocuments(),
      Patient.countDocuments(dateFilter.createdAt ? { createdAt: dateFilter.createdAt } : {}),
      Appointment.countDocuments(dateFilter.date ? { date: dateFilter.date } : {}),
      Appointment.countDocuments({ status: 'Completed', ...(dateFilter.date ? { date: dateFilter.date } : {}) }),
      Appointment.countDocuments({ status: 'Cancelled', ...(dateFilter.date ? { date: dateFilter.date } : {}) }),
      Invoice.find(dateFilter.createdAt ? { createdAt: dateFilter.createdAt } : {}),
      Prescription.countDocuments(dateFilter.issuedAt ? { issuedAt: dateFilter.issuedAt } : {}),
      InventoryItem.find(),
      Doctor.countDocuments({ status: 'Active' }),
      Staff.countDocuments({ status: 'Active' })
    ]);

    let lowStockAlerts = 0;
    inventoryItems.forEach((item) => {
      const qty = item.quantityInStock ?? item.quantity ?? 0;
      const threshold = item.reorderThreshold ?? item.reorderLevel ?? 0;
      if (qty <= threshold || item.status === 'Low Stock' || item.status === 'Out of Stock') {
        lowStockAlerts++;
      }
    });

    const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.amountPaid || 0), 0);
    const totalBilled = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
    const outstandingBalance = invoices.reduce((sum, inv) => sum + (inv.balanceDue || 0), 0);

    res.status(200).json({
      success: true,
      data: {
        totalPatients,
        newPatients,
        totalAppointments,
        completedAppointments,
        cancelledAppointments,
        totalRevenue,
        totalBilled,
        outstandingBalance,
        totalInvoices: invoices.length,
        totalPrescriptions,
        lowStockAlerts,
        activeDoctors: totalDoctors,
        activeStaff: totalStaff
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: safeErrorMessage(error) });
  }
};

/**
 * Get revenue breakdown and payment analytics
 * GET /api/reports/revenue
 */
const getRevenueReport = async (req, res) => {
  try {
    const { range } = req.query;
    const dateFilter = getDateRangeFilter(range);

    const invoices = await Invoice.find(dateFilter.createdAt ? { createdAt: dateFilter.createdAt } : {})
      .populate('patientId', 'fullName cnic');

    let totalBilled = 0;
    let totalCollected = 0;
    let totalOutstanding = 0;

    const paymentMethods = { Cash: 0, Card: 0, 'Bank Transfer': 0, Online: 0, Other: 0 };
    const invoiceStatuses = { Paid: 0, 'Partially Paid': 0, Unpaid: 0 };
    const itemTypeRevenue = {};

    invoices.forEach((inv) => {
      totalBilled += inv.total || 0;
      totalCollected += inv.amountPaid || 0;
      totalOutstanding += inv.balanceDue || 0;

      const method = inv.paymentMethod || 'Cash';
      paymentMethods[method] = (paymentMethods[method] || 0) + (inv.amountPaid || 0);

      const status = inv.status || 'Unpaid';
      invoiceStatuses[status] = (invoiceStatuses[status] || 0) + 1;

      if (Array.isArray(inv.items)) {
        inv.items.forEach((item) => {
          const type = item.type || 'Other';
          itemTypeRevenue[type] = (itemTypeRevenue[type] || 0) + (item.amount || (item.quantity * item.unitPrice) || 0);
        });
      }
    });

    res.status(200).json({
      success: true,
      data: {
        totalBilled,
        totalCollected,
        totalOutstanding,
        totalInvoices: invoices.length,
        paymentMethods,
        invoiceStatuses,
        itemTypeRevenue,
        recentInvoices: invoices.slice(-10).reverse()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: safeErrorMessage(error) });
  }
};

/**
 * Get patient demographics & registration analytics
 * GET /api/reports/patients
 */
const getPatientReport = async (req, res) => {
  try {
    const patients = await Patient.find();

    const genderStats = { Male: 0, Female: 0, Other: 0 };
    const bloodGroupStats = {};
    const ageGroupStats = { '0-18': 0, '19-35': 0, '36-50': 0, '51-65': 0, '65+': 0 };

    const todayStr = new Date().toISOString().split('T')[0];
    let registeredToday = 0;

    patients.forEach((p) => {
      // Gender
      const gender = p.gender || 'Other';
      genderStats[gender] = (genderStats[gender] || 0) + 1;

      // Blood group
      if (p.bloodGroup) {
        bloodGroupStats[p.bloodGroup] = (bloodGroupStats[p.bloodGroup] || 0) + 1;
      }

      // Age calculation
      if (p.dateOfBirth) {
        const age = Math.floor((new Date() - new Date(p.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000));
        if (age <= 18) ageGroupStats['0-18']++;
        else if (age <= 35) ageGroupStats['19-35']++;
        else if (age <= 50) ageGroupStats['36-50']++;
        else if (age <= 65) ageGroupStats['51-65']++;
        else ageGroupStats['65+']++;
      }

      if (p.createdAt && new Date(p.createdAt).toISOString().split('T')[0] === todayStr) {
        registeredToday++;
      }
    });

    res.status(200).json({
      success: true,
      data: {
        totalPatients: patients.length,
        registeredToday,
        genderStats,
        bloodGroupStats,
        ageGroupStats
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: safeErrorMessage(error) });
  }
};

/**
 * Get appointment distribution analytics
 * GET /api/reports/appointments
 */
const getAppointmentReport = async (req, res) => {
  try {
    const { range } = req.query;
    const dateFilter = getDateRangeFilter(range);

    const appointments = await Appointment.find(dateFilter.date ? { date: dateFilter.date } : {})
      .populate('doctorId', 'fullName specialization department')
      .populate('patientId', 'fullName');

    const statusStats = { Scheduled: 0, Completed: 0, Cancelled: 0, Rescheduled: 0 };
    const doctorStats = {};
    const typeStats = { Consultation: 0, FollowUp: 0, Emergency: 0, RoutineCheckup: 0 };

    appointments.forEach((app) => {
      const status = app.status || 'Scheduled';
      statusStats[status] = (statusStats[status] || 0) + 1;

      const docName = app.doctorId?.fullName || 'Unassigned';
      doctorStats[docName] = (doctorStats[docName] || 0) + 1;

      const appType = app.type || 'Consultation';
      typeStats[appType] = (typeStats[appType] || 0) + 1;
    });

    res.status(200).json({
      success: true,
      data: {
        totalAppointments: appointments.length,
        statusStats,
        doctorStats,
        typeStats
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: safeErrorMessage(error) });
  }
};

/**
 * Get inventory status analytics
 * GET /api/reports/inventory
 */
const getInventoryReport = async (req, res) => {
  try {
    const items = await InventoryItem.find();

    const categoryStats = {};
    const lowStockItems = [];
    const expiringSoonItems = [];
    const now = new Date();
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    let totalStockValue = 0;

    items.forEach((item) => {
      const cat = item.category || 'General';
      categoryStats[cat] = (categoryStats[cat] || 0) + 1;

      const qty = item.quantityInStock ?? item.quantity ?? 0;
      const threshold = item.reorderThreshold ?? item.reorderLevel ?? 0;

      totalStockValue += qty * (item.unitPrice || 0);

      if (qty <= threshold || item.status === 'Low Stock' || item.status === 'Out of Stock') {
        lowStockItems.push(item);
      }

      if (item.expiryDate && new Date(item.expiryDate) <= thirtyDaysFromNow && new Date(item.expiryDate) >= now) {
        expiringSoonItems.push(item);
      }
    });

    res.status(200).json({
      success: true,
      data: {
        totalItems: items.length,
        totalStockValue,
        lowStockCount: lowStockItems.length,
        expiringSoonCount: expiringSoonItems.length,
        categoryStats,
        lowStockItems,
        expiringSoonItems
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: safeErrorMessage(error) });
  }
};

/**
 * Helper to build Date range filters
 */
function getDateRangeFilter(range) {
  const filter = {};
  const now = new Date();

  if (range === 'today') {
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);
    filter.createdAt = { $gte: startOfDay, $lte: endOfDay };
    filter.date = { $gte: startOfDay, $lte: endOfDay };
    filter.issuedAt = { $gte: startOfDay, $lte: endOfDay };
  } else if (range === 'week') {
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);
    startOfWeek.setHours(0, 0, 0, 0);
    filter.createdAt = { $gte: startOfWeek };
    filter.date = { $gte: startOfWeek };
    filter.issuedAt = { $gte: startOfWeek };
  } else if (range === 'month') {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    filter.createdAt = { $gte: startOfMonth };
    filter.date = { $gte: startOfMonth };
    filter.issuedAt = { $gte: startOfMonth };
  } else if (range === 'year') {
    const startOfYear = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
    filter.createdAt = { $gte: startOfYear };
    filter.date = { $gte: startOfYear };
    filter.issuedAt = { $gte: startOfYear };
  }

  return filter;
}

module.exports = {
  getSummaryReport,
  getRevenueReport,
  getPatientReport,
  getAppointmentReport,
  getInventoryReport
};
