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

module.exports = {
  formatCNIC,
  validateEmail,
  validatePasswordComplexity
};
