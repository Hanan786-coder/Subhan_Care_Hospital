import React from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { PUBLIC_ROUTES } from '@/constants/routes';
import { Card, Button } from '@/components/ui';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';

export const ProtectedRoute = ({ children, allowedRoles = null }) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p style={{ color: 'var(--color-neutral-600)' }}>Verifying session security...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={PUBLIC_ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  // Enforce SRS Section 4 Role-Permission Matrix
  if (allowedRoles && allowedRoles.length > 0) {
    const hasRole = allowedRoles.includes(user?.role);
    if (!hasRole) {
      return (
        <div style={{ padding: 'var(--space-8)', maxWidth: '640px', margin: '40px auto' }}>
          <Card>
            <div style={{ textAlign: 'center', padding: '2.5rem 1.5rem' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem',
                  color: 'var(--color-danger-500, #ef4444)'
                }}
              >
                <ShieldAlert size={36} />
              </div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '8px', color: 'var(--color-neutral-900)' }}>
                Access Restricted (403 Forbidden)
              </h2>
              <p style={{ color: 'var(--color-neutral-600)', marginBottom: '24px', fontSize: '0.9rem', lineHeight: '1.5' }}>
                Your current role (<strong>{user?.role || 'Guest'}</strong>) does not have access permissions for this module according to the hospital's Role-Based Access Control (RBAC) policy.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <Button variant="outline" icon={<ArrowLeft size={16} />} onClick={() => navigate(-1)}>
                  Go Back
                </Button>
                <Button variant="primary" icon={<Home size={16} />} onClick={() => navigate('/')}>
                  Return to Dashboard
                </Button>
              </div>
            </div>
          </Card>
        </div>
      );
    }
  }

  return children;
};
