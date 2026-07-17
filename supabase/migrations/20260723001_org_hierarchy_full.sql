-- ============================================================================
-- FULL ORGANIZATION HIERARCHY — Komisaris down to Staff, hierarchical codes
-- (1, 1.1, 1.1.1, 1.1.1.1, 1.1.1.1.1 style) matching PT Pratama Galuh
-- Perkasa's freight-forwarding / customs brokerage (PPJK) business.
--
-- Purely ADDITIVE (INSERT ... ON CONFLICT DO NOTHING) — safe to run on top
-- of the existing 20260720002_seed_dummy_data.sql seed, does not truncate
-- or modify anything. Extends the existing 7-department unit_organisasi /
-- jabatan / grade_jabatan chain with the missing top-of-house layer
-- (Komisaris, Direktur Utama, Direktur per fungsi) and a full per-department
-- ladder down to Staff, each with a real formasi_jabatan + karyawan record
-- so headcount, org chart, and reporting-line pages all have real numbers.
--
-- Code scheme (jabatan.code):
--   1              Komisaris
--   1.1            Direktur Utama
--   1.1.N          Direktur per fungsi (N = 1..7, one per department)
--   1.1.N.1        General Manager per departemen
--   1.1.N.1.1      Manager per departemen
--   1.1.N.1.1.1    Supervisor per departemen
--   1.1.N.1.1.1.1  Staff per departemen
-- ============================================================================

-- Grades above Manager (G08) didn't exist yet — G09 Direktur up to G12 Komisaris.
DO $$ BEGIN
INSERT INTO grade_jabatan (id, kode, nama, urutan, salary_min, salary_max) VALUES
  ('demo-grade-g09', 'G09', 'General Manager', 9,  20000000, 28000000),
  ('demo-grade-g10', 'G10', 'Direktur',        10, 35000000, 55000000),
  ('demo-grade-g11', 'G11', 'Direktur Utama',  11, 60000000, 90000000),
  ('demo-grade-g12', 'G12', 'Komisaris',       12, 75000000, 110000000)
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped grade_jabatan (hierarchy): %', SQLERRM;
END $$;

-- Top-of-house jabatan: Komisaris, Direktur Utama, and one Direktur per
-- department/fungsi — these sit at the holding unit, not inside a single
-- department, since they oversee the whole company.
DO $$ BEGIN
INSERT INTO jabatan (id, code, name, department, level, grade_id) VALUES
  ('demo-jab-komisaris', '1',     'Komisaris',                          'Holding', 'Komisaris',     'demo-grade-g12'),
  ('demo-jab-dirut',     '1.1',   'Direktur Utama',                     'Holding', 'Direktur Utama','demo-grade-g11'),
  ('demo-jab-dir-hr',    '1.1.1', 'Direktur HR & GA',                   'HR & GA', 'Direktur',       'demo-grade-g10'),
  ('demo-jab-dir-fin',   '1.1.2', 'Direktur Finance',                   'Finance', 'Direktur',       'demo-grade-g10'),
  ('demo-jab-dir-ops',   '1.1.3', 'Direktur Operasional',               'Operational Division', 'Direktur', 'demo-grade-g10'),
  ('demo-jab-dir-proc',  '1.1.4', 'Direktur Procurement',               'Procurement Division', 'Direktur', 'demo-grade-g10'),
  ('demo-jab-dir-pa',    '1.1.5', 'Direktur Project Appraisal',         'Project Appraisal', 'Direktur', 'demo-grade-g10'),
  ('demo-jab-dir-mr',    '1.1.6', 'Direktur Management Representative', 'Management Representative', 'Direktur', 'demo-grade-g10'),
  ('demo-jab-dir-hse',   '1.1.7', 'Direktur HSE',                       'Health, Safety & Environment', 'Direktur', 'demo-grade-g10')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped jabatan (top-of-house): %', SQLERRM;
END $$;

-- Full per-department ladder: General Manager -> Manager -> Supervisor ->
-- Staff, each with a hierarchical code nested under its Direktur, and
-- freight-forwarding-specific titles at the operational levels.
DO $$ BEGIN
INSERT INTO jabatan (id, code, name, department, level, grade_id) VALUES
  -- HR & GA (1.1.1.x)
  ('demo-jab-gm-hr',    '1.1.1.1',   'General Manager HR & GA',        'HR & GA', 'General Manager', 'demo-grade-g09'),
  ('demo-jab-mgr-hr',   '1.1.1.1.1', 'Manager HR & GA',                'HR & GA', 'Manager',          'demo-grade-g08'),

  -- Finance (1.1.2.x)
  ('demo-jab-gm-fin',   '1.1.2.1',   'General Manager Finance',        'Finance', 'General Manager', 'demo-grade-g09'),
  ('demo-jab-mgr-fin',  '1.1.2.1.1', 'Manager Finance & Accounting',   'Finance', 'Manager',          'demo-grade-g08'),

  -- Operational Division (1.1.3.x) — freight-forwarding core
  ('demo-jab-gm-ops',   '1.1.3.1',     'General Manager Operasional',        'Operational Division', 'General Manager', 'demo-grade-g09'),
  ('demo-jab-mgr-ppjk', '1.1.3.1.1',   'Manager Kepabeanan (PPJK)',          'Operational Division', 'Manager',          'demo-grade-g08'),
  ('demo-jab-mgr-gudang','1.1.3.1.2',  'Manager Gudang & Cargo',             'Operational Division', 'Manager',          'demo-grade-g08'),
  ('demo-jab-mgr-armada','1.1.3.1.3',  'Manager Armada & Trucking',          'Operational Division', 'Manager',          'demo-grade-g08'),

  -- Procurement (1.1.4.x)
  ('demo-jab-gm-proc',  '1.1.4.1',   'General Manager Procurement',    'Procurement Division', 'General Manager', 'demo-grade-g09'),
  ('demo-jab-mgr-proc', '1.1.4.1.1', 'Manager Procurement',            'Procurement Division', 'Manager',          'demo-grade-g08'),

  -- Project Appraisal (1.1.5.x)
  ('demo-jab-gm-pa',    '1.1.5.1',   'General Manager Project Appraisal','Project Appraisal', 'General Manager', 'demo-grade-g09'),

  -- Management Representative (1.1.6.x)
  ('demo-jab-gm-mr',    '1.1.6.1',   'General Manager Management Representative', 'Management Representative', 'General Manager', 'demo-grade-g09'),

  -- HSE (1.1.7.x)
  ('demo-jab-gm-hse',   '1.1.7.1',   'General Manager HSE',            'Health, Safety & Environment', 'General Manager', 'demo-grade-g09')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped jabatan (management ladder): %', SQLERRM;
END $$;

-- Supervisor + Staff layer, freight-forwarding specific where relevant —
-- nested under each department's Manager code.
DO $$ BEGIN
INSERT INTO jabatan (id, code, name, department, level, grade_id) VALUES
  -- HR & GA
  ('demo-jab-spv-hr2',   '1.1.1.1.1.1',   'Supervisor HR & GA',                'HR & GA', 'Supervisor', 'demo-grade-g07'),
  ('demo-jab-staff-hr2', '1.1.1.1.1.1.1', 'Staff HR & GA',                     'HR & GA', 'Staff',      'demo-grade-g05'),

  -- Finance
  ('demo-jab-spv-fin2',   '1.1.2.1.1.1',   'Supervisor Finance & Accounting',  'Finance', 'Supervisor', 'demo-grade-g07'),
  ('demo-jab-staff-fin2', '1.1.2.1.1.1.1', 'Staff Finance & Accounting',       'Finance', 'Staff',      'demo-grade-g05'),

  -- Operational — PPJK line
  ('demo-jab-spv-ppjk2',  '1.1.3.1.1.1',   'Supervisor Kepabeanan (PPJK)',     'Operational Division', 'Supervisor', 'demo-grade-g07'),
  ('demo-jab-staff-ppjk2','1.1.3.1.1.1.1', 'Staff PPJK (Kepabeanan)',          'Operational Division', 'Staff',      'demo-grade-g06'),
  ('demo-jab-staff-dok2', '1.1.3.1.1.1.2', 'Staff Dokumentasi Ekspor-Impor',   'Operational Division', 'Staff',      'demo-grade-g05'),

  -- Operational — Gudang & Cargo line
  ('demo-jab-spv-gudang2','1.1.3.1.2.1',   'Supervisor Gudang & Cargo',        'Operational Division', 'Supervisor', 'demo-grade-g07'),
  ('demo-jab-staff-gudang2','1.1.3.1.2.2', 'Staff Gudang & Cargo',             'Operational Division', 'Staff',      'demo-grade-g05'),

  -- Operational — Armada & Trucking line
  ('demo-jab-spv-armada2','1.1.3.1.3.1',   'Koordinator Armada & Trucking',    'Operational Division', 'Supervisor', 'demo-grade-g07'),
  ('demo-jab-staff-cs2',  '1.1.3.1.3.2',   'Customer Service Ekspor-Impor',    'Operational Division', 'Staff',      'demo-grade-g05'),

  -- Procurement
  ('demo-jab-staff-proc2','1.1.4.1.1.1',   'Staff Procurement',                'Procurement Division', 'Staff', 'demo-grade-g05'),

  -- Project Appraisal
  ('demo-jab-staff-pa2',  '1.1.5.1.1',     'Project Appraisal Analyst',        'Project Appraisal', 'Staff', 'demo-grade-g06'),

  -- Management Representative
  ('demo-jab-staff-mr2',  '1.1.6.1.1',     'Management Representative Coordinator', 'Management Representative', 'Supervisor', 'demo-grade-g07'),

  -- HSE
  ('demo-jab-staff-hse2', '1.1.7.1.1',     'HSE Officer',                      'Health, Safety & Environment', 'Staff', 'demo-grade-g05')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped jabatan (supervisor/staff): %', SQLERRM;
END $$;

-- Formasi (position numbers) for every new jabatan above, all pointing at
-- the department's existing unit_organisasi row (the top-of-house 3 sit at
-- the holding unit). Marked Filled so headcount/org-chart pages show real
-- numbers, not empty formations.
DO $$ BEGIN
INSERT INTO formasi_jabatan (id, position_number, unit_organisasi_id, jabatan_id, status) VALUES
  ('demo-formasi-komisaris', 'PN-EXE-001', 'demo-unit-hold', 'demo-jab-komisaris', 'Filled'),
  ('demo-formasi-dirut',     'PN-EXE-002', 'demo-unit-hold', 'demo-jab-dirut',     'Filled'),
  ('demo-formasi-dir-hr',    'PN-EXE-003', 'demo-unit-hr',   'demo-jab-dir-hr',    'Filled'),
  ('demo-formasi-dir-fin',   'PN-EXE-004', 'demo-unit-fin',  'demo-jab-dir-fin',   'Filled'),
  ('demo-formasi-dir-ops',   'PN-EXE-005', 'demo-unit-ops',  'demo-jab-dir-ops',   'Filled'),
  ('demo-formasi-dir-proc',  'PN-EXE-006', 'demo-unit-proc', 'demo-jab-dir-proc',  'Filled'),
  ('demo-formasi-dir-pa',    'PN-EXE-007', 'demo-unit-pa',   'demo-jab-dir-pa',    'Filled'),
  ('demo-formasi-dir-mr',    'PN-EXE-008', 'demo-unit-mr',   'demo-jab-dir-mr',    'Filled'),
  ('demo-formasi-dir-hse',   'PN-EXE-009', 'demo-unit-hse',  'demo-jab-dir-hse',   'Filled'),

  ('demo-formasi-gm-hr',     'PN-HR-101',  'demo-unit-hr',   'demo-jab-gm-hr',     'Filled'),
  ('demo-formasi-mgr-hr',    'PN-HR-102',  'demo-unit-hr',   'demo-jab-mgr-hr',    'Filled'),
  ('demo-formasi-spv-hr2',   'PN-HR-103',  'demo-unit-hr',   'demo-jab-spv-hr2',   'Filled'),
  ('demo-formasi-staff-hr2', 'PN-HR-104',  'demo-unit-hr',   'demo-jab-staff-hr2', 'Filled'),

  ('demo-formasi-gm-fin',    'PN-FIN-101', 'demo-unit-fin',  'demo-jab-gm-fin',    'Filled'),
  ('demo-formasi-mgr-fin',   'PN-FIN-102', 'demo-unit-fin',  'demo-jab-mgr-fin',   'Filled'),
  ('demo-formasi-spv-fin2',  'PN-FIN-103', 'demo-unit-fin',  'demo-jab-spv-fin2',  'Filled'),
  ('demo-formasi-staff-fin2','PN-FIN-104', 'demo-unit-fin',  'demo-jab-staff-fin2','Filled'),

  ('demo-formasi-gm-ops',       'PN-OPS-101', 'demo-unit-ops', 'demo-jab-gm-ops',       'Filled'),
  ('demo-formasi-mgr-ppjk',     'PN-OPS-102', 'demo-unit-ops', 'demo-jab-mgr-ppjk',     'Filled'),
  ('demo-formasi-spv-ppjk2',    'PN-OPS-103', 'demo-unit-ops', 'demo-jab-spv-ppjk2',    'Filled'),
  ('demo-formasi-staff-ppjk2',  'PN-OPS-104', 'demo-unit-ops', 'demo-jab-staff-ppjk2',  'Filled'),
  ('demo-formasi-staff-dok2',   'PN-OPS-105', 'demo-unit-ops', 'demo-jab-staff-dok2',   'Filled'),
  ('demo-formasi-mgr-gudang',   'PN-OPS-106', 'demo-unit-ops', 'demo-jab-mgr-gudang',   'Filled'),
  ('demo-formasi-spv-gudang2',  'PN-OPS-107', 'demo-unit-ops', 'demo-jab-spv-gudang2',  'Filled'),
  ('demo-formasi-staff-gudang2','PN-OPS-108', 'demo-unit-ops', 'demo-jab-staff-gudang2','Filled'),
  ('demo-formasi-mgr-armada',   'PN-OPS-109', 'demo-unit-ops', 'demo-jab-mgr-armada',   'Filled'),
  ('demo-formasi-spv-armada2',  'PN-OPS-110', 'demo-unit-ops', 'demo-jab-spv-armada2',  'Filled'),
  ('demo-formasi-staff-cs2',    'PN-OPS-111', 'demo-unit-ops', 'demo-jab-staff-cs2',    'Filled'),

  ('demo-formasi-gm-proc',     'PN-PRC-101', 'demo-unit-proc', 'demo-jab-gm-proc',     'Filled'),
  ('demo-formasi-mgr-proc',    'PN-PRC-102', 'demo-unit-proc', 'demo-jab-mgr-proc',    'Filled'),
  ('demo-formasi-staff-proc2', 'PN-PRC-103', 'demo-unit-proc', 'demo-jab-staff-proc2', 'Vacant'),

  ('demo-formasi-gm-pa',       'PN-PA-101',  'demo-unit-pa',   'demo-jab-gm-pa',       'Filled'),
  ('demo-formasi-staff-pa2',   'PN-PA-102',  'demo-unit-pa',   'demo-jab-staff-pa2',   'Filled'),

  ('demo-formasi-gm-mr',       'PN-MR-101',  'demo-unit-mr',   'demo-jab-gm-mr',       'Filled'),
  ('demo-formasi-staff-mr2',   'PN-MR-102',  'demo-unit-mr',   'demo-jab-staff-mr2',   'Filled'),

  ('demo-formasi-gm-hse',      'PN-HSE-101', 'demo-unit-hse',  'demo-jab-gm-hse',      'Filled'),
  ('demo-formasi-staff-hse2',  'PN-HSE-102', 'demo-unit-hse',  'demo-jab-staff-hse2',  'Vacant')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped formasi_jabatan (hierarchy): %', SQLERRM;
END $$;

-- Karyawan + login accounts for the new top-of-house and management-ladder
-- positions, so the org chart shows real people, not just vacant formations.
DO $$ BEGIN
INSERT INTO karyawan (id, full_name, email, department, position, status, formasi_id, join_date, phone) VALUES
  ('demo-emp-komisaris','H. Bambang Sutrisno', 'komisaris@ptpgp.co.id', 'Holding', 'Komisaris', 'Active', 'demo-formasi-komisaris', '2015-01-05', '081300000001'),
  ('demo-emp-dirut',    'Ir. Ahmad Faisal',    'dirut@ptpgp.co.id',     'Holding', 'Direktur Utama', 'Active', 'demo-formasi-dirut', '2016-03-10', '081300000002'),
  ('demo-emp-dir-hr',   'Dra. Ratna Kusumawati','dir.hr@ptpgp.co.id',  'HR & GA', 'Direktur HR & GA', 'Active', 'demo-formasi-dir-hr', '2017-02-01', '081300000003'),
  ('demo-emp-dir-fin',  'Drs. Setiawan Halim', 'dir.finance@ptpgp.co.id','Finance','Direktur Finance', 'Active', 'demo-formasi-dir-fin', '2017-04-15', '081300000004'),
  ('demo-emp-dir-ops',  'Ir. Bayu Kristanto',  'dir.ops@ptpgp.co.id',  'Operational Division', 'Direktur Operasional', 'Active', 'demo-formasi-dir-ops', '2016-08-20', '081300000005'),
  ('demo-emp-gm-ops',   'Dedi Kurniawan',      'gm.ops@ptpgp.co.id',   'Operational Division', 'General Manager Operasional', 'Active', 'demo-formasi-gm-ops', '2018-01-10', '081300000006'),
  ('demo-emp-mgr-ppjk', 'Wawan Setiadi',       'mgr.ppjk@ptpgp.co.id', 'Operational Division', 'Manager Kepabeanan (PPJK)', 'Active', 'demo-formasi-mgr-ppjk', '2019-02-18', '081300000007'),
  ('demo-emp-spv-ppjk', 'Eko Prasetyo',        'spv.ppjk@ptpgp.co.id', 'Operational Division', 'Supervisor Kepabeanan (PPJK)', 'Active', 'demo-formasi-spv-ppjk2', '2020-05-11', '081300000008'),
  ('demo-emp-staff-ppjk','Dian Anggraini',     'staff.ppjk@ptpgp.co.id','Operational Division', 'Staff PPJK (Kepabeanan)', 'Active', 'demo-formasi-staff-ppjk2', '2022-03-07', '081300000009'),
  ('demo-emp-mgr-gudang','Slamet Riyadi',      'mgr.gudang@ptpgp.co.id','Operational Division', 'Manager Gudang & Cargo', 'Active', 'demo-formasi-mgr-gudang', '2019-06-25', '081300000010'),
  ('demo-emp-mgr-armada','Joko Susilo',        'mgr.armada@ptpgp.co.id','Operational Division', 'Manager Armada & Trucking', 'Active', 'demo-formasi-mgr-armada', '2019-09-14', '081300000011'),
  ('demo-emp-gm-hr',    'Fitriani Handayani',  'gm.hr@ptpgp.co.id',    'HR & GA', 'General Manager HR & GA', 'Active', 'demo-formasi-gm-hr', '2018-04-02', '081300000012'),
  ('demo-emp-mgr-hr',   'Rudi Hartanto',       'mgr.hr@ptpgp.co.id',   'HR & GA', 'Manager HR & GA', 'Active', 'demo-formasi-mgr-hr', '2020-01-20', '081300000013'),
  ('demo-emp-gm-fin',   'Lina Marlina',        'gm.finance@ptpgp.co.id','Finance', 'General Manager Finance', 'Active', 'demo-formasi-gm-fin', '2018-07-09', '081300000014'),
  ('demo-emp-mgr-fin',  'Hendro Wibowo',       'mgr.finance@ptpgp.co.id','Finance', 'Manager Finance & Accounting', 'Active', 'demo-formasi-mgr-fin', '2020-03-16', '081300000015')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped karyawan (hierarchy): %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO pengguna (email, password_hash, role, full_name) VALUES
  ('komisaris@ptpgp.co.id', '7b3ff040d72943093ea8236f741734e3:ec2de86b8187131c927dc22dcc12209750e06cb8185c6a179d905e8c9eadad16d4bd2ff02cdc42e7ba1500bae614bb6153c90a1636442a11043a8eba05171a93', 'director', 'H. Bambang Sutrisno'),
  ('dirut@ptpgp.co.id', '7b3ff040d72943093ea8236f741734e3:ec2de86b8187131c927dc22dcc12209750e06cb8185c6a179d905e8c9eadad16d4bd2ff02cdc42e7ba1500bae614bb6153c90a1636442a11043a8eba05171a93', 'director', 'Ir. Ahmad Faisal')
ON CONFLICT (email) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped pengguna (hierarchy): %', SQLERRM;
END $$;
