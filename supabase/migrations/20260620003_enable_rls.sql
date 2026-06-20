-- Defense-in-depth: enable Row Level Security on every table in the public
-- schema. The application talks to Postgres exclusively through the Supabase
-- SERVICE ROLE key (see src/lib/supabase.ts -> supabaseAdmin), which has the
-- BYPASSRLS attribute, so enabling RLS does NOT affect any server-side query.
--
-- What it DOES do: the public NEXT_PUBLIC_SUPABASE_ANON_KEY is shipped to the
-- browser. Without RLS, anyone could use that key to read/write tables such as
-- `users` (password_hash), `payroll`, and `employees` directly. With RLS
-- enabled and NO permissive policies, the anon and authenticated roles are
-- denied access to every row by default. Only the service role gets through.
--
-- IMPORTANT: this is safe ONLY when SUPABASE_SERVICE_ROLE_KEY is configured in
-- the environment. If it is missing, supabaseAdmin silently falls back to the
-- anon client and enabling RLS would break the whole app. Verify the env var is
-- set before applying this migration.
--
-- To grant any future direct anon/browser access, add explicit CREATE POLICY
-- statements per table.

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', r.tablename);
  END LOOP;
END $$;
