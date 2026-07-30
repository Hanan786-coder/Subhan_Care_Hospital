import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { PublicRoute } from './PublicRoute';
import { PUBLIC_ROUTES, PRIVATE_ROUTES } from '@/constants/routes';
import { ROLES } from '@/constants/roles';
import DashboardLayout from '@/layouts/DashboardLayout';

// Lazy load pages
const LoginPage = lazy(() => import('@/pages/Login/LoginPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPassword/ForgotPasswordPage'));
const DashboardHome = lazy(() => import('@/pages/Dashboard/DashboardHome'));

// Module pages
const PatientsPage = lazy(() => import('@/pages/Patients/PatientsPage'));
const DoctorsPage = lazy(() => import('@/pages/Doctors/DoctorsPage'));
const StaffPage = lazy(() => import('@/pages/Staff/StaffPage'));
const AppointmentsPage = lazy(() => import('@/pages/Appointments/AppointmentsPage'));
const PrescriptionsPage = lazy(() => import('@/pages/Prescriptions/PrescriptionsPage'));
const MedicalHistoryPage = lazy(() => import('@/pages/MedicalHistory/MedicalHistoryPage'));
const BillingPage = lazy(() => import('@/pages/Billing/BillingPage'));
const InventoryPage = lazy(() => import('@/pages/Inventory/InventoryPage'));
const ReportsPage = lazy(() => import('@/pages/Reports/ReportsPage'));
const AuditLogsPage = lazy(() => import('@/pages/AuditLogs/AuditLogsPage'));
const SettingsPage = lazy(() => import('@/pages/Settings/SettingsPage'));

// A sleek loading fallback for suspense
const PageLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '60vh' }}>
    <div style={{
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      border: '3px solid var(--color-primary-100)',
      borderTopColor: 'var(--color-accent-500)',
      animation: 'spin 0.8s ease-in-out infinite'
    }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

export const AppRoutes = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public Routes */}
        <Route path={PUBLIC_ROUTES.LOGIN} element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path={PUBLIC_ROUTES.FORGOT_PASSWORD} element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
        
        {/* Protected Layout Shell */}
        <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<DashboardHome />} />
          
          <Route 
            path="patients" 
            element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.DOCTOR, ROLES.RECEPTIONIST, ROLES.PHARMACIST, ROLES.BILLING_STAFF]}>
                <PatientsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="doctors" 
            element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.DOCTOR, ROLES.RECEPTIONIST]}>
                <DoctorsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="staff" 
            element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                <StaffPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="appointments" 
            element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.DOCTOR, ROLES.RECEPTIONIST]}>
                <AppointmentsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="prescriptions" 
            element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.DOCTOR, ROLES.PHARMACIST]}>
                <PrescriptionsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="medical-history" 
            element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.DOCTOR]}>
                <MedicalHistoryPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="billing" 
            element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.BILLING_STAFF]}>
                <BillingPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="inventory" 
            element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.PHARMACIST]}>
                <InventoryPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="reports" 
            element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.BILLING_STAFF]}>
                <ReportsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="audit-logs" 
            element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                <AuditLogsPage />
              </ProtectedRoute>
            } 
          />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};
