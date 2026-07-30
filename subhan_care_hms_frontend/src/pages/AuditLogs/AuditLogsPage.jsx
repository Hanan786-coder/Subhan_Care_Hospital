import React from 'react';
import { Card } from '@/components/ui';

const AuditLogsPage = () => {
  return (
    <div>
      <h1 style={{ marginBottom: 'var(--space-6)', color: 'var(--color-neutral-900)' }}>Audit Logs</h1>
      <Card>
        <div style={{ padding: 'var(--space-12)', textAlign: 'center', color: 'var(--color-neutral-500)' }}>
          <h3>System Audit Logs</h3>
          <p>Immutable event log recording User ID, action performed, timestamp, and affected record.</p>
        </div>
      </Card>
    </div>
  );
};

export default AuditLogsPage;
