-- PR-SDM-06 Rekapan & Monitoring Payroll requires a 3-tier verification
-- chain (Ka Div SDM & Aset -> Spv Keuangan -> Direktur Utama tanda tangan
-- akhir) before payroll is marked Paid. The app previously only had
-- Draft -> Approved -> Paid with no finance/director sign-off gate. This
-- widens penggajian.status to carry the two new intermediate tiers.
--
-- The original CHECK constraint's name isn't tracked in this repo's
-- migration history (the table predates it), so it's located dynamically
-- by inspecting pg_constraint rather than assuming a specific name.
DO $$
DECLARE
  con_name text;
BEGIN
  SELECT con.conname INTO con_name
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  WHERE rel.relname = 'penggajian'
    AND con.contype = 'c'
    AND pg_get_constraintdef(con.oid) ILIKE '%status%';

  IF con_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE penggajian DROP CONSTRAINT %I', con_name);
  END IF;

  ALTER TABLE penggajian ADD CONSTRAINT penggajian_status_check
    CHECK (status IN ('Draft', 'Verified_SDM', 'Verified_Keuangan', 'Approved', 'Paid'));
END $$;
