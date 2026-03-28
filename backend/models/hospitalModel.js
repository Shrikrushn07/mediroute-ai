/**
 * Hospital data model.
 * - If MongoDB is connected: uses Mongoose schema.
 * - If MongoDB is not connected: exports a fallback loader from hospitals.json.
 */

const path = require('path');
const fs = require('fs');

// ── Mongoose Schema (used when MongoDB is available) ──────────────────────────

let HospitalModel = null;

try {
  const mongoose = require('mongoose');

  const treatmentCostSchema = new mongoose.Schema(
    {},
    { strict: false } // allows arbitrary treatment: cost entries
  );

  const hospitalSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    city: { type: String, required: true, index: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    treatments: { type: [String], default: [] },
    cost_map: { type: Map, of: Number, default: {} },
    rating: { type: Number, min: 0, max: 5, default: 0 },
    beds_available: { type: Number, min: 0, default: 0 },
    phone: { type: String, default: '' },
  });

  // Virtual: get cost for a specific treatment
  hospitalSchema.methods.getCostForTreatment = function (treatment) {
    if (!treatment) return null;
    return this.cost_map.get(treatment.toLowerCase()) || null;
  };

  // Static: find by city (case-insensitive)
  hospitalSchema.statics.findByCity = function (city) {
    return this.find({ city: new RegExp(`^${city}$`, 'i') });
  };

  HospitalModel = mongoose.model('Hospital', hospitalSchema);
} catch (err) {
  // mongoose not installed or connection failed — model stays null
  HospitalModel = null;
}

// ── Fallback JSON Loader ───────────────────────────────────────────────────────

const JSON_PATH = path.join(__dirname, '../../database/hospitals.json');

/**
 * Load all hospitals from local JSON file.
 * @returns {Array<Object>}
 */
function loadFromJSON() {
  try {
    const raw = fs.readFileSync(JSON_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('[hospitalModel] Failed to load hospitals.json:', err.message);
    return [];
  }
}

/**
 * Load hospitals filtered by city from JSON.
 * @param {string} city
 * @returns {Array<Object>}
 */
function loadByCityFromJSON(city) {
  const all = loadFromJSON();
  if (!city) return all;
  return all.filter(h => h.city.toLowerCase() === city.toLowerCase());
}

/**
 * Get a hospital by id from JSON.
 * @param {string} id
 * @returns {Object|null}
 */
function getByIdFromJSON(id) {
  const all = loadFromJSON();
  return all.find(h => h.id === id) || null;
}

module.exports = {
  HospitalModel,
  loadFromJSON,
  loadByCityFromJSON,
  getByIdFromJSON,
};
