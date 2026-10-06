-- Migration: 0001_init
-- Description: Schema for campus equipment booking API

CREATE TABLE IF NOT EXISTS equipment (
  id       TEXT PRIMARY KEY,
  name     TEXT NOT NULL,
  location TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS bookings (
  id           TEXT PRIMARY KEY,
  equipment_id TEXT NOT NULL REFERENCES equipment(id),
  borrower_name TEXT NOT NULL,
  start_at     TEXT NOT NULL,
  end_at       TEXT NOT NULL,
  purpose      TEXT NOT NULL,
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_bookings_equipment ON bookings (equipment_id);
CREATE INDEX IF NOT EXISTS idx_bookings_start     ON bookings (start_at);

INSERT OR IGNORE INTO equipment (id, name, location) VALUES
  ('eq-1', 'Projector A', 'Building 1'),
  ('eq-2', 'DSLR Camera Kit', 'Media Lab'),
  ('eq-3', 'Meeting Room 4', 'Building 3');

INSERT OR IGNORE INTO bookings (id, equipment_id, borrower_name, start_at, end_at, purpose, created_at, updated_at) VALUES
  ('bk-1', 'eq-1', 'Somchai Jaidee', '2026-10-20T09:00:00.000Z', '2026-10-20T11:00:00.000Z', 'Class presentation', '2026-10-01T00:00:00.000Z', '2026-10-01T00:00:00.000Z'),
  ('bk-2', 'eq-2', 'Suda Dee', '2026-10-20T13:00:00.000Z', '2026-10-20T15:00:00.000Z', 'Campus shoot', '2026-10-01T00:00:00.000Z', '2026-10-01T00:00:00.000Z');
