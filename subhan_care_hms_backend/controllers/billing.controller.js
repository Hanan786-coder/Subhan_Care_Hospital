const mongoose = require('mongoose');
const Invoice = require('../models/Invoice');
const InventoryItem = require('../models/InventoryItem');
const { logAuditEvent } = require('../middleware/auditLog');

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
    const items = req.body.items || [];

    // Check & Deduct inventory stock for medicine/consumables line items
    const inventoryUpdates = [];
    for (const item of items) {
      if (!item.description) continue;
      const isMedicineOrConsumable = ['Medicine', 'Consumables'].includes(item.type) || item.inventoryItemId;
      if (!isMedicineOrConsumable) continue;

      const requestedQty = Number(item.quantity) || 1;
      let inventoryItem = null;

      if (item.inventoryItemId && mongoose.Types.ObjectId.isValid(item.inventoryItemId)) {
        inventoryItem = await InventoryItem.findById(item.inventoryItemId);
      }
      if (!inventoryItem) {
        inventoryItem = await InventoryItem.findOne({
          name: new RegExp(`^${item.description.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')
        });
      }

      if (inventoryItem) {
        if (inventoryItem.quantityInStock < requestedQty) {
          return res.status(400).json({
            success: false,
            error: `Insufficient stock for "${inventoryItem.name}". Available stock: ${inventoryItem.quantityInStock}, requested: ${requestedQty}`
          });
        }
        inventoryUpdates.push({ inventoryItem, requestedQty, item });
      }
    }

    // Apply stock deductions and log audit events
    for (const update of inventoryUpdates) {
      const { inventoryItem, requestedQty } = update;
      const previousQty = inventoryItem.quantityInStock;
      inventoryItem.quantityInStock = Math.max(0, inventoryItem.quantityInStock - requestedQty);

      if (inventoryItem.quantityInStock === 0) {
        inventoryItem.status = 'Out of Stock';
      } else if (inventoryItem.quantityInStock <= inventoryItem.reorderThreshold) {
        inventoryItem.status = 'Low Stock';
      } else {
        inventoryItem.status = 'Available';
      }

      await inventoryItem.save();

      await logAuditEvent(req, 'INVENTORY_DEDUCTION', 'InventoryItem', inventoryItem._id, {
        medicineName: inventoryItem.name,
        deductedQuantity: requestedQty,
        previousStock: previousQty,
        remainingStock: inventoryItem.quantityInStock,
        invoiceId
      });
    }

    const subtotal = items.reduce((sum, item) => sum + (Number(item.amount) || Number(item.quantity * item.unitPrice)), 0);
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
