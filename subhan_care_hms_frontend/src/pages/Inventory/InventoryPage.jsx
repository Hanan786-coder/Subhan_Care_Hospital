import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardBody, CardHeader, Button, Badge, Input, Modal, Spinner } from '@/components/ui';
import { createInventoryItem, createSupplier, getInventory, getSuppliers } from '@/services/inventoryService';
import { useAuth } from '@/context/AuthContext';
import { ROLES } from '@/constants/roles';
import { Package, Plus, Search, Truck, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './Inventory.module.css';

const CATEGORIES = ['Medicine', 'Surgical Supply', 'Diagnostic Kit', 'Consumable', 'Equipment', 'Other'];

const InventoryPage = () => {
  const { user } = useAuth();
  const canManage = [ROLES.ADMIN, ROLES.PHARMACIST].includes(user?.role);

  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);

  const initialItemState = {
    name: '',
    category: 'Medicine',
    batchNumber: '',
    expiryDate: '',
    quantityInStock: 0,
    reorderThreshold: 10,
    unitPrice: 0,
    supplierId: ''
  };

  const initialSupplierState = {
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: ''
  };

  const [itemForm, setItemForm] = useState(initialItemState);
  const [supplierForm, setSupplierForm] = useState(initialSupplierState);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [itemData, supplierData] = await Promise.all([getInventory(), getSuppliers()]);
      setItems(itemData.data || []);
      setSuppliers(supplierData.data || []);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredItems = useMemo(() => {
    const query = search.toLowerCase().trim();
    return items.filter((item) => {
      const matchesSearch = !query || 
        item.name?.toLowerCase().includes(query) || 
        item.batchNumber?.toLowerCase().includes(query);
      const matchesCategory = !categoryFilter || item.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [items, search, categoryFilter]);

  const getExpiryStatus = (expiryDateStr) => {
    if (!expiryDateStr) return null;
    const expiry = new Date(expiryDateStr);
    const today = new Date();
    // Reset time components for accurate day diff
    today.setHours(0,0,0,0);
    expiry.setHours(0,0,0,0);

    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { label: 'Expired', variant: 'danger' };
    if (diffDays <= 30) return { label: `Expiring in ${diffDays}d`, variant: 'warning' };
    return null;
  };

  const handleItemSubmit = async (e) => {
    e.preventDefault();
    if (!itemForm.name || !itemForm.batchNumber || !itemForm.expiryDate) {
      toast.error('Name, batch number, and expiry date are required');
      return;
    }

    try {
      await createInventoryItem({
        ...itemForm,
        quantityInStock: Number(itemForm.quantityInStock),
        reorderThreshold: Number(itemForm.reorderThreshold),
        unitPrice: Number(itemForm.unitPrice)
      });
      toast.success('Inventory item added successfully');
      setIsItemModalOpen(false);
      setItemForm(initialItemState);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save item');
    }
  };

  const handleSupplierSubmit = async (e) => {
    e.preventDefault();
    if (!supplierForm.name) {
      toast.error('Supplier name is required');
      return;
    }

    try {
      await createSupplier(supplierForm);
      toast.success('Supplier profile added successfully');
      setIsSupplierModalOpen(false);
      setSupplierForm(initialSupplierState);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save supplier');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <h2>Inventory Management</h2>
          <p>Monitor stock quantities, reorder thresholds, batch expiries, and assign vendors / suppliers.</p>
        </div>
        {canManage && (
          <div className={styles.actions}>
            <Button variant="outline" icon={<Truck size={16} />} onClick={() => setIsSupplierModalOpen(true)}>
              Add Supplier
            </Button>
            <Button variant="primary" icon={<Plus size={16} />} onClick={() => setIsItemModalOpen(true)}>
              Add Item
            </Button>
          </div>
        )}
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>{items.length}</div>
            <div className={styles.statLabel}>Unique Items</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>
              {items.filter(item => item.quantityInStock <= item.reorderThreshold).length}
            </div>
            <div className={styles.statLabel}>Low Stock Items</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>
              {items.filter(item => {
                const status = getExpiryStatus(item.expiryDate);
                return status && (status.label === 'Expired' || status.label.includes('Expiring'));
              }).length}
            </div>
            <div className={styles.statLabel}>Expired / Near Expiry</div>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className={styles.controlsRow}>
            <div style={{ flex: 1, minWidth: '260px' }}>
              <Input 
                placeholder="Search by name or batch number..." 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                icon={<Search size={16} />} 
              />
            </div>
            <div>
              <select 
                className={styles.filterSelect} 
                value={categoryFilter} 
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="">All Categories</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardBody>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}><Spinner /></div>
          ) : (
            <div className={styles.tableResponsive}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Item Name</th>
                    <th>Category</th>
                    <th>Batch Number</th>
                    <th>Stock Level</th>
                    <th>Threshold</th>
                    <th>Unit Price</th>
                    <th>Expiry Date</th>
                    <th>Supplier</th>
                    <th>Status Flags</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => {
                    const isLowStock = item.quantityInStock <= item.reorderThreshold;
                    const expiryAlert = getExpiryStatus(item.expiryDate);

                    return (
                      <tr key={item._id}>
                        <td style={{ fontWeight: 600 }}>{item.name}</td>
                        <td>
                          <Badge variant="primary">{item.category}</Badge>
                        </td>
                        <td style={{ fontFamily: 'monospace' }}>{item.batchNumber}</td>
                        <td style={{ fontWeight: 600, color: isLowStock ? 'var(--color-warning-600)' : 'inherit' }}>
                          {item.quantityInStock}
                        </td>
                        <td>{item.reorderThreshold}</td>
                        <td>Rs. {item.unitPrice?.toLocaleString()}</td>
                        <td>{new Date(item.expiryDate).toLocaleDateString()}</td>
                        <td>{item.supplierId?.name || 'N/A'}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            {isLowStock && (
                              <Badge variant="warning" icon={<AlertTriangle size={10} />}>
                                Low Stock
                              </Badge>
                            )}
                            {expiryAlert && (
                              <Badge variant={expiryAlert.variant}>
                                {expiryAlert.label}
                              </Badge>
                            )}
                            {!isLowStock && !expiryAlert && (
                              <Badge variant="success">Healthy</Badge>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredItems.length === 0 && (
                    <tr>
                      <td colSpan={9} className={styles.emptyState}>No inventory items found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      <Modal isOpen={isItemModalOpen} onClose={() => setIsItemModalOpen(false)} title="Add Inventory Item">
        <form onSubmit={handleItemSubmit} className={styles.modalForm}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
            <Input 
              label="Item name" 
              value={itemForm.name} 
              onChange={(e) => setItemForm((prev) => ({ ...prev, name: e.target.value }))} 
              required 
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-neutral-700)' }}>Category</label>
              <select 
                value={itemForm.category} 
                onChange={(e) => setItemForm((prev) => ({ ...prev, category: e.target.value }))} 
                className={styles.filterSelect}
                style={{ width: '100%' }}
                required
              >
                {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Input 
              label="Batch Number" 
              value={itemForm.batchNumber} 
              onChange={(e) => setItemForm((prev) => ({ ...prev, batchNumber: e.target.value }))} 
              required 
            />
            <Input 
              label="Expiry date" 
              type="date" 
              value={itemForm.expiryDate} 
              onChange={(e) => setItemForm((prev) => ({ ...prev, expiryDate: e.target.value }))} 
              required 
            />
          </div>

          <div className={styles.itemGrid}>
            <Input 
              label="Quantity in Stock" 
              type="number" 
              value={itemForm.quantityInStock} 
              onChange={(e) => setItemForm((prev) => ({ ...prev, quantityInStock: e.target.value }))} 
              required 
            />
            <Input 
              label="Reorder Threshold" 
              type="number" 
              value={itemForm.reorderThreshold} 
              onChange={(e) => setItemForm((prev) => ({ ...prev, reorderThreshold: e.target.value }))} 
              required 
            />
            <Input 
              label="Unit Price (Rs.)" 
              type="number" 
              value={itemForm.unitPrice} 
              onChange={(e) => setItemForm((prev) => ({ ...prev, unitPrice: e.target.value }))} 
              required 
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-neutral-700)' }}>Select Supplier</label>
            <select 
              value={itemForm.supplierId} 
              onChange={(e) => setItemForm((prev) => ({ ...prev, supplierId: e.target.value }))} 
              className={styles.filterSelect}
              style={{ width: '100%' }}
            >
              <option value="">-- Choose Supplier --</option>
              {suppliers.map((supplier) => <option key={supplier._id} value={supplier._id}>{supplier.name}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
            <Button type="button" variant="ghost" onClick={() => setIsItemModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Save Inventory Item</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isSupplierModalOpen} onClose={() => setIsSupplierModalOpen(false)} title="Add Supplier Profile">
        <form onSubmit={handleSupplierSubmit} className={styles.modalForm}>
          <Input 
            label="Supplier name" 
            value={supplierForm.name} 
            onChange={(e) => setSupplierForm((prev) => ({ ...prev, name: e.target.value }))} 
            required 
          />
          <Input 
            label="Contact person" 
            value={supplierForm.contactPerson} 
            onChange={(e) => setSupplierForm((prev) => ({ ...prev, contactPerson: e.target.value }))} 
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Input 
              label="Phone number" 
              value={supplierForm.phone} 
              onChange={(e) => setSupplierForm((prev) => ({ ...prev, phone: e.target.value }))} 
            />
            <Input 
              label="Email" 
              type="email" 
              value={supplierForm.email} 
              onChange={(e) => setSupplierForm((prev) => ({ ...prev, email: e.target.value }))} 
            />
          </div>
          <Input 
            label="Address" 
            value={supplierForm.address} 
            onChange={(e) => setSupplierForm((prev) => ({ ...prev, address: e.target.value }))} 
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
            <Button type="button" variant="ghost" onClick={() => setIsSupplierModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Save Supplier</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default InventoryPage;
