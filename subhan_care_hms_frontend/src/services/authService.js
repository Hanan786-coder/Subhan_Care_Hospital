import api from './api';

/**
 * Subhan Care HMS — Mock Authentication Service
 * 
 * Demo accounts for testing RBAC per SRS Section 4:
 * 
 *   admin@subhancare.com      → ADMIN (full system access)
 *   dr.ahmed@subhancare.com   → DOCTOR (clinical access)
 *   reception@subhancare.com  → RECEPTIONIST (front-desk access)
 *   pharma@subhancare.com     → PHARMACIST (inventory + prescriptions)
 *   billing@subhancare.com    → BILLING_STAFF (invoices + payments)
 * 
 * Password for all: password123
 * Or login with ANY email/password → defaults to ADMIN role.
 */

const MOCK_USERS = {
  'admin@subhancare.com': {
    id: 'usr-001',
    name: 'Muhammad Subhan',
    email: 'admin@subhancare.com',
    role: 'ADMIN',
    designation: 'System Administrator',
  },
  'dr.ahmed@subhancare.com': {
    id: 'usr-002',
    name: 'Dr. Ahmed Khan',
    email: 'dr.ahmed@subhancare.com',
    role: 'DOCTOR',
    designation: 'Cardiologist',
    licenseNumber: 'PMC-12345',
    specialization: 'Cardiology',
  },
  'reception@subhancare.com': {
    id: 'usr-003',
    name: 'Ayesha Siddiqui',
    email: 'reception@subhancare.com',
    role: 'RECEPTIONIST',
    designation: 'Front Desk Receptionist',
  },
  'pharma@subhancare.com': {
    id: 'usr-004',
    name: 'Ali Hassan',
    email: 'pharma@subhancare.com',
    role: 'PHARMACIST',
    designation: 'Chief Pharmacist',
  },
  'billing@subhancare.com': {
    id: 'usr-005',
    name: 'Fatima Zahra',
    email: 'billing@subhancare.com',
    role: 'BILLING_STAFF',
    designation: 'Billing & Finance Officer',
  },
};

/**
 * Log in a user with credentials.
 * @param {Object} credentials - { email, password }
 * @returns {Promise<Object>} The response data containing token and user info.
 */
export const loginUser = async (credentials) => {
  // MOCK: Simulate network delay
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!credentials.email || !credentials.password) {
        reject(new Error('Email and password are required.'));
        return;
      }

      // Look up email in mock database
      const mockUser = MOCK_USERS[credentials.email.toLowerCase()];

      if (mockUser) {
        resolve({
          token: 'mock-jwt-token-12345',
          user: { ...mockUser },
        });
      } else {
        // Any unknown email defaults to ADMIN for easy testing
        resolve({
          token: 'mock-jwt-token-12345',
          user: {
            id: 'usr-999',
            name: 'Demo User',
            email: credentials.email,
            role: 'ADMIN',
            designation: 'Administrator',
          },
        });
      }
    }, 800);
  });
};

/**
 * Request a password reset OTP.
 * @param {string} email
 * @returns {Promise<Object>}
 */
export const forgotPassword = async (email) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ message: 'OTP sent successfully to ' + email });
    }, 800);
  });
};

/**
 * Verify OTP sent to the user's email.
 * @param {string} email
 * @param {string} otp
 * @returns {Promise<Object>}
 */
export const verifyOtp = async (email, otp) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Accept any 6-digit OTP for demo
      resolve({ message: 'OTP verified successfully' });
    }, 800);
  });
};

/**
 * Reset password with a new password.
 * @param {Object} payload - { email, otp, newPassword }
 * @returns {Promise<Object>}
 */
export const resetPassword = async (payload) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ message: 'Password reset successful' });
    }, 800);
  });
};

/**
 * Get the currently authenticated user's details.
 * @returns {Promise<Object>}
 */
export const getCurrentUser = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const savedUser = localStorage.getItem('sc_hms_user');
      if (savedUser) {
        resolve(JSON.parse(savedUser));
      } else {
        resolve(MOCK_USERS['admin@subhancare.com']);
      }
    }, 300);
  });
};
