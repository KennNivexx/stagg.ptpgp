-- Skills catalog
CREATE TABLE IF NOT EXISTS skills (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT DEFAULT ''
);

-- Required skill level per position
CREATE TABLE IF NOT EXISTS position_skills (
  position_code TEXT NOT NULL,
  skill_id TEXT NOT NULL REFERENCES skills(id),
  required_level INTEGER NOT NULL DEFAULT 0 CHECK (required_level BETWEEN 0 AND 5),
  PRIMARY KEY (position_code, skill_id)
);

-- Actual employee skill levels
CREATE TABLE IF NOT EXISTS employee_skills (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL,
  skill_id TEXT NOT NULL REFERENCES skills(id),
  current_level INTEGER NOT NULL DEFAULT 0 CHECK (current_level BETWEEN 0 AND 5),
  assessed_by TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Training programs
CREATE TABLE IF NOT EXISTS trainings (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  skill_id TEXT REFERENCES skills(id),
  description TEXT DEFAULT '',
  date_start DATE,
  date_end DATE,
  status TEXT DEFAULT 'Planned',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Training enrollments
CREATE TABLE IF NOT EXISTS training_enrollments (
  id TEXT PRIMARY KEY,
  training_id TEXT NOT NULL REFERENCES trainings(id),
  employee_id TEXT NOT NULL,
  status TEXT DEFAULT 'Enrolled',
  enrolled_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed skills
INSERT INTO skills (id, name, category) VALUES
  ('sk-lead', 'Kepemimpinan (Leadership)', 'Manajemen'),
  ('sk-comm', 'Komunikasi', 'Soft Skills'),
  ('sk-excel', 'Microsoft Excel', 'Teknis'),
  ('sk-rekrut', 'Rekrutmen & Seleksi', 'HR'),
  ('sk-hi', 'Hubungan Industrial', 'HR'),
  ('sk-akun', 'Akuntansi', 'Teknis'),
  ('sk-ana', 'Analisis Keuangan', 'Teknis'),
  ('sk-drive', 'Mengemudi', 'Teknis'),
  ('sk-k3', 'Keselamatan Kerja (K3)', 'K3'),
  ('sk-navigasi', 'Navigasi & Rute', 'Teknis'),
  ('sk-maint', 'Perawatan Kendaraan', 'Teknis'),
  ('sk-logistik', 'Manajemen Logistik', 'Teknis'),
  ('sk-proc', 'Pengadaan (Procurement)', 'Operasional'),
  ('sk-sales', 'Penjualan & Negosiasi', 'Soft Skills'),
  ('sk-media', 'Media & Promosi', 'Teknis'),
  ('sk-qc', 'Quality Control', 'Operasional'),
  ('sk-hse', 'HSE Management', 'K3'),
  ('sk-doc', 'Document Control', 'Operasional'),
  ('sk-ops', 'Manajemen Operasional', 'Manajemen'),
  ('sk-team', 'Kerjasama Tim', 'Soft Skills'),
  ('sk-problem', 'Problem Solving', 'Soft Skills'),
  ('sk-it', 'IT & Sistem', 'Teknis'),
  ('sk-security', 'Keamanan & Pengawasan', 'Operasional'),
  ('sk-warehouse', 'Manajemen Gudang', 'Operasional'),
  ('sk-forwarder', 'Forwarder & Ekspedisi', 'Operasional')
ON CONFLICT (id) DO NOTHING;

-- Seed position_skills based on positions
INSERT INTO position_skills (position_code, skill_id, required_level) VALUES
  ('HR-MGR', 'sk-lead', 4), ('HR-MGR', 'sk-comm', 4), ('HR-MGR', 'sk-rekrut', 4), ('HR-MGR', 'sk-hi', 3), ('HR-MGR', 'sk-excel', 3),
  ('HR-OFF', 'sk-comm', 3), ('HR-OFF', 'sk-rekrut', 3), ('HR-OFF', 'sk-excel', 3), ('HR-OFF', 'sk-team', 3),
  ('REC-STF', 'sk-comm', 2), ('REC-STF', 'sk-rekrut', 3), ('REC-STF', 'sk-excel', 2),
  ('PAY-STF', 'sk-excel', 3), ('PAY-STF', 'sk-akun', 2), ('PAY-STF', 'sk-team', 2),
  ('GA-STF', 'sk-comm', 2), ('GA-STF', 'sk-team', 2),
  ('IT-SUP', 'sk-it', 4), ('IT-SUP', 'sk-problem', 3), ('IT-SUP', 'sk-comm', 2),
  ('SEC-OFF', 'sk-security', 3), ('SEC-OFF', 'sk-k3', 2), ('SEC-OFF', 'sk-team', 2),
  ('FIN-MGR', 'sk-lead', 4), ('FIN-MGR', 'sk-akun', 5), ('FIN-MGR', 'sk-ana', 5), ('FIN-MGR', 'sk-excel', 4),
  ('SR-ACC', 'sk-akun', 4), ('SR-ACC', 'sk-ana', 4), ('SR-ACC', 'sk-excel', 4),
  ('AP-STF', 'sk-akun', 3), ('AP-STF', 'sk-excel', 3), ('AP-STF', 'sk-team', 2),
  ('AR-STF', 'sk-akun', 3), ('AR-STF', 'sk-excel', 3), ('AR-STF', 'sk-team', 2),
  ('CSH', 'sk-akun', 2), ('CSH', 'sk-excel', 2), ('CSH', 'sk-team', 2),
  ('OPS-MGR', 'sk-lead', 4), ('OPS-MGR', 'sk-ops', 5), ('OPS-MGR', 'sk-logistik', 4), ('OPS-MGR', 'sk-k3', 3),
  ('VOP-SPV', 'sk-lead', 3), ('VOP-SPV', 'sk-logistik', 3), ('VOP-SPV', 'sk-drive', 4), ('VOP-SPV', 'sk-team', 3),
  ('DRV', 'sk-drive', 4), ('DRV', 'sk-navigasi', 3), ('DRV', 'sk-k3', 3), ('DRV', 'sk-maint', 2),
  ('HE-OPR', 'sk-drive', 3), ('HE-OPR', 'sk-k3', 4), ('HE-OPR', 'sk-maint', 3),
  ('RIG', 'sk-k3', 4), ('RIG', 'sk-maint', 2), ('RIG', 'sk-team', 2),
  ('QC-STF', 'sk-qc', 4), ('QC-STF', 'sk-excel', 3), ('QC-STF', 'sk-problem', 3),
  ('TS-STF', 'sk-logistik', 3), ('TS-STF', 'sk-navigasi', 3), ('TS-STF', 'sk-excel', 2),
  ('SVC-ADV', 'sk-comm', 3), ('SVC-ADV', 'sk-problem', 3), ('SVC-ADV', 'sk-excel', 2),
  ('PRC-OFF', 'sk-proc', 4), ('PRC-OFF', 'sk-comm', 3), ('PRC-OFF', 'sk-excel', 3),
  ('PRC-STF', 'sk-proc', 3), ('PRC-STF', 'sk-excel', 2), ('PRC-STF', 'sk-team', 2),
  ('PA-MGR', 'sk-lead', 4), ('PA-MGR', 'sk-sales', 4), ('PA-MGR', 'sk-ana', 4), ('PA-MGR', 'sk-comm', 4),
  ('SLS-EXEC', 'sk-sales', 4), ('SLS-EXEC', 'sk-comm', 4), ('SLS-EXEC', 'sk-excel', 2),
  ('MED-PROM', 'sk-media', 4), ('MED-PROM', 'sk-comm', 3), ('MED-PROM', 'sk-excel', 2),
  ('REG-STF', 'sk-logistik', 3), ('REG-STF', 'sk-comm', 2), ('REG-STF', 'sk-excel', 2),
  ('FWD-STF', 'sk-forwarder', 4), ('FWD-STF', 'sk-logistik', 3), ('FWD-STF', 'sk-comm', 2),
  ('WH-STF', 'sk-warehouse', 4), ('WH-STF', 'sk-logistik', 2), ('WH-STF', 'sk-k3', 2),
  ('MR-OFF', 'sk-comm', 3), ('MR-OFF', 'sk-excel', 3), ('MR-OFF', 'sk-team', 2),
  ('HSE-OFF', 'sk-hse', 5), ('HSE-OFF', 'sk-k3', 5), ('HSE-OFF', 'sk-lead', 3), ('HSE-OFF', 'sk-comm', 3),
  ('DOC-CTRL', 'sk-doc', 4), ('DOC-CTRL', 'sk-excel', 3), ('DOC-CTRL', 'sk-team', 2),
  ('OB', 'sk-team', 1), ('OB', 'sk-k3', 1)
ON CONFLICT (position_code, skill_id) DO NOTHING;
