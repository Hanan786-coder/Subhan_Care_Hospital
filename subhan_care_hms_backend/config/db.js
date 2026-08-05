/**
 * Database connection setup
 * Connects to MongoDB using Mongoose with MongoMemoryServer fallback and auto-seeding.
 */
const mongoose = require('mongoose');

const autoSeedIfEmpty = async () => {
  try {
    const User = require('../models/User');
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('Seeding initial database records...');
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
      const conn = await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 5000
      });
      console.log(`MongoDB Connected: ${conn.connection.host}`);
      await autoSeedIfEmpty();
      return;
    } catch (error) {
      console.warn(`MongoDB connection failed (${error.message}). Trying MongoMemoryServer fallback...`);
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
