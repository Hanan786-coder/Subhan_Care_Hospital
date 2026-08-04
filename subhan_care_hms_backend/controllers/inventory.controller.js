const InventoryItem = require('../models/InventoryItem');
const Supplier = require('../models/Supplier');

const buildId = async (model, prefix) => {
  const count = await model.countDocuments();
  return `${prefix}${String(count + 1).padStart(5, '0')}`;
};

const getInventory = async (req, res) => {
  try {
    const items = await InventoryItem.find()
      .populate('supplierId', 'supplierId name phone email')
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
    res.json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const createSupplier = async (req, res) => {
  try {
    const supplierId = await buildId(Supplier, 'SC-SUP-');
    const supplier = await Supplier.create({ supplierId, ...req.body });
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
  createSupplier,
  getSuppliers
};
