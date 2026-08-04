import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardBody, CardHeader, Button, Badge, Input, Modal, Spinner } from '@/components/ui';
import { createInvoice, getInvoices, recordPayment } from '@/services/billingService';
import { getPatients } from '@/services/patientService';
import { ROLES } from '@/constants/roles';
import { useAuth } from '@/context/AuthContext';
import { ReceiptText, Search, WalletCards, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './Billing.module.css';

const BillingPage = () => {
  const { user } = useAuth();
  const canManage = [ROLES.ADMIN, ROLES.BILLING_STAFF].includes(user?.role);

  const [invoices, setInvoices] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ patientId: '', paymentMethod: 'Cash', amountPaid: 0, discount: 0, tax: 0, items: [{ type: 'Consultation', description: 'Consultation fee', quantity: 1, unitPrice: 1500, amount: 1500 }] });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [invoiceData, patientData] = await Promise.all([getInvoices(statusFilter ? { status: statusFilter } : {}), getPatients()]);
      setInvoices(invoiceData.data || []);
      setPatients(patientData.data || []);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to load billing data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [statusFilter]);

  const filteredInvoices = useMemo(() => {
    const query = search.toLowerCase().trim();
    return invoices.filter((invoice) => !query || invoice.invoiceId?.toLowerCase().includes(query) || invoice.patientId?.fullName?.toLowerCase().includes(query));
  }, [invoices, search]);

  const totalRevenue = invoices.reduce((sum, invoice) => sum + (invoice.total || 0), 0);
  const outstanding = invoices.reduce((sum, invoice) => sum + (invoice.balanceDue || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.patientId) {
      toast.error('Select a patient');
      return;
    }

    setIsSubmitting(true);
    try {
      await createInvoice({
        ...formData,
        amountPaid: Number(formData.amountPaid),
        discount: Number(formData.discount),
        tax: Number(formData.tax),
        items: formData.items.map((item) => ({ ...item, quantity: Number(item.quantity), unitPrice: Number(item.unitPrice), amount: Number(item.amount || item.unitPrice * item.quantity) }))
      });
      toast.success('Invoice generated');
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create invoice');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePayment = async (invoice) => {
    try {
      await recordPayment(invoice._id, { amountPaid: invoice.total, paymentMethod: 'Cash' });
      toast.success('Payment recorded');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to record payment');
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Billing & Invoice</h2>
          <p className={styles.subtitle}>Create invoices, track partial payments, and expose printable receipts.</p>
        </div>
        {canManage && <Button variant="primary" icon={<ReceiptText size={16} />} onClick={() => setIsModalOpen(true)}>Generate Invoice</Button>}
      </div>

      <div className={styles.statsGrid}>
        <Card><CardBody><div className={styles.statLabel}>Invoices</div><div className={styles.statValue}>{invoices.length}</div></CardBody></Card>
        <Card><CardBody><div className={styles.statLabel}>Revenue</div><div className={styles.statValue}>Rs. {totalRevenue.toLocaleString()}</div></CardBody></Card>
        <Card><CardBody><div className={styles.statLabel}>Outstanding</div><div className={styles.statValue}>Rs. {outstanding.toLocaleString()}</div></CardBody></Card>
      </div>

      <Card>
        <CardHeader>
          <div className={styles.controls}>
            <Input placeholder="Search invoice or patient" value={search} onChange={(e) => setSearch(e.target.value)} icon={<Search size={16} />} />
            <select className={styles.filterSelect} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="Unpaid">Unpaid</option>
              <option value="Partially Paid">Partially Paid</option>
              <option value="Paid">Paid</option>
            </select>
          </div>
        </CardHeader>
        <CardBody>
          {loading ? <Spinner /> : (
            <div className={styles.list}>
              {filteredInvoices.map((invoice) => (
                <div key={invoice._id} className={styles.invoiceCard}>
                  <div className={styles.invoiceHeader}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{invoice.invoiceId}</div>
                      <div className={styles.invoiceMeta}>{invoice.patientId?.fullName || 'Unknown Patient'}</div>
                    </div>
                    <Badge variant={invoice.status === 'Paid' ? 'success' : invoice.status === 'Partially Paid' ? 'warning' : 'secondary'}>{invoice.status}</Badge>
                  </div>
                  <div className={styles.invoiceMeta}>Total Rs. {invoice.total?.toLocaleString()} | Paid Rs. {invoice.amountPaid?.toLocaleString()} | Balance Rs. {invoice.balanceDue?.toLocaleString()}</div>
                  <div className={styles.actions}>
                    <Button size="sm" variant="secondary" icon={<Download size={14} />}>Receipt</Button>
                    <Button size="sm" variant="primary" icon={<WalletCards size={14} />} onClick={() => handlePayment(invoice)}>Mark Paid</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Generate Invoice">
        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <select value={formData.patientId} onChange={(e) => setFormData((prev) => ({ ...prev, patientId: e.target.value }))} className={styles.filterSelect}>
            <option value="">Select patient</option>
            {patients.map((patient) => <option key={patient._id} value={patient._id}>{patient.fullName}</option>)}
          </select>
          <Input label="Payment Method" value={formData.paymentMethod} onChange={(e) => setFormData((prev) => ({ ...prev, paymentMethod: e.target.value }))} />
          <div className={styles.itemGrid}>
            <Input type="number" label="Discount" value={formData.discount} onChange={(e) => setFormData((prev) => ({ ...prev, discount: e.target.value }))} />
            <Input type="number" label="Tax" value={formData.tax} onChange={(e) => setFormData((prev) => ({ ...prev, tax: e.target.value }))} />
            <Input type="number" label="Amount Paid" value={formData.amountPaid} onChange={(e) => setFormData((prev) => ({ ...prev, amountPaid: e.target.value }))} />
          </div>
          <Button type="submit" variant="primary" loading={isSubmitting}>Create Invoice</Button>
        </form>
      </Modal>
    </div>
  );
};

export default BillingPage;
