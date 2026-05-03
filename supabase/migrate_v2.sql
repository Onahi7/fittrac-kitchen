-- ─────────────────────────────────────────────────────────────────
--  Fittrac Kitchen — Migration v2
--  Run this in the Supabase SQL Editor to add new tables.
--  Safe to re-run (uses IF NOT EXISTS / ON CONFLICT DO NOTHING).
-- ─────────────────────────────────────────────────────────────────

-- Add rider_id column to orders (for delivery assignment)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS rider_id TEXT;

-- ─── Riders ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS riders (
  id               TEXT PRIMARY KEY,
  name             TEXT NOT NULL,
  phone            TEXT UNIQUE NOT NULL,
  pin_hash         TEXT NOT NULL,
  vehicle_type     TEXT NOT NULL CHECK (vehicle_type IN ('motorcycle','bicycle','car')),
  rating           DECIMAL(3,2) DEFAULT 5.0,
  total_deliveries INTEGER DEFAULT 0,
  is_active        BOOLEAN DEFAULT true,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE riders DISABLE ROW LEVEL SECURITY;

-- ─── Rider Sessions ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rider_sessions (
  token      TEXT PRIMARY KEY,
  rider_id   TEXT NOT NULL REFERENCES riders(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_rider_sessions_expires ON rider_sessions(expires_at);
ALTER TABLE rider_sessions DISABLE ROW LEVEL SECURITY;

-- ─── Rider Deliveries ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rider_deliveries (
  id           TEXT PRIMARY KEY,
  order_id     TEXT REFERENCES orders(id) ON DELETE CASCADE,
  rider_id     TEXT REFERENCES riders(id) ON DELETE SET NULL,
  status       TEXT DEFAULT 'available' CHECK (status IN ('available','accepted','picked_up','delivered','cancelled')),
  earnings     INTEGER DEFAULT 0,
  accepted_at  TIMESTAMPTZ,
  picked_up_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE rider_deliveries DISABLE ROW LEVEL SECURITY;

-- ─── Payments (replaces in-memory TRANSACTIONS) ───────────────────
CREATE TABLE IF NOT EXISTS payments (
  reference    TEXT PRIMARY KEY,
  amount       INTEGER NOT NULL,
  email        TEXT,
  phone        TEXT,
  order_id     TEXT,
  gateway      TEXT NOT NULL DEFAULT 'paystack' CHECK (gateway IN ('paystack','opay','demo')),
  method       TEXT,
  status       TEXT NOT NULL DEFAULT 'initialized' CHECK (status IN ('initialized','success','failed','abandoned')),
  metadata     JSONB DEFAULT '{}',
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;

-- ─── Wellness Specialists ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wellness_specialists (
  id            TEXT PRIMARY KEY,
  type          TEXT NOT NULL,
  name          TEXT NOT NULL,
  specialty     TEXT NOT NULL,
  badge         TEXT,
  conditions    TEXT[] DEFAULT '{}',
  price         INTEGER NOT NULL,
  rating        DECIMAL(3,2) DEFAULT 5.0,
  sessions      INTEGER DEFAULT 0,
  availability  TEXT DEFAULT 'Today',
  color         TEXT DEFAULT '#154212',
  bg            TEXT DEFAULT '#E8F5E9',
  icon          TEXT DEFAULT 'user',
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE wellness_specialists DISABLE ROW LEVEL SECURITY;

-- ─── Seed Riders (PIN = "1234", sha256 hashed) ───────────────────
-- sha256("1234") = a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3
INSERT INTO riders (id, name, phone, pin_hash, vehicle_type, rating, total_deliveries) VALUES
  ('rid-001', 'Chukwuemeka Adeyemi', '+2348023456789', 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', 'motorcycle', 4.8, 347),
  ('rid-002', 'Tunde Bakare',        '+2348071234567', 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', 'bicycle',    4.6, 128),
  ('rid-003', 'Aminu Garba',         '+2347031234567', 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', 'motorcycle', 4.9, 512)
ON CONFLICT (id) DO NOTHING;

-- ─── Seed Wellness Specialists ────────────────────────────────────
INSERT INTO wellness_specialists (id, type, name, specialty, badge, conditions, price, rating, sessions, availability, color, bg, icon) VALUES
  ('spec-001', 'Nutritionist',         'Dr. Adaeze Okonkwo',    'Clinical Nutrition & Weight Management',    'BSN, RD, PhD',    ARRAY['weightloss','diabetes'],           8500,  4.9, 312, 'Today',    '#2D5A27', '#E8F5E9', 'thermometer'),
  ('spec-002', 'Registered Dietitian', 'Dr. Emeka Nwosu',       'Cardiovascular Diet & Hypertension',        'RD, MSc',         ARRAY['hypertension','liver'],            7200,  4.8, 228, 'Tomorrow', '#8B500A', '#FFF3E0', 'heart'),
  ('spec-003', 'Health Coach',         'Coach Fatima Al-Rashid','Behavioural Change & Lifestyle Medicine',   'CHC, PCC (ICF)',   ARRAY['weightloss','allergies'],          5500,  4.9, 480, 'Today',    '#493700', '#FFF8E1', 'activity'),
  ('spec-004', 'General Practitioner', 'Dr. Bola Fashola',      'Metabolic Syndrome & Liver Disease',        'MBBS, MRCGP',     ARRAY['liver','hypertension','diabetes'], 12000, 4.7, 156, 'Friday',   '#154212', '#E8F5E9', 'user')
ON CONFLICT (id) DO NOTHING;
