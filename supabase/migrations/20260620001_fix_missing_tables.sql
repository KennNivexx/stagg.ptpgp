-- Add missing updated_at column to trainings (only if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trainings') THEN
    ALTER TABLE trainings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Contact messages (from public contact form)
CREATE TABLE IF NOT EXISTS contact_messages (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT DEFAULT '',
  subject TEXT DEFAULT '',
  message TEXT NOT NULL,
  status TEXT DEFAULT 'Unread',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vendors
CREATE TABLE IF NOT EXISTS vendors (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT NOT NULL,
  category TEXT DEFAULT '',
  contact_person TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  address TEXT DEFAULT '',
  status TEXT DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Employee complaints
CREATE TABLE IF NOT EXISTS complaints (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  employee_id TEXT NOT NULL,
  employee_name TEXT DEFAULT '',
  employee_email TEXT DEFAULT '',
  subject TEXT NOT NULL,
  category TEXT DEFAULT 'Umum',
  description TEXT NOT NULL,
  status TEXT DEFAULT 'Diajukan',
  resolved_by TEXT DEFAULT '',
  resolved_at TIMESTAMPTZ,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_complaints_employee_id ON complaints(employee_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);

-- Employee resignations
CREATE TABLE IF NOT EXISTS resignations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  employee_id TEXT NOT NULL,
  employee_name TEXT DEFAULT '',
  employee_email TEXT DEFAULT '',
  reason TEXT NOT NULL,
  last_day DATE NOT NULL,
  notes TEXT DEFAULT '',
  status TEXT DEFAULT 'Diajukan',
  reviewed_by TEXT DEFAULT '',
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resignations_employee_id ON resignations(employee_id);
CREATE INDEX IF NOT EXISTS idx_resignations_status ON resignations(status);

-- Warning letters / SP
CREATE TABLE IF NOT EXISTS warnings (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  employee_id TEXT NOT NULL,
  employee_name TEXT DEFAULT '',
  employee_email TEXT DEFAULT '',
  sp_level TEXT NOT NULL,
  reason TEXT NOT NULL,
  valid_until DATE,
  issued_by TEXT DEFAULT '',
  status TEXT DEFAULT 'Aktif',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_warnings_employee_id ON warnings(employee_id);
CREATE INDEX IF NOT EXISTS idx_warnings_status ON warnings(status);

-- Audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  action TEXT NOT NULL,
  target_id TEXT,
  target_name TEXT,
  performed_by_id TEXT,
  performed_by_role TEXT,
  performed_by_name TEXT,
  performed_by_email TEXT,
  detail TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_performed_by ON audit_logs(performed_by_email);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
