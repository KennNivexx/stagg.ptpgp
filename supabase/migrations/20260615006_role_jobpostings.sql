-- Update role CHECK constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('superadmin','hrd','employee','director','department_manager'));

-- Seed Director account (password: password)
INSERT INTO users (email, password_hash, role, full_name) VALUES (
  'director@ptpgp.co.id',
  '7b3ff040d72943093ea8236f741734e3:ec2de86b8187131c927dc22dcc12209750e06cb8185c6a179d905e8c9eadad16d4bd2ff02cdc42e7ba1500bae614bb6153c90a1636442a11043a8eba05171a93',
  'director', 'Ade Fajar Nurcahman'
) ON CONFLICT (email) DO NOTHING;

-- Seed Department Manager accounts (password: password)
INSERT INTO users (email, password_hash, role, full_name) VALUES
  ('hrga@ptpgp.co.id', '7b3ff040d72943093ea8236f741734e3:ec2de86b8187131c927dc22dcc12209750e06cb8185c6a179d905e8c9eadad16d4bd2ff02cdc42e7ba1500bae614bb6153c90a1636442a11043a8eba05171a93', 'department_manager', 'Manager HR & GA'),
  ('finance@ptpgp.co.id', '7b3ff040d72943093ea8236f741734e3:ec2de86b8187131c927dc22dcc12209750e06cb8185c6a179d905e8c9eadad16d4bd2ff02cdc42e7ba1500bae614bb6153c90a1636442a11043a8eba05171a93', 'department_manager', 'Manager Finance'),
  ('operational@ptpgp.co.id', '7b3ff040d72943093ea8236f741734e3:ec2de86b8187131c927dc22dcc12209750e06cb8185c6a179d905e8c9eadad16d4bd2ff02cdc42e7ba1500bae614bb6153c90a1636442a11043a8eba05171a93', 'department_manager', 'Manager Operational'),
  ('procurement@ptpgp.co.id', '7b3ff040d72943093ea8236f741734e3:ec2de86b8187131c927dc22dcc12209750e06cb8185c6a179d905e8c9eadad16d4bd2ff02cdc42e7ba1500bae614bb6153c90a1636442a11043a8eba05171a93', 'department_manager', 'Manager Procurement'),
  ('projectappraisal@ptpgp.co.id', '7b3ff040d72943093ea8236f741734e3:ec2de86b8187131c927dc22dcc12209750e06cb8185c6a179d905e8c9eadad16d4bd2ff02cdc42e7ba1500bae614bb6153c90a1636442a11043a8eba05171a93', 'department_manager', 'Manager Project Appraisal'),
  ('mr@ptpgp.co.id', '7b3ff040d72943093ea8236f741734e3:ec2de86b8187131c927dc22dcc12209750e06cb8185c6a179d905e8c9eadad16d4bd2ff02cdc42e7ba1500bae614bb6153c90a1636442a11043a8eba05171a93', 'department_manager', 'Manager MR'),
  ('hse@ptpgp.co.id', '7b3ff040d72943093ea8236f741734e3:ec2de86b8187131c927dc22dcc12209750e06cb8185c6a179d905e8c9eadad16d4bd2ff02cdc42e7ba1500bae614bb6153c90a1636442a11043a8eba05171a93', 'department_manager', 'Manager HSE')
ON CONFLICT (email) DO NOTHING;

-- Job Postings table
CREATE TABLE IF NOT EXISTS job_postings (
  id TEXT PRIMARY KEY,
  position TEXT NOT NULL,
  department TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  quantity_filled INTEGER DEFAULT 0,
  education TEXT DEFAULT '',
  experience TEXT DEFAULT '',
  age_min INTEGER,
  age_max INTEGER,
  location TEXT DEFAULT '',
  requirements TEXT DEFAULT '',
  status TEXT DEFAULT 'Open',
  source_request_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure id is TEXT for compatibility
ALTER TABLE job_postings ALTER COLUMN id TYPE TEXT;

