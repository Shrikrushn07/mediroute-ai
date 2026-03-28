# ✨ Saksham 2.0 — AI Powered Smart Healthcare Decision System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![Jest](https://img.shields.io/badge/Tests-Jest-orange.svg)](https://jestjs.io/)

> **MediRoute AI** helps patients find the best hospital for their medical treatment by combining cost estimation, distance routing, and quality ratings into a single intelligent recommendation engine.

---

## 🏗️ Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                         MEDIROUTE AI                                   │
│                                                                        │
│  ┌───────────────┐        HTTP/REST         ┌──────────────────────┐  │
│  │   FRONTEND    │ ──────────────────────── │      BACKEND         │  │
│  │  React + Vite │                          │  Node.js + Express   │  │
│  │  + Tailwind   │                          │                      │  │
│  │               │    GET /hospitals        │  ┌────────────────┐  │  │
│  │  ┌─────────┐  │ ───────────────────────► │  │   Algorithms   │  │  │
│  │  │  Home   │  │                          │  │  - Dijkstra    │  │  │
│  │  │ Results │  │    GET /recommendation   │  │  - Greedy      │  │  │
│  │  │ MapView │  │ ◄─────────────────────── │  │  - PriorityQ   │  │  │
│  │  └─────────┘  │                          │  │  - Sorting     │  │  │
│  └───────────────┘                          │  └────────────────┘  │  │
│                                             │         │            │  │
│                                             │  ┌──────▼─────────┐  │  │
│                                             │  │  Data Layer    │  │  │
│                                             │  │  MongoDB OR    │  │  │
│                                             │  │  hospitals.json│  │  │
│                                             │  └────────────────┘  │  │
│                                             │         │            │  │
│                                             │  ┌──────▼─────────┐  │  │
│                                             │  │ External APIs  │  │  │
│                                             │  │ Google Places  │  │  │
│                                             │  │ Mapbox/ORS     │  │  │
│                                             │  └────────────────┘  │  │
│                                             └──────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🧠 Algorithms & Complexity —

### 1. Dijkstra's Shortest Path (`/backend/algorithms/dijkstra.js`)

**What it does:** Finds the shortest path from the user's GPS location to each hospital on a constructed Euclidean graph.

**Why chosen:** Dijkstra is optimal for single-source shortest path on non-negative weighted graphs. Since travel distances are always non-negative, Dijkstra is guaranteed to find the optimal path.

**How graph is built (no real road data):** We construct a fully-connected graph where:
- Nodes = user location + each candidate hospital (lat/lng)
- Edge weight = Haversine distance (km) between two nodes

**Pseudo-code:**
```
function dijkstra(graph, source):
  dist[source] = 0
  for all other v: dist[v] = ∞
  pq = MinHeap()
  pq.push({node: source, dist: 0})

  while pq not empty:
    {node u, dist d} = pq.pop()
    if d > dist[u]: continue   // stale entry
    for each neighbor v of u:
      newDist = dist[u] + weight(u, v)
      if newDist < dist[v]:
        dist[v] = newDist
        prev[v] = u
        pq.push({node: v, dist: newDist})

  return dist, prev
```

**Big-O:** `O((V + E) log V)` where V = vertices (hospitals + user), E = edges (V² for dense graph)

**Tradeoff:** Using Euclidean straight-line distance approximates road distance. Real routing providers (Mapbox, OpenRouteService) give actual road paths if API keys are provided.

---

### 2. Binary Min-Heap Priority Queue (`/backend/algorithms/priorityQueue.js`)

**What it does:** Efficiently extracts minimum-distance node during Dijkstra traversal and prioritizes emergency hospital selection.

**Why chosen:** A binary heap gives O(log n) push and pop — much better than O(n) for a naive array-based priority queue.

**Pseudo-code:**
```
class MinHeap:
  push(item):
    append to array
    sift up: swap with parent while item < parent   // O(log n)

  pop():
    swap root with last
    remove last
    sift down: swap with smaller child              // O(log n)

  peek(): return array[0]                           // O(1)
```

**Big-O:** Push = `O(log n)`, Pop = `O(log n)`, Peek = `O(1)`

---

### 3. Greedy Scoring Function (`/backend/algorithms/greedy.js`)

**What it does:** Combines normalized cost, distance, and rating into a weighted composite score to rank hospitals.

**Formula:**
```
score = w_cost × (1 - normCost) + w_dist × (1 - normDist) + w_rating × normRating

where:
  normCost    = (cost - minCost) / (maxCost - minCost)
  normDist    = (dist - minDist) / (maxDist - minDist)
  normRating  = (rating - minRating) / (maxRating - minRating)

Default weights:
  w_cost    = 0.50  (cost is most important)
  w_dist    = 0.30  (distance second)
  w_rating  = 0.20  (rating third)
```

**Why greedy?** We make a locally optimal choice at each step — score each hospital once and pick the best. This is a valid approach because all factors are known upfront.

**Big-O:** `O(n)` to compute scores, `O(n log n)` total with final sort

---

### 4. Stable Sort (`/backend/algorithms/sorting.js`)

**What it does:** Sorts hospitals by cost, distance, rating, or composite score.

**Implementation:** Wraps JavaScript's `Array.prototype.sort` which uses TimSort (V8 engine) — a hybrid merge sort + insertion sort that is stable.

**Big-O:** `O(n log n)` average and worst case

---

### 5. Data Structures Summary

| Structure | Used For | File |
|-----------|----------|------|
| Adjacency List (Array of Arrays) | Dijkstra graph | dijkstra.js |
| Binary Min-Heap | Priority Queue | priorityQueue.js |
| Hash Map (Object) | dist[], prev[] tables | dijkstra.js |
| Array | Hospital list, path reconstruction | multiple |

---

## 📁 Project Structure

```
mediroute-ai/
├── README.md
├── .env.example
├── .gitignore
├── .replit
├── run.sh
├── Dockerfile
├── LICENSE
├── package.json             ← root (concurrently)
├── .eslintrc.json
├── .prettierrc
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   ├── README.frontend.md
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── pages/
│       │   ├── Home.jsx
│       │   ├── Results.jsx
│       │   └── MapView.jsx
│       ├── components/
│       │   ├── SearchBar.jsx
│       │   └── HospitalCard.jsx
│       ├── styles/
│       │   └── tailwind.css
│       └── api/
│           └── client.js
├── backend/
│   ├── package.json
│   ├── server.js
│   ├── README.backend.md
│   ├── routes/
│   │   └── hospitals.js
│   ├── controllers/
│   │   └── hospitalsController.js
│   ├── algorithms/
│   │   ├── dijkstra.js
│   │   ├── priorityQueue.js
│   │   ├── greedy.js
│   │   └── sorting.js
│   ├── db/
│   │   └── seeder.js
│   ├── models/
│   │   └── hospitalModel.js
│   └── config/
│       └── index.js
├── database/
│   └── hospitals.json
├── tests/
│   └── algorithms.test.js
├── presentation/
│   ├── demo_steps.md
│   └── algorithm_summary.md
└── .github/
    └── workflows/
        └── ci.yml
```

---

## 🚀 Setup & Run

### Prerequisites
- Node.js 18+
- npm 9+
- (Optional) MongoDB URI
- (Optional) Google Places API Key
- (Optional) Mapbox Token or OpenRouteService Key

---

### Local Run

```bash
# 1. Clone the repo
git clone https://github.com/yourname/mediroute-ai.git
cd mediroute-ai

# 2. Copy env file
cp .env.example .env
# Edit .env and fill in keys (all optional — fallback works without them)

# 3. Install root dependencies
npm install

# 4. Install backend dependencies
cd backend && npm install && cd ..

# 5. Install frontend dependencies
cd frontend && npm install && cd ..

# 6. Run both concurrently from root
npm start
# OR separately:
# Backend:  cd backend && npm run dev
# Frontend: cd frontend && npm run dev
```

Backend runs on: `http://localhost:5000`
Frontend runs on: `http://localhost:5173`

---

### Deployment

**Frontend (Vercel)**:
1. Connect your GitHub repository to Vercel.
2. Set the Framework Preset to `Vite`.
3. Set the Root Directory to `frontend`.
4. Add Environment Variables (e.g., `VITE_API_URL=https://your-backend-url.onrender.com/api`).
5. Deploy.

**Backend (Render)**:
1. Connect your GitHub repository to Render as a Web Service.
2. Set the Root Directory to `backend`.
3. Set Build Command to `npm install`.
4. Set Start Command to `node server.js` or `npm start`.
5. Add necessary Environment Variables (e.g., `PORT`, `MONGODB_URI`, `GOOGLE_PLACES_API_KEY`).
6. Deploy.

---

### Replit Setup

1. **Fork/import** this repo into Replit
2. In Replit sidebar → **Secrets**, add:
   - `PORT` = `5000`
   - `GOOGLE_PLACES_API_KEY` = your key (optional)
   - `MAPBOX_TOKEN` = your token (optional)
   - `OPENROUTESERVICE_KEY` = your key (optional)
   - `MONGODB_URI` = your MongoDB Atlas URI (optional)
3. Click **Run** — Replit will execute `.replit` which runs `bash run.sh`
4. Frontend will be served via Replit's webview

---

### Run Tests

```bash
cd tests
npm install
npm test
# OR from root:
npm run test
```

Expected output:
```
PASS tests/algorithms.test.js
  Priority Queue
    ✓ pushes and pops in min-heap order (5ms)
    ✓ handles single element (1ms)
    ✓ handles duplicate priorities (2ms)
  Dijkstra
    ✓ finds shortest path on small graph (3ms)
    ✓ returns Infinity for unreachable nodes (1ms)
    ✓ reconstructs correct path (2ms)
  Greedy Scoring
    ✓ ranks hospitals by composite score (2ms)
    ✓ emergency filter removes zero-bed hospitals (1ms)
    ✓ handles equal scores (1ms)

Test Suites: 1 passed, 1 total
Tests:       9 passed, 9 total
```

---

## 🔐 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No (default: 5000) | Backend server port |
| `MONGODB_URI` | No | MongoDB connection URI (falls back to JSON) |
| `GOOGLE_PLACES_API_KEY` | No | Enables live hospital data from Google Places |
| `MAPBOX_TOKEN` | No | Enables real map routing via Mapbox |
| `OPENROUTESERVICE_KEY` | No | Alternative real routing via OpenRouteService |

**Fallback behavior:** If no API keys are provided, the system works fully using `/database/hospitals.json` and Euclidean Dijkstra. The frontend will show: *"Live data not available — using sample dataset"*.

---

## 🐳 Docker

```bash
# Build
docker build -t mediroute-ai .

# Run
docker run -p 5000:5000 -p 5173:5173 \
  -e PORT=5000 \
  mediroute-ai
```

---

## 🔒 Security & Privacy

### PHI Compliance Note
This system uses **public hospital metadata only**:
- Hospital names, locations, approximate treatment costs
- Publicly available ratings and contact information
- **No patient data is collected, stored, or transmitted**

### Recommendations for Production
- All API communication should use **HTTPS/TLS**
- If patient queries are logged, they must be encrypted at rest (AES-256)
- For India compliance, follow **DISHA (Digital Information Security in Healthcare Act)** guidelines
- Use environment variables for all secrets — never commit `.env` to git
- Rate-limit the `/hospitals` endpoint to prevent scraping
- Add authentication (JWT) before exposing to internet traffic

---

## 🌐 API Reference

### `GET /api/health`
```
Response:
{
  "status": "ok",
  "message": "MediRoute API is running",
  "uptime": 120.5
}
```

### `GET /hospitals`
```
Query params:
  city       - string (e.g., "Bangalore")
  treatment  - string (e.g., "kidney")
  live       - boolean (default: false)

Response:
[
  {
    "id": "BLR001",
    "name": "Apollo Hospital Bannerghatta",
    "city": "Bangalore",
    "lat": 12.8456,
    "lng": 77.5968,
    "treatments": ["kidney", "heart", "fracture"],
    "cost_map": { "kidney": 280000, "heart": 750000 },
    "rating": 4.5,
    "beds_available": 12,
    "phone": "+91-80-26304050",
    "distance_km": 5.2,
    "estimated_cost": 280000
  }
]
```

### `GET /recommendation`
```
Query params:
  lat        - float (user latitude)
  lng        - float (user longitude)
  treatment  - string
  emergency  - boolean (default: false)

Response:
{
  "recommended": { ...hospital object, "score": 0.847 },
  "route": {
    "path": ["user", "BLR003", "BLR001"],
    "total_distance_km": 5.2,
    "waypoints": [[12.9716, 77.5946], [12.8456, 77.5968]]
  },
  "all_scored": [ ...hospitals sorted by score ]
}
```

### `POST /seed`
Seeds the database from hospitals.json.

---

## 📊 Sample Demo Script

### Step-by-step (2-minute demo)

1. **Open app** → Home page loads with search form
2. **Enter:** City = `Bangalore`, Treatment = `kidney`, Emergency = unchecked
3. **Click Search** → Results page shows 8 hospitals sorted by score
4. **Observe:** Top result highlighted in green (Apollo Hospital — score 0.847)
5. **Click "Directions"** on recommended hospital
6. **MapView loads** → Shows route from user pin → hospital with distance 5.2km, cost ₹2,80,000
7. **Toggle Emergency** → Re-search → Only hospitals with beds > 0 shown, faster response

### Expected JSON Response (recommendation):
```json
{
  "recommended": {
    "id": "BLR001",
    "name": "Apollo Hospital Bannerghatta",
    "city": "Bangalore",
    "estimated_cost": 280000,
    "rating": 4.5,
    "distance_km": 5.2,
    "beds_available": 12,
    "score": 0.847
  },
  "route": {
    "path": ["user", "BLR001"],
    "total_distance_km": 5.2,
    "waypoints": [
      [12.9716, 77.5946],
      [12.8456, 77.5968]
    ]
  }
}
```

---

## 🔮 Future Improvements

- [ ] Real-time bed availability via hospital APIs
- [ ] Insurance coverage filter
- [ ] Multi-language support (Hindi, Kannada, Tamil)
- [ ] Ride-hailing integration (Ola/Uber ETA)
- [ ] Doctor availability and specialization filter
- [ ] Offline PWA mode with cached hospital data
- [ ] A* algorithm for faster routing on large graphs
- [ ] Ambulance dispatch integration

---

## 📄 License

MIT — Built by Shrikrushn Bhise
