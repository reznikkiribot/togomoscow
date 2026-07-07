# togomoscow

Telegram Mini App MVP — a Russian reviews platform for restaurants, cafés and bars (pilot city: Moscow).

Monorepo:

- `backend/` — NestJS API + Prisma + Postgres
- `frontend/` — Vite + React + TypeScript (Telegram Mini App)
- `docker-compose.yml` — local Postgres + MinIO

## Prerequisites

- Docker Desktop (running)
- Node.js LTS

## Run locally (Sprint 1 — walking skeleton)

```bash
# 1. Start infrastructure (Postgres + MinIO)
docker compose up -d

# 2. Backend
cd backend
cp .env.example .env          # then put your real TELEGRAM_BOT_TOKEN in .env
npm install
npm run prisma:migrate        # creates the users table
npm run start:dev             # http://localhost:3000/api

# 3. Frontend (new terminal)
cd frontend
npm install
npm run dev                   # http://localhost:5173

# 4. Expose the frontend over HTTPS for Telegram (see SETUP notes),
#    paste the URL into BotFather → Menu Button, open the bot.
```

Health check (no Telegram needed): http://localhost:3000/api/health
