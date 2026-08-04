import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardBody, CardHeader, Button, Badge, Input, Modal, Spinner } from '@/components/ui';
import { createInvoice, getInvoices, recordPayment } from '@/services/billingService';
import { getPatients } from '@/services/patientService';
import { ROLES } from '@/constants/roles';
import { useAuth } from '@/context/AuthContext';
import { ReceiptText, Search, WalletCards, Download, Plus, Trash2, Printer, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './Billing.module.css';

const ITEM_TYPES = ['Consultation', 'Medicine', 'Lab Test', 'Procedure', 'Consumables', 'Other'];

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

  const initialFormState = {
    patientId: '',
    paymentMethod: 'Cash',
    discount: 0,
    tax: 0,
    amountPaid: 0,
    items: [{ type: 'Consultation', description: 'General Consultation', quantity: 1, unitPrice: 1500 }]
  };

  const [formData, setFormData] = useState(initialFormState);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [invoiceData, patientData] = await Promise.all([
        getInvoices(statusFilter ? { status: statusFilter } : {}),
        getPatients()
      ]);
      setInvoices(invoiceData.data || []);
      setPatients(patientData.data || []);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to load billing data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const filteredInvoices = useMemo(() => {
    const query = search.toLowerCase().trim();
    return invoices.filter((invoice) => 
      !query || 
      invoice.invoiceId?.toLowerCase().includes(query) || 
      invoice.patientId?.fullName?.toLowerCase().includes(query)
    );
  }, [invoices, search]);

  const totalRevenue = useMemo(() => {
    return invoices.reduce((sum, invoice) => sum + (invoice.amountPaid || 0), 0);
  }, [invoices]);

  const outstanding = useMemo(() => {
    return invoices.reduce((sum, invoice) => sum + (invoice.balanceDue || 0), 0);
  }, [invoices]);

  const handleAddItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { type: 'Medicine', description: '', quantity: 1, unitPrice: 0 }]
    }));
  };

  const handleRemoveItem = (index) => {
    if (formData.items.length === 1) {
      toast.error('At least one item is required in the invoice');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    updatedItems[index][field] = field === 'description' || field === 'type' ? value : Number(value);
    setFormData((prev) => ({ ...prev, items: updatedItems }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.patientId) {
      toast.error('Please select a patient');
      return;
    }

    const invalidItem = formData.items.some(item => !item.description.trim() || item.unitPrice <= 0);
    if (invalidItem) {
      toast.error('All invoice items must have a valid description and positive price');
      return;
    }

    setIsSubmitting(true);
    try {
      await createInvoice({
        ...formData,
        amountPaid: Number(formData.amountPaid),
        discount: Number(formData.discount),
        tax: Number(formData.tax),
        items: formData.items.map((item) => ({ 
          ...item, 
          quantity: Number(item.quantity), 
          unitPrice: Number(item.unitPrice), 
          amount: Number(item.unitPrice * item.quantity) 
        }))
      });
      toast.success('Invoice successfully generated');
      setIsModalOpen(false);
      setFormData(initialFormState);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create invoice');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePayment = async (invoice) => {
    if (invoice.status === 'Paid') return;
    const payMethod = window.prompt('Enter payment method (Cash/Card/Bank Transfer):', 'Cash');
    if (payMethod === null) return; // Cancelled

    try {
      await recordPayment(invoice._id, { amountPaid: invoice.total, paymentMethod: payMethod || 'Cash' });
      toast.success('Payment successfully recorded');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to record payment');
    }
  };

  const handlePrintReceipt = (invoice) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Popup blocker is active. Please allow popups to print receipt.');
      return;
    }
    const itemsHtml = (invoice.items || []).map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; color: #475569;">
          <strong>[${item.type}]</strong> ${item.description}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; text-align: center; color: #475569;">
          ${item.quantity}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; text-align: right; color: #475569;">
          Rs. ${item.unitPrice.toLocaleString()}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 600; color: #1e293b;">
          Rs. ${(item.quantity * item.unitPrice).toLocaleString()}
        </td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt - ${invoice.invoiceId}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
            body { font-family: 'Outfit', sans-serif; padding: 40px; color: #1e293b; background: #ffffff; }
            .logo { font-size: 24px; font-weight: 700; color: #0891b2; margin-bottom: 6px; }
            .receipt-header { border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
            .info-block p { margin: 4px 0; font-size: 14px; color: #475569; }
            .info-block strong { color: #0f172a; }
            .table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            .table th { background: #f8fafc; padding: 12px 10px; font-size: 11px; text-transform: uppercase; font-weight: 600; color: #64748b; letter-spacing: 0.05em; border-bottom: 1px solid #e2e8f0; text-align: left; }
            .totals-container { display: flex; justify-content: flex-end; margin-top: 30px; }
            .totals-table { width: 300px; }
            .totals-table td { padding: 8px 0; font-size: 14px; color: #475569; }
            .totals-table tr.grand-total td { font-size: 18px; font-weight: 700; color: #0f172a; border-top: 2px solid #cbd5e1; padding-top: 12px; }
            .footer { text-align: center; margin-top: 60px; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 20px; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="receipt-header">
            <div class="logo">Subhan Care HMS</div>
            <p style="margin: 0; font-size: 12px; color: #64748b;">Plot 12-C, G-8 Markaz, Islamabad | Support: support@subhancare.com</p>
          </div>
          
          <div class="info-grid">
            <div class="info-block">
              <p><strong>Patient Name:</strong> ${invoice.patientId?.fullName || 'N/A'}</p>
              <p><strong>Patient ID:</strong> ${invoice.patientId?.patientId || 'N/A'}</p>
              <p><strong>Payment Method:</strong> ${invoice.paymentMethod || 'Cash'}</p>
            </div>
            <div class="info-block" style="text-align: right;">
              <p><strong>Invoice ID:</strong> ${invoice.invoiceId}</p>
              <p><strong>Issue Date:</strong> ${new Date(invoice.issuedAt).toLocaleDateString()}</p>
              <p><strong>Payment Date:</strong> ${invoice.paidAt ? new Date(invoice.paidAt).toLocaleDateString() : 'Pending'}</p>
            </div>
          </div>

          <table class="table">
            <thead>
              <tr>
                <th>Item Details</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Unit Price</th>
                <th style="text-align: right;">Total Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="totals-container">
            <table class="totals-table">
              <tr>
                <td>Subtotal:</td>
                <td style="text-align: right;">Rs. ${(invoice.subtotal || invoice.total).toLocaleString()}</td>
              </tr>
              <tr>
                <td>Discount:</td>
                <td style="text-align: right; color: #ef4444;">- Rs. ${(invoice.discount || 0).toLocaleString()}</td>
              </tr>
              <tr>
                <td>Tax:</td>
                <td style="text-align: right;">Rs. ${(invoice.tax || 0).toLocaleString()}</td>
              </tr>
              <tr class="grand-total">
                <td>Total Paid:</td>
                <td style="text-align: right; color: #0891b2;">Rs. ${invoice.amountPaid?.toLocaleString()}</td>
              </tr>
            </table>
          </div>

          <div class="footer">
            <p>Thank you for choosing Subhan Care Hospital.</p>
            <p>This is a computer-generated transaction document.</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <h2>Billing & Payment Management</h2>
          <p>Generate itemized customer invoices, process ledger payments, and review hospital collection stats.</p>
        </div>
        {canManage && (
          <Button variant="primary" icon={<ReceiptText size={16} />} onClick={() => setIsModalOpen(true)}>
            Generate Invoice
          </Button>
        )}
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>{invoices.length}</div>
            <div className={styles.statLabel}>Generated Invoices</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>Rs. {totalRevenue.toLocaleString()}</div>
            <div className={styles.statLabel}>Total Revenue Collected</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>Rs. {outstanding.toLocaleString()}</div>
            <div className={styles.statLabel}>Outstanding Balances</div>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className={styles.controlsRow}>
            <div style={{ flex: 1, minWidth: '260px' }}>
              <Input 
                placeholder="Search by invoice ID or patient name..." 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                icon={<Search size={16} />} 
              />
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <Filter size={16} style={{ color: 'var(--color-neutral-500)' }} />
              <select 
                className={styles.filterSelect} 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="Unpaid">Unpaid</option>
                <option value="Partially Paid">Partially Paid</option>
                <option value="Paid">Paid</option>
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
                    <th>Invoice ID</th>
                    <th>Patient Name</th>
                    <th>Subtotal</th>
                    <th>Discount</th>
                    <th>Tax</th>
                    <th>Total</th>
                    <th>Amount Paid</th>
                    <th>Balance Due</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((invoice) => (
                    <tr key={invoice._id}>
                      <td style={{ fontWeight: 600 }}>{invoice.invoiceId}</td>
                      <td>{invoice.patientId?.fullName || 'N/A'}</td>
                      <td>Rs. {invoice.subtotal?.toLocaleString()}</td>
                      <td style={{ color: 'var(--color-danger-600)' }}>- Rs. {invoice.discount?.toLocaleString()}</td>
                      <td>Rs. {invoice.tax?.toLocaleString()}</td>
                      <td style={{ fontWeight: 600 }}>Rs. {invoice.total?.toLocaleString()}</td>
                      <td style={{ color: 'var(--color-success-600)' }}>Rs. {invoice.amountPaid?.toLocaleString()}</td>
                      <td style={{ color: invoice.balanceDue > 0 ? 'var(--color-warning-600)' : 'inherit' }}>
                        Rs. {invoice.balanceDue?.toLocaleString()}
                      </td>
                      <td>
                        <Badge variant={invoice.status === 'Paid' ? 'success' : invoice.status === 'Partially Paid' ? 'warning' : 'danger'}>
                          {invoice.status}
                        </Badge>
                      </td>
                      <td>
                        <div className={styles.actions}>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            icon={<Printer size={14} />} 
                            onClick={() => handlePrintReceipt(invoice)}
                          >
                            Receipt
                          </Button>
                          {canManage && invoice.status !== 'Paid' ? (
                            <Button 
                              size="sm" 
                              variant="primary" 
                              icon={<WalletCards size={14} />} 
                              onClick={() => handlePayment(invoice)}
                            >
                              Collect Payment
                            </Button>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-neutral-400)' }}>Settled</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredInvoices.length === 0 && (
                    <tr>
                      <td colSpan={10} className={styles.emptyState}>No invoices found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Generate New Invoice" size="lg">
        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-neutral-700)' }}>Select Patient</label>
              <select 
                value={formData.patientId} 
                onChange={(e) => setFormData((prev) => ({ ...prev, patientId: e.target.value }))} 
                className={styles.filterSelect}
                style={{ width: '100%' }}
                required
              >
                <option value="">-- Choose Patient --</option>
                {patients.map((patient) => <option key={patient._id} value={patient._id}>{patient.fullName}</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-neutral-700)' }}>Payment Method</label>
              <select 
                value={formData.paymentMethod} 
                onChange={(e) => setFormData((prev) => ({ ...prev, paymentMethod: e.target.value }))} 
                className={styles.filterSelect}
                style={{ width: '100%' }}
                required
              >
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </select>
            </div>
          </div>

          <div className={styles.itemsSection}>
            <div className={styles.itemsHeader}>
              <h4>Itemized Bills</h4>
              <Button type="button" size="sm" variant="outline" icon={<Plus size={14} />} onClick={handleAddItem}>
                Add Line Item
              </Button>
            </div>

            {formData.items.map((item, index) => (
              <div key={index} className={styles.itemRow}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <select 
                    value={item.type} 
                    onChange={(e) => handleItemChange(index, 'type', e.target.value)} 
                    className={styles.filterSelect}
                    style={{ width: '100%', height: '40px' }}
                    required
                  >
                    {ITEM_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                  </select>
                </div>
                <Input 
                  placeholder="Item details / description" 
                  value={item.description} 
                  onChange={(e) => handleItemChange(index, 'description', e.target.value)} 
                  required 
                />
                <Input 
                  placeholder="Qty" 
                  type="number" 
                  value={item.quantity} 
                  onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} 
                  required 
                />
                <Input 
                  placeholder="Price (Rs.)" 
                  type="number" 
                  value={item.unitPrice} 
                  onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)} 
                  required 
                />
                <Input 
                  placeholder="Total Amount" 
                  value={`Rs. ${(item.quantity * item.unitPrice).toLocaleString()}`} 
                  readOnly 
                />
                <Button 
                  type="button" 
                  variant="ghost" 
                  style={{ color: 'var(--color-danger-500)', padding: '8px' }}
                  onClick={() => handleRemoveItem(index)}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            ))}
          </div>

          <div className={styles.itemGrid}>
            <Input 
              label="Discount (Rs.)" 
              type="number" 
              value={formData.discount} 
              onChange={(e) => setFormData((prev) => ({ ...prev, discount: Number(e.target.value) }))} 
            />
            <Input 
              label="Tax Amount (Rs.)" 
              type="number" 
              value={formData.tax} 
              onChange={(e) => setFormData((prev) => ({ ...prev, tax: Number(e.target.value) }))} 
            />
            <Input 
              label="Amount Received (Rs.)" 
              type="number" 
              value={formData.amountPaid} 
              onChange={(e) => setFormData((prev) => ({ ...prev, amountPaid: Number(e.target.value) }))} 
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" loading={isSubmitting}>Generate & Create Invoice</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default BillingPage;
