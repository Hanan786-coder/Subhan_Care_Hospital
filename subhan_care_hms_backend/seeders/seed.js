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
const Appointment = require('../models/Appointment');
const Consultation = require('../models/Consultation');
const Prescription = require('../models/Prescription');
const MedicalHistory = require('../models/MedicalHistory');
const Supplier = require('../models/Supplier');
const InventoryItem = require('../models/InventoryItem');
const Invoice = require('../models/Invoice');

const seedUsers = async () => {
  try {
    if (mongoose.connection.readyState !== 1 && process.env.MONGO_URI) {
      await mongoose.connect(process.env.MONGO_URI);
    }

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

    const doctorRecord = await Doctor.findOne({ doctorId: 'SC-DOC-00001' });
    const doctorUser = await User.findOne({ role: 'DOCTOR' });
    if (doctorUser && doctorRecord) {
      doctorUser.linkedEntityId = doctorRecord._id;
      doctorUser.entityModel = 'Doctor';
      await doctorUser.save();

      doctorRecord.userId = doctorUser._id;
      await doctorRecord.save();
    }

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

    const patientRecord = await Patient.findOne({ patientId: 'SC-PAT-00001' });

    await Supplier.deleteMany();
    const suppliers = await Supplier.create([
      {
        supplierId: 'SC-SUP-00001',
        name: 'MediCare Distributors',
        contactPerson: 'Ahsan Khan',
        phone: '0300-3334444',
        email: 'orders@medicare.example',
        address: 'Lahore'
      },
      {
        supplierId: 'SC-SUP-00002',
        name: 'HealthLine Supplies',
        contactPerson: 'Sara Noor',
        phone: '0301-5556666',
        email: 'sales@healthline.example',
        address: 'Karachi'
      }
    ]);

    await InventoryItem.deleteMany();
    const inventoryItems = await InventoryItem.create([
      {
        itemId: 'SC-INV-00001',
        name: 'Paracetamol 500mg',
        category: 'Medicine',
        batchNumber: 'PCT-2026-01',
        expiryDate: new Date('2027-06-30'),
        quantityInStock: 250,
        reorderThreshold: 50,
        unitPrice: 12,
        supplierId: suppliers[0]._id,
        location: 'Pharmacy Rack A'
      },
      {
        itemId: 'SC-INV-00002',
        name: 'Amoxicillin 250mg',
        category: 'Medicine',
        batchNumber: 'AMX-2026-03',
        expiryDate: new Date('2026-09-15'),
        quantityInStock: 18,
        reorderThreshold: 40,
        unitPrice: 35,
        supplierId: suppliers[1]._id,
        location: 'Pharmacy Rack B'
      },
      {
        itemId: 'SC-INV-00003',
        name: 'Gauze Roll',
        category: 'Medical Supply',
        batchNumber: 'GR-2026-02',
        expiryDate: new Date('2026-08-20'),
        quantityInStock: 12,
        reorderThreshold: 20,
        unitPrice: 80,
        supplierId: suppliers[0]._id,
        location: 'Store Room'
      }
    ]);

    await Appointment.deleteMany();
    const appointments = await Appointment.create([
      {
        appointmentId: 'SC-APT-00001',
        patientId: patientRecord._id,
        doctorId: doctorRecord._id,
        date: new Date('2026-08-05'),
        timeSlot: { start: '09:00', end: '09:30' },
        status: 'Completed',
        createdBy: (await User.findOne({ role: 'RECEPTIONIST' }))._id
      },
      {
        appointmentId: 'SC-APT-00002',
        patientId: patientRecord._id,
        doctorId: doctorRecord._id,
        date: new Date('2026-08-06'),
        timeSlot: { start: '10:00', end: '10:30' },
        status: 'Scheduled',
        createdBy: (await User.findOne({ role: 'RECEPTIONIST' }))._id
      }
    ]);

    await Consultation.deleteMany();
    const consultation = await Consultation.create([
      {
        consultationId: 'SC-CON-00001',
        appointmentId: appointments[0]._id,
        patientId: patientRecord._id,
        doctorId: doctorRecord._id,
        symptoms: ['Fever', 'Headache'],
        diagnosis: 'Seasonal viral infection',
        notes: 'Patient advised rest and hydration. No red flags.',
        followUpInstructions: 'Return if fever persists beyond 3 days.',
        status: 'Completed',
        createdBy: (await User.findOne({ role: 'DOCTOR' }))._id,
        completedAt: new Date('2026-08-05T10:00:00Z')
      }
    ]);

    await Prescription.deleteMany();
    const prescription = await Prescription.create([
      {
        prescriptionId: 'SC-RX-00001',
        consultationId: consultation[0]._id,
        appointmentId: appointments[0]._id,
        patientId: patientRecord._id,
        doctorId: doctorRecord._id,
        items: [
          { medicineName: 'Paracetamol 500mg', dosage: '1 tablet', frequency: 'Twice daily', duration: '5 days', instructions: 'After meals', quantity: 10 },
          { medicineName: 'Amoxicillin 250mg', dosage: '1 capsule', frequency: 'Three times daily', duration: '5 days', instructions: 'Complete course', quantity: 15 }
        ],
        status: 'Dispensed',
        issuedAt: new Date('2026-08-05T09:15:00Z'),
        dispensedAt: new Date('2026-08-05T11:00:00Z'),
        createdBy: (await User.findOne({ role: 'DOCTOR' }))._id
      }
    ]);

    await MedicalHistory.deleteMany();
    await MedicalHistory.create([
      {
        consultationId: consultation[0]._id,
        patientId: patientRecord._id,
        doctorId: doctorRecord._id,
        visitDate: new Date('2026-08-05T09:15:00Z'),
        symptoms: ['Fever', 'Headache'],
        diagnosis: 'Seasonal viral infection',
        notes: 'Patient advised rest and hydration. No red flags.',
        prescriptions: [{ prescriptionId: prescription[0]._id, prescriptionNumber: prescription[0].prescriptionId, summary: 'Paracetamol 500mg, Amoxicillin 250mg' }],
        followUpInstructions: 'Return if fever persists beyond 3 days.',
        version: 1,
        createdBy: (await User.findOne({ role: 'DOCTOR' }))._id
      }
    ]);

    await Invoice.deleteMany();
    await Invoice.create([
      {
        invoiceId: 'SC-INVOC-00001',
        patientId: patientRecord._id,
        appointmentId: appointments[0]._id,
        consultationId: consultation[0]._id,
        prescriptionId: prescription[0]._id,
        items: [
          { type: 'Consultation', description: 'Consultation fee', quantity: 1, unitPrice: 1500, amount: 1500 },
          { type: 'Medicine', description: 'Paracetamol 500mg', quantity: 10, unitPrice: 12, amount: 120 },
          { type: 'Medicine', description: 'Amoxicillin 250mg', quantity: 15, unitPrice: 35, amount: 525 }
        ],
        paymentMethod: 'Cash',
        status: 'Partially Paid',
        subtotal: 2145,
        discount: 0,
        tax: 0,
        total: 2145,
        amountPaid: 1500,
        balanceDue: 645,
        issuedBy: (await User.findOne({ role: 'BILLING_STAFF' }))._id,
        issuedAt: new Date('2026-08-05T11:15:00Z')
      }
    ]);

    console.log('Database seeded with demo users, doctors, staff, patients, appointments, consultations, prescriptions, history, inventory, suppliers, and invoices!');
    return true;
  } catch (error) {
    console.error('Error during database seeding:', error);
    throw error;
  }
};

if (require.main === module) {
  seedUsers().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = seedUsers;
