-- PR-SDM-02: Penerimaan Pengemudi & Operator Alat Berat
-- Extends the existing generic recruitment pipeline (lowongan_kerja / pelamar)
-- and the existing surat_peringatan warning system, rather than building a
-- parallel pipeline. Adds:
--   1. Flags to mark a job posting as a driver/operator position and/or a
--      hazmat/waste-transport position (lowongan_kerja).
--   2. A "penunjukan" (direct referral/appointment) flag on the candidate
--      record so the pipeline can skip written test + initial interview.
--   3. Driving/competency test result columns on pelamar (evaluated by
--      QC & senior driver), mirroring the existing background_check_status /
--      medical_checkup_status columns and setBackgroundCheck/setMedicalCheckup
--      pattern in recruitment-hiring.ts.
--   4. Mandatory third-party competency test result columns on pelamar for
--      hazmat/waste-transport candidates (cannot be skipped even for
--      penunjukan candidates).
--   5. monitoring_kinerja_pengemudi — quarterly post-hire driver performance
--      monitoring table.

ALTER TABLE lowongan_kerja ADD COLUMN IF NOT EXISTS is_driver_position BOOLEAN DEFAULT false;
ALTER TABLE lowongan_kerja ADD COLUMN IF NOT EXISTS is_hazmat_waste_transport BOOLEAN DEFAULT false;

ALTER TABLE pelamar ADD COLUMN IF NOT EXISTS is_penunjukan BOOLEAN DEFAULT false;

-- Driving / competency test (QC & pengemudi senior)
ALTER TABLE pelamar ADD COLUMN IF NOT EXISTS driving_test_status TEXT;
ALTER TABLE pelamar ADD COLUMN IF NOT EXISTS driving_test_evaluators TEXT;
ALTER TABLE pelamar ADD COLUMN IF NOT EXISTS driving_test_notes TEXT;
ALTER TABLE pelamar ADD COLUMN IF NOT EXISTS driving_test_at TIMESTAMPTZ;

-- Mandatory third-party competency test (angkutan bahan/limbah berbahaya)
ALTER TABLE pelamar ADD COLUMN IF NOT EXISTS hazmat_test_status TEXT;
ALTER TABLE pelamar ADD COLUMN IF NOT EXISTS hazmat_test_pihak_ketiga TEXT;
ALTER TABLE pelamar ADD COLUMN IF NOT EXISTS hazmat_test_notes TEXT;
ALTER TABLE pelamar ADD COLUMN IF NOT EXISTS hazmat_test_at TIMESTAMPTZ;

-- Quarterly driver performance monitoring (post-hire).
-- employee_id kept as plain TEXT (no FK) to match this codebase's existing
-- convention for surat_peringatan.employee_id / warnings.employee_id etc.
CREATE TABLE IF NOT EXISTS monitoring_kinerja_pengemudi (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL,
  employee_name TEXT DEFAULT '',
  periode TEXT NOT NULL,
  evaluator TEXT NOT NULL,
  catatan TEXT DEFAULT '',
  hasil TEXT NOT NULL CHECK (hasil IN ('Baik','Perlu Perbaikan','Pelanggaran Ringan','Pelanggaran Kritikal')),
  tindak_lanjut TEXT CHECK (tindak_lanjut IS NULL OR tindak_lanjut IN ('Surat Teguran','Briefing/Pelatihan Tambahan','PHK')),
  related_warning_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_monitoring_kinerja_pengemudi_employee ON monitoring_kinerja_pengemudi(employee_id);
