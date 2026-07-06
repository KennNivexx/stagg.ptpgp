-- ============================================================
-- Pelatihan: permintaan training dari Kepala Departemen (berbasis
-- Analisis Kesenjangan), analisis ROTI, dan data nyata untuk
-- Materi Kursus / Kuis & Ujian / Sertifikat (sebelumnya seluruhnya
-- data mock statis di kode, tidak tersambung ke database).
-- ============================================================

-- Permintaan pelatihan: diajukan oleh Kepala Departemen berdasarkan
-- kesenjangan kompetensi di departemennya, ditinjau oleh HRD.
CREATE TABLE IF NOT EXISTS training_requests (
  id TEXT PRIMARY KEY DEFAULT 'treq-' || gen_random_uuid()::text,
  department TEXT NOT NULL,
  skill_id UUID,
  skill_name TEXT,
  current_level INTEGER,
  required_level INTEGER,
  reason TEXT,
  requested_by TEXT,
  requested_by_name TEXT,
  status TEXT NOT NULL DEFAULT 'Pending',
  training_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_training_requests_status ON training_requests(status);
CREATE INDEX IF NOT EXISTS idx_training_requests_department ON training_requests(department);

-- Kaitkan training ke departemen/permintaan asalnya
ALTER TABLE trainings ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE trainings ADD COLUMN IF NOT EXISTS source_request_id TEXT;

-- Analisis Dampak ROTI (Return On Training Investment) per program
CREATE TABLE IF NOT EXISTS training_roi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  training_id TEXT NOT NULL UNIQUE,
  cost BIGINT NOT NULL DEFAULT 0,
  benefit BIGINT NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Materi, Kuis & Ujian, dan Sertifikat sekarang mengikuti training
-- sungguhan (training_id) alih-alih data contoh statis.
CREATE TABLE IF NOT EXISTS training_materials (
  id TEXT PRIMARY KEY DEFAULT 'mat-' || gen_random_uuid()::text,
  training_id TEXT NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'File',
  file_size TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_training_materials_training ON training_materials(training_id);

CREATE TABLE IF NOT EXISTS training_quizzes (
  id TEXT PRIMARY KEY DEFAULT 'quiz-' || gen_random_uuid()::text,
  training_id TEXT NOT NULL,
  title TEXT NOT NULL,
  questions_count INTEGER NOT NULL DEFAULT 0,
  pass_score INTEGER NOT NULL DEFAULT 70,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  status TEXT NOT NULL DEFAULT 'Draft',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_training_quizzes_training ON training_quizzes(training_id);

CREATE TABLE IF NOT EXISTS training_certificates (
  id TEXT PRIMARY KEY DEFAULT 'cert-' || gen_random_uuid()::text,
  training_id TEXT NOT NULL,
  employee_id TEXT NOT NULL,
  certificate_number TEXT NOT NULL,
  completion_date DATE,
  status TEXT NOT NULL DEFAULT 'Menunggu',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_training_certificates_training ON training_certificates(training_id);
