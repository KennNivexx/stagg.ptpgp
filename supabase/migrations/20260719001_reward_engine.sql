-- Reward Engine: menambah rule-based reward generation (bukan input manual),
-- Salary Review di atas mutasi_karir yang sudah ada, dan Merit Matrix.
-- Payroll/PPh21/BPJS tidak disentuh — sudah benar, cuma jadi downstream.

CREATE TABLE IF NOT EXISTS aturan_reward (
  id TEXT PRIMARY KEY,
  nama TEXT NOT NULL,
  min_kpi_score NUMERIC,          -- syarat skor evaluasi_kpi.final_score (NULL = tidak disyaratkan)
  min_attendance_pct NUMERIC,     -- syarat % kehadiran periode berjalan
  no_active_warning BOOLEAN DEFAULT FALSE, -- syarat tidak ada surat_peringatan aktif
  min_training_completion_pct NUMERIC,
  reward_type TEXT NOT NULL DEFAULT 'bonus', -- dipetakan ke insentif.type
  calc_method TEXT NOT NULL DEFAULT 'percent_basic' CHECK (calc_method IN ('percent_basic','fixed_amount')),
  calc_value NUMERIC NOT NULL DEFAULT 0, -- persen (0-100) atau nominal tetap
  aktif BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Salary Review di atas mutasi_karir yang sudah ada (posisi lama/baru, status
-- workflow) — cuma tambah dimensi gaji, bukan tabel baru terpisah.
ALTER TABLE mutasi_karir ADD COLUMN IF NOT EXISTS review_type TEXT; -- 'Merit Increase'|'Grade Adjustment'|'Promotion Adjustment'|'Market Adjustment'
ALTER TABLE mutasi_karir ADD COLUMN IF NOT EXISTS salary_before NUMERIC;
ALTER TABLE mutasi_karir ADD COLUMN IF NOT EXISTS salary_after NUMERIC;
ALTER TABLE mutasi_karir ADD COLUMN IF NOT EXISTS grade_before TEXT;
ALTER TABLE mutasi_karir ADD COLUMN IF NOT EXISTS grade_after TEXT;

-- grade_jabatan seharusnya sudah dibuat oleh migrasi 20260712001_org_design_
-- overhaul.sql, tapi ternyata belum pernah dijalankan di database ini —
-- dibuat ulang di sini (idempotent) supaya migrasi ini tidak bergantung pada
-- migrasi lama yang belum jalan. Skema persis sama dengan migrasi aslinya.
CREATE TABLE IF NOT EXISTS grade_jabatan (
  id TEXT PRIMARY KEY,
  kode TEXT UNIQUE NOT NULL,
  nama TEXT NOT NULL,
  urutan INTEGER NOT NULL DEFAULT 0,
  salary_min NUMERIC,
  salary_max NUMERIC,
  keterangan TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Same defensive reasoning — recommendMeritPct() reads jabatan.grade_id.
ALTER TABLE jabatan ADD COLUMN IF NOT EXISTS grade_id TEXT;

-- Merit Matrix: performance band x grade -> % kenaikan rekomendasi.
CREATE TABLE IF NOT EXISTS merit_matrix (
  id TEXT PRIMARY KEY,
  performance_min NUMERIC NOT NULL, -- skor KPI minimum untuk band ini
  performance_max NUMERIC NOT NULL,
  grade_id TEXT REFERENCES grade_jabatan(id), -- NULL = berlaku semua grade
  merit_pct NUMERIC NOT NULL, -- persen kenaikan direkomendasikan
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reward Budget Control ringan: pagu per departemen per periode, dicek saat
-- approve bonus/insentif (bukan blocking keras, cuma indikator + warning).
CREATE TABLE IF NOT EXISTS reward_budget (
  id TEXT PRIMARY KEY,
  department TEXT NOT NULL,
  period TEXT NOT NULL, -- "MM/YYYY", sama format dengan insentif.period
  budget_amount NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(department, period)
);
