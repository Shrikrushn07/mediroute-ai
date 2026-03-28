/**
 * Greedy Hospital Scoring Algorithm
 *
 * Computes a composite score for each hospital based on:
 *   1. Treatment cost    (lower is better)
 *   2. Distance from user (lower is better)
 *   3. Hospital rating   (higher is better)
 *
 * Formula:
 *   score = w_cost × (1 - normCost) + w_dist × (1 - normDist) + w_rating × normRating
 *
 * where normX = (X - minX) / (maxX - minX)  [0..1 min-max normalization]
 *
 * "Greedy" rationale:
 *   We make a locally optimal decision for each hospital in a single pass —
 *   scoring each one based on all available information without backtracking.
 *   This is O(n) per scoring pass, making it very efficient.
 *
 * Complexity:
 *   scoreHospitals()  — O(n)        (single pass to score)
 *   rank()            — O(n log n)  (sort by score)
 *   Total             — O(n log n)
 *
 * Default weights (tunable via environment or API param):
 *   COST_WEIGHT   = 0.50  — Financial burden is primary concern
 *   DIST_WEIGHT   = 0.30  — Time/travel is secondary
 *   RATING_WEIGHT = 0.20  — Quality matters but secondary to cost/distance
 */

const DEFAULT_WEIGHTS = {
  cost: 0.50,
  distance: 0.30,
  rating: 0.20,
};

/**
 * Normalize a value to [0, 1] range using min-max normalization.
 * Returns 0.5 if all values are equal (avoid division by zero).
 *
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number} normalized value in [0, 1]
 */
function normalize(value, min, max) {
  if (max === min) return 0.5; // all equal — neutral score
  return (value - min) / (max - min);
}

/**
 * Score and rank hospitals using weighted composite scoring.
 *
 * @param {Array<Object>} hospitals - hospital objects with:
 *   - estimated_cost: number (cost for requested treatment, or Infinity if unknown)
 *   - distance_km: number (distance from user)
 *   - rating: number (0–5 scale)
 *   - beds_available: number
 * @param {Object} options
 * @param {boolean} options.emergency - if true, filter out hospitals with 0 beds
 * @param {Object} options.weights - override default weights {cost, distance, rating}
 * @returns {Array<Object>} hospitals sorted by score DESC, each with .score field
 *
 * Complexity: O(n log n)
 */
function scoreAndRankHospitals(hospitals, options = {}) {
  const { emergency = false, weights = DEFAULT_WEIGHTS } = options;

  // Validate weights sum (warn if not 1.0, but proceed)
  const weightSum = (weights.cost || 0) + (weights.distance || 0) + (weights.rating || 0);
  if (Math.abs(weightSum - 1.0) > 0.01) {
    console.warn(`[greedy] Warning: weights sum to ${weightSum}, not 1.0. Scores may be outside [0,1].`);
  }

  // --- Step 1: Filter by emergency (beds > 0 required) --- O(n)
  let candidates = emergency
    ? hospitals.filter(h => h.beds_available > 0)
    : hospitals;

  if (candidates.length === 0) {
    console.warn('[greedy] No candidates after filtering. Relaxing emergency filter.');
    candidates = hospitals; // fallback: return all even if 0 beds
  }

  // --- Step 2: Compute min/max for normalization --- O(n)
  // Use Infinity cost as a penalty (capped at 2x max known cost)
  const knownCosts = candidates
    .map(h => h.estimated_cost)
    .filter(c => c !== null && c !== undefined && isFinite(c));

  const maxKnownCost = knownCosts.length ? Math.max(...knownCosts) : 1000000;
  const penaltyCost = maxKnownCost * 2; // unknown cost = penalty

  const costs = candidates.map(h =>
    h.estimated_cost != null && isFinite(h.estimated_cost) ? h.estimated_cost : penaltyCost
  );
  const distances = candidates.map(h => h.distance_km || 0);
  const ratings = candidates.map(h => h.rating || 0);

  const minCost = Math.min(...costs);
  const maxCost = Math.max(...costs);
  const minDist = Math.min(...distances);
  const maxDist = Math.max(...distances);
  const minRating = Math.min(...ratings);
  const maxRating = Math.max(...ratings);

  // --- Step 3: Score each hospital (single pass) --- O(n)
  const scored = candidates.map((h, i) => {
    const normCost = normalize(costs[i], minCost, maxCost);
    const normDist = normalize(distances[i], minDist, maxDist);
    const normRating = normalize(ratings[i], minRating, maxRating);

    // Higher score = better hospital
    // Invert cost and distance (lower is better → higher score)
    const score =
      weights.cost * (1 - normCost) +
      weights.distance * (1 - normDist) +
      weights.rating * normRating;

    return {
      ...h,
      _normCost: normCost,
      _normDist: normDist,
      _normRating: normRating,
      score: Math.round(score * 1000) / 1000, // round to 3 decimal places
      cost_used: costs[i],
    };
  });

  // --- Step 4: Sort by score descending --- O(n log n)
  scored.sort((a, b) => b.score - a.score);

  return scored;
}

/**
 * Get the single best recommendation from a scored list.
 * @param {Array<Object>} scoredHospitals - output of scoreAndRankHospitals
 * @returns {Object|null} top-scoring hospital
 */
function getTopRecommendation(scoredHospitals) {
  return scoredHospitals.length > 0 ? scoredHospitals[0] : null;
}

/**
 * Emergency fast-path: use priority queue to find hospital with best availability.
 * Returns hospital with most beds that also has lowest travel distance.
 *
 * @param {Array<Object>} hospitals
 * @returns {Object|null}
 */
function emergencyFastPick(hospitals) {
  const PriorityQueue = require('./priorityQueue');

  // Priority queue ordered by beds_available DESC, then distance ASC
  const pq = new PriorityQueue((a, b) => {
    if (b.beds_available !== a.beds_available) {
      return b.beds_available - a.beds_available; // more beds = higher priority
    }
    return a.distance_km - b.distance_km; // closer = higher priority
  });

  for (const h of hospitals) {
    if (h.beds_available > 0) {
      pq.push(h);
    }
  }

  return pq.isEmpty() ? null : pq.pop();
}

module.exports = {
  scoreAndRankHospitals,
  getTopRecommendation,
  emergencyFastPick,
  normalize,
  DEFAULT_WEIGHTS,
};
