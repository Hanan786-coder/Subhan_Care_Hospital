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
    console.error('FATAL: JWT_SECRET environment variable is not set. Server cannot start securely.');
    process.exit(1);
  }

  // In production, require MONGO_URI and enforce TLS/SSL connection
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.MONGO_URI) {
      console.error('FATAL: MONGO_URI environment variable is required in production mode. Server cannot start.');
      process.exit(1);
    }
  }

  mongoose.set('bufferCommands', true);

  if (process.env.MONGO_URI) {
    try {
      const uri = process.env.MONGO_URI.replace('localhost', '127.0.0.1');
      const isProduction = process.env.NODE_ENV === 'production';
      
      const connectOptions = {
        serverSelectionTimeoutMS: 5000,
        ...(isProduction && uri.includes('mongodb+srv://') ? { tls: true } : {})
      };

      const conn = await mongoose.connect(uri, connectOptions);
      console.log(`MongoDB Connected: ${conn.connection.host}`);
      await autoSeedIfEmpty();
      return;
    } catch (error) {
      if (process.env.NODE_ENV === 'production') {
        console.error('FATAL: Production MongoDB connection failed:', error.message);
        process.exit(1);
      }
      console.warn(`Local MongoDB not available. Switching seamlessly to MongoMemoryServer for development...`);
    }
  }

  if (process.env.NODE_ENV === 'production') {
    console.error('FATAL: In-memory database is disabled in production. A valid MONGO_URI is required.');
    process.exit(1);
  }

  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const mongod = await Promise.race([
      MongoMemoryServer.create(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('MongoMemoryServer startup timed out (10s)')), 10000))
    ]);
    const uri = mongod.getUri();
    await mongoose.connect(uri);
    console.log('MongoMemoryServer active (in-memory development database)');
    await autoSeedIfEmpty();
  } catch (memError) {
    console.warn(`MongoMemoryServer unavailable: ${memError.message}. Running in offline mode.`);
  }
};

module.exports = connectDB;
