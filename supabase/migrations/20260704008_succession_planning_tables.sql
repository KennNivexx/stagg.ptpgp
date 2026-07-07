-- Backs the three succession-planning forms that were previously disabled
-- ("Segera tersedia"): Tambah Kandidat, Tandai sebagai Posisi Kritis, Tambah ke
-- Talent Pool. Kept as separate tables from succession_readiness_assessments
-- because "menambahkan ke rencana suksesi" is a different concept from
-- "menilai kesiapan". Apply via: Supabase Dashboard > SQL Editor

CREATE TABLE IF NOT EXISTS succession_candidates (
  id TEXT PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees(id),
  target_position_employee_id UUID REFERENCES employees(id),
  readiness_override INTEGER CHECK (readiness_override BETWEEN 0 AND 100),
  notes TEXT,
  added_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (employee_id)
);
CREATE INDEX IF NOT EXISTS idx_succession_candidates_employee ON succession_candidates(employee_id);

CREATE TABLE IF NOT EXISTS succession_critical_positions (
  id TEXT PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees(id),
  risk_level TEXT NOT NULL CHECK (risk_level IN ('Rendah', 'Sedang', 'Tinggi')),
  vacancy_risk_date DATE,
  marked_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (employee_id)
);
CREATE INDEX IF NOT EXISTS idx_succession_critical_positions_employee ON succession_critical_positions(employee_id);

CREATE TABLE IF NOT EXISTS succession_talent_pool (
  id TEXT PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees(id),
  potential_rating TEXT NOT NULL CHECK (potential_rating IN ('Bintang', 'Potensial Tinggi', 'Solid', 'Perlu Pengembangan')),
  notes TEXT,
  added_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (employee_id)
);
CREATE INDEX IF NOT EXISTS idx_succession_talent_pool_employee ON succession_talent_pool(employee_id);
