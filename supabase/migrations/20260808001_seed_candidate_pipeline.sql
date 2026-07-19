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
-- ============================================================================

DO $$
BEGIN
  -- Insert/Ensure lowongan_kerja first
  INSERT INTO lowongan_kerja (id, position, title, department, status, description) VALUES
    ('demo-job-01', 'Staff PPJK (Kepabeanan)', 'Staff PPJK (Kepabeanan)', 'Operational Division', 'Open', 'Membutuhkan staff PPJK berpengalaman minimal 1 tahun di bidang kepabeanan dan ekspor-impor.'),
    ('demo-job-02', 'Staff Procurement', 'Staff Procurement', 'Procurement Division', 'Open', 'Membutuhkan staff procurement berpengalaman minimal 1 tahun.')
  ON CONFLICT (id) DO NOTHING;

  -- Insert/Ensure recruitment channels
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
    'pel-dummy-01', 'demo-job-01', 'Budi Prasetyo', 'budi.prasetyo@example.com', '081234567890', 'Menunggu Review', CURRENT_TIMESTAMP - INTERVAL '2 days', 'rc-02', 82, 
    '{"skills_match": ["Customs Clearance", "PIB/PEB"], "experience_match": "2 years", "education_match": "D3 Kepabeanan"}'::jsonb,
    $resume${
      "headline": "Experienced Customs & PPJK Specialist",
      "summary": "Specialist in customs clearance, PIB/PEB documentation, and export-import regulations with 2+ years of hands-on experience.",
      "location": "Jakarta, Indonesia",
      "linkedin": "linkedin.com/in/budiprasetyo",
      "skills": ["Customs Clearance", "PIB/PEB", "Export-Import", "Logistics", "Ms Excel"],
      "experiences": [
        {
          "position": "Staff PPJK Assistant",
          "company": "PT Logistik Sejahtera",
          "start": "2024",
          "end": "2026",
          "current": false
        }
      ],
      "educations": [
        {
          "school": "Politeknik Bea Cukai",
          "degree": "D3",
          "field": "Kepabeanan & Cukai",
          "start": "2021",
          "end": "2024",
          "current": false
        }
      ]
    }$resume$
  ) ON CONFLICT (id) DO NOTHING;

  -- Pelamar 2: Dewi Lestari (Glints, match score 45%, data minimal)
  INSERT INTO pelamar (
    id, job_id, full_name, email, phone, status, applied_at, channel_id, match_score, match_detail, resume_url
  ) VALUES (
    'pel-dummy-02', 'demo-job-01', 'Dewi Lestari', 'dewi.lestari@example.com', '081244445555', 'Menunggu Review', CURRENT_TIMESTAMP - INTERVAL '3 days', 'rc-05', 45,
    '{"skills_match": ["Ms Excel"], "experience_match": "None", "education_match": "SMA"}'::jsonb,
    $resume${
      "headline": "Administrative Generalist",
      "summary": "General administration assistant, looking to pivot into logistics and customs operations.",
      "location": "Bekasi, Indonesia",
      "skills": ["Ms Office", "Data Entry", "Filing"],
      "experiences": [
        {
          "position": "Admin Staff",
          "company": "Toko Retail Sukses",
          "start": "2024",
          "end": "2025",
          "current": false
        }
      ],
      "educations": [
        {
          "school": "SMAN 1 Bekasi",
          "degree": "SMA",
          "field": "IPS",
          "start": "2020",
          "end": "2023",
          "current": false
        }
      ]
    }$resume$
  ) ON CONFLICT (id) DO NOTHING;

  -- ── 2. STAGE: Tes Tulis & Psikotes ────────────────────────────────────────
  
  -- Pelamar 3: Siti Aminah (Jobstreet, match score 78%, hasil tes tulis 85% Lulus, hasil psikotes 82%)
  INSERT INTO pelamar (
    id, job_id, full_name, email, phone, status, applied_at, channel_id, match_score, match_detail, test_tulis_result, test_psikotes_result, resume_url
  ) VALUES (
    'pel-dummy-03', 'demo-job-01', 'Siti Aminah', 'siti.aminah@example.com', '081298765432', 'Tes Tulis & Psikotes', CURRENT_TIMESTAMP - INTERVAL '5 days', 'rc-03', 78,
    '{"skills_match": ["Customs Regulation", "Incoterms"], "experience_match": "Internship", "education_match": "S1 Administrasi"}'::jsonb,
    '{"passed": true, "score": 85, "test_title": "Tes Pengetahuan Freight Forwarding"}'::jsonb,
    '{"overall": 82, "dimensions": {"Integritas": 90, "Kerjasama Tim": 80, "Adaptasi": 85, "Orientasi Hasil": 75, "Komunikasi": 80}}'::jsonb,
    $resume${
      "headline": "Fresh Graduate in Customs Administration",
      "summary": "Detail-oriented customs graduate with deep knowledge in import-export procedures and tariff classifications.",
      "location": "Tangerang, Indonesia",
      "linkedin": "linkedin.com/in/sitiaminah",
      "skills": ["Customs Regulation", "Freight Forwarding", "Incoterms", "Import/Export"],
      "experiences": [
        {
          "position": "Intern Customs Officer",
          "company": "KPPBC Tanjung Priok",
          "start": "2025",
          "end": "2025",
          "current": false
        }
      ],
      "educations": [
        {
          "school": "Universitas Indonesia",
          "degree": "S1",
          "field": "Administrasi Imigrasi & Kepabeanan",
          "start": "2021",
          "end": "2025",
          "current": false
        }
      ]
    }$resume$
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
    'pel-dummy-04', 'demo-job-01', 'Rian Hidayat', 'rian.hidayat@example.com', '081345678901', 'Interview', CURRENT_TIMESTAMP - INTERVAL '10 days', 'rc-01', 90,
    '{"skills_match": ["Customs Clearance", "PIB/PEB", "Freight Forwarding"], "experience_match": "3 years", "education_match": "D3"}'::jsonb,
    TRUE,
    '{"passed": true, "score": 90, "test_title": "Tes Pengetahuan Freight Forwarding"}'::jsonb,
    '{"overall": 85, "dimensions": {"Integritas": 85, "Kerjasama Tim": 90, "Adaptasi": 80, "Orientasi Hasil": 85, "Komunikasi": 85}}'::jsonb,
    to_char(CURRENT_DATE + 2, 'YYYY-MM-DD'), '10:00', 'Budi Santoso & Wawan Setiadi', 'Kantor Pusat PGP Room 302', 'https://meet.google.com/abc-defg-hij',
    'Wawancara teknis mengenai regulasi kepabeanan terbaru dan pengurusan dokumen PIB/PEB.',
    'Bersih', 'Tidak ada catatan negatif dari riwayat kerja sebelumnya.', CURRENT_TIMESTAMP - INTERVAL '1 day',
    'Fit', 'Kondisi fisik prima, siap bekerja.', CURRENT_TIMESTAMP - INTERVAL '1 day',
    89, '{"score": 89, "evaluator_notes": "Sangat kompeten dibidang operasional lapangan."}'::jsonb,
    7500000, 7000000, 'offered', 'HRD menawarkan gaji pokok 7.000.000 dengan tunjangan makan & transport.',
    $resume${
      "headline": "Experienced Customs Broker",
      "summary": "Licensed customs broker with 3 years of experience in managing customs clearance, cargo forwarding, and PIB/PEB documentation.",
      "location": "Jakarta Utara, Indonesia",
      "linkedin": "linkedin.com/in/rianhidayat",
      "skills": ["Customs Clearance", "PIB/PEB", "Freight Forwarding", "Export-Import", "Customer Relations"],
      "experiences": [
        {
          "position": "PPJK Admin Staff",
          "company": "PT Forwarding Cepat",
          "start": "2023",
          "end": "2026",
          "current": false
        }
      ],
      "educations": [
        {
          "school": "STMT Trisakti",
          "degree": "D3",
          "field": "Manajemen Transpor Laut",
          "start": "2020",
          "end": "2023",
          "current": false
        }
      ]
    }$resume$
  ) ON CONFLICT (id) DO NOTHING;

  -- Panel Interview Scores for Pelamar 4
  INSERT INTO interview_scores (id, application_id, panel_role, panelist_name, score, notes) VALUES
    ('is-dummy-04-hr', 'pel-dummy-04', 'HR', 'Budi Santoso', 88, 'Komunikasi sangat baik, memiliki motivasi tinggi.'),
    ('is-dummy-04-user', 'pel-dummy-04', 'User/Dept Manager', 'Wawan Setiadi', 92, 'Sangat memahami regulasi kepabeanan, menguasai pengisian PIB/PEB.'),
    ('is-dummy-04-dir', 'pel-dummy-04', 'Director', 'Ade Fajar Nurcahman', 85, 'Sikap baik, profesional, dan siap bekerja lembur jika dibutuhkan.')
  ON CONFLICT (id) DO NOTHING;

  -- Hiring Approval Steps for Pelamar 4 (HR & Dept Head Approved, Finance Pending)
  INSERT INTO hiring_approval_steps (id, application_id, step_number, approver_role, status, approved_by, approved_at, notes) VALUES
    ('has-dummy-04-1', 'pel-dummy-04', 1, 'HR', 'Approved', 'hrd@ptpgp.co.id', CURRENT_TIMESTAMP - INTERVAL '3 days', 'Kandidat sangat memenuhi kualifikasi.'),
    ('has-dummy-04-2', 'pel-dummy-04', 2, 'Department Head', 'Approved', 'operational@ptpgp.co.id', CURRENT_TIMESTAMP - INTERVAL '2 days', 'Disetujui dari sisi kompetensi operasional.'),
    ('has-dummy-04-3', 'pel-dummy-04', 3, 'Finance', 'Pending', NULL, NULL, NULL),
    ('has-dummy-04-4', 'pel-dummy-04', 4, 'Director', 'Pending', NULL, NULL, NULL)
  ON CONFLICT (id) DO NOTHING;

  -- ── 4. STAGE: Diterima (Hired) ──────────────────────────────────────────────
  
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
    'pel-dummy-05', 'demo-job-02', 'Anita Wijaya', 'anita.wijaya@example.com', '081388889999', 'Diterima', CURRENT_TIMESTAMP - INTERVAL '15 days', 'rc-02', 95,
    '{"skills_match": ["Procurement", "Sourcing"], "experience_match": "2 years", "education_match": "S1"}'::jsonb,
    TRUE,
    '{"passed": true, "score": 95, "test_title": "Tes Pengetahuan Procurement"}'::jsonb,
    '{"overall": 90, "dimensions": {"Integritas": 95, "Kerjasama Tim": 85, "Adaptasi": 90, "Orientasi Hasil": 90, "Komunikasi": 90}}'::jsonb,
    'Bersih', 'Verifikasi referensi kerja bersih.', CURRENT_TIMESTAMP - INTERVAL '5 days',
    'Fit', 'Hasil lab MCU normal dan fit untuk bekerja.', CURRENT_TIMESTAMP - INTERVAL '5 days',
    93, '{"score": 93, "evaluator_notes": "Kandidat terbaik dengan pengalaman negosiasi vendor yang solid."}'::jsonb,
    8000000, 8000000, 8000000, 'agreed',
    'Surat Penawaran Kerja Resmi untuk Staff Procurement...', 'Diterima', CURRENT_TIMESTAMP - INTERVAL '4 days', CURRENT_TIMESTAMP - INTERVAL '3 days',
    $resume${
      "headline": "Procurement Specialist",
      "summary": "Experienced procurement officer specialized in vendor management, cost negotiation, and supply chain operations.",
      "location": "Jakarta Barat, Indonesia",
      "linkedin": "linkedin.com/in/anitawijaya",
      "skills": ["Procurement", "Vendor Negotiation", "Sourcing", "Supply Chain", "ERP Systems"],
      "experiences": [
        {
          "position": "Procurement Staff",
          "company": "PT Dagang Nusantara",
          "start": "2024",
          "end": "2026",
          "current": false
        }
      ],
      "educations": [
        {
          "school": "Universitas Bina Nusantara",
          "degree": "S1",
          "field": "Manajemen Bisnis",
          "start": "2020",
          "end": "2024",
          "current": false
        }
      ]
    }$resume$
  ) ON CONFLICT (id) DO NOTHING;

  -- Panel Interview Scores for Pelamar 5
  INSERT INTO interview_scores (id, application_id, panel_role, panelist_name, score, notes) VALUES
    ('is-dummy-05-hr', 'pel-dummy-05', 'HR', 'Budi Santoso', 90, 'Komunikasi sangat bagus, berorientasi target.'),
    ('is-dummy-05-user', 'pel-dummy-05', 'User/Dept Manager', 'Galih Aditya', 95, 'Memiliki kemampuan negosiasi vendor yang luar biasa.'),
    ('is-dummy-05-dir', 'pel-dummy-05', 'Director', 'Ade Fajar Nurcahman', 90, 'Visi bagus dan sejalan dengan kebutuhan departemen.')
  ON CONFLICT (id) DO NOTHING;

  -- Hiring Approval Steps for Pelamar 5 (All Approved)
  INSERT INTO hiring_approval_steps (id, application_id, step_number, approver_role, status, approved_by, approved_at, notes) VALUES
    ('has-dummy-05-1', 'pel-dummy-05', 1, 'HR', 'Approved', 'hrd@ptpgp.co.id', CURRENT_TIMESTAMP - INTERVAL '7 days', 'Kandidat sangat potensial.'),
    ('has-dummy-05-2', 'pel-dummy-05', 2, 'Department Head', 'Approved', 'procurement@ptpgp.co.id', CURRENT_TIMESTAMP - INTERVAL '6 days', 'Sesuai dengan kebutuhan divisi.'),
    ('has-dummy-05-3', 'pel-dummy-05', 3, 'Finance', 'Approved', 'finance@ptpgp.co.id', CURRENT_TIMESTAMP - INTERVAL '5 days', 'Budget gaji tersedia.'),
    ('has-dummy-05-4', 'pel-dummy-05', 4, 'Director', 'Approved', 'director@ptpgp.co.id', CURRENT_TIMESTAMP - INTERVAL '4 days', 'Disetujui untuk direkrut.')
  ON CONFLICT (id) DO NOTHING;

  -- ── 5. STAGE: Ditolak & Masuk Talent Pool ───────────────────────────────────
  
  -- Pelamar 6: Deni Setiawan (Jobstreet, match score 72%, riwayat sampai interview tapi ditolak, disimpan di Talent Pool)
  INSERT INTO pelamar (
    id, job_id, full_name, email, phone, status, applied_at, channel_id, match_score, match_detail,
    reached_interview, test_tulis_result, test_psikotes_result,
    in_talent_pool, talent_pool_notes, talent_pool_added_at,
    resume_url
  ) VALUES (
    'pel-dummy-06', 'demo-job-01', 'Deni Setiawan', 'deni.setiawan@example.com', '081277778888', 'Ditolak', CURRENT_TIMESTAMP - INTERVAL '12 days', 'rc-03', 72,
    '{"skills_match": ["Customs Clearance"], "experience_match": "1 year", "education_match": "D3"}'::jsonb,
    TRUE,
    '{"passed": true, "score": 75, "test_title": "Tes Pengetahuan Freight Forwarding"}'::jsonb,
    '{"overall": 70, "dimensions": {"Integritas": 75, "Kerjasama Tim": 70, "Adaptasi": 70, "Orientasi Hasil": 70, "Komunikasi": 65}}'::jsonb,
    TRUE, 'Kandidat cukup baik, namun kalah saing dengan kandidat lain yang memiliki pengalaman operasional lapangan lebih matang. Disimpan untuk lowongan berikutnya.', CURRENT_TIMESTAMP - INTERVAL '1 day',
    $resume${
      "headline": "Junior Staff PPJK",
      "summary": "Hardworking junior staff PPJK with 1 year of experience handling customs documents and logistics operations.",
      "location": "Jakarta Timur, Indonesia",
      "skills": ["Customs Clearance", "PIB/PEB", "Ms Office"],
      "experiences": [
        {
          "position": "Junior Admin PPJK",
          "company": "PT Cargo Cepat",
          "start": "2025",
          "end": "2026",
          "current": false
        }
      ],
      "educations": [
        {
          "school": "STMT Trisakti",
          "degree": "D3",
          "field": "Logistik",
          "start": "2021",
          "end": "2024",
          "current": false
        }
      ]
    }$resume$
  ) ON CONFLICT (id) DO NOTHING;

  -- Panel Interview Scores for Pelamar 6
  INSERT INTO interview_scores (id, application_id, panel_role, panelist_name, score, notes) VALUES
    ('is-dummy-06-hr', 'pel-dummy-06', 'HR', 'Budi Santoso', 70, 'Sikap baik, komunikasi standar.'),
    ('is-dummy-06-user', 'pel-dummy-06', 'User/Dept Manager', 'Wawan Setiadi', 72, 'Pemahaman teori PPJK oke, namun kurang jam terbang lapangan.')
  ON CONFLICT (id) DO NOTHING;

  -- Sync lowongan_kerja dummy data to job_postings if job_postings table exists
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'job_postings') THEN
    DECLARE
      job_cols TEXT;
    BEGIN
      SELECT string_agg(quote_ident(column_name), ', ')
      INTO job_cols
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'job_postings'
        AND column_name IN (
          SELECT column_name
          FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'lowongan_kerja'
        );
      
      IF job_cols IS NOT NULL AND job_cols <> '' THEN
        EXECUTE format(
          'INSERT INTO job_postings (%s) SELECT %s FROM lowongan_kerja WHERE id IN (''demo-job-01'', ''demo-job-02'') ON CONFLICT (id) DO NOTHING',
          job_cols,
          job_cols
        );
      END IF;
    END;
  END IF;

  -- Sync pelamar dummy data to applications if applications table exists
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'applications') THEN
    DECLARE
      app_cols TEXT;
    BEGIN
      SELECT string_agg(quote_ident(column_name), ', ')
      INTO app_cols
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'applications'
        AND column_name IN (
          SELECT column_name
          FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'pelamar'
        );
      
      IF app_cols IS NOT NULL AND app_cols <> '' THEN
        EXECUTE format(
          'INSERT INTO applications (%s) SELECT %s FROM pelamar WHERE id IN (''pel-dummy-01'', ''pel-dummy-02'', ''pel-dummy-03'', ''pel-dummy-04'', ''pel-dummy-05'', ''pel-dummy-06'') ON CONFLICT (id) DO NOTHING',
          app_cols,
          app_cols
        );
      END IF;
    END;
  END IF;

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error seeding candidate pipeline dummy data: %', SQLERRM;
END $$;
