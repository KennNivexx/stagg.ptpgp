-- Performance Management: KPI catalog per jabatan, Core Values (Culture)
-- yang company-agnostic, split bobot TA:Culture per jabatan, dan kolom
-- untuk menyimpan Final Performance Score. evaluasi_kpi dan
-- umpan_balik_kinerja tetap source-of-truth, cuma di-extend.

CREATE TABLE IF NOT EXISTS kpi_jabatan (
  id TEXT PRIMARY KEY,
  jabatan_id TEXT NOT NULL REFERENCES jabatan(id),
  nama_kpi TEXT NOT NULL,
  source_system TEXT,
  satuan TEXT,
  bobot_default NUMERIC DEFAULT 0,
  aktif BOOLEAN DEFAULT TRUE,
  urutan INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_kpi_jabatan_jabatan ON kpi_jabatan(jabatan_id);

CREATE TABLE IF NOT EXISTS budaya_perusahaan (
  id TEXT PRIMARY KEY,
  kode TEXT,
  nama TEXT NOT NULL,
  deskripsi TEXT,
  aktif BOOLEAN DEFAULT TRUE,
  urutan INT DEFAULT 0,
  bobot_default NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS behaviour_indicator_budaya (
  id TEXT PRIMARY KEY,
  budaya_id TEXT NOT NULL REFERENCES budaya_perusahaan(id) ON DELETE CASCADE,
  deskripsi TEXT NOT NULL,
  urutan INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_behaviour_indicator_budaya ON behaviour_indicator_budaya(budaya_id);

CREATE TABLE IF NOT EXISTS performance_framework (
  id TEXT PRIMARY KEY,
  jabatan_id TEXT REFERENCES jabatan(id), -- NULL = default global
  ta_weight_pct NUMERIC NOT NULL DEFAULT 70,
  culture_weight_pct NUMERIC NOT NULL DEFAULT 30,
  aktif BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_performance_framework_jabatan
  ON performance_framework (COALESCE(jabatan_id, '__default__'));

ALTER TABLE evaluasi_kpi ADD COLUMN IF NOT EXISTS culture_score NUMERIC;
ALTER TABLE evaluasi_kpi ADD COLUMN IF NOT EXISTS final_score NUMERIC;
ALTER TABLE evaluasi_kpi ADD COLUMN IF NOT EXISTS ta_weight_used NUMERIC;
ALTER TABLE evaluasi_kpi ADD COLUMN IF NOT EXISTS culture_weight_used NUMERIC;

ALTER TABLE umpan_balik_kinerja ADD COLUMN IF NOT EXISTS budaya_id TEXT REFERENCES budaya_perusahaan(id);
ALTER TABLE umpan_balik_kinerja ADD COLUMN IF NOT EXISTS reviewer_role TEXT; -- 'self'|'supervisor'|'peer', freeform (no CHECK)
ALTER TABLE umpan_balik_kinerja ADD COLUMN IF NOT EXISTS period TEXT;
