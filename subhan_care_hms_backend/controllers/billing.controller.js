const Invoice = require('../models/Invoice');

const buildId = async (model, prefix) => {
  const count = await model.countDocuments();
  return `${prefix}${String(count + 1).padStart(5, '0')}`;
};

const getInvoices = async (req, res) => {
  try {
    const filter = {};
    if (req.query.patientId) filter.patientId = req.query.patientId;
    if (req.query.status) filter.status = req.query.status;
    const invoices = await Invoice.find(filter)
      .populate('patientId', 'patientId fullName')
      .populate('appointmentId', 'appointmentId date timeSlot status')
      .populate('consultationId', 'consultationId diagnosis')
      .populate('prescriptionId', 'prescriptionId status')
      .sort({ issuedAt: -1 });
    res.json({ success: true, data: invoices });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const createInvoice = async (req, res) => {
  try {
    const invoiceId = await buildId(Invoice, 'SC-INVOC-');
    const subtotal = req.body.items.reduce((sum, item) => sum + item.amount, 0);
    const discount = Number(req.body.discount || 0);
    const tax = Number(req.body.tax || 0);
    const total = subtotal - discount + tax;
    const amountPaid = Number(req.body.amountPaid || 0);
    const balanceDue = Math.max(total - amountPaid, 0);
    const status = balanceDue === 0 ? 'Paid' : amountPaid > 0 ? 'Partially Paid' : 'Unpaid';

    const invoice = await Invoice.create({
      invoiceId,
      ...req.body,
      subtotal,
      discount,
      tax,
      total,
      amountPaid,
      balanceDue,
      status,
      issuedBy: req.user._id
    });

    res.status(201).json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const recordPayment = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    invoice.amountPaid = Math.min(invoice.total, Number(req.body.amountPaid ?? invoice.total));
    invoice.balanceDue = Math.max(invoice.total - invoice.amountPaid, 0);
    invoice.paymentMethod = req.body.paymentMethod || invoice.paymentMethod;
    invoice.status = invoice.balanceDue === 0 ? 'Paid' : 'Partially Paid';
    if (invoice.status === 'Paid') {
      invoice.paidAt = new Date();
    }
    await invoice.save();

    res.json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getInvoices,
  createInvoice,
  recordPayment
};
