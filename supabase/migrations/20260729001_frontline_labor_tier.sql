-- Adds the missing frontline/operational-labor tier below "Staff" —
-- 20260723001_org_hierarchy_full.sql built a real Komisaris-to-Staff ladder
-- but stopped at Staff by design (see that file's own code-scheme comment).
-- A freight-forwarding company with an actual trucking fleet (vehicles,
-- trip_supir) and warehouse has no jabatan for the people who actually drive
-- the trucks or handle cargo — "Supir" only existed as data in trip_supir/
-- vehicles.assigned_driver_id, never as a real position. This file adds that
-- tier under the existing Armada (driving) and Gudang (warehouse) lines.
--
-- Purely ADDITIVE (INSERT ... ON CONFLICT DO NOTHING) — safe to re-run.

-- New grade below G04 Junior Staff — blue-collar/frontline wage band.
DO $$ BEGIN
INSERT INTO grade_jabatan (id, kode, nama, urutan, salary_min, salary_max) VALUES
  ('demo-grade-g03', 'G03', 'Pelaksana / Operator Lapangan', 3, 3500000, 5000000)
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped grade_jabatan (frontline): %', SQLERRM;
END $$;

-- Frontline jabatan nested under the existing Armada & Trucking and Gudang &
-- Cargo supervisor codes (1.1.3.1.3.x and 1.1.3.1.2.x respectively).
DO $$ BEGIN
INSERT INTO jabatan (id, code, name, department, level, grade_id) VALUES
  ('demo-jab-sopir',       '1.1.3.1.3.3', 'Sopir Truk',                'Operational Division', 'Pelaksana', 'demo-grade-g03'),
  ('demo-jab-kenek',       '1.1.3.1.3.4', 'Kenek / Helper Armada',     'Operational Division', 'Pelaksana', 'demo-grade-g03'),
  ('demo-jab-checker',     '1.1.3.1.2.3', 'Checker Gudang',            'Operational Division', 'Pelaksana', 'demo-grade-g03'),
  ('demo-jab-buruh-gudang','1.1.3.1.2.4', 'Buruh Gudang & Cargo',      'Operational Division', 'Pelaksana', 'demo-grade-g03')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped jabatan (frontline): %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO formasi_jabatan (id, position_number, unit_organisasi_id, jabatan_id, status) VALUES
  ('demo-formasi-sopir1',        'PN-OPS-112', 'demo-unit-ops', 'demo-jab-sopir',        'Filled'),
  ('demo-formasi-sopir2',        'PN-OPS-113', 'demo-unit-ops', 'demo-jab-sopir',        'Filled'),
  ('demo-formasi-kenek1',        'PN-OPS-114', 'demo-unit-ops', 'demo-jab-kenek',        'Filled'),
  ('demo-formasi-checker1',      'PN-OPS-115', 'demo-unit-ops', 'demo-jab-checker',      'Filled'),
  ('demo-formasi-buruh-gudang1', 'PN-OPS-116', 'demo-unit-ops', 'demo-jab-buruh-gudang', 'Vacant')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped formasi_jabatan (frontline): %', SQLERRM;
END $$;

-- Real employees for the filled formations, matching the pattern used for
-- every other tier — so headcount/org-chart pages show real people.
DO $$ BEGIN
INSERT INTO karyawan (id, full_name, email, department, position, status, formasi_id, join_date, phone) VALUES
  ('7b1e4a2c-5f8d-4e91-a3b6-1c2d3e4f5a61', 'Warno Suhendra',  'warno.suhendra@ptpgp.co.id',  'Operational Division', 'Sopir Truk',           'Active', 'demo-formasi-sopir1',        '2021-04-12', '081300000016'),
  ('7b1e4a2c-5f8d-4e91-a3b6-1c2d3e4f5a62', 'Karyo Prasetyo',  'karyo.prasetyo@ptpgp.co.id',  'Operational Division', 'Sopir Truk',           'Active', 'demo-formasi-sopir2',        '2022-01-18', '081300000017'),
  ('7b1e4a2c-5f8d-4e91-a3b6-1c2d3e4f5a63', 'Dedi Setiawan',   'dedi.setiawan@ptpgp.co.id',   'Operational Division', 'Kenek / Helper Armada','Active', 'demo-formasi-kenek1',        '2022-06-05', '081300000018'),
  ('7b1e4a2c-5f8d-4e91-a3b6-1c2d3e4f5a64', 'Sutiyo Wibowo',   'sutiyo.wibowo@ptpgp.co.id',   'Operational Division', 'Checker Gudang',       'Active', 'demo-formasi-checker1',      '2021-09-20', '081300000019')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped karyawan (frontline): %', SQLERRM;
END $$;
