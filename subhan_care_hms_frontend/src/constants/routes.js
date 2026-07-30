/**
 * Public route paths (accessible without authentication).
 */
export const PUBLIC_ROUTES = {
  LOGIN: '/login',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
};

/**
 * Private route paths (require authentication and role validation).
 */
export const PRIVATE_ROUTES = {
  DASHBOARD: '/',
  PATIENTS: '/patients',
  DOCTORS: '/doctors',
  STAFF: '/staff',
  APPOINTMENTS: '/appointments',
  PRESCRIPTIONS: '/prescriptions',
  MEDICAL_HISTORY: '/medical-history',
  BILLING: '/billing',
  INVENTORY: '/inventory',
  REPORTS: '/reports',
  AUDIT_LOGS: '/audit-logs',
  SETTINGS: '/settings',
};
