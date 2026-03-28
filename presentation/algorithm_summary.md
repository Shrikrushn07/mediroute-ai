# ⚙️ Algorithm Summary — MediRoute AI

## One-Page Reference for Judges

---

## 1. Dijkstra's Shortest Path
**File:** `/backend/algorithms/dijkstra.js`
**Used for:** Finding shortest path from user GPS → each hospital

| Property | Value |
|----------|-------|
| Type | Single-source shortest path |
| Graph | Adjacency list (Map of Arrays) |
| Data structure | Binary Min-Heap Priority Queue |
| Complexity | **O((V + E) log V)** |
| Space | O(V + E) |

**Key steps:**
- Build Euclidean graph: nodes = user + hospitals, edges = Haversine distances
- Run Dijkstra from `user` node
- Reconstruct path via `prev[]` backtracking
- Fallback: real road API (Mapbox/ORS) if key provided

---

## 2. Binary Min-Heap Priority Queue
**File:** `/backend/algorithms/priorityQueue.js`
**Used for:** Dijkstra node extraction + emergency hospital triage

| Operation | Complexity |
|-----------|------------|
| `push()` | **O(log n)** — sift up |
| `pop()` | **O(log n)** — sift down |
| `peek()` | **O(1)** — read root |

**Why not array sort?** Array-based queue would be O(n) per extraction — heap is O(log n).

---

## 3. Greedy Composite Scoring
**File:** `/backend/algorithms/greedy.js`
**Used for:** Ranking hospitals by combined score

**Formula:**
```
score = 0.5 × (1 - normCost) + 0.3 × (1 - normDist) + 0.2 × normRating
```

where `normX = (X - min) / (max - min)` [min-max normalization]

| Step | Complexity |
|------|------------|
| Compute min/max | O(n) |
| Score all hospitals | O(n) |
| Sort by score | O(n log n) |
| **Total** | **O(n log n)** |

**Default weights:** Cost 50% · Distance 30% · Rating 20%

---

## 4. Stable Sort (TimSort)
**File:** `/backend/algorithms/sorting.js`
**Used for:** Sorting results by cost / distance / rating / score

| Property | Value |
|----------|-------|
| Algorithm | JavaScript `Array.sort` (V8 TimSort) |
| Stability | ✅ Stable (equal elements keep original order) |
| Complexity | **O(n log n)** average + worst case |

---

## Data Structures Summary

| Structure | Location | Purpose |
|-----------|----------|---------|
| Adjacency List (`Map<id, [{to, weight}]>`) | dijkstra.js | Graph representation |
| Binary Min-Heap (array-backed) | priorityQueue.js | Efficient minimum extraction |
| Hash Maps (`Map<id, dist/prev>`) | dijkstra.js | Distance + path tables |
| Arrays | multiple | Hospital lists, waypoints |

---

## Why These Algorithms?

- **Dijkstra > BFS/DFS:** BFS can't handle weighted edges. DFS doesn't guarantee shortest path.
- **Dijkstra > Bellman-Ford:** Bellman-Ford is O(VE) — slower. No negative weights here, so Dijkstra is optimal.
- **Dijkstra > A*:** A* requires a heuristic and a real map. Our Euclidean graph already approximates distances, so plain Dijkstra suffices.
- **Greedy scoring > ML model:** For a hackathon/demo context, a transparent weighted formula is auditable and explainable to patients.
- **TimSort > Custom sort:** Battle-tested, stable, and built into JavaScript engine — no need to reinvent.
