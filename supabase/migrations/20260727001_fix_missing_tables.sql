-- Fixes 12 tables that were defined in earlier migrations but never actually
-- created in production:
--
-- 6 of them (communication_reads, participation_entries, employee_cases,
-- labour_unions, employee_separations, er_approvals — all from
-- 20260724001_employee_relations.sql) declared their karyawan_id FK columns
-- as TEXT, but karyawan.id is UUID. A TEXT column cannot carry a foreign key
-- to a UUID primary key, so every one of those CREATE TABLE statements
-- errored — and because they were wrapped in `DO $$ ... EXCEPTION WHEN
-- OTHERS THEN RAISE NOTICE ... END $$` blocks, the error was silently
-- swallowed instead of failing the migration loudly. This file recreates
-- them with the correct UUID type.
--
-- The other 6 (struktur_organisasi_versi, riwayat_posisi_karyawan,
-- jalur_jabatan from 20260712001_org_design_overhaul.sql; tna_kompetensi,
-- evaluasi_pelatihan from 20260715001_learning_training_management.sql;
-- pemetaan_pengetahuan from 20260716001_knowledge_management.sql) were
-- already typed correctly — they just appear to have never been applied.
-- Reproduced here verbatim (all CREATE TABLE IF NOT EXISTS, safe to re-run).

-- ── org_design_overhaul leftovers ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS struktur_organisasi_versi (
  id TEXT PRIMARY KEY,
  nama TEXT NOT NULL,
  nomor_sk TEXT NOT NULL,
  tanggal_sk DATE NOT NULL,
  tanggal_berlaku DATE NOT NULL,
  versi TEXT NOT NULL DEFAULT 'V1.0',
  status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft','Review','Approved','Archived')),
  keterangan TEXT,
  created_by TEXT,
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS riwayat_posisi_karyawan (
  id TEXT PRIMARY KEY,
  karyawan_id UUID NOT NULL REFERENCES karyawan(id),
  formasi_id TEXT REFERENCES formasi_jabatan(id),
  jabatan_id TEXT REFERENCES jabatan(id),
  unit_organisasi_id TEXT REFERENCES unit_organisasi(id),
  jenis_perubahan TEXT NOT NULL DEFAULT 'Penempatan' CHECK (jenis_perubahan IN ('Hire','Penempatan','Promosi','Mutasi','Demosi','Nonaktif')),
  tanggal_mulai DATE NOT NULL,
  tanggal_selesai DATE,
  keterangan TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_riwayat_posisi_karyawan ON riwayat_posisi_karyawan(karyawan_id);

CREATE TABLE IF NOT EXISTS jalur_jabatan (
  id TEXT PRIMARY KEY,
  jabatan_dari_id TEXT NOT NULL REFERENCES jabatan(id),
  jabatan_ke_id TEXT NOT NULL REFERENCES jabatan(id),
  keterangan TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(jabatan_dari_id, jabatan_ke_id)
);

-- ── learning_training_management leftovers ───────────────────────────────

CREATE TABLE IF NOT EXISTS tna_kompetensi (
  id TEXT PRIMARY KEY,
  karyawan_id UUID NOT NULL REFERENCES karyawan(id),
  skill_id TEXT NOT NULL REFERENCES master_kompetensi(id),
  required_level INTEGER NOT NULL,
  current_level INTEGER NOT NULL,
  gap INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open','Assigned','Resolved')),
  pelatihan_id TEXT REFERENCES pelatihan(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(karyawan_id, skill_id, status)
);
CREATE INDEX IF NOT EXISTS idx_tna_kompetensi_skill ON tna_kompetensi(skill_id);
CREATE INDEX IF NOT EXISTS idx_tna_kompetensi_status ON tna_kompetensi(status);

CREATE TABLE IF NOT EXISTS evaluasi_pelatihan (
  id TEXT PRIMARY KEY,
  training_id TEXT NOT NULL REFERENCES pelatihan(id),
  karyawan_id UUID NOT NULL REFERENCES karyawan(id),
  reaction_score INTEGER CHECK (reaction_score BETWEEN 1 AND 5),
  learning_score INTEGER CHECK (learning_score BETWEEN 1 AND 5),
  behavior_score INTEGER CHECK (behavior_score BETWEEN 1 AND 5),
  result_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(training_id, karyawan_id)
);

-- ── knowledge_management leftover ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pemetaan_pengetahuan (
  id TEXT PRIMARY KEY,
  content_type TEXT NOT NULL CHECK (content_type IN ('sop','kebijakan','artikel','video')),
  content_id TEXT NOT NULL,
  skill_id TEXT NOT NULL REFERENCES master_kompetensi(id),
  wajib BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(content_type, content_id, skill_id)
);
CREATE INDEX IF NOT EXISTS idx_pemetaan_pengetahuan_skill ON pemetaan_pengetahuan(skill_id);

-- ── employee_relations leftovers (karyawan_id fixed to UUID) ────────────

CREATE TABLE IF NOT EXISTS communication_reads (
  id TEXT PRIMARY KEY,
  communication_id TEXT NOT NULL REFERENCES communications(id) ON DELETE CASCADE,
  karyawan_id UUID NOT NULL REFERENCES karyawan(id),
  read_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(communication_id, karyawan_id)
);

CREATE TABLE IF NOT EXISTS participation_entries (
  id TEXT PRIMARY KEY,
  participation_type TEXT NOT NULL CHECK (participation_type IN ('Suggestion','Innovation','Voice of Employee','Polling','Feedback','Satisfaction Survey')),
  karyawan_id UUID REFERENCES karyawan(id), -- nullable: Voice of Employee can be anonymous
  title TEXT NOT NULL, description TEXT, score NUMERIC,
  status TEXT DEFAULT 'Submitted' CHECK (status IN ('Submitted','Under Review','Accepted','Rejected','Implemented')),
  response TEXT, responded_by TEXT, created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS employee_cases (
  id TEXT PRIMARY KEY,
  case_type TEXT NOT NULL CHECK (case_type IN ('Complaint','Grievance','Ethics Violation','Fraud','Harassment','Whistleblowing')),
  case_category_id TEXT REFERENCES case_categories(id),
  reporter_karyawan_id UUID REFERENCES karyawan(id), -- nullable: anonymous / whistleblowing
  subject_karyawan_id UUID REFERENCES karyawan(id),  -- nullable: not always about a specific person
  subject_department TEXT,
  title TEXT NOT NULL, description TEXT NOT NULL,
  status TEXT DEFAULT 'Case Created' CHECK (status IN ('Case Created','Validation','Investigation','Committee Review','Decision','Corrective Action','Monitoring','Case Closed','Rejected')),
  pic_karyawan_id UUID REFERENCES karyawan(id),
  sla_due_date DATE, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS labour_unions (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, chairman_karyawan_id UUID REFERENCES karyawan(id),
  member_count INTEGER DEFAULT 0, registered_date DATE,
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active','Inactive')), created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS employee_separations (
  id TEXT PRIMARY KEY,
  separation_type TEXT NOT NULL CHECK (separation_type IN ('Retirement','End of Contract','Termination','Death')),
  karyawan_id UUID NOT NULL REFERENCES karyawan(id),
  exit_reason_id TEXT REFERENCES exit_reasons(id),
  effective_date DATE NOT NULL, reason TEXT,
  exit_interview_done BOOLEAN DEFAULT FALSE, exit_interview_notes TEXT,
  status TEXT DEFAULT 'Diajukan' CHECK (status IN ('Diajukan','Disetujui','Ditolak','Selesai')),
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS er_approvals (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL CHECK (category IN ('Complaint','Investigation','Corrective Action','Industrial','Separation','Case Closure')),
  reference_id TEXT NOT NULL, -- id in employee_cases / industrial_meetings / employee_separations depending on category
  approver_role TEXT, approver_karyawan_id UUID REFERENCES karyawan(id),
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending','Approved','Rejected')),
  notes TEXT, decided_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT NOW()
);
