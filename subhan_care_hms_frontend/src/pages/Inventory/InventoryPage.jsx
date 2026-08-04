import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardBody, CardHeader, Button, Badge, Input, Modal, Spinner } from '@/components/ui';
import { createInventoryItem, createSupplier, getInventory, getSuppliers } from '@/services/inventoryService';
import { useAuth } from '@/context/AuthContext';
import { ROLES } from '@/constants/roles';
import { Package, Plus, Search, Truck } from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './Inventory.module.css';

const InventoryPage = () => {
  const { user } = useAuth();
  const canManage = [ROLES.ADMIN, ROLES.PHARMACIST].includes(user?.role);

  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [itemForm, setItemForm] = useState({ name: '', category: 'Medicine', batchNumber: '', expiryDate: '', quantityInStock: 0, reorderThreshold: 0, unitPrice: 0, supplierId: '' });
  const [supplierForm, setSupplierForm] = useState({ name: '', contactPerson: '', phone: '', email: '', address: '' });

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

  useEffect(() => { fetchData(); }, []);

  const filteredItems = useMemo(() => {
    const query = search.toLowerCase().trim();
    return items.filter((item) => !query || item.name?.toLowerCase().includes(query) || item.batchNumber?.toLowerCase().includes(query));
  }, [items, search]);

  const handleItemSubmit = async (e) => {
    e.preventDefault();
    try {
      await createInventoryItem(itemForm);
      toast.success('Inventory item added');
      setIsItemModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save item');
    }
  };

  const handleSupplierSubmit = async (e) => {
    e.preventDefault();
    try {
      await createSupplier(supplierForm);
      toast.success('Supplier added');
      setIsSupplierModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save supplier');
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Inventory</h2>
          <p className={styles.subtitle}>Track stock levels, low-stock thresholds, expiries, and suppliers.</p>
        </div>
        {canManage && (
          <div className={styles.actions}>
            <Button variant="secondary" icon={<Truck size={16} />} onClick={() => setIsSupplierModalOpen(true)}>Add Supplier</Button>
            <Button variant="primary" icon={<Plus size={16} />} onClick={() => setIsItemModalOpen(true)}>Add Item</Button>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <Input placeholder="Search inventory" value={search} onChange={(e) => setSearch(e.target.value)} icon={<Search size={16} />} />
        </CardHeader>
        <CardBody>
          {loading ? <Spinner /> : (
            <div className={styles.list}>
              {filteredItems.map((item) => (
                <div key={item._id} className={styles.itemCard}>
                  <div className={styles.itemHeader}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{item.name}</div>
                      <div className={styles.itemMeta}>{item.batchNumber} • {item.category}</div>
                    </div>
                    <Badge variant={item.quantityInStock <= item.reorderThreshold ? 'warning' : 'success'}>{item.quantityInStock} in stock</Badge>
                  </div>
                  <div className={styles.itemMeta}>Expiry: {new Date(item.expiryDate).toLocaleDateString()} | Supplier: {item.supplierId?.name || 'N/A'}</div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      <Modal isOpen={isItemModalOpen} onClose={() => setIsItemModalOpen(false)} title="Add Inventory Item">
        <form onSubmit={handleItemSubmit} className={styles.modalForm}>
          <Input label="Item name" value={itemForm.name} onChange={(e) => setItemForm((prev) => ({ ...prev, name: e.target.value }))} />
          <Input label="Batch number" value={itemForm.batchNumber} onChange={(e) => setItemForm((prev) => ({ ...prev, batchNumber: e.target.value }))} />
          <Input label="Expiry date" type="date" value={itemForm.expiryDate} onChange={(e) => setItemForm((prev) => ({ ...prev, expiryDate: e.target.value }))} />
          <div className={styles.itemGrid}>
            <Input label="Stock" type="number" value={itemForm.quantityInStock} onChange={(e) => setItemForm((prev) => ({ ...prev, quantityInStock: e.target.value }))} />
            <Input label="Reorder threshold" type="number" value={itemForm.reorderThreshold} onChange={(e) => setItemForm((prev) => ({ ...prev, reorderThreshold: e.target.value }))} />
            <Input label="Unit price" type="number" value={itemForm.unitPrice} onChange={(e) => setItemForm((prev) => ({ ...prev, unitPrice: e.target.value }))} />
          </div>
          <select value={itemForm.supplierId} onChange={(e) => setItemForm((prev) => ({ ...prev, supplierId: e.target.value }))} className={styles.itemCard}>
            <option value="">Select supplier</option>
            {suppliers.map((supplier) => <option key={supplier._id} value={supplier._id}>{supplier.name}</option>)}
          </select>
          <Button type="submit" variant="primary">Save Item</Button>
        </form>
      </Modal>

      <Modal isOpen={isSupplierModalOpen} onClose={() => setIsSupplierModalOpen(false)} title="Add Supplier">
        <form onSubmit={handleSupplierSubmit} className={styles.modalForm}>
          <Input label="Supplier name" value={supplierForm.name} onChange={(e) => setSupplierForm((prev) => ({ ...prev, name: e.target.value }))} />
          <Input label="Contact person" value={supplierForm.contactPerson} onChange={(e) => setSupplierForm((prev) => ({ ...prev, contactPerson: e.target.value }))} />
          <Input label="Phone" value={supplierForm.phone} onChange={(e) => setSupplierForm((prev) => ({ ...prev, phone: e.target.value }))} />
          <Button type="submit" variant="primary">Save Supplier</Button>
        </form>
      </Modal>
    </div>
  );
};

export default InventoryPage;
