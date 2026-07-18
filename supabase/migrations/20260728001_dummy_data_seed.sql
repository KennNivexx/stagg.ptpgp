-- Dummy/demo seed data for pages that exist but currently have zero rows.
-- Scope: Career & Talent, Succession Planning, Employee Relations (Communication +
-- Industrial), Attendance/Workforce Time, Payroll & Rewards, Employee 360 tabs,
-- and a few standalone pages (shifts, company policies, SDM request history).
-- All rows reference REAL ids already live in the database (10 real employees,
-- real jabatan/unit/grade/skill master data) — nothing here is a placeholder FK.
-- Safe to re-run: master-data INSERTs use ON CONFLICT DO NOTHING; transactional
-- rows use freshly generated UUIDs each run, so re-running adds a second copy —
-- run this file only once.

-- ══════════════ CAREER & TALENT — Master Data ══════════════
INSERT INTO career_frameworks (id, code, name, effective_date, status, description) VALUES
  ('frm-01', 'CF-2026', 'Standard Career Framework 2026', '2026-01-01', 'Active', 'Kerangka kerja pengembangan karir standar PT Pratama Galuh Perkasa.')
ON CONFLICT (code) DO NOTHING;
INSERT INTO career_streams (id, code, name, description) VALUES
  ('str-01', 'CS01', 'Management', 'Jalur struktural dan manajerial'),
  ('str-02', 'CS02', 'Professional', 'Jalur profesional/fungsional umum'),
  ('str-03', 'CS03', 'Technical Expert', 'Jalur keahlian teknis spesifik'),
  ('str-04', 'CS04', 'Operational', 'Jalur operasional lapangan'),
  ('str-05', 'CS05', 'Sales', 'Jalur penjualan dan pemasaran'),
  ('str-06', 'CS06', 'Project', 'Jalur manajemen proyek')
ON CONFLICT (code) DO NOTHING;
INSERT INTO career_levels (id, code, name, urutan) VALUES
  ('lvl-01', 'LVL01', 'Intern', 1),
  ('lvl-02', 'LVL02', 'Junior', 2),
  ('lvl-03', 'LVL03', 'Staff', 3),
  ('lvl-04', 'LVL04', 'Senior Staff', 4),
  ('lvl-05', 'LVL05', 'Supervisor', 5),
  ('lvl-06', 'LVL06', 'Assistant Manager', 6),
  ('lvl-07', 'LVL07', 'Manager', 7),
  ('lvl-08', 'LVL08', 'Senior Manager', 8),
  ('lvl-09', 'LVL09', 'General Manager', 9),
  ('lvl-10', 'LVL10', 'Director', 10)
ON CONFLICT (code) DO NOTHING;
INSERT INTO talent_classifications (id, code, name, performance_min, performance_max, potential_min, potential_max, color_code) VALUES
  ('tcl-1', 'HP', 'High Potential', 85, 100, 85, 100, '#10b981'),
  ('tcl-2', 'EL', 'Emerging Leader', 70, 85, 85, 100, '#3b82f6'),
  ('tcl-3', 'SP', 'Solid Performer', 85, 100, 70, 85, '#6366f1'),
  ('tcl-4', 'CC', 'Core Contributor', 70, 85, 70, 85, '#eab308'),
  ('tcl-5', 'ND', 'Need Development', 0, 70, 0, 70, '#ef4444')
ON CONFLICT (code) DO NOTHING;
INSERT INTO career_score_formulas (id, framework_id) VALUES
  ('csf-01', 'frm-01')
ON CONFLICT (id) DO NOTHING;
INSERT INTO career_readiness_rules (id, framework_id, category_name, min_score, max_score, urutan, color_code) VALUES
  ('crr-1', 'frm-01', 'Ready Now', 90, 100, 1, '#10b981'),
  ('crr-2', 'frm-01', 'Ready Within 6 Months', 80, 89.99, 2, '#3b82f6'),
  ('crr-3', 'frm-01', 'Ready Within 1 Year', 70, 79.99, 3, '#eab308'),
  ('crr-4', 'frm-01', 'Need Development', 50, 69.99, 4, '#f97316'),
  ('crr-5', 'frm-01', 'Not Eligible', 0, 49.99, 5, '#ef4444')
ON CONFLICT (id) DO NOTHING;
INSERT INTO promotion_policies (id, framework_id, minimum_grade, min_performance_score, min_competency_score, min_leadership_score, mandatory_training_pct, min_attendance_pct) VALUES
  ('pp-01', 'frm-01', 'demo-grade-g06', 80, 75, 70, 100, 95)
ON CONFLICT (id) DO NOTHING;
INSERT INTO mutation_policies (id, framework_id, min_tenure_months, min_performance_score, allow_cross_stream) VALUES
  ('mp-01', 'frm-01', 12, 70, TRUE)
ON CONFLICT (id) DO NOTHING;
INSERT INTO rotation_policies (id, framework_id, max_tenure_months, mandatory_for_talent) VALUES
  ('rp-01', 'frm-01', 36, TRUE)
ON CONFLICT (id) DO NOTHING;
INSERT INTO succession_policies (id, framework_id, min_readiness_score, max_successors_per_position) VALUES
  ('sp-01', 'frm-01', 80, 3)
ON CONFLICT (id) DO NOTHING;

-- ══════════════ CAREER & TALENT — Talent Management ══════════════
INSERT INTO career_profiles (id, karyawan_id, career_stream_id, career_level_id, target_jabatan_id, last_assessment_date) VALUES
  ('cp-2ac964e0-7e03-4f19-94c9-78a770cd03b2', 'ccb5862d-21dc-4d07-8da0-dd411bb3d97e', 'str-04', 'lvl-03', 'demo-jab-ppjk', '2026-06-01'),
  ('cp-3c1a7183-d19d-4e7e-8bdc-e5c255b9fa6e', 'f132413c-0c1d-4de9-ac53-21b0bcbe57d4', 'str-05', 'lvl-03', 'demo-jab-cs', '2026-06-01'),
  ('cp-93c58562-229a-429c-882d-2df04c6d896b', '533fb02e-c137-444e-94b5-a0f7ea88058c', 'str-02', 'lvl-03', 'demo-jab-finspv', '2026-06-01'),
  ('cp-57c0edce-4006-4e34-a08c-c6ff6a97a8ba', 'e19a4e1b-d365-4d5a-826c-7b66aa8cca62', 'str-04', 'lvl-05', 'demo-jab-mgr-armada', '2026-06-01'),
  ('cp-2a15e0e4-3ea3-401f-8a80-5429c5f05e47', 'e1a0ca47-173f-4c93-a2bb-678e68a2fa61', 'str-02', 'lvl-03', 'demo-jab-hrspv', '2026-06-01');
INSERT INTO talent_pools (id, karyawan_id, current_jabatan_id, target_jabatan_id, status, entered_at, keterangan) VALUES
  ('tp-db1a7206-93e8-4b01-adcd-19903d4f92e2', 'e19a4e1b-d365-4d5a-826c-7b66aa8cca62', 'demo-jab-armada', 'demo-jab-mgr-armada', 'Ready', '2026-02-01', 'Kandidat kuat untuk Manager Armada & Trucking, kinerja konsisten di atas target.'),
  ('tp-4a0cae72-c4d1-402e-a145-1979d7aa919d', '84019708-d3d6-43f8-817b-da2ff8052eeb', 'demo-jab-gudang', 'demo-jab-mgr-gudang', 'Development', '2026-03-01', 'Sedang menjalani pengembangan kepemimpinan untuk posisi Manager Gudang & Cargo.'),
  ('tp-8716d267-e4ec-4ab9-9510-275986a45ada', '11bf125b-b66a-44ea-9a30-73ed9524e7bc', 'demo-jab-hrspv', 'demo-jab-mgr-hr', 'Development', '2026-04-01', 'Talent pool jalur manajerial HR & GA.');
INSERT INTO talent_reviews (id, karyawan_id, period, performance_score, potential_score, classification_id, reviewer_id, notes, review_date) VALUES
  ('tr-da2da4b7-e403-42bd-b3b9-2602ea653c26', 'e19a4e1b-d365-4d5a-826c-7b66aa8cca62', '2026-H1', 88, 90, 'tcl-1', '9f388845-acbf-4178-8ef3-c4e5ac4511ac', 'Kepemimpinan lapangan sangat baik, siap untuk tanggung jawab lebih besar.', '2026-06-15'),
  ('tr-7706da8c-8df1-4e15-8e90-afd29026b0b2', '84019708-d3d6-43f8-817b-da2ff8052eeb', '2026-H1', 82, 78, 'tcl-3', '9f388845-acbf-4178-8ef3-c4e5ac4511ac', 'Kinerja operasional solid dan konsisten.', '2026-06-15'),
  ('tr-7f28335f-bd67-4a93-8af5-31f490362933', '11bf125b-b66a-44ea-9a30-73ed9524e7bc', '2026-H1', 80, 76, 'tcl-4', '11bf125b-b66a-44ea-9a30-73ed9524e7bc', 'Kontributor inti tim HR & GA.', '2026-06-15'),
  ('tr-326c47fc-fbbe-479c-9620-aa7fb2a20a4a', 'ccb5862d-21dc-4d07-8da0-dd411bb3d97e', '2026-H1', 75, 72, 'tcl-4', '9f388845-acbf-4178-8ef3-c4e5ac4511ac', 'Penguasaan regulasi kepabeanan baik.', '2026-06-15');
INSERT INTO career_assessments (id, karyawan_id, period, performance_score, competency_score, skills_score, leadership_score, learning_score, attendance_score, discipline_score, innovation_score, experience_score, final_career_score, readiness_rule_id, assessment_date) VALUES
  ('ca-889c9d79-9c16-4667-bf65-1c7a467363a9', 'e19a4e1b-d365-4d5a-826c-7b66aa8cca62', '2026-H1', 88, 85, 82, 87, 80, 96, 95, 78, 90, 87.2, 'crr-2', '2026-06-20'),
  ('ca-3b953ba5-78a6-4b99-ba95-d83fce6ef882', '84019708-d3d6-43f8-817b-da2ff8052eeb', '2026-H1', 82, 80, 78, 74, 76, 94, 92, 70, 85, 79.8, 'crr-3', '2026-06-20'),
  ('ca-5f3d4e99-bbf5-494f-b933-574bfed1d142', '11bf125b-b66a-44ea-9a30-73ed9524e7bc', '2026-H1', 80, 78, 75, 72, 74, 97, 96, 68, 80, 78.4, 'crr-3', '2026-06-20');
INSERT INTO career_recommendations (id, karyawan_id, assessment_id, recommendation_type, target_jabatan_id, target_unit_id, reason, status) VALUES
  ('cr-87fe07b1-70c8-41de-b471-a91af73b0f7d', 'e19a4e1b-d365-4d5a-826c-7b66aa8cca62', NULL, 'Promotion', 'demo-jab-mgr-armada', 'demo-unit-ops', 'Skor karir akhir 87.2, siap dalam 6 bulan ke depan untuk posisi Manager Armada & Trucking.', 'Proposed'),
  ('cr-f2f5e7db-d253-4cb5-975c-8e2696134bc7', '84019708-d3d6-43f8-817b-da2ff8052eeb', NULL, 'Rotation', 'demo-jab-mgr-gudang', 'demo-unit-ops', 'Perlu pengalaman lintas fungsi sebelum promosi ke Manager Gudang & Cargo.', 'Proposed');
INSERT INTO career_transactions (id, karyawan_id, transaction_type, current_jabatan_id, current_unit_id, target_jabatan_id, target_unit_id, effective_date, end_date, status, reason) VALUES
  ('ctx-071efe84-159a-43e5-afac-e46bfa5d52df', 'e19a4e1b-d365-4d5a-826c-7b66aa8cca62', 'Promotion', 'demo-jab-armada', 'demo-unit-ops', 'demo-jab-mgr-armada', 'demo-unit-ops', '2026-09-01', NULL, 'In Review', 'Promosi berdasarkan hasil Talent Review 2026-H1.'),
  ('ctx-2faca974-f591-4a28-a48b-da1f3c5f4008', 'ccb5862d-21dc-4d07-8da0-dd411bb3d97e', 'Rotation', 'demo-jab-ppjk', 'demo-unit-ops', 'demo-jab-dok', 'demo-unit-ops', '2026-08-15', NULL, 'Draft', 'Rotasi lintas fungsi Dokumentasi Ekspor-Impor.'),
  ('ctx-ab6f7e33-bdd4-4d73-ad35-8d37835c7b3e', 'f132413c-0c1d-4de9-ac53-21b0bcbe57d4', 'Demotion', 'demo-jab-cs', 'demo-unit-ops', 'demo-jab-dok', 'demo-unit-ops', '2026-07-01', NULL, 'Rejected', 'Evaluasi kinerja di bawah standar pada kuartal terakhir — diajukan lalu ditolak setelah banding.'),
  ('ctx-ee771f86-a5a2-41fd-8705-d705bac0b93c', '84019708-d3d6-43f8-817b-da2ff8052eeb', 'Acting Assignment', 'demo-jab-gudang', 'demo-unit-ops', 'demo-jab-mgr-gudang', 'demo-unit-ops', '2026-07-10', '2026-10-10', 'Approved', 'Plt. Manager Gudang & Cargo selama proses rekrutmen definitif.'),
  ('ctx-a2d31546-7f4f-4dbf-b475-4e9f6fde7ced', 'e1a0ca47-173f-4c93-a2bb-678e68a2fa61', 'Temporary Assignment', 'demo-jab-hrstaff', 'demo-unit-hr', 'demo-jab-hrspv', 'demo-unit-hr', '2026-08-01', '2026-09-30', 'In Review', 'Penugasan sementara menggantikan HR & GA Supervisor cuti panjang.'),
  ('ctx-5f79c4aa-37ae-4c90-a20a-c716890573bd', 'e19a4e1b-d365-4d5a-826c-7b66aa8cca62', 'Succession Assignment', 'demo-jab-armada', 'demo-unit-ops', 'demo-jab-opsmgr', 'demo-unit-ops', '2027-01-01', NULL, 'Draft', 'Bagian dari rencana suksesi posisi Operational Manager.');
INSERT INTO career_approvals (id, transaction_id, step_number, approver_role, status, notes) VALUES
  ('capp-05aaaecd-9180-437a-9d46-38480084db4d', 'ctx-ee771f86-a5a2-41fd-8705-d705bac0b93c', 1, 'Department Head', 'Approved', 'Disetujui oleh Operational Manager.'),
  ('capp-e114e9ab-5a7d-4ed0-9b7f-42fe7aa00a4c', 'ctx-ee771f86-a5a2-41fd-8705-d705bac0b93c', 2, 'Career Committee', 'Pending', NULL);

-- ══════════════ CAREER & TALENT — Requests / Mutations / Promotions / History ══════════════
INSERT INTO permintaan_karir (id, employee_email, employee_name, type, job_title, job_department, status, created_at) VALUES
  ('pk-a99a8bc0-c36d-4c35-85ca-a1d979c8b8aa', 'dewi.lestari@ptpgp.co.id', 'Dewi Lestari', 'consultation', NULL, NULL, 'Pending', '2026-07-01T02:00:00Z'),
  ('pk-c0e5b415-3375-47ec-8153-266847219ec2', 'maya.kusuma@ptpgp.co.id', 'Maya Kusuma', 'application', 'Customer Service Ekspor-Impor Senior', 'Operational Division', 'Reviewed', '2026-06-20T02:00:00Z');
INSERT INTO mutasi_karir (id, employee_id, from_department, to_department, effective_date, reason, status, requested_by, created_at) VALUES
  ('mut-f6e6c03b-7a3e-4573-b36f-ea5ab83fd28c', 'e1a0ca47-173f-4c93-a2bb-678e68a2fa61', 'HR & GA', 'Finance', '2026-05-01', 'Pengembangan lintas fungsi keuangan.', 'Ditolak', 'budi.santoso@ptpgp.co.id', '2026-04-20T02:00:00Z');
INSERT INTO promosi_karir (id, employee_id, from_position, to_position, effective_date, reason, criteria, status, requested_by, created_at) VALUES
  ('prm-82cc8e10-1a81-4a2c-b5ac-49d7e2f74351', '84019708-d3d6-43f8-817b-da2ff8052eeb', 'Supervisor Gudang & Cargo', 'Manager Gudang & Cargo', '2026-10-01', 'Kinerja konsisten dan kesiapan kepemimpinan.', 'Skor KPI > 80, lulus asesmen kepemimpinan.', 'Menunggu', 'fajar.nugroho@ptpgp.co.id', '2026-07-05T02:00:00Z'),
  ('prm-7c95172b-a502-4d58-8b01-2ee5b098729f', 'e19a4e1b-d365-4d5a-826c-7b66aa8cca62', 'Koordinator Armada & Trucking', 'Manager Armada & Trucking', '2026-09-01', 'Hasil Talent Review 2026-H1 sangat baik.', 'Skor karir akhir >= 85.', 'Disetujui', 'fajar.nugroho@ptpgp.co.id', '2026-06-25T02:00:00Z');

-- ══════════════ SUCCESSION PLANNING ══════════════
INSERT INTO penilaian_kesiapan_suksesi (id, employee_id, year, kepemimpinan, keahlian_teknis, pengalaman, kinerja, potensi, total_score, assessed_by) VALUES
  ('sra-7cdfcafc-644b-4200-b135-13e92a2b5b03', 'e19a4e1b-d365-4d5a-826c-7b66aa8cca62', 2026, 88, 85, 90, 88, 90, 88, 'Fajar Nugroho'),
  ('sra-a4081d8d-ec0b-474e-ab63-f363db5323d2', '84019708-d3d6-43f8-817b-da2ff8052eeb', 2026, 75, 82, 80, 82, 78, 78, 'Fajar Nugroho'),
  ('sra-6311226a-03ea-42de-9e17-376e3b46d49e', '11bf125b-b66a-44ea-9a30-73ed9524e7bc', 2026, 78, 76, 85, 80, 76, 79, 'Budi Santoso');
INSERT INTO posisi_kritis (id, employee_id, risk_level, vacancy_risk_date, marked_by) VALUES
  ('scp-668087b3-9da6-45a8-921d-95e6e041fcb4', '9f388845-acbf-4178-8ef3-c4e5ac4511ac', 'Tinggi', '2027-01-01', 'Budi Santoso'),
  ('scp-65f24ba4-958c-4b54-b0e7-fd363236d778', '11bf125b-b66a-44ea-9a30-73ed9524e7bc', 'Sedang', '2027-06-01', 'Budi Santoso');
INSERT INTO kandidat_suksesor (id, employee_id, target_position_employee_id, readiness_override, notes, added_by) VALUES
  ('sc-75e46fe6-011a-424c-8c23-8c50d2fa71ac', 'e19a4e1b-d365-4d5a-826c-7b66aa8cca62', '9f388845-acbf-4178-8ef3-c4e5ac4511ac', 85, 'Kandidat utama pengganti Operational Manager.', 'Budi Santoso'),
  ('sc-5790a27d-7366-44e0-bec3-bedd87ec782a', '84019708-d3d6-43f8-817b-da2ff8052eeb', '9f388845-acbf-4178-8ef3-c4e5ac4511ac', 65, 'Kandidat cadangan, perlu pengembangan lebih lanjut.', 'Budi Santoso'),
  ('sc-62b4bb5e-57aa-4876-9fd5-6e31dca99041', 'e1a0ca47-173f-4c93-a2bb-678e68a2fa61', '11bf125b-b66a-44ea-9a30-73ed9524e7bc', 60, 'Kandidat jangka panjang untuk HR & GA Supervisor.', 'Budi Santoso');
INSERT INTO pool_suksesi (id, employee_id, potential_rating, notes, added_by) VALUES
  ('stp-26f6414a-086f-4f11-a6b8-88df74488330', 'e19a4e1b-d365-4d5a-826c-7b66aa8cca62', 'Bintang', 'Talent unggulan divisi operasional.', 'Budi Santoso'),
  ('stp-3c1e5171-979d-4a13-a94b-5a177a449999', '84019708-d3d6-43f8-817b-da2ff8052eeb', 'Potensial Tinggi', 'Berkembang cepat, siap tanggung jawab lebih besar.', 'Budi Santoso'),
  ('stp-819719e5-b7a0-480d-b62b-72be6b204dba', 'ccb5862d-21dc-4d07-8da0-dd411bb3d97e', 'Solid', 'Kontributor stabil, cocok untuk jalur teknis.', 'Budi Santoso');

-- ══════════════ EMPLOYEE RELATIONS — Communication & Industrial ══════════════
INSERT INTO communications (id, comm_type, title, content, target_audience, published_by, status, published_at) VALUES
  ('comm-ef118f73-4435-4443-8940-8daf9ef27096', 'Announcement', 'Libur Nasional Hari Kemerdekaan RI', 'Diberitahukan bahwa tanggal 17 Agustus 2026 seluruh operasional kantor diliburkan.', 'All Employees', 'budi.santoso@ptpgp.co.id', 'Published', '2026-07-10T02:00:00Z'),
  ('comm-8378a62e-e60f-452f-b06e-3eef569f3adc', 'Circular', 'Surat Edaran Jam Kerja Ramadhan', 'Penyesuaian jam kerja selama bulan Ramadhan berlaku mulai minggu depan.', 'All Employees', 'budi.santoso@ptpgp.co.id', 'Published', '2026-06-01T02:00:00Z'),
  ('comm-b7a1474e-e37b-41cf-b94e-92003e46b162', 'Emergency', 'Prosedur Evakuasi Darurat Gudang', 'Mengingatkan seluruh staf gudang mengenai jalur evakuasi darurat terbaru.', 'Operational Division', 'yudi.firmansyah@ptpgp.co.id', 'Published', '2026-05-15T02:00:00Z'),
  ('comm-5f86d200-ca93-48bb-a063-4d99cd4be090', 'Memo', 'Memo Internal: Update SOP Kepabeanan', 'SOP Kepabeanan versi terbaru berlaku efektif bulan ini, mohon dipelajari.', 'Operational Division', 'fajar.nugroho@ptpgp.co.id', 'Published', '2026-07-01T02:00:00Z'),
  ('comm-402b40a1-7aa2-4ce0-8bf4-d28a78b0a14b', 'News', 'PT Pratama Galuh Perkasa Raih Sertifikasi AEO', 'Perusahaan resmi meraih sertifikasi Authorized Economic Operator dari Bea Cukai.', 'All Employees', 'budi.santoso@ptpgp.co.id', 'Published', '2026-06-20T02:00:00Z'),
  ('comm-8fa3a080-082b-406b-b24e-b84f0adabdd9', 'Policy Distribution', 'Distribusi Kebijakan Hubungan Industrial 2026', 'Kebijakan Hubungan Industrial terbaru telah disahkan dan berlaku efektif.', 'All Employees', 'budi.santoso@ptpgp.co.id', 'Published', '2026-01-15T02:00:00Z');
INSERT INTO industrial_compliance_items (id, regulation_name, compliance_status, due_date, notes) VALUES
  ('ic-c2d19d0f-ccfb-4ea2-9f3b-377151a37e8c', 'Wajib Lapor Ketenagakerjaan (WLTK)', 'Compliant', '2026-12-31', 'Laporan tahunan sudah diserahkan ke Disnaker.'),
  ('ic-da719b4b-9ab6-4850-a536-f8c7f10945cd', 'Pendaftaran Peraturan Perusahaan', 'Compliant', '2028-01-01', 'PP-2026 masih berlaku hingga 2028.'),
  ('ic-61aa77c8-90bf-4b32-bdc7-456863094e28', 'Audit Kepatuhan BPJS Ketenagakerjaan', 'At Risk', '2026-09-30', 'Menunggu verifikasi data kepesertaan karyawan baru.');
INSERT INTO industrial_meetings (id, meeting_type, title, agenda, participants, outcome, meeting_date, status) VALUES
  ('im-41dad2e2-c547-449b-899e-4b49c43cdf16', 'Bipartite', 'Rapat Bipartit Triwulan Q2 2026', 'Evaluasi kesejahteraan karyawan dan lingkungan kerja.', 'Manajemen, Perwakilan Karyawan', 'Disepakati peninjauan tunjangan transportasi.', '2026-06-10', 'Completed'),
  ('im-f92648b9-be01-4598-9c91-3352f2304c71', 'Dispute', 'Penyelesaian Perselisihan Jam Lembur Gudang', 'Pembahasan keluhan perhitungan jam lembur staf gudang.', 'HR & GA, Supervisor Gudang & Cargo', NULL, '2026-07-20', 'Scheduled'),
  ('im-f89ff6cb-8d43-4795-be4a-815e6449d539', 'Mediation', 'Mediasi Kesalahpahaman Antar Divisi', 'Mediasi antara divisi Operasional dan Finance terkait proses reimbursement.', 'HR & GA, Perwakilan kedua divisi', 'Disepakati SOP reimbursement baru.', '2026-05-25', 'Completed'),
  ('im-e682039e-b601-418a-89fe-53161508d7d9', 'PHI Documentation', 'Dokumentasi PHI Kasus Pemutusan Kontrak', 'Pencatatan dokumen pendukung untuk kasus akhir kontrak kerja.', 'HR & GA, Legal', 'Dokumen lengkap dan diarsipkan.', '2026-04-10', 'Completed'),
  ('im-d28c10d1-0c2d-4137-a285-95e13296783d', 'Tripartite', 'Rapat Tripartit dengan Disnaker', 'Koordinasi rutin dengan Dinas Ketenagakerjaan setempat.', 'Manajemen, Disnaker, Perwakilan Karyawan', 'Tidak ada isu signifikan dilaporkan.', '2026-03-15', 'Completed');

-- ══════════════ ATTENDANCE / WORKFORCE TIME ══════════════
INSERT INTO kalender_kerja (id, tanggal, nama_libur, jenis) VALUES
  ('cal-59ce7501-74c6-4718-999f-ae87698d7b50', '2026-01-01', 'Tahun Baru Masehi', 'Nasional'),
  ('cal-a50e061c-0d78-4ede-917b-97d86b8b5d5c', '2026-03-21', 'Hari Raya Nyepi', 'Nasional'),
  ('cal-b055d78d-3d89-4302-8793-4693a8c06084', '2026-05-01', 'Hari Buruh Internasional', 'Nasional'),
  ('cal-02316694-c8f7-49f6-8cf4-e0607b6660fd', '2026-08-17', 'Hari Kemerdekaan RI', 'Nasional'),
  ('cal-7860d6a3-b0f4-41b2-afdb-8f91e6c9b2cc', '2026-12-25', 'Hari Raya Natal', 'Nasional'),
  ('cal-0d8081f3-8801-4b31-bb06-9cbc411d9330', '2026-07-27', 'Cuti Bersama Perusahaan', 'Perusahaan');
INSERT INTO penugasan_kerja (id, karyawan_id, unit_organisasi_id, nama_project, nama_klien, supervisor_karyawan_id, tanggal_mulai, tanggal_selesai, status) VALUES
  ('pgs-5d6d8ef4-abd6-4c30-a027-d5d1bb8e5e55', 'ccb5862d-21dc-4d07-8da0-dd411bb3d97e', 'demo-unit-ops', 'Ekspor Furnitur PT Kayu Jati Nusantara', 'PT Kayu Jati Nusantara', '9f388845-acbf-4178-8ef3-c4e5ac4511ac', '2026-06-01', '2026-07-15', 'Aktif'),
  ('pgs-04be71b0-15bf-4bcf-b7cc-2150cb653f1a', 'e19a4e1b-d365-4d5a-826c-7b66aa8cca62', 'demo-unit-ops', 'Distribusi Cargo Rute Surabaya-Jakarta', 'CV Sumber Makmur', '9f388845-acbf-4178-8ef3-c4e5ac4511ac', '2026-05-10', '2026-06-10', 'Selesai'),
  ('pgs-bd90f166-e1f0-456a-ad9a-e4d62d7e6c83', 'f132413c-0c1d-4de9-ac53-21b0bcbe57d4', 'demo-unit-ops', 'Layanan Impor PT Sinar Abadi', 'PT Sinar Abadi', '9f388845-acbf-4178-8ef3-c4e5ac4511ac', '2026-07-01', NULL, 'Aktif');
INSERT INTO koreksi_absensi (id, karyawan_id, tanggal, jenis_koreksi, alasan, status, reviewed_by) VALUES
  ('kor-e55e5dea-7247-499c-8d5f-3664e595ad0f', 'ab2109d1-e11f-4e79-8ecf-c8dc5b87cb5a', '2026-07-08', 'Lupa Clock-Out', 'Lupa melakukan clock-out karena langsung ke lapangan.', 'Disetujui', 'Budi Santoso'),
  ('kor-3d688f26-d874-4835-8e92-f9ffd8dac9e1', '84019708-d3d6-43f8-817b-da2ff8052eeb', '2026-07-12', 'Lupa Clock-In', 'Sistem absensi wajah error saat datang pagi.', 'Pending', NULL);
INSERT INTO lembur (id, karyawan_id, tanggal, jam_mulai, jam_selesai, alasan, status, reviewed_by) VALUES
  ('lbr-7ddbeda5-f055-4825-8ca9-d651eade9e68', 'ccb5862d-21dc-4d07-8da0-dd411bb3d97e', '2026-07-05', '17:00', '20:00', 'Penyelesaian dokumen ekspor mendesak.', 'Disetujui', 'Fajar Nugroho'),
  ('lbr-55f2055d-14e0-4802-ad29-4c36c5f03a31', '84019708-d3d6-43f8-817b-da2ff8052eeb', '2026-07-11', '16:00', '19:00', 'Bongkar muat cargo tambahan.', 'Disetujui', 'Fajar Nugroho'),
  ('lbr-03badd3a-569f-46f6-80b5-34f43073c8b9', 'e19a4e1b-d365-4d5a-826c-7b66aa8cca62', '2026-07-14', '17:00', '21:00', 'Koordinasi armada pengiriman malam.', 'Pending', NULL);
INSERT INTO catatan_aktivitas_harian (id, karyawan_id, tanggal, jam_mulai, jam_selesai, deskripsi_aktivitas, project_site, jam_kerja, mode_kerja) VALUES
  ('ts-771fb355-2af9-4efc-9a6b-8130e7d2ee45', 'ccb5862d-21dc-4d07-8da0-dd411bb3d97e', '2026-07-15', '08:00', '17:00', 'Pengurusan dokumen kepabeanan ekspor furnitur.', 'Kantor Pusat', 8, 'Kantor'),
  ('ts-69d7c828-26cf-478a-a74c-86bb12cdea38', 'e19a4e1b-d365-4d5a-826c-7b66aa8cca62', '2026-07-15', '07:00', '16:00', 'Koordinasi armada trucking rute Surabaya.', 'Lapangan', 9, 'Dinas Luar'),
  ('ts-54a3c429-6b2c-41b6-b548-d36804eeb39e', '533fb02e-c137-444e-94b5-a0f7ea88058c', '2026-07-15', '08:00', '17:00', 'Rekonsiliasi laporan keuangan bulanan.', 'Kantor Pusat', 8, 'Kantor'),
  ('ts-70a235e3-6110-407d-8ece-08df4241511e', 'f132413c-0c1d-4de9-ac53-21b0bcbe57d4', '2026-07-16', '08:00', '17:00', 'Layanan pelanggan dan follow up pengiriman.', 'Kantor Pusat', 8, 'Kantor');
INSERT INTO saldo_cuti (id, karyawan_id, tahun, jenis_cuti, total_hari, terpakai) VALUES
  ('sc-bc7df801-e85e-4123-aae4-4b04e9ce614f', 'ab2109d1-e11f-4e79-8ecf-c8dc5b87cb5a', 2026, 'Tahunan', 12, 0),
  ('sc-2cae15c8-d98f-4ceb-a7a5-0a6f15767c7b', '533fb02e-c137-444e-94b5-a0f7ea88058c', 2026, 'Tahunan', 12, 2),
  ('sc-711bfabc-9e8a-4477-9feb-3e4d7a9ed646', '11bf125b-b66a-44ea-9a30-73ed9524e7bc', 2026, 'Tahunan', 12, 1),
  ('sc-5a912824-2d16-42b0-8c61-e375cbdf0994', 'ccb5862d-21dc-4d07-8da0-dd411bb3d97e', 2026, 'Tahunan', 12, 3),
  ('sc-3fb2d963-c435-42c8-92b1-4846476544c4', '9f388845-acbf-4178-8ef3-c4e5ac4511ac', 2026, 'Tahunan', 12, 2),
  ('sc-606f170a-b519-4112-9f59-d85c09446a21', 'e19a4e1b-d365-4d5a-826c-7b66aa8cca62', 2026, 'Tahunan', 12, 3),
  ('sc-94bd851d-4f37-42ce-a684-df4fd3cceddc', 'f132413c-0c1d-4de9-ac53-21b0bcbe57d4', 2026, 'Tahunan', 12, 1),
  ('sc-b7a5cb6c-8b7c-4cdd-84c3-b638972150fd', '84019708-d3d6-43f8-817b-da2ff8052eeb', 2026, 'Tahunan', 12, 3),
  ('sc-eb83ad46-695a-4514-a4d2-0a93ee616060', 'e1a0ca47-173f-4c93-a2bb-678e68a2fa61', 2026, 'Tahunan', 12, 1),
  ('sc-29145e52-53cc-4a4a-8041-12c1c21a5948', '217ac2be-f6bc-4481-bdb6-db3d68a26083', 2026, 'Tahunan', 12, 4);

-- ══════════════ PAYROLL & REWARDS ══════════════
INSERT INTO penggajian (id, employee_id, month, year, basic_salary, allowances, bonus, tax, bpjs_health, bpjs_employment, deductions, net_salary, status) VALUES
  ('1878f533-998f-4f0d-93df-ace189cbc61c', 'e1a0ca47-173f-4c93-a2bb-678e68a2fa61', 5, 2026, 6500000, 0, 0, 100000, 65000, 195000, 0, 6140000, 'Dibayarkan'),
  ('ef0154d7-0bf7-4f5c-b6e8-4382b890153d', 'e1a0ca47-173f-4c93-a2bb-678e68a2fa61', 6, 2026, 6500000, 0, 0, 100000, 65000, 195000, 0, 6140000, 'Draft'),
  ('2faba4ab-4bfd-4116-872c-67d135a6ffa7', '11bf125b-b66a-44ea-9a30-73ed9524e7bc', 5, 2026, 10500000, 0, 0, 400000, 105000, 315000, 0, 9680000, 'Dibayarkan'),
  ('83ab4b50-1ec4-4ff1-8b66-2deaf9af5ffe', '11bf125b-b66a-44ea-9a30-73ed9524e7bc', 6, 2026, 10500000, 0, 0, 400000, 105000, 315000, 0, 9680000, 'Draft'),
  ('4563c496-ad37-41b5-b49c-5cd4f8764569', 'ccb5862d-21dc-4d07-8da0-dd411bb3d97e', 5, 2026, 8500000, 0, 0, 200000, 85000, 255000, 0, 7960000, 'Dibayarkan'),
  ('c9eb3610-dd8c-40bc-85e1-457ed86b2c5b', 'ccb5862d-21dc-4d07-8da0-dd411bb3d97e', 6, 2026, 8500000, 0, 0, 200000, 85000, 255000, 0, 7960000, 'Draft'),
  ('e58e4b56-cb2d-4c80-ade0-0a52b7b5d8c1', '9f388845-acbf-4178-8ef3-c4e5ac4511ac', 5, 2026, 16000000, 0, 0, 1225000, 120000, 425474, 0, 14229526, 'Dibayarkan'),
  ('f73b47c9-7fc3-4629-bbb6-43cf8356a9b4', '9f388845-acbf-4178-8ef3-c4e5ac4511ac', 6, 2026, 16000000, 0, 0, 1225000, 120000, 425474, 0, 14229526, 'Draft');
INSERT INTO kontrak_kerja (id, employee_id, contract_type, start_date, end_date, notes) VALUES
  ('ctr-cba25834-fa8f-4c21-847d-ddea7760e465', 'ab2109d1-e11f-4e79-8ecf-c8dc5b87cb5a', 'Tetap', '2024-01-10', NULL, 'Karyawan tetap, posisi Staff Dokumentasi Ekspor-Impor.'),
  ('ctr-23e22555-e779-4e16-94cb-e73928fa31a2', '533fb02e-c137-444e-94b5-a0f7ea88058c', 'Tetap', '2024-01-10', NULL, 'Karyawan tetap, posisi Finance & Accounting Staff.'),
  ('ctr-b33d4c5d-5f93-491c-911c-c0f963bd4b7c', '11bf125b-b66a-44ea-9a30-73ed9524e7bc', 'Tetap', '2024-01-10', NULL, 'Karyawan tetap, posisi HR & GA Supervisor.'),
  ('ctr-bf15a493-c4bb-4324-b325-b76e7ab9bdb6', 'ccb5862d-21dc-4d07-8da0-dd411bb3d97e', 'Tetap', '2024-01-10', NULL, 'Karyawan tetap, posisi Staff PPJK (Kepabeanan).'),
  ('ctr-15778ed7-630e-4bd5-9a7a-ee52828cb1e1', '9f388845-acbf-4178-8ef3-c4e5ac4511ac', 'Tetap', '2024-01-10', NULL, 'Karyawan tetap, posisi Operational Manager.'),
  ('ctr-bedab04e-89fe-45ba-a1d6-afc2b9e3fca1', 'e19a4e1b-d365-4d5a-826c-7b66aa8cca62', 'Tetap', '2024-01-10', NULL, 'Karyawan tetap, posisi Koordinator Armada & Trucking.'),
  ('ctr-71b3ccfb-53b9-44a3-8616-7335c1fa067e', 'f132413c-0c1d-4de9-ac53-21b0bcbe57d4', 'Tetap', '2024-01-10', NULL, 'Karyawan tetap, posisi Customer Service Ekspor-Impor.'),
  ('ctr-3b2eeffa-99e5-4d31-9af4-d1217d35a82e', '84019708-d3d6-43f8-817b-da2ff8052eeb', 'Tetap', '2024-01-10', NULL, 'Karyawan tetap, posisi Supervisor Gudang & Cargo.'),
  ('ctr-b496f557-11f1-455f-943a-893b7fd1da2a', 'e1a0ca47-173f-4c93-a2bb-678e68a2fa61', 'Tetap', '2024-01-10', NULL, 'Karyawan tetap, posisi HR & GA Staff.'),
  ('ctr-d1c81f36-b53c-4ab9-98ee-b3fbc39715be', '217ac2be-f6bc-4481-bdb6-db3d68a26083', 'Tetap', '2024-01-10', NULL, 'Karyawan tetap, posisi HSE Officer.');
INSERT INTO insentif (id, employee_id, program, amount, period, notes, type, status) VALUES
  ('inc-7dbbd121-6e12-4513-b106-ab5d5038d69e', 'e19a4e1b-d365-4d5a-826c-7b66aa8cca62', 'Insentif Kinerja Q2 2026', 2000000, '06/2026', 'Berdasarkan pencapaian target pengiriman.', 'incentive', 'Disetujui'),
  ('inc-618f284b-510d-48d5-84ef-4fd0b21ad9b5', 'ccb5862d-21dc-4d07-8da0-dd411bb3d97e', 'Insentif Lembur Proyek Ekspor', 750000, '06/2026', NULL, 'incentive', 'Dibayarkan'),
  ('inc-cdf1b9c6-5ae0-40ba-af28-a568279c551b', '84019708-d3d6-43f8-817b-da2ff8052eeb', 'Bonus Tahunan 2026', 3000000, '12/2026', 'Bonus tahunan berdasarkan evaluasi kinerja.', 'bonus', 'Pending'),
  ('inc-a0ab32a5-1eaf-4d00-a550-23e3dc562fb3', '9f388845-acbf-4178-8ef3-c4e5ac4511ac', 'Bonus Pencapaian Target Operasional', 5000000, '06/2026', 'Pencapaian target operasional divisi.', 'bonus', 'Disetujui');

-- ══════════════ LAINNYA — Shift, Kebijakan, Riwayat Permintaan SDM ══════════════
INSERT INTO jadwal_shift (id, employee_id, shift_id, shift_date, has_bonus, bonus_amount, notes) VALUES
  ('sched-84019708-d3d6-43f8-817b-da2ff8052eeb-2026-07-16', '84019708-d3d6-43f8-817b-da2ff8052eeb', 'shift-pagi', '2026-07-16', FALSE, 0, NULL),
  ('sched-e19a4e1b-d365-4d5a-826c-7b66aa8cca62-2026-07-16', 'e19a4e1b-d365-4d5a-826c-7b66aa8cca62', 'shift-siang', '2026-07-16', FALSE, 0, NULL),
  ('sched-ab2109d1-e11f-4e79-8ecf-c8dc5b87cb5a-2026-07-17', 'ab2109d1-e11f-4e79-8ecf-c8dc5b87cb5a', 'shift-malam', '2026-07-17', TRUE, 100000, 'Shift malam lembur gudang.');
INSERT INTO kebijakan_perusahaan (id, title, category, content, effective_date, revision, created_by) VALUES
  ('pol-9677a55b-1f6f-4ce6-b0c5-dc54b569beaf', 'Kebijakan Kode Etik Karyawan', 'Etika', 'Seluruh karyawan wajib menjunjung tinggi integritas, kejujuran, dan profesionalisme dalam bekerja.', '2026-01-01', 'Rev. 1', 'Budi Santoso'),
  ('pol-89fbade3-1a0e-4066-a9f7-1e8211703a08', 'Kebijakan Cuti dan Izin', 'SDM', 'Ketentuan pengajuan cuti tahunan, cuti sakit, dan izin khusus bagi seluruh karyawan.', '2026-01-01', 'Rev. 1', 'Budi Santoso'),
  ('pol-59af9437-74bd-46a3-a795-0ce9d771ebef', 'Kebijakan Keselamatan Kerja Gudang', 'HSE', 'Prosedur keselamatan wajib bagi seluruh staf yang bertugas di area gudang dan cargo.', '2026-02-01', 'Rev. 1', 'Yudi Firmansyah');
INSERT INTO riwayat_permintaan_sdm (id, request_id, action, actor_name, actor_role, to_status) VALUES
  ('wrh-5d3a0a15-1b51-4dae-89c3-4aa0e4dba7ca', 'rsdm-01', 'Diajukan', 'Fajar Nugroho', 'department_manager', 'Pending');

-- ══════════════ EMPLOYEE 360 TABS ══════════════
INSERT INTO aset_karyawan (id, karyawan_id, nama_aset, kategori, nomor_seri, tanggal_serah, status) VALUES
  ('aset-060f6c81-cabb-48da-967e-b4cfa14695ea', 'e19a4e1b-d365-4d5a-826c-7b66aa8cca62', 'Handphone Operasional Samsung A54', 'Elektronik', 'SN-HP-0231', '2025-03-01', 'Dipegang'),
  ('aset-73e9c401-9561-4381-a50c-c1e9eafb5bc4', '533fb02e-c137-444e-94b5-a0f7ea88058c', 'Laptop Lenovo ThinkPad E14', 'Elektronik', 'SN-LP-0117', '2024-06-15', 'Dipegang'),
  ('aset-331a0adb-5365-4532-9fc8-79e50c686b26', '84019708-d3d6-43f8-817b-da2ff8052eeb', 'Radio HT Motorola', 'Komunikasi', 'SN-HT-0045', '2025-01-10', 'Dipegang');
INSERT INTO dokumen_karyawan (id, karyawan_id, jenis, judul, catatan) VALUES
  ('doc-fa88a0de-dfe5-497b-adc0-9ae544dcabda', 'e1a0ca47-173f-4c93-a2bb-678e68a2fa61', 'KTP', 'Scan KTP Siti Rahayu', NULL),
  ('doc-bba428cd-7e5a-4b97-83ba-018a77e925aa', '11bf125b-b66a-44ea-9a30-73ed9524e7bc', 'Ijazah', 'Ijazah S1 Budi Santoso', 'Jurusan Manajemen SDM'),
  ('doc-1cc23e16-7dc0-4fa7-84a9-3cc4cace9a38', '9f388845-acbf-4178-8ef3-c4e5ac4511ac', 'Kontrak Kerja', 'Kontrak Kerja Tetap Fajar Nugroho', NULL);
INSERT INTO evaluasi_kpi (id, employee_id, period, period_start, period_end, score, comments, status, evaluator_id) VALUES
  ('kpi-51959fe1-7711-43a5-bd77-58c44c483dd5', 'e19a4e1b-d365-4d5a-826c-7b66aa8cca62', '2026-Q2', '2026-04-01', '2026-06-30', 88, 'Pencapaian target pengiriman sangat baik.', 'Approved', 'fajar.nugroho@ptpgp.co.id'),
  ('kpi-c2864cea-4004-4393-a6e9-f0bc36e02b38', '84019708-d3d6-43f8-817b-da2ff8052eeb', '2026-Q2', '2026-04-01', '2026-06-30', 82, 'Manajemen gudang berjalan lancar.', 'Approved', 'fajar.nugroho@ptpgp.co.id'),
  ('kpi-404a4541-c29a-46bd-9f8b-0836aacef1d3', 'ccb5862d-21dc-4d07-8da0-dd411bb3d97e', '2026-Q2', '2026-04-01', '2026-06-30', 76, 'Perlu peningkatan kecepatan proses dokumen.', 'Reviewed', 'fajar.nugroho@ptpgp.co.id'),
  ('kpi-9f5de2fe-a292-4b15-9f01-b2fac4400169', '533fb02e-c137-444e-94b5-a0f7ea88058c', '2026-Q2', '2026-04-01', '2026-06-30', 80, 'Laporan keuangan tepat waktu.', 'Draft', 'budi.santoso@ptpgp.co.id');
INSERT INTO kompetensi_karyawan (id, employee_id, skill_id, current_level, assessed_by, assessment_type, evidence) VALUES
  ('es-f57a6d07-fb8d-49c8-a339-da8115550d8a', 'ccb5862d-21dc-4d07-8da0-dd411bb3d97e', 'sk-01', 3, 'fajar.nugroho@ptpgp.co.id', 'Manager Assessment', 'Berhasil menangani 20+ dokumen kepabeanan tanpa revisi.'),
  ('es-91a3170f-34f8-404d-be04-f83619bfe28c', '84019708-d3d6-43f8-817b-da2ff8052eeb', 'sk-02', 4, 'fajar.nugroho@ptpgp.co.id', 'Manager Assessment', 'Mengelola operasional gudang dengan tingkat akurasi tinggi.'),
  ('es-d770821c-5553-4f2d-9a7a-5f895e6898da', 'f132413c-0c1d-4de9-ac53-21b0bcbe57d4', 'sk-03', 3, 'fajar.nugroho@ptpgp.co.id', 'Manager Assessment', 'Rating kepuasan klien tinggi.'),
  ('es-72ef1c45-236a-4063-a9ab-313657ef17a1', '533fb02e-c137-444e-94b5-a0f7ea88058c', 'sk-04', 4, 'budi.santoso@ptpgp.co.id', 'Self Assessment', 'Menyusun laporan rekonsiliasi otomatis dengan Excel.'),
  ('es-31cb4098-33bf-4176-b00b-1f65266d6dc6', 'e19a4e1b-d365-4d5a-826c-7b66aa8cca62', 'sk-05', 4, 'fajar.nugroho@ptpgp.co.id', 'Manager Assessment', 'Memimpin tim armada 8 orang dengan baik.');
INSERT INTO pengalaman_proyek_karyawan (id, karyawan_id, nama_proyek, peran, klien, tanggal_mulai, tanggal_selesai, deskripsi) VALUES
  ('proj-db924804-e0d2-4de6-b2c6-df0b0d5332c2', 'ccb5862d-21dc-4d07-8da0-dd411bb3d97e', 'Ekspor Furnitur PT Kayu Jati Nusantara', 'PIC Dokumentasi Kepabeanan', 'PT Kayu Jati Nusantara', '2026-06-01', '2026-07-15', 'Mengurus seluruh dokumen kepabeanan ekspor.'),
  ('proj-81caa12a-edfd-4237-9929-3a38553111bc', 'e19a4e1b-d365-4d5a-826c-7b66aa8cca62', 'Distribusi Cargo Rute Surabaya-Jakarta', 'Koordinator Armada', 'CV Sumber Makmur', '2026-05-10', '2026-06-10', 'Mengkoordinasikan 5 armada truk untuk pengiriman rutin.');
INSERT INTO peserta_pelatihan (id, training_id, employee_id, status, enrolled_at) VALUES
  ('te-76ba9cf4-1b92-46cf-96a5-4eba54bc87fb', 'trn-01', 'ccb5862d-21dc-4d07-8da0-dd411bb3d97e', 'Completed', '2026-08-10T02:00:00Z'),
  ('te-43a0e636-969e-40b7-a32c-68d5ff00bed3', 'trn-01', 'ab2109d1-e11f-4e79-8ecf-c8dc5b87cb5a', 'Enrolled', '2026-08-10T02:00:00Z'),
  ('te-98542c2c-9ecc-4702-b5d2-8c5fe397c0bf', 'trn-02', '84019708-d3d6-43f8-817b-da2ff8052eeb', 'Completed', '2026-06-20T02:00:00Z'),
  ('te-0327fafb-1b53-4284-a94f-64accc6752ee', 'trn-02', 'e19a4e1b-d365-4d5a-826c-7b66aa8cca62', 'Completed', '2026-06-20T02:00:00Z');
INSERT INTO sertifikat_pelatihan (id, training_id, employee_id, certificate_number, completion_date, status) VALUES
  ('cert-9d7ffdaf-92e3-421d-bb01-ce67c6a12c79', 'trn-02', '84019708-d3d6-43f8-817b-da2ff8052eeb', 'CERT-K3-2026-001', '2026-06-29', 'Diterbitkan'),
  ('cert-82082c96-cf23-41ef-b806-6bfa2fd5d91a', 'trn-02', 'e19a4e1b-d365-4d5a-826c-7b66aa8cca62', 'CERT-K3-2026-002', '2026-06-29', 'Diterbitkan');
INSERT INTO surat_peringatan (id, employee_id, employee_name, employee_email, sp_level, reason, valid_until, issued_by, status) VALUES
  ('sp-6b62eea3-3aef-4d11-b3e0-1abfd6d7f1bc', 'f132413c-0c1d-4de9-ac53-21b0bcbe57d4', 'Maya Kusuma', 'maya.kusuma@ptpgp.co.id', 'SP1', 'Keterlambatan berulang tanpa keterangan pada Juni 2026.', '2026-12-01', 'Budi Santoso', 'Aktif');
INSERT INTO umpan_balik_kinerja (id, employee_id, reviewer_id, reviewer_name, category, rating, comment) VALUES
  ('fb-d7496abb-2094-40f1-ae68-6f45df8061c4', 'ccb5862d-21dc-4d07-8da0-dd411bb3d97e', '9f388845-acbf-4178-8ef3-c4e5ac4511ac', 'Fajar Nugroho', 'Kualitas Kerja', 4, 'Dokumen selalu rapi dan akurat.'),
  ('fb-06589be3-4717-42ea-b032-da5ac2ad8519', 'e19a4e1b-d365-4d5a-826c-7b66aa8cca62', '9f388845-acbf-4178-8ef3-c4e5ac4511ac', 'Fajar Nugroho', 'Kepemimpinan', 5, 'Sangat baik dalam mengarahkan tim armada.'),
  ('fb-549c92d6-e21d-4267-a62d-51edb27c7433', 'f132413c-0c1d-4de9-ac53-21b0bcbe57d4', '9f388845-acbf-4178-8ef3-c4e5ac4511ac', 'Fajar Nugroho', 'Kedisiplinan', 2, 'Perlu perbaikan dalam hal kehadiran tepat waktu.');
