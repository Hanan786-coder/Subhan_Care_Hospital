/**
 * Subhan Care HMS — Role-Permission Matrix & Access Control
 * Reference: SRS IEEE 29148 Section 4 (Role-Permission Matrix)
 */

export const ROLES = {
  ADMIN: 'ADMIN',
  DOCTOR: 'DOCTOR',
  RECEPTIONIST: 'RECEPTIONIST',
  PHARMACIST: 'PHARMACIST',
  BILLING_STAFF: 'BILLING_STAFF',
};

export const ROLE_LABELS = {
  [ROLES.ADMIN]: 'System Administrator',
  [ROLES.DOCTOR]: 'Doctor / Physician',
  [ROLES.RECEPTIONIST]: 'Front Desk Receptionist',
  [ROLES.PHARMACIST]: 'Pharmacist',
  [ROLES.BILLING_STAFF]: 'Billing & Finance Staff',
};

/**
 * Detailed Role-Permission Matrix matching SRS Section 4.
 * Actions: 'F' (Full), 'R' (Read-Only), 'L' (Limited), '-' (None)
 */
export const ROLE_PERMISSIONS = {
  patient_records: {
    [ROLES.ADMIN]: 'F',
    [ROLES.DOCTOR]: 'R/L',
    [ROLES.RECEPTIONIST]: 'F',
    [ROLES.PHARMACIST]: 'R',
    [ROLES.BILLING_STAFF]: 'R',
  },
  doctor_management: {
    [ROLES.ADMIN]: 'F',
    [ROLES.DOCTOR]: 'R',
    [ROLES.RECEPTIONIST]: 'R',
    [ROLES.PHARMACIST]: '-',
    [ROLES.BILLING_STAFF]: '-',
  },
  staff_management: {
    [ROLES.ADMIN]: 'F',
    [ROLES.DOCTOR]: '-',
    [ROLES.RECEPTIONIST]: '-',
    [ROLES.PHARMACIST]: '-',
    [ROLES.BILLING_STAFF]: '-',
  },
  appointments: {
    [ROLES.ADMIN]: 'F',
    [ROLES.DOCTOR]: 'R',
    [ROLES.RECEPTIONIST]: 'F',
    [ROLES.PHARMACIST]: '-',
    [ROLES.BILLING_STAFF]: '-',
  },
  prescriptions: {
    [ROLES.ADMIN]: 'R',
    [ROLES.DOCTOR]: 'F',
    [ROLES.RECEPTIONIST]: '-',
    [ROLES.PHARMACIST]: 'R/L',
    [ROLES.BILLING_STAFF]: '-',
  },
  medical_history: {
    [ROLES.ADMIN]: 'R',
    [ROLES.DOCTOR]: 'F',
    [ROLES.RECEPTIONIST]: '-',
    [ROLES.PHARMACIST]: '-',
    [ROLES.BILLING_STAFF]: '-',
  },
  billing_invoices: {
    [ROLES.ADMIN]: 'F',
    [ROLES.DOCTOR]: '-',
    [ROLES.RECEPTIONIST]: '-',
    [ROLES.PHARMACIST]: '-',
    [ROLES.BILLING_STAFF]: 'F',
  },
  inventory: {
    [ROLES.ADMIN]: 'F',
    [ROLES.DOCTOR]: '-',
    [ROLES.RECEPTIONIST]: '-',
    [ROLES.PHARMACIST]: 'F',
    [ROLES.BILLING_STAFF]: '-',
  },
  reports_dashboard: {
    [ROLES.ADMIN]: 'F',
    [ROLES.DOCTOR]: '-',
    [ROLES.RECEPTIONIST]: '-',
    [ROLES.PHARMACIST]: '-',
    [ROLES.BILLING_STAFF]: 'R',
  },
  user_configuration: {
    [ROLES.ADMIN]: 'F',
    [ROLES.DOCTOR]: '-',
    [ROLES.RECEPTIONIST]: '-',
    [ROLES.PHARMACIST]: '-',
    [ROLES.BILLING_STAFF]: '-',
  },
  audit_logs: {
    [ROLES.ADMIN]: 'R',
    [ROLES.DOCTOR]: '-',
    [ROLES.RECEPTIONIST]: '-',
    [ROLES.PHARMACIST]: '-',
    [ROLES.BILLING_STAFF]: '-',
  },
};

/**
 * Sidebar menu items mapped to module IDs allowed per role.
 * Derived directly from SRS Section 4 Matrix.
 */
export const ROLE_MENU_CONFIG = {
  [ROLES.ADMIN]: [
    'dashboard',
    'patients',
    'doctors',
    'staff',
    'appointments',
    'prescriptions',
    'medical-history',
    'billing',
    'inventory',
    'reports',
    'audit-logs',
    'settings',
  ],
  [ROLES.DOCTOR]: [
    'dashboard',
    'patients',
    'doctors',
    'appointments',
    'prescriptions',
    'medical-history',
    'settings',
  ],
  [ROLES.RECEPTIONIST]: [
    'dashboard',
    'patients',
    'doctors',
    'appointments',
    'settings',
  ],
  [ROLES.PHARMACIST]: [
    'dashboard',
    'patients',
    'inventory',
    'settings',
  ],
  [ROLES.BILLING_STAFF]: [
    'dashboard',
    'patients',
    'billing',
    'reports',
    'settings',
  ],
};

/**
 * Check if a given role has access permission for a module
 */
export const hasPermission = (role, moduleKey) => {
  const perm = ROLE_PERMISSIONS[moduleKey]?.[role];
  return perm && perm !== '-';
};
