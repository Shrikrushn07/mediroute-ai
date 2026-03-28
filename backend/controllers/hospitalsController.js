/**
 * Hospitals Controller
 *
 * Business logic for:
 *   GET /hospitals      — list hospitals filtered by city/treatment
 *   GET /recommendation — ranked recommendation with route
 *   POST /seed          — seed database
 */

const config = require('../config');
const { loadByCityFromJSON, HospitalModel } = require('../models/hospitalModel');
const { findShortestPaths, haversineDistance } = require('../algorithms/dijkstra');
const { scoreAndRankHospitals, getTopRecommendation, emergencyFastPick } = require('../algorithms/greedy');
const { sortByCost, sortByDistance, sortByRating, sortByScore } = require('../algorithms/sorting');

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Fetch hospitals from Google Places Nearby Search API.
 * Falls back to empty array if key not present or request fails.
 *
 * @param {string} city - city name for keyword search
 * @param {number} lat - center latitude
 * @param {number} lng - center longitude
 * @returns {Promise<Array>} raw Google Places results
 */
async function fetchLiveHospitals(city, lat = 12.9716, lng = 77.5946) {
  if (!config.hasGooglePlaces) return [];

  const url =
    `https://maps.googleapis.com/maps/api/place/nearbysearch/json` +
    `?location=${lat},${lng}&radius=20000&type=hospital&keyword=${encodeURIComponent(city + ' hospital')}` +
    `&key=${config.GOOGLE_PLACES_API_KEY}`;

  try {
    const fetch = (await import('node-fetch')).default;
    const res = await fetch(url);
    const data = await res.json();
    return data.results || [];
  } catch (err) {
    console.error('[controller] Google Places fetch failed:', err.message);
    return [];
  }
}

/**
 * Merge Google Places result with local cost data.
 * If a local hospital matches by name proximity, use its cost_map.
 *
 * @param {Array} liveResults - Google Places results
 * @param {string} treatment - requested treatment
 * @param {Array} localData - local hospitals.json records
 * @returns {Array} normalized hospital objects
 */
function mergeLiveWithLocal(liveResults, treatment, localData) {
  return liveResults.map((place, i) => {
    // Try to match with local dataset by name similarity
    const localMatch = localData.find(l =>
      l.name.toLowerCase().includes(place.name.split(' ')[0].toLowerCase())
    );

    const cost_map = localMatch ? localMatch.cost_map : {};
    const estimated_cost = cost_map[treatment] ?? null;

    return {
      id: `LIVE_${i}`,
      name: place.name,
      city: place.vicinity || '',
      lat: place.geometry.location.lat,
      lng: place.geometry.location.lng,
      treatments: Object.keys(cost_map),
      cost_map,
      rating: place.rating || 3.0,
      beds_available: localMatch ? localMatch.beds_available : 5,
      phone: '',
      estimated_cost,
      source: 'live',
    };
  });
}

/**
 * Get estimated cost for a treatment from a hospital record.
 * @param {Object} hospital
 * @param {string} treatment
 * @returns {number|null}
 */
function getEstimatedCost(hospital, treatment) {
  if (!treatment) return null;
  const t = treatment.toLowerCase();
  // Handle both Map (Mongoose) and plain Object (JSON)
  if (hospital.cost_map instanceof Map) {
    return hospital.cost_map.get(t) ?? null;
  }
  return hospital.cost_map[t] ?? null;
}

// ── Controller Functions ──────────────────────────────────────────────────────

/**
 * GET /hospitals?city=X&treatment=Y&live=false&sort=score
 *
 * Returns list of hospitals in city, enriched with:
 *   - estimated_cost for the requested treatment
 *   - distance_km (requires lat/lng query params, else 0)
 *   - score (greedy composite score)
 */
async function getHospitals(req, res) {
  try {
    const {
      city,
      treatment,
      live = 'false',
      sort = 'score',
      lat,
      lng,
      emergency = 'false',
    } = req.query;

    const isLive = live === 'true';
    const isEmergency = emergency === 'true';
    const userLat = parseFloat(lat) || null;
    const userLng = parseFloat(lng) || null;

    let hospitals = [];
    let dataSource = 'local';

    // ── Fetch hospital list ──
    if (isLive && config.hasGooglePlaces) {
      console.log(`[controller] Fetching live hospitals for ${city}...`);
      const liveResults = await fetchLiveHospitals(city, userLat, userLng);
      const localData = loadByCityFromJSON(city);
      hospitals = mergeLiveWithLocal(liveResults, treatment, localData);
      dataSource = liveResults.length > 0 ? 'live' : 'local';
      if (liveResults.length === 0) {
        console.warn('[controller] Live fetch returned 0 results — falling back to local JSON.');
        hospitals = loadByCityFromJSON(city);
      }
    } else {
      hospitals = loadByCityFromJSON(city);
      if (isLive && !config.hasGooglePlaces) {
        console.warn('[controller] live=true requested but GOOGLE_PLACES_API_KEY not set.');
      }
    }

    if (!hospitals.length) {
      return res.status(404).json({
        error: 'No hospitals found',
        city,
        dataSource,
      });
    }

    // ── Enrich with estimated_cost ──
    hospitals = hospitals.map(h => ({
      ...h,
      estimated_cost: treatment ? getEstimatedCost(h, treatment) : null,
    }));

    // ── Compute distances if user location provided ──
    if (userLat && userLng) {
      const pathResults = findShortestPaths(
        { lat: userLat, lng: userLng },
        hospitals
      );
      const distMap = {};
      pathResults.forEach(r => {
        distMap[r.hospitalId] = r.distance_km;
      });
      hospitals = hospitals.map(h => ({
        ...h,
        distance_km: Math.round((distMap[h.id] || 0) * 10) / 10,
      }));
    } else {
      // No user location — set distance to 0 (unknown)
      hospitals = hospitals.map(h => ({ ...h, distance_km: 0 }));
    }

    // ── Score hospitals ──
    const scored = scoreAndRankHospitals(hospitals, { emergency: isEmergency });

    // ── Sort by requested field ──
    let sorted;
    switch (sort) {
      case 'cost':
        sorted = sortByCost(scored);
        break;
      case 'distance':
        sorted = sortByDistance(scored);
        break;
      case 'rating':
        sorted = sortByRating(scored);
        break;
      default:
        sorted = sortByScore(scored); // default: composite score
    }

    res.json({
      count: sorted.length,
      dataSource,
      liveAvailable: config.hasGooglePlaces,
      hospitals: sorted,
    });
  } catch (err) {
    console.error('[controller] getHospitals error:', err);
    res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
}

/**
 * GET /recommendation?lat=X&lng=Y&treatment=Z&emergency=false
 *
 * Returns:
 *   - recommended: top-scored hospital
 *   - route: Dijkstra path from user to recommended hospital
 *   - all_scored: all hospitals sorted by score
 */
async function getRecommendation(req, res) {
  try {
    const {
      lat,
      lng,
      treatment,
      city,
      emergency = 'false',
    } = req.query;

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const isEmergency = emergency === 'true';

    if (isNaN(userLat) || isNaN(userLng)) {
      return res.status(400).json({ error: 'lat and lng are required query parameters.' });
    }

    // Load hospitals — use city filter if provided
    let hospitals = city ? loadByCityFromJSON(city) : loadByCityFromJSON(null);
    if (!hospitals.length) {
      // If no city filter, load all
      const { loadFromJSON } = require('../models/hospitalModel');
      hospitals = loadFromJSON();
    }

    // Enrich with cost
    hospitals = hospitals.map(h => ({
      ...h,
      estimated_cost: treatment ? getEstimatedCost(h, treatment) : null,
    }));

    // Compute Dijkstra distances from user to all hospitals
    const pathResults = findShortestPaths(
      { lat: userLat, lng: userLng },
      hospitals
    );

    // Build distance and path lookup
    const distMap = {};
    const pathMap = {};
    pathResults.forEach(r => {
      distMap[r.hospitalId] = r.distance_km;
      pathMap[r.hospitalId] = r.path;
    });

    // Enrich hospitals with distances
    hospitals = hospitals.map(h => ({
      ...h,
      distance_km: Math.round((distMap[h.id] || 0) * 10) / 10,
    }));

    // Emergency fast-path
    if (isEmergency) {
      const fastest = emergencyFastPick(hospitals);
      if (fastest) {
        const path = pathMap[fastest.id] || ['user', fastest.id];
        return res.json({
          mode: 'emergency',
          recommended: fastest,
          route: buildRouteResponse(path, hospitals, { lat: userLat, lng: userLng }),
          all_scored: hospitals,
        });
      }
    }

    // Score and rank
    const scored = scoreAndRankHospitals(hospitals, { emergency: isEmergency });
    const recommended = getTopRecommendation(scored);

    if (!recommended) {
      return res.status(404).json({ error: 'No recommendation available.' });
    }

    // Build route for recommended hospital
    const path = pathMap[recommended.id] || ['user', recommended.id];
    const route = buildRouteResponse(path, hospitals, { lat: userLat, lng: userLng });

    // Try real routing if provider available
    let realRoute = null;
    if (config.hasMapbox || config.hasORS) {
      realRoute = await fetchRealRoute(
        { lat: userLat, lng: userLng },
        { lat: recommended.lat, lng: recommended.lng }
      );
    }

    res.json({
      mode: 'normal',
      recommended,
      route: realRoute || route,
      routeType: realRoute ? 'provider' : 'euclidean',
      all_scored: scored,
    });
  } catch (err) {
    console.error('[controller] getRecommendation error:', err);
    res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
}

/**
 * Build a route response object from a Dijkstra path.
 *
 * @param {string[]} path - array of node IDs ['user', 'BLR001', ...]
 * @param {Array} hospitals - all hospitals
 * @param {{lat,lng}} userLocation
 * @returns {Object} route object with waypoints and total distance
 */
function buildRouteResponse(path, hospitals, userLocation) {
  const hospitalMap = {};
  hospitals.forEach(h => { hospitalMap[h.id] = h; });

  const waypoints = path.map(nodeId => {
    if (nodeId === 'user') return [userLocation.lat, userLocation.lng];
    const h = hospitalMap[nodeId];
    return h ? [h.lat, h.lng] : null;
  }).filter(Boolean);

  // Compute total distance along waypoints
  let totalDist = 0;
  for (let i = 1; i < waypoints.length; i++) {
    totalDist += haversineDistance(
      waypoints[i-1][0], waypoints[i-1][1],
      waypoints[i][0], waypoints[i][1]
    );
  }

  return {
    path,
    waypoints,
    total_distance_km: Math.round(totalDist * 10) / 10,
    type: 'euclidean',
  };
}

/**
 * Fetch real route from Mapbox or OpenRouteService.
 * Returns null if no provider key available or request fails.
 *
 * @param {{lat,lng}} from
 * @param {{lat,lng}} to
 * @returns {Promise<Object|null>}
 */
async function fetchRealRoute(from, to) {
  try {
    const fetch = (await import('node-fetch')).default;

    if (config.hasMapbox) {
      const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${from.lng},${from.lat};${to.lng},${to.lat}?geometries=geojson&access_token=${config.MAPBOX_TOKEN}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.routes && data.routes[0]) {
        const route = data.routes[0];
        return {
          path: ['user', 'destination'],
          waypoints: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
          total_distance_km: Math.round((route.distance / 1000) * 10) / 10,
          duration_seconds: route.duration,
          type: 'mapbox',
        };
      }
    }

    if (config.hasORS) {
      const url = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${config.OPENROUTESERVICE_KEY}&start=${from.lng},${from.lat}&end=${to.lng},${to.lat}`;
      const res = await fetch(url);
      const data = await res.json();
      const coords = data.features?.[0]?.geometry?.coordinates;
      if (coords) {
        return {
          path: ['user', 'destination'],
          waypoints: coords.map(([lng, lat]) => [lat, lng]),
          total_distance_km: Math.round((data.features[0].properties.summary.distance / 1000) * 10) / 10,
          type: 'openrouteservice',
        };
      }
    }
  } catch (err) {
    console.warn('[controller] Real routing failed, using Euclidean:', err.message);
  }
  return null;
}

/**
 * POST /seed — seed database from hospitals.json
 */
async function seedDatabase(req, res) {
  try {
    const { loadFromJSON } = require('../models/hospitalModel');
    const hospitals = loadFromJSON();

    if (HospitalModel) {
      await HospitalModel.deleteMany({});
      await HospitalModel.insertMany(hospitals);
      return res.json({ message: `Seeded ${hospitals.length} hospitals to MongoDB.` });
    }

    // No MongoDB — just return the JSON data
    res.json({
      message: `No MongoDB configured. Local JSON has ${hospitals.length} hospitals.`,
      hospitals,
    });
  } catch (err) {
    console.error('[controller] seedDatabase error:', err);
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getHospitals,
  getRecommendation,
  seedDatabase,
};
