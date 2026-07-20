-- ============================================================================
-- CANDIDATE PIPELINE DUMMY DATA SEED — run after recruitment intelligence and
-- hiring workflow migrations to seed rich candidate data.
--
-- Cohesively seeds:
--  - pelamar (spanning all 5 stages of the pipeline: Menunggu Review, Tes Tulis & Psikotes, Interview, Diterima, Ditolak)
--  - interview_scores (HR, User, Director panel scores)
--  - hiring_approval_steps (hiring approval chain HR -> Dept Head -> Finance -> Director)
--  - recruitment_channel (ensuring channel links work)
--  - talent_pool integration (flagged in_talent_pool with notes)
--
-- FIXED: Uses proper UUID format for all IDs to be compatible regardless of
-- whether the column type is UUID or TEXT in the target database.
-- ============================================================================

DO $$
DECLARE
  v_job1 TEXT := 'a0000000-0000-0000-0000-000000000001';
  v_job2 TEXT := 'a0000000-0000-0000-0000-000000000002';
  v_pel1 TEXT := 'b0000000-0000-0000-0000-000000000001';
  v_pel2 TEXT := 'b0000000-0000-0000-0000-000000000002';
  v_pel3 TEXT := 'b0000000-0000-0000-0000-000000000003';
  v_pel4 TEXT := 'b0000000-0000-0000-0000-000000000004';
  v_pel5 TEXT := 'b0000000-0000-0000-0000-000000000005';
  v_pel6 TEXT := 'b0000000-0000-0000-0000-000000000006';
BEGIN

  -- ── Ensure job_id column accepts TEXT (fix in case migration was missed) ───
  BEGIN
    ALTER TABLE pelamar ALTER COLUMN job_id TYPE TEXT;
  EXCEPTION WHEN OTHERS THEN
    NULL; -- already TEXT or cannot alter, continue
  END;

  -- ── Insert/Ensure lowongan_kerja first ─────────────────────────────────────
  INSERT INTO lowongan_kerja (id, position, title, department, status, description) VALUES
    (v_job1, 'Staff PPJK (Kepabeanan)', 'Staff PPJK (Kepabeanan)', 'Operational Division', 'Open',
      'Membutuhkan staff PPJK berpengalaman minimal 1 tahun di bidang kepabeanan dan ekspor-impor.'),
    (v_job2, 'Staff Procurement', 'Staff Procurement', 'Procurement Division', 'Open',
      'Membutuhkan staff procurement berpengalaman minimal 1 tahun.')
  ON CONFLICT (id) DO NOTHING;

  -- ── Insert/Ensure recruitment channels ────────────────────────────────────
  INSERT INTO recruitment_channel (id, code, name, urutan) VALUES
    ('rc-01', 'CAREER_SITE', 'Career Website', 1),
    ('rc-02', 'LINKEDIN',    'LinkedIn', 2),
    ('rc-03', 'JOBSTREET',   'Jobstreet', 3),
    ('rc-04', 'KALIBRR',     'Kalibrr', 4),
    ('rc-05', 'GLINTS',      'Glints', 5)
  ON CONFLICT (code) DO NOTHING;

  -- ── 1. STAGE: Menunggu Review ──────────────────────────────────────────────

  -- Pelamar 1: Budi Prasetyo (LinkedIn, match score 82%, resume terisi)
  INSERT INTO pelamar (
    id, job_id, full_name, email, phone, status, applied_at, channel_id, match_score, match_detail, resume_url
  ) VALUES (
    v_pel1, v_job1, 'Budi Prasetyo', 'budi.prasetyo@example.com', '081234567890',
    'Menunggu Review', CURRENT_TIMESTAMP - INTERVAL '2 days', 'rc-02', 82,
    '{"skills_match": ["Customs Clearance", "PIB/PEB"], "experience_match": "2 years", "education_match": "D3 Kepabeanan"}'::jsonb,
    '{"headline": "Experienced Customs & PPJK Specialist", "summary": "Specialist in customs clearance, PIB/PEB documentation, and export-import regulations with 2+ years of hands-on experience.", "location": "Jakarta, Indonesia", "linkedin": "linkedin.com/in/budiprasetyo", "skills": ["Customs Clearance", "PIB/PEB", "Export-Import", "Logistics", "Ms Excel"], "experiences": [{"position": "Staff PPJK Assistant", "company": "PT Logistik Sejahtera", "start": "2024", "end": "2026", "current": false}], "educations": [{"school": "Politeknik Bea Cukai", "degree": "D3", "field": "Kepabeanan & Cukai", "start": "2021", "end": "2024", "current": false}]}'
  ) ON CONFLICT (id) DO NOTHING;

  -- Pelamar 2: Dewi Lestari (Glints, match score 45%, data minimal)
  INSERT INTO pelamar (
    id, job_id, full_name, email, phone, status, applied_at, channel_id, match_score, match_detail, resume_url
  ) VALUES (
    v_pel2, v_job1, 'Dewi Lestari', 'dewi.lestari@example.com', '081244445555',
    'Menunggu Review', CURRENT_TIMESTAMP - INTERVAL '3 days', 'rc-05', 45,
    '{"skills_match": ["Ms Excel"], "experience_match": "None", "education_match": "SMA"}'::jsonb,
    '{"headline": "Administrative Generalist", "summary": "General administration assistant, looking to pivot into logistics and customs operations.", "location": "Bekasi, Indonesia", "skills": ["Ms Office", "Data Entry", "Filing"], "experiences": [{"position": "Admin Staff", "company": "Toko Retail Sukses", "start": "2024", "end": "2025", "current": false}], "educations": [{"school": "SMAN 1 Bekasi", "degree": "SMA", "field": "IPS", "start": "2020", "end": "2023", "current": false}]}'
  ) ON CONFLICT (id) DO NOTHING;

  -- ── 2. STAGE: Tes Tulis & Psikotes ────────────────────────────────────────

  -- Pelamar 3: Siti Aminah (Jobstreet, match score 78%, tes tulis 85% Lulus, psikotes 82%)
  INSERT INTO pelamar (
    id, job_id, full_name, email, phone, status, applied_at, channel_id, match_score, match_detail,
    test_tulis_result, test_psikotes_result, resume_url
  ) VALUES (
    v_pel3, v_job1, 'Siti Aminah', 'siti.aminah@example.com', '081298765432',
    'Tes Tulis & Psikotes', CURRENT_TIMESTAMP - INTERVAL '5 days', 'rc-03', 78,
    '{"skills_match": ["Customs Regulation", "Incoterms"], "experience_match": "Internship", "education_match": "S1 Administrasi"}'::jsonb,
    '{"passed": true, "score": 85, "test_title": "Tes Pengetahuan Freight Forwarding"}'::jsonb,
    '{"overall": 82, "dimensions": {"Integritas": 90, "Kerjasama Tim": 80, "Adaptasi": 85, "Orientasi Hasil": 75, "Komunikasi": 80}}'::jsonb,
    '{"headline": "Fresh Graduate in Customs Administration", "summary": "Detail-oriented customs graduate with deep knowledge in import-export procedures and tariff classifications.", "location": "Tangerang, Indonesia", "linkedin": "linkedin.com/in/sitiaminah", "skills": ["Customs Regulation", "Freight Forwarding", "Incoterms", "Import/Export"], "experiences": [{"position": "Intern Customs Officer", "company": "KPPBC Tanjung Priok", "start": "2025", "end": "2025", "current": false}], "educations": [{"school": "Universitas Indonesia", "degree": "S1", "field": "Administrasi Imigrasi & Kepabeanan", "start": "2021", "end": "2025", "current": false}]}'
  ) ON CONFLICT (id) DO NOTHING;

  -- ── 3. STAGE: Interview ────────────────────────────────────────────────────

  -- Pelamar 4: Rian Hidayat (Web Karir, match score 90%)
  INSERT INTO pelamar (
    id, job_id, full_name, email, phone, status, applied_at, channel_id, match_score, match_detail,
    reached_interview, test_tulis_result, test_psikotes_result,
    interview_date, interview_time, interviewer, interview_location, interview_online_link, interview_notes,
    background_check_status, background_check_notes, background_check_at,
    medical_checkup_status, medical_checkup_notes, medical_checkup_at,
    final_score, final_score_detail,
    salary_expectation, offered_salary, negotiation_status, negotiation_notes,
    resume_url
  ) VALUES (
    v_pel4, v_job1, 'Rian Hidayat', 'rian.hidayat@example.com', '081345678901',
    'Interview', CURRENT_TIMESTAMP - INTERVAL '10 days', 'rc-01', 90,
    '{"skills_match": ["Customs Clearance", "PIB/PEB", "Freight Forwarding"], "experience_match": "3 years", "education_match": "D3"}'::jsonb,
    TRUE,
    '{"passed": true, "score": 90, "test_title": "Tes Pengetahuan Freight Forwarding"}'::jsonb,
    '{"overall": 85, "dimensions": {"Integritas": 85, "Kerjasama Tim": 90, "Adaptasi": 80, "Orientasi Hasil": 85, "Komunikasi": 85}}'::jsonb,
    to_char(CURRENT_DATE + 2, 'YYYY-MM-DD'), '10:00', 'Budi Santoso & Wawan Setiadi',
    'Kantor Pusat PGP Room 302', 'https://meet.google.com/abc-defg-hij',
    'Wawancara teknis mengenai regulasi kepabeanan terbaru dan pengurusan dokumen PIB/PEB.',
    'Bersih', 'Tidak ada catatan negatif dari riwayat kerja sebelumnya.', CURRENT_TIMESTAMP - INTERVAL '1 day',
    'Fit', 'Kondisi fisik prima, siap bekerja.', CURRENT_TIMESTAMP - INTERVAL '1 day',
    89, '{"score": 89, "evaluator_notes": "Sangat kompeten dibidang operasional lapangan."}'::jsonb,
    7500000, 7000000, 'offered', 'HRD menawarkan gaji pokok 7.000.000 dengan tunjangan makan & transport.',
    '{"headline": "Experienced Customs Broker", "summary": "Licensed customs broker with 3 years of experience in managing customs clearance, cargo forwarding, and PIB/PEB documentation.", "location": "Jakarta Utara, Indonesia", "linkedin": "linkedin.com/in/rianhidayat", "skills": ["Customs Clearance", "PIB/PEB", "Freight Forwarding", "Export-Import", "Customer Relations"], "experiences": [{"position": "PPJK Admin Staff", "company": "PT Forwarding Cepat", "start": "2023", "end": "2026", "current": false}], "educations": [{"school": "STMT Trisakti", "degree": "D3", "field": "Manajemen Transpor Laut", "start": "2020", "end": "2023", "current": false}]}'
  ) ON CONFLICT (id) DO NOTHING;

  -- Panel Interview Scores for Pelamar 4
  INSERT INTO interview_scores (id, application_id, panel_role, panelist_name, score, notes) VALUES
    ('c0000000-0000-0000-0004-000000000001', v_pel4, 'HR', 'Budi Santoso', 88, 'Komunikasi sangat baik, memiliki motivasi tinggi.'),
    ('c0000000-0000-0000-0004-000000000002', v_pel4, 'User/Dept Manager', 'Wawan Setiadi', 92, 'Sangat memahami regulasi kepabeanan, menguasai pengisian PIB/PEB.'),
    ('c0000000-0000-0000-0004-000000000003', v_pel4, 'Director', 'Ade Fajar Nurcahman', 85, 'Sikap baik, profesional, dan siap bekerja lembur jika dibutuhkan.')
  ON CONFLICT (id) DO NOTHING;

  -- Hiring Approval Steps for Pelamar 4 (HR & Dept Head Approved, Finance & Director Pending)
  INSERT INTO hiring_approval_steps (id, application_id, step_number, approver_role, status, approved_by, approved_at, notes) VALUES
    ('d0000000-0000-0000-0004-000000000001', v_pel4, 1, 'HR',              'Approved', 'hrd@ptpgp.co.id',         CURRENT_TIMESTAMP - INTERVAL '3 days', 'Kandidat sangat memenuhi kualifikasi.'),
    ('d0000000-0000-0000-0004-000000000002', v_pel4, 2, 'Department Head', 'Approved', 'operational@ptpgp.co.id', CURRENT_TIMESTAMP - INTERVAL '2 days', 'Disetujui dari sisi kompetensi operasional.'),
    ('d0000000-0000-0000-0004-000000000003', v_pel4, 3, 'Finance',         'Pending',  NULL, NULL, NULL),
    ('d0000000-0000-0000-0004-000000000004', v_pel4, 4, 'Director',        'Pending',  NULL, NULL, NULL)
  ON CONFLICT (id) DO NOTHING;

  -- ── 4. STAGE: Diterima (Hired) ─────────────────────────────────────────────

  -- Pelamar 5: Anita Wijaya (LinkedIn, match score 95%, fully approved, agreed offer)
  INSERT INTO pelamar (
    id, job_id, full_name, email, phone, status, applied_at, channel_id, match_score, match_detail,
    reached_interview, test_tulis_result, test_psikotes_result,
    background_check_status, background_check_notes, background_check_at,
    medical_checkup_status, medical_checkup_notes, medical_checkup_at,
    final_score, final_score_detail,
    salary_expectation, offered_salary, final_salary, negotiation_status,
    offer_letter_content, offer_letter_status, offer_letter_sent_at, offer_letter_responded_at,
    resume_url
  ) VALUES (
    v_pel5, v_job2, 'Anita Wijaya', 'anita.wijaya@example.com', '081388889999',
    'Diterima', CURRENT_TIMESTAMP - INTERVAL '15 days', 'rc-02', 95,
    '{"skills_match": ["Procurement", "Sourcing"], "experience_match": "2 years", "education_match": "S1"}'::jsonb,
    TRUE,
    '{"passed": true, "score": 95, "test_title": "Tes Pengetahuan Procurement"}'::jsonb,
    '{"overall": 90, "dimensions": {"Integritas": 95, "Kerjasama Tim": 85, "Adaptasi": 90, "Orientasi Hasil": 90, "Komunikasi": 90}}'::jsonb,
    'Bersih', 'Verifikasi referensi kerja bersih.', CURRENT_TIMESTAMP - INTERVAL '5 days',
    'Fit', 'Hasil lab MCU normal dan fit untuk bekerja.', CURRENT_TIMESTAMP - INTERVAL '5 days',
    93, '{"score": 93, "evaluator_notes": "Kandidat terbaik dengan pengalaman negosiasi vendor yang solid."}'::jsonb,
    8000000, 8000000, 8000000, 'agreed',
    'Surat Penawaran Kerja Resmi untuk Staff Procurement...', 'Diterima',
    CURRENT_TIMESTAMP - INTERVAL '4 days', CURRENT_TIMESTAMP - INTERVAL '3 days',
    '{"headline": "Procurement Specialist", "summary": "Experienced procurement officer specialized in vendor management, cost negotiation, and supply chain operations.", "location": "Jakarta Barat, Indonesia", "linkedin": "linkedin.com/in/anitawijaya", "skills": ["Procurement", "Vendor Negotiation", "Sourcing", "Supply Chain", "ERP Systems"], "experiences": [{"position": "Procurement Staff", "company": "PT Dagang Nusantara", "start": "2024", "end": "2026", "current": false}], "educations": [{"school": "Universitas Bina Nusantara", "degree": "S1", "field": "Manajemen Bisnis", "start": "2020", "end": "2024", "current": false}]}'
  ) ON CONFLICT (id) DO NOTHING;

  -- Panel Interview Scores for Pelamar 5
  INSERT INTO interview_scores (id, application_id, panel_role, panelist_name, score, notes) VALUES
    ('c0000000-0000-0000-0005-000000000001', v_pel5, 'HR', 'Budi Santoso', 90, 'Komunikasi sangat bagus, berorientasi target.'),
    ('c0000000-0000-0000-0005-000000000002', v_pel5, 'User/Dept Manager', 'Galih Aditya', 95, 'Memiliki kemampuan negosiasi vendor yang luar biasa.'),
    ('c0000000-0000-0000-0005-000000000003', v_pel5, 'Director', 'Ade Fajar Nurcahman', 90, 'Visi bagus dan sejalan dengan kebutuhan departemen.')
  ON CONFLICT (id) DO NOTHING;

  -- Hiring Approval Steps for Pelamar 5 (All Approved)
  INSERT INTO hiring_approval_steps (id, application_id, step_number, approver_role, status, approved_by, approved_at, notes) VALUES
    ('d0000000-0000-0000-0005-000000000001', v_pel5, 1, 'HR',              'Approved', 'hrd@ptpgp.co.id',          CURRENT_TIMESTAMP - INTERVAL '7 days', 'Kandidat sangat potensial.'),
    ('d0000000-0000-0000-0005-000000000002', v_pel5, 2, 'Department Head', 'Approved', 'procurement@ptpgp.co.id',  CURRENT_TIMESTAMP - INTERVAL '6 days', 'Sesuai dengan kebutuhan divisi.'),
    ('d0000000-0000-0000-0005-000000000003', v_pel5, 3, 'Finance',         'Approved', 'finance@ptpgp.co.id',      CURRENT_TIMESTAMP - INTERVAL '5 days', 'Budget gaji tersedia.'),
    ('d0000000-0000-0000-0005-000000000004', v_pel5, 4, 'Director',        'Approved', 'director@ptpgp.co.id',     CURRENT_TIMESTAMP - INTERVAL '4 days', 'Disetujui untuk direkrut.')
  ON CONFLICT (id) DO NOTHING;

  -- ── 5. STAGE: Ditolak & Masuk Talent Pool ─────────────────────────────────

  -- Pelamar 6: Deni Setiawan (Jobstreet, match score 72%, ditolak, masuk Talent Pool)
  INSERT INTO pelamar (
    id, job_id, full_name, email, phone, status, applied_at, channel_id, match_score, match_detail,
    reached_interview, test_tulis_result, test_psikotes_result,
    in_talent_pool, talent_pool_notes, talent_pool_added_at,
    resume_url
  ) VALUES (
    v_pel6, v_job1, 'Deni Setiawan', 'deni.setiawan@example.com', '081277778888',
    'Ditolak', CURRENT_TIMESTAMP - INTERVAL '12 days', 'rc-03', 72,
    '{"skills_match": ["Customs Clearance"], "experience_match": "1 year", "education_match": "D3"}'::jsonb,
    TRUE,
    '{"passed": true, "score": 75, "test_title": "Tes Pengetahuan Freight Forwarding"}'::jsonb,
    '{"overall": 70, "dimensions": {"Integritas": 75, "Kerjasama Tim": 70, "Adaptasi": 70, "Orientasi Hasil": 70, "Komunikasi": 65}}'::jsonb,
    TRUE,
    'Kandidat cukup baik, namun kalah saing dengan kandidat lain yang memiliki pengalaman operasional lapangan lebih matang. Disimpan untuk lowongan berikutnya.',
    CURRENT_TIMESTAMP - INTERVAL '1 day',
    '{"headline": "Junior Staff PPJK", "summary": "Hardworking junior staff PPJK with 1 year of experience handling customs documents and logistics operations.", "location": "Jakarta Timur, Indonesia", "skills": ["Customs Clearance", "PIB/PEB", "Ms Office"], "experiences": [{"position": "Junior Admin PPJK", "company": "PT Cargo Cepat", "start": "2025", "end": "2026", "current": false}], "educations": [{"school": "STMT Trisakti", "degree": "D3", "field": "Logistik", "start": "2021", "end": "2024", "current": false}]}'
  ) ON CONFLICT (id) DO NOTHING;

  -- Panel Interview Scores for Pelamar 6
  INSERT INTO interview_scores (id, application_id, panel_role, panelist_name, score, notes) VALUES
    ('c0000000-0000-0000-0006-000000000001', v_pel6, 'HR', 'Budi Santoso', 70, 'Sikap baik, komunikasi standar.'),
    ('c0000000-0000-0000-0006-000000000002', v_pel6, 'User/Dept Manager', 'Wawan Setiadi', 72, 'Pemahaman teori PPJK oke, namun kurang jam terbang lapangan.')
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'Seed candidate pipeline selesai: 2 lowongan, 6 pelamar, interview scores, hiring approvals.';

EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Error seeding candidate pipeline: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
END $$;
