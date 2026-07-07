-- Consolidated migration for the cross-role workflow overhaul (Fase A-G).
-- Run once in the Supabase SQL editor before starting the app.

-- ── Fase C1: Absensi — arsip harian ──────────────────────────────────────────
-- Snapshot per-hari sebelum baris attendance asli dihapus oleh cron
-- /api/cron/archive-attendance (lihat src/lib/attendance-archive.ts).
CREATE TABLE IF NOT EXISTS attendance_archives (
  id TEXT PRIMARY KEY,
  archive_date DATE NOT NULL UNIQUE,
  record_count INTEGER NOT NULL DEFAULT 0,
  records JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_attendance_archives_date ON attendance_archives(archive_date);

-- ── Fase D1: Pustaka Kompetensi — approval Direktur ──────────────────────────
-- HRD tidak lagi bisa langsung menambah kompetensi baru ke tabel `skills`;
-- usulan masuk ke sini dulu, baru dibuat setelah Direktur menyetujui
-- (lihat reviewCompetencyRequest di src/app/actions/skills.ts).
CREATE TABLE IF NOT EXISTS competency_requests (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  department TEXT,
  requested_by TEXT,
  status TEXT NOT NULL DEFAULT 'Pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  decided_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_competency_requests_status ON competency_requests(status);

-- ── Fase G2: Departemen — approval Direktur ──────────────────────────────────
-- HRD mengusulkan departemen baru di sini; org_units hanya dibuat setelah
-- Direktur menyetujui (lihat createDepartmentRequest/reviewDepartmentRequest
-- di src/app/actions/org.ts).
CREATE TABLE IF NOT EXISTS department_requests (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  parent_code TEXT,
  leader_name TEXT,
  leader_email TEXT,
  requested_by TEXT,
  status TEXT NOT NULL DEFAULT 'Pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  decided_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_department_requests_status ON department_requests(status);

-- ── Fase E1: Pelatihan — approval anggaran Direktur ──────────────────────────
ALTER TABLE trainings ADD COLUMN IF NOT EXISTS proposed_cost NUMERIC;
ALTER TABLE trainings ADD COLUMN IF NOT EXISTS budget_status TEXT NOT NULL DEFAULT 'Disetujui';
-- budget_status: 'Menunggu Direktur' | 'Disetujui' | 'Ditolak'.
-- Trainings created before this migration default to 'Disetujui' so nothing
-- already-running gets silently blocked.

-- ── Fase F4: Tes Rekrutmen — scoping departemen + arsip tahunan psikotes ────
ALTER TABLE recruitment_tests ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE recruitment_tests ADD COLUMN IF NOT EXISTS test_year INTEGER;
