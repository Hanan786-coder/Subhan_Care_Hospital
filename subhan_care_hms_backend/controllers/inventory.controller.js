const InventoryItem = require('../models/InventoryItem');
const Supplier = require('../models/Supplier');
const { safeErrorMessage } = require('../utils/validators');
const { logAuditEvent } = require('../middleware/auditLog');

const buildId = async (model, prefix) => {
  const count = await model.countDocuments();
  return `${prefix}${String(count + 1).padStart(5, '0')}`;
};

const getInventory = async (req, res) => {
  try {
    const items = await InventoryItem.find()
      .populate('supplierId', 'supplierId name contactPerson phone email address')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, error: safeErrorMessage(error) });
  }
};

const createInventoryItem = async (req, res) => {
  try {
    const { name, category, batchNumber, expiryDate, quantityInStock, reorderThreshold, unitPrice, supplierId, location } = req.body;
    
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Item name is required' });
    }

    const qty = Math.max(0, parseInt(quantityInStock, 10) || 0);
    const threshold = Math.max(0, parseInt(reorderThreshold, 10) || 10);
    const price = Math.max(0, parseFloat(unitPrice) || 0);

    const itemId = await buildId(InventoryItem, 'SC-INV-');
    const item = await InventoryItem.create({
      itemId,
      name: name.trim(),
      category: category || 'Medicine',
      batchNumber: batchNumber || `BAT-${Date.now().toString().slice(-6)}`,
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
      quantityInStock: qty,
      reorderThreshold: threshold,
      unitPrice: price,
      supplierId: supplierId || null,
      location: location || '',
      createdBy: req.user._id
    });
    await logAuditEvent(req, 'CREATE', 'InventoryItem', item._id, { name: item.name, batchNumber: item.batchNumber });
    res.status(201).json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, error: safeErrorMessage(error) });
  }
};

const updateInventoryItem = async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (updateData.quantityInStock !== undefined) {
      updateData.quantityInStock = Math.max(0, parseInt(updateData.quantityInStock, 10) || 0);
    }
    if (updateData.unitPrice !== undefined) {
      updateData.unitPrice = Math.max(0, parseFloat(updateData.unitPrice) || 0);
    }
    if (updateData.reorderThreshold !== undefined) {
      updateData.reorderThreshold = Math.max(0, parseInt(updateData.reorderThreshold, 10) || 0);
    }

    const item = await InventoryItem.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
    if (!item) {
      return res.status(404).json({ success: false, error: 'Inventory item not found' });
    }
    await logAuditEvent(req, 'UPDATE', 'InventoryItem', item._id, { name: item.name });
    res.json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, error: safeErrorMessage(error) });
  }
};

const restockInventoryItem = async (req, res) => {
  try {
    const { quantityToAdd, batchNumber, expiryDate, supplierId, unitPrice } = req.body;
    const qty = Number(quantityToAdd);

    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({ success: false, error: 'Quantity to restock must be greater than 0' });
    }

    const item = await InventoryItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Inventory item not found' });
    }

    const previousStock = item.quantityInStock;
    item.quantityInStock += qty;
    if (batchNumber) item.batchNumber = batchNumber;
    if (expiryDate) item.expiryDate = expiryDate;
    if (supplierId) item.supplierId = supplierId;
    if (unitPrice) item.unitPrice = Number(unitPrice);

    await item.save();

    await logAuditEvent(req, 'RESTOCK', 'InventoryItem', item._id, {
      itemName: item.name,
      previousStock,
      restockedQuantity: qty,
      newStock: item.quantityInStock
    });

    const populatedItem = await InventoryItem.findById(item._id).populate('supplierId', 'supplierId name contactPerson phone email address');

    res.json({ success: true, data: populatedItem, message: `Restocked ${qty} units of ${item.name}` });
  } catch (error) {
    res.status(500).json({ success: false, error: safeErrorMessage(error) });
  }
};

const createSupplier = async (req, res) => {
  try {
    const supplierId = await buildId(Supplier, 'SC-SUP-');
    const supplier = await Supplier.create({ supplierId, ...req.body });
    await logAuditEvent(req, 'CREATE', 'Supplier', supplier._id, { name: supplier.name });
    res.status(201).json({ success: true, data: supplier });
  } catch (error) {
    res.status(500).json({ success: false, error: safeErrorMessage(error) });
  }
};

const getSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.find().sort({ createdAt: -1 });
    res.json({ success: true, data: suppliers });
  } catch (error) {
    res.status(500).json({ success: false, error: safeErrorMessage(error) });
  }
};

module.exports = {
  getInventory,
  createInventoryItem,
  updateInventoryItem,
  restockInventoryItem,
  createSupplier,
  getSuppliers
};
