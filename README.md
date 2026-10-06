# Campus Equipment Booking API

Midterm practical lab test submission. Hono + TypeScript on Cloudflare Workers with local D1 (SQLite).

## How to run

```bash
npm install
npm run db:migrate:local   # create tables + seed equipment
npm run dev                # starts http://localhost:8787
npm run typecheck          # tsc
```

Base URL for all endpoints: `http://localhost:8787/api`

## Deployed on Cloudflare

Live URL: `https://equipment-booking-api.ayeminaung-mfu.workers.dev/api`

Deploy commands (requires `npx wrangler login`):

```bash
npx wrangler d1 execute booking-db --remote --file=migrations/0001_init.sql
npx wrangler deploy
```

## API Contract

### Equipment

| Method | Path | Success | Purpose |
|---|---|---|---|
| GET | `/api/equipment` | 200 | List all equipment |

### Bookings

| Method | Path | Success | Purpose |
|---|---|---|---|
| GET | `/api/bookings` | 200 | List bookings |
| GET | `/api/bookings/:id` | 200 | Get one booking |
| POST | `/api/bookings` | 201 | Create a booking |
| PATCH | `/api/bookings/:id` | 200 | Update a booking |
| DELETE | `/api/bookings/:id` | 204 | Delete a booking |

Create/update payload:

```json
{
  "equipmentId": "eq-1",
  "borrowerName": "Somchai Jaidee",
  "startAt": "2026-10-20T09:00:00.000Z",
  "endAt": "2026-10-20T11:00:00.000Z",
  "purpose": "Class presentation"
}
```

Response includes `id`, `equipmentId`, `borrowerName`, `startAt`, `endAt`, `purpose`, `createdAt`, `updatedAt`.

### Errors

All errors are JSON: `{ "error": "message" }`

| Status | When |
|---|---|
| 400 | Missing/invalid fields, `startAt >= endAt`, unknown `equipmentId`, invalid JSON |
| 404 | Booking id not found |
| 409 | Booking overlaps an existing booking for the same equipment |

Overlap rule: two bookings conflict when `existing.startAt < new.endAt AND new.startAt < existing.endAt` (for the same `equipmentId`). The current booking is excluded when patching itself.

### Design decisions / assumptions

- `startAt`/`endAt` are normalized with `new Date(...).toISOString()` before comparison and storage, so any valid ISO 8601 input is accepted.
- Back-to-back bookings are allowed: the overlap rule uses strict inequality, so a booking ending at 10:00 does not conflict with one starting at 10:00.
- Request bodies must be JSON objects; arrays/strings/null are rejected with 400.
- PATCH is a partial update: provided fields are merged over the stored booking, then the merged result is validated (including overlap check excluding itself).
- All SQL uses D1 `.bind(...)` parameter binding; no string concatenation of request data.

## Schema / ERD

```
equipment                 bookings
---------                 --------
id (PK)        1 ----< * equipment_id (FK -> equipment.id)
name                     id (PK)
location                 borrower_name
                         start_at
                         end_at
                         purpose
                         created_at
                         updated_at
```

A booking belongs to exactly one equipment. Overlap checks are scoped per `equipment_id`.

## Testing

See `TEST_EVIDENCE.md` — 12 cases covering create/read/update/delete and 400/404/409 errors, run with `curl` against `http://localhost:8787/api`.

## Files

- `src/index.ts` — API implementation
- `migrations/0001_init.sql` — schema + seed data (3 equipment records)
- `TEST_EVIDENCE.md` — curl evidence
- `AI_LOG.md` — AI usage log
- `QUALITY_GATE_REVIEW.md` — quality gate findings
