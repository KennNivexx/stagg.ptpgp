-- Comprehensive fix for schema-drift bugs found by auditing every
-- insert()/upsert() call in src/app/actions/*.ts against the live database
-- schema (via PostgREST's OpenAPI introspection). Same root cause as
-- 20260727001/20260730001/20260731001: several migrations were written but
-- never actually applied to production, and in a couple of cases a migration
-- targeted an old pre-rename English table name that no longer exists. Every
-- statement below is additive (ADD COLUMN IF NOT EXISTS) — safe to re-run,
-- touches no existing data.

-- ── 20260712001_org_design_overhaul.sql never fully applied: jabatan is
-- missing is_kepala_unit/status/is_master, breaking Master Jabatan CRUD
-- (src/app/actions/positions.ts saveJabatan-style insert).
ALTER TABLE jabatan ADD COLUMN IF NOT EXISTS is_kepala_unit BOOLEAN DEFAULT FALSE;
ALTER TABLE jabatan ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Aktif' CHECK (status IN ('Aktif','Nonaktif'));
ALTER TABLE jabatan ADD COLUMN IF NOT EXISTS is_master BOOLEAN DEFAULT FALSE;
ALTER TABLE deskripsi_kerja ADD COLUMN IF NOT EXISTS jabatan_id TEXT REFERENCES jabatan(id);
ALTER TABLE spesifikasi_kerja ADD COLUMN IF NOT EXISTS jabatan_id TEXT REFERENCES jabatan(id);

-- `kode` (hierarchical org code, e.g. "1.1.2.1.1.0.0") was never defined in
-- any migration at all — saveJobDesc()/saveJobSpec() in jobdesc.ts/jobspec.ts
-- have always tried to insert it, so both save flows have always failed.
ALTER TABLE deskripsi_kerja ADD COLUMN IF NOT EXISTS kode TEXT;
ALTER TABLE spesifikasi_kerja ADD COLUMN IF NOT EXISTS kode TEXT;

-- ── 20260714001_competency_position_link.sql never applied: breaks
-- saveRequiredLevel() (Competency Library) and createDevelopmentPlan()/
-- createIdpFromGap() (Career Development Plans) in career-hrd.ts/skills.ts.
ALTER TABLE kompetensi_jabatan ADD COLUMN IF NOT EXISTS jabatan_id TEXT REFERENCES jabatan(id);
ALTER TABLE master_kompetensi ADD COLUMN IF NOT EXISTS jenis_kompetensi TEXT DEFAULT 'Hard Skill' CHECK (jenis_kompetensi IN ('Hard Skill','Soft Skill'));
ALTER TABLE rencana_pengembangan ADD COLUMN IF NOT EXISTS skill_id TEXT REFERENCES master_kompetensi(id);
ALTER TABLE rencana_pengembangan ADD COLUMN IF NOT EXISTS jenis_aksi TEXT DEFAULT 'Training' CHECK (jenis_aksi IN ('Coaching','Mentoring','OJT','Training','Sertifikasi'));
ALTER TABLE rencana_pengembangan ADD COLUMN IF NOT EXISTS gap_value INTEGER;

-- ── 20260716001_knowledge_management.sql never applied: breaks savePolicy(),
-- saveArticle(), saveVideo() (all in knowledge.ts) — Knowledge Management
-- has never been able to save a policy, article, or video.
ALTER TABLE kebijakan_perusahaan ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Published';
ALTER TABLE kebijakan_perusahaan ADD COLUMN IF NOT EXISTS expiry_date DATE;
ALTER TABLE kebijakan_perusahaan ADD COLUMN IF NOT EXISTS mandatory BOOLEAN DEFAULT FALSE;
ALTER TABLE kebijakan_perusahaan ADD COLUMN IF NOT EXISTS media_type TEXT DEFAULT 'PDF';

ALTER TABLE artikel_pengetahuan ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Published';
ALTER TABLE artikel_pengetahuan ADD COLUMN IF NOT EXISTS version TEXT DEFAULT 'v1.0';
ALTER TABLE artikel_pengetahuan ADD COLUMN IF NOT EXISTS effective_date DATE;
ALTER TABLE artikel_pengetahuan ADD COLUMN IF NOT EXISTS expiry_date DATE;
ALTER TABLE artikel_pengetahuan ADD COLUMN IF NOT EXISTS mandatory BOOLEAN DEFAULT FALSE;
ALTER TABLE artikel_pengetahuan ADD COLUMN IF NOT EXISTS media_type TEXT DEFAULT 'HTML';

ALTER TABLE video_pelatihan ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Published';
ALTER TABLE video_pelatihan ADD COLUMN IF NOT EXISTS version TEXT DEFAULT 'v1.0';
ALTER TABLE video_pelatihan ADD COLUMN IF NOT EXISTS sme TEXT;
ALTER TABLE video_pelatihan ADD COLUMN IF NOT EXISTS effective_date DATE;
ALTER TABLE video_pelatihan ADD COLUMN IF NOT EXISTS expiry_date DATE;
ALTER TABLE video_pelatihan ADD COLUMN IF NOT EXISTS mandatory BOOLEAN DEFAULT FALSE;
ALTER TABLE video_pelatihan ADD COLUMN IF NOT EXISTS media_type TEXT DEFAULT 'MP4';
ALTER TABLE video_pelatihan ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE dokumen_sop ADD COLUMN IF NOT EXISTS sme TEXT;
ALTER TABLE dokumen_sop ADD COLUMN IF NOT EXISTS effective_date DATE;
ALTER TABLE dokumen_sop ADD COLUMN IF NOT EXISTS expiry_date DATE;
ALTER TABLE dokumen_sop ADD COLUMN IF NOT EXISTS mandatory BOOLEAN DEFAULT FALSE;
ALTER TABLE dokumen_sop ADD COLUMN IF NOT EXISTS media_type TEXT DEFAULT 'PDF';

-- ── 20260704005_hrd_files_bucket.sql targeted the pre-rename table name
-- `sop_documents`, which no longer exists (renamed to `dokumen_sop`) — same
-- rename-drift bug as `payroll`->`penggajian`. saveSop() has never been able
-- to save a document URL.
ALTER TABLE dokumen_sop ADD COLUMN IF NOT EXISTS document_url TEXT;

-- ── pesan_kontak: the public Contact Us form (src/app/actions/contact.ts)
-- has always sent a `company` field that no column existed for, so EVERY
-- submission through the public website contact form has always failed.
ALTER TABLE pesan_kontak ADD COLUMN IF NOT EXISTS company TEXT;

-- ── vendor: registerVendor()/submitQuotation() (src/app/actions/vendor.ts,
-- both public e-procurement pages) use a company_name/company_email/
-- company_phone/npwp/nib/business_type naming scheme that has never existed
-- on this table (it only has name/contact_person/phone/email) — vendor
-- registration and quotation submission have never worked. Adding the
-- columns the app actually uses; the original name/contact_person/phone/
-- email columns are left untouched (unused by current code, but not dropped
-- in case of existing data or other readers).
ALTER TABLE vendor ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE vendor ADD COLUMN IF NOT EXISTS company_email TEXT;
ALTER TABLE vendor ADD COLUMN IF NOT EXISTS company_phone TEXT;
ALTER TABLE vendor ADD COLUMN IF NOT EXISTS npwp TEXT;
ALTER TABLE vendor ADD COLUMN IF NOT EXISTS nib TEXT;
ALTER TABLE vendor ADD COLUMN IF NOT EXISTS business_type TEXT;
