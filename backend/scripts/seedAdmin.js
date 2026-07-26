/**
 * One-time admin seed script.
 * Run: node backend/scripts/seedAdmin.js
 *
 * This hashes the admin password with bcrypt and upserts the admin document
 * into the MongoDB `users` collection.
 *
 * Change ADMIN_USERNAME and ADMIN_PASSWORD below before running,
 * or set them as environment variables.
 */
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const User     = require('../models/User');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const ADMIN_USERNAME = process.env.SEED_USERNAME || 'sudhan';
const ADMIN_PASSWORD = process.env.SEED_PASSWORD || 'Sudhan@21';

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/sr-finance');
    console.log('✅ Connected to MongoDB');

    const hash = await bcrypt.hash(ADMIN_PASSWORD, 12);
    const result = await User.findOneAndUpdate(
      { username: ADMIN_USERNAME },
      { username: ADMIN_USERNAME, password: hash },
      { upsert: true, new: true }
    );

    console.log(`✅ Admin user seeded: "${result.username}"`);
    console.log('   Password has been bcrypt-hashed (12 rounds).');
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seed();
