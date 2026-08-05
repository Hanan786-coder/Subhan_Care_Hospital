const InventoryItem = require('../models/InventoryItem');
const Supplier = require('../models/Supplier');
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
    res.status(500).json({ success: false, error: error.message });
  }
};

const createInventoryItem = async (req, res) => {
  try {
    const itemId = await buildId(InventoryItem, 'SC-INV-');
    const item = await InventoryItem.create({
      itemId,
      ...req.body,
      createdBy: req.user._id
    });
    await logAuditEvent(req, 'CREATE', 'InventoryItem', item._id, { name: item.name, batchNumber: item.batchNumber });
    res.status(201).json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateInventoryItem = async (req, res) => {
  try {
    const item = await InventoryItem.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!item) {
      return res.status(404).json({ success: false, error: 'Inventory item not found' });
    }
    await logAuditEvent(req, 'UPDATE', 'InventoryItem', item._id, { name: item.name });
    res.json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
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
    res.status(500).json({ success: false, error: error.message });
  }
};

const createSupplier = async (req, res) => {
  try {
    const supplierId = await buildId(Supplier, 'SC-SUP-');
    const supplier = await Supplier.create({ supplierId, ...req.body });
    await logAuditEvent(req, 'CREATE', 'Supplier', supplier._id, { name: supplier.name });
    res.status(201).json({ success: true, data: supplier });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.find().sort({ createdAt: -1 });
    res.json({ success: true, data: suppliers });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
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
