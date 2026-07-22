import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { PRIVATE_ROUTES } from '@/constants/routes';

export const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null; // Or a simple spinner
  }

  // If user is already authenticated, don't let them see public routes like login/forgot-password
  if (isAuthenticated) {
    return <Navigate to={PRIVATE_ROUTES.DASHBOARD} replace />;
  }

  return children;
};
