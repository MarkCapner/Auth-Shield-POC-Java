# Auth-Shield PoC (client + Java Spring backend)

This repo keeps the existing **React client** and replaces the original Node/Express backend (`server.js/`) with a **Java Spring Boot** backend in `server/`.

## What’s converted already

✅ Spring Boot backend scaffold with:
- REST endpoints matching your existing client routes under `/api/*`
- Raw WebSocket endpoint at `/ws` (same path the client uses)
- PostgreSQL schema generated from `shared/schema.ts` via Flyway (`server/src/main/resources/db/migration/V1__init.sql`)
- Docker Compose for Postgres + backend

⚠️ Some endpoints are **minimal placeholders** (notably ML baseline/anomaly-check and impossible-travel). They return the correct *shape* so the UI doesn’t crash, but you’ll want to port the full logic from `server.js/`.

## Run with Docker (recommended)

```bash
docker compose up --build
```

Backend will be on:
- http://localhost:8080
- WebSocket: ws://localhost:8080/ws

## Run locally (no Docker)

### 1) Start Postgres
Create a database/user (or use your own) and set env vars:

```bash
export DATABASE_URL=jdbc:postgresql://localhost:5432/authshield
export DB_USER=authshield
export DB_PASSWORD=authshield
```

### 2) Run the backend

```bash
cd server
mvn spring-boot:run
```

### 3) Run the client (dev)
The client uses relative URLs (`/api/...`). For dev, `client/vite.config.ts` now proxies `/api` and `/ws` to the backend.

```bash
npm install
npm run dev
```

Client: http://localhost:5173

## Next steps to finish the conversion (from server.js → server/)

### 1) Port ML logic (highest impact)
Files to port:
- `server.js/ml-scoring.ts`
- Relevant parts of `server.js/routes.ts` (`/api/ml/baseline/:userId`, `/api/ml/anomaly-check`)

Target location:
- `server/src/main/java/com/authshield/server/service/` (create `MlScoringService`)

### 2) Match the Node semantics for “risk”
Right now:
- `/api/ml/score` computes a simple risk fusion using DB trustScore/confidenceScore.
- `/api/calculate-risk` matches the Node weights & pass threshold but without the random demo factor generation.

Port these exactly if you need demo parity:
- `calculateRiskScore()` and the factors payload in `server.js/routes.ts`

### 3) Implement impossible travel properly
Port `/api/detect-impossible-travel` from `server.js/routes.ts` into:
- `ImpossibleTravelController` (+ a small service)

### 4) Tighten persistence types
Currently JSONB columns are stored as strings in JPA entities.
If you want richer typed JSON fields:
- map them as `JsonNode` using an attribute converter, or
- add a Hibernate JSON type (e.g., hypersistence-utils)

### 5) Remove `server.js/` once parity is confirmed
Once the UI works end-to-end against Spring:
- delete `server.js/` and related Node-only files.

## Notes

- Spring Security is configured for simple session-based auth endpoints (`/api/register`, `/api/login`, `/api/logout`, `/api/user`).
- If you want to fully mirror the Node session token flow, extend `SessionEntity` and `/api/sessions/*` handlers (already included).
