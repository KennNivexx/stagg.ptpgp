-- Real PGP payslip format (ref: Payslip - ENDANG - Mei 2026) has two
-- components struktur_gaji didn't track: "Kompensasi" (a taxable allowance,
-- alongside the existing transport/meal/housing/position allowances) and
-- "Potongan Amal Jariyah" (a fixed non-BPJS, non-tax deduction). Both are
-- per-employee monthly amounts, same shape as the existing allowance columns.
alter table struktur_gaji add column if not exists kompensasi numeric not null default 0;
alter table struktur_gaji add column if not exists potongan_amal_jariyah numeric not null default 0;
