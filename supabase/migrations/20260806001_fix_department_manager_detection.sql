-- Root cause: department_manager login accounts (finance@ptpgp.co.id,
-- hrga@ptpgp.co.id, etc.) are generic per-department logins with NO matching
-- karyawan row, so every "which department is this manager the head of"
-- lookup (previously karyawan.email = session.email) silently found nothing.
-- Fix: give pengguna a department column for these accounts directly, and
-- normalize the one legacy string mismatch found ("Finance Department" vs
-- the canonical "Finance" used by departemen.name).

ALTER TABLE pengguna ADD COLUMN IF NOT EXISTS department TEXT;

UPDATE pengguna SET department = 'HR & General Affairs' WHERE email = 'hrga@ptpgp.co.id';
UPDATE pengguna SET department = 'Finance' WHERE email = 'finance@ptpgp.co.id';
UPDATE pengguna SET department = 'Operational Division' WHERE email = 'operational@ptpgp.co.id';
UPDATE pengguna SET department = 'Procurement Division' WHERE email = 'procurement@ptpgp.co.id';
UPDATE pengguna SET department = 'Project Appraisal' WHERE email = 'projectappraisal@ptpgp.co.id';
UPDATE pengguna SET department = 'Management Representative' WHERE email = 'mr@ptpgp.co.id';
UPDATE pengguna SET department = 'Health, Safety & Environment' WHERE email = 'hse@ptpgp.co.id';

-- karyawan.department used the abbreviation "HR & GA" while the departemen
-- master table (and now pengguna.department) uses "HR & General Affairs" —
-- align it so department-scoped queries (which join on this exact string)
-- actually match.
UPDATE karyawan SET department = 'HR & General Affairs' WHERE department = 'HR & GA';

-- Legacy submitted request used "Finance Department" instead of the
-- canonical "Finance".
UPDATE permintaan_sdm SET department = 'Finance' WHERE department = 'Finance Department';
