import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { PUBLIC_ROUTES, PRIVATE_ROUTES } from '@/constants/routes';
import { Card, Button } from '@/components/ui';
import { FiShieldOff } from 'react-icons/fi';

export const ProtectedRoute = ({ children, allowedRoles = null }) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>Verifying session security...</p>
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
        <div style={{ padding: 'var(--space-8)', maxWidth: '600px', margin: '40px auto' }}>
          <Card>
            <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
              <FiShieldOff size={48} style={{ color: 'var(--color-danger-500)', marginBottom: '16px' }} />
              <h2 style={{ fontSize: 'var(--font-size-xl)', marginBottom: '8px', color: 'var(--color-neutral-900)' }}>
                Access Restricted (SRS Section 4 - RBAC)
              </h2>
              <p style={{ color: 'var(--color-neutral-600)', marginBottom: '24px', fontSize: 'var(--font-size-sm)' }}>
                Your current role (<strong>{user?.role}</strong>) does not have access permissions for this module according to the hospital's security policy.
              </p>
              <Button variant="primary" onClick={() => window.history.back()}>
                Go Back
              </Button>
            </div>
          </Card>
        </div>
      );
    }
  }

  return children;
};
