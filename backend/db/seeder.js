/**
 * Seeder Script
 *
 * Usage:
 *   node backend/db/seeder.js
 *
 * Seeds the MongoDB database from /database/hospitals.json.
 * If MONGODB_URI is not set, outputs a summary of the local JSON data.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const fs = require('fs');
const DATA_PATH = path.join(__dirname, '../../database/hospitals.json');

async function seed() {
  const raw = fs.readFileSync(DATA_PATH, 'utf-8');
  const hospitals = JSON.parse(raw);

  console.log(`[seeder] Found ${hospitals.length} hospitals in hospitals.json`);

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.log('[seeder] No MONGODB_URI set — showing local data summary:\n');
    const cities = [...new Set(hospitals.map(h => h.city))];
    cities.forEach(city => {
      const count = hospitals.filter(h => h.city === city).length;
      console.log(`  ${city}: ${count} hospitals`);
    });
    console.log('\n[seeder] To use MongoDB, set MONGODB_URI in .env and rerun.');
    return;
  }

  try {
    const mongoose = require('mongoose');
    const { HospitalModel } = require('../models/hospitalModel');

    await mongoose.connect(mongoUri);
    console.log('[seeder] Connected to MongoDB');

    await HospitalModel.deleteMany({});
    const inserted = await HospitalModel.insertMany(hospitals);
    console.log(`[seeder] ✅ Inserted ${inserted.length} hospitals into MongoDB`);

    await mongoose.disconnect();
    console.log('[seeder] Disconnected from MongoDB');
  } catch (err) {
    console.error('[seeder] Error:', err.message);
    process.exit(1);
  }
}

seed();
