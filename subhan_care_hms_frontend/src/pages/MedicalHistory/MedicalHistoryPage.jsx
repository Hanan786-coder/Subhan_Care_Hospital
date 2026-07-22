import React from 'react';
import { Card } from '@/components/ui';

const MedicalHistoryPage = () => {
  return (
    <div>
      <h1 style={{ marginBottom: 'var(--space-6)', color: 'var(--color-neutral-900)' }}>Medical History</h1>
      <Card>
        <div style={{ padding: 'var(--space-12)', textAlign: 'center', color: 'var(--color-neutral-500)' }}>
          <h3>Medical History & Consultations</h3>
          <p>Chronological patient diagnoses, consultation notes, and immutable medical history records (FR-06.1 - FR-06.7).</p>
        </div>
      </Card>
    </div>
  );
};

export default MedicalHistoryPage;
