-- Splits the Kasbon (employee loan) installment amount out of the generic
-- `deductions` column on penggajian. Previously kasbon_cicilan amounts were
-- folded directly into `deductions` at generation time (deductions =
-- potongan_manual + kasbon_amount), which meant HRD editing "Potongan Lain"
-- in the Edit Payroll modal (updatePayrollAmounts) silently overwrote and
-- lost the kasbon portion — the form only ever sends the manual figure. This
-- column makes kasbon its own tracked amount so it can be displayed as a
-- separate Ringkasan Payroll line and never gets clobbered by a manual edit.
-- Apply via: Supabase Dashboard > SQL Editor

alter table penggajian add column if not exists kasbon_deduction numeric default 0;
