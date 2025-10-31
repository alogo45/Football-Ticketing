-- Ensure extension for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  starts_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS seats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id),
  label TEXT,
  status TEXT NOT NULL DEFAULT 'available'
);

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  seat_id UUID REFERENCES seats(id),
  status TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS idempotency_keys (
  key TEXT PRIMARY KEY,
  order_id UUID,
  created_at TIMESTAMP DEFAULT now()
);

-- sample data (idempotent)
INSERT INTO events (id, name, starts_at)
  SELECT gen_random_uuid(), 'Sample Match', now() + interval '7 days'
  WHERE NOT EXISTS (SELECT 1 FROM events);

INSERT INTO users (id, name)
  SELECT gen_random_uuid(), 'Demo User'
  WHERE NOT EXISTS (SELECT 1 FROM users);

DO $$
DECLARE ev_id UUID;
BEGIN
  SELECT id INTO ev_id FROM events LIMIT 1;
  IF ev_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM seats WHERE event_id = ev_id) THEN
      INSERT INTO seats (id, event_id, label) VALUES
        (gen_random_uuid(), ev_id, 'A1'),
        (gen_random_uuid(), ev_id, 'A2'),
        (gen_random_uuid(), ev_id, 'A3');
    END IF;
  END IF;
END$$;
