# MediRoute AI — Frontend

React 18 + Vite + Tailwind CSS

## Quick Start

```bash
cd frontend
npm install
npm run dev     # http://localhost:5173
npm run build   # production build → dist/
```

## Pages

| Page | Route | Description |
|------|-------|-------------|
| Home | `/` | Search form |
| Results | `/results` | Hospital list with sorting/filtering |
| MapView | `/map` | Leaflet map with route display |

## Environment

Create `frontend/.env`:
```
VITE_API_URL=http://localhost:5000/api
```

If not set, Vite proxy forwards `/api` to `localhost:5000`.

## Map

Uses **Leaflet** with **OpenStreetMap tiles** — no API key needed.
If Mapbox/ORS token is set in backend, route will use real road geometry.
Otherwise, a dashed straight line shows the Euclidean approximation.

## Components

- `SearchBar.jsx` — city, treatment, sort, emergency, live toggles
- `HospitalCard.jsx` — single hospital with score, cost, beds, directions button
