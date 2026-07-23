/**
 * ID Generation Utility
 * Generates unique formatted IDs for different entities.
 */
const User = require('../models/User');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Staff = require('../models/Staff');

const generateId = async (entity) => {
  let model, prefix;
  switch (entity) {
    case 'User':
      model = User;
      prefix = 'SC-USR-';
      break;
    case 'Patient':
      model = Patient;
      prefix = 'SC-PAT-';
      break;
    case 'Doctor':
      model = Doctor;
      prefix = 'SC-DOC-';
      break;
    case 'Staff':
      model = Staff;
      prefix = 'SC-STF-';
      break;
    default:
      throw new Error('Invalid entity for ID generation');
  }

  // A simple auto-increment sequence based on counting documents.
  // In a high concurrency environment, a separate Counter collection is better, 
  // but this suffices for the scope.
  const count = await model.countDocuments();
  const nextNumber = count + 1;
  const paddedNumber = String(nextNumber).padStart(5, '0');
  
  return `${prefix}${paddedNumber}`;
};

module.exports = { generateId };
