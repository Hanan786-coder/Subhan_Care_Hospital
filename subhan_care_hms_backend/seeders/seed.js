/**
 * Database Seeder
 * Populates database with demo users for all 5 roles.
 */
require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Staff = require('../models/Staff');
const Patient = require('../models/Patient');

const seedUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    await User.deleteMany(); // Clear existing

    const users = [
      {
        userId: 'SC-USR-00001',
        name: 'Admin User',
        email: 'admin@gmail.com',
        passwordHash: 'admin123',
        role: 'ADMIN'
      },
      {
        userId: 'SC-USR-00002',
        name: 'Dr. Sarah Ahmed',
        email: 'doctor@gmail.com',
        passwordHash: 'doctor123',
        role: 'DOCTOR'
      },
      {
        userId: 'SC-USR-00003',
        name: 'Receptionist Ali',
        email: 'reception@gmail.com',
        passwordHash: 'reception123',
        role: 'RECEPTIONIST'
      },
      {
        userId: 'SC-USR-00004',
        name: 'Pharmacist Bilal',
        email: 'pharmacy@gmail.com',
        passwordHash: 'pharmacy123',
        role: 'PHARMACIST'
      },
      {
        userId: 'SC-USR-00005',
        name: 'Billing Staff Zara',
        email: 'billing@gmail .com',
        passwordHash: 'billing123',
        role: 'BILLING_STAFF'
      }
    ];

    for (let u of users) {
      await User.create(u);
    }

    // Seed Doctors
    await Doctor.deleteMany();
    const doctors = [
      {
        doctorId: 'SC-DOC-00001',
        fullName: 'Dr. Sarah Ahmed',
        specialization: 'Cardiology',
        qualification: 'MBBS, FCPS',
        licenseNumber: 'PMDC-12345',
        contactInfo: { phone: '0300-1234567', email: 'doctor@subhancare.com', address: 'Lahore' },
        consultationFee: 1500,
        schedule: { monday: [{ start: '09:00', end: '13:00' }] }
      }
    ];
    await Doctor.create(doctors);

    // Seed Staff
    await Staff.deleteMany();
    const staff = [
      {
        staffId: 'SC-STF-00001',
        fullName: 'Receptionist Ali',
        role: 'RECEPTIONIST',
        contactInfo: { phone: '0300-7654321', email: 'reception@subhancare.com', address: 'Lahore' },
        shiftTiming: { start: '08:00', end: '16:00', days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] }
      }
    ];
    await Staff.create(staff);

    // Seed Patients
    await Patient.deleteMany();
    const patients = [
      {
        patientId: 'SC-PAT-00001',
        fullName: 'John Doe',
        dateOfBirth: new Date('1990-01-01'),
        gender: 'Male',
        cnic: '12345-1234567-1',
        contactNumber: '0300-1111111',
        address: '123 Main St, Lahore',
        emergencyContact: { name: 'Jane Doe', phone: '0300-2222222', relationship: 'Spouse' },
        occupation: 'Software Engineer',
        bloodGroup: 'O+',
        allergies: [{ name: 'Penicillin', severity: 'Severe' }]
      }
    ];
    await Patient.create(patients);

    console.log('Database seeded with demo users, doctors, staff, and patients!');
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seedUsers();
