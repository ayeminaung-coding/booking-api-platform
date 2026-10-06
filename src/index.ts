import { Hono } from "hono";
import type { Context } from "hono";

type Equipment = { id: string; name: string; location: string };

type BookingRow = {
  id: string;
  equipment_id: string;
  borrower_name: string;
  start_at: string;
  end_at: string;
  purpose: string;
  created_at: string;
  updated_at: string;
};

type Bindings = { DB: D1Database };

const app = new Hono<{ Bindings: Bindings }>();

const toBooking = (r: BookingRow) => ({
  id: r.id,
  equipmentId: r.equipment_id,
  borrowerName: r.borrower_name,
  startAt: r.start_at,
  endAt: r.end_at,
  purpose: r.purpose,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

const badRequest = (c: Context<{ Bindings: Bindings }>, message: string) =>
  c.json({ error: message }, 400);

app.get("/", (c) =>
  c.json({
    name: "Campus Equipment Booking API",
    endpoints: [
      "GET /api/equipment",
      "GET /api/bookings",
      "GET /api/bookings/:id",
      "POST /api/bookings",
      "PATCH /api/bookings/:id",
      "DELETE /api/bookings/:id",
    ],
  })
);

app.get("/api/equipment", async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT id, name, location FROM equipment ORDER BY id"
  ).all<Equipment>();
  return c.json(results);
});

app.get("/api/bookings", async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM bookings ORDER BY start_at"
  ).all<BookingRow>();
  return c.json(results.map(toBooking));
});

app.get("/api/bookings/:id", async (c) => {
  const row = await c.env.DB.prepare(
    "SELECT * FROM bookings WHERE id = ?"
  )
    .bind(c.req.param("id"))
    .first<BookingRow>();
  if (!row) return c.json({ error: "Booking not found" }, 404);
  return c.json(toBooking(row));
});

const isValidISODate = (v: unknown): v is string =>
  typeof v === "string" && !Number.isNaN(Date.parse(v));

function validateBookingFields(
  body: Record<string, unknown>,
  requireAll: boolean
): string | null {
  const fields = ["equipmentId", "borrowerName", "startAt", "endAt", "purpose"] as const;
  if (requireAll) {
    for (const f of fields) {
      if (typeof body[f] !== "string" || (body[f] as string).trim() === "") {
        return `${f} is required`;
      }
    }
  }
  for (const f of ["equipmentId", "borrowerName", "purpose"] as const) {
    if (body[f] !== undefined && (typeof body[f] !== "string" || (body[f] as string).trim() === "")) {
      return `${f} must be a non-empty string`;
    }
  }
  for (const f of ["startAt", "endAt"] as const) {
    if (body[f] !== undefined && !isValidISODate(body[f])) {
      return `${f} must be a valid ISO 8601 datetime`;
    }
  }
  return null;
}

async function equipmentExists(
  db: D1Database,
  equipmentId: string
): Promise<boolean> {
  const row = await db
    .prepare("SELECT id FROM equipment WHERE id = ?")
    .bind(equipmentId)
    .first<{ id: string }>();
  return row !== null;
}

async function hasOverlap(
  db: D1Database,
  equipmentId: string,
  startAt: string,
  endAt: string,
  excludeId?: string
): Promise<boolean> {
  let sql =
    "SELECT id FROM bookings WHERE equipment_id = ? AND start_at < ? AND ? < end_at";
  const params: string[] = [equipmentId, endAt, startAt];
  if (excludeId) {
    sql += " AND id != ?";
    params.push(excludeId);
  }
  sql += " LIMIT 1";
  const row = await db.prepare(sql).bind(...params).first<{ id: string }>();
  return row !== null;
}

app.post("/api/bookings", async (c) => {
  let body: Record<string, unknown>;
  try {
    body = await c.req.json();
  } catch {
    return badRequest(c, "Invalid JSON body");
  }
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return badRequest(c, "Body must be a JSON object");
  }

  const err = validateBookingFields(body, true);
  if (err) return badRequest(c, err);

  const equipmentId = (body.equipmentId as string).trim();
  const borrowerName = (body.borrowerName as string).trim();
  const startAt = new Date(body.startAt as string).toISOString();
  const endAt = new Date(body.endAt as string).toISOString();
  const purpose = (body.purpose as string).trim();

  if (Date.parse(startAt) >= Date.parse(endAt)) {
    return badRequest(c, "startAt must be before endAt");
  }
  if (!(await equipmentExists(c.env.DB, equipmentId))) {
    return badRequest(c, "equipmentId does not exist");
  }
  if (await hasOverlap(c.env.DB, equipmentId, startAt, endAt)) {
    return c.json({ error: "Booking time conflicts with an existing booking" }, 409);
  }

  const now = new Date().toISOString();
  const row: BookingRow = {
    id: crypto.randomUUID(),
    equipment_id: equipmentId,
    borrower_name: borrowerName,
    start_at: startAt,
    end_at: endAt,
    purpose,
    created_at: now,
    updated_at: now,
  };

  await c.env.DB.prepare(
    `INSERT INTO bookings (id, equipment_id, borrower_name, start_at, end_at, purpose, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(row.id, row.equipment_id, row.borrower_name, row.start_at, row.end_at, row.purpose, row.created_at, row.updated_at)
    .run();

  return c.json(toBooking(row), 201);
});

app.patch("/api/bookings/:id", async (c) => {
  const existing = await c.env.DB.prepare(
    "SELECT * FROM bookings WHERE id = ?"
  )
    .bind(c.req.param("id"))
    .first<BookingRow>();
  if (!existing) return c.json({ error: "Booking not found" }, 404);

  let body: Record<string, unknown>;
  try {
    body = await c.req.json();
  } catch {
    return badRequest(c, "Invalid JSON body");
  }
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return badRequest(c, "Body must be a JSON object");
  }

  const err = validateBookingFields(body, false);
  if (err) return badRequest(c, err);

  const equipmentId =
    typeof body.equipmentId === "string" ? body.equipmentId.trim() : existing.equipment_id;
  const borrowerName =
    typeof body.borrowerName === "string" ? body.borrowerName.trim() : existing.borrower_name;
  const startAt =
    body.startAt !== undefined
      ? new Date(body.startAt as string).toISOString()
      : existing.start_at;
  const endAt =
    body.endAt !== undefined
      ? new Date(body.endAt as string).toISOString()
      : existing.end_at;
  const purpose =
    typeof body.purpose === "string" ? body.purpose.trim() : existing.purpose;

  if (Date.parse(startAt) >= Date.parse(endAt)) {
    return badRequest(c, "startAt must be before endAt");
  }
  if (!(await equipmentExists(c.env.DB, equipmentId))) {
    return badRequest(c, "equipmentId does not exist");
  }
  if (await hasOverlap(c.env.DB, equipmentId, startAt, endAt, existing.id)) {
    return c.json({ error: "Booking time conflicts with an existing booking" }, 409);
  }

  const now = new Date().toISOString();
  await c.env.DB.prepare(
    `UPDATE bookings SET equipment_id = ?, borrower_name = ?, start_at = ?, end_at = ?, purpose = ?, updated_at = ? WHERE id = ?`
  )
    .bind(equipmentId, borrowerName, startAt, endAt, purpose, now, existing.id)
    .run();

  const updated = await c.env.DB.prepare(
    "SELECT * FROM bookings WHERE id = ?"
  )
    .bind(existing.id)
    .first<BookingRow>();
  return c.json(toBooking(updated!));
});

app.delete("/api/bookings/:id", async (c) => {
  const existing = await c.env.DB.prepare(
    "SELECT id FROM bookings WHERE id = ?"
  )
    .bind(c.req.param("id"))
    .first<{ id: string }>();
  if (!existing) return c.json({ error: "Booking not found" }, 404);

  await c.env.DB.prepare("DELETE FROM bookings WHERE id = ?")
    .bind(c.req.param("id"))
    .run();
  return c.body(null, 204);
});

export default app;
