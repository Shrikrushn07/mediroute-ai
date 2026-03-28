#!/bin/bash
# MediRoute AI — Startup Script for Replit and local development

set -e

echo "🏥 Starting MediRoute AI..."

# Install dependencies if node_modules missing
if [ ! -d "backend/node_modules" ]; then
  echo "📦 Installing backend dependencies..."
  cd backend && npm install --silent && cd ..
fi

if [ ! -d "frontend/node_modules" ]; then
  echo "📦 Installing frontend dependencies..."
  cd frontend && npm install --silent && cd ..
fi

echo "🚀 Starting backend on port 5000..."
cd backend && node server.js &
BACKEND_PID=$!

echo "⚡ Starting frontend on port 5173..."
cd ../frontend && npm run dev -- --host 0.0.0.0 &
FRONTEND_PID=$!

echo ""
echo "✅ MediRoute AI is running!"
echo "   Backend:  http://localhost:5000/api/health"
echo "   Frontend: http://localhost:5173"
echo ""

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
