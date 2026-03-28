/**
 * Dijkstra's Shortest Path Algorithm
 *
 * Finds shortest paths from a source node to all other nodes
 * in a weighted directed/undirected graph with non-negative edge weights.
 *
 * Used in MediRoute AI for:
 *   - Finding shortest distance from user location to each candidate hospital
 *   - Building optimal route waypoints for the map display
 *
 * Graph Construction (when no real road API available):
 *   Nodes = user location + hospitals
 *   Edges = Euclidean (Haversine) straight-line distances between every pair
 *   This creates a fully-connected graph — a reasonable approximation
 *   for ranking/routing in the absence of actual road network data.
 *
 * Complexity: O((V + E) log V)
 *   V = number of nodes (hospitals + user)
 *   E = number of edges (V*(V-1)/2 for fully connected graph)
 *   log V = heap operations per node
 *
 * Space: O(V + E)
 */

const PriorityQueue = require('./priorityQueue');

/**
 * Run Dijkstra from source node on an adjacency list graph.
 *
 * @param {Map<string, Array<{to: string, weight: number}>>} graph
 *        Adjacency list: nodeId -> [{to: nodeId, weight: number}]
 * @param {string} source - ID of the starting node
 * @returns {{ dist: Map<string,number>, prev: Map<string,string|null> }}
 *
 * @example
 * const graph = new Map([
 *   ['A', [{to:'B', weight:1}, {to:'C', weight:4}]],
 *   ['B', [{to:'C', weight:2}, {to:'D', weight:5}]],
 *   ['C', [{to:'D', weight:1}]],
 *   ['D', []]
 * ]);
 * const {dist, prev} = dijkstra(graph, 'A');
 * // dist.get('D') === 4  (A->B->C->D)
 */
function dijkstra(graph, source) {
  // Initialize distance map — all nodes start at Infinity
  const dist = new Map();
  // Previous node map for path reconstruction
  const prev = new Map();
  // Track visited nodes to skip stale heap entries
  const visited = new Set();

  // Initialize all nodes with Infinity distance
  for (const node of graph.keys()) {
    dist.set(node, Infinity);
    prev.set(node, null);
  }

  // Source node distance is 0
  dist.set(source, 0);

  // Min-heap: {priority: distance, node: id}
  const pq = new PriorityQueue((a, b) => a.priority - b.priority);
  pq.push({ priority: 0, node: source });

  // Main Dijkstra loop
  while (!pq.isEmpty()) {
    const { priority: currentDist, node: u } = pq.pop();

    // Skip stale entries (node already processed with shorter path)
    if (visited.has(u)) continue;
    visited.add(u);

    // If this entry is outdated, skip
    if (currentDist > dist.get(u)) continue;

    // Relax all edges from u
    const neighbors = graph.get(u) || [];
    for (const { to: v, weight } of neighbors) {
      if (visited.has(v)) continue;

      const newDist = dist.get(u) + weight;

      // Relaxation step: update if shorter path found
      if (newDist < (dist.get(v) ?? Infinity)) {
        dist.set(v, newDist);
        prev.set(v, u);
        pq.push({ priority: newDist, node: v });
      }
    }
  }

  return { dist, prev };
}

/**
 * Reconstruct the shortest path from source to target
 * using the prev map returned by dijkstra().
 *
 * @param {Map<string,string|null>} prev - previous node map
 * @param {string} source - start node ID
 * @param {string} target - end node ID
 * @returns {string[]} ordered array of node IDs from source to target,
 *                     or [] if no path exists
 *
 * Complexity: O(V) — at most V nodes in path
 */
function reconstructPath(prev, source, target) {
  const path = [];
  let current = target;

  // Walk backwards from target to source via prev pointers
  while (current !== null && current !== undefined) {
    path.unshift(current); // prepend to build path in correct order
    if (current === source) break;
    current = prev.get(current);
  }

  // If we didn't reach the source, no path exists
  if (path[0] !== source) return [];
  return path;
}

/**
 * Haversine distance between two lat/lng coordinates (in km).
 * Used to assign edge weights in the Euclidean graph approximation.
 *
 * @param {number} lat1
 * @param {number} lng1
 * @param {number} lat2
 * @param {number} lng2
 * @returns {number} distance in kilometers
 *
 * Complexity: O(1)
 */
function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

/**
 * Build a fully-connected Euclidean graph from a list of nodes.
 * Each node has: { id, lat, lng }
 * Edges connect every pair of nodes, weighted by Haversine distance.
 *
 * @param {Array<{id:string, lat:number, lng:number}>} nodes
 * @returns {Map<string, Array<{to:string, weight:number}>>} adjacency list
 *
 * Complexity: O(V²) to build — acceptable for small V (< 50 hospitals)
 */
function buildEuclideanGraph(nodes) {
  const graph = new Map();

  // Initialize adjacency lists
  for (const node of nodes) {
    graph.set(node.id, []);
  }

  // Add undirected edges between every pair of nodes
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i];
      const b = nodes[j];
      const dist = haversineDistance(a.lat, a.lng, b.lat, b.lng);

      // Add edge in both directions (undirected graph)
      graph.get(a.id).push({ to: b.id, weight: dist });
      graph.get(b.id).push({ to: a.id, weight: dist });
    }
  }

  return graph;
}

/**
 * High-level: find shortest path from user location to each hospital.
 *
 * @param {{lat:number, lng:number}} userLocation
 * @param {Array<{id:string, lat:number, lng:number}>} hospitals
 * @returns {Array<{hospitalId:string, distance_km:number, path:string[]}>}
 *
 * Complexity: O(V² + (V + E) log V) where V = hospitals.length + 1
 */
function findShortestPaths(userLocation, hospitals) {
  // Create node list: user + all hospitals
  const nodes = [
    { id: 'user', lat: userLocation.lat, lng: userLocation.lng },
    ...hospitals.map(h => ({ id: h.id, lat: h.lat, lng: h.lng })),
  ];

  // Build Euclidean graph
  const graph = buildEuclideanGraph(nodes);

  // Run Dijkstra from user location
  const { dist, prev } = dijkstra(graph, 'user');

  // Collect results for each hospital
  return hospitals.map(h => ({
    hospitalId: h.id,
    distance_km: dist.get(h.id) ?? Infinity,
    path: reconstructPath(prev, 'user', h.id),
  }));
}

module.exports = {
  dijkstra,
  reconstructPath,
  haversineDistance,
  buildEuclideanGraph,
  findShortestPaths,
};
