-- =============================================================================
-- SEED: System users (converted from in-code MOCK_USERS)
-- =============================================================================
-- Passwords pakai PBKDF2-SHA512 (100.000 iterasi), format "salt:hash"
-- sama persis dengan fungsi hashPassword() di src/lib/auth.ts.
--
-- Password plain-text (untuk login testing):
--   superadmin@ptpgp.co.id  →  superadmin123
--   semua lainnya            →  password
--
-- Cara apply: paste ke Supabase SQL Editor → Run
-- =============================================================================

-- Buat tabel users kalau belum ada
CREATE TABLE IF NOT EXISTS users (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  email       TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'employee',
  full_name   TEXT DEFAULT '',
  is_temporary BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role  ON users(role);

-- -----------------------------------------------------------------------------
-- Insert / upsert users
-- -----------------------------------------------------------------------------
INSERT INTO users (id, email, password_hash, role, full_name, is_temporary)
VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    'superadmin@ptpgp.co.id',
    'ae02ce40229f1b2e6e25f7552ed29624:bb972ded9b03142f1289748c94e51e7e32f7fd4aedcfdda29cae0ca3355fc3afb70deffdb85482f77348ff69b642d98c574567882438efd09df44d5b824e2126',
    'superadmin',
    'Super Administrator',
    FALSE
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    'hrd@ptpgp.co.id',
    'a1b2766f0d62bb3fedc3343cabb13579:b740638eefb3ffcf34f26d0b1e12ffe665a6c317830641e0eeefd3e842688fe35796f35abc683354a0edb7593fc3f1e9782a91098de6e813d6c007a1ba4d8980',
    'hrd',
    'Administrator HRD',
    FALSE
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    'employee@ptpgp.co.id',
    '333f8f6999eda8e8f499e1f45c27a885:8e7c1a6dad4ead999b4d706902728befbcb5e8d966991156f6f44e7d65233ef59683887d99cc2b93f1ee3617c4f56aea2f5269404185d5e865f95f96866d1bdf',
    'employee',
    'Budi Santoso',
    FALSE
  ),
  (
    '00000000-0000-0000-0000-000000000004',
    'director@ptpgp.co.id',
    'eecb822bf99529f8f3ae6c898fead96a:b5aa82fc069656deb8858206e7b9950567e91faf933c49758bf73f7923432b840aded6d850a6475f60d7e52080a63b628f6e8a3391d191f2cb31d804185a65bd',
    'director',
    'Ade Fajar Nurcahman',
    FALSE
  ),
  (
    '00000000-0000-0000-0000-000000000005',
    'hrga@ptpgp.co.id',
    'a18cad4c3d9f24f970998d0985496dbd:149facd812f437641bc629d189279dfb07596d5caa99b30dc6199d9ff58bf5f0ae453c04d532a2f469f42cabc5f490ef97574242fd5669d3c234dc0dbe411676',
    'department_manager',
    'Manager HR & GA',
    FALSE
  ),
  (
    '00000000-0000-0000-0000-000000000006',
    'finance@ptpgp.co.id',
    '4da63bde54fa7f881af7482afa2ab7ab:4e6d7e8f9b0695f893acf447464e33751e8d354fffb045e6652cf16ba0c9016929c9b34e8f69a3c71e52940e756d6f4006d0a7538138553bb37cf4be2a5da109',
    'department_manager',
    'Manager Finance',
    FALSE
  ),
  (
    '00000000-0000-0000-0000-000000000007',
    'operational@ptpgp.co.id',
    'b1a8172258bfb989871fb2af6c579318:3639e8f302c735502127cd505440909130480882bd488999c0ec1caa88333f693b0e9aebd1d04731d4c199a786d55e6e6ef48357ea6a92b823a60ee3f9ae39d3',
    'department_manager',
    'Manager Operational',
    FALSE
  ),
  (
    '00000000-0000-0000-0000-000000000008',
    'procurement@ptpgp.co.id',
    '7bf541846623457dd1a7c210f4e53de8:e16e54e829e7c026cdadf3c0a3e7c9f5c90b09f63bb69c8ed95703d8237d0fe3cf57527a65cc2ba75b5e9ef27a1db788dc75ba52e1f5a39c163e86afc05ef50c',
    'department_manager',
    'Manager Procurement',
    FALSE
  ),
  (
    '00000000-0000-0000-0000-000000000009',
    'projectappraisal@ptpgp.co.id',
    '87ea38da9ca205c5ab0020d52694bf72:a9a212d37beb7408ad1ae3416cd67585ea90be99da00bda537c82340f688b3cc0b912d87058a19d21ab97effadcd5a86147131c25efc3f5abfb7cc98dcd2e7c3',
    'department_manager',
    'Manager Project Appraisal',
    FALSE
  ),
  (
    '00000000-0000-0000-0000-000000000010',
    'mr@ptpgp.co.id',
    '6576e83040bc7965d9fa720046c81cac:25d205c0a4555f4418e06b1a603b74c3ef9c5141177d2a010ad39d2d66335bd4852a086c1a86bd54312fae7be97ed2f69e1d6f8be4292edd5ee48569c69990dc',
    'department_manager',
    'Management Representative',
    FALSE
  ),
  (
    '00000000-0000-0000-0000-000000000011',
    'hse@ptpgp.co.id',
    '213439e872a56912087fbd5afc8d7f3c:72b10f9eea8ed407ccbdb4a75c8db7fef8aa0e96a098514ac18cceda503c61d060fb50ce3b97a76e4f3a8a13110b4ce1a75cfd3494aac47a9d29dbda94d5dc1f',
    'department_manager',
    'Manager HSE',
    FALSE
  )
ON CONFLICT (email) DO UPDATE
  SET password_hash = EXCLUDED.password_hash,
      role          = EXCLUDED.role,
      full_name     = EXCLUDED.full_name,
      updated_at    = NOW();

-- -----------------------------------------------------------------------------
-- Pastikan department manager juga ada di tabel employees supaya
-- getDeptData() bisa lookup department mereka via email.
-- Sesuaikan department dengan struktur org Anda yang sebenarnya.
-- -----------------------------------------------------------------------------
INSERT INTO employees (full_name, email, department, position, join_date, status)
VALUES
  ('Manager HR & GA',          'hrga@ptpgp.co.id',            'HR & GA',                    'Department Manager', '2024-01-01', 'Tetap'),
  ('Manager Finance',          'finance@ptpgp.co.id',         'Finance',                    'Department Manager', '2024-01-01', 'Tetap'),
  ('Manager Operational',      'operational@ptpgp.co.id',     'Operational Division',       'Department Manager', '2024-01-01', 'Tetap'),
  ('Manager Procurement',      'procurement@ptpgp.co.id',     'Procurement Division',       'Department Manager', '2024-01-01', 'Tetap'),
  ('Manager Project Appraisal','projectappraisal@ptpgp.co.id','Project Appraisal',          'Department Manager', '2024-01-01', 'Tetap'),
  ('Management Representative','mr@ptpgp.co.id',              'Management Representative',   'Department Manager', '2024-01-01', 'Tetap'),
  ('Manager HSE',              'hse@ptpgp.co.id',             'Health, Safety & Environment','Department Manager', '2024-01-01', 'Tetap'),
  ('Budi Santoso',             'employee@ptpgp.co.id',        'HR & GA',                    'Staff',              '2024-01-01', 'Tetap'),
  ('Administrator HRD',        'hrd@ptpgp.co.id',             'HR & GA',                    'HRD Administrator',  '2024-01-01', 'Tetap')
ON CONFLICT (email) DO NOTHING;
