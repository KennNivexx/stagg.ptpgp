-- Manpower Request Management, Round 2 — a genuinely configurable Approval
-- Workflow (per the spec's own words: "Approval Workflow bersifat dinamis
-- dan dapat disesuaikan dengan struktur organisasi masing-masing
-- perusahaan"), Workload Analysis (completing the Validation Engine to 7/7
-- real checks), Employment Type master data, and Manpower SLA config.
--
-- Role mapping confirmed with the client — this company's org chart doesn't
-- have separate Division Head/HRBP/HR Manager/CEO accounts, those titles
-- map onto roles that already exist:
--   Department Head / Division Head -> department_manager (of requesting dept)
--   HRBP / HR Manager                -> hrd / superadmin
--   Finance                          -> department_manager of the Finance dept
--   Director / CEO                   -> director / superadmin
-- The workflow is config-driven (not hardcoded) so if the org chart changes
-- later, HRD can add/reorder/remove steps without a code change.

CREATE TABLE IF NOT EXISTS manpower_approval_workflow (
  id TEXT PRIMARY KEY,
  step_number INTEGER NOT NULL UNIQUE,
  step_label TEXT NOT NULL,
  approver_role TEXT NOT NULL CHECK (approver_role IN ('department_manager', 'hrd', 'director', 'superadmin')),
  approver_department TEXT, -- e.g. 'Finance' — scopes department_manager to a specific dept's head; NULL means the requesting dept's own head
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO manpower_approval_workflow (id, step_number, step_label, approver_role, approver_department) VALUES
  ('maw-01', 1, 'Department Head / Division Head', 'department_manager', NULL),
  ('maw-02', 2, 'HRBP / HR Manager', 'hrd', NULL),
  ('maw-03', 3, 'Finance', 'department_manager', 'Finance'),
  ('maw-04', 4, 'Director / CEO', 'director', NULL)
ON CONFLICT (step_number) DO NOTHING;

CREATE TABLE IF NOT EXISTS manpower_approval_steps (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL REFERENCES permintaan_sdm(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  step_label TEXT NOT NULL,
  approver_role TEXT NOT NULL,
  approver_department TEXT,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Skipped')),
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(request_id, step_number)
);

-- ── Employment Type master data ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS employment_type_master (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  urutan INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO employment_type_master (id, code, name, urutan) VALUES
  ('emt-01', 'TETAP', 'Karyawan Tetap', 1),
  ('emt-02', 'KONTRAK', 'Kontrak (PKWT)', 2),
  ('emt-03', 'MAGANG', 'Magang', 3),
  ('emt-04', 'OUTSOURCE', 'Outsourcing', 4),
  ('emt-05', 'PARUH_WAKTU', 'Paruh Waktu', 5)
ON CONFLICT (code) DO NOTHING;

ALTER TABLE permintaan_sdm ADD COLUMN IF NOT EXISTS employment_type_id TEXT REFERENCES employment_type_master(id);

-- ── AI Validation Rule (configurable thresholds — makes the Validation
-- Engine's budget/headcount checks real master data instead of hardcoded
-- constants in code). ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS manpower_validation_rule (
  id TEXT PRIMARY KEY,
  rule_key TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  threshold_value NUMERIC NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO manpower_validation_rule (id, rule_key, label, threshold_value, description) VALUES
  ('mvr-01', 'workload_utilization_high_pct', 'Ambang Utilisasi Formasi Tinggi', 90, 'Di atas persentase ini, formasi unit dianggap sudah padat — permintaan tambahan headcount wajar.'),
  ('mvr-02', 'workload_utilization_low_pct',  'Ambang Utilisasi Formasi Rendah', 60, 'Di bawah persentase ini, unit masih punya banyak formasi kosong — AI merekomendasikan menunda penambahan headcount.')
ON CONFLICT (rule_key) DO NOTHING;

-- ── SLA Configuration for Manpower Request stages (separate from
-- Recruitment's recruitment_sla_config — different pipeline, different
-- stage names). ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS manpower_sla_config (
  id TEXT PRIMARY KEY,
  stage TEXT UNIQUE NOT NULL,
  threshold_days INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO manpower_sla_config (id, stage, threshold_days) VALUES
  ('msla-01', 'Pending', 5),
  ('msla-02', 'Menunggu Finance', 5),
  ('msla-03', 'Direview Direktur', 5)
ON CONFLICT (stage) DO NOTHING;
