-- =============================================================================
-- Proper system_settings table — replaces the fake __settings__@ptpgp.co.id
-- employee row that was used as a JSON blob store.
-- =============================================================================
-- Cara apply: paste ke Supabase SQL Editor SETELAH 20260620004_seed_users.sql

CREATE TABLE IF NOT EXISTS system_settings (
  key        TEXT PRIMARY KEY,
  value      JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migrate any existing JSON from the fake employee row
DO $$
DECLARE
  v_address TEXT;
BEGIN
  SELECT address INTO v_address
  FROM employees
  WHERE email = '__settings__@ptpgp.co.id'
  LIMIT 1;

  IF v_address IS NOT NULL THEN
    -- Try to parse it as valid JSON before inserting
    BEGIN
      INSERT INTO system_settings (key, value, updated_at)
      VALUES ('org_settings', v_address::JSONB, NOW())
      ON CONFLICT (key) DO UPDATE
        SET value = EXCLUDED.value, updated_at = NOW();
    EXCEPTION WHEN invalid_text_representation THEN
      -- Not valid JSON, skip migration
      NULL;
    END;

    -- Remove the fake row now that data is migrated
    DELETE FROM employees WHERE email = '__settings__@ptpgp.co.id';
  END IF;
END $$;

-- Index for fast key lookups
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(key);
