-- Tambah kolom kode org sequential untuk karyawan
-- Format: mengikuti kode org_unit induknya, segmen 0 diganti nomor urut
-- Contoh: org unit "1.1.2.1.1.0" → karyawan ke-1 = "1.1.2.1.1.1", ke-2 = "1.1.2.1.1.2"
ALTER TABLE employees ADD COLUMN IF NOT EXISTS kode TEXT;
CREATE INDEX IF NOT EXISTS idx_employees_kode ON employees(kode);
