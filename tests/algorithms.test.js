/**
 * Algorithm Tests — MediRoute AI
 *
 * Tests:
 *   1. PriorityQueue (binary min-heap)
 *   2. Dijkstra shortest path
 *   3. Greedy scoring and ranking
 *
 * Run: npm test  (from /tests directory)
 *      or: npx jest from project root
 */

const path = require('path');
const PriorityQueue = require('../backend/algorithms/priorityQueue');
const { dijkstra, reconstructPath, buildEuclideanGraph, haversineDistance } = require('../backend/algorithms/dijkstra');
const { scoreAndRankHospitals, normalize, emergencyFastPick } = require('../backend/algorithms/greedy');
const { sortByCost, sortByDistance, sortByRating } = require('../backend/algorithms/sorting');

// ─────────────────────────────────────────────
// Priority Queue Tests
// ─────────────────────────────────────────────
describe('Priority Queue (Binary Min-Heap)', () => {
  test('pushes and pops in ascending priority order', () => {
    const pq = new PriorityQueue();
    pq.push({ priority: 5, value: 'e' });
    pq.push({ priority: 1, value: 'a' });
    pq.push({ priority: 3, value: 'c' });
    pq.push({ priority: 2, value: 'b' });
    pq.push({ priority: 4, value: 'd' });

    expect(pq.pop().priority).toBe(1);
    expect(pq.pop().priority).toBe(2);
    expect(pq.pop().priority).toBe(3);
    expect(pq.pop().priority).toBe(4);
    expect(pq.pop().priority).toBe(5);
  });

  test('handles single element push and pop', () => {
    const pq = new PriorityQueue();
    pq.push({ priority: 42, node: 'only' });
    expect(pq.size()).toBe(1);
    expect(pq.pop().node).toBe('only');
    expect(pq.isEmpty()).toBe(true);
  });

  test('handles duplicate priorities (stable extraction)', () => {
    const pq = new PriorityQueue();
    pq.push({ priority: 1, node: 'A' });
    pq.push({ priority: 1, node: 'B' });
    pq.push({ priority: 1, node: 'C' });
    // All have same priority — all should be extractable
    const results = [];
    while (!pq.isEmpty()) results.push(pq.pop().priority);
    expect(results).toEqual([1, 1, 1]);
  });

  test('peek returns minimum without removing', () => {
    const pq = new PriorityQueue();
    pq.push({ priority: 10, node: 'X' });
    pq.push({ priority: 2, node: 'Y' });
    expect(pq.peek().priority).toBe(2);
    expect(pq.size()).toBe(2); // peek should not remove
  });

  test('returns null when popping empty queue', () => {
    const pq = new PriorityQueue();
    expect(pq.pop()).toBeNull();
  });

  test('handles large number of elements', () => {
    const pq = new PriorityQueue();
    const N = 1000;
    // Push in reverse order
    for (let i = N; i >= 1; i--) pq.push({ priority: i });
    // Should come out in ascending order
    let prev = 0;
    while (!pq.isEmpty()) {
      const curr = pq.pop().priority;
      expect(curr).toBeGreaterThanOrEqual(prev);
      prev = curr;
    }
  });

  test('supports custom comparator (max-heap)', () => {
    const maxHeap = new PriorityQueue((a, b) => b.priority - a.priority);
    maxHeap.push({ priority: 1 });
    maxHeap.push({ priority: 5 });
    maxHeap.push({ priority: 3 });
    expect(maxHeap.pop().priority).toBe(5); // max first
  });
});

// ─────────────────────────────────────────────
// Dijkstra Tests
// ─────────────────────────────────────────────
describe("Dijkstra's Shortest Path", () => {
  /**
   * Graph:
   *  A --1-- B --2-- C
   *  |               |
   *  4               1
   *  |               |
   *  D ------3------ E
   *
   * Shortest A->E: A->B->C->E = 1+2+1 = 4
   * Shortest A->D: A->D = 4
   */
  function buildTestGraph() {
    return new Map([
      ['A', [{ to: 'B', weight: 1 }, { to: 'D', weight: 4 }]],
      ['B', [{ to: 'A', weight: 1 }, { to: 'C', weight: 2 }]],
      ['C', [{ to: 'B', weight: 2 }, { to: 'E', weight: 1 }]],
      ['D', [{ to: 'A', weight: 4 }, { to: 'E', weight: 3 }]],
      ['E', [{ to: 'C', weight: 1 }, { to: 'D', weight: 3 }]],
    ]);
  }

  test('finds correct shortest distances from source A', () => {
    const graph = buildTestGraph();
    const { dist } = dijkstra(graph, 'A');
    expect(dist.get('A')).toBe(0);
    expect(dist.get('B')).toBe(1);
    expect(dist.get('C')).toBe(3);
    expect(dist.get('D')).toBe(4);
    expect(dist.get('E')).toBe(4);
  });

  test('reconstructs correct shortest path A -> E', () => {
    const graph = buildTestGraph();
    const { prev } = dijkstra(graph, 'A');
    const path = reconstructPath(prev, 'A', 'E');
    // Shortest path: A -> B -> C -> E (cost 4)
    expect(path).toEqual(['A', 'B', 'C', 'E']);
  });

  test('returns Infinity for unreachable nodes', () => {
    const graph = new Map([
      ['A', [{ to: 'B', weight: 1 }]],
      ['B', []],
      ['C', []], // disconnected
    ]);
    const { dist } = dijkstra(graph, 'A');
    expect(dist.get('C')).toBe(Infinity);
  });

  test('handles single-node graph', () => {
    const graph = new Map([['A', []]]);
    const { dist, prev } = dijkstra(graph, 'A');
    expect(dist.get('A')).toBe(0);
    expect(prev.get('A')).toBeNull();
  });

  test('handles direct edge (two-node graph)', () => {
    const graph = new Map([
      ['A', [{ to: 'B', weight: 7 }]],
      ['B', [{ to: 'A', weight: 7 }]],
    ]);
    const { dist } = dijkstra(graph, 'A');
    expect(dist.get('B')).toBe(7);
  });

  test('buildEuclideanGraph creates edges between all node pairs', () => {
    const nodes = [
      { id: 'user', lat: 12.9716, lng: 77.5946 },
      { id: 'H1', lat: 12.8456, lng: 77.5968 },
      { id: 'H2', lat: 12.9562, lng: 77.6491 },
    ];
    const graph = buildEuclideanGraph(nodes);
    expect(graph.size).toBe(3);
    expect(graph.get('user').length).toBe(2); // connected to H1 and H2
    expect(graph.get('H1').length).toBe(2);
  });

  test('haversineDistance returns reasonable km distance', () => {
    // Bangalore to approximate 1km away
    const dist = haversineDistance(12.9716, 77.5946, 12.9716, 77.6046);
    expect(dist).toBeGreaterThan(0.5);
    expect(dist).toBeLessThan(5);
  });
});

// ─────────────────────────────────────────────
// Greedy Scoring Tests
// ─────────────────────────────────────────────
describe('Greedy Scoring & Ranking', () => {
  const sampleHospitals = [
    { id: 'H1', name: 'Cheap Near Bad',  estimated_cost: 50000,  distance_km: 2,  rating: 3.0, beds_available: 5 },
    { id: 'H2', name: 'Mid Mid Good',    estimated_cost: 100000, distance_km: 5,  rating: 4.5, beds_available: 10 },
    { id: 'H3', name: 'Expensive Far Best', estimated_cost: 300000, distance_km: 15, rating: 5.0, beds_available: 20 },
    { id: 'H4', name: 'Cheap Far Mid',   estimated_cost: 60000,  distance_km: 12, rating: 4.0, beds_available: 3 },
    { id: 'H5', name: 'No Cost',         estimated_cost: null,   distance_km: 1,  rating: 4.2, beds_available: 2 },
  ];

  test('all hospitals receive a score between 0 and 1', () => {
    const scored = scoreAndRankHospitals(sampleHospitals);
    scored.forEach(h => {
      expect(h.score).toBeGreaterThanOrEqual(0);
      expect(h.score).toBeLessThanOrEqual(1);
    });
  });

  test('hospitals are sorted by score descending', () => {
    const scored = scoreAndRankHospitals(sampleHospitals);
    for (let i = 1; i < scored.length; i++) {
      expect(scored[i - 1].score).toBeGreaterThanOrEqual(scored[i].score);
    }
  });

  test('emergency mode filters out hospitals with 0 beds', () => {
    const hospitalsWithZeroBeds = [
      { id: 'A', estimated_cost: 10000, distance_km: 1, rating: 4.5, beds_available: 0 },
      { id: 'B', estimated_cost: 20000, distance_km: 2, rating: 4.0, beds_available: 5 },
    ];
    const scored = scoreAndRankHospitals(hospitalsWithZeroBeds, { emergency: true });
    expect(scored.every(h => h.beds_available > 0)).toBe(true);
    expect(scored.length).toBe(1);
    expect(scored[0].id).toBe('B');
  });

  test('normalize returns 0.5 when all values are equal', () => {
    expect(normalize(5, 5, 5)).toBe(0.5);
  });

  test('normalize maps min to 0, max to 1', () => {
    expect(normalize(0, 0, 10)).toBe(0);
    expect(normalize(10, 0, 10)).toBe(1);
    expect(normalize(5, 0, 10)).toBe(0.5);
  });

  test('custom weights are respected', () => {
    const twoHospitals = [
      { id: 'CheapFar',  estimated_cost: 10000,  distance_km: 50, rating: 3.0, beds_available: 5 },
      { id: 'ExpNear',   estimated_cost: 500000, distance_km: 1,  rating: 4.0, beds_available: 5 },
    ];
    // With 100% weight on distance, nearest should win
    const distanceOnly = scoreAndRankHospitals(twoHospitals, { weights: { cost: 0, distance: 1.0, rating: 0 } });
    expect(distanceOnly[0].id).toBe('ExpNear');
    // With 100% weight on cost, cheapest should win
    const costOnly = scoreAndRankHospitals(twoHospitals, { weights: { cost: 1.0, distance: 0, rating: 0 } });
    expect(costOnly[0].id).toBe('CheapFar');
  });

  test('emergencyFastPick returns hospital with most beds', () => {
    const hospitals = [
      { id: 'A', beds_available: 5, distance_km: 10 },
      { id: 'B', beds_available: 20, distance_km: 5 },
      { id: 'C', beds_available: 1, distance_km: 2 },
    ];
    const pick = emergencyFastPick(hospitals);
    expect(pick.id).toBe('B'); // most beds
  });
});

// ─────────────────────────────────────────────
// Sorting Tests
// ─────────────────────────────────────────────
describe('Sorting Utilities', () => {
  const hospitals = [
    { id: 'A', estimated_cost: 300000, distance_km: 2, rating: 4.5 },
    { id: 'B', estimated_cost: 100000, distance_km: 8, rating: 3.2 },
    { id: 'C', estimated_cost: 200000, distance_km: 5, rating: 4.8 },
    { id: 'D', estimated_cost: null,   distance_km: 1, rating: 4.0 },
  ];

  test('sortByCost: cheapest first, null last', () => {
    const sorted = sortByCost(hospitals);
    expect(sorted[0].id).toBe('B');
    expect(sorted[1].id).toBe('C');
    expect(sorted[2].id).toBe('A');
    expect(sorted[3].id).toBe('D'); // null cost → Infinity → last
  });

  test('sortByDistance: nearest first', () => {
    const sorted = sortByDistance(hospitals);
    expect(sorted[0].id).toBe('D'); // 1 km
    expect(sorted[1].id).toBe('A'); // 2 km
  });

  test('sortByRating: highest rated first', () => {
    const sorted = sortByRating(hospitals);
    expect(sorted[0].id).toBe('C'); // 4.8
    expect(sorted[1].id).toBe('A'); // 4.5
  });

  test('sort does not mutate original array', () => {
    const original = [...hospitals];
    sortByCost(hospitals);
    expect(hospitals[0].id).toBe(original[0].id);
  });
});
