-- Seed data for previously-empty tables (HRIS PGP)
-- Generated from the actual rows inserted into the live database on 2026-07-25.
-- Safe to re-run: ON CONFLICT (id) DO NOTHING.

-- employee_cases (3 rows)
INSERT INTO employee_cases (id, case_type, case_category_id, reporter_karyawan_id, subject_karyawan_id, subject_department, title, description, status, pic_karyawan_id, sla_due_date, created_at, updated_at) VALUES
  ('case-ce2a4513-fe03-4906-b56c-1d4564a95fc9', 'Complaint', 'cat-complaint', 'ab2109d1-e11f-4e79-8ecf-c8dc5b87cb5a', NULL, 'Operasional', 'Keterlambatan reimbursement biaya perjalanan dinas', 'Reimbursement perjalanan dinas bulan lalu belum cair lebih dari 30 hari kerja.', 'Investigation', '11bf125b-b66a-44ea-9a30-73ed9524e7bc', '2026-08-01', '2026-07-25T07:14:14.503+00:00', '2026-07-25T07:14:14.503+00:00'),
  ('case-e71c64b1-f6f8-4a3d-9ce3-481783d1ce4e', 'Grievance', 'cat-grievance', 'ccb5862d-21dc-4d07-8da0-dd411bb3d97e', NULL, 'Operasional', 'Ketidakpuasan terhadap rotasi jadwal shift gudang', 'Jadwal shift dirasa tidak merata antar staff gudang selama 2 bulan terakhir.', 'Case Created', NULL, '2026-08-08', '2026-07-25T07:14:14.503+00:00', '2026-07-25T07:14:14.503+00:00'),
  ('case-655d905e-5cf5-4d0d-9afa-98cbff993b01', 'Ethics Violation', 'cat-ethics', '11bf125b-b66a-44ea-9a30-73ed9524e7bc', '8cc82199-6c2e-491d-b53e-6dc3a0a97f36', 'SCM (Supply Chain Management)', 'Dugaan konflik kepentingan pada proses pengadaan sparepart', 'Laporan dugaan hubungan keluarga antara staff pengadaan dan salah satu vendor sparepart armada.', 'Committee Review', '11bf125b-b66a-44ea-9a30-73ed9524e7bc', '2026-07-23', '2026-07-25T07:14:14.503+00:00', '2026-07-25T07:14:14.503+00:00')
ON CONFLICT (id) DO NOTHING;

-- individual_development_plans (2 rows)
INSERT INTO individual_development_plans (id, karyawan_id, assessment_id, period, status, created_at, updated_at) VALUES
  ('idp-5b109512-86b8-490c-b855-a71ca159c7ec', '3604891d-b73d-4037-8615-935a1f186aa2', NULL, '2026', 'In Progress', '2026-07-25T07:14:14.846+00:00', '2026-07-25T07:14:14.846+00:00'),
  ('idp-e6e017b7-e3ce-49a8-a62c-a4f66778b05e', 'ccb5862d-21dc-4d07-8da0-dd411bb3d97e', NULL, '2026', 'Draft', '2026-07-25T07:14:14.846+00:00', '2026-07-25T07:14:14.846+00:00')
ON CONFLICT (id) DO NOTHING;

-- idp_items (3 rows)
INSERT INTO idp_items (id, idp_id, activity_type, description, target_date, pic_karyawan_id, status, created_at, updated_at) VALUES
  ('idpi-8ea1a005-f81e-4962-aa19-be7ffe6bb028', 'idp-5b109512-86b8-490c-b855-a71ca159c7ec', 'Training', 'Mengikuti Pelatihan HRIS & Digitalisasi SDM', '2026-09-23', '3604891d-b73d-4037-8615-935a1f186aa2', 'In Progress', '2026-07-25T07:14:15.287+00:00', '2026-07-25T07:14:15.287+00:00'),
  ('idpi-c72bd60d-ca69-4dc9-bc50-c841596897b3', 'idp-5b109512-86b8-490c-b855-a71ca159c7ec', 'Coaching', 'Coaching kepemimpinan tim oleh Kepala Divisi SDM & Aset', '2026-10-23', '11bf125b-b66a-44ea-9a30-73ed9524e7bc', 'Not Started', '2026-07-25T07:14:15.287+00:00', '2026-07-25T07:14:15.287+00:00'),
  ('idpi-177ca661-338c-446a-a966-5815ed13f75c', 'idp-e6e017b7-e3ce-49a8-a62c-a4f66778b05e', 'Job Rotation', 'Rotasi singkat ke tim Marketing & PPJK Batam untuk memperluas wawasan operasional', '2026-11-22', '94dde282-3c16-4f5d-887f-59395dd1b4b4', 'Not Started', '2026-07-25T07:14:15.287+00:00', '2026-07-25T07:14:15.287+00:00')
ON CONFLICT (id) DO NOTHING;

-- succession_plans (3 rows)
INSERT INTO succession_plans (id, critical_position_id, karyawan_id, readiness_status, notes, created_at, updated_at) VALUES
  ('succ-5bcef583-aa25-4cf6-91b3-b3a802f4ce8d', 'cp-01', '7b1e4a2c-5f8d-4e91-a3b6-1c2d3e4f5a63', 'Ready Within 1 Year', 'Perlu pengalaman tambahan di manajemen armada skala besar sebelum siap menggantikan GM Operasional.', '2026-07-25T07:14:15.447+00:00', '2026-07-25T07:14:15.447+00:00'),
  ('succ-5509c480-df27-446d-af45-1aeabe36260c', 'cp-02', 'ccb5862d-21dc-4d07-8da0-dd411bb3d97e', 'Ready Within 6 Months', 'Sudah menguasai proses kepabeanan harian, tinggal penguatan people management.', '2026-07-25T07:14:15.447+00:00', '2026-07-25T07:14:15.447+00:00'),
  ('succ-d47f3ba1-aa3b-4c98-a940-0cbf7e0a0b3e', 'cp-03', '3604891d-b73d-4037-8615-935a1f186aa2', 'Need Development', 'Kandidat internal, masih perlu pengembangan di aspek strategic HR planning.', '2026-07-25T07:14:15.447+00:00', '2026-07-25T07:14:15.447+00:00')
ON CONFLICT (id) DO NOTHING;

-- labour_unions (1 rows)
INSERT INTO labour_unions (id, name, chairman_karyawan_id, member_count, registered_date, status, created_at) VALUES
  ('lu-08510c7d-62ff-4473-8474-b5b7582626bd', 'Serikat Pekerja PT Pratama Galuh Perkasa (SP-PGP)', '11bf125b-b66a-44ea-9a30-73ed9524e7bc', 24, '2023-02-10', 'Active', '2026-07-25T07:14:15.62+00:00')
ON CONFLICT (id) DO NOTHING;

-- employee_separations (2 rows)
INSERT INTO employee_separations (id, separation_type, karyawan_id, exit_reason_id, effective_date, reason, exit_interview_done, exit_interview_notes, status, created_at, updated_at) VALUES
  ('sep-1c3b39ea-bdab-41cd-ac77-e240c19253d6', 'End of Contract', 'a512a9ac-2954-4bf0-a34e-7f71e515e346', 'er-01', '2026-08-24', 'Kontrak kerja berakhir dan tidak diperpanjang atas kesepakatan bersama.', false, NULL, 'Diajukan', '2026-07-25T07:14:15.78+00:00', '2026-07-25T07:14:15.78+00:00'),
  ('sep-7f29032c-d3aa-43ef-9490-1cebcd847834', 'Retirement', '6a291a56-7714-45f3-98ae-825fce7785d5', 'er-03', '2026-10-23', 'Memasuki usia pensiun sesuai kebijakan perusahaan.', false, NULL, 'Disetujui', '2026-07-25T07:14:15.78+00:00', '2026-07-25T07:14:15.78+00:00')
ON CONFLICT (id) DO NOTHING;

-- er_approvals (2 rows)
INSERT INTO er_approvals (id, category, reference_id, approver_role, approver_karyawan_id, status, notes, decided_at, created_at) VALUES
  ('era-3ec1cceb-632a-4506-b79e-8e2679db9bd6', 'Separation', 'sep-7f29032c-d3aa-43ef-9490-1cebcd847834', 'Direktur', NULL, 'Approved', 'Disetujui sesuai kebijakan pensiun.', '2026-07-25T07:14:15.951+00:00', '2026-07-25T07:14:15.951+00:00'),
  ('era-4c5f6ffb-19d7-4f0c-97df-36c1f5d3af7d', 'Case Closure', 'case-ce2a4513-fe03-4906-b56c-1d4564a95fc9', 'Kepala Divisi SDM & Aset', '11bf125b-b66a-44ea-9a30-73ed9524e7bc', 'Pending', NULL, NULL, '2026-07-25T07:14:15.951+00:00')
ON CONFLICT (id) DO NOTHING;

-- evaluasi_pelatihan (3 rows)
INSERT INTO evaluasi_pelatihan (id, training_id, karyawan_id, reaction_score, learning_score, behavior_score, result_notes, created_at) VALUES
  ('ev-03c6d2d0-a4eb-47eb-b764-93bc6f33094e', 'trn-01', 'ccb5862d-21dc-4d07-8da0-dd411bb3d97e', 4, 4, 3, 'Peserta menunjukkan peningkatan kompetensi sesuai target pelatihan.', '2026-07-25T07:14:16.687516+00:00'),
  ('ev-c3699a59-b4f2-45e3-8d08-88d4dcdd8f97', 'trn-02', '84019708-d3d6-43f8-817b-da2ff8052eeb', 5, 4, 4, 'Peserta menunjukkan peningkatan kompetensi sesuai target pelatihan.', '2026-07-25T07:14:16.687516+00:00'),
  ('ev-5a65e0dc-819d-4e00-8c59-adfa482afa99', 'trn-02', 'e19a4e1b-d365-4d5a-826c-7b66aa8cca62', 4, 4, 3, 'Peserta menunjukkan peningkatan kompetensi sesuai target pelatihan.', '2026-07-25T07:14:16.687516+00:00')
ON CONFLICT (id) DO NOTHING;

-- tna_kompetensi (3 rows)
INSERT INTO tna_kompetensi (id, karyawan_id, skill_id, required_level, current_level, gap, status, pelatihan_id, created_at) VALUES
  ('tna-c1f61e8e-c14d-4934-a718-b606881e4980', '7b1e4a2c-5f8d-4e91-a3b6-1c2d3e4f5a63', 'sk-02', 3, 1, -2, 'Open', NULL, '2026-07-25T07:14:16.865461+00:00'),
  ('tna-95f52a73-4792-4169-b6aa-48d9cf937f72', 'ab2109d1-e11f-4e79-8ecf-c8dc5b87cb5a', 'sk-01', 4, 2, -2, 'Open', NULL, '2026-07-25T07:14:16.865461+00:00'),
  ('tna-fc7d26a1-fc53-4d47-9007-dab804e34f0f', '0115c9ec-5cf0-42da-bbf2-1e73aa2bcc6d', 'sk-04', 3, 2, -1, 'Open', NULL, '2026-07-25T07:14:16.865461+00:00')
ON CONFLICT (id) DO NOTHING;

-- jawaban_survei (3 rows)
INSERT INTO jawaban_survei (id, survey_id, employee_id, employee_name, answers, submitted_at) VALUES
  ('resp-1698e526-8de8-4d2a-bab3-6f427e83ec6f', 'surv-01', '17f05dcf-5ff4-43e7-afe9-a10f45f37db5', 'Nilvi Rahayu', '{"q1":4,"q2":4}'::jsonb, '2026-07-25T07:14:35.341+00:00'),
  ('resp-b76e5545-29e8-4f54-bbd2-15c7dd49b184', 'surv-01', '45e4a01b-464b-45c6-b3f6-1cfdb5da2605', 'Faris Abdul Fatah', '{"q1":3,"q2":4}'::jsonb, '2026-07-25T07:14:35.346+00:00'),
  ('resp-78b1f628-a4a2-47ea-a650-4868a14c104e', 'surv-02', '0115c9ec-5cf0-42da-bbf2-1e73aa2bcc6d', 'Melisa Riyanti', '{"q1":9}'::jsonb, '2026-07-25T07:14:35.347+00:00')
ON CONFLICT (id) DO NOTHING;

-- participation_entries (4 rows)
INSERT INTO participation_entries (id, participation_type, karyawan_id, title, description, score, status, response, responded_by, created_at) VALUES
  ('part-a2ed332c-b980-4540-b490-c5a02cf95063', 'Suggestion', 'ec3997ce-e755-45c4-aa8c-e56bec2b9164', 'Usulan digitalisasi form pengeluaran barang gudang', 'Mengganti Form Pengeluaran Barang (FPB) kertas dengan form digital agar lebih cepat dan tidak hilang.', NULL, 'Submitted', NULL, NULL, '2026-07-25T07:14:16.811+00:00'),
  ('part-3ba80d4d-c9a5-4da7-a702-88c97aadb5d0', 'Satisfaction Survey', '17f05dcf-5ff4-43e7-afe9-a10f45f37db5', 'Employee Satisfaction Survey Q2 2026', NULL, 4, 'Submitted', NULL, NULL, '2026-07-25T07:14:16.811+00:00'),
  ('part-2e6be14b-7b33-4c88-b572-1e326ed58ac0', 'Polling', '0115c9ec-5cf0-42da-bbf2-1e73aa2bcc6d', 'Employee Net Promoter Score', NULL, 9, 'Submitted', NULL, NULL, '2026-07-25T07:14:16.811+00:00'),
  ('part-8d22fd1e-c631-4cbb-a1bf-a9c628c0bfa3', 'Innovation', 'a3bc1533-8e09-4f5b-b339-771d9f90b369', 'Usulan rute alternatif Cilegon-Batam untuk efisiensi bahan bakar', 'Berdasarkan pengalaman lapangan, ada rute alternatif yang bisa menghemat waktu tempuh dan BBM.', NULL, 'Submitted', NULL, NULL, '2026-07-25T07:14:16.811+00:00')
ON CONFLICT (id) DO NOTHING;

-- pemetaan_pengetahuan (4 rows)
INSERT INTO pemetaan_pengetahuan (id, content_type, content_id, skill_id, wajib, created_at) VALUES
  ('pk-9e78341b-5629-4bc7-b610-1927f250f546', 'sop', 'demo-sop-01', 'sk-01', true, '2026-07-25T07:14:17.356803+00:00'),
  ('pk-b684b77c-9083-451f-bcab-67ba6ddc7dac', 'sop', 'demo-sop-02', 'sk-01', true, '2026-07-25T07:14:17.356803+00:00'),
  ('pk-c0ca5c9a-28b2-4e24-9ed5-04fbc4b25494', 'artikel', 'art-01', 'sk-01', false, '2026-07-25T07:14:17.356803+00:00'),
  ('pk-85350721-47fd-4e77-b55e-fb193b5dd640', 'artikel', 'art-02', 'sk-02', false, '2026-07-25T07:14:17.356803+00:00')
ON CONFLICT (id) DO NOTHING;

-- riwayat_posisi_karyawan (2 rows)
INSERT INTO riwayat_posisi_karyawan (id, karyawan_id, formasi_id, jabatan_id, unit_organisasi_id, jenis_perubahan, tanggal_mulai, tanggal_selesai, keterangan, created_by, created_at) VALUES
  ('riw-4a37f79b-e723-4ec8-bdab-e41cf7f6b5cd', '3604891d-b73d-4037-8615-935a1f186aa2', 'demo-formasi-01', 'demo-jab-hrstaff', 'demo-unit-hr', 'Penempatan', '2021-01-15', NULL, NULL, 'HRD Admin', '2026-07-25T07:14:17.821395+00:00'),
  ('riw-d1fbb4da-7991-4100-8823-d9c08c139276', '17f05dcf-5ff4-43e7-afe9-a10f45f37db5', 'demo-formasi-02', 'demo-jab-hrspv', 'demo-unit-hr', 'Penempatan', '2023-12-01', NULL, NULL, 'HRD Admin', '2026-07-25T07:14:17.821395+00:00')
ON CONFLICT (id) DO NOTHING;

-- communication_reads (12 rows)
INSERT INTO communication_reads (id, communication_id, karyawan_id, read_at) VALUES
  ('cr-d194b35d-849a-419a-839f-b8c297d184c6', 'comm-ef118f73-4435-4443-8940-8daf9ef27096', '17f05dcf-5ff4-43e7-afe9-a10f45f37db5', '2026-07-25T07:14:17.731+00:00'),
  ('cr-35889191-a48e-4dc1-9527-72a0c0021767', 'comm-ef118f73-4435-4443-8940-8daf9ef27096', 'ec3997ce-e755-45c4-aa8c-e56bec2b9164', '2026-07-25T07:14:17.731+00:00'),
  ('cr-dd0e07a2-f410-42fd-8905-4baaa52d60e1', 'comm-ef118f73-4435-4443-8940-8daf9ef27096', '0115c9ec-5cf0-42da-bbf2-1e73aa2bcc6d', '2026-07-25T07:14:17.731+00:00'),
  ('cr-703757c0-1246-4451-a410-b6553bbefd1e', 'comm-ef118f73-4435-4443-8940-8daf9ef27096', 'a3bc1533-8e09-4f5b-b339-771d9f90b369', '2026-07-25T07:14:17.731+00:00'),
  ('cr-e3b4c1ec-4280-46ff-9b9f-cc1214a7b262', 'comm-8378a62e-e60f-452f-b06e-3eef569f3adc', '17f05dcf-5ff4-43e7-afe9-a10f45f37db5', '2026-07-25T07:14:17.731+00:00'),
  ('cr-7217da45-4ea4-4b2f-a9c0-debfc0e75770', 'comm-8378a62e-e60f-452f-b06e-3eef569f3adc', 'ec3997ce-e755-45c4-aa8c-e56bec2b9164', '2026-07-25T07:14:17.731+00:00'),
  ('cr-e8d375fd-36d4-4b68-b198-0b3aa07a1180', 'comm-8378a62e-e60f-452f-b06e-3eef569f3adc', '0115c9ec-5cf0-42da-bbf2-1e73aa2bcc6d', '2026-07-25T07:14:17.731+00:00'),
  ('cr-d118e401-7ea7-49b2-8612-b0f221bad362', 'comm-8378a62e-e60f-452f-b06e-3eef569f3adc', 'a3bc1533-8e09-4f5b-b339-771d9f90b369', '2026-07-25T07:14:17.731+00:00'),
  ('cr-3cfbec31-df25-4fe2-88fc-1cb996299649', 'comm-b7a1474e-e37b-41cf-b94e-92003e46b162', '17f05dcf-5ff4-43e7-afe9-a10f45f37db5', '2026-07-25T07:14:17.731+00:00'),
  ('cr-f39aa20e-0838-40df-bcd6-3427a4450f99', 'comm-b7a1474e-e37b-41cf-b94e-92003e46b162', 'ec3997ce-e755-45c4-aa8c-e56bec2b9164', '2026-07-25T07:14:17.731+00:00'),
  ('cr-ebc28661-ada4-40e7-a0a1-2c9a51484548', 'comm-b7a1474e-e37b-41cf-b94e-92003e46b162', '0115c9ec-5cf0-42da-bbf2-1e73aa2bcc6d', '2026-07-25T07:14:17.731+00:00'),
  ('cr-7972f696-e174-4a6c-9f08-b5cc425c8533', 'comm-b7a1474e-e37b-41cf-b94e-92003e46b162', 'a3bc1533-8e09-4f5b-b339-771d9f90b369', '2026-07-25T07:14:17.731+00:00')
ON CONFLICT (id) DO NOTHING;

-- arsip_absensi (1 rows)
INSERT INTO arsip_absensi (id, archive_date, record_count, records, created_at) VALUES
  ('att-arch-2026-06', '2026-06-30', 0, '[]'::jsonb, '2026-07-25T07:14:18.27176+00:00')
ON CONFLICT (id) DO NOTHING;

