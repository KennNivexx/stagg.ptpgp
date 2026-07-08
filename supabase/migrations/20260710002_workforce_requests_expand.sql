-- Perluasan modul Permintaan SDM: field organisasi tambahan, budget,
-- KPI/Kompetensi jabatan, dokumen pendukung, approval Finance (opsional),
-- dan progres funnel rekrutmen. Kolom id/kode existing (req-{uuid},
-- grade_code, dsb) TIDAK diubah — hanya menambah kolom baru.

-- Organisasi berjenjang: struktur Organisasi > Divisi > Department > Seksi >
-- Unit Kerja sudah ada lewat tabel org_units (code berjenjang + parent_code).
-- Yang belum ada hanya Lokasi/Site dan Cost Center, ditambahkan di sini.
ALTER TABLE workforce_requests ADD COLUMN IF NOT EXISTS site_location TEXT;
ALTER TABLE workforce_requests ADD COLUMN IF NOT EXISTS cost_center TEXT;

-- Budget Kebutuhan SDM
ALTER TABLE workforce_requests ADD COLUMN IF NOT EXISTS salary_range_min NUMERIC;
ALTER TABLE workforce_requests ADD COLUMN IF NOT EXISTS salary_range_max NUMERIC;
ALTER TABLE workforce_requests ADD COLUMN IF NOT EXISTS budget_recruitment NUMERIC;
ALTER TABLE workforce_requests ADD COLUMN IF NOT EXISTS budget_available BOOLEAN DEFAULT false;
ALTER TABLE workforce_requests ADD COLUMN IF NOT EXISTS budget_approved_by TEXT;

-- KPI Jabatan (belum ada tabel KPI per-posisi terpisah di sistem ini, jadi
-- disimpan sebagai catatan bebas per-request, diisi manual oleh HRD)
ALTER TABLE workforce_requests ADD COLUMN IF NOT EXISTS kpi_jabatan TEXT;

-- Dokumen pendukung (JD, org chart, budget approval, TOR, dll)
ALTER TABLE workforce_requests ADD COLUMN IF NOT EXISTS document_urls JSONB DEFAULT '[]'::jsonb;

-- Approval Finance Controller (opsional) — di-toggle oleh HRD saat forward;
-- tidak menambah role baru, ditandatangani oleh hrd/director yang bertindak
-- sebagai Finance Controller karena sistem belum punya role finance terpisah.
ALTER TABLE workforce_requests ADD COLUMN IF NOT EXISTS finance_required BOOLEAN DEFAULT false;
ALTER TABLE workforce_requests ADD COLUMN IF NOT EXISTS finance_approved BOOLEAN DEFAULT false;
ALTER TABLE workforce_requests ADD COLUMN IF NOT EXISTS finance_approved_by TEXT;
ALTER TABLE workforce_requests ADD COLUMN IF NOT EXISTS finance_approved_at TIMESTAMPTZ;

-- Progres funnel rekrutmen setelah Disetujui (digerakkan manual oleh HRD;
-- tidak otomatis tersambung ke modul rekrutmen terpisah)
ALTER TABLE workforce_requests ADD COLUMN IF NOT EXISTS recruitment_stage TEXT;

-- Alasan pembatalan (Dibatalkan, terpisah dari Ditolak)
ALTER TABLE workforce_requests ADD COLUMN IF NOT EXISTS cancel_reason TEXT;

-- Tools/software wajib dikuasai ditampilkan dari kategori skill "Teknis" yang
-- sudah ada (lihat getDeptRequiredSkills) — tidak perlu kolom baru.
