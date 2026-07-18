-- Manpower Request Management enhancements, Phase 1+2+3 of the gap analysis
-- against the client's "Enterprise Manpower Request Management" spec:
--   1. Structured master data for Request Type & Request Reason (was: hardcoded
--      arrays in RequestsClient.tsx / free-text textarea).
--   2. Storage for a real, rule-based Validation Engine result (computed from
--      actual data already in this schema — position/org/budget/headcount/
--      internal-mobility/succession — NOT a fabricated "AI" score).
--   3. A dedicated link column so an approved request can auto-create a real
--      vacancy without colliding with lowongan_kerja.source_request_id, which
--      is already used for the unrelated training-request flow.
-- NOT included: the spec's 6-role approval chain (Division Head/HRBP/HR
-- Manager/CEO) and Workload Analysis validation — those roles don't exist in
-- this app's auth system and workload data (production/sales/utilization)
-- isn't tracked anywhere, so faking either would violate this app's
-- established "real data or explicitly absent" principle.

CREATE TABLE IF NOT EXISTS jenis_permintaan_sdm (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  triggers_recruitment BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  urutan INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO jenis_permintaan_sdm (id, code, name, triggers_recruitment, urutan) VALUES
  ('jps-01', 'NEW_POS',     'Posisi Baru',         TRUE,  1),
  ('jps-02', 'REPLACEMENT', 'Replacement',         TRUE,  2),
  ('jps-03', 'ADD_HC',      'Penambahan Formasi',  TRUE,  3),
  ('jps-04', 'TEMP',        'Tenaga Kontrak Sementara', TRUE, 4),
  ('jps-05', 'OUTSOURCE',   'Outsourcing',         FALSE, 5),
  ('jps-06', 'INTERN',      'Magang',              FALSE, 6),
  ('jps-07', 'PROJECT',     'Rekrutmen Proyek',    TRUE,  7),
  ('jps-08', 'SEASONAL',    'Tenaga Musiman',      TRUE,  8),
  ('jps-09', 'PROMOSI',     'Promosi',             FALSE, 9),
  ('jps-10', 'MUTASI',      'Mutasi',              FALSE, 10)
ON CONFLICT (code) DO NOTHING;

CREATE TABLE IF NOT EXISTS alasan_permintaan_sdm (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  urutan INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO alasan_permintaan_sdm (id, code, name, urutan) VALUES
  ('aps-01', 'RESIGN',       'Resign', 1),
  ('aps-02', 'RETIRE',       'Pensiun', 2),
  ('aps-03', 'EXPANSION',    'Ekspansi Bisnis', 3),
  ('aps-04', 'NEW_BUSINESS', 'Lini Bisnis Baru', 4),
  ('aps-05', 'PROMOTION',    'Promosi Karyawan', 5),
  ('aps-06', 'MUTATION',     'Mutasi Karyawan', 6),
  ('aps-07', 'LONG_LEAVE',   'Cuti Panjang', 7),
  ('aps-08', 'MATERNITY',    'Cuti Melahirkan', 8),
  ('aps-09', 'WORKLOAD',     'Peningkatan Beban Kerja', 9),
  ('aps-10', 'PROJECT',      'Kebutuhan Proyek', 10),
  ('aps-11', 'PRODUCTIVITY', 'Peningkatan Produktivitas', 11)
ON CONFLICT (code) DO NOTHING;

-- Additive columns on the existing request table — reason_category_id is a
-- structured pointer alongside the existing free-text `reason` (kept as
-- supplementary detail, not replaced, so no existing data/behavior breaks).
ALTER TABLE permintaan_sdm ADD COLUMN IF NOT EXISTS request_type_id TEXT REFERENCES jenis_permintaan_sdm(id);
ALTER TABLE permintaan_sdm ADD COLUMN IF NOT EXISTS reason_category_id TEXT REFERENCES alasan_permintaan_sdm(id);
ALTER TABLE permintaan_sdm ADD COLUMN IF NOT EXISTS validation_result JSONB;
ALTER TABLE permintaan_sdm ADD COLUMN IF NOT EXISTS validated_at TIMESTAMPTZ;

ALTER TABLE lowongan_kerja ADD COLUMN IF NOT EXISTS manpower_request_id TEXT REFERENCES permintaan_sdm(id);
