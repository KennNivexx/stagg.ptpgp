-- ============================================================================
-- Employee Relations & Employee Experience Management — full schema.
-- Covers every menu item under "Employee Relations" in hrd-menu.ts: 12
-- master-data tables, Communication, Participation, Case Management (6
-- case types sharing one workflow table), Industrial Relations, Separation
-- (retirement/end-of-contract/termination/exit-interview — Resignation
-- keeps using the existing pengunduran_diri table), and a generic approval
-- routing table. karyawan_id columns are TEXT (matches karyawan.id, NOT
-- UUID — see the Career Development migration fix for why this matters).
-- ============================================================================

-- ── MASTER DATA ─────────────────────────────────────────────────────────

DO $$ BEGIN
CREATE TABLE IF NOT EXISTS er_policies (
  id TEXT PRIMARY KEY, code TEXT UNIQUE NOT NULL, title TEXT NOT NULL,
  content TEXT, status TEXT DEFAULT 'Active' CHECK (status IN ('Draft','Active','Archived')),
  effective_date DATE DEFAULT CURRENT_DATE, created_at TIMESTAMPTZ DEFAULT NOW()
);
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped er_policies: %', SQLERRM;
END $$;

DO $$ BEGIN
CREATE TABLE IF NOT EXISTS company_regulations (
  id TEXT PRIMARY KEY, code TEXT UNIQUE NOT NULL, title TEXT NOT NULL,
  content TEXT, effective_date DATE DEFAULT CURRENT_DATE, valid_until DATE,
  status TEXT DEFAULT 'Active' CHECK (status IN ('Draft','Active','Expired')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped company_regulations: %', SQLERRM;
END $$;

DO $$ BEGIN
CREATE TABLE IF NOT EXISTS collective_agreements (
  id TEXT PRIMARY KEY, code TEXT UNIQUE NOT NULL, title TEXT NOT NULL,
  period_start DATE, period_end DATE, content TEXT,
  status TEXT DEFAULT 'Active' CHECK (status IN ('Draft','Active','Expired')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped collective_agreements: %', SQLERRM;
END $$;

DO $$ BEGIN
CREATE TABLE IF NOT EXISTS code_of_conducts (
  id TEXT PRIMARY KEY, code TEXT UNIQUE NOT NULL, title TEXT NOT NULL,
  content TEXT, status TEXT DEFAULT 'Active' CHECK (status IN ('Draft','Active','Archived')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped code_of_conducts: %', SQLERRM;
END $$;

DO $$ BEGIN
CREATE TABLE IF NOT EXISTS communication_categories (
  id TEXT PRIMARY KEY, code TEXT UNIQUE NOT NULL, name TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW()
);
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped communication_categories: %', SQLERRM;
END $$;

DO $$ BEGIN
CREATE TABLE IF NOT EXISTS case_categories (
  id TEXT PRIMARY KEY, code TEXT UNIQUE NOT NULL, name TEXT NOT NULL,
  severity TEXT DEFAULT 'Medium' CHECK (severity IN ('Low','Medium','High','Critical')),
  sla_days INTEGER DEFAULT 7, created_at TIMESTAMPTZ DEFAULT NOW()
);
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped case_categories: %', SQLERRM;
END $$;

DO $$ BEGIN
CREATE TABLE IF NOT EXISTS investigation_types (
  id TEXT PRIMARY KEY, code TEXT UNIQUE NOT NULL, name TEXT NOT NULL, description TEXT, created_at TIMESTAMPTZ DEFAULT NOW()
);
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped investigation_types: %', SQLERRM;
END $$;

DO $$ BEGIN
CREATE TABLE IF NOT EXISTS disciplinary_categories (
  id TEXT PRIMARY KEY, code TEXT UNIQUE NOT NULL, name TEXT NOT NULL,
  sp_level TEXT CHECK (sp_level IN ('SP1','SP2','SP3','Verbal Warning','Termination')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped disciplinary_categories: %', SQLERRM;
END $$;

DO $$ BEGIN
CREATE TABLE IF NOT EXISTS engagement_programs (
  id TEXT PRIMARY KEY, code TEXT UNIQUE NOT NULL, name TEXT NOT NULL, description TEXT,
  start_date DATE, end_date DATE, status TEXT DEFAULT 'Planned' CHECK (status IN ('Planned','Ongoing','Completed','Cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped engagement_programs: %', SQLERRM;
END $$;

DO $$ BEGIN
CREATE TABLE IF NOT EXISTS survey_templates (
  id TEXT PRIMARY KEY, code TEXT UNIQUE NOT NULL, name TEXT NOT NULL,
  survey_type TEXT DEFAULT 'General' CHECK (survey_type IN ('General','Satisfaction','Engagement','eNPS')),
  questions JSONB DEFAULT '[]', created_at TIMESTAMPTZ DEFAULT NOW()
);
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped survey_templates: %', SQLERRM;
END $$;

DO $$ BEGIN
CREATE TABLE IF NOT EXISTS exit_reasons (
  id TEXT PRIMARY KEY, code TEXT UNIQUE NOT NULL, name TEXT NOT NULL,
  category TEXT DEFAULT 'Voluntary' CHECK (category IN ('Voluntary','Involuntary')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped exit_reasons: %', SQLERRM;
END $$;

DO $$ BEGIN
CREATE TABLE IF NOT EXISTS ai_recommendation_rules (
  id TEXT PRIMARY KEY, code TEXT UNIQUE NOT NULL, name TEXT NOT NULL, description TEXT,
  trigger_metric TEXT NOT NULL, threshold_value NUMERIC NOT NULL,
  comparison TEXT DEFAULT 'gte' CHECK (comparison IN ('gte','lte','eq')),
  recommendation_text TEXT NOT NULL, status TEXT DEFAULT 'Active' CHECK (status IN ('Active','Inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped ai_recommendation_rules: %', SQLERRM;
END $$;

-- ── EMPLOYEE COMMUNICATION ──────────────────────────────────────────────

DO $$ BEGIN
CREATE TABLE IF NOT EXISTS communications (
  id TEXT PRIMARY KEY,
  comm_type TEXT NOT NULL CHECK (comm_type IN ('Announcement','Memo','News','Policy Distribution','Circular','Emergency')),
  title TEXT NOT NULL, content TEXT, category_id TEXT REFERENCES communication_categories(id),
  target_audience TEXT DEFAULT 'All Employees',
  published_by TEXT, status TEXT DEFAULT 'Published' CHECK (status IN ('Draft','Scheduled','Published','Archived')),
  published_at TIMESTAMPTZ DEFAULT NOW(), created_at TIMESTAMPTZ DEFAULT NOW()
);
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped communications: %', SQLERRM;
END $$;

DO $$ BEGIN
CREATE TABLE IF NOT EXISTS communication_reads (
  id TEXT PRIMARY KEY, communication_id TEXT NOT NULL REFERENCES communications(id) ON DELETE CASCADE,
  karyawan_id TEXT NOT NULL REFERENCES karyawan(id), read_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(communication_id, karyawan_id)
);
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped communication_reads: %', SQLERRM;
END $$;

-- ── EMPLOYEE PARTICIPATION ──────────────────────────────────────────────

DO $$ BEGIN
CREATE TABLE IF NOT EXISTS participation_entries (
  id TEXT PRIMARY KEY,
  participation_type TEXT NOT NULL CHECK (participation_type IN ('Suggestion','Innovation','Voice of Employee','Polling','Feedback','Satisfaction Survey')),
  karyawan_id TEXT REFERENCES karyawan(id), -- nullable: Voice of Employee can be anonymous
  title TEXT NOT NULL, description TEXT, score NUMERIC,
  status TEXT DEFAULT 'Submitted' CHECK (status IN ('Submitted','Under Review','Accepted','Rejected','Implemented')),
  response TEXT, responded_by TEXT, created_at TIMESTAMPTZ DEFAULT NOW()
);
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped participation_entries: %', SQLERRM;
END $$;

-- ── EMPLOYEE CASE MANAGEMENT ─────────────────────────────────────────────

DO $$ BEGIN
CREATE TABLE IF NOT EXISTS employee_cases (
  id TEXT PRIMARY KEY,
  case_type TEXT NOT NULL CHECK (case_type IN ('Complaint','Grievance','Ethics Violation','Fraud','Harassment','Whistleblowing')),
  case_category_id TEXT REFERENCES case_categories(id),
  reporter_karyawan_id TEXT REFERENCES karyawan(id), -- nullable: anonymous / whistleblowing
  subject_karyawan_id TEXT REFERENCES karyawan(id),  -- nullable: not always about a specific person
  subject_department TEXT,
  title TEXT NOT NULL, description TEXT NOT NULL,
  status TEXT DEFAULT 'Case Created' CHECK (status IN ('Case Created','Validation','Investigation','Committee Review','Decision','Corrective Action','Monitoring','Case Closed','Rejected')),
  pic_karyawan_id TEXT REFERENCES karyawan(id),
  sla_due_date DATE, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped employee_cases: %', SQLERRM;
END $$;

DO $$ BEGIN
CREATE TABLE IF NOT EXISTS case_investigations (
  id TEXT PRIMARY KEY, case_id TEXT NOT NULL REFERENCES employee_cases(id) ON DELETE CASCADE,
  investigation_type_id TEXT REFERENCES investigation_types(id),
  investigator_karyawan_id TEXT REFERENCES karyawan(id),
  findings TEXT, evidence_notes TEXT,
  status TEXT DEFAULT 'In Progress' CHECK (status IN ('In Progress','Completed')),
  started_at TIMESTAMPTZ DEFAULT NOW(), completed_at TIMESTAMPTZ
);
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped case_investigations: %', SQLERRM;
END $$;

DO $$ BEGIN
CREATE TABLE IF NOT EXISTS case_corrective_actions (
  id TEXT PRIMARY KEY, case_id TEXT NOT NULL REFERENCES employee_cases(id) ON DELETE CASCADE,
  disciplinary_category_id TEXT REFERENCES disciplinary_categories(id),
  action_description TEXT NOT NULL, issued_by TEXT, issued_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'Issued' CHECK (status IN ('Issued','Acknowledged','Completed'))
);
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped case_corrective_actions: %', SQLERRM;
END $$;

-- ── INDUSTRIAL RELATIONS ─────────────────────────────────────────────────

DO $$ BEGIN
CREATE TABLE IF NOT EXISTS labour_unions (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, chairman_karyawan_id TEXT REFERENCES karyawan(id),
  member_count INTEGER DEFAULT 0, registered_date DATE,
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active','Inactive')), created_at TIMESTAMPTZ DEFAULT NOW()
);
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped labour_unions: %', SQLERRM;
END $$;

DO $$ BEGIN
CREATE TABLE IF NOT EXISTS industrial_meetings (
  id TEXT PRIMARY KEY,
  meeting_type TEXT NOT NULL CHECK (meeting_type IN ('Bipartite','Tripartite','Mediation','Dispute','PHI Documentation')),
  title TEXT NOT NULL, agenda TEXT, participants TEXT, outcome TEXT,
  meeting_date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'Scheduled' CHECK (status IN ('Scheduled','Completed','Cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped industrial_meetings: %', SQLERRM;
END $$;

DO $$ BEGIN
CREATE TABLE IF NOT EXISTS industrial_compliance_items (
  id TEXT PRIMARY KEY, regulation_name TEXT NOT NULL,
  compliance_status TEXT DEFAULT 'Compliant' CHECK (compliance_status IN ('Compliant','At Risk','Non-Compliant')),
  due_date DATE, notes TEXT, created_at TIMESTAMPTZ DEFAULT NOW()
);
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped industrial_compliance_items: %', SQLERRM;
END $$;

-- ── EMPLOYEE SEPARATION (Resignation already covered by pengunduran_diri) ──

DO $$ BEGIN
CREATE TABLE IF NOT EXISTS employee_separations (
  id TEXT PRIMARY KEY,
  separation_type TEXT NOT NULL CHECK (separation_type IN ('Retirement','End of Contract','Termination','Death')),
  karyawan_id TEXT NOT NULL REFERENCES karyawan(id),
  exit_reason_id TEXT REFERENCES exit_reasons(id),
  effective_date DATE NOT NULL, reason TEXT,
  exit_interview_done BOOLEAN DEFAULT FALSE, exit_interview_notes TEXT,
  status TEXT DEFAULT 'Diajukan' CHECK (status IN ('Diajukan','Disetujui','Ditolak','Selesai')),
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped employee_separations: %', SQLERRM;
END $$;

-- ── GENERIC APPROVAL ROUTING ─────────────────────────────────────────────

DO $$ BEGIN
CREATE TABLE IF NOT EXISTS er_approvals (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL CHECK (category IN ('Complaint','Investigation','Corrective Action','Industrial','Separation','Case Closure')),
  reference_id TEXT NOT NULL, -- id in employee_cases / industrial_meetings / employee_separations depending on category
  approver_role TEXT, approver_karyawan_id TEXT REFERENCES karyawan(id),
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending','Approved','Rejected')),
  notes TEXT, decided_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT NOW()
);
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped er_approvals: %', SQLERRM;
END $$;

-- ── MASTER DATA SEED (defaults, safe to re-run) ──────────────────────────

DO $$ BEGIN
INSERT INTO er_policies (id, code, title, content) VALUES
  ('erp-01', 'ERP-01', 'Kebijakan Hubungan Industrial', 'Prinsip dasar hubungan kerja yang harmonis antara perusahaan dan karyawan.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO company_regulations (id, code, title, content) VALUES
  ('cr-01', 'PP-2026', 'Peraturan Perusahaan PT Pratama Galuh Perkasa 2026', 'Ketentuan kerja, hak dan kewajiban karyawan sesuai UU Ketenagakerjaan.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO collective_agreements (id, code, title, period_start, period_end) VALUES
  ('pkb-01', 'PKB-2026-2028', 'Perjanjian Kerja Bersama 2026-2028', '2026-01-01', '2028-01-01')
ON CONFLICT (id) DO NOTHING;
INSERT INTO code_of_conducts (id, code, title, content) VALUES
  ('coc-01', 'COC-01', 'Kode Etik Karyawan', 'Standar perilaku profesional dan integritas dalam bekerja.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO communication_categories (id, code, name) VALUES
  ('cc-01', 'CC01', 'Umum'), ('cc-02', 'CC02', 'Kebijakan'), ('cc-03', 'CC03', 'HSE'), ('cc-04', 'CC04', 'Event')
ON CONFLICT (id) DO NOTHING;
INSERT INTO case_categories (id, code, name, severity, sla_days) VALUES
  ('cat-complaint', 'CAT-01', 'Complaint', 'Low', 14),
  ('cat-grievance', 'CAT-02', 'Grievance', 'Medium', 14),
  ('cat-ethics', 'CAT-03', 'Ethics Violation', 'High', 10),
  ('cat-fraud', 'CAT-04', 'Fraud', 'Critical', 7),
  ('cat-harassment', 'CAT-05', 'Harassment & Bullying', 'High', 7),
  ('cat-whistleblow', 'CAT-06', 'Whistleblowing', 'Critical', 7)
ON CONFLICT (id) DO NOTHING;
INSERT INTO investigation_types (id, code, name, description) VALUES
  ('it-01', 'IT-01', 'Internal Investigation', 'Investigasi internal oleh HR/atasan langsung'),
  ('it-02', 'IT-02', 'Committee Investigation', 'Investigasi oleh Komite Etik')
ON CONFLICT (id) DO NOTHING;
INSERT INTO disciplinary_categories (id, code, name, sp_level) VALUES
  ('dc-01', 'DC-01', 'Pelanggaran Ringan', 'Verbal Warning'),
  ('dc-02', 'DC-02', 'Pelanggaran Sedang', 'SP1'),
  ('dc-03', 'DC-03', 'Pelanggaran Berat', 'SP2'),
  ('dc-04', 'DC-04', 'Pelanggaran Sangat Berat', 'SP3')
ON CONFLICT (id) DO NOTHING;
INSERT INTO engagement_programs (id, code, name, description, start_date, end_date, status) VALUES
  ('ep-01', 'EP-01', 'Town Hall Kuartalan', 'Sesi dialog terbuka Direksi dengan seluruh karyawan.', '2026-01-15', '2026-01-15', 'Completed'),
  ('ep-02', 'EP-02', 'Employee Gathering 2026', 'Acara kebersamaan tahunan seluruh karyawan.', '2026-08-01', '2026-08-01', 'Planned')
ON CONFLICT (id) DO NOTHING;
INSERT INTO survey_templates (id, code, name, survey_type, questions) VALUES
  ('st-01', 'ST-01', 'Employee Satisfaction Survey', 'Satisfaction', '["Seberapa puas Anda dengan lingkungan kerja?", "Seberapa puas Anda dengan kompensasi?"]'),
  ('st-02', 'ST-02', 'Employee Net Promoter Score', 'eNPS', '["Seberapa besar kemungkinan Anda merekomendasikan perusahaan ini sebagai tempat kerja?"]')
ON CONFLICT (id) DO NOTHING;
INSERT INTO exit_reasons (id, code, name, category) VALUES
  ('er-01', 'ER-01', 'Karir Lebih Baik', 'Voluntary'), ('er-02', 'ER-02', 'Alasan Pribadi', 'Voluntary'),
  ('er-03', 'ER-03', 'Pensiun', 'Voluntary'), ('er-04', 'ER-04', 'Pelanggaran Disiplin', 'Involuntary'),
  ('er-05', 'ER-05', 'Restrukturisasi', 'Involuntary')
ON CONFLICT (id) DO NOTHING;
INSERT INTO ai_recommendation_rules (id, code, name, description, trigger_metric, threshold_value, comparison, recommendation_text) VALUES
  ('air-01', 'AIR-01', 'Risiko Turnover Tinggi', 'Departemen dengan tingkat turnover di atas ambang batas', 'department_turnover_pct', 10, 'gte', 'Departemen ini memiliki risiko turnover tinggi — pertimbangkan program retensi.'),
  ('air-02', 'AIR-02', 'Kasus Belum Selesai', 'Kasus yang melewati SLA penyelesaian', 'case_overdue_days', 0, 'gte', 'Terdapat kasus yang melewati SLA — prioritaskan penyelesaian.'),
  ('air-03', 'AIR-03', 'Engagement Rendah', 'Skor partisipasi/survei di bawah ambang batas', 'avg_satisfaction_score', 70, 'lte', 'Skor kepuasan karyawan di bawah target — evaluasi program engagement.')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped ER master seed: %', SQLERRM;
END $$;
