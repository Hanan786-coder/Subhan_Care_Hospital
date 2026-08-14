/**
 * Database connection setup
 * Connects to MongoDB using Mongoose with MongoMemoryServer fallback and auto-seeding.
 */
const mongoose = require('mongoose');

const autoSeedIfEmpty = async () => {
  try {
    const User = require('../models/User');
    const Patient = require('../models/Patient');
    const AuditLog = require('../models/AuditLog');
    const userCount = await User.countDocuments();
    const johnDoe = await Patient.findOne({ fullName: 'John Doe' });
    const auditCount = await AuditLog.countDocuments();

    if (userCount === 0 || johnDoe || auditCount === 0) {
      console.log('Seeding initial database records with demo users, doctors, staff, patients, appointments, consultations, prescriptions, history, inventory, suppliers, and invoices!');
      const seedUsers = require('../seeders/seed');
      await seedUsers();
    }
  } catch (seedErr) {
    console.warn('Auto-seeding check skipped:', seedErr.message);
  }
};

const connectDB = async () => {
  if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = 'subhan_care_hms_jwt_secret_key_2026';
  }

  mongoose.set('bufferCommands', true);

  if (process.env.MONGO_URI) {
    try {
      const uri = process.env.MONGO_URI.replace('localhost', '127.0.0.1');
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 1500
      });
      console.log(`MongoDB Connected: ${conn.connection.host}`);
      await autoSeedIfEmpty();
      return;
    } catch (error) {
      console.warn(`Local MongoDB not detected on port 27017 (${error.message}). Switching seamlessly to MongoMemoryServer...`);
    }
  }

  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const mongod = await Promise.race([
      MongoMemoryServer.create(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('MongoMemoryServer startup timed out (10s)')), 10000))
    ]);
    const uri = mongod.getUri();
    await mongoose.connect(uri);
    console.log(`MongoMemoryServer active at ${uri}`);
    await autoSeedIfEmpty();
  } catch (memError) {
    console.warn(`MongoMemoryServer unavailable: ${memError.message}. Running in offline mode.`);
  }
};

module.exports = connectDB;
