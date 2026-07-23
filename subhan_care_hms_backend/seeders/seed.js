/**
 * Database Seeder
 * Populates database with demo users for all 5 roles.
 */
require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const User = require('../models/User');

const seedUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    await User.deleteMany(); // Clear existing

    const users = [
      {
        userId: 'SC-USR-00001',
        name: 'Admin User',
        email: 'admin@subhancare.com',
        passwordHash: 'admin123',
        role: 'ADMIN'
      },
      {
        userId: 'SC-USR-00002',
        name: 'Dr. Sarah Ahmed',
        email: 'doctor@subhancare.com',
        passwordHash: 'doctor123',
        role: 'DOCTOR'
      },
      {
        userId: 'SC-USR-00003',
        name: 'Receptionist Ali',
        email: 'reception@subhancare.com',
        passwordHash: 'reception123',
        role: 'RECEPTIONIST'
      },
      {
        userId: 'SC-USR-00004',
        name: 'Pharmacist Bilal',
        email: 'pharmacy@subhancare.com',
        passwordHash: 'pharmacy123',
        role: 'PHARMACIST'
      },
      {
        userId: 'SC-USR-00005',
        name: 'Billing Staff Zara',
        email: 'billing@subhancare.com',
        passwordHash: 'billing123',
        role: 'BILLING_STAFF'
      }
    ];

    for (let u of users) {
      await User.create(u);
    }

    console.log('Database seeded with demo users');
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seedUsers();
