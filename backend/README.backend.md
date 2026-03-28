# MediRoute AI — Backend

Node.js + Express REST API

## Quick Start

```bash
cd backend
npm install
npm run dev        # development (nodemon)
npm start          # production
npm run seed       # seed database from hospitals.json
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/hospitals` | List hospitals by city/treatment |
| GET | `/api/recommendation` | Dijkstra route + greedy recommendation |
| POST | `/api/seed` | Seed DB from hospitals.json |

## Query Params

### GET /api/hospitals
- `city` (required) — e.g. `Bangalore`
- `treatment` (required) — `kidney` / `heart` / `appendix` / `fracture` / `c-section`
- `live` — `true` to use Google Places API
- `sort` — `score` | `cost` | `distance` | `rating`
- `lat`, `lng` — user coordinates (enables distance calc)
- `emergency` — `true` to filter zero-bed hospitals

### GET /api/recommendation
- `lat`, `lng` — user coordinates (required)
- `treatment` — treatment type
- `city` — optional city filter
- `emergency` — `true` for emergency mode

## Algorithms

| File | Algorithm | Complexity |
|------|-----------|------------|
| `algorithms/priorityQueue.js` | Binary Min-Heap | push/pop O(log n) |
| `algorithms/dijkstra.js` | Dijkstra | O((V+E) log V) |
| `algorithms/greedy.js` | Weighted scoring | O(n log n) |
| `algorithms/sorting.js` | TimSort wrapper | O(n log n) |

## Folder Structure

```
backend/
├── server.js              ← Express entry point
├── config/index.js        ← Env var loading
├── routes/hospitals.js    ← Route definitions
├── controllers/           ← Business logic
├── algorithms/            ← All algorithm implementations
├── models/hospitalModel.js← Mongoose schema + JSON fallback
└── db/seeder.js           ← DB seed script
```
