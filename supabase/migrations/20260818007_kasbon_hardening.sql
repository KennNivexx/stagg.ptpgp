-- Enterprise payroll upgrade — Kasbon hardening (security review follow-up).
--
-- src/app/actions/kasbon.ts's submitKasbon enforces "one active kasbon per
-- employee" with a check-then-insert, which is a TOCTOU race: two requests
-- submitted simultaneously both see zero active loans and both insert. This
-- partial unique index is the real backstop — the app check stays for the
-- friendly error message, but the DB now makes a second concurrent active
-- loan impossible regardless of timing.
--
-- Partial (WHERE status IN ...) rather than a plain unique constraint, so an
-- employee can still have any number of historical Lunas/Ditolak/Dibatalkan
-- rows — only the *active* ones are constrained to at most one.
-- Apply via: Supabase Dashboard > SQL Editor

create unique index if not exists idx_kasbon_one_active_per_employee
  on kasbon (employee_id)
  where status in ('Diajukan', 'Disetujui', 'Berjalan');
