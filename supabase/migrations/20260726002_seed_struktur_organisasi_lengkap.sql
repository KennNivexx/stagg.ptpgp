-- ============================================================================
-- SEED DATA STRUKTUR ORGANISASI LENGKAP — Komisaris s/d Staff
-- 7-segment hierarchical kode_jabatan: 1.0.0.0.0.0.0 s/d 1.1.1.1.1.1.1
-- Includes unit_organisasi, jabatan, formasi_jabatan, karyawan, pengguna
-- ============================================================================

-- 0. SCHEMA PATCH — columns this script needs that don't exist yet on the
-- live tables (this is what caused the "column status does not exist" error
-- and would have caused 3 more of the same further down the script).
ALTER TABLE unit_organisasi ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Aktif';
ALTER TABLE unit_organisasi ADD COLUMN IF NOT EXISTS jenis_unit TEXT;
ALTER TABLE jabatan ADD COLUMN IF NOT EXISTS parent_code TEXT;
ALTER TABLE karyawan ADD COLUMN IF NOT EXISTS kode_jabatan TEXT;

-- 1. CLEAR existing demo data to avoid conflicts (safe — uses ON CONFLICT)
-- Existing good data keept, only demo-* prefixed rows are refreshed.

-- 2. UNIT ORGANISASI (Holding + 7 Divisions)
DO $$ BEGIN
INSERT INTO unit_organisasi (id, code, name, level, parent_code, sort_order, jenis_unit, status) VALUES
  ('unit-hold', '1.0.0.0.0.0.0', 'PT Pratama Galuh Perkasa (Holding)',                0, NULL,            0, 'Perusahaan', 'Aktif'),
  ('unit-hr',   '1.1.0.0.0.0.0', 'Divisi HR & GA (Human Resources & General Affairs)', 1, '1.0.0.0.0.0.0', 1, 'Divisi',     'Aktif'),
  ('unit-fin',  '1.2.0.0.0.0.0', 'Divisi Finance & Accounting',                        1, '1.0.0.0.0.0.0', 2, 'Divisi',     'Aktif'),
  ('unit-ops',  '1.3.0.0.0.0.0', 'Divisi Operasional',                                 1, '1.0.0.0.0.0.0', 3, 'Divisi',     'Aktif'),
  ('unit-proc', '1.4.0.0.0.0.0', 'Divisi SCM (Supply Chain Management) / Procurement', 1, '1.0.0.0.0.0.0', 4, 'Divisi',     'Aktif'),
  ('unit-pa',   '1.5.0.0.0.0.0', 'Divisi Project Appraisal & QC',                      1, '1.0.0.0.0.0.0', 5, 'Divisi',     'Aktif'),
  ('unit-mr',   '1.6.0.0.0.0.0', 'Divisi Management Representative (MR)',               1, '1.0.0.0.0.0.0', 6, 'Divisi',     'Aktif'),
  ('unit-hse',  '1.7.0.0.0.0.0', 'Divisi Health, Safety & Environment (HSE)',           1, '1.0.0.0.0.0.0', 7, 'Divisi',     'Aktif')
ON CONFLICT (id) DO UPDATE SET code = EXCLUDED.code, name = EXCLUDED.name, level = EXCLUDED.level,
  parent_code = EXCLUDED.parent_code, sort_order = EXCLUDED.sort_order, jenis_unit = EXCLUDED.jenis_unit, status = EXCLUDED.status;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped unit_organisasi: %', SQLERRM;
END $$;

-- 3. GRADE JABATAN (G01 - G12)
DO $$ BEGIN
INSERT INTO grade_jabatan (id, kode, nama, urutan, salary_min, salary_max) VALUES
  ('grade-g01', 'G01', 'Staf Junior',      1,   4500000,  5500000),
  ('grade-g02', 'G02', 'Staf Madya',       2,   5500000,  7000000),
  ('grade-g03', 'G03', 'Staf Senior',      3,   6500000,  8500000),
  ('grade-g04', 'G04', 'Koordinator',      4,   8000000, 10000000),
  ('grade-g05', 'G05', 'Supervisor',       5,  10000000, 13000000),
  ('grade-g06', 'G06', 'Asisten Manajer',  6,  12000000, 16000000),
  ('grade-g07', 'G07', 'Manager',          7,  15000000, 20000000),
  ('grade-g08', 'G08', 'Senior Manager',   8,  18000000, 25000000),
  ('grade-g09', 'G09', 'General Manager',  9,  20000000, 28000000),
  ('grade-g10', 'G10', 'Direktur',        10, 35000000, 55000000),
  ('grade-g11', 'G11', 'Direktur Utama',  11, 60000000, 90000000),
  ('grade-g12', 'G12', 'Komisaris',       12, 75000000, 110000000)
ON CONFLICT (id) DO UPDATE SET nama = EXCLUDED.nama, urutan = EXCLUDED.urutan,
  salary_min = EXCLUDED.salary_min, salary_max = EXCLUDED.salary_max;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped grade_jabatan: %', SQLERRM;
END $$;

-- 4. JABATAN MASTER — 7-segment hierarchical codes
-- Format: X.X.X.X.X.X.X where each X is a position number
-- 1st segment = Company root
-- 2nd = Division (1=HR, 2=Finance, 3=Operations, 4=Procurement, 5=PA, 6=MR, 7=HSE)
-- 3rd = Sub-division layer (1=core dept, 2=sub-unit)
-- 4th = Management layer (1=GM, 2=Manager)
-- 5th = Supervisor layer
-- 6th = Staff batch
-- 7th = Individual staff position

DO $$ BEGIN
INSERT INTO jabatan (id, code, name, department, level, grade_id, is_kepala_unit, is_master, status, parent_code) VALUES
  -- TOP OF HOUSE
  ('jab-komisaris',  '1.0.0.0.0.0.0', 'Komisaris',                          'Holding',                      'Komisaris',        'grade-g12', true,  true, 'Aktif', NULL),
  ('jab-dirut',      '1.1.0.0.0.0.0', 'Direktur Utama',                     'Holding',                      'Direktur Utama',   'grade-g11', true,  true, 'Aktif', '1.0.0.0.0.0.0'),

  -- DIREKTUR PER DIVISI
  ('jab-dir-hr',     '1.1.1.0.0.0.0', 'Direktur HR & GA',                   'Divisi HR & GA',               'Direktur',         'grade-g10', true,  true, 'Aktif', '1.1.0.0.0.0.0'),
  ('jab-dir-fin',    '1.2.1.0.0.0.0', 'Direktur Finance',                   'Divisi Finance & Accounting',   'Direktur',         'grade-g10', true,  true, 'Aktif', '1.2.0.0.0.0.0'),
  ('jab-dir-ops',    '1.3.1.0.0.0.0', 'Direktur Operasional',               'Divisi Operasional',            'Direktur',         'grade-g10', true,  true, 'Aktif', '1.3.0.0.0.0.0'),
  ('jab-dir-proc',   '1.4.1.0.0.0.0', 'Direktur SCM / Procurement',         'Divisi SCM / Procurement',      'Direktur',         'grade-g10', true,  true, 'Aktif', '1.4.0.0.0.0.0'),
  ('jab-dir-pa',     '1.5.1.0.0.0.0', 'Direktur Project Appraisal & QC',    'Divisi Project Appraisal & QC', 'Direktur',         'grade-g10', true,  true, 'Aktif', '1.5.0.0.0.0.0'),
  ('jab-dir-mr',     '1.6.1.0.0.0.0', 'Direktur Management Representative', 'Divisi MR',                     'Direktur',         'grade-g10', true,  true, 'Aktif', '1.6.0.0.0.0.0'),
  ('jab-dir-hse',    '1.7.1.0.0.0.0', 'Direktur HSE',                       'Divisi HSE',                    'Direktur',         'grade-g10', true,  true, 'Aktif', '1.7.0.0.0.0.0'),

  -- ─ HR & GA (1.1.1.x.x.x.x) ─
  ('jab-gm-hr',      '1.1.1.1.0.0.0', 'General Manager HR & GA',            'Divisi HR & GA',               'General Manager',  'grade-g09', true,  true, 'Aktif', '1.1.1.0.0.0.0'),
  ('jab-mgr-hr',     '1.1.1.1.1.0.0', 'Manager HR & GA',                    'Divisi HR & GA',               'Manager',          'grade-g07', true,  true, 'Aktif', '1.1.1.1.0.0.0'),
  ('jab-spv-hr',     '1.1.1.1.1.1.0', 'Supervisor HR & GA',                  'Divisi HR & GA',               'Supervisor',       'grade-g05', false, true, 'Aktif', '1.1.1.1.1.0.0'),
  ('jab-staff-hr-1', '1.1.1.1.1.1.1', 'Staff HRD (Rekrutmen)',               'Divisi HR & GA',               'Staff',            'grade-g02', false, true, 'Aktif', '1.1.1.1.1.1.0'),
  ('jab-staff-hr-2', '1.1.1.1.1.1.2', 'Staff HRD (Payroll & Adm)',           'Divisi HR & GA',               'Staff',            'grade-g02', false, true, 'Aktif', '1.1.1.1.1.1.0'),
  ('jab-staff-ga',   '1.1.1.1.1.1.3', 'Staff General Affairs (GA)',          'Divisi HR & GA',               'Staff',            'grade-g01', false, true, 'Aktif', '1.1.1.1.1.1.0'),

  -- ─ FINANCE (1.2.1.x.x.x.x) ─
  ('jab-gm-fin',     '1.2.1.1.0.0.0', 'General Manager Finance',            'Divisi Finance & Accounting',   'General Manager',  'grade-g09', true,  true, 'Aktif', '1.2.1.0.0.0.0'),
  ('jab-mgr-fin',    '1.2.1.1.1.0.0', 'Manager Finance & Accounting',       'Divisi Finance & Accounting',   'Manager',          'grade-g07', true,  true, 'Aktif', '1.2.1.1.0.0.0'),
  ('jab-spv-fin',    '1.2.1.1.1.1.0', 'Supervisor Finance',                  'Divisi Finance & Accounting',   'Supervisor',       'grade-g05', false, true, 'Aktif', '1.2.1.1.1.0.0'),
  ('jab-staff-fin-1','1.2.1.1.1.1.1', 'Staff Accounting',                    'Divisi Finance & Accounting',   'Staff',            'grade-g03', false, true, 'Aktif', '1.2.1.1.1.1.0'),
  ('jab-staff-fin-2','1.2.1.1.1.1.2', 'Staff Finance (AP/AR)',               'Divisi Finance & Accounting',   'Staff',            'grade-g02', false, true, 'Aktif', '1.2.1.1.1.1.0'),
  ('jab-staff-tax',  '1.2.1.1.1.1.3', 'Staff Tax & Compliance',              'Divisi Finance & Accounting',   'Staff',            'grade-g03', false, true, 'Aktif', '1.2.1.1.1.1.0'),

  -- ─ OPERASIONAL (1.3.1.x.x.x.x) ─
  ('jab-gm-ops',     '1.3.1.1.0.0.0', 'General Manager Operasional',        'Divisi Operasional',            'General Manager',  'grade-g09', true,  true, 'Aktif', '1.3.1.0.0.0.0'),
  ('jab-mgr-ppjk',   '1.3.1.1.1.0.0', 'Manager Kepabeanan (PPJK)',          'Divisi Operasional',            'Manager',          'grade-g07', true,  true, 'Aktif', '1.3.1.1.0.0.0'),
  ('jab-spv-ppjk',   '1.3.1.1.1.1.0', 'Supervisor Kepabeanan (PPJK)',       'Divisi Operasional',            'Supervisor',       'grade-g05', false, true, 'Aktif', '1.3.1.1.1.0.0'),
  ('jab-staff-ppjk-1','1.3.1.1.1.1.1','Staff PPJK (PIB/PEB)',               'Divisi Operasional',            'Staff',            'grade-g03', false, true, 'Aktif', '1.3.1.1.1.1.0'),
  ('jab-staff-ppjk-2','1.3.1.1.1.1.2','Staff PPJK (Dokumentasi)',           'Divisi Operasional',            'Staff',            'grade-g02', false, true, 'Aktif', '1.3.1.1.1.1.0'),
  ('jab-mgr-gudang', '1.3.1.2.0.0.0', 'Manager Gudang & Cargo',             'Divisi Operasional',            'Manager',          'grade-g07', true,  true, 'Aktif', '1.3.1.1.0.0.0'),
  ('jab-spv-gudang', '1.3.1.2.1.0.0', 'Supervisor Gudang & Cargo',          'Divisi Operasional',            'Supervisor',       'grade-g05', false, true, 'Aktif', '1.3.1.2.0.0.0'),
  ('jab-staff-gudang-1','1.3.1.2.1.1.1','Staff Gudang (Bongkar Muat)',      'Divisi Operasional',            'Staff',            'grade-g01', false, true, 'Aktif', '1.3.1.2.1.0.0'),
  ('jab-staff-gudang-2','1.3.1.2.1.1.2','Staff Administrasi Gudang',        'Divisi Operasional',            'Staff',            'grade-g01', false, true, 'Aktif', '1.3.1.2.1.0.0'),
  ('jab-mgr-armada', '1.3.1.3.0.0.0', 'Manager Armada & Trucking',          'Divisi Operasional',            'Manager',          'grade-g07', true,  true, 'Aktif', '1.3.1.1.0.0.0'),
  ('jab-spv-armada', '1.3.1.3.1.0.0', 'Koordinator Armada',                  'Divisi Operasional',            'Supervisor',       'grade-g05', false, true, 'Aktif', '1.3.1.3.0.0.0'),
  ('jab-supir-1',    '1.3.1.3.1.1.1', 'Supir Truk / Driver',                'Divisi Operasional',            'Supir',            'grade-g01', false, true, 'Aktif', '1.3.1.3.1.0.0'),
  ('jab-supir-2',    '1.3.1.3.1.1.2', 'Supir Truk / Driver',                'Divisi Operasional',            'Supir',            'grade-g01', false, true, 'Aktif', '1.3.1.3.1.0.0'),
  ('jab-supir-3',    '1.3.1.3.1.1.3', 'Supir Truk / Driver',                'Divisi Operasional',            'Supir',            'grade-g01', false, true, 'Aktif', '1.3.1.3.1.0.0'),
  ('jab-cs-ops',     '1.3.1.3.1.1.4', 'Customer Service Ekspor-Impor',      'Divisi Operasional',            'Staff',            'grade-g02', false, true, 'Aktif', '1.3.1.3.1.0.0'),

  -- ─ PROCUREMENT / SCM (1.4.1.x.x.x.x) ─
  ('jab-gm-proc',    '1.4.1.1.0.0.0', 'General Manager SCM / Procurement',  'Divisi SCM / Procurement',      'General Manager',  'grade-g09', true,  true, 'Aktif', '1.4.1.0.0.0.0'),
  ('jab-mgr-proc',   '1.4.1.1.1.0.0', 'Manager Procurement',                'Divisi SCM / Procurement',      'Manager',          'grade-g07', true,  true, 'Aktif', '1.4.1.1.0.0.0'),
  ('jab-spv-proc',   '1.4.1.1.1.1.0', 'Supervisor Procurement',              'Divisi SCM / Procurement',      'Supervisor',       'grade-g05', false, true, 'Aktif', '1.4.1.1.1.0.0'),
  ('jab-staff-proc-1','1.4.1.1.1.1.1','Staff Procurement (Sourcing)',        'Divisi SCM / Procurement',      'Staff',            'grade-g03', false, true, 'Aktif', '1.4.1.1.1.1.0'),
  ('jab-staff-proc-2','1.4.1.1.1.1.2','Staff Procurement (PO)',              'Divisi SCM / Procurement',      'Staff',            'grade-g02', false, true, 'Aktif', '1.4.1.1.1.1.0'),

  -- ─ PROJECT APPRAISAL & QC (1.5.1.x.x.x.x) ─
  ('jab-gm-pa',      '1.5.1.1.0.0.0', 'General Manager Project Appraisal',  'Divisi Project Appraisal & QC', 'General Manager',  'grade-g09', true,  true, 'Aktif', '1.5.1.0.0.0.0'),
  ('jab-mgr-qc',     '1.5.1.1.1.0.0', 'Manager Quality Control (QC)',       'Divisi Project Appraisal & QC', 'Manager',          'grade-g07', true,  true, 'Aktif', '1.5.1.1.0.0.0'),
  ('jab-staff-pa-1', '1.5.1.1.1.1.1', 'Project Appraisal Analyst',          'Divisi Project Appraisal & QC', 'Staff',            'grade-g03', false, true, 'Aktif', '1.5.1.1.1.0.0'),
  ('jab-staff-pa-2', '1.5.1.1.1.1.2', 'QC Inspector',                       'Divisi Project Appraisal & QC', 'Staff',            'grade-g02', false, true, 'Aktif', '1.5.1.1.1.0.0'),

  -- ─ MANAGEMENT REPRESENTATIVE (1.6.1.x.x.x.x) ─
  ('jab-gm-mr',      '1.6.1.1.0.0.0', 'General Manager MR',                'Divisi MR',                     'General Manager',  'grade-g09', true,  true, 'Aktif', '1.6.1.0.0.0.0'),
  ('jab-mgr-mr',     '1.6.1.1.1.0.0', 'Manager MR & Compliance',            'Divisi MR',                     'Manager',          'grade-g07', true,  true, 'Aktif', '1.6.1.1.0.0.0'),
  ('jab-staff-mr-1', '1.6.1.1.1.1.1', 'MR Coordinator',                     'Divisi MR',                     'Staff',            'grade-g03', false, true, 'Aktif', '1.6.1.1.1.0.0'),

  -- ─ HSE (1.7.1.x.x.x.x) ─
  ('jab-gm-hse',     '1.7.1.1.0.0.0', 'General Manager HSE',               'Divisi HSE',                    'General Manager',  'grade-g09', true,  true, 'Aktif', '1.7.1.0.0.0.0'),
  ('jab-mgr-hse',    '1.7.1.1.1.0.0', 'Manager HSE',                       'Divisi HSE',                    'Manager',          'grade-g07', true,  true, 'Aktif', '1.7.1.1.0.0.0'),
  ('jab-staff-hse-1','1.7.1.1.1.1.1', 'HSE Officer',                       'Divisi HSE',                    'Staff',            'grade-g03', false, true, 'Aktif', '1.7.1.1.1.0.0'),
  ('jab-staff-hse-2','1.7.1.1.1.1.2', 'Safety Inspector',                  'Divisi HSE',                    'Staff',            'grade-g02', false, true, 'Aktif', '1.7.1.1.1.0.0')
ON CONFLICT (id) DO UPDATE SET code = EXCLUDED.code, name = EXCLUDED.name, department = EXCLUDED.department,
  level = EXCLUDED.level, grade_id = EXCLUDED.grade_id, is_kepala_unit = EXCLUDED.is_kepala_unit,
  is_master = EXCLUDED.is_master, status = EXCLUDED.status, parent_code = EXCLUDED.parent_code;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped jabatan: %', SQLERRM;
END $$;

-- 5. FORMASI JABATAN — setiap jabatan mendapat Position Number
DO $$ BEGIN
INSERT INTO formasi_jabatan (id, position_number, unit_organisasi_id, jabatan_id, status, keterangan) VALUES
  -- TOP
  ('form-komisaris', 'PN-EXEC-001', 'unit-hold', 'jab-komisaris', 'Filled', 'Pemegang Saham Utama'),
  ('form-dirut',     'PN-EXEC-002', 'unit-hold', 'jab-dirut',     'Filled', 'Pimpinan Tertinggi'),

  -- HR
  ('form-dir-hr',    'PN-HR-001', 'unit-hr', 'jab-dir-hr',    'Filled', ''),
  ('form-gm-hr',     'PN-HR-002', 'unit-hr', 'jab-gm-hr',     'Filled', ''),
  ('form-mgr-hr',    'PN-HR-003', 'unit-hr', 'jab-mgr-hr',    'Filled', ''),
  ('form-spv-hr',    'PN-HR-004', 'unit-hr', 'jab-spv-hr',    'Filled', ''),
  ('form-staff-hr-1','PN-HR-005', 'unit-hr', 'jab-staff-hr-1','Filled', ''),
  ('form-staff-hr-2','PN-HR-006', 'unit-hr', 'jab-staff-hr-2','Filled', ''),
  ('form-staff-ga',  'PN-HR-007', 'unit-hr', 'jab-staff-ga',  'Filled', ''),

  -- FINANCE
  ('form-dir-fin',     'PN-FIN-001','unit-fin','jab-dir-fin',     'Filled', ''),
  ('form-gm-fin',      'PN-FIN-002','unit-fin','jab-gm-fin',      'Filled', ''),
  ('form-mgr-fin',     'PN-FIN-003','unit-fin','jab-mgr-fin',     'Filled', ''),
  ('form-spv-fin',     'PN-FIN-004','unit-fin','jab-spv-fin',     'Filled', ''),
  ('form-staff-fin-1', 'PN-FIN-005','unit-fin','jab-staff-fin-1', 'Filled', ''),
  ('form-staff-fin-2', 'PN-FIN-006','unit-fin','jab-staff-fin-2', 'Filled', ''),
  ('form-staff-tax',   'PN-FIN-007','unit-fin','jab-staff-tax',   'Filled', ''),

  -- OPERASIONAL
  ('form-dir-ops',      'PN-OPS-001','unit-ops','jab-dir-ops',      'Filled', ''),
  ('form-gm-ops',       'PN-OPS-002','unit-ops','jab-gm-ops',       'Filled', ''),
  ('form-mgr-ppjk',     'PN-OPS-003','unit-ops','jab-mgr-ppjk',     'Filled', ''),
  ('form-spv-ppjk',     'PN-OPS-004','unit-ops','jab-spv-ppjk',     'Filled', ''),
  ('form-staff-ppjk-1', 'PN-OPS-005','unit-ops','jab-staff-ppjk-1', 'Filled', ''),
  ('form-staff-ppjk-2', 'PN-OPS-006','unit-ops','jab-staff-ppjk-2', 'Filled', ''),
  ('form-mgr-gudang',   'PN-OPS-007','unit-ops','jab-mgr-gudang',   'Filled', ''),
  ('form-spv-gudang',   'PN-OPS-008','unit-ops','jab-spv-gudang',   'Filled', ''),
  ('form-staff-gudang-1','PN-OPS-009','unit-ops','jab-staff-gudang-1','Filled',''),
  ('form-staff-gudang-2','PN-OPS-010','unit-ops','jab-staff-gudang-2','Filled',''),
  ('form-mgr-armada',   'PN-OPS-011','unit-ops','jab-mgr-armada',   'Filled', ''),
  ('form-spv-armada',   'PN-OPS-012','unit-ops','jab-spv-armada',   'Filled', ''),
  ('form-supir-1',      'PN-OPS-013','unit-ops','jab-supir-1',      'Filled', ''),
  ('form-supir-2',      'PN-OPS-014','unit-ops','jab-supir-2',      'Filled', ''),
  ('form-supir-3',      'PN-OPS-015','unit-ops','jab-supir-3',      'Filled', ''),
  ('form-cs-ops',       'PN-OPS-016','unit-ops','jab-cs-ops',       'Filled', ''),

  -- PROCUREMENT
  ('form-dir-proc',     'PN-PRC-001','unit-proc','jab-dir-proc',     'Filled', ''),
  ('form-gm-proc',      'PN-PRC-002','unit-proc','jab-gm-proc',      'Filled', ''),
  ('form-mgr-proc',     'PN-PRC-003','unit-proc','jab-mgr-proc',     'Filled', ''),
  ('form-spv-proc',     'PN-PRC-004','unit-proc','jab-spv-proc',     'Filled', ''),
  ('form-staff-proc-1', 'PN-PRC-005','unit-proc','jab-staff-proc-1', 'Filled', ''),
  ('form-staff-proc-2', 'PN-PRC-006','unit-proc','jab-staff-proc-2', 'Filled', ''),

  -- PROJECT APPRAISAL
  ('form-dir-pa',      'PN-PA-001','unit-pa','jab-dir-pa',      'Filled', ''),
  ('form-gm-pa',       'PN-PA-002','unit-pa','jab-gm-pa',       'Filled', ''),
  ('form-mgr-qc',      'PN-PA-003','unit-pa','jab-mgr-qc',      'Filled', ''),
  ('form-staff-pa-1',  'PN-PA-004','unit-pa','jab-staff-pa-1',  'Filled', ''),
  ('form-staff-pa-2',  'PN-PA-005','unit-pa','jab-staff-pa-2',  'Filled', ''),

  -- MR
  ('form-dir-mr',      'PN-MR-001','unit-mr','jab-dir-mr',      'Filled', ''),
  ('form-gm-mr',       'PN-MR-002','unit-mr','jab-gm-mr',       'Filled', ''),
  ('form-mgr-mr',      'PN-MR-003','unit-mr','jab-mgr-mr',      'Filled', ''),
  ('form-staff-mr-1',  'PN-MR-004','unit-mr','jab-staff-mr-1',  'Filled', ''),

  -- HSE
  ('form-dir-hse',     'PN-HSE-001','unit-hse','jab-dir-hse',     'Filled', ''),
  ('form-gm-hse',      'PN-HSE-002','unit-hse','jab-gm-hse',      'Filled', ''),
  ('form-mgr-hse',     'PN-HSE-003','unit-hse','jab-mgr-hse',     'Filled', ''),
  ('form-staff-hse-1', 'PN-HSE-004','unit-hse','jab-staff-hse-1', 'Filled', ''),
  ('form-staff-hse-2', 'PN-HSE-005','unit-hse','jab-staff-hse-2', 'Filled', '')
ON CONFLICT (id) DO UPDATE SET position_number = EXCLUDED.position_number, unit_organisasi_id = EXCLUDED.unit_organisasi_id,
  jabatan_id = EXCLUDED.jabatan_id, status = EXCLUDED.status, keterangan = EXCLUDED.keterangan;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped formasi_jabatan: %', SQLERRM;
END $$;

-- 6. KARYAWAN — Setiap formasi diisi karyawan dengan NIK & kode_jabatan
DO $$ BEGIN
INSERT INTO karyawan (id, full_name, email, department, position, status, formasi_id, join_date, phone, kode_jabatan, nik) VALUES
  -- TOP OF HOUSE
  ('emp-001', 'H. Bambang Sutrisno',       'komisaris@ptpgp.co.id',  'Holding',                           'Komisaris',                          'Active', 'form-komisaris', '2015-01-05', '081300000001', '1.0.0.0.0.0.0', 'PGP-201501-0001'),
  ('emp-002', 'Ir. Ahmad Faisal',          'dirut@ptpgp.co.id',      'Holding',                           'Direktur Utama',                     'Active', 'form-dirut',     '2016-03-10', '081300000002', '1.1.0.0.0.0.0', 'PGP-201601-0001'),

  -- HR & GA
  ('emp-003', 'Dra. Ratna Kusumawati',     'dir.hr@ptpgp.co.id',     'Divisi HR & GA',                    'Direktur HR & GA',                   'Active', 'form-dir-hr',    '2017-02-01', '081300000003', '1.1.1.0.0.0.0', 'PGP-201702-0001'),
  ('emp-004', 'Fitriani Handayani, SE',    'gm.hr@ptpgp.co.id',      'Divisi HR & GA',                    'General Manager HR & GA',            'Active', 'form-gm-hr',     '2018-04-02', '081300000004', '1.1.1.1.0.0.0', 'PGP-201804-0001'),
  ('emp-005', 'Rudi Hartanto, S.Psi',      'mgr.hr@ptpgp.co.id',     'Divisi HR & GA',                    'Manager HR & GA',                    'Active', 'form-mgr-hr',    '2020-01-20', '081300000005', '1.1.1.1.1.0.0', 'PGP-202001-0001'),
  ('emp-006', 'Siti Rahayu, A.Md',         'spv.hr@ptpgp.co.id',     'Divisi HR & GA',                    'Supervisor HR & GA',                 'Active', 'form-spv-hr',    '2021-02-14', '081300000006', '1.1.1.1.1.1.0', 'PGP-202102-0001'),
  ('emp-007', 'Andi Prasetyo, S.Psi',      'staff.hrd1@ptpgp.co.id', 'Divisi HR & GA',                    'Staff HRD (Rekrutmen)',              'Active', 'form-staff-hr-1','2022-06-01', '081300000007', '1.1.1.1.1.1.1', 'PGP-202206-0001'),
  ('emp-008', 'Dewi Anggraeni, SE',        'staff.hrd2@ptpgp.co.id', 'Divisi HR & GA',                    'Staff HRD (Payroll & Adm)',          'Active', 'form-staff-hr-2','2023-01-15', '081300000008', '1.1.1.1.1.1.2', 'PGP-202301-0001'),
  ('emp-009', 'Budi Hermawan',             'staff.ga@ptpgp.co.id',   'Divisi HR & GA',                    'Staff General Affairs (GA)',         'Active', 'form-staff-ga',  '2022-09-10', '081300000009', '1.1.1.1.1.1.3', 'PGP-202209-0001'),

  -- FINANCE & ACCOUNTING
  ('emp-010', 'Drs. Setiawan Halim, Ak.',  'dir.finance@ptpgp.co.id','Divisi Finance & Accounting',       'Direktur Finance',                   'Active', 'form-dir-fin',   '2017-04-15', '081300000010', '1.2.1.0.0.0.0', 'PGP-201704-0001'),
  ('emp-011', 'Lina Marlina, SE, Ak.',     'gm.finance@ptpgp.co.id', 'Divisi Finance & Accounting',       'General Manager Finance',            'Active', 'form-gm-fin',    '2018-07-09', '081300000011', '1.2.1.1.0.0.0', 'PGP-201807-0001'),
  ('emp-012', 'Hendro Wibowo, SE, Ak.',    'mgr.finance@ptpgp.co.id','Divisi Finance & Accounting',       'Manager Finance & Accounting',       'Active', 'form-mgr-fin',   '2020-03-16', '081300000012', '1.2.1.1.1.0.0', 'PGP-202003-0001'),
  ('emp-013', 'Yuni Hartati, SE',          'spv.finance@ptpgp.co.id','Divisi Finance & Accounting',       'Supervisor Finance',                 'Active', 'form-spv-fin',   '2021-05-22', '081300000013', '1.2.1.1.1.1.0', 'PGP-202105-0001'),
  ('emp-014', 'Ahmad Dahlan, A.Md.Ak.',    'staff.acc@ptpgp.co.id',  'Divisi Finance & Accounting',       'Staff Accounting',                   'Active', 'form-staff-fin-1','2022-02-10','081300000014', '1.2.1.1.1.1.1', 'PGP-202202-0001'),
  ('emp-015', 'Mega Puspita, SE',          'staff.fin@ptpgp.co.id',  'Divisi Finance & Accounting',       'Staff Finance (AP/AR)',              'Active', 'form-staff-fin-2','2022-08-01','081300000015', '1.2.1.1.1.1.2', 'PGP-202208-0001'),
  ('emp-016', 'Rina Marlina, SE, BKP',     'staff.tax@ptpgp.co.id',  'Divisi Finance & Accounting',       'Staff Tax & Compliance',             'Active', 'form-staff-tax',  '2023-03-01', '081300000016', '1.2.1.1.1.1.3', 'PGP-202303-0001'),

  -- OPERASIONAL
  ('emp-017', 'Ir. Bayu Kristanto',        'dir.ops@ptpgp.co.id',    'Divisi Operasional',                'Direktur Operasional',               'Active', 'form-dir-ops',   '2016-08-20', '081300000017', '1.3.1.0.0.0.0', 'PGP-201608-0001'),
  ('emp-018', 'Dedi Kurniawan, S.E.',      'gm.ops@ptpgp.co.id',     'Divisi Operasional',                'General Manager Operasional',        'Active', 'form-gm-ops',    '2018-01-10', '081300000018', '1.3.1.1.0.0.0', 'PGP-201801-0001'),
  ('emp-019', 'Wawan Setiadi',             'mgr.ppjk@ptpgp.co.id',   'Divisi Operasional',                'Manager Kepabeanan (PPJK)',          'Active', 'form-mgr-ppjk',  '2019-02-18', '081300000019', '1.3.1.1.1.0.0', 'PGP-201902-0001'),
  ('emp-020', 'Eko Prasetyo',              'spv.ppjk@ptpgp.co.id',   'Divisi Operasional',                'Supervisor Kepabeanan (PPJK)',       'Active', 'form-spv-ppjk',  '2020-05-11', '081300000020', '1.3.1.1.1.1.0', 'PGP-202005-0001'),
  ('emp-021', 'Dian Anggraini, A.Md.Kep.', 'staff.ppjk1@ptpgp.co.id','Divisi Operasional',                'Staff PPJK (PIB/PEB)',               'Active', 'form-staff-ppjk-1','2022-03-07','081300000021', '1.3.1.1.1.1.1', 'PGP-202203-0001'),
  ('emp-022', 'Rina Karlina',              'staff.ppjk2@ptpgp.co.id','Divisi Operasional',                'Staff PPJK (Dokumentasi)',           'Active', 'form-staff-ppjk-2','2023-05-20','081300000022', '1.3.1.1.1.1.2', 'PGP-202305-0001'),
  ('emp-023', 'Slamet Riyadi',             'mgr.gudang@ptpgp.co.id', 'Divisi Operasional',                'Manager Gudang & Cargo',             'Active', 'form-mgr-gudang','2019-06-25', '081300000023', '1.3.1.2.0.0.0', 'PGP-201906-0001'),
  ('emp-024', 'Teguh Prayitno',            'spv.gudang@ptpgp.co.id', 'Divisi Operasional',                'Supervisor Gudang & Cargo',          'Active', 'form-spv-gudang','2020-09-10','081300000024', '1.3.1.2.1.0.0', 'PGP-202009-0001'),
  ('emp-025', 'Suparman',                  'staff.gudang1@ptpgp.co.id','Divisi Operasional',              'Staff Gudang (Bongkar Muat)',        'Active', 'form-staff-gudang-1','2021-11-05','081300000025','1.3.1.2.1.1.1','PGP-202111-0001'),
  ('emp-026', 'Jumadi',                    'staff.gudang2@ptpgp.co.id','Divisi Operasional',              'Staff Administrasi Gudang',          'Active', 'form-staff-gudang-2','2023-02-15','081300000026','1.3.1.2.1.1.2','PGP-202302-0001'),
  ('emp-027', 'Joko Susilo',               'mgr.armada@ptpgp.co.id', 'Divisi Operasional',                'Manager Armada & Trucking',          'Active', 'form-mgr-armada','2019-09-14','081300000027', '1.3.1.3.0.0.0', 'PGP-201909-0001'),
  ('emp-028', 'Herman Susanto',            'spv.armada@ptpgp.co.id', 'Divisi Operasional',                'Koordinator Armada',                 'Active', 'form-spv-armada','2020-12-01','081300000028', '1.3.1.3.1.0.0', 'PGP-202012-0001'),
  ('emp-029', 'Agus Salim',                'supir1@ptpgp.co.id',     'Divisi Operasional',                'Supir Truk / Driver',                'Active', 'form-supir-1',  '2021-07-14', '081300000029', '1.3.1.3.1.1.1', 'PGP-202107-0001'),
  ('emp-030', 'Rahmat Hidayat',            'supir2@ptpgp.co.id',     'Divisi Operasional',                'Supir Truk / Driver',                'Active', 'form-supir-2',  '2021-08-22', '081300000030', '1.3.1.3.1.1.2', 'PGP-202108-0001'),
  ('emp-031', 'Udin Samsudin',             'supir3@ptpgp.co.id',     'Divisi Operasional',                'Supir Truk / Driver',                'Active', 'form-supir-3',  '2022-04-10', '081300000031', '1.3.1.3.1.1.3', 'PGP-202204-0001'),
  ('emp-032', 'Fitri Andriani',            'staff.cs@ptpgp.co.id',   'Divisi Operasional',                'Customer Service Ekspor-Impor',      'Active', 'form-cs-ops',   '2023-06-01', '081300000032', '1.3.1.3.1.1.4', 'PGP-202306-0001'),

  -- PROCUREMENT
  ('emp-033', 'Hendra Kusuma',             'dir.proc@ptpgp.co.id',   'Divisi SCM / Procurement',          'Direktur SCM / Procurement',         'Active', 'form-dir-proc',  '2017-09-18', '081300000033', '1.4.1.0.0.0.0', 'PGP-201709-0001'),
  ('emp-034', 'Surya Dharma, ST',          'gm.proc@ptpgp.co.id',    'Divisi SCM / Procurement',          'General Manager SCM / Procurement',  'Active', 'form-gm-proc',   '2019-01-25', '081300000034', '1.4.1.1.0.0.0', 'PGP-201901-0001'),
  ('emp-035', 'Rangga Maulana',            'mgr.proc@ptpgp.co.id',   'Divisi SCM / Procurement',          'Manager Procurement',                'Active', 'form-mgr-proc',  '2020-08-12', '081300000035', '1.4.1.1.1.0.0', 'PGP-202008-0001'),
  ('emp-036', 'Tika Nurmalasari',          'spv.proc@ptpgp.co.id',   'Divisi SCM / Procurement',          'Supervisor Procurement',             'Active', 'form-spv-proc',  '2021-10-05', '081300000036', '1.4.1.1.1.1.0', 'PGP-202110-0001'),
  ('emp-037', 'Aldo Firmansyah',           'staff.proc1@ptpgp.co.id','Divisi SCM / Procurement',          'Staff Procurement (Sourcing)',       'Active', 'form-staff-proc-1','2022-12-01','081300000037','1.4.1.1.1.1.1','PGP-202212-0001'),
  ('emp-038', 'Desi Ratnasari',            'staff.proc2@ptpgp.co.id','Divisi SCM / Procurement',          'Staff Procurement (PO)',             'Active', 'form-staff-proc-2','2023-07-15','081300000038','1.4.1.1.1.1.2','PGP-202307-0001'),

  -- PROJECT APPRAISAL & QC
  ('emp-039', 'Ir. Dodi Haryanto',         'dir.pa@ptpgp.co.id',     'Divisi Project Appraisal & QC',     'Direktur Project Appraisal & QC',    'Active', 'form-dir-pa',    '2017-06-30', '081300000039', '1.5.1.0.0.0.0', 'PGP-201706-0001'),
  ('emp-040', 'Arief Rachman, ST',         'gm.pa@ptpgp.co.id',      'Divisi Project Appraisal & QC',     'General Manager Project Appraisal',  'Active', 'form-gm-pa',     '2019-03-12', '081300000040', '1.5.1.1.0.0.0', 'PGP-201903-0001'),
  ('emp-041', 'Yuni Astuti, ST',           'mgr.qc@ptpgp.co.id',     'Divisi Project Appraisal & QC',     'Manager Quality Control (QC)',       'Active', 'form-mgr-qc',    '2020-11-20', '081300000041', '1.5.1.1.1.0.0', 'PGP-202011-0001'),
  ('emp-042', 'Bayu Setyawan, SE',         'staff.pa1@ptpgp.co.id',  'Divisi Project Appraisal & QC',     'Project Appraisal Analyst',          'Active', 'form-staff-pa-1','2022-05-08', '081300000042', '1.5.1.1.1.1.1', 'PGP-202205-0001'),
  ('emp-043', 'Nurul Hikmah, A.Md.T',      'staff.qc@ptpgp.co.id',   'Divisi Project Appraisal & QC',     'QC Inspector',                       'Active', 'form-staff-pa-2','2023-04-18', '081300000043', '1.5.1.1.1.1.2', 'PGP-202304-0001'),

  -- MR
  ('emp-044', 'Drs. Bambang Wibisono',     'dir.mr@ptpgp.co.id',     'Divisi MR',                         'Direktur Management Representative', 'Active', 'form-dir-mr',    '2017-05-12', '081300000044', '1.6.1.0.0.0.0', 'PGP-201705-0001'),
  ('emp-045', 'Indriani Putri, ST',        'gm.mr@ptpgp.co.id',      'Divisi MR',                         'General Manager MR',                 'Active', 'form-gm-mr',     '2019-07-28', '081300000045', '1.6.1.1.0.0.0', 'PGP-201907-0001'),
  ('emp-046', 'Mulyadi Kurniawan',         'mgr.mr@ptpgp.co.id',     'Divisi MR',                         'Manager MR & Compliance',            'Active', 'form-mgr-mr',    '2021-01-10', '081300000046', '1.6.1.1.1.0.0', 'PGP-202101-0001'),
  ('emp-047', 'Sinta Amelia',              'staff.mr@ptpgp.co.id',   'Divisi MR',                         'MR Coordinator',                     'Active', 'form-staff-mr-1','2022-10-05', '081300000047', '1.6.1.1.1.1.1', 'PGP-202210-0001'),

  -- HSE
  ('emp-048', 'Ir. Wahyu Santoso',         'dir.hse@ptpgp.co.id',    'Divisi HSE',                        'Direktur HSE',                       'Active', 'form-dir-hse',   '2017-10-08', '081300000048', '1.7.1.0.0.0.0', 'PGP-201710-0001'),
  ('emp-049', 'Riza Hermawan, ST, AK3U',   'gm.hse@ptpgp.co.id',     'Divisi HSE',                        'General Manager HSE',                'Active', 'form-gm-hse',    '2019-11-15', '081300000049', '1.7.1.1.0.0.0', 'PGP-201911-0001'),
  ('emp-050', 'Agus Triyono, ST',          'mgr.hse@ptpgp.co.id',    'Divisi HSE',                        'Manager HSE',                        'Active', 'form-mgr-hse',   '2021-04-22', '081300000050', '1.7.1.1.1.0.0', 'PGP-202104-0001'),
  ('emp-051', 'Dimas Prasetya',            'staff.hse1@ptpgp.co.id', 'Divisi HSE',                        'HSE Officer',                        'Active', 'form-staff-hse-1','2022-07-30','081300000051', '1.7.1.1.1.1.1', 'PGP-202207-0001'),
  ('emp-052', 'Maya Sari Dewi',            'staff.hse2@ptpgp.co.id', 'Divisi HSE',                        'Safety Inspector',                   'Active', 'form-staff-hse-2','2023-08-12','081300000052', '1.7.1.1.1.1.2', 'PGP-202308-0001')
ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, email = EXCLUDED.email, department = EXCLUDED.department,
  position = EXCLUDED.position, status = EXCLUDED.status, formasi_id = EXCLUDED.formasi_id,
  join_date = EXCLUDED.join_date, phone = EXCLUDED.phone, kode_jabatan = EXCLUDED.kode_jabatan, nik = EXCLUDED.nik;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped karyawan: %', SQLERRM;
END $$;

-- 7. PENGGUNA (login accounts) — password_default: "pgp2024!"
-- Hash: 7b3ff040d72943093ea8236f741734e3:... (auto-generated)
DO $$ 
DECLARE
  emp RECORD;
  role_val TEXT;
BEGIN
  FOR emp IN SELECT * FROM karyawan WHERE status = 'Active'
  LOOP
    -- Determine role based on position
    IF emp.position ILIKE '%direktur utama%' THEN role_val := 'director';
    ELSIF emp.position ILIKE '%komisaris%' THEN role_val := 'director';
    ELSIF emp.position ILIKE '%direktur%' THEN role_val := 'director';
    ELSIF emp.position ILIKE '%general manager%' OR emp.position ILIKE '%manager%' THEN role_val := 'department_manager';
    ELSIF emp.department ILIKE '%hr%' THEN role_val := 'hrd';
    ELSE role_val := 'employee';
    END IF;

    INSERT INTO pengguna (email, password_hash, role, full_name)
    VALUES (
      emp.email,
      '7b3ff040d72943093ea8236f741734e3:ec2de86b8187131c927dc22dcc12209750e06cb8185c6a179d905e8c9eadad16d4bd2ff02cdc42e7ba1500bae614bb6153c90a1636442a11043a8eba05171a93',
      role_val,
      emp.full_name
    )
    ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role, full_name = EXCLUDED.full_name;
  END LOOP;
END $$;

-- 8. SYNC departemen (denormalized view)
DELETE FROM departemen;
INSERT INTO departemen (code, name, parent_code, level, leader_name, leader_email, sort_order)
SELECT 
  uo.code, uo.name, uo.parent_code, uo.level, 
  COALESCE(k.full_name, ''), COALESCE(k.email, ''), uo.sort_order
FROM unit_organisasi uo
LEFT JOIN formasi_jabatan fj ON fj.unit_organisasi_id = uo.id AND fj.status = 'Filled'
LEFT JOIN jabatan j ON j.id = fj.jabatan_id AND j.is_kepala_unit = true
LEFT JOIN karyawan k ON k.id = fj.karyawan_id
ORDER BY uo.sort_order;
