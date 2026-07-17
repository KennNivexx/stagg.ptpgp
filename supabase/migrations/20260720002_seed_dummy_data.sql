-- ============================================================================
-- DUMMY DATA SEED — run AFTER 20260720001_reset_all_data.sql on a fully
-- empty database. Populates the core organization chain plus example rows
-- across the major modules (Workforce Time, Competency, Learning, Knowledge,
-- Performance, Reward & Recognition, Career, Recruitment) so every page has
-- something to show.
--
-- Themed for PT Pratama Galuh Perkasa's actual business — freight forwarding
-- / customs brokerage (PPJK) / cargo logistics — instead of generic
-- placeholder departments. Department names match EXACTLY the 7 canonical
-- departments already hardcoded elsewhere in the live app (see EMAIL_TO_DEPT
-- in src/app/actions/skills.ts) so department-manager routing, the
-- "Khusus Departemen" competency filter, and every other department-string
-- comparison in the codebase work correctly against this seed data:
--   HR & GA · Finance · Operational Division · Procurement Division ·
--   Project Appraisal · Management Representative · Health, Safety & Environment
--
-- SCOPE NOTE: this covers the ~25 tables with real, actively-used UI pages —
-- it does NOT hand-seed every one of the 130+ tables in this schema (many
-- are config/edge-case tables like approval_configs, WA bot logs, asset/
-- vehicle tables, survey templates, etc. that populate naturally through use
-- or don't need example rows to demo). Each section below is wrapped in its
-- own error-tolerant block — if a column assumption doesn't match the live
-- schema exactly, that ONE section is skipped (reported via NOTICE) instead
-- of aborting the whole script, since this runs against a real production
-- database and the full live schema (accumulated over 80+ migrations)
-- couldn't be independently verified table-by-table before writing this.
--
-- All seeded login accounts use password: password
-- ============================================================================

-- ── Core org chain: unit_organisasi -> jabatan -> grade_jabatan -> formasi_jabatan
DO $$ BEGIN
INSERT INTO unit_organisasi (id, code, name, parent_code, level, sort_order) VALUES
  ('demo-unit-hold', '1',   'PT Pratama Galuh Perkasa', NULL, 0, 0),
  ('demo-unit-hr',   '1.1', 'HR & General Affairs', '1', 1, 1),
  ('demo-unit-fin',  '1.2', 'Finance', '1', 1, 2),
  ('demo-unit-ops',  '1.3', 'Operational Division', '1', 1, 3),
  ('demo-unit-proc', '1.4', 'Procurement Division', '1', 1, 4),
  ('demo-unit-pa',   '1.5', 'Project Appraisal', '1', 1, 5),
  ('demo-unit-mr',   '1.6', 'Management Representative', '1', 1, 6),
  ('demo-unit-hse',  '1.7', 'Health, Safety & Environment', '1', 1, 7)
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped unit_organisasi: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO grade_jabatan (id, kode, nama, urutan, salary_min, salary_max) VALUES
  ('demo-grade-g04', 'G04', 'Junior Staff', 4, 5000000, 6500000),
  ('demo-grade-g05', 'G05', 'Staff', 5, 6000000, 8000000),
  ('demo-grade-g06', 'G06', 'Senior Staff', 6, 8000000, 11000000),
  ('demo-grade-g07', 'G07', 'Supervisor', 7, 9000000, 13000000),
  ('demo-grade-g08', 'G08', 'Manager', 8, 13000000, 20000000)
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped grade_jabatan: %', SQLERRM;
END $$;

-- Freight-forwarding-specific positions: PPJK (customs clearance), export-
-- import documentation, warehouse, trucking/armada coordination, cargo
-- customer service — alongside the standard support functions.
DO $$ BEGIN
INSERT INTO jabatan (id, code, name, department, level, grade_id) VALUES
  ('demo-jab-hrstaff',  'JAB-HR-01',  'HR & GA Staff', 'HR & GA', 'Staff', 'demo-grade-g05'),
  ('demo-jab-hrspv',    'JAB-HR-02',  'HR & GA Supervisor', 'HR & GA', 'Supervisor', 'demo-grade-g07'),
  ('demo-jab-finstaff', 'JAB-FIN-01', 'Finance & Accounting Staff', 'Finance', 'Staff', 'demo-grade-g05'),
  ('demo-jab-finspv',   'JAB-FIN-02', 'Finance Supervisor', 'Finance', 'Supervisor', 'demo-grade-g07'),
  ('demo-jab-ppjk',     'JAB-OPS-01', 'Staff PPJK (Kepabeanan)', 'Operational Division', 'Staff', 'demo-grade-g06'),
  ('demo-jab-dok',      'JAB-OPS-02', 'Staff Dokumentasi Ekspor-Impor', 'Operational Division', 'Staff', 'demo-grade-g05'),
  ('demo-jab-gudang',   'JAB-OPS-03', 'Supervisor Gudang & Cargo', 'Operational Division', 'Supervisor', 'demo-grade-g07'),
  ('demo-jab-armada',   'JAB-OPS-04', 'Koordinator Armada & Trucking', 'Operational Division', 'Supervisor', 'demo-grade-g07'),
  ('demo-jab-cs',       'JAB-OPS-05', 'Customer Service Ekspor-Impor', 'Operational Division', 'Staff', 'demo-grade-g05'),
  ('demo-jab-opsmgr',   'JAB-OPS-06', 'Operational Manager', 'Operational Division', 'Manager', 'demo-grade-g08'),
  ('demo-jab-procstaff','JAB-PRC-01', 'Procurement Staff', 'Procurement Division', 'Staff', 'demo-grade-g05'),
  ('demo-jab-pastaff',  'JAB-PA-01',  'Project Appraisal Analyst', 'Project Appraisal', 'Staff', 'demo-grade-g06'),
  ('demo-jab-mrstaff',  'JAB-MR-01',  'Management Representative Coordinator', 'Management Representative', 'Supervisor', 'demo-grade-g07'),
  ('demo-jab-hseofficer','JAB-HSE-01','HSE Officer', 'Health, Safety & Environment', 'Staff', 'demo-grade-g05')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped jabatan: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO formasi_jabatan (id, position_number, unit_organisasi_id, jabatan_id, status) VALUES
  ('demo-formasi-01', 'PN-HR-001',  'demo-unit-hr',   'demo-jab-hrstaff',   'Filled'),
  ('demo-formasi-02', 'PN-HR-002',  'demo-unit-hr',   'demo-jab-hrspv',     'Filled'),
  ('demo-formasi-03', 'PN-FIN-001', 'demo-unit-fin',  'demo-jab-finstaff',  'Filled'),
  ('demo-formasi-04', 'PN-OPS-001', 'demo-unit-ops',  'demo-jab-ppjk',      'Filled'),
  ('demo-formasi-05', 'PN-OPS-002', 'demo-unit-ops',  'demo-jab-dok',       'Filled'),
  ('demo-formasi-06', 'PN-OPS-003', 'demo-unit-ops',  'demo-jab-gudang',    'Filled'),
  ('demo-formasi-07', 'PN-OPS-004', 'demo-unit-ops',  'demo-jab-armada',    'Filled'),
  ('demo-formasi-08', 'PN-OPS-005', 'demo-unit-ops',  'demo-jab-cs',        'Filled'),
  ('demo-formasi-09', 'PN-OPS-006', 'demo-unit-ops',  'demo-jab-opsmgr',    'Filled'),
  ('demo-formasi-10', 'PN-PRC-001', 'demo-unit-proc', 'demo-jab-procstaff', 'Vacant'),
  ('demo-formasi-11', 'PN-HSE-001', 'demo-unit-hse',  'demo-jab-hseofficer','Filled')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped formasi_jabatan: %', SQLERRM;
END $$;

-- ── Employees (karyawan) + login accounts (pengguna)
DO $$ BEGIN
INSERT INTO karyawan (id, full_name, email, department, position, status, formasi_id, join_date, phone) VALUES
  ('demo-emp-01', 'Siti Rahayu',    'siti.rahayu@ptpgp.co.id',    'HR & GA', 'HR & GA Staff', 'Active', 'demo-formasi-01', '2023-02-01', '081200000001'),
  ('demo-emp-02', 'Budi Santoso',   'budi.santoso@ptpgp.co.id',   'HR & GA', 'HR & GA Supervisor', 'Active', 'demo-formasi-02', '2021-06-15', '081200000002'),
  ('demo-emp-03', 'Andi Wijaya',    'andi.wijaya@ptpgp.co.id',    'Finance', 'Finance & Accounting Staff', 'Active', 'demo-formasi-03', '2022-09-10', '081200000003'),
  ('demo-emp-04', 'Dewi Lestari',   'dewi.lestari@ptpgp.co.id',   'Operational Division', 'Staff PPJK (Kepabeanan)', 'Active', 'demo-formasi-04', '2020-03-20', '081200000004'),
  ('demo-emp-05', 'Agus Purnomo',   'agus.purnomo@ptpgp.co.id',   'Operational Division', 'Staff Dokumentasi Ekspor-Impor', 'Active', 'demo-formasi-05', '2021-08-12', '081200000005'),
  ('demo-emp-06', 'Rina Marlina',   'rina.marlina@ptpgp.co.id',   'Operational Division', 'Supervisor Gudang & Cargo', 'Active', 'demo-formasi-06', '2019-05-02', '081200000006'),
  ('demo-emp-07', 'Hendra Saputra', 'hendra.saputra@ptpgp.co.id', 'Operational Division', 'Koordinator Armada & Trucking', 'Active', 'demo-formasi-07', '2018-11-19', '081200000007'),
  ('demo-emp-08', 'Maya Kusuma',    'maya.kusuma@ptpgp.co.id',    'Operational Division', 'Customer Service Ekspor-Impor', 'Active', 'demo-formasi-08', '2023-07-03', '081200000008'),
  ('demo-emp-09', 'Fajar Nugroho',  'fajar.nugroho@ptpgp.co.id',  'Operational Division', 'Operational Manager', 'Active', 'demo-formasi-09', '2016-02-14', '081200000009'),
  ('demo-emp-10', 'Yudi Firmansyah','yudi.firmansyah@ptpgp.co.id','Health, Safety & Environment', 'HSE Officer', 'Active', 'demo-formasi-11', '2022-01-17', '081200000010')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped karyawan: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO pengguna (email, password_hash, role, full_name) VALUES
  ('director@ptpgp.co.id', '7b3ff040d72943093ea8236f741734e3:ec2de86b8187131c927dc22dcc12209750e06cb8185c6a179d905e8c9eadad16d4bd2ff02cdc42e7ba1500bae614bb6153c90a1636442a11043a8eba05171a93', 'director', 'Direktur Utama'),
  ('hrga@ptpgp.co.id', '7b3ff040d72943093ea8236f741734e3:ec2de86b8187131c927dc22dcc12209750e06cb8185c6a179d905e8c9eadad16d4bd2ff02cdc42e7ba1500bae614bb6153c90a1636442a11043a8eba05171a93', 'department_manager', 'Kepala HR & GA'),
  ('finance@ptpgp.co.id', '7b3ff040d72943093ea8236f741734e3:ec2de86b8187131c927dc22dcc12209750e06cb8185c6a179d905e8c9eadad16d4bd2ff02cdc42e7ba1500bae614bb6153c90a1636442a11043a8eba05171a93', 'department_manager', 'Kepala Finance'),
  ('operational@ptpgp.co.id', '7b3ff040d72943093ea8236f741734e3:ec2de86b8187131c927dc22dcc12209750e06cb8185c6a179d905e8c9eadad16d4bd2ff02cdc42e7ba1500bae614bb6153c90a1636442a11043a8eba05171a93', 'department_manager', 'Kepala Operational Division'),
  ('procurement@ptpgp.co.id', '7b3ff040d72943093ea8236f741734e3:ec2de86b8187131c927dc22dcc12209750e06cb8185c6a179d905e8c9eadad16d4bd2ff02cdc42e7ba1500bae614bb6153c90a1636442a11043a8eba05171a93', 'department_manager', 'Kepala Procurement Division'),
  ('projectappraisal@ptpgp.co.id', '7b3ff040d72943093ea8236f741734e3:ec2de86b8187131c927dc22dcc12209750e06cb8185c6a179d905e8c9eadad16d4bd2ff02cdc42e7ba1500bae614bb6153c90a1636442a11043a8eba05171a93', 'department_manager', 'Kepala Project Appraisal'),
  ('mr@ptpgp.co.id', '7b3ff040d72943093ea8236f741734e3:ec2de86b8187131c927dc22dcc12209750e06cb8185c6a179d905e8c9eadad16d4bd2ff02cdc42e7ba1500bae614bb6153c90a1636442a11043a8eba05171a93', 'department_manager', 'Management Representative'),
  ('hse@ptpgp.co.id', '7b3ff040d72943093ea8236f741734e3:ec2de86b8187131c927dc22dcc12209750e06cb8185c6a179d905e8c9eadad16d4bd2ff02cdc42e7ba1500bae614bb6153c90a1636442a11043a8eba05171a93', 'department_manager', 'Kepala HSE'),
  ('siti.rahayu@ptpgp.co.id', '7b3ff040d72943093ea8236f741734e3:ec2de86b8187131c927dc22dcc12209750e06cb8185c6a179d905e8c9eadad16d4bd2ff02cdc42e7ba1500bae614bb6153c90a1636442a11043a8eba05171a93', 'employee', 'Siti Rahayu'),
  ('budi.santoso@ptpgp.co.id', '7b3ff040d72943093ea8236f741734e3:ec2de86b8187131c927dc22dcc12209750e06cb8185c6a179d905e8c9eadad16d4bd2ff02cdc42e7ba1500bae614bb6153c90a1636442a11043a8eba05171a93', 'employee', 'Budi Santoso'),
  ('andi.wijaya@ptpgp.co.id', '7b3ff040d72943093ea8236f741734e3:ec2de86b8187131c927dc22dcc12209750e06cb8185c6a179d905e8c9eadad16d4bd2ff02cdc42e7ba1500bae614bb6153c90a1636442a11043a8eba05171a93', 'employee', 'Andi Wijaya'),
  ('dewi.lestari@ptpgp.co.id', '7b3ff040d72943093ea8236f741734e3:ec2de86b8187131c927dc22dcc12209750e06cb8185c6a179d905e8c9eadad16d4bd2ff02cdc42e7ba1500bae614bb6153c90a1636442a11043a8eba05171a93', 'employee', 'Dewi Lestari'),
  ('agus.purnomo@ptpgp.co.id', '7b3ff040d72943093ea8236f741734e3:ec2de86b8187131c927dc22dcc12209750e06cb8185c6a179d905e8c9eadad16d4bd2ff02cdc42e7ba1500bae614bb6153c90a1636442a11043a8eba05171a93', 'employee', 'Agus Purnomo'),
  ('rina.marlina@ptpgp.co.id', '7b3ff040d72943093ea8236f741734e3:ec2de86b8187131c927dc22dcc12209750e06cb8185c6a179d905e8c9eadad16d4bd2ff02cdc42e7ba1500bae614bb6153c90a1636442a11043a8eba05171a93', 'employee', 'Rina Marlina'),
  ('hendra.saputra@ptpgp.co.id', '7b3ff040d72943093ea8236f741734e3:ec2de86b8187131c927dc22dcc12209750e06cb8185c6a179d905e8c9eadad16d4bd2ff02cdc42e7ba1500bae614bb6153c90a1636442a11043a8eba05171a93', 'employee', 'Hendra Saputra'),
  ('maya.kusuma@ptpgp.co.id', '7b3ff040d72943093ea8236f741734e3:ec2de86b8187131c927dc22dcc12209750e06cb8185c6a179d905e8c9eadad16d4bd2ff02cdc42e7ba1500bae614bb6153c90a1636442a11043a8eba05171a93', 'employee', 'Maya Kusuma'),
  ('fajar.nugroho@ptpgp.co.id', '7b3ff040d72943093ea8236f741734e3:ec2de86b8187131c927dc22dcc12209750e06cb8185c6a179d905e8c9eadad16d4bd2ff02cdc42e7ba1500bae614bb6153c90a1636442a11043a8eba05171a93', 'employee', 'Fajar Nugroho'),
  ('yudi.firmansyah@ptpgp.co.id', '7b3ff040d72943093ea8236f741734e3:ec2de86b8187131c927dc22dcc12209750e06cb8185c6a179d905e8c9eadad16d4bd2ff02cdc42e7ba1500bae614bb6153c90a1636442a11043a8eba05171a93', 'employee', 'Yudi Firmansyah'),
  ('hrd@ptpgp.co.id', '7b3ff040d72943093ea8236f741734e3:ec2de86b8187131c927dc22dcc12209750e06cb8185c6a179d905e8c9eadad16d4bd2ff02cdc42e7ba1500bae614bb6153c90a1636442a11043a8eba05171a93', 'hrd', 'Administrator HRD'),
  ('superadmin@ptpgp.co.id', '46072c81788a79c97ab5b2bbecdcdc2f:3a86a537b6e9609eb277db2dc6c98d8d0b7e5b27709d326028843373714262b1498c4e7134b910b2cc766c393f450c080a15ea427b3beb31fa7ee79b4786f074', 'superadmin', 'Super Administrator')
ON CONFLICT (email) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped pengguna: %', SQLERRM;
END $$;

-- ── Workforce Time — warehouse/port-side work location, matching the
-- freight-forwarding business (cargo handling happens at the warehouse/port,
-- not a generic office).
DO $$ BEGIN
INSERT INTO lokasi_kerja (id, name, address, latitude, longitude, radius_meters) VALUES
  ('demo-loc-01', 'Kantor Pusat & Gudang PGP — Tanjung Priok', 'Jl. Pelabuhan Raya No. 12, Tanjung Priok, Jakarta Utara', -6.104147, 106.880821, 250)
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped lokasi_kerja: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO absensi (id, employee_id, employee_name, department, date, check_in, check_out, status) VALUES
  ('demo-abs-01', 'demo-emp-01', 'Siti Rahayu', 'HR & GA', CURRENT_DATE - 1, (CURRENT_DATE - 1) + TIME '08:02', (CURRENT_DATE - 1) + TIME '17:05', 'Hadir'),
  ('demo-abs-02', 'demo-emp-02', 'Budi Santoso', 'HR & GA', CURRENT_DATE - 1, (CURRENT_DATE - 1) + TIME '07:55', (CURRENT_DATE - 1) + TIME '17:10', 'Hadir'),
  ('demo-abs-03', 'demo-emp-04', 'Dewi Lestari', 'Operational Division', CURRENT_DATE - 1, (CURRENT_DATE - 1) + TIME '07:40', (CURRENT_DATE - 1) + TIME '17:30', 'Hadir'),
  ('demo-abs-04', 'demo-emp-06', 'Rina Marlina', 'Operational Division', CURRENT_DATE - 1, (CURRENT_DATE - 1) + TIME '06:50', (CURRENT_DATE - 1) + TIME '16:45', 'Hadir'),
  ('demo-abs-05', 'demo-emp-07', 'Hendra Saputra', 'Operational Division', CURRENT_DATE - 1, (CURRENT_DATE - 1) + TIME '06:30', (CURRENT_DATE - 1) + TIME '18:00', 'Hadir')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped absensi: %', SQLERRM;
END $$;

-- ── Competency — customs/cargo hard skills alongside standard soft skills
DO $$ BEGIN
INSERT INTO master_kompetensi (id, name, category, jenis_kompetensi, kode, deskripsi, status) VALUES
  ('demo-skill-lead',    'Leadership', 'Manajemen', 'Soft Skill', 'C001', 'Kemampuan memimpin dan mengarahkan tim.', 'Aktif'),
  ('demo-skill-comm',    'Komunikasi', 'Soft Skills', 'Soft Skill', 'C002', 'Kemampuan menyampaikan informasi secara jelas kepada klien maupun tim internal.', 'Aktif'),
  ('demo-skill-customs', 'Regulasi Kepabeanan (Customs Regulation)', 'Teknis', 'Hard Skill', 'C003', 'Pemahaman regulasi ekspor-impor, tarif bea masuk, dan prosedur PPJK.', 'Aktif'),
  ('demo-skill-cargo',   'Cargo Handling & Documentation', 'Teknis', 'Hard Skill', 'C004', 'Kemampuan menangani dan mendokumentasikan pergerakan cargo/muatan.', 'Aktif'),
  ('demo-skill-excel',   'Microsoft Excel', 'Teknis', 'Hard Skill', 'C005', 'Kemampuan mengolah data operasional dan laporan dengan Excel.', 'Aktif')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped master_kompetensi: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO kompetensi_jabatan (position_code, skill_id, required_level, jabatan_id) VALUES
  ('HR & GA Supervisor', 'demo-skill-lead', 4, 'demo-jab-hrspv'),
  ('HR & GA Supervisor', 'demo-skill-comm', 4, 'demo-jab-hrspv'),
  ('Staff PPJK (Kepabeanan)', 'demo-skill-customs', 4, 'demo-jab-ppjk'),
  ('Supervisor Gudang & Cargo', 'demo-skill-cargo', 4, 'demo-jab-gudang'),
  ('Supervisor Gudang & Cargo', 'demo-skill-lead', 3, 'demo-jab-gudang'),
  ('Operational Manager', 'demo-skill-lead', 5, 'demo-jab-opsmgr'),
  ('Operational Manager', 'demo-skill-customs', 4, 'demo-jab-opsmgr')
ON CONFLICT DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped kompetensi_jabatan: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO kompetensi_karyawan (id, employee_id, skill_id, current_level, assessed_by) VALUES
  ('demo-ek-01', 'demo-emp-02', 'demo-skill-lead', 3, 'hrd@ptpgp.co.id'),
  ('demo-ek-02', 'demo-emp-02', 'demo-skill-comm', 4, 'hrd@ptpgp.co.id'),
  ('demo-ek-03', 'demo-emp-04', 'demo-skill-customs', 3, 'hrd@ptpgp.co.id'),
  ('demo-ek-04', 'demo-emp-06', 'demo-skill-cargo', 4, 'hrd@ptpgp.co.id'),
  ('demo-ek-05', 'demo-emp-09', 'demo-skill-lead', 4, 'hrd@ptpgp.co.id'),
  ('demo-ek-06', 'demo-emp-09', 'demo-skill-customs', 4, 'hrd@ptpgp.co.id')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped kompetensi_karyawan: %', SQLERRM;
END $$;

-- ── Learning & Training
DO $$ BEGIN
INSERT INTO pelatihan (id, title, skill_id, description, date_start, date_end, status, department) VALUES
  ('demo-train-01', 'Regulasi Kepabeanan & Prosedur Ekspor-Impor Terbaru', 'demo-skill-customs', 'Update regulasi bea cukai dan prosedur PPJK terkini untuk staff operasional.', CURRENT_DATE + 7, CURRENT_DATE + 8, 'Planned', 'Operational Division'),
  ('demo-train-02', 'Leadership for Supervisor', 'demo-skill-lead', 'Pelatihan dasar kepemimpinan untuk supervisor.', CURRENT_DATE + 14, CURRENT_DATE + 15, 'Planned', 'HR & GA')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped pelatihan: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO peserta_pelatihan (id, training_id, employee_id, status) VALUES
  ('demo-pt-01', 'demo-train-01', 'demo-emp-04', 'Enrolled'),
  ('demo-pt-02', 'demo-train-01', 'demo-emp-09', 'Enrolled'),
  ('demo-pt-03', 'demo-train-02', 'demo-emp-02', 'Enrolled')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped peserta_pelatihan: %', SQLERRM;
END $$;

-- ── Knowledge Management — SOP relevant to freight forwarding operations
DO $$ BEGIN
INSERT INTO dokumen_sop (id, number, title, department, version, description, status) VALUES
  ('demo-sop-01', 'SOP-OPS001', 'SOP Penanganan Dokumen Ekspor-Impor', 'Operational Division', 'v1.0', 'Standar prosedur penerimaan, verifikasi, dan pengarsipan dokumen ekspor-impor pelanggan.', 'Aktif'),
  ('demo-sop-02', 'SOP-OPS002', 'SOP Custom Clearance & PPJK', 'Operational Division', 'v1.0', 'Standar prosedur pengurusan izin kepabeanan bersama Bea Cukai.', 'Aktif'),
  ('demo-sop-03', 'SOP-HR001', 'SOP Rekrutmen Karyawan', 'HR & GA', 'v1.0', 'Standar prosedur rekrutmen karyawan baru.', 'Aktif')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped dokumen_sop: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO kebijakan_perusahaan (id, title, department, description, status) VALUES
  ('demo-pol-01', 'Kebijakan Cuti Tahunan', 'HR & GA', 'Ketentuan pengajuan dan persetujuan cuti tahunan karyawan.', 'Published'),
  ('demo-pol-02', 'Kebijakan Keselamatan Kerja di Area Gudang & Bongkar Muat', 'Health, Safety & Environment', 'Ketentuan penggunaan APD dan prosedur keselamatan di area gudang dan cargo.', 'Published')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped kebijakan_perusahaan: %', SQLERRM;
END $$;

-- ── Performance Management
DO $$ BEGIN
INSERT INTO budaya_perusahaan (id, kode, nama, deskripsi, aktif, urutan, bobot_default) VALUES
  ('demo-budaya-01', 'C001', 'Integrity', 'Jujur dan berpegang pada etika kerja, termasuk dalam kepatuhan kepabeanan.', TRUE, 1, 30),
  ('demo-budaya-02', 'C002', 'Teamwork', 'Berkolaborasi secara efektif lintas fungsi (operasional, dokumen, gudang, armada).', TRUE, 2, 20),
  ('demo-budaya-03', 'C003', 'Customer Focus', 'Mengutamakan ketepatan waktu dan akurasi layanan bagi pelanggan.', TRUE, 3, 20)
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped budaya_perusahaan: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO performance_framework (id, jabatan_id, ta_weight_pct, culture_weight_pct, aktif) VALUES
  ('demo-pf-default', NULL, 70, 30, TRUE)
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped performance_framework: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO evaluasi_kpi (id, employee_id, period, score, status, evaluator_id) VALUES
  ('demo-kpi-01', 'demo-emp-02', to_char(CURRENT_DATE, 'MM/YYYY'), 92, 'Approved', 'hrd@ptpgp.co.id'),
  ('demo-kpi-02', 'demo-emp-09', to_char(CURRENT_DATE, 'MM/YYYY'), 88, 'Approved', 'hrd@ptpgp.co.id'),
  ('demo-kpi-03', 'demo-emp-04', to_char(CURRENT_DATE, 'MM/YYYY'), 85, 'Approved', 'hrd@ptpgp.co.id')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped evaluasi_kpi: %', SQLERRM;
END $$;

-- ── Reward & Recognition
DO $$ BEGIN
INSERT INTO struktur_gaji (id, employee_id, basic_salary, transport_allowance, meal_allowance, position_allowance, ptkp_status) VALUES
  ('demo-sal-01', 'demo-emp-01', 6500000, 500000, 400000, 0, 'TK/0'),
  ('demo-sal-02', 'demo-emp-02', 10500000, 800000, 500000, 1000000, 'K/1'),
  ('demo-sal-03', 'demo-emp-04', 8500000, 700000, 450000, 500000, 'TK/0'),
  ('demo-sal-04', 'demo-emp-09', 16000000, 1200000, 600000, 2000000, 'K/2')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped struktur_gaji: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO insentif (id, employee_id, program, amount, period, status, type) VALUES
  ('demo-inc-01', 'demo-emp-02', 'Bonus Kinerja Triwulan', 3000000, to_char(CURRENT_DATE, 'MM/YYYY'), 'Disetujui', 'bonus'),
  ('demo-inc-02', 'demo-emp-04', 'Insentif Target Custom Clearance', 1500000, to_char(CURRENT_DATE, 'MM/YYYY'), 'Disetujui', 'incentive')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped insentif: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO penghargaan_karyawan (id, employee_id, employee_name, department, category, description, award_date, given_by) VALUES
  ('demo-award-01', 'demo-emp-02', 'Budi Santoso', 'HR & GA', 'Employee of The Month', 'Kinerja dan kedisiplinan luar biasa bulan ini.', to_char(CURRENT_DATE, 'YYYY-MM'), 'HRD'),
  ('demo-award-02', 'demo-emp-04', 'Dewi Lestari', 'Operational Division', 'Best Attendance', 'Tingkat kehadiran dan ketepatan waktu terbaik.', to_char(CURRENT_DATE, 'YYYY-MM'), 'HRD')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped penghargaan_karyawan: %', SQLERRM;
END $$;

-- ── Career
DO $$ BEGIN
INSERT INTO promosi_karir (id, employee_id, from_position, to_position, from_department, to_department, effective_date, reason, status, requested_by) VALUES
  ('demo-promo-01', 'demo-emp-04', 'Staff PPJK (Kepabeanan)', 'Supervisor PPJK', 'Operational Division', 'Operational Division', CURRENT_DATE + 30, 'Kinerja konsisten baik dan penguasaan regulasi kepabeanan yang kuat selama 3 tahun.', 'Menunggu', 'hrd@ptpgp.co.id')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped promosi_karir: %', SQLERRM;
END $$;

-- ── Recruitment
DO $$ BEGIN
INSERT INTO lowongan_kerja (id, title, department, status, description) VALUES
  ('demo-job-01', 'Staff PPJK (Kepabeanan)', 'Operational Division', 'Open', 'Membutuhkan staff PPJK berpengalaman minimal 1 tahun di bidang kepabeanan dan ekspor-impor.'),
  ('demo-job-02', 'Staff Procurement', 'Procurement Division', 'Open', 'Membutuhkan staff procurement berpengalaman minimal 1 tahun.')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped lowongan_kerja: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO pelamar (id, job_id, full_name, email, status, applied_at) VALUES
  ('demo-app-01', 'demo-job-01', 'Farhan Maulana', 'farhan.maulana@example.com', 'Menunggu Review', NOW())
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped pelamar: %', SQLERRM;
END $$;
