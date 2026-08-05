const Invoice = require('../models/Invoice');

const buildId = async (model, prefix) => {
  const count = await model.countDocuments();
  return `${prefix}${count + 1}`;
};

const getInvoices = async (req, res) => {
  try {
    const filter = {};
    if (req.query.patientId) filter.patientId = req.query.patientId;
    if (req.query.status) filter.status = req.query.status;
    const invoices = await Invoice.find(filter)
      .populate('patientId', 'patientId fullName contactNumber cnic')
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
    const invoiceId = await buildId(Invoice, 'SC-INV-');
    const subtotal = req.body.items.reduce((sum, item) => sum + (Number(item.amount) || Number(item.quantity * item.unitPrice)), 0);
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

    const payAmount = Number(req.body.amountPaid || invoice.balanceDue || invoice.total);
    invoice.amountPaid = Math.min(invoice.total, (invoice.amountPaid || 0) + payAmount);
    invoice.balanceDue = Math.max(invoice.total - invoice.amountPaid, 0);
    invoice.paymentMethod = req.body.paymentMethod || invoice.paymentMethod || 'Cash';
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
