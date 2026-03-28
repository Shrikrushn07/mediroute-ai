/**
 * Central configuration loader.
 * All environment variables are read here — never scattered across the codebase.
 * If a variable is missing, a fallback default is used and a warning is logged.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const config = {
  // Server
  PORT: parseInt(process.env.PORT, 10) || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',

  // Database (optional — falls back to hospitals.json if not set)
  MONGODB_URI: process.env.MONGODB_URI || null,

  // External API keys (all optional — graceful fallback if missing)
  GOOGLE_PLACES_API_KEY: process.env.GOOGLE_PLACES_API_KEY || null,
  MAPBOX_TOKEN: process.env.MAPBOX_TOKEN || null,
  OPENROUTESERVICE_KEY: process.env.OPENROUTESERVICE_KEY || null,

  // Feature flags derived from presence of API keys
  get hasGooglePlaces() {
    return !!this.GOOGLE_PLACES_API_KEY;
  },
  get hasMapbox() {
    return !!this.MAPBOX_TOKEN;
  },
  get hasORS() {
    return !!this.OPENROUTESERVICE_KEY;
  },
  get hasMongoDB() {
    return !!this.MONGODB_URI;
  },
};

// Warn about missing optional keys at startup
if (!config.GOOGLE_PLACES_API_KEY) {
  console.warn('[config] ⚠️  GOOGLE_PLACES_API_KEY not set — live hospital data disabled. Using local hospitals.json');
}
if (!config.MAPBOX_TOKEN && !config.OPENROUTESERVICE_KEY) {
  console.warn('[config] ⚠️  No routing API key set — using Euclidean Dijkstra approximation for routes.');
}
if (!config.MONGODB_URI) {
  console.warn('[config] ⚠️  MONGODB_URI not set — using local JSON file as data store.');
}

module.exports = config;
