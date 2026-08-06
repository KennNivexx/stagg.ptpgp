-- Enterprise payroll upgrade (Phase A) — part 3 of 4.
--
-- NPWP and bank account details belong on data_pribadi_karyawan, not
-- karyawan directly — that's the established pattern this codebase already
-- uses for exactly this kind of personal/financial data (see
-- src/app/actions/data-pribadi.ts: keyed by email, editable by both HRD and
-- the employee themselves via Employee Self Service, no FK to karyawan).
-- Putting NPWP/bank there for free gives self-service bank-detail
-- maintenance (spec §16 ESS) instead of inventing a second, inconsistent
-- storage location on karyawan.
--
-- Confirmed genuinely absent via a live query against the DB (`column
-- karyawan.npwp does not exist`), not just a migration grep.
-- Apply via: Supabase Dashboard > SQL Editor

alter table data_pribadi_karyawan add column if not exists npwp text;
alter table data_pribadi_karyawan add column if not exists bank_name text;
alter table data_pribadi_karyawan add column if not exists bank_account_number text;
alter table data_pribadi_karyawan add column if not exists bank_account_holder text;
