/**
 * Validators and Formatters Utility
 * Functions to validate and format inputs like CNIC.
 */

// Auto-formats CNIC to XXXXX-XXXXXXX-X (Feature 2.1)
const formatCNIC = (cnicString) => {
  // Remove non-numeric characters
  const cleaned = cnicString.replace(/\D/g, '');
  
  if (cleaned.length !== 13) {
    throw new Error('CNIC must be 13 digits long');
  }

  // Format: XXXXX-XXXXXXX-X
  return `${cleaned.slice(0, 5)}-${cleaned.slice(5, 12)}-${cleaned.slice(12)}`;
};

const validateEmail = (email) => {
  const re = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  return re.test(email);
};

const validatePasswordComplexity = (password) => {
  // Minimum 8 characters, at least one uppercase letter, one lowercase letter, one number and one special character
  const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return re.test(password);
};

const formatErrorMessage = (error) => {
  if (!error) return 'An unexpected error occurred';
  if (typeof error === 'string') return error;

  if (error.name === 'CastError') {
    return `Invalid format provided for ${error.path || 'reference ID'}`;
  }

  if (error.name === 'ValidationError') {
    const messages = Object.values(error.errors || {}).map(e => e.message);
    return messages.length > 0 ? messages.join(', ') : 'Validation failed for submitted data';
  }

  if (error.code === 11000) {
    const keys = Object.keys(error.keyPattern || {});
    return `A record with this ${keys.join(', ') || 'field'} already exists`;
  }

  if (error.message && error.message.includes('Cast to ObjectId failed')) {
    return 'Invalid reference ID format provided';
  }

  return error.message || 'An internal error occurred while processing the request';
};

/**
 * Returns a safe error message for API responses.
 * In development: returns the actual error message for debugging.
 * In production: returns a generic message to prevent leaking internals.
 */
const safeErrorMessage = (error) => {
  if (process.env.NODE_ENV !== 'production') {
    return error.message || 'An internal error occurred';
  }
  return 'An internal error occurred while processing the request';
};

module.exports = {
  formatCNIC,
  validateEmail,
  validatePasswordComplexity,
  formatErrorMessage,
  safeErrorMessage
};

