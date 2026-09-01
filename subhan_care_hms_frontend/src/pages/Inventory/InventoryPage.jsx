import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardBody, CardHeader, Button, Badge, Input, Modal, Spinner, SearchSelect, CountUp, Skeleton } from '@/components/ui';
import useDebounce from '@/hooks/useDebounce';
import { createInventoryItem, createSupplier, getInventory, getSuppliers, restockInventoryItem } from '@/services/inventoryService';
import { useAuth } from '@/context/AuthContext';
import { ROLES } from '@/constants/roles';
import { Package, Plus, Search, Truck, AlertTriangle, RefreshCw, Eye, Layers, ShieldAlert, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './Inventory.module.css';

const CATEGORIES = ['Medicine', 'Surgical Supply', 'Diagnostic Kit', 'Consumable', 'Equipment', 'Other'];

const InventoryPage = () => {
  const { user } = useAuth();
  const canManage = user?.role === ROLES.PHARMACIST;

  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' | 'suppliers'
  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);
  const [categoryFilter, setCategoryFilter] = useState('');

  // Modals
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [isSupplierDetailModalOpen, setIsSupplierDetailModalOpen] = useState(false);

  const [selectedRestockItem, setSelectedRestockItem] = useState(null);
  const [selectedSupplierView, setSelectedSupplierView] = useState(null);

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

  const initialRestockState = {
    quantityToAdd: 50,
    batchNumber: '',
    expiryDate: '',
    unitPrice: ''
  };

  const [itemForm, setItemForm] = useState(initialItemState);
  const [supplierForm, setSupplierForm] = useState(initialSupplierState);
  const [restockForm, setRestockForm] = useState(initialRestockState);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    const query = debouncedSearch.toLowerCase().trim();
    return items.filter((item) => {
      const matchesSearch =
        !query ||
        item.name?.toLowerCase().includes(query) ||
        item.batchNumber?.toLowerCase().includes(query) ||
        item.supplierId?.name?.toLowerCase().includes(query);
      const matchesCategory = !categoryFilter || item.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [items, debouncedSearch, categoryFilter]);

  const filteredSuppliers = useMemo(() => {
    const query = debouncedSearch.toLowerCase().trim();
    return suppliers.filter(
      (sup) =>
        !query ||
        sup.name?.toLowerCase().includes(query) ||
        sup.contactPerson?.toLowerCase().includes(query) ||
        sup.phone?.toLowerCase().includes(query) ||
        sup.email?.toLowerCase().includes(query)
    );
  }, [suppliers, debouncedSearch]);

  const getExpiryStatus = (expiryDateStr) => {
    if (!expiryDateStr) return null;
    const expiry = new Date(expiryDateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expiry.setHours(0, 0, 0, 0);

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

    setIsSubmitting(true);
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
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSupplierSubmit = async (e) => {
    e.preventDefault();
    if (!supplierForm.name) {
      toast.error('Supplier name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      await createSupplier(supplierForm);
      toast.success('Supplier profile added successfully');
      setIsSupplierModalOpen(false);
      setSupplierForm(initialSupplierState);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save supplier');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openRestockModal = (item) => {
    setSelectedRestockItem(item);
    setRestockForm({
      quantityToAdd: 50,
      batchNumber: item.batchNumber || '',
      expiryDate: item.expiryDate ? item.expiryDate.split('T')[0] : '',
      unitPrice: item.unitPrice || ''
    });
    setIsRestockModalOpen(true);
  };

  const handleRestockSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRestockItem) return;
    if (Number(restockForm.quantityToAdd) <= 0) {
      toast.error('Restock quantity must be at least 1');
      return;
    }

    setIsSubmitting(true);
    try {
      await restockInventoryItem(selectedRestockItem._id, {
        quantityToAdd: Number(restockForm.quantityToAdd),
        batchNumber: restockForm.batchNumber,
        expiryDate: restockForm.expiryDate,
        unitPrice: restockForm.unitPrice ? Number(restockForm.unitPrice) : undefined
      });
      toast.success(`Successfully restocked ${restockForm.quantityToAdd} units of ${selectedRestockItem.name}`);
      setIsRestockModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to restock item');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openSupplierDetail = (supplier) => {
    setSelectedSupplierView(supplier);
    setIsSupplierDetailModalOpen(true);
  };

  const lowStockCount = useMemo(() => {
    return items.filter((item) => item.quantityInStock <= item.reorderThreshold).length;
  }, [items]);

  const expiredCount = useMemo(() => {
    return items.filter((item) => {
      const status = getExpiryStatus(item.expiryDate);
      return status && (status.label === 'Expired' || status.label.includes('Expiring'));
    }).length;
  }, [items]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerTitle}>
            <Skeleton variant="text" height={28} width={290} />
            <Skeleton variant="text" height={16} width={440} />
          </div>
        </div>
        <div className={styles.statsGrid}>
          {[1, 2, 3].map(i => <Skeleton key={i} variant="card" height={110} />)}
        </div>
        <Card>
          <CardBody>
            {[1,2,3,4,5,6,7].map(i => (
              <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--color-neutral-100)' }}>
                {[130,100,90,80,70,80,90,70,60].map((w, j) => <Skeleton key={j} variant="text" width={w} height={14} />)}
              </div>
            ))}
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <h2>Inventory & Pharmacy Management</h2>
          <p>Monitor stock levels, restock medicines, track batch expiries, and manage vendor suppliers.</p>
        </div>
        {canManage && (
          <div className={styles.actions}>
            <Button variant="outline" icon={<Truck size={16} />} onClick={() => setIsSupplierModalOpen(true)}>
              Add Supplier
            </Button>
            <Button variant="primary" icon={<Plus size={16} />} onClick={() => setIsItemModalOpen(true)}>
              Add Medicine / Item
            </Button>
          </div>
        )}
      </div>

      {/* Modern KPI Cards for Summary Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statInfo}>
            <div className={styles.statValue}><CountUp value={items.length} /></div>
            <div className={styles.statLabel}>Unique Items</div>
          </div>
          <div className={styles.statIconBadge} style={{ backgroundColor: 'var(--color-primary-50)', color: 'var(--color-primary-600)' }}>
            <Layers size={22} />
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statInfo}>
            <div className={styles.statValue} style={{ color: lowStockCount > 0 ? 'var(--color-warning-600)' : 'inherit' }}>
              <CountUp value={lowStockCount} />
            </div>
            <div className={styles.statLabel}>Low Stock Items</div>
          </div>
          <div className={styles.statIconBadge} style={{ backgroundColor: 'var(--color-warning-50)', color: 'var(--color-warning-600)' }}>
            <AlertTriangle size={22} />
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statInfo}>
            <div className={styles.statValue} style={{ color: expiredCount > 0 ? 'var(--color-danger-600)' : 'inherit' }}>
              <CountUp value={expiredCount} />
            </div>
            <div className={styles.statLabel}>Expired / Near Expiry</div>
          </div>
          <div className={styles.statIconBadge} style={{ backgroundColor: 'var(--color-danger-50)', color: 'var(--color-danger-600)' }}>
            <ShieldAlert size={22} />
          </div>
        </div>
      </div>

      {/* Tabs selector */}
      <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--color-neutral-200)', marginBottom: '16px' }}>
        <button
          className={`${styles.tabBtn} ${activeTab === 'inventory' ? styles.activeTabBtn : ''}`}
          onClick={() => setActiveTab('inventory')}
        >
          <Package size={16} /> Medicine & Stock List ({items.length})
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'suppliers' ? styles.activeTabBtn : ''}`}
          onClick={() => setActiveTab('suppliers')}
        >
          <Truck size={16} /> Suppliers Directory ({suppliers.length})
        </button>
      </div>

      {activeTab === 'inventory' ? (
        <Card>
          <CardHeader>
            <div className={styles.controlsRow}>
              <div style={{ flex: 1, minWidth: '260px' }}>
                <Input
                  placeholder="Search by name, batch number or supplier..."
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
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardHeader>
          <CardBody>
            {false ? null : (
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
                      <th>Supplier Details</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((item) => {
                      const isLowStock = item.quantityInStock <= item.reorderThreshold;
                      const expiryAlert = getExpiryStatus(item.expiryDate);
                      const supplierObj = item.supplierId;

                      return (
                        <tr key={item._id}>
                          <td style={{ fontWeight: 600 }}>{item.name}</td>
                          <td>
                            <Badge variant="primary">{item.category}</Badge>
                          </td>
                          <td style={{ fontFamily: 'monospace' }}>{item.batchNumber}</td>
                          <td style={{ fontWeight: 700, color: isLowStock ? 'var(--color-warning-600)' : 'inherit' }}>
                            {item.quantityInStock} units
                          </td>
                          <td>{item.reorderThreshold}</td>
                          <td>Rs. {item.unitPrice?.toLocaleString()}</td>
                          <td>{item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'N/A'}</td>
                          <td>
                            {supplierObj ? (
                              <button
                                type="button"
                                className={styles.supplierLinkBtn}
                                onClick={() => openSupplierDetail(supplierObj)}
                                title="Click to view full supplier details"
                              >
                                <strong>{supplierObj.name}</strong>
                                {supplierObj.phone && <span>({supplierObj.phone})</span>}
                              </button>
                            ) : (
                              <span style={{ color: 'var(--color-neutral-400)' }}>Unassigned</span>
                            )}
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                              {isLowStock && (
                                <Badge variant="warning" icon={<AlertTriangle size={10} />}>
                                  Low Stock
                                </Badge>
                              )}
                              {expiryAlert && <Badge variant={expiryAlert.variant}>{expiryAlert.label}</Badge>}
                              {!isLowStock && !expiryAlert && <Badge variant="success">Healthy</Badge>}
                            </div>
                          </td>
                          <td>
                            <div className={styles.actions}>
                              {canManage && (
                                <Button
                                  size="sm"
                                  variant="primary"
                                  icon={<RefreshCw size={14} />}
                                  onClick={() => openRestockModal(item)}
                                >
                                  Restock
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredItems.length === 0 && (
                      <tr>
                        <td colSpan={10} className={styles.emptyState}>
                          No inventory items found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      ) : (
        /* Suppliers Directory Tab */
        <Card>
          <CardHeader>
            <div style={{ flex: 1, minWidth: '260px' }}>
              <Input
                placeholder="Search suppliers by name, contact person, or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                icon={<Search size={16} />}
              />
            </div>
          </CardHeader>
          <CardBody>
            <div className={styles.tableResponsive}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Supplier ID</th>
                    <th>Vendor Name</th>
                    <th>Contact Person</th>
                    <th>Phone</th>
                    <th>Email</th>
                    <th>Address</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSuppliers.map((sup) => (
                    <tr key={sup._id}>
                      <td style={{ fontWeight: 600 }}>{sup.supplierId}</td>
                      <td style={{ fontWeight: 600, color: 'var(--color-primary-700)' }}>{sup.name}</td>
                      <td>{sup.contactPerson || 'N/A'}</td>
                      <td>{sup.phone || 'N/A'}</td>
                      <td>{sup.email || 'N/A'}</td>
                      <td>{sup.address || 'N/A'}</td>
                      <td>
                        <Button
                          size="sm"
                          variant="outline"
                          icon={<Eye size={14} />}
                          onClick={() => openSupplierDetail(sup)}
                        >
                          Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {filteredSuppliers.length === 0 && (
                    <tr>
                      <td colSpan={7} className={styles.emptyState}>
                        No supplier records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Restock Modal */}
      <Modal
        isOpen={isRestockModalOpen}
        onClose={() => setIsRestockModalOpen(false)}
        title={`Restock Medicine — ${selectedRestockItem?.name || ''}`}
      >
        <form onSubmit={handleRestockSubmit} className={styles.modalForm}>
          <div style={{ backgroundColor: 'var(--color-neutral-50)', padding: '12px', borderRadius: '8px', marginBottom: '8px' }}>
            <p style={{ margin: '0 0 4px 0', fontSize: '0.85rem' }}>
              Current Stock: <strong>{selectedRestockItem?.quantityInStock} units</strong>
            </p>
            <p style={{ margin: 0, fontSize: '0.85rem' }}>
              Reorder Threshold: <strong>{selectedRestockItem?.reorderThreshold} units</strong>
            </p>
          </div>

          <Input
            label="Quantity to Add to Stock"
            type="number"
            min="1"
            value={restockForm.quantityToAdd}
            onChange={(e) => setRestockForm((prev) => ({ ...prev, quantityToAdd: e.target.value }))}
            required
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Input
              label="New Batch Number (Optional)"
              value={restockForm.batchNumber}
              onChange={(e) => setRestockForm((prev) => ({ ...prev, batchNumber: e.target.value }))}
            />
            <Input
              label="New Expiry Date (Optional)"
              type="date"
              value={restockForm.expiryDate}
              onChange={(e) => setRestockForm((prev) => ({ ...prev, expiryDate: e.target.value }))}
            />
          </div>

          <Input
            label="Unit Price (Rs. Optional)"
            type="number"
            value={restockForm.unitPrice}
            onChange={(e) => setRestockForm((prev) => ({ ...prev, unitPrice: e.target.value }))}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
            <Button type="button" variant="ghost" onClick={() => setIsRestockModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={isSubmitting}>
              Confirm Restock
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Item Modal */}
      <Modal isOpen={isItemModalOpen} onClose={() => setIsItemModalOpen(false)} title="Add New Medicine / Inventory Item">
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
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
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

          <SearchSelect
            label="Assign Supplier"
            placeholder="Search & select supplier..."
            options={suppliers}
            value={itemForm.supplierId}
            onChange={(val) => setItemForm((prev) => ({ ...prev, supplierId: val }))}
            getOptionLabel={(sup) => sup.name}
            getOptionValue={(sup) => sup._id}
            getOptionSublabel={(sup) => sup.phone || sup.email || ''}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
            <Button type="button" variant="ghost" onClick={() => setIsItemModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={isSubmitting}>
              Save Inventory Item
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Supplier Modal */}
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
            <Button type="button" variant="ghost" onClick={() => setIsSupplierModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={isSubmitting}>
              Save Supplier Profile
            </Button>
          </div>
        </form>
      </Modal>

      {/* Supplier Detail View Modal */}
      <Modal
        isOpen={isSupplierDetailModalOpen}
        onClose={() => setIsSupplierDetailModalOpen(false)}
        title={`Supplier Profile — ${selectedSupplierView?.name || ''}`}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '8px 0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-neutral-500)', display: 'block' }}>Supplier ID</span>
              <strong>{selectedSupplierView?.supplierId || 'N/A'}</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-neutral-500)', display: 'block' }}>Vendor Name</span>
              <strong>{selectedSupplierView?.name || 'N/A'}</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-neutral-500)', display: 'block' }}>Contact Person</span>
              <strong>{selectedSupplierView?.contactPerson || 'N/A'}</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-neutral-500)', display: 'block' }}>Phone</span>
              <strong>{selectedSupplierView?.phone || 'N/A'}</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-neutral-500)', display: 'block' }}>Email</span>
              <strong>{selectedSupplierView?.email || 'N/A'}</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-neutral-500)', display: 'block' }}>Address</span>
              <strong>{selectedSupplierView?.address || 'N/A'}</strong>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
            <Button variant="primary" onClick={() => setIsSupplierDetailModalOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default InventoryPage;
