-- Add kode column to employees table
ALTER TABLE employees ADD COLUMN IF NOT EXISTS kode TEXT;
CREATE INDEX IF NOT EXISTS idx_employees_kode ON employees(kode);
