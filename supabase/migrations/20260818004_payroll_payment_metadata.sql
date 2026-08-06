-- Enterprise payroll upgrade (Phase A) — part 4 of 4.
--
-- "Mark as Paid" (updatePayrollStatus with status='Paid', admin.ts) is
-- currently a bare status flip with zero payment metadata — no transfer
-- date, no payment method, no bank, no reference number. There's no way to
-- answer "when/how/with what reference was this actually paid" after the
-- fact, which is a basic finance/audit requirement for a payroll system.
-- Apply via: Supabase Dashboard > SQL Editor

alter table penggajian add column if not exists payment_method text;
alter table penggajian add column if not exists transfer_date date;
alter table penggajian add column if not exists payment_reference text;
alter table penggajian add column if not exists payment_notes text;
