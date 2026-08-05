import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardBody, CardHeader, Button, Badge, Input, Modal, Spinner } from '@/components/ui';
import { getAuditLogs } from '@/services/auditLogService';
import { ShieldCheck, Search, Filter, Eye, Download, Calendar, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './AuditLogs.module.css';

const ACTION_VARIANTS = {
  CREATE: 'success',
  POST: 'success',
  UPDATE: 'info',
  PUT: 'info',
  PATCH: 'info',
  DELETE: 'danger',
  RESTOCK: 'primary',
  LOGIN: 'warning',
  LOGOUT: 'secondary'
};

const AuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' | 'asc'

  // Inspector Modal
  const [selectedLog, setSelectedLog] = useState(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await getAuditLogs({
        action: actionFilter || undefined,
        entity: entityFilter || undefined
      });
      setLogs(response.data || []);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, entityFilter]);

  const filteredLogs = useMemo(() => {
    const q = search.toLowerCase().trim();
    let result = logs.filter((log) => {
      const matchesSearch =
        !q ||
        log.action?.toLowerCase().includes(q) ||
        log.entity?.toLowerCase().includes(q) ||
        log.userId?.name?.toLowerCase().includes(q) ||
        log.userId?.email?.toLowerCase().includes(q) ||
        log.ipAddress?.toLowerCase().includes(q) ||
        JSON.stringify(log.details || {}).toLowerCase().includes(q);
      return matchesSearch;
    });

    result.sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    });

    return result;
  }, [logs, search, sortOrder]);

  const openInspector = (log) => {
    setSelectedLog(log);
    setIsInspectorOpen(true);
  };

  const handleExportCSV = () => {
    if (filteredLogs.length === 0) {
      toast.error('No audit logs available to export');
      return;
    }

    const headers = ['Timestamp', 'User', 'Role', 'Action', 'Entity', 'Record ID', 'IP Address'];
    const rows = filteredLogs.map((l) => [
      new Date(l.createdAt).toLocaleString(),
      l.userId?.name || 'System',
      l.userId?.role || 'SYSTEM',
      l.action,
      l.entity,
      l.recordId || 'N/A',
      l.ipAddress || '127.0.0.1'
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `subhan_care_audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Audit logs CSV exported successfully');
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <h2>System Audit & Security Logs</h2>
          <p>
            Immutable event log recording user activity, API endpoint calls, record mutations, and timestamped actions for compliance.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="outline" icon={<RefreshCw size={16} />} onClick={fetchLogs}>
            Refresh
          </Button>
          <Button variant="primary" icon={<Download size={16} />} onClick={handleExportCSV}>
            Export Audit CSV
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className={styles.controlsRow}>
            <div style={{ flex: 1, minWidth: '260px' }}>
              <Input
                placeholder="Search audit events by user, action, entity, IP or details..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                icon={<Search size={16} />}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <select
                className={styles.filterSelect}
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
              >
                <option value="">All Actions</option>
                <option value="CREATE">CREATE</option>
                <option value="UPDATE">UPDATE</option>
                <option value="DELETE">DELETE</option>
                <option value="POST">POST</option>
                <option value="RESTOCK">RESTOCK</option>
                <option value="LOGIN">LOGIN</option>
              </select>

              <select
                className={styles.filterSelect}
                value={entityFilter}
                onChange={(e) => setEntityFilter(e.target.value)}
              >
                <option value="">All Entities</option>
                <option value="Patient">Patient</option>
                <option value="Doctor">Doctor</option>
                <option value="Appointment">Appointment</option>
                <option value="Consultation">Consultation</option>
                <option value="Prescription">Prescription</option>
                <option value="Inventory">Inventory</option>
                <option value="Invoice">Invoice</option>
                <option value="Staff">Staff</option>
              </select>

              <select
                className={styles.filterSelect}
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardBody>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
              <Spinner />
            </div>
          ) : (
            <div className={styles.tableResponsive}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>User / Performer</th>
                    <th>Role</th>
                    <th>Action</th>
                    <th>Affected Entity</th>
                    <th>Record ID</th>
                    <th>IP Address</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => {
                    const actionKey = log.action?.split(' ')[0] || log.action;
                    return (
                      <tr key={log._id}>
                        <td style={{ whiteSpace: 'nowrap', fontSize: '0.8125rem' }}>
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <strong style={{ color: 'var(--color-neutral-900)' }}>{log.userId?.name || 'System / Guest'}</strong>
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-neutral-500)' }}>
                              {log.userId?.email || 'N/A'}
                            </span>
                          </div>
                        </td>
                        <td>
                          <Badge variant="primary">{log.userId?.role || 'SYSTEM'}</Badge>
                        </td>
                        <td>
                          <Badge variant={ACTION_VARIANTS[actionKey] || 'secondary'}>{log.action}</Badge>
                        </td>
                        <td style={{ fontWeight: 600 }}>{log.entity || 'General'}</td>
                        <td style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}>{log.recordId || 'N/A'}</td>
                        <td style={{ fontFamily: 'monospace', color: 'var(--color-neutral-600)' }}>
                          {log.ipAddress || '127.0.0.1'}
                        </td>
                        <td>
                          <Button size="sm" variant="outline" icon={<Eye size={14} />} onClick={() => openInspector(log)}>
                            View Payload
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredLogs.length === 0 && (
                    <tr>
                      <td colSpan={8} className={styles.emptyState}>
                        No audit log events matched the search criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Payload Inspector Modal */}
      <Modal
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
        title={`Audit Log Payload Inspector — ${selectedLog?.action || ''}`}
        size="lg"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.875rem' }}>
            <div>
              <span style={{ color: 'var(--color-neutral-500)', fontSize: '0.75rem', display: 'block' }}>Log ID</span>
              <strong>{selectedLog?._id}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--color-neutral-500)', fontSize: '0.75rem', display: 'block' }}>Timestamp</span>
              <strong>{selectedLog?.createdAt ? new Date(selectedLog.createdAt).toLocaleString() : 'N/A'}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--color-neutral-500)', fontSize: '0.75rem', display: 'block' }}>Performer</span>
              <strong>
                {selectedLog?.userId?.name} ({selectedLog?.userId?.role})
              </strong>
            </div>
            <div>
              <span style={{ color: 'var(--color-neutral-500)', fontSize: '0.75rem', display: 'block' }}>IP Address</span>
              <strong>{selectedLog?.ipAddress || '127.0.0.1'}</strong>
            </div>
          </div>

          <div>
            <span style={{ color: 'var(--color-neutral-700)', fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
              Raw JSON Details Payload
            </span>
            <pre className={styles.jsonBox}>{JSON.stringify(selectedLog?.details || {}, null, 2)}</pre>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
            <Button variant="primary" onClick={() => setIsInspectorOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AuditLogsPage;
