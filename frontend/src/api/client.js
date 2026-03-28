/**
 * API client — all backend calls go through here.
 * Base URL reads from Vite env var or defaults to localhost:5000.
 */

import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

/**
 * Fetch hospitals filtered by city and treatment.
 *
 * @param {Object} params
 * @param {string} params.city
 * @param {string} params.treatment
 * @param {boolean} params.live - use Google Places live data
 * @param {string} params.sort - 'score' | 'cost' | 'distance' | 'rating'
 * @param {number} [params.lat]
 * @param {number} [params.lng]
 * @param {boolean} [params.emergency]
 */
export async function fetchHospitals({ city, treatment, live = false, sort = 'score', lat, lng, emergency = false }) {
  const params = { city, treatment, live, sort, emergency };
  if (lat) params.lat = lat;
  if (lng) params.lng = lng;
  const res = await client.get('/hospitals', { params });
  return res.data;
}

/**
 * Fetch recommendation and route.
 *
 * @param {Object} params
 * @param {number} params.lat - user latitude
 * @param {number} params.lng - user longitude
 * @param {string} params.treatment
 * @param {string} [params.city]
 * @param {boolean} [params.emergency]
 */
export async function fetchRecommendation({ lat, lng, treatment, city, emergency = false }) {
  const res = await client.get('/recommendation', {
    params: { lat, lng, treatment, city, emergency },
  });
  return res.data;
}

/**
 * Trigger database seed.
 */
export async function seedDatabase() {
  const res = await client.post('/seed');
  return res.data;
}

export default client;
