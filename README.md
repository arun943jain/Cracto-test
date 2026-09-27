# Release Checklist

## Project Overview

Full-stack app to manage software releases through a fixed 8-step checklist. Single-user, no authentication. Backend calculates release status from completed steps. Frontend lists/creates/updates releases and toggles checklist steps via GraphQL.

## Tech Stack

- Frontend: React 18, Vite 5, JavaScript, Apollo Client, plain CSS
- Backend: Node.js 20, Express 4, Apollo Server Express 3 (GraphQL), Prisma 5
- Database: PostgreSQL 16
- Testing: Jest, Supertest
- Containerization: Docker, docker-compose

## Architecture

```
frontend (Vite/React, VITE_API_URL -> /graphql)
  |
  v
backend (Express + Apollo /graphql, GET /health)
  |
  v
PostgreSQL via Prisma (single shared PrismaClient)
```

- Monorepo in one Git repository: `/frontend`, `/backend`, `docker-compose.yaml`.
- Backend is source of truth for status; frontend never sets status.
- Reusable Prisma client in `backend/src/prisma.js` (global singleton in dev).

## Database Schema

`backend/prisma/schema.prisma`:

```prisma
model Release {
  id              String   @id @default(cuid())
  name            String
  date            DateTime
  additionalInfo  String?
  completedSteps  Int[]    @default([])
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([createdAt])
  @@index([name])
}
```

- `completedSteps`: integer array of completed fixed step indexes (0–7). No `Step` table — steps are fixed constants shared by backend (`src/status.js`) and frontend (`src/steps.js`).

## Fixed Checklist Steps

1. Code freeze (index 0)
2. Run automated tests (1)
3. Review pull requests (2)
4. Build production bundle (3)
5. Update documentation (4)
6. Run database migrations (5)
7. Deploy to staging (6)
8. Deploy to production (7)

## Status Calculation

Backend `calculateStatus()` in `backend/src/status.js`:

- 0 completed → `planned`
- 1–7 completed → `ongoing`
- 8 completed → `done`

Status is derived on every read, never stored, never accepted from the client.

## GraphQL API

GraphQL endpoint: `/graphql`
Health endpoint: `/health` → `{ "ok": true, "status": "ok" }`

Queries:

- `releases: [Release!]!`
- `release(id: ID!): Release`

Mutations:

- `createRelease(name: String!, date: String!, additionalInfo: String): Release!`
- `updateRelease(id: ID!, additionalInfo: String): Release!`
- `toggleStep(id: ID!, stepIndex: Int!, completed: Boolean!): Release!`
- `deleteRelease(id: ID!): Boolean!`

Example:

```graphql
mutation {
  createRelease(name: "v1.0", date: "2026-09-27T10:00:00Z", additionalInfo: "notes") {
    id name status completedSteps
  }
}
```

Validation: required `name`/`date`, valid datetime, existing release ID, `stepIndex` 0–7 integer, `completed` boolean.

## Local Setup

Prerequisites: Node 20+, PostgreSQL 16 (or Docker).

Backend:

```bash
cd backend
npm install
copy .env.example .env
# set DATABASE_URL="postgresql://postgres:postgres@localhost:5432/releases?schema=public"
npx prisma migrate deploy
# or: npx prisma db push
npx prisma generate
npm start
# GraphQL: http://localhost:4000/graphql, health: http://localhost:4000/health
```

Frontend:

```bash
cd frontend
npm install
copy .env.example .env
# set VITE_API_URL=http://localhost:4000/graphql
npm run dev   # http://localhost:5173
npm run build # production build -> dist/
```

## Environment Variables

Backend (`backend/.env`):

- `DATABASE_URL` (required) — e.g. `postgresql://postgres:postgres@localhost:5432/releases?schema=public`
- `PORT` (default 4000) — Render sets this automatically
- `FRONTEND_URL` (production only) — deployed Vercel URL for CORS; unset locally

Frontend (`frontend/.env`):

- `VITE_API_URL` (required) — e.g. `http://localhost:4000/graphql` locally, or Render backend `/graphql` URL in production

Docker compose root `.env` (optional):

- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_PORT`

## Docker Setup

```bash
# from repo root
docker compose up --build
# backend: http://localhost:4000/graphql, health: http://localhost:4000/health
# postgres: localhost:5432

docker compose down
docker compose down -v  # also remove pgdata volume
```

Backend `Dockerfile` runs `prisma migrate deploy || prisma db push` on start, then `node src/index.js`. Listens on `process.env.PORT`.

## Testing

```bash
cd backend
npm install
npm test
```

- `tests/status.test.js` — status calculation, normalization, step validation (6 tests).
- `tests/api.test.js` — `GET /health` via Supertest; GraphQL `createRelease`/`toggleStep`/`releases` flow with in-memory Prisma mock (no DB needed).

## Design Decisions

- **Why PostgreSQL**: required by assignment; reliable relational store; native `Int[]` fits `completedSteps`; hosted options (Render Postgres) readily available.
- **Why Prisma**: type-safe queries, migrations, single-connection client management; Postgres array support.
- **Why GraphQL**: required by assignment; single `/graphql` endpoint serves all release CRUD + step toggles; schema documents API.
- **Why no Step table**: steps are fixed (8, never change); a table would add joins/migrations with no benefit.
- **Why completedSteps stored with Release**: one row per release, atomic updates, no join needed; array of 0–7 indexes is minimal and sufficient.
- **Why status is calculated automatically**: prevents inconsistent states; backend is source of truth; frontend cannot set it.
- **Why authentication is not included**: explicitly out of scope (single-user, no auth required); keeps 1-hour delivery feasible.

## Verification

- Backend tests: `cd backend && npm test` — 2 suites, 8 tests, all passing (`status.test.js`: status calculation/normalization/validation; `api.test.js`: `GET /health` via Supertest plus create→toggle→query flow against an in-memory Prisma mock).
- Prisma: `prisma validate` reports the schema as valid (requires `DATABASE_URL` to be set in the environment).
- Docker: `docker compose config` validates successfully. **Full `docker compose up --build` could not be run because the Docker daemon was not available in the verification environment** (only the Docker CLI is installed; no Docker Desktop/engine running). `postgres:16-alpine` + backend service wiring is therefore config-checked only, not runtime-verified.
- Live PostgreSQL GraphQL flow (create → toggle 0–7 → uncheck → update → delete): **not yet executed** — no reachable PostgreSQL instance exists in this environment. Must be run after `docker compose up --build` or against a hosted database before deployment.
- Frontend: `npm run build` succeeds (Vite production build into `dist/`); no hardcoded production API URL — all API access goes through `VITE_API_URL`.

## Deployment

Frontend URL: _pending_
Backend URL: _pending_

### Database — Render PostgreSQL

1. In the Render dashboard: New + → PostgreSQL → create database `release-checklist-db` (user/database `releases`).
2. Copy the connection string. For a Render Web Service in the same account/region use the **Internal** URL; for external access use the **External** URL.
3. Set it as the backend service's `DATABASE_URL` environment variable (or wire via `render.yaml`, which does this automatically).
4. Migrations run automatically during backend deployment via the build command (`npx prisma migrate deploy`). The initial migration `20250927000000_init` creates the `Release` table. Never reset the production database.

### Backend — Render

- Root directory: `backend`
- Build command: `npm install && npx prisma generate && npx prisma migrate deploy`
- Start command: `npm start`
- Required environment variables:
  - `DATABASE_URL` — Render PostgreSQL connection string (required)
  - `FRONTEND_URL` — deployed Vercel frontend URL, e.g. `https://<app>.vercel.app` (required in production so CORS allows the frontend; comma-separated if several; leave unset only for local dev)
  - `PORT` — auto-provided by Render (code falls back to 4000 locally)
- Health: `<RENDER_BACKEND_URL>/health` → `{ "ok": true, "status": "ok" }`
- GraphQL: `<RENDER_BACKEND_URL>/graphql`
- Alternative: apply `render.yaml` as a Render Blueprint — it provisions the database + web service with the above settings; then set `FRONTEND_URL` manually.

### Frontend — Vercel

- Root directory: `frontend`
- Build command: `npm run build`
- Output directory: `dist`
- Framework preset: Vite (see `frontend/vercel.json`; no SPA rewrites needed — the app has no client-side routes)
- Environment variable: `VITE_API_URL=<RENDER_BACKEND_URL>/graphql` (set **after** the backend is deployed; redeploy the frontend once set)

### Deployment verification checklist

Backend:

- [ ] Render service deployed
- [ ] `/health` returns success
- [ ] `/graphql` responds
- [ ] PostgreSQL connected
- [ ] Prisma migrations applied

Frontend:

- [ ] Vercel deployment succeeds
- [ ] Frontend loads
- [ ] GraphQL requests reach Render
- [ ] Create release works
- [ ] Checklist toggle works
- [ ] Status changes correctly
- [ ] Edit additional information works
- [ ] Delete works
- [ ] Refresh preserves data

## Stress Testing

- Initial implementation results: _pending (next stage)_
- Concurrent users: _pending_
- Latency: _pending_
- Error rate: _pending_
- Breaking point: _pending_
- Optimizations: _pending_
- Final optimized results: _pending_
