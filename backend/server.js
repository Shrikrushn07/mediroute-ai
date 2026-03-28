/**
 * Saksham 2.0 — Backend Server
 * Node.js + Express
 *
 * Starts the API server, connects to MongoDB if configured,
 * and falls back to local JSON data otherwise.
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config');

const app = express();

// ── Middleware ─────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// ── Routes ─────────────────────────────────────────────────────────────────────
const hospitalRoutes = require('./routes/hospitals');
app.use('/api', hospitalRoutes);

// Serve frontend build in production
if (config.NODE_ENV === 'production') {
  const frontendBuild = path.join(__dirname, '../frontend/dist');
  app.use(express.static(frontendBuild));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(frontendBuild, 'index.html'));
  });
}

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, _req, res, _next) => {
  console.error('[server] Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Database ───────────────────────────────────────────────────────────────────
async function connectDB() {
  if (!config.hasMongoDB) {
    console.log('[server] MongoDB not configured — using local hospitals.json');
    return;
  }
  try {
    const mongoose = require('mongoose');
    await mongoose.connect(config.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('[server] ✅ Connected to MongoDB');
  } catch (err) {
    console.error('[server] MongoDB connection failed:', err.message);
    console.warn('[server] Falling back to local hospitals.json');
  }
}

// ── Start Server ───────────────────────────────────────────────────────────────
async function start() {
  await connectDB();
  app.listen(config.PORT, () => {
    console.log(`\n[server] ✨ Saksham 2.0 Backend running on port ${config.PORT}`);
    console.log(`[server] API: http://localhost:${config.PORT}/api/health`);
    console.log(`[server] Live data: ${config.hasGooglePlaces ? '✅ enabled' : '❌ disabled (no API key)'}`);
    console.log(`[server] Map routing: ${config.hasMapbox || config.hasORS ? '✅ enabled' : '❌ Euclidean fallback'}`);
    console.log(`[server] Database: ${config.hasMongoDB ? '✅ MongoDB' : '📄 Local JSON'}\n`);
  });
}

start();

module.exports = app; // for testing
