import React from 'react';
import { Card } from '@/components/ui';

const PatientsPage = () => {
  return (
    <div>
      <h1 style={{ marginBottom: 'var(--space-6)', color: 'var(--color-neutral-900)' }}>Patients</h1>
      <Card>
        <div style={{ padding: 'var(--space-12)', textAlign: 'center', color: 'var(--color-neutral-500)' }}>
          <h3>Coming Soon</h3>
          <p>The Patients module is currently under development by the frontend team.</p>
        </div>
      </Card>
    </div>
  );
};

export default PatientsPage;
