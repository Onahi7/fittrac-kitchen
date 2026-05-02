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
  password_hash TEXT NOT NULL,
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

-- Disable Row Level Security (service role bypasses anyway)
ALTER TABLE clinical_staff  DISABLE ROW LEVEL SECURITY;
ALTER TABLE users            DISABLE ROW LEVEL SECURITY;
ALTER TABLE patients         DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders           DISABLE ROW LEVEL SECURITY;
ALTER TABLE consultations    DISABLE ROW LEVEL SECURITY;
ALTER TABLE lab_results      DISABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans       DISABLE ROW LEVEL SECURITY;
ALTER TABLE session_notes    DISABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions    DISABLE ROW LEVEL SECURITY;
