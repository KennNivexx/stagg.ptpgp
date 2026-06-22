-- Missing tables for employee relations + vendors
CREATE TABLE IF NOT EXISTS contact_messages (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT DEFAULT '',
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vendors (
  id TEXT PRIMARY KEY,
  company_name TEXT NOT NULL,
  company_email TEXT NOT NULL,
  company_phone TEXT DEFAULT '',
  npwp TEXT DEFAULT '',
  nib TEXT DEFAULT '',
  address TEXT DEFAULT '',
  business_type TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS complaints (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL,
  employee_name TEXT DEFAULT '',
  department TEXT DEFAULT '',
  subject TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT DEFAULT 'Diajukan',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS resignations (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL,
  employee_name TEXT DEFAULT '',
  department TEXT DEFAULT '',
  reason TEXT DEFAULT '',
  notice_date DATE,
  effective_date DATE,
  status TEXT DEFAULT 'Diajukan',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS warnings (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL,
  employee_name TEXT DEFAULT '',
  department TEXT DEFAULT '',
  type TEXT NOT NULL,
  description TEXT DEFAULT '',
  issued_date DATE,
  status TEXT DEFAULT 'Aktif',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fix missing columns
ALTER TABLE trainings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE employee_skills ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
