-- ============================================================================
-- REVISI PAK BOSS - FOUNDATIONAL CHANGES
-- 1. NIK (Nomor Induk Karyawan) as primary employee identity
-- 2. Kode Jabatan consistency across all employee-related views
-- 3. Kode Kompetensi for competency management
-- 4. Remove career path, merge department into jabatan
-- 5. Various schema enhancements
-- ============================================================================

-- 1. Ensure NIK exists on karyawan table (some may already have it)
DO $$ BEGIN
  ALTER TABLE karyawan ADD COLUMN IF NOT EXISTS nik TEXT;
  ALTER TABLE karyawan ADD COLUMN IF NOT EXISTS kode_jabatan TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- 2. Add kode_kompetensi to master_kompetensi
DO $$ BEGIN
  ALTER TABLE master_kompetensi ADD COLUMN IF NOT EXISTS kode_kompetensi TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- 3. Add kode_jabatan support to jabatan table  
DO $$ BEGIN
  ALTER TABLE jabatan ADD COLUMN IF NOT EXISTS parent_code TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- 4. Update jabatan with proper 7-segment hierarchical codes
-- Format: 1.2.3.4.5.6.7 (7 segments, zero-padded)
-- 1 = Root (Komisaris/Direktur Utama)
-- 1.x = Direktur level
-- 1.x.y = Department level  
-- 1.x.y.z = Sub-department
-- 1.x.y.z.w = Manager/Supervisor
-- 1.x.y.z.w.v = Staff level
-- 1.x.y.z.w.v.u = Individual employee

UPDATE jabatan SET code = '1.0.0.0.0.0.0' WHERE name ILIKE '%komisaris%' AND code = '1';
UPDATE jabatan SET code = '1.1.0.0.0.0.0' WHERE name ILIKE '%direktur utama%' AND code = '1.1';
UPDATE jabatan SET parent_code = '1.0.0.0.0.0.0' WHERE code = '1.1.0.0.0.0.0';

-- 5. Sync karyawan.kode_jabatan from their position assignment
DO $$ 
DECLARE
  emp RECORD;
BEGIN
  FOR emp IN 
    SELECT k.id, k.formasi_id, k.position, k.department
    FROM karyawan k 
    WHERE k.status != 'Inactive'
  LOOP
    IF emp.formasi_id IS NOT NULL THEN
      -- Get jabatan code from formasi chain
      UPDATE karyawan 
      SET kode_jabatan = (
        SELECT j.code 
        FROM formasi_jabatan fj 
        JOIN jabatan j ON j.id = fj.jabatan_id 
        WHERE fj.id = emp.formasi_id
      )
      WHERE id = emp.id;
    ELSE
      -- Fallback: match by position name and department
      UPDATE karyawan 
      SET kode_jabatan = (
        SELECT j.code 
        FROM jabatan j 
        WHERE j.name = emp.position 
          AND (j.department = emp.department OR j.department = '' OR j.department IS NULL)
        LIMIT 1
      )
      WHERE id = emp.id AND kode_jabatan IS NULL;
    END IF;
  END LOOP;
END $$;

-- 6. Auto-generate NIK for employees who don't have one
-- Format: PGP-YYYYMM-XXXXX (company code, join year-month, sequence)
DO $$
DECLARE
  emp RECORD;
  seq INT;
BEGIN
  FOR emp IN 
    SELECT k.id, k.join_date 
    FROM karyawan k 
    WHERE k.nik IS NULL OR k.nik = ''
  LOOP
    -- Count existing NIKs for the same join year
    SELECT COUNT(*) + 1 INTO seq FROM karyawan 
    WHERE join_date IS NOT NULL 
      AND EXTRACT(YEAR FROM join_date::date) = EXTRACT(YEAR FROM COALESCE(emp.join_date::date, CURRENT_DATE));
    
    UPDATE karyawan 
    SET nik = 'PGP-' || 
      TO_CHAR(COALESCE(emp.join_date::date, CURRENT_DATE), 'YYYYMM') || '-' || 
      LPAD(seq::text, 4, '0')
    WHERE id = emp.id;
  END LOOP;
END $$;

-- 7. Add reason/alasan columns to incentive/bonus records
DO $$ BEGIN
  ALTER TABLE insentif ADD COLUMN IF NOT EXISTS alasan TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- 8. Add geofence/location support for absensi
DO $$ BEGIN
  ALTER TABLE lokasi_kerja ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
  ALTER TABLE lokasi_kerja ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
  ALTER TABLE lokasi_kerja ADD COLUMN IF NOT EXISTS radius_meter INTEGER DEFAULT 100;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- 9. Add kode_jabatan to absensi and related views
DO $$ BEGIN
  ALTER TABLE absensi ADD COLUMN IF NOT EXISTS kode_jabatan TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- 10. Disable/hide career path (mark as inactive)
UPDATE jalur_jabatan SET is_active = false WHERE is_active IS NOT NULL;
DO $$ BEGIN
  ALTER TABLE jalur_jabatan ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- 11. Add minimum competency per position tracking
DO $$ BEGIN
  ALTER TABLE kompetensi_jabatan ADD COLUMN IF NOT EXISTS is_minimum BOOLEAN DEFAULT true;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- 12. Create index for faster employee lookups
CREATE INDEX IF NOT EXISTS idx_karyawan_nik ON karyawan(nik);
CREATE INDEX IF NOT EXISTS idx_karyawan_kode_jabatan ON karyawan(kode_jabatan);
CREATE INDEX IF NOT EXISTS idx_master_kompetensi_kode ON master_kompetensi(kode_kompetensi);
