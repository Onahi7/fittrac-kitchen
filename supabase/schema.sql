-- ─────────────────────────────────────────────────────────────────
--  Fittrac Kitchen — Supabase Schema
--  Run this once in the Supabase SQL Editor to set up all tables.
-- ─────────────────────────────────────────────────────────────────

-- Clinical Staff (doctors & nutritionists)
CREATE TABLE IF NOT EXISTS clinical_staff (
  id            TEXT PRIMARY KEY,
  username      TEXT UNIQUE NOT NULL,
  password      TEXT NOT NULL,
  name          TEXT NOT NULL,
  title         TEXT,
  role          TEXT NOT NULL CHECK (role IN ('doctor','nutritionist')),
  specialization TEXT,
  email         TEXT,
  badge         TEXT,
  license_no    TEXT,
  patients_today INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Mobile App Users
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT UNIQUE NOT NULL,
  phone         TEXT,
  password_hash TEXT,
  google_id     TEXT UNIQUE,
  conditions    TEXT[]  DEFAULT '{}',
  patient_id    TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Patients (created from mobile users who book consultations)
CREATE TABLE IF NOT EXISTS patients (
  id                        TEXT PRIMARY KEY,
  name                      TEXT NOT NULL,
  age                       INTEGER,
  gender                    TEXT,
  dob                       DATE,
  phone                     TEXT,
  email                     TEXT,
  conditions                TEXT[]  DEFAULT '{}',
  primary_condition         TEXT,
  bmi                       DECIMAL(5,2),
  blood_type                TEXT,
  last_visit                DATE,
  next_appointment          DATE,
  assigned_doctor_id        TEXT REFERENCES clinical_staff(id),
  assigned_nutritionist_id  TEXT REFERENCES clinical_staff(id),
  fasting_glucose           INTEGER,
  hba1c                     DECIMAL(4,2),
  bp_systolic               INTEGER,
  bp_diastolic              INTEGER,
  cholesterol               INTEGER,
  medications               TEXT[]  DEFAULT '{}',
  notes                     TEXT,
  adherence_score           INTEGER DEFAULT 0,
  risk_score                INTEGER DEFAULT 0,
  created_at                TIMESTAMPTZ DEFAULT NOW()
);

-- Add FK from users to patients (after patients table exists)
ALTER TABLE users ADD CONSTRAINT fk_users_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE SET NULL NOT VALID;

-- Orders (from mobile app, linked to user)
CREATE TABLE IF NOT EXISTS orders (
  id             TEXT PRIMARY KEY,
  user_id        TEXT REFERENCES users(id) ON DELETE SET NULL,
  items          JSONB DEFAULT '[]',
  fulfillment    TEXT NOT NULL CHECK (fulfillment IN ('delivery','pickup')),
  address        TEXT,
  total          INTEGER NOT NULL,
  payment_method TEXT,
  delivery_date  TEXT,
  status         TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed','preparing','ready','delivered','cancelled')),
  rider_id       TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Consultations
CREATE TABLE IF NOT EXISTS consultations (
  id               TEXT PRIMARY KEY,
  patient_id       TEXT REFERENCES patients(id),
  doctor_id        TEXT REFERENCES clinical_staff(id),
  nutritionist_id  TEXT REFERENCES clinical_staff(id),
  date             DATE NOT NULL,
  scheduled_time   TEXT,
  duration         INTEGER,
  status           TEXT DEFAULT 'scheduled',
  type             TEXT,
  notes            TEXT,
  chief_complaint  TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Lab Results
CREATE TABLE IF NOT EXISTS lab_results (
  id               TEXT PRIMARY KEY,
  patient_id       TEXT REFERENCES patients(id),
  ordered_by       TEXT REFERENCES clinical_staff(id),
  test_name        TEXT NOT NULL,
  value            TEXT,
  unit             TEXT,
  reference_range  TEXT,
  flag             TEXT,
  status           TEXT,
  date             DATE,
  uploaded_at      DATE,
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Meal Plans
CREATE TABLE IF NOT EXISTS meal_plans (
  id               TEXT PRIMARY KEY,
  patient_id       TEXT REFERENCES patients(id),
  nutritionist_id  TEXT REFERENCES clinical_staff(id),
  title            TEXT NOT NULL,
  status           TEXT DEFAULT 'active',
  target_calories  INTEGER,
  target_protein   INTEGER,
  target_carbs     INTEGER,
  target_fat       INTEGER,
  target_sodium    INTEGER,
  adherence_score  INTEGER DEFAULT 0,
  meals            JSONB DEFAULT '[]',
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Session Notes
CREATE TABLE IF NOT EXISTS session_notes (
  id               TEXT PRIMARY KEY,
  patient_id       TEXT REFERENCES patients(id),
  nutritionist_id  TEXT REFERENCES clinical_staff(id),
  date             DATE,
  session_type     TEXT,
  summary          TEXT,
  action_items     TEXT[] DEFAULT '{}',
  next_session     DATE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Prescriptions
CREATE TABLE IF NOT EXISTS prescriptions (
  id           TEXT PRIMARY KEY,
  patient_id   TEXT REFERENCES patients(id),
  doctor_id    TEXT REFERENCES clinical_staff(id),
  date         DATE,
  diagnosis    TEXT,
  medications  JSONB DEFAULT '[]',
  notes        TEXT,
  valid_until  DATE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Menu Items (admin-managed) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS menu_items (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  price           INTEGER NOT NULL,
  calories        INTEGER DEFAULT 0,
  meal_type       TEXT NOT NULL CHECK (meal_type IN ('breakfast','lunch','dinner','drink','snack')),
  conditions      TEXT[] DEFAULT '{}',
  glycemic_index  TEXT DEFAULT 'Low' CHECK (glycemic_index IN ('Low','Medium','High')),
  sodium_level    TEXT DEFAULT 'Low' CHECK (sodium_level IN ('Low','Medium','High')),
  description     TEXT,
  image_url       TEXT,
  is_available    BOOLEAN DEFAULT true,
  display_order   INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO menu_items (id, name, price, calories, meal_type, conditions, glycemic_index, sodium_level, description) VALUES
  ('m1', 'Akara Protein Balls', 3200, 340, 'breakfast', ARRAY['weightloss','diabetes'], 'Low', 'Low', 'Crispy bean fritters packed with plant protein and spiced with scent leaf.'),
  ('m2', 'Egusi Soup + Pounded Yam', 5800, 520, 'lunch', ARRAY['hypertension','liver'], 'Medium', 'Low', 'Rich melon seed soup with ugu leaves, served with silky pounded yam.'),
  ('m3', 'Tilapia Pepper Soup', 6200, 280, 'lunch', ARRAY['diabetes','liver','hypertension'], 'Low', 'Medium', 'Light medicinal pepper soup with tilapia, uziza, and scent leaf.'),
  ('m4', 'Moi Moi Health Bowl', 4500, 380, 'dinner', ARRAY['weightloss','hypertension'], 'Low', 'Low', 'Steamed bean pudding enriched with vegetables and crayfish.'),
  ('m5', 'Jollof Brown Rice', 4800, 420, 'lunch', ARRAY['diabetes','weightloss'], 'Low', 'Low', 'Low-GI brown rice in a rich tomato base, loaded with antioxidants.'),
  ('m6', 'Ogbono Light Soup', 5200, 310, 'dinner', ARRAY['liver','hypertension'], 'Low', 'Low', 'Drawing soup made with bitter leaf, fluted pumpkin, and lean protein.'),
  ('m7', 'Zobo Detox Drink', 1800, 45, 'drink', ARRAY['hypertension','liver'], 'Low', 'Low', 'Hibiscus tea blended with ginger and natural fruit to reduce blood pressure.'),
  ('m8', 'Moringa Power Smoothie', 2200, 120, 'drink', ARRAY['diabetes','weightloss','liver'], 'Low', 'Low', 'Nutrient-dense moringa blended with banana, ginger, and coconut water.'),
  ('m9', 'Turmeric Ginger Elixir', 2000, 60, 'drink', ARRAY['hypertension','liver','allergies'], 'Low', 'Low', 'Anti-inflammatory golden drink with turmeric, ginger, and black pepper.')
ON CONFLICT (id) DO NOTHING;

-- ─── App Settings (key-value store) ─────────────────────────────
CREATE TABLE IF NOT EXISTS app_settings (
  key        TEXT PRIMARY KEY,
  value      TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO app_settings (key, value) VALUES
  ('app_tagline',     'The Earth''s Apothecary'),
  ('hero_title',      'Nigerian Wellness Cuisine'),
  ('hero_subtitle',   'Food as Medicine, Culture as Cure'),
  ('primary_color',   '#154212'),
  ('secondary_color', '#8b500a'),
  ('logo_url',        ''),
  ('banner_url',      ''),
  ('announcement',    '')
ON CONFLICT (key) DO NOTHING;

-- ─── Admin Users (hashed credentials, seeded on server start) ───
CREATE TABLE IF NOT EXISTS admin_users (
  id            TEXT PRIMARY KEY,
  username      TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name  TEXT NOT NULL,
  role          TEXT DEFAULT 'admin' CHECK (role IN ('admin','super_admin')),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Admin Sessions ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_sessions (
  token      TEXT PRIMARY KEY,
  admin_id   TEXT NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  username   TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires ON admin_sessions(expires_at);

-- ─── User Sessions ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_sessions (
  token      TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email      TEXT NOT NULL,
  name       TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);

-- ─── Clinical Test Requests ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS clinical_test_requests (
  id               TEXT PRIMARY KEY,
  consultation_id  TEXT,
  doctor_name      TEXT,
  requested_at     TIMESTAMPTZ DEFAULT NOW(),
  tests            JSONB DEFAULT '[]',
  status           TEXT DEFAULT 'pending' CHECK (status IN ('pending','completed','cancelled')),
  result_image_uri TEXT,
  doctor_comment   TEXT
);

-- ─── Extend prescriptions for consultation context ────────────────
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS consultation_id TEXT;
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS doctor_name     TEXT;
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS doctor_type     TEXT;
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS issued_at       TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS lab_tests       TEXT[]  DEFAULT '{}';
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS follow_up_date  TEXT;

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

-- ─── Rider Sessions ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rider_sessions (
  token      TEXT PRIMARY KEY,
  rider_id   TEXT NOT NULL REFERENCES riders(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_rider_sessions_expires ON rider_sessions(expires_at);

-- ─── Rider Deliveries ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rider_deliveries (
  id          TEXT PRIMARY KEY,
  order_id    TEXT REFERENCES orders(id) ON DELETE CASCADE,
  rider_id    TEXT REFERENCES riders(id) ON DELETE SET NULL,
  status      TEXT DEFAULT 'available' CHECK (status IN ('available','accepted','picked_up','delivered','cancelled')),
  earnings    INTEGER DEFAULT 0,
  accepted_at TIMESTAMPTZ,
  picked_up_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

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

-- ─── Wellness Specialists (replaces hardcoded mobile array) ───────
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

INSERT INTO wellness_specialists (id, type, name, specialty, badge, conditions, price, rating, sessions, availability, color, bg, icon) VALUES
  ('spec-001', 'Nutritionist',         'Dr. Adaeze Okonkwo',  'Clinical Nutrition & Weight Management',     'BSN, RD, PhD',    ARRAY['weightloss','diabetes'],           8500,  4.9, 312, 'Today',    '#2D5A27', '#E8F5E9', 'thermometer'),
  ('spec-002', 'Registered Dietitian', 'Dr. Emeka Nwosu',     'Cardiovascular Diet & Hypertension',         'RD, MSc',         ARRAY['hypertension','liver'],            7200,  4.8, 228, 'Tomorrow', '#8B500A', '#FFF3E0', 'heart'),
  ('spec-003', 'Health Coach',         'Coach Fatima Al-Rashid','Behavioural Change & Lifestyle Medicine',  'CHC, PCC (ICF)',   ARRAY['weightloss','allergies'],          5500,  4.9, 480, 'Today',    '#493700', '#FFF8E1', 'activity'),
  ('spec-004', 'General Practitioner', 'Dr. Bola Fashola',    'Metabolic Syndrome & Liver Disease',         'MBBS, MRCGP',     ARRAY['liver','hypertension','diabetes'], 12000, 4.7, 156, 'Friday',   '#154212', '#E8F5E9', 'user')
ON CONFLICT (id) DO NOTHING;

-- ─── Seed initial riders ─────────────────────────────────────────
INSERT INTO riders (id, name, phone, pin_hash, vehicle_type, rating, total_deliveries) VALUES
  ('rid-001', 'Chukwuemeka Adeyemi', '+2348023456789', 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', 'motorcycle', 4.8, 347),
  ('rid-002', 'Tunde Bakare',        '+2348071234567', 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', 'bicycle',    4.6, 128),
  ('rid-003', 'Aminu Garba',         '+2347031234567', 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', 'motorcycle', 4.9, 512)
ON CONFLICT (id) DO NOTHING;

-- Disable Row Level Security (service role bypasses anyway)
ALTER TABLE clinical_staff           DISABLE ROW LEVEL SECURITY;
ALTER TABLE users                    DISABLE ROW LEVEL SECURITY;
ALTER TABLE patients                 DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders                   DISABLE ROW LEVEL SECURITY;
ALTER TABLE consultations            DISABLE ROW LEVEL SECURITY;
ALTER TABLE lab_results              DISABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans               DISABLE ROW LEVEL SECURITY;
ALTER TABLE session_notes            DISABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions            DISABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items               DISABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings             DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users              DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions           DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions            DISABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_test_requests   DISABLE ROW LEVEL SECURITY;
ALTER TABLE riders                   DISABLE ROW LEVEL SECURITY;
ALTER TABLE rider_sessions           DISABLE ROW LEVEL SECURITY;
ALTER TABLE rider_deliveries         DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments                 DISABLE ROW LEVEL SECURITY;
ALTER TABLE wellness_specialists     DISABLE ROW LEVEL SECURITY;
