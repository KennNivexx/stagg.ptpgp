-- Competency Management: dictionary metadata (kode/deskripsi/status) belum
-- ada di master_kompetensi, dan assessment belum bisa mencatat jenis/siapa
-- yang menilai. Additive only — baris lama & alur single-current-level-per-
-- skill tidak berubah.

ALTER TABLE master_kompetensi ADD COLUMN IF NOT EXISTS kode TEXT;
ALTER TABLE master_kompetensi ADD COLUMN IF NOT EXISTS deskripsi TEXT;
ALTER TABLE master_kompetensi ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Aktif' CHECK (status IN ('Aktif','Tidak Aktif'));

ALTER TABLE kompetensi_karyawan ADD COLUMN IF NOT EXISTS assessment_type TEXT; -- 'Self'|'Supervisor'|'HR'|'Assessment Center'|'Technical Test'|'Interview', freeform (no CHECK)
ALTER TABLE kompetensi_karyawan ADD COLUMN IF NOT EXISTS evidence TEXT;
