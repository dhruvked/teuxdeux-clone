# Teuxdeux Clone (Backend Ready)

This monorepo wires up a PostgreSQL-backed API for a Teuxdeux-style planner. The frontend has been stripped out so you can build your own UI against the existing endpoints.

## Stack
- **Backend:** Express (Node 18+), Drizzle ORM, Neon/PostgreSQL
- **DB schema:** `TD_TODO` schema with `users`, `tasks`, `recurring_rules`
- **Tooling:** PNPM, Turbo, Drizzle Kit
- **Frontend:** Next.js app present but blank (no UI)

## Running the backend
1) Set `apps/server/.env` with your Neon/Postgres URL:
```
DATABASE_URL=postgresql://...
```
2) Run migrations (uses Drizzle Kit + the TD_TODO schema):
```
pnpm --filter server db:push
```
3) Start the API:
```
pnpm --filter server dev
```
API defaults to `http://localhost:3000`.

The server seeds a default user (for now):
```
DEFAULT_USER_ID=11111111-1111-1111-1111-111111111111
DEFAULT_USER_EMAIL=demo@local
```

## API endpoints (no auth yet)
- `GET /health` — ping

### Tasks
- `GET /tasks?start=YYYY-MM-DD&end=YYYY-MM-DD` — list tasks for date range
- `POST /tasks` — `{ title, date?, sortOrder? }`
- `PATCH /tasks/:id` — `{ title?, date?, completed?, sortOrder? }`
- `DELETE /tasks/:id`

Task model: `id, userId, title, date|null (Someday), completedAt|null, sortOrder, createdAt, updatedAt`.

### Recurring rules
- `GET /recurring`
- `POST /recurring` — `{ title, cadence: daily|weekly|monthly, daysOfWeek?, dayOfMonth?, startsOn, endsOn?, isActive? }`
- `PATCH /recurring/:id` — same fields optional
- `DELETE /recurring/:id`

Recurring model: `id, userId, title, cadence enum, daysOfWeek int[], dayOfMonth int?, startsOn, endsOn?, isActive, createdAt`.

## Frontend status
The Next.js app under `apps/web` is a placeholder page. Build your own UI against the endpoints above; configure the base URL with `NEXT_PUBLIC_API_URL` if needed.

## Project structure
```
apps/
  server/   # Express API + Drizzle
  web/      # Next.js placeholder
packages/
  db/       # Drizzle config/schema (if retained)
```

## Scripts (root)
- `pnpm run dev` — turbo dev (all apps)
- `pnpm run dev:server` — backend only
- `pnpm run dev:web` — frontend (placeholder) only
- `pnpm run db:push` — run migrations via Drizzle (uses server config)
- `pnpm run check-types` — type check monorepo

## Notes
- Dates are stored as date-only (ISO `YYYY-MM-DD` for inputs).
- Auth is not implemented; all routes scope to the seeded default user.
- If you change the schema, regenerate migrations with Drizzle and rerun `db:push`.
