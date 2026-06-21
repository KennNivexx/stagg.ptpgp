-- HRD tables for career, change, performance, knowledge, rewards, and admin modules
-- Apply via: Supabase Dashboard > SQL Editor

-- Career: Mutasi Karyawan
CREATE TABLE IF NOT EXISTS career_mutations (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL,
  from_department TEXT NOT NULL,
  to_department TEXT NOT NULL,
  from_position TEXT,
  to_position TEXT,
  effective_date DATE,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'Menunggu',
  requested_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Career: Promosi Karyawan
CREATE TABLE IF NOT EXISTS career_promotions (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL,
  from_position TEXT NOT NULL DEFAULT '',
  to_position TEXT NOT NULL,
  effective_date DATE,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'Menunggu',
  requested_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Career: Rencana Pengembangan
CREATE TABLE IF NOT EXISTS development_plans (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL,
  goals TEXT NOT NULL,
  trainings TEXT,
  timeline TEXT,
  mentor TEXT,
  progress INTEGER DEFAULT 0,
  status TEXT DEFAULT 'Aktif',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Change Management: Inisiatif
CREATE TABLE IF NOT EXISTS change_initiatives (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  sponsor TEXT,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'Perencanaan',
  progress INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Change Management: Komunikasi
CREATE TABLE IF NOT EXISTS change_communications (
  id TEXT PRIMARY KEY,
  initiative_id TEXT,
  target_audience TEXT,
  message TEXT,
  channel TEXT DEFAULT 'Email',
  frequency TEXT DEFAULT 'Sekali Saja',
  pic TEXT,
  send_date DATE,
  status TEXT DEFAULT 'Menunggu',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Change Management: Kebijakan
CREATE TABLE IF NOT EXISTS change_policies (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  version TEXT DEFAULT 'v1.0',
  description TEXT,
  effective_date DATE,
  approver TEXT,
  status TEXT DEFAULT 'Draft',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance: OKR
CREATE TABLE IF NOT EXISTS okr_objectives (
  id TEXT PRIMARY KEY,
  department TEXT NOT NULL,
  objective TEXT NOT NULL,
  key_results TEXT,
  period TEXT,
  progress INTEGER DEFAULT 0,
  status TEXT DEFAULT 'On Track',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Knowledge: SOP Dokumen
CREATE TABLE IF NOT EXISTS sop_documents (
  id TEXT PRIMARY KEY,
  number TEXT UNIQUE,
  title TEXT NOT NULL,
  department TEXT,
  version TEXT DEFAULT 'v1.0',
  description TEXT,
  status TEXT DEFAULT 'Aktif',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rewards: Struktur Gaji
CREATE TABLE IF NOT EXISTS salary_structures (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL UNIQUE,
  basic_salary BIGINT DEFAULT 0,
  transport_allowance BIGINT DEFAULT 0,
  meal_allowance BIGINT DEFAULT 0,
  housing_allowance BIGINT DEFAULT 0,
  position_allowance BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rewards: Pembayaran Insentif
CREATE TABLE IF NOT EXISTS incentive_payments (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL,
  program TEXT NOT NULL,
  amount BIGINT NOT NULL DEFAULT 0,
  period TEXT,
  status TEXT DEFAULT 'Pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin: Konfigurasi Approval
CREATE TABLE IF NOT EXISTS approval_configs (
  id TEXT PRIMARY KEY,
  workflow_name TEXT NOT NULL UNIQUE,
  steps INTEGER DEFAULT 3,
  approver_1 TEXT,
  approver_2 TEXT,
  approver_3 TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin: Pengaturan Sistem
CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin: Pengaturan Notifikasi
CREATE TABLE IF NOT EXISTS notification_settings (
  event_type TEXT PRIMARY KEY,
  email_enabled BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT false,
  inapp_enabled BOOLEAN DEFAULT true,
  subject TEXT,
  body TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_career_mutations_employee ON career_mutations(employee_id);
CREATE INDEX IF NOT EXISTS idx_career_promotions_employee ON career_promotions(employee_id);
CREATE INDEX IF NOT EXISTS idx_development_plans_employee ON development_plans(employee_id);
CREATE INDEX IF NOT EXISTS idx_change_initiatives_status ON change_initiatives(status);
CREATE INDEX IF NOT EXISTS idx_okr_objectives_dept ON okr_objectives(department);
CREATE INDEX IF NOT EXISTS idx_salary_structures_employee ON salary_structures(employee_id);
CREATE INDEX IF NOT EXISTS idx_incentive_payments_employee ON incentive_payments(employee_id);
