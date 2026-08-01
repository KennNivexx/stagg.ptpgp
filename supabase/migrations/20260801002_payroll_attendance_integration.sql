-- Migration: Payroll-Attendance Integration
-- Adds quantitative columns to absensi & lembur for payroll calculation
-- Adds payroll component columns to penggajian

-- 1. Add quantitative columns to absensi for payroll aggregation
ALTER TABLE absensi ADD COLUMN IF NOT EXISTS late_minutes INTEGER DEFAULT 0;
ALTER TABLE absensi ADD COLUMN IF NOT EXISTS total_hours DECIMAL(4,2) DEFAULT 0;
ALTER TABLE absensi ADD COLUMN IF NOT EXISTS absent_marked BOOLEAN DEFAULT false;
ALTER TABLE absensi ADD COLUMN IF NOT EXISTS mode_kerja TEXT DEFAULT 'WFO';

-- Create index for monthly attendance aggregation
CREATE INDEX IF NOT EXISTS idx_absensi_employee_date ON absensi(employee_id, date);

-- 2. Add quantitative columns to lembur (overtime)
ALTER TABLE lembur ADD COLUMN IF NOT EXISTS hours DECIMAL(5,2) DEFAULT 0;
ALTER TABLE lembur ADD COLUMN IF NOT EXISTS rate_per_hour DECIMAL(12,2) DEFAULT 0;
ALTER TABLE lembur ADD COLUMN IF NOT EXISTS amount DECIMAL(12,2) DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_lembur_employee_tanggal ON lembur(karyawan_id, tanggal);

-- 3. Add payroll component columns to penggajian
ALTER TABLE penggajian ADD COLUMN IF NOT EXISTS overtime_pay DECIMAL(12,2) DEFAULT 0;
ALTER TABLE penggajian ADD COLUMN IF NOT EXISTS attendance_allowance DECIMAL(12,2) DEFAULT 0;
ALTER TABLE penggajian ADD COLUMN IF NOT EXISTS late_deduction DECIMAL(12,2) DEFAULT 0;
ALTER TABLE penggajian ADD COLUMN IF NOT EXISTS absent_deduction DECIMAL(12,2) DEFAULT 0;
ALTER TABLE penggajian ADD COLUMN IF NOT EXISTS gross_salary DECIMAL(12,2) DEFAULT 0;
ALTER TABLE penggajian ADD COLUMN IF NOT EXISTS take_home_pay DECIMAL(12,2) DEFAULT 0;
ALTER TABLE penggajian ADD COLUMN IF NOT EXISTS attendance_days INTEGER DEFAULT 0;
ALTER TABLE penggajian ADD COLUMN IF NOT EXISTS absent_days INTEGER DEFAULT 0;
ALTER TABLE penggajian ADD COLUMN IF NOT EXISTS late_count INTEGER DEFAULT 0;
ALTER TABLE penggajian ADD COLUMN IF NOT EXISTS overtime_hours DECIMAL(5,2) DEFAULT 0;

-- 4. Add salary configuration table for attendance-based payroll rules
CREATE TABLE IF NOT EXISTS konfigurasi_penggajian (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Default payroll rules
INSERT INTO konfigurasi_penggajian (key, value, description)
VALUES 
  ('late_deduction_per_minute', '5000', 'Denda per menit keterlambatan'),
  ('absent_deduction_per_day', '100000', 'Potongan per hari tidak hadir tanpa izin'),
  ('overtime_rate_per_hour', '25000', 'Tarif lembur per jam'),
  ('attendance_allowance_per_day', '30000', 'Tunjangan kehadiran per hari'),
  ('work_days_per_month', '22', 'Rata-rata hari kerja per bulan')
ON CONFLICT (key) DO NOTHING;

-- 5. Create monthly attendance aggregation view for payroll
CREATE OR REPLACE VIEW rekap_absensi_bulanan AS
SELECT 
  employee_id,
  EXTRACT(YEAR FROM date)::INTEGER AS year,
  EXTRACT(MONTH FROM date)::INTEGER AS month,
  COUNT(*) FILTER (WHERE status = 'Hadir' OR status IS NULL) AS hadir_days,
  COUNT(*) FILTER (WHERE absent_marked = true) AS absent_days,
  COUNT(*) FILTER (WHERE late_minutes > 0) AS late_days,
  SUM(late_minutes) AS total_late_minutes,
  SUM(total_hours) AS total_work_hours
FROM absensi
GROUP BY employee_id, EXTRACT(YEAR FROM date), EXTRACT(MONTH FROM date);

-- 6. Create overtime aggregation view for payroll
CREATE OR REPLACE VIEW rekap_lembur_bulanan AS
SELECT 
  karyawan_id AS employee_id,
  EXTRACT(YEAR FROM tanggal)::INTEGER AS year,
  EXTRACT(MONTH FROM tanggal)::INTEGER AS month,
  SUM(hours) AS total_overtime_hours,
  SUM(amount) AS total_overtime_amount
FROM lembur
WHERE status = 'Disetujui'
GROUP BY karyawan_id, EXTRACT(YEAR FROM tanggal), EXTRACT(MONTH FROM tanggal);
