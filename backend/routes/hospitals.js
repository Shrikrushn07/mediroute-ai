/**
 * Hospital Routes
 * Mounted at /api in server.js
 *
 * GET  /api/hospitals       → list + filter hospitals
 * GET  /api/recommendation  → get best recommendation with route
 * POST /api/seed            → seed DB from hospitals.json
 */

const express = require('express');
const router = express.Router();
const { getHospitals, getRecommendation, seedDatabase } = require('../controllers/hospitalsController');

// List hospitals filtered by city, treatment, and optionally live data
router.get('/hospitals', getHospitals);

// Get recommendation with Dijkstra route
router.get('/recommendation', getRecommendation);

// Seed database
router.post('/seed', seedDatabase);

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = router;
