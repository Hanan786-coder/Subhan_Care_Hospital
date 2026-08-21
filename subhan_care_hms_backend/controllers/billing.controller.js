const mongoose = require('mongoose');
const Invoice = require('../models/Invoice');
const { safeErrorMessage } = require('../utils/validators');
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
    res.status(500).json({ success: false, error: safeErrorMessage(error) });
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

    // Server-side authoritative price verification & calculation
    const validatedItems = [];
    let calculatedSubtotal = 0;

    for (const item of items) {
      const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
      let unitPrice = Math.max(0, parseFloat(item.unitPrice) || 0);

      // Verify item price from DB if inventory item
      if (item.inventoryItemId && mongoose.Types.ObjectId.isValid(item.inventoryItemId)) {
        const inv = await InventoryItem.findById(item.inventoryItemId);
        if (inv && typeof inv.unitPrice === 'number') {
          unitPrice = inv.unitPrice;
        }
      }

      const itemAmount = qty * unitPrice;
      calculatedSubtotal += itemAmount;

      validatedItems.push({
        ...item,
        quantity: qty,
        unitPrice,
        amount: itemAmount
      });
    }

    const discount = Math.max(0, Math.min(calculatedSubtotal, parseFloat(req.body.discount) || 0));
    const taxRate = Math.max(0, parseFloat(req.body.taxRate) || 0);
    const tax = parseFloat(req.body.tax) >= 0 ? parseFloat(req.body.tax) : (calculatedSubtotal - discount) * (taxRate / 100);
    const total = Math.max(0, calculatedSubtotal - discount + tax);
    const amountPaid = Math.max(0, Math.min(total, parseFloat(req.body.amountPaid) || 0));
    const balanceDue = Math.max(0, total - amountPaid);
    const status = balanceDue === 0 ? 'Paid' : amountPaid > 0 ? 'Partially Paid' : 'Unpaid';

    const invoice = await Invoice.create({
      invoiceId,
      patientId: req.body.patientId,
      appointmentId: req.body.appointmentId || null,
      consultationId: req.body.consultationId || null,
      prescriptionId: req.body.prescriptionId || null,
      items: validatedItems,
      paymentMethod: req.body.paymentMethod || 'Cash',
      subtotal: calculatedSubtotal,
      discount,
      tax,
      total,
      amountPaid,
      balanceDue,
      status,
      notes: req.body.notes ? String(req.body.notes).slice(0, 500) : '',
      issuedBy: req.user._id
    });

    res.status(201).json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, error: safeErrorMessage(error) });
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
    res.status(500).json({ success: false, error: safeErrorMessage(error) });
  }
};

module.exports = {
  getInvoices,
  createInvoice,
  recordPayment
};
