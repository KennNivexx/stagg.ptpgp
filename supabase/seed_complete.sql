-- ============================================================
-- PT PGP HRIS - Complete Database Setup
-- Copy-paste ke Supabase SQL Editor, lalu klik RUN
-- ============================================================

-- 1. TABEL USERS --------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('superadmin','hrd','employee','director','department_manager')),
  full_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. TABEL EMPLOYEES ----------------------------------------------
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT DEFAULT '',
  address TEXT DEFAULT '',
  department TEXT DEFAULT '',
  position TEXT DEFAULT '',
  join_date TEXT DEFAULT '',
  status TEXT DEFAULT 'Tetap',
  kode TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. TABEL DEPARTMENTS --------------------------------------------
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE,
  name TEXT,
  parent_code TEXT,
  level INTEGER DEFAULT 0,
  leader_name TEXT DEFAULT '',
  leader_email TEXT DEFAULT '',
  headcount INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. TABEL ORG UNITS ----------------------------------------------
CREATE TABLE IF NOT EXISTS org_units (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  parent_code TEXT,
  level INTEGER NOT NULL DEFAULT 0,
  leader_name TEXT DEFAULT '',
  leader_email TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABEL POSITIONS ----------------------------------------------
CREATE TABLE IF NOT EXISTS positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE,
  name TEXT NOT NULL,
  department TEXT DEFAULT '',
  level TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. TABEL WORKFORCE REQUESTS -------------------------------------
CREATE TABLE IF NOT EXISTS workforce_requests (
  id TEXT PRIMARY KEY,
  department TEXT NOT NULL,
  position TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  reason TEXT DEFAULT '',
  urgency TEXT DEFAULT 'Sedang',
  status TEXT DEFAULT 'Pending',
  requested_by TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. TABEL JOB POSTINGS -------------------------------------------
CREATE TABLE IF NOT EXISTS job_postings (
  id TEXT PRIMARY KEY,
  position TEXT NOT NULL,
  department TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  quantity_filled INTEGER DEFAULT 0,
  status TEXT DEFAULT 'Open',
  source_request_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. TABEL JOB DESCRIPTIONS ---------------------------------------
CREATE TABLE IF NOT EXISTS job_descriptions (
  id TEXT PRIMARY KEY,
  position TEXT NOT NULL,
  department TEXT DEFAULT '',
  responsibilities TEXT[] DEFAULT '{}',
  requirements TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 9. TABEL JOB SPECIFICATIONS -------------------------------------
CREATE TABLE IF NOT EXISTS job_specifications (
  id TEXT PRIMARY KEY,
  position TEXT NOT NULL,
  department TEXT DEFAULT '',
  education TEXT DEFAULT '',
  experience TEXT DEFAULT '',
  skills TEXT[] DEFAULT '{}',
  certifications TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 10. TABEL ATTENDANCE --------------------------------------------
CREATE TABLE IF NOT EXISTS attendance (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL,
  employee_name TEXT DEFAULT '',
  department TEXT DEFAULT '',
  date DATE NOT NULL,
  check_in TIMESTAMPTZ,
  check_out TIMESTAMPTZ,
  status TEXT DEFAULT 'Hadir',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 11. TABEL LEAVE REQUESTS ----------------------------------------
CREATE TABLE IF NOT EXISTS leave_requests (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL,
  employee_name TEXT DEFAULT '',
  department TEXT DEFAULT '',
  type TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT DEFAULT '',
  status TEXT DEFAULT 'Pending',
  approved_by TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 12. TABEL APPLICATIONS ------------------------------------------
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT DEFAULT '',
  resume_url TEXT DEFAULT '{}',
  status TEXT DEFAULT 'Menunggu Review',
  applied_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 13. TABEL NOTIFICATIONS -----------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_email TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT DEFAULT '',
  link TEXT DEFAULT '',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- SEED: USER ACCOUNTS
-- Password "password" = salt:hash (PBKDF2-SHA512, 100k iter)
-- ============================================================

-- Clean existing
DELETE FROM users WHERE email != 'superadmin@ptpgp.co.id';

-- Superadmin (password: superadmin123)
INSERT INTO users (email, password_hash, role, full_name) VALUES (
  'superadmin@ptpgp.co.id',
  '46072c81788a79c97ab5b2bbecdcdc2f:3a86a537b6e9609eb277db2dc6c98d8d0b7e5b27709d326028843373714262b1498c4e7134b910b2cc766c393f450c080a15ea427b3beb31fa7ee79b4786f074',
  'superadmin', 'Super Administrator'
) ON CONFLICT (email) DO UPDATE SET role = 'superadmin', password_hash = EXCLUDED.password_hash;

-- All other accounts (password: password)
INSERT INTO users (email, password_hash, role, full_name) VALUES
  ('director@ptpgp.co.id', '7b3ff040d72943093ea8236f741734e3:ec2de86b8187131c927dc22dcc12209750e06cb8185c6a179d905e8c9eadad16d4bd2ff02cdc42e7ba1500bae614bb6153c90a1636442a11043a8eba05171a93', 'director', 'Ade Fajar Nurcahman'),
  ('hrd@ptpgp.co.id', '7b3ff040d72943093ea8236f741734e3:ec2de86b8187131c927dc22dcc12209750e06cb8185c6a179d905e8c9eadad16d4bd2ff02cdc42e7ba1500bae614bb6153c90a1636442a11043a8eba05171a93', 'hrd', 'Administrator HRD'),
  ('hrga@ptpgp.co.id', '7b3ff040d72943093ea8236f741734e3:ec2de86b8187131c927dc22dcc12209750e06cb8185c6a179d905e8c9eadad16d4bd2ff02cdc42e7ba1500bae614bb6153c90a1636442a11043a8eba05171a93', 'department_manager', 'Manager HR & GA'),
  ('finance@ptpgp.co.id', '7b3ff040d72943093ea8236f741734e3:ec2de86b8187131c927dc22dcc12209750e06cb8185c6a179d905e8c9eadad16d4bd2ff02cdc42e7ba1500bae614bb6153c90a1636442a11043a8eba05171a93', 'department_manager', 'Manager Finance'),
  ('operational@ptpgp.co.id', '7b3ff040d72943093ea8236f741734e3:ec2de86b8187131c927dc22dcc12209750e06cb8185c6a179d905e8c9eadad16d4bd2ff02cdc42e7ba1500bae614bb6153c90a1636442a11043a8eba05171a93', 'department_manager', 'Manager Operational'),
  ('procurement@ptpgp.co.id', '7b3ff040d72943093ea8236f741734e3:ec2de86b8187131c927dc22dcc12209750e06cb8185c6a179d905e8c9eadad16d4bd2ff02cdc42e7ba1500bae614bb6153c90a1636442a11043a8eba05171a93', 'department_manager', 'Manager Procurement'),
  ('projectappraisal@ptpgp.co.id', '7b3ff040d72943093ea8236f741734e3:ec2de86b8187131c927dc22dcc12209750e06cb8185c6a179d905e8c9eadad16d4bd2ff02cdc42e7ba1500bae614bb6153c90a1636442a11043a8eba05171a93', 'department_manager', 'Manager Project Appraisal'),
  ('mr@ptpgp.co.id', '7b3ff040d72943093ea8236f741734e3:ec2de86b8187131c927dc22dcc12209750e06cb8185c6a179d905e8c9eadad16d4bd2ff02cdc42e7ba1500bae614bb6153c90a1636442a11043a8eba05171a93', 'department_manager', 'Manager MR'),
  ('hse@ptpgp.co.id', '7b3ff040d72943093ea8236f741734e3:ec2de86b8187131c927dc22dcc12209750e06cb8185c6a179d905e8c9eadad16d4bd2ff02cdc42e7ba1500bae614bb6153c90a1636442a11043a8eba05171a93', 'department_manager', 'Manager HSE')
ON CONFLICT (email) DO NOTHING;

-- ============================================================
-- SEED: ORG STRUCTURE
-- ============================================================

DELETE FROM org_units;
DELETE FROM departments;

INSERT INTO org_units (id, code, name, parent_code, level, leader_name, leader_email, sort_order) VALUES
  ('org-root', '1.0.0.0.0.0.0', 'COMMISSIONER', NULL, 0, '', '', 0),
  ('org-dir', '1.1.0.0.0.0.0', 'Director', '1.0.0.0.0.0.0', 1, 'Ade Fajar Nurcahman', 'ade.fajar@ptpgp.co.id', 0),
  ('org-audit', '1.1.1.0.0.0.0', 'Internal Audit', '1.1.0.0.0.0.0', 2, '', '', 0),
  ('org-dep', '1.1.2.0.0.0.0', 'Deputy Director', '1.1.0.0.0.0.0', 2, 'Enjal Solihin', 'enjal.solihin@ptpgp.co.id', 1),
  ('org-hrga', '1.1.2.1.0.0.0', 'HR & GA', '1.1.2.0.0.0.0', 3, '', '', 0),
  ('org-hr', '1.1.2.1.1.0.0', 'Human Resources', '1.1.2.1.0.0.0', 4, '', '', 0),
  ('org-pay', '1.1.2.1.2.0.0', 'Payroll', '1.1.2.1.0.0.0', 4, '', '', 1),
  ('org-rec', '1.1.2.1.3.0.0', 'Recruitment & Development', '1.1.2.1.0.0.0', 4, '', '', 2),
  ('org-ga', '1.1.2.1.4.0.0', 'General Affair', '1.1.2.1.0.0.0', 4, '', '', 3),
  ('org-obh', '1.1.2.1.5.0.0', 'Other Boy House', '1.1.2.1.0.0.0', 4, '', '', 4),
  ('org-prop', '1.1.2.1.6.0.0', 'Property Creation & Maintenance', '1.1.2.1.0.0.0', 4, '', '', 5),
  ('org-ob', '1.1.2.1.7.0.0', 'Office Boy', '1.1.2.1.0.0.0', 4, '', '', 6),
  ('org-it', '1.1.2.1.8.0.0', 'IT Application & Development', '1.1.2.1.0.0.0', 4, '', '', 7),
  ('org-help', '1.1.2.1.9.0.0', 'Help Desk Staff', '1.1.2.1.0.0.0', 4, '', '', 8),
  ('org-sec', '1.1.2.1.10.0.0', 'Security', '1.1.2.1.0.0.0', 4, '', '', 9),
  ('org-shift', '1.1.2.1.11.0.0', 'Shift Leader', '1.1.2.1.0.0.0', 4, '', '', 10),
  ('org-pers', '1.1.2.1.12.0.0', 'Personnel', '1.1.2.1.0.0.0', 4, '', '', 11),
  ('org-fin-div', '1.1.2.2.0.0.0', 'Finance', '1.1.2.0.0.0.0', 3, '', '', 1),
  ('org-fin', '1.1.2.2.1.0.0', 'Finance', '1.1.2.2.0.0.0', 4, '', '', 0),
  ('org-cash', '1.1.2.2.2.0.0', 'Cashier', '1.1.2.2.0.0.0', 4, '', '', 1),
  ('org-ap', '1.1.2.2.3.0.0', 'Account Payable', '1.1.2.2.0.0.0', 4, '', '', 2),
  ('org-ar', '1.1.2.2.4.0.0', 'Account Receivable', '1.1.2.2.0.0.0', 4, '', '', 3),
  ('org-proc', '1.1.3.0.0.0.0', 'Procurement Division', '1.1.0.0.0.0.0', 2, 'Galih Aditya', 'galih.aditya@ptpgp.co.id', 2),
  ('org-pa', '1.1.4.0.0.0.0', 'Project Appraisal', '1.1.0.0.0.0.0', 2, 'Titi Ernawati', 'titi.ernawati@ptpgp.co.id', 3),
  ('org-reg', '1.1.4.1.0.0.0', 'Regional', '1.1.4.0.0.0.0', 3, '', '', 0),
  ('org-fwd', '1.1.4.2.0.0.0', 'Forwarder', '1.1.4.0.0.0.0', 3, '', '', 1),
  ('org-ppk', '1.1.4.3.0.0.0', 'PPK', '1.1.4.0.0.0.0', 3, '', '', 2),
  ('org-wh', '1.1.4.4.0.0.0', 'Warehouse', '1.1.4.0.0.0.0', 3, '', '', 3),
  ('org-phe', '1.1.4.5.0.0.0', 'Projected Heavy Equipment', '1.1.4.0.0.0.0', 3, '', '', 4),
  ('org-sales', '1.1.4.6.0.0.0', 'Sales', '1.1.4.0.0.0.0', 3, '', '', 5),
  ('org-sa', '1.1.4.7.0.0.0', 'Staff Admin', '1.1.4.0.0.0.0', 3, '', '', 6),
  ('org-media', '1.1.4.8.0.0.0', 'Media & Promotion', '1.1.4.0.0.0.0', 3, '', '', 7),
  ('org-mr', '1.1.5.0.0.0.0', 'Management Representative', '1.1.0.0.0.0.0', 2, 'Dace Rizkia Sari', 'dace.rizkia@ptpgp.co.id', 4),
  ('org-ops', '1.1.6.0.0.0.0', 'Operational Division', '1.1.0.0.0.0.0', 2, 'I Gusti Nursahada', 'igusti.nursahada@ptpgp.co.id', 5),
  ('org-vo', '1.1.6.1.0.0.0', 'Vehicle Operation', '1.1.6.0.0.0.0', 3, '', '', 0),
  ('org-drv', '1.1.6.2.0.0.0', 'Driver', '1.1.6.0.0.0.0', 3, '', '', 1),
  ('org-oab', '1.1.6.3.0.0.0', 'Operational Alat Berat', '1.1.6.0.0.0.0', 3, '', '', 2),
  ('org-opr', '1.1.6.4.0.0.0', 'Operator', '1.1.6.0.0.0.0', 3, '', '', 3),
  ('org-op', '1.1.6.5.0.0.0', 'Operational Plant', '1.1.6.0.0.0.0', 3, '', '', 4),
  ('org-rig', '1.1.6.6.0.0.0', 'Rigger', '1.1.6.0.0.0.0', 3, '', '', 5),
  ('org-ts', '1.1.6.7.0.0.0', 'Traffic System', '1.1.6.0.0.0.0', 3, '', '', 6),
  ('org-qc', '1.1.6.8.0.0.0', 'Quality Control', '1.1.6.0.0.0.0', 3, '', '', 7),
  ('org-svc', '1.1.6.9.0.0.0', 'Service Advisor', '1.1.6.0.0.0.0', 3, '', '', 8),
  ('org-vr', '1.1.6.10.0.0.0', 'Vehicle Registration', '1.1.6.0.0.0.0', 3, '', '', 9),
  ('org-ec', '1.1.6.11.0.0.0', 'Equipment Control', '1.1.6.0.0.0.0', 3, '', '', 10),
  ('org-ops-sa', '1.1.6.12.0.0.0', 'Staff Admin', '1.1.6.0.0.0.0', 3, '', '', 11),
  ('org-hse', '1.1.7.0.0.0.0', 'Health, Safety & Environment', '1.1.0.0.0.0.0', 2, 'Asmaria Putri Utama', 'asmaria.putri@ptpgp.co.id', 6),
  ('org-dr', '1.1.7.1.0.0.0', 'Delivery Route', '1.1.7.0.0.0.0', 3, '', '', 0),
  ('org-dc', '1.1.7.2.0.0.0', 'Document Control', '1.1.7.0.0.0.0', 3, '', '', 1),
  ('org-hse-staff', '1.1.7.3.0.0.0', 'Staff', '1.1.7.0.0.0.0', 3, '', '', 2);

-- Sync departments (copy from org_units with dedup names)
INSERT INTO departments (code, name, parent_code, level, leader_name, leader_email, sort_order)
SELECT 
  o.code,
  CASE 
    WHEN o.name = 'Finance' AND o.parent_code = '1.1.2.2.0.0.0' THEN 'Finance (Unit)'
    WHEN o.name = 'Staff Admin' AND o.parent_code = '1.1.6.0.0.0.0' THEN 'Staff Admin (Ops)'
    ELSE o.name
  END,
  o.parent_code, o.level, o.leader_name, o.leader_email, o.sort_order
FROM org_units o;

-- ============================================================
-- SEED: POSITIONS (ALL)
-- ============================================================

DELETE FROM positions;

INSERT INTO positions (id, code, name, department, level) VALUES
  (gen_random_uuid(), 'COMM', 'Commissioner', 'COMMISSIONER', 'Komisaris'),
  (gen_random_uuid(), 'DIR', 'Director', 'Director', 'Direktur'),
  (gen_random_uuid(), 'INT-AUD', 'Internal Auditor', 'Internal Audit', 'Direktur'),
  (gen_random_uuid(), 'DEP-DIR', 'Deputy Director', 'Deputy Director', 'Wakil Direktur'),
  (gen_random_uuid(), 'HR-MGR', 'HR Manager', 'HR & GA', 'Manager'),
  (gen_random_uuid(), 'HR-OFF', 'HR Officer', 'HR & GA', 'Staff'),
  (gen_random_uuid(), 'REC-STF', 'Recruitment Staff', 'HR & GA', 'Staff'),
  (gen_random_uuid(), 'PAY-STF', 'Payroll Staff', 'HR & GA', 'Staff'),
  (gen_random_uuid(), 'GA-STF', 'General Affair Staff', 'HR & GA', 'Staff'),
  (gen_random_uuid(), 'IT-SUP', 'IT Support', 'HR & GA', 'Staff'),
  (gen_random_uuid(), 'SEC-OFF', 'Security Officer', 'HR & GA', 'Staff'),
  (gen_random_uuid(), 'OB', 'Office Boy', 'HR & GA', 'Staff'),
  (gen_random_uuid(), 'FIN-MGR', 'Finance Manager', 'Finance', 'Manager'),
  (gen_random_uuid(), 'SR-ACC', 'Senior Accountant', 'Finance', 'Staff'),
  (gen_random_uuid(), 'AP-STF', 'Account Payable Staff', 'Finance', 'Staff'),
  (gen_random_uuid(), 'AR-STF', 'Account Receivable Staff', 'Finance', 'Staff'),
  (gen_random_uuid(), 'CSH', 'Cashier', 'Finance', 'Staff'),
  (gen_random_uuid(), 'OPS-MGR', 'Operations Manager', 'Operational Division', 'Manager'),
  (gen_random_uuid(), 'VOP-SPV', 'Vehicle Operations Supervisor', 'Operational Division', 'Supervisor'),
  (gen_random_uuid(), 'DRV', 'Driver', 'Operational Division', 'Staff'),
  (gen_random_uuid(), 'HE-OPR', 'Heavy Equipment Operator', 'Operational Division', 'Staff'),
  (gen_random_uuid(), 'RIG', 'Rigger', 'Operational Division', 'Staff'),
  (gen_random_uuid(), 'QC-STF', 'Quality Control Staff', 'Operational Division', 'Staff'),
  (gen_random_uuid(), 'TS-STF', 'Traffic System Staff', 'Operational Division', 'Staff'),
  (gen_random_uuid(), 'SVC-ADV', 'Service Advisor', 'Operational Division', 'Staff'),
  (gen_random_uuid(), 'VEH-REG', 'Vehicle Registration Staff', 'Operational Division', 'Staff'),
  (gen_random_uuid(), 'EQ-CTRL', 'Equipment Control Staff', 'Operational Division', 'Staff'),
  (gen_random_uuid(), 'PRC-OFF', 'Procurement Officer', 'Procurement Division', 'Staff'),
  (gen_random_uuid(), 'PRC-STF', 'Procurement Staff', 'Procurement Division', 'Staff'),
  (gen_random_uuid(), 'PA-MGR', 'Project Appraisal Manager', 'Project Appraisal', 'Manager'),
  (gen_random_uuid(), 'SLS-EXEC', 'Sales Executive', 'Project Appraisal', 'Staff'),
  (gen_random_uuid(), 'MED-PROM', 'Media & Promotion Staff', 'Project Appraisal', 'Staff'),
  (gen_random_uuid(), 'REG-STF', 'Regional Staff', 'Project Appraisal', 'Staff'),
  (gen_random_uuid(), 'FWD-STF', 'Forwarder Staff', 'Project Appraisal', 'Staff'),
  (gen_random_uuid(), 'WH-STF', 'Warehouse Staff', 'Project Appraisal', 'Staff'),
  (gen_random_uuid(), 'MR-OFF', 'MR Officer', 'Management Representative', 'Staff'),
  (gen_random_uuid(), 'HSE-OFF', 'HSE Officer', 'Health, Safety & Environment', 'Staff'),
  (gen_random_uuid(), 'DOC-CTRL', 'Document Control Staff', 'Health, Safety & Environment', 'Staff');

-- ============================================================
-- SEED: EMPLOYEES (28)
-- Password: password (hash: a1b2c3d4...:1a2b3c4d5e6f...)
-- ============================================================

DELETE FROM employees WHERE email != '__settings__@ptpgp.co.id';

-- System settings (required)
INSERT INTO employees (email, full_name, department, position, join_date, status, address) VALUES (
  '__settings__@ptpgp.co.id', 'System Settings', 'System', 'Settings', '2024-01-01', 'Tetap',
  '{"org_structure":[],"chart_layout":null}'
) ON CONFLICT (email) DO NOTHING;

-- HR & GA (7)
INSERT INTO employees (full_name, email, department, position, join_date, status, address) VALUES
  ('Radian, S.Sos., CHRM', 'radian@ptpgp.co.id', 'HR & GA', 'HR Manager', '2023-03-15', 'Tetap', '{}'),
  ('Siti Nurhaliza', 'siti.nurhaliza@ptpgp.co.id', 'HR & GA', 'HR Officer', '2024-01-10', 'Tetap', '{}'),
  ('Andi Pratama', 'andi.pratama@ptpgp.co.id', 'HR & GA', 'Recruitment Staff', '2024-06-20', 'Tetap', '{}'),
  ('Dewi Lestari', 'dewi.lestari@ptpgp.co.id', 'HR & GA', 'Payroll Staff', '2025-02-01', 'Tetap', '{}'),
  ('Budi Wibowo', 'budi.wibowo@ptpgp.co.id', 'HR & GA', 'General Affair Staff', '2024-09-01', 'Kontrak', '{}'),
  ('Rina Marlina', 'rina.marlina@ptpgp.co.id', 'HR & GA', 'IT Support', '2025-04-15', 'Tetap', '{}'),
  ('Hendra Gunawan', 'hendra.gunawan@ptpgp.co.id', 'HR & GA', 'Security Officer', '2024-03-01', 'Tetap', '{}');

-- Finance (5)
INSERT INTO employees (full_name, email, department, position, join_date, status, address) VALUES
  ('Rini Astuti, S.E., M.Ak.', 'rini.astuti@ptpgp.co.id', 'Finance', 'Finance Manager', '2023-06-01', 'Tetap', '{}'),
  ('Ahmad Fauzi', 'ahmad.fauzi@ptpgp.co.id', 'Finance', 'Senior Accountant', '2024-02-15', 'Tetap', '{}'),
  ('Dian Permata', 'dian.permata@ptpgp.co.id', 'Finance', 'Account Payable Staff', '2024-08-01', 'Tetap', '{}'),
  ('Rudi Hartono', 'rudi.hartono@ptpgp.co.id', 'Finance', 'Account Receivable Staff', '2025-01-10', 'Kontrak', '{}'),
  ('Maya Sari', 'maya.sari@ptpgp.co.id', 'Finance', 'Cashier', '2025-05-01', 'Tetap', '{}');

-- Operational Division (8)
INSERT INTO employees (full_name, email, department, position, join_date, status, address) VALUES
  ('Bambang Sutrisno', 'bambang.sutrisno@ptpgp.co.id', 'Operational Division', 'Operations Manager', '2023-01-20', 'Tetap', '{}'),
  ('Slamet Riyadi', 'slamet.riyadi@ptpgp.co.id', 'Operational Division', 'Vehicle Operations Supervisor', '2023-08-15', 'Tetap', '{}'),
  ('Agus Salim', 'agus.salim@ptpgp.co.id', 'Operational Division', 'Driver', '2024-03-01', 'Tetap', '{}'),
  ('Supriyanto', 'supriyanto@ptpgp.co.id', 'Operational Division', 'Driver', '2024-06-10', 'Tetap', '{}'),
  ('Joko Widodo', 'joko.widodo@ptpgp.co.id', 'Operational Division', 'Heavy Equipment Operator', '2023-11-01', 'Tetap', '{}'),
  ('Yanto Hermawan', 'yanto.hermawan@ptpgp.co.id', 'Operational Division', 'Rigger', '2024-09-15', 'Kontrak', '{}'),
  ('Tri Handoko', 'tri.handoko@ptpgp.co.id', 'Operational Division', 'Quality Control Staff', '2025-03-01', 'Tetap', '{}'),
  ('Eko Prasetyo', 'eko.prasetyo@ptpgp.co.id', 'Operational Division', 'Traffic System Staff', '2024-12-01', 'Tetap', '{}');

-- Procurement Division (2)
INSERT INTO employees (full_name, email, department, position, join_date, status, address) VALUES
  ('Retno Wulandari', 'retno.wulandari@ptpgp.co.id', 'Procurement Division', 'Procurement Officer', '2024-04-10', 'Tetap', '{}'),
  ('Yudi Setiawan', 'yudi.setiawan@ptpgp.co.id', 'Procurement Division', 'Procurement Staff', '2025-02-20', 'Kontrak', '{}');

-- Project Appraisal (3)
INSERT INTO employees (full_name, email, department, position, join_date, status, address) VALUES
  ('Galih Aditya', 'galih.aditya@ptpgp.co.id', 'Project Appraisal', 'Project Appraisal Manager', '2023-07-01', 'Tetap', '{}'),
  ('Fitriani Rahayu', 'fitriani.rahayu@ptpgp.co.id', 'Project Appraisal', 'Sales Executive', '2024-05-15', 'Tetap', '{}'),
  ('Doni Saputra', 'doni.saputra@ptpgp.co.id', 'Project Appraisal', 'Media & Promotion Staff', '2025-01-05', 'Kontrak', '{}');

-- Management Representative (1)
INSERT INTO employees (full_name, email, department, position, join_date, status, address) VALUES
  ('Yuni Astuti', 'yuni.astuti@ptpgp.co.id', 'Management Representative', 'MR Officer', '2024-07-01', 'Tetap', '{}');

-- Health, Safety & Environment (2)
INSERT INTO employees (full_name, email, department, position, join_date, status, address) VALUES
  ('Rizky Pratama', 'rizky.pratama@ptpgp.co.id', 'Health, Safety & Environment', 'HSE Officer', '2024-10-01', 'Tetap', '{}'),
  ('Nina Kusuma', 'nina.kusuma@ptpgp.co.id', 'Health, Safety & Environment', 'Document Control Staff', '2025-04-01', 'Tetap', '{}');

-- ============================================================
-- SEED: EMPLOYEE USER ACCOUNTS
-- ============================================================

-- All employees get user accounts (password: password)
INSERT INTO users (email, password_hash, role, full_name) VALUES
  ('radian@ptpgp.co.id', '7b3ff040d72943093ea8236f741734e3:ec2de86b8187131c927dc22dcc12209750e06cb8185c6a179d905e8c9eadad16d4bd2ff02cdc42e7ba1500bae614bb6153c90a1636442a11043a8eba05171a93', 'employee', 'Radian, S.Sos., CHRM'),
  ('siti.nurhaliza@ptpgp.co.id', '7b3ff040d72943093ea8236f741734e3:ec2de86b8187131c927dc22dcc12209750e06cb8185c6a179d905e8c9eadad16d4bd2ff02cdc42e7ba1500bae614bb6153c90a1636442a11043a8eba05171a93', 'employee', 'Siti Nurhaliza'),
  ('andi.pratama@ptpgp.co.id', '7b3ff040d72943093ea8236f741734e3:ec2de86b8187131c927dc22dcc12209750e06cb8185c6a179d905e8c9eadad16d4bd2ff02cdc42e7ba1500bae614bb6153c90a1636442a11043a8eba05171a93', 'employee', 'Andi Pratama'),
  ('dewi.lestari@ptpgp.co.id', '7b3ff040d72943093ea8236f741734e3:ec2de86b8187131c927dc22dcc12209750e06cb8185c6a179d905e8c9eadad16d4bd2ff02cdc42e7ba1500bae614bb6153c90a1636442a11043a8eba05171a93', 'employee', 'Dewi Lestari'),
  ('budi.wibowo@ptpgp.co.id', '7b3ff040d72943093ea8236f741734e3:ec2de86b8187131c927dc22dcc12209750e06cb8185c6a179d905e8c9eadad16d4bd2ff02cdc42e7ba1500bae614bb6153c90a1636442a11043a8eba05171a93', 'employee', 'Budi Wibowo'),
  ('rina.marlina@ptpgp.co.id', '7b3ff040d72943093ea8236f741734e3:ec2de86b8187131c927dc22dcc12209750e06cb8185c6a179d905e8c9eadad16d4bd2ff02cdc42e7ba1500bae614bb6153c90a1636442a11043a8eba05171a93', 'employee', 'Rina Marlina'),
  ('hendra.gunawan@ptpgp.co.id', '7b3ff040d72943093ea8236f741734e3:ec2de86b8187131c927dc22dcc12209750e06cb8185c6a179d905e8c9eadad16d4bd2ff02cdc42e7ba1500bae614bb6153c90a1636442a11043a8eba05171a93', 'employee', 'Hendra Gunawan'),
  ('rini.astuti@ptpgp.co.id', '7b3ff040d72943093ea8236f741734e3:ec2de86b8187131c927dc22dcc12209750e06cb8185c6a179d905e8c9eadad16d4bd2ff02cdc42e7ba1500bae614bb6153c90a1636442a11043a8eba05171a93', 'employee', 'Rini Astuti, S.E., M.Ak.'),
  ('ahmad.fauzi@ptpgp.co.id', '7b3ff040d72943093ea8236f741734e3:ec2de86b8187131c927dc22dcc12209750e06cb8185c6a179d905e8c9eadad16d4bd2ff02cdc42e7ba1500bae614bb6153c90a1636442a11043a8eba05171a93', 'employee', 'Ahmad Fauzi'),
  ('dian.permata@ptpgp.co.id', '7b3ff040d72943093ea8236f741734e3:ec2de86b8187131c927dc22dcc12209750e06cb8185c6a179d905e8c9eadad16d4bd2ff02cdc42e7ba1500bae614bb6153c90a1636442a11043a8eba05171a93', 'employee', 'Dian Permata'),
  ('rudi.hartono@ptpgp.co.id', '7b3ff040d72943093ea8236f741734e3:ec2de86b8187131c927dc22dcc12209750e06cb8185c6a179d905e8c9eadad16d4bd2ff02cdc42e7ba1500bae614bb6153c90a1636442a11043a8eba05171a93', 'employee', 'Rudi Hartono'),
  ('maya.sari@ptpgp.co.id', '7b3ff040d72943093ea8236f741734e3:ec2de86b8187131c927dc22dcc12209750e06cb8185c6a179d905e8c9eadad16d4bd2ff02cdc42e7ba1500bae614bb6153c90a1636442a11043a8eba05171a93', 'employee', 'Maya Sari'),
  ('bambang.sutrisno@ptpgp.co.id', '7b3ff040d72943093ea8236f741734e3:ec2de86b8187131c927dc22dcc12209750e06cb8185c6a179d905e8c9eadad16d4bd2ff02cdc42e7ba1500bae614bb6153c90a1636442a11043a8eba05171a93', 'employee', 'Bambang Sutrisno'),
  ('slamet.riyadi@ptpgp.co.id', '7b3ff040d72943093ea8236f741734e3:ec2de86b8187131c927dc22dcc12209750e06cb8185c6a179d905e8c9eadad16d4bd2ff02cdc42e7ba1500bae614bb6153c90a1636442a11043a8eba05171a93', 'employee', 'Slamet Riyadi'),
  ('agus.salim@ptpgp.co.id', '7b3ff040d72943093ea8236f741734e3:ec2de86b8187131c927dc22dcc12209750e06cb8185c6a179d905e8c9eadad16d4bd2ff02cdc42e7ba1500bae614bb6153c90a1636442a11043a8eba05171a93', 'employee', 'Agus Salim'),
  ('supriyanto@ptpgp.co.id', '7b3ff040d72943093ea8236f741734e3:ec2de86b8187131c927dc22dcc12209750e06cb8185c6a179d905e8c9eadad16d4bd2ff02cdc42e7ba1500bae614bb6153c90a1636442a11043a8eba05171a93', 'employee', 'Supriyanto'),
  ('joko.widodo@ptpgp.co.id', '7b3ff040d72943093ea8236f741734e3:ec2de86b8187131c927dc22dcc12209750e06cb8185c6a179d905e8c9eadad16d4bd2ff02cdc42e7ba1500bae614bb6153c90a1636442a11043a8eba05171a93', 'employee', 'Joko Widodo'),
  ('yanto.hermawan@ptpgp.co.id', '7b3ff040d72943093ea8236f741734e3:ec2de86b8187131c927dc22dcc12209750e06cb8185c6a179d905e8c9eadad16d4bd2ff02cdc42e7ba1500bae614bb6153c90a1636442a11043a8eba05171a93', 'employee', 'Yanto Hermawan'),
  ('tri.handoko@ptpgp.co.id', '7b3ff040d72943093ea8236f741734e3:ec2de86b8187131c927dc22dcc12209750e06cb8185c6a179d905e8c9eadad16d4bd2ff02cdc42e7ba1500bae614bb6153c90a1636442a11043a8eba05171a93', 'employee', 'Tri Handoko'),
  ('eko.prasetyo@ptpgp.co.id', '7b3ff040d72943093ea8236f741734e3:ec2de86b8187131c927dc22dcc12209750e06cb8185c6a179d905e8c9eadad16d4bd2ff02cdc42e7ba1500bae614bb6153c90a1636442a11043a8eba05171a93', 'employee', 'Eko Prasetyo'),
  ('retno.wulandari@ptpgp.co.id', '7b3ff040d72943093ea8236f741734e3:ec2de86b8187131c927dc22dcc12209750e06cb8185c6a179d905e8c9eadad16d4bd2ff02cdc42e7ba1500bae614bb6153c90a1636442a11043a8eba05171a93', 'employee', 'Retno Wulandari'),
  ('yudi.setiawan@ptpgp.co.id', '7b3ff040d72943093ea8236f741734e3:ec2de86b8187131c927dc22dcc12209750e06cb8185c6a179d905e8c9eadad16d4bd2ff02cdc42e7ba1500bae614bb6153c90a1636442a11043a8eba05171a93', 'employee', 'Yudi Setiawan'),
  ('galih.aditya@ptpgp.co.id', '7b3ff040d72943093ea8236f741734e3:ec2de86b8187131c927dc22dcc12209750e06cb8185c6a179d905e8c9eadad16d4bd2ff02cdc42e7ba1500bae614bb6153c90a1636442a11043a8eba05171a93', 'employee', 'Galih Aditya'),
  ('fitriani.rahayu@ptpgp.co.id', '7b3ff040d72943093ea8236f741734e3:ec2de86b8187131c927dc22dcc12209750e06cb8185c6a179d905e8c9eadad16d4bd2ff02cdc42e7ba1500bae614bb6153c90a1636442a11043a8eba05171a93', 'employee', 'Fitriani Rahayu'),
  ('doni.saputra@ptpgp.co.id', '7b3ff040d72943093ea8236f741734e3:ec2de86b8187131c927dc22dcc12209750e06cb8185c6a179d905e8c9eadad16d4bd2ff02cdc42e7ba1500bae614bb6153c90a1636442a11043a8eba05171a93', 'employee', 'Doni Saputra'),
  ('yuni.astuti@ptpgp.co.id', '7b3ff040d72943093ea8236f741734e3:ec2de86b8187131c927dc22dcc12209750e06cb8185c6a179d905e8c9eadad16d4bd2ff02cdc42e7ba1500bae614bb6153c90a1636442a11043a8eba05171a93', 'employee', 'Yuni Astuti'),
  ('rizky.pratama@ptpgp.co.id', '7b3ff040d72943093ea8236f741734e3:ec2de86b8187131c927dc22dcc12209750e06cb8185c6a179d905e8c9eadad16d4bd2ff02cdc42e7ba1500bae614bb6153c90a1636442a11043a8eba05171a93', 'employee', 'Rizky Pratama'),
  ('nina.kusuma@ptpgp.co.id', '7b3ff040d72943093ea8236f741734e3:ec2de86b8187131c927dc22dcc12209750e06cb8185c6a179d905e8c9eadad16d4bd2ff02cdc42e7ba1500bae614bb6153c90a1636442a11043a8eba05171a93', 'employee', 'Nina Kusuma')
ON CONFLICT (email) DO NOTHING;

-- ============================================================
-- DONE
-- ============================================================
SELECT 'ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ Setup complete!' as status;
SELECT 
  (SELECT count(*) FROM users) as users,
  (SELECT count(*) FROM employees WHERE email != '__settings__@ptpgp.co.id') as employees,
  (SELECT count(*) FROM org_units) as org_units,
  (SELECT count(*) FROM departments) as departments,
  (SELECT count(*) FROM positions) as positions;
