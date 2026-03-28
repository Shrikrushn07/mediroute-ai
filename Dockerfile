# ── Stage 1: Build frontend ───────────────────────────────────────────────────
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install --silent
COPY frontend/ .
RUN npm run build

# ── Stage 2: Backend + frontend static ────────────────────────────────────────
FROM node:18-alpine AS production

WORKDIR /app

# Copy backend
COPY backend/package*.json ./backend/
RUN cd backend && npm install --only=production --silent
COPY backend/ ./backend/

# Copy database
COPY database/ ./database/

# Copy built frontend into backend's static serving path
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Copy env example
COPY .env.example .env.example

ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

WORKDIR /app/backend
CMD ["node", "server.js"]
