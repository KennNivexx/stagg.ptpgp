-- Enterprise payroll upgrade — attendance/appraisal detail columns on
-- penggajian. Adds visibility for gaps found in the enterprise spec review:
-- Pulang Cepat (early leave) deduction, Shift allowance, KPI-based bonus,
-- and separate Sakit/Izin/Cuti day counts (previously only a single
-- generic absent_days existed — Izin and Sakit were never distinguished
-- from each other or from unpaid absence).
-- Apply via: Supabase Dashboard > SQL Editor

alter table penggajian add column if not exists early_leave_minutes integer default 0;
alter table penggajian add column if not exists early_leave_deduction numeric default 0;
alter table penggajian add column if not exists shift_allowance numeric default 0;
alter table penggajian add column if not exists kpi_bonus numeric default 0;
alter table penggajian add column if not exists sakit_days integer default 0;
alter table penggajian add column if not exists izin_days integer default 0;
alter table penggajian add column if not exists cuti_days integer default 0;
alter table penggajian add column if not exists work_days_actual integer;
