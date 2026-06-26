-- Jalankan di Supabase SQL Editor

-- Tabel kontrak kerja karyawan (baru)
CREATE TABLE IF NOT EXISTS employee_contracts (
  id text PRIMARY KEY,
  employee_id text NOT NULL,
  contract_type text NOT NULL DEFAULT 'Kontrak',
  start_date date NOT NULL,
  end_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_employee_contracts_employee_id
  ON employee_contracts(employee_id);

-- Tabel payroll (tambah kolom jika belum ada, atau buat baru)
CREATE TABLE IF NOT EXISTS payroll (
  id text PRIMARY KEY,
  employee_id text NOT NULL,
  month integer NOT NULL,
  year integer NOT NULL,
  basic_salary numeric DEFAULT 0,
  allowances numeric DEFAULT 0,
  deductions numeric DEFAULT 0,
  net_salary numeric DEFAULT 0,
  status text NOT NULL DEFAULT 'Draft',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payroll_employee_id
  ON payroll(employee_id);

CREATE INDEX IF NOT EXISTS idx_payroll_year_month
  ON payroll(year, month);

-- Unique constraint (ignore jika sudah ada)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'payroll_employee_id_month_year_key'
  ) THEN
    ALTER TABLE payroll ADD CONSTRAINT payroll_employee_id_month_year_key
      UNIQUE (employee_id, month, year);
  END IF;
END $$;
