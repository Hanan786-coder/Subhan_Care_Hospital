/**
 * Database Seeder
 * Populates database with demo users, doctors, staff, patients, inventory, appointments,
 * consultations, prescriptions, history, invoices, and initial audit logs with Pakistani trial data.
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
const AuditLog = require('../models/AuditLog');

const seedUsers = async () => {
  try {
    if (mongoose.connection.readyState !== 1 && process.env.MONGO_URI) {
      await mongoose.connect(process.env.MONGO_URI);
    }

    // Clear existing collections
    await User.deleteMany();
    await Doctor.deleteMany();
    await Staff.deleteMany();
    await Patient.deleteMany();
    await Supplier.deleteMany();
    await InventoryItem.deleteMany();
    await Appointment.deleteMany();
    await Consultation.deleteMany();
    await Prescription.deleteMany();
    await MedicalHistory.deleteMany();
    await Invoice.deleteMany();
    await AuditLog.deleteMany();

    // 1. Seed Core Account Users
    const users = [
      {
        userId: 'SC-USR-00001',
        name: 'Abdul Hanan (Admin)',
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
        name: 'Dr. Muhammad Tariq Khan',
        email: 'doctor2@gmail.com',
        passwordHash: 'doctor123',
        role: 'DOCTOR'
      },
      {
        userId: 'SC-USR-00004',
        name: 'Ali Raza (Receptionist)',
        email: 'reception@gmail.com',
        passwordHash: 'reception123',
        role: 'RECEPTIONIST'
      },
      {
        userId: 'SC-USR-00005',
        name: 'Bilal Hassan (Pharmacist)',
        email: 'pharmacy@gmail.com',
        passwordHash: 'pharmacy123',
        role: 'PHARMACIST'
      },
      {
        userId: 'SC-USR-00006',
        name: 'Zara Sheikh (Billing Officer)',
        email: 'billing@gmail.com',
        passwordHash: 'billing123',
        role: 'BILLING_STAFF'
      }
    ];

    const createdUsers = {};
    for (let u of users) {
      const created = await User.create(u);
      createdUsers[u.role] = created;
      if (u.email === 'doctor2@gmail.com') createdUsers['DOCTOR2'] = created;
    }

    // 2. Seed Doctors
    const doctors = [
      {
        doctorId: 'SC-DOC-00001',
        fullName: 'Dr. Sarah Ahmed',
        specialization: 'Cardiology',
        qualification: 'MBBS, FCPS (Cardiology)',
        licenseNumber: 'PMDC-45812-P',
        contactInfo: { phone: '0300-1234567', email: 'doctor@gmail.com', address: 'Gulberg III, Lahore' },
        consultationFee: 2000,
        schedule: {
          monday: [{ start: '09:00', end: '13:00' }],
          wednesday: [{ start: '09:00', end: '13:00' }],
          friday: [{ start: '09:00', end: '13:00' }]
        }
      },
      {
        doctorId: 'SC-DOC-00002',
        fullName: 'Dr. Muhammad Tariq Khan',
        specialization: 'Neurology',
        qualification: 'MBBS, MD (Neurology)',
        licenseNumber: 'PMDC-89210-P',
        contactInfo: { phone: '0321-9876543', email: 'doctor2@gmail.com', address: 'Sector F-8, Islamabad' },
        consultationFee: 2500,
        schedule: {
          tuesday: [{ start: '10:00', end: '14:00' }],
          thursday: [{ start: '10:00', end: '14:00' }]
        }
      },
      {
        doctorId: 'SC-DOC-00003',
        fullName: 'Dr. Ayesha Siddiqui',
        specialization: 'Pediatrics',
        qualification: 'MBBS, DCH, FCPS',
        licenseNumber: 'PMDC-67123-P',
        contactInfo: { phone: '0333-4567890', email: 'ayesha.siddiqui@subhancare.com', address: 'DHA Phase 5, Karachi' },
        consultationFee: 1800,
        schedule: {
          monday: [{ start: '14:00', end: '18:00' }],
          wednesday: [{ start: '14:00', end: '18:00' }]
        }
      }
    ];

    const createdDoctors = await Doctor.create(doctors);

    // Link doctor users
    if (createdUsers['DOCTOR'] && createdDoctors[0]) {
      createdUsers['DOCTOR'].linkedEntityId = createdDoctors[0]._id;
      createdUsers['DOCTOR'].entityModel = 'Doctor';
      await createdUsers['DOCTOR'].save();

      createdDoctors[0].userId = createdUsers['DOCTOR']._id;
      await createdDoctors[0].save();
    }
    if (createdUsers['DOCTOR2'] && createdDoctors[1]) {
      createdUsers['DOCTOR2'].linkedEntityId = createdDoctors[1]._id;
      createdUsers['DOCTOR2'].entityModel = 'Doctor';
      await createdUsers['DOCTOR2'].save();

      createdDoctors[1].userId = createdUsers['DOCTOR2']._id;
      await createdDoctors[1].save();
    }

    // 3. Seed Staff
    const staffMembers = [
      {
        staffId: 'SC-STF-00001',
        fullName: 'Ali Raza',
        role: 'RECEPTIONIST',
        contactInfo: { phone: '0300-7654321', email: 'reception@gmail.com', address: 'Model Town, Lahore' },
        shiftTiming: { start: '08:00', end: '16:00', days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] }
      },
      {
        staffId: 'SC-STF-00002',
        fullName: 'Bilal Hassan',
        role: 'PHARMACIST',
        contactInfo: { phone: '0302-8889991', email: 'pharmacy@gmail.com', address: 'Johar Town, Lahore' },
        shiftTiming: { start: '09:00', end: '17:00', days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] }
      },
      {
        staffId: 'SC-STF-00003',
        fullName: 'Zara Sheikh',
        role: 'BILLING_STAFF',
        contactInfo: { phone: '0331-2223334', email: 'billing@gmail.com', address: 'DHA Phase 3, Lahore' },
        shiftTiming: { start: '09:00', end: '17:00', days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] }
      }
    ];

    const createdStaff = await Staff.create(staffMembers);

    // 4. Seed Patients (Authentic Pakistani trial data)
    const patients = [
      {
        patientId: 'SC-PAT-00001',
        fullName: 'Tariq Mehmood',
        dateOfBirth: new Date('1985-04-12'),
        gender: 'Male',
        cnic: '35202-1234567-1',
        contactNumber: '0300-1112223',
        address: 'House #42, Street 8, Allama Iqbal Town, Lahore',
        emergencyContact: { name: 'Shahida Mehmood', phone: '0300-2223334', relationship: 'Spouse' },
        occupation: 'Civil Engineer',
        bloodGroup: 'O+',
        allergies: [{ name: 'Penicillin', severity: 'Severe' }]
      },
      {
        patientId: 'SC-PAT-00002',
        fullName: 'Fatima Zahra',
        dateOfBirth: new Date('1992-08-25'),
        gender: 'Female',
        cnic: '35201-9876543-2',
        contactNumber: '0321-4445556',
        address: 'Flat 304, Al-Hafeez Heights, Gulberg III, Lahore',
        emergencyContact: { name: 'Ahmed Zahra', phone: '0321-5556667', relationship: 'Father' },
        occupation: 'School Teacher',
        bloodGroup: 'B+',
        allergies: [{ name: 'Pollen / Dust', severity: 'Moderate' }]
      },
      {
        patientId: 'SC-PAT-00003',
        fullName: 'Muhammad Usman',
        dateOfBirth: new Date('1978-11-05'),
        gender: 'Male',
        cnic: '61101-3456789-3',
        contactNumber: '0333-7778889',
        address: 'House 112, Sector G-9/2, Islamabad',
        emergencyContact: { name: 'Ayesha Usman', phone: '0333-8889990', relationship: 'Spouse' },
        occupation: 'Bank Manager',
        bloodGroup: 'A+',
        allergies: []
      },
      {
        patientId: 'SC-PAT-00004',
        fullName: 'Zainab Bibi',
        dateOfBirth: new Date('1998-02-18'),
        gender: 'Female',
        cnic: '42101-8765432-4',
        contactNumber: '0315-9990001',
        address: 'Block B, North Nazimabad, Karachi',
        emergencyContact: { name: 'Kamran Bibi', phone: '0315-1112223', relationship: 'Brother' },
        occupation: 'Software Developer',
        bloodGroup: 'AB+',
        allergies: [{ name: 'Sulfa Antibiotics', severity: 'Mild' }]
      },
      {
        patientId: 'SC-PAT-00005',
        fullName: 'Hamza Chaudhry',
        dateOfBirth: new Date('2001-06-30'),
        gender: 'Male',
        cnic: '35202-5554433-5',
        contactNumber: '0304-1122334',
        address: 'Wapda Town Phase 1, Lahore',
        emergencyContact: { name: 'Rashid Chaudhry', phone: '0304-2233445', relationship: 'Father' },
        occupation: 'University Student',
        bloodGroup: 'O-',
        allergies: []
      }
    ];

    const createdPatients = await Patient.create(patients);

    // 5. Seed Suppliers (Pakistani Pharmaceutical Companies)
    const suppliers = await Supplier.create([
      {
        supplierId: 'SC-SUP-00001',
        name: 'PharmEvo Pakistan Ltd',
        contactPerson: 'Ahsan Malik',
        phone: '0300-3334444',
        email: 'orders@pharmevo.biz.pk',
        address: 'Sundar Industrial Estate, Lahore'
      },
      {
        supplierId: 'SC-SUP-00002',
        name: 'Getz Pharma Pakistan',
        contactPerson: 'Kamran Akram',
        phone: '0321-5556666',
        email: 'supply@getzpharma.com.pk',
        address: 'Korangi Industrial Area, Karachi'
      },
      {
        supplierId: 'SC-SUP-00003',
        name: 'The Searle Company Ltd',
        contactPerson: 'Hassan Raza',
        phone: '0333-8889990',
        email: 'info@searle.com.pk',
        address: 'I-9 Industrial Area, Islamabad'
      }
    ]);

    // 6. Seed Inventory Items (Common Pakistani medicines)
    const inventoryItems = await InventoryItem.create([
      {
        itemId: 'SC-INV-00001',
        name: 'Panadol 500mg Tablets (Paracetamol)',
        category: 'Medicine',
        batchNumber: 'PND-2026-08',
        expiryDate: new Date('2028-01-31'),
        quantityInStock: 500,
        reorderThreshold: 100,
        unitPrice: 15,
        supplierId: suppliers[0]._id,
        location: 'Pharmacy Counter A'
      },
      {
        itemId: 'SC-INV-00002',
        name: 'Augmentin 625mg Tablets (Amoxicillin/Clavulanate)',
        category: 'Medicine',
        batchNumber: 'AUG-2026-03',
        expiryDate: new Date('2027-09-15'),
        quantityInStock: 150,
        reorderThreshold: 30,
        unitPrice: 280,
        supplierId: suppliers[1]._id,
        location: 'Pharmacy Counter B'
      },
      {
        itemId: 'SC-INV-00003',
        name: 'Brufen 400mg Tablets (Ibuprofen)',
        category: 'Medicine',
        batchNumber: 'BRF-2026-05',
        expiryDate: new Date('2027-11-20'),
        quantityInStock: 350,
        reorderThreshold: 50,
        unitPrice: 45,
        supplierId: suppliers[0]._id,
        location: 'Pharmacy Rack C'
      },
      {
        itemId: 'SC-INV-00004',
        name: 'Surbex Z Multivitamin Tablets',
        category: 'Medicine',
        batchNumber: 'SBX-2026-01',
        expiryDate: new Date('2027-06-30'),
        quantityInStock: 200,
        reorderThreshold: 40,
        unitPrice: 320,
        supplierId: suppliers[2]._id,
        location: 'Pharmacy Shelf D'
      },
      {
        itemId: 'SC-INV-00005',
        name: 'Disprin 300mg Tablets (Aspirin)',
        category: 'Medicine',
        batchNumber: 'DSP-2026-02',
        expiryDate: new Date('2027-12-15'),
        quantityInStock: 400,
        reorderThreshold: 80,
        unitPrice: 20,
        supplierId: suppliers[0]._id,
        location: 'Pharmacy Counter A'
      },
      {
        itemId: 'SC-INV-00006',
        name: 'Normal Saline Drip 1000ml',
        category: 'Medical Supply',
        batchNumber: 'NS-2026-09',
        expiryDate: new Date('2028-05-10'),
        quantityInStock: 60,
        reorderThreshold: 15,
        unitPrice: 220,
        supplierId: suppliers[1]._id,
        location: 'Emergency Store Room'
      },
      {
        itemId: 'SC-INV-00007',
        name: 'Sterile Gauze Bandage Roll 4x4',
        category: 'Medical Supply',
        batchNumber: 'GZ-2026-04',
        expiryDate: new Date('2029-02-28'),
        quantityInStock: 80,
        reorderThreshold: 20,
        unitPrice: 120,
        supplierId: suppliers[2]._id,
        location: 'General Store Room'
      }
    ]);

    // 7. Seed Appointments
    const appointments = await Appointment.create([
      {
        appointmentId: 'SC-APT-00001',
        patientId: createdPatients[0]._id,
        doctorId: createdDoctors[0]._id,
        date: new Date('2026-08-05'),
        timeSlot: { start: '09:00', end: '09:30' },
        status: 'Completed',
        createdBy: createdUsers['RECEPTIONIST']._id
      },
      {
        appointmentId: 'SC-APT-00002',
        patientId: createdPatients[1]._id,
        doctorId: createdDoctors[1]._id,
        date: new Date('2026-08-06'),
        timeSlot: { start: '10:00', end: '10:30' },
        status: 'Scheduled',
        createdBy: createdUsers['RECEPTIONIST']._id
      },
      {
        appointmentId: 'SC-APT-00003',
        patientId: createdPatients[2]._id,
        doctorId: createdDoctors[2]._id,
        date: new Date('2026-08-05'),
        timeSlot: { start: '14:30', end: '15:00' },
        status: 'Scheduled',
        createdBy: createdUsers['RECEPTIONIST']._id
      },
      {
        appointmentId: 'SC-APT-00004',
        patientId: createdPatients[3]._id,
        doctorId: createdDoctors[0]._id,
        date: new Date('2026-08-07'),
        timeSlot: { start: '11:00', end: '11:30' },
        status: 'Cancelled',
        createdBy: createdUsers['RECEPTIONIST']._id
      }
    ]);

    // 8. Seed Consultations
    const consultations = await Consultation.create([
      {
        consultationId: 'SC-CON-00001',
        appointmentId: appointments[0]._id,
        patientId: createdPatients[0]._id,
        doctorId: createdDoctors[0]._id,
        symptoms: ['Mild chest pressure', 'Shortness of breath on exertion', 'Fatigue'],
        diagnosis: 'Stage 1 Primary Essential Hypertension',
        notes: 'Blood pressure recorded at 142/92 mmHg. ECG clear. Lifestyle modifications & low sodium diet advised.',
        followUpInstructions: 'Monitor BP daily at home and return in 2 weeks.',
        status: 'Completed',
        createdBy: createdUsers['DOCTOR']._id,
        completedAt: new Date('2026-08-05T10:00:00Z')
      }
    ]);

    // 9. Seed Prescriptions
    const prescriptions = await Prescription.create([
      {
        prescriptionId: 'SC-RX-00001',
        consultationId: consultations[0]._id,
        appointmentId: appointments[0]._id,
        patientId: createdPatients[0]._id,
        doctorId: createdDoctors[0]._id,
        items: [
          { medicineName: 'Panadol 500mg Tablets', dosage: '1 tablet', frequency: 'Twice daily', duration: '5 days', instructions: 'After meals for mild headache', quantity: 10 },
          { medicineName: 'Surbex Z Multivitamin', dosage: '1 tablet', frequency: 'Once daily', duration: '30 days', instructions: 'Take in morning with breakfast', quantity: 30 }
        ],
        status: 'Dispensed',
        issuedAt: new Date('2026-08-05T09:40:00Z'),
        dispensedAt: new Date('2026-08-05T11:00:00Z'),
        createdBy: createdUsers['DOCTOR']._id
      }
    ]);

    // 10. Seed Medical History
    await MedicalHistory.create([
      {
        consultationId: consultations[0]._id,
        patientId: createdPatients[0]._id,
        doctorId: createdDoctors[0]._id,
        visitDate: new Date('2026-08-05T09:15:00Z'),
        symptoms: ['Mild chest pressure', 'Shortness of breath'],
        diagnosis: 'Stage 1 Primary Essential Hypertension',
        notes: 'Blood pressure 142/92 mmHg. Low sodium diet prescribed.',
        prescriptions: [
          {
            prescriptionId: prescriptions[0]._id,
            prescriptionNumber: prescriptions[0].prescriptionId,
            summary: 'Panadol 500mg, Surbex Z Multivitamin'
          }
        ],
        followUpInstructions: 'Monitor BP daily at home and return in 2 weeks.',
        version: 1,
        createdBy: createdUsers['DOCTOR']._id
      }
    ]);

    // 11. Seed Invoices
    await Invoice.create([
      {
        invoiceId: 'SC-INVOC-00001',
        patientId: createdPatients[0]._id,
        appointmentId: appointments[0]._id,
        consultationId: consultations[0]._id,
        prescriptionId: prescriptions[0]._id,
        items: [
          { type: 'Consultation', description: 'Specialist Consultation Fee (Dr. Sarah Ahmed)', quantity: 1, unitPrice: 2000, amount: 2000 },
          { type: 'Medicine', description: 'Panadol 500mg Tablets (10 tabs)', quantity: 10, unitPrice: 15, amount: 150 },
          { type: 'Medicine', description: 'Surbex Z Multivitamin Tablets (30 tabs)', quantity: 30, unitPrice: 10, amount: 300 }
        ],
        paymentMethod: 'Cash',
        status: 'Paid',
        subtotal: 2450,
        discount: 0,
        tax: 0,
        total: 2450,
        amountPaid: 2450,
        balanceDue: 0,
        issuedBy: createdUsers['BILLING_STAFF']._id,
        issuedAt: new Date('2026-08-05T11:15:00Z')
      },
      {
        invoiceId: 'SC-INVOC-00002',
        patientId: createdPatients[1]._id,
        appointmentId: appointments[1]._id,
        items: [
          { type: 'Consultation', description: 'Neurology Consultation Fee (Dr. Muhammad Tariq Khan)', quantity: 1, unitPrice: 2500, amount: 2500 }
        ],
        paymentMethod: 'Cash',
        status: 'Unpaid',
        subtotal: 2500,
        discount: 0,
        tax: 0,
        total: 2500,
        amountPaid: 0,
        balanceDue: 2500,
        issuedBy: createdUsers['BILLING_STAFF']._id,
        issuedAt: new Date('2026-08-05T12:00:00Z')
      }
    ]);

    // 12. Seed Initial System Audit Logs
    await AuditLog.create([
      {
        userId: createdUsers['ADMIN']._id,
        action: 'SYSTEM_INIT',
        affectedEntity: 'System',
        affectedRecordId: 'SYS-INIT-001',
        details: { message: 'Database initialized with demo Pakistani records & system configuration' },
        ipAddress: '127.0.0.1',
        timestamp: new Date('2026-08-05T08:00:00Z')
      },
      {
        userId: createdUsers['ADMIN']._id,
        action: 'LOGIN',
        affectedEntity: 'User',
        affectedRecordId: createdUsers['ADMIN'].userId,
        details: { email: createdUsers['ADMIN'].email, role: 'ADMIN' },
        ipAddress: '192.168.1.10',
        timestamp: new Date('2026-08-05T08:15:00Z')
      },
      {
        userId: createdUsers['RECEPTIONIST']._id,
        action: 'CREATE',
        affectedEntity: 'Patient',
        affectedRecordId: createdPatients[0].patientId,
        details: { patientName: 'Tariq Mehmood', cnic: '35202-1234567-1', registeredBy: 'Ali Raza' },
        ipAddress: '192.168.1.15',
        timestamp: new Date('2026-08-05T08:30:00Z')
      },
      {
        userId: createdUsers['RECEPTIONIST']._id,
        action: 'CREATE',
        affectedEntity: 'Appointment',
        affectedRecordId: appointments[0].appointmentId,
        details: { patientName: 'Tariq Mehmood', doctorName: 'Dr. Sarah Ahmed', status: 'Completed' },
        ipAddress: '192.168.1.15',
        timestamp: new Date('2026-08-05T08:45:00Z')
      },
      {
        userId: createdUsers['DOCTOR']._id,
        action: 'CREATE',
        affectedEntity: 'Consultation',
        affectedRecordId: consultations[0].consultationId,
        details: { diagnosis: 'Stage 1 Primary Essential Hypertension', doctor: 'Dr. Sarah Ahmed' },
        ipAddress: '192.168.1.20',
        timestamp: new Date('2026-08-05T09:30:00Z')
      },
      {
        userId: createdUsers['DOCTOR']._id,
        action: 'CREATE',
        affectedEntity: 'Prescription',
        affectedRecordId: prescriptions[0].prescriptionId,
        details: { patient: 'Tariq Mehmood', itemsCount: 2, status: 'Dispensed' },
        ipAddress: '192.168.1.20',
        timestamp: new Date('2026-08-05T09:40:00Z')
      },
      {
        userId: createdUsers['PHARMACIST']._id,
        action: 'UPDATE',
        affectedEntity: 'Prescription',
        affectedRecordId: prescriptions[0].prescriptionId,
        details: { status: 'Dispensed', pharmacist: 'Bilal Hassan' },
        ipAddress: '192.168.1.25',
        timestamp: new Date('2026-08-05T11:00:00Z')
      },
      {
        userId: createdUsers['BILLING_STAFF']._id,
        action: 'CREATE',
        affectedEntity: 'Invoice',
        affectedRecordId: 'SC-INVOC-00001',
        details: { patient: 'Tariq Mehmood', totalAmount: 2450, status: 'Paid' },
        ipAddress: '192.168.1.30',
        timestamp: new Date('2026-08-05T11:15:00Z')
      }
    ]);

    console.log('Database seeded with demo users, doctors, staff, patients, appointments, consultations, prescriptions, history, inventory, suppliers, invoices, and audit logs!');
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
