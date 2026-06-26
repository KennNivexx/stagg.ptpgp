-- Fix: The original users table CHECK constraint only allowed
-- ('superadmin', 'hrd', 'employee') but the system now uses additional roles:
-- 'applicant', 'director', 'department_manager'.
-- This drops the old constraint and replaces it with one that allows all roles.

DO $$
DECLARE
  constraint_name_val TEXT;
BEGIN
  SELECT con.conname INTO constraint_name_val
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  WHERE rel.relname = 'users'
    AND con.contype = 'c'
    AND pg_get_constraintdef(con.oid) LIKE '%role%';

  IF constraint_name_val IS NOT NULL THEN
    EXECUTE format('ALTER TABLE users DROP CONSTRAINT %I;', constraint_name_val);
  END IF;
END $$;

ALTER TABLE users
  DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users
  ADD CONSTRAINT users_role_check
  CHECK (role IN ('superadmin', 'hrd', 'employee', 'applicant', 'director', 'department_manager'));

ALTER TABLE users
  ALTER COLUMN role SET DEFAULT 'employee';
