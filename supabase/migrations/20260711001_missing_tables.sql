-- These 11 tables were written in earlier migrations (under English names,
-- predating the big Indonesian rename) but were never actually applied to
-- the live database — the rename migrations later renamed *existing* tables,
-- which doesn't create tables that never existed in the first place. Their
-- features (Video Tutorial, Kebijakan Perusahaan, Basis Pengetahuan, Umpan
-- Balik Kinerja, Penghargaan Karyawan, all of Suksesi, Survei Karyawan, and
-- in-app Panduan/Guides) have been silently broken in production ever since.
-- Created directly under final Indonesian names + karyawan FK this time.

CREATE TABLE IF NOT EXISTS penghargaan_karyawan (
  id TEXT PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES karyawan(id),
  employee_name TEXT DEFAULT '',
  department TEXT DEFAULT '',
  category TEXT NOT NULL,
  description TEXT DEFAULT '',
  award_date TEXT NOT NULL,
  given_by TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_penghargaan_karyawan_employee ON penghargaan_karyawan(employee_id);
CREATE INDEX IF NOT EXISTS idx_penghargaan_karyawan_category ON penghargaan_karyawan(category);

CREATE TABLE IF NOT EXISTS survei_karyawan (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  survey_type TEXT NOT NULL,
  questions TEXT NOT NULL,
  questions_json JSONB,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'Aktif',
  created_by TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_survei_karyawan_type ON survei_karyawan(survey_type);
CREATE INDEX IF NOT EXISTS idx_survei_karyawan_status ON survei_karyawan(status);

CREATE TABLE IF NOT EXISTS jawaban_survei (
  id TEXT PRIMARY KEY,
  survey_id TEXT NOT NULL REFERENCES survei_karyawan(id) ON DELETE CASCADE,
  employee_id TEXT NOT NULL,
  employee_name TEXT,
  answers JSONB NOT NULL,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(survey_id, employee_id)
);
CREATE INDEX IF NOT EXISTS idx_jawaban_survei_survey ON jawaban_survei(survey_id);

CREATE TABLE IF NOT EXISTS umpan_balik_kinerja (
  id TEXT PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES karyawan(id),
  reviewer_id TEXT,
  reviewer_name TEXT,
  category TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_umpan_balik_kinerja_employee ON umpan_balik_kinerja(employee_id);
CREATE INDEX IF NOT EXISTS idx_umpan_balik_kinerja_created ON umpan_balik_kinerja(created_at DESC);

CREATE TABLE IF NOT EXISTS kebijakan_perusahaan (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT,
  content TEXT NOT NULL,
  effective_date DATE,
  revision TEXT DEFAULT 'Rev. 1',
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_kebijakan_perusahaan_category ON kebijakan_perusahaan(category);

CREATE TABLE IF NOT EXISTS artikel_pengetahuan (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT,
  author TEXT,
  content TEXT NOT NULL,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_artikel_pengetahuan_category ON artikel_pengetahuan(category);

CREATE TABLE IF NOT EXISTS video_pelatihan (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT,
  video_url TEXT NOT NULL,
  duration TEXT,
  description TEXT,
  views INTEGER DEFAULT 0,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_video_pelatihan_category ON video_pelatihan(category);

CREATE TABLE IF NOT EXISTS penilaian_kesiapan_suksesi (
  id TEXT PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES karyawan(id),
  year INTEGER NOT NULL,
  kepemimpinan INTEGER NOT NULL DEFAULT 0 CHECK (kepemimpinan BETWEEN 0 AND 100),
  keahlian_teknis INTEGER NOT NULL DEFAULT 0 CHECK (keahlian_teknis BETWEEN 0 AND 100),
  pengalaman INTEGER NOT NULL DEFAULT 0 CHECK (pengalaman BETWEEN 0 AND 100),
  kinerja INTEGER NOT NULL DEFAULT 0 CHECK (kinerja BETWEEN 0 AND 100),
  potensi INTEGER NOT NULL DEFAULT 0 CHECK (potensi BETWEEN 0 AND 100),
  total_score INTEGER NOT NULL DEFAULT 0 CHECK (total_score BETWEEN 0 AND 100),
  assessed_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (employee_id, year)
);
CREATE INDEX IF NOT EXISTS idx_penilaian_kesiapan_suksesi_employee ON penilaian_kesiapan_suksesi(employee_id);

CREATE TABLE IF NOT EXISTS kandidat_suksesor (
  id TEXT PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES karyawan(id),
  target_position_employee_id UUID REFERENCES karyawan(id),
  readiness_override INTEGER CHECK (readiness_override BETWEEN 0 AND 100),
  notes TEXT,
  added_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (employee_id)
);
CREATE INDEX IF NOT EXISTS idx_kandidat_suksesor_employee ON kandidat_suksesor(employee_id);

CREATE TABLE IF NOT EXISTS posisi_kritis (
  id TEXT PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES karyawan(id),
  risk_level TEXT NOT NULL CHECK (risk_level IN ('Rendah', 'Sedang', 'Tinggi')),
  vacancy_risk_date DATE,
  marked_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (employee_id)
);
CREATE INDEX IF NOT EXISTS idx_posisi_kritis_employee ON posisi_kritis(employee_id);

CREATE TABLE IF NOT EXISTS pool_suksesi (
  id TEXT PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES karyawan(id),
  potential_rating TEXT NOT NULL CHECK (potential_rating IN ('Bintang', 'Potensial Tinggi', 'Solid', 'Perlu Pengembangan')),
  notes TEXT,
  added_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (employee_id)
);
CREATE INDEX IF NOT EXISTS idx_pool_suksesi_employee ON pool_suksesi(employee_id);

CREATE TABLE IF NOT EXISTS panduan_bantuan (
  id TEXT PRIMARY KEY,
  role TEXT NOT NULL,
  category TEXT DEFAULT 'Umum',
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_panduan_bantuan_role ON panduan_bantuan(role);
