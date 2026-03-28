/**
 * Sorting Utilities for Hospital Lists
 *
 * Wraps JavaScript's Array.prototype.sort (V8 TimSort — stable, O(n log n))
 * with named, readable sort functions for hospital data.
 *
 * TimSort is a hybrid of merge sort + insertion sort.
 * It is stable: equal elements maintain their original relative order.
 *
 * Complexity: O(n log n) average and worst case
 * Space: O(n) for TimSort auxiliary storage
 */

/**
 * Sort hospitals by estimated cost (ascending — cheapest first).
 * Hospitals with unknown/null cost are pushed to the end.
 *
 * @param {Array<Object>} hospitals
 * @returns {Array<Object>} new sorted array (non-mutating)
 */
function sortByCost(hospitals) {
  return [...hospitals].sort((a, b) => {
    const costA = a.estimated_cost ?? Infinity;
    const costB = b.estimated_cost ?? Infinity;
    return costA - costB;
  });
}

/**
 * Sort hospitals by distance (ascending — nearest first).
 *
 * @param {Array<Object>} hospitals
 * @returns {Array<Object>} new sorted array
 */
function sortByDistance(hospitals) {
  return [...hospitals].sort((a, b) => {
    const dA = a.distance_km ?? Infinity;
    const dB = b.distance_km ?? Infinity;
    return dA - dB;
  });
}

/**
 * Sort hospitals by rating (descending — highest first).
 *
 * @param {Array<Object>} hospitals
 * @returns {Array<Object>} new sorted array
 */
function sortByRating(hospitals) {
  return [...hospitals].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
}

/**
 * Sort hospitals by composite score (descending — best first).
 * Assumes hospitals already have a .score field from greedy scoring.
 *
 * @param {Array<Object>} hospitals
 * @returns {Array<Object>} new sorted array
 */
function sortByScore(hospitals) {
  return [...hospitals].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
}

/**
 * Sort hospitals by beds available (descending — most beds first).
 * Useful for emergency mode.
 *
 * @param {Array<Object>} hospitals
 * @returns {Array<Object>} new sorted array
 */
function sortByBeds(hospitals) {
  return [...hospitals].sort((a, b) => (b.beds_available ?? 0) - (a.beds_available ?? 0));
}

/**
 * Generic stable sort with a key extractor and direction.
 *
 * @param {Array<Object>} arr
 * @param {string} key - field name to sort by
 * @param {'asc'|'desc'} direction
 * @returns {Array<Object>} new sorted array
 */
function sortByField(arr, key, direction = 'asc') {
  const multiplier = direction === 'desc' ? -1 : 1;
  return [...arr].sort((a, b) => {
    const va = a[key] ?? (direction === 'asc' ? Infinity : -Infinity);
    const vb = b[key] ?? (direction === 'asc' ? Infinity : -Infinity);
    if (va < vb) return -1 * multiplier;
    if (va > vb) return 1 * multiplier;
    return 0; // stable: equal elements keep original order
  });
}

module.exports = {
  sortByCost,
  sortByDistance,
  sortByRating,
  sortByScore,
  sortByBeds,
  sortByField,
};
