-- ============================================================================
-- FULL DATA RESET — DESTRUCTIVE, IRREVERSIBLE.
-- Confirmed explicitly (twice) by the user with full risk disclosure.
-- Deletes ALL rows from ALL tables in the public schema (schema/structure is
-- kept intact — only data is removed). Run 20260720002_seed_dummy_data.sql
-- immediately after this to repopulate with example data.
-- ============================================================================

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('TRUNCATE TABLE public.%I RESTART IDENTITY CASCADE', r.tablename);
  END LOOP;
END $$;
