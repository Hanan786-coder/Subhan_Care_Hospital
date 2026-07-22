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
  DASHBOARD: '/dashboard',
  PATIENTS: '/dashboard/patients',
  DOCTORS: '/dashboard/doctors',
  STAFF: '/dashboard/staff',
  APPOINTMENTS: '/dashboard/appointments',
  PRESCRIPTIONS: '/dashboard/prescriptions',
  MEDICAL_HISTORY: '/dashboard/medical-history',
  BILLING: '/dashboard/billing',
  INVENTORY: '/dashboard/inventory',
  REPORTS: '/dashboard/reports',
  AUDIT_LOGS: '/dashboard/audit-logs',
  SETTINGS: '/dashboard/settings',
};
