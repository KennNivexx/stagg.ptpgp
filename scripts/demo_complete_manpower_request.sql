-- Demo: a FULLY complete Manpower Request for Finance, so the AI Validation
-- Engine shows Pass across the board instead of the mostly-Incomplete result
-- from the earlier "Tax Supervisor" test request (which was missing grade,
-- cost center, budget, and job description).
--
-- Uses real master data already seeded in this DB:
--   jabatan       "Finance Supervisor" (Finance, grade_id -> G07)
--   grade_jabatan "G07" Supervisor, Rp9.000.000 - Rp13.000.000
--   unit_organisasi "Finance" (code 1.2)
--
-- Run this in Supabase SQL Editor, then open the request from
-- /department (login finance@ptpgp.co.id / password) and click
-- "Lihat Validasi & Approval" -> "Jalankan Validasi".

-- 1. Job Description master data for "Finance Supervisor" (Job Description check)
--    responsibilities/requirements are text[] columns, not plain text.
insert into deskripsi_kerja (id, position, department, responsibilities, requirements, title, jabatan_id, kode)
values (
  'demo-jd-finspv',
  'Finance Supervisor',
  'Finance',
  array['Mengawasi proses akuntansi dan pelaporan keuangan harian', 'Memastikan kepatuhan pajak', 'Membina staff finance'],
  array['Min. S1 Akuntansi/Keuangan', '3 tahun pengalaman', 'Menguasai perpajakan dan pelaporan keuangan'],
  'Finance Supervisor',
  'demo-jab-finspv',
  'FIN-SPV-01'
)
on conflict (id) do nothing;

-- 2. A vacant formasi (position slot) for Finance Supervisor in Finance unit
--    (Headcount Validation check)
insert into formasi_jabatan (id, position_number, unit_organisasi_id, jabatan_id, status)
values (
  'demo-formasi-finspv',
  'FIN-SPV-001',
  'demo-unit-fin',
  'demo-jab-finspv',
  'Vacant'
)
on conflict (id) do nothing;

-- 3. The complete Manpower Request itself — every field the Validation
--    Engine checks is filled with data that actually matches master data.
insert into permintaan_sdm (
  id, department, position, quantity, reason, urgency, status,
  requested_by, grade_code, job_desc, cost_center,
  salary_range_min, salary_range_max, budget_recruitment, budget_available,
  request_type, need_by_date, created_at, updated_at
)
values (
  'demo-req-complete-example',
  'Finance',
  'Finance Supervisor',
  1,
  'Ekspansi tim finance untuk mendukung pertumbuhan volume transaksi ekspor-impor.',
  'Sedang',
  'Draft',
  'finance@ptpgp.co.id',
  'G07',
  'Mengawasi proses akuntansi dan pelaporan keuangan harian, memastikan kepatuhan pajak, dan membina staff finance.',
  'CC-FIN-01',
  9000000,
  13000000,
  15000000,
  true,
  'Posisi Baru',
  (current_date + interval '30 days')::date,
  now(),
  now()
)
on conflict (id) do nothing;
