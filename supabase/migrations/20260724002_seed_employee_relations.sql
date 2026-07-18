-- ============================================================================
-- DUMMY DATA — Employee Relations & Experience Management engine tables.
-- Additive, safe on top of 20260724001_employee_relations.sql and the
-- earlier org-hierarchy/seed migrations (uses demo-emp-* ids). Run after
-- 20260724001.
-- ============================================================================

DO $$ BEGIN
INSERT INTO communications (id, comm_type, title, content, category_id, target_audience, published_by, status) VALUES
  ('comm-01', 'Announcement', 'Libur Bersama Hari Raya 2026', 'Perusahaan akan libur bersama sesuai kalender nasional.', 'cc-01', 'All Employees', 'hrd@ptpgp.co.id', 'Published'),
  ('comm-02', 'Memo', 'Prosedur Klaim BPJS Kesehatan', 'Karyawan wajib mengikuti prosedur klaim terbaru mulai bulan ini.', 'cc-02', 'All Employees', 'hrd@ptpgp.co.id', 'Published'),
  ('comm-03', 'News', 'PT Pratama Galuh Perkasa Raih Sertifikasi ISO 9001', 'Pencapaian penting dalam standar kualitas layanan forwarding.', 'cc-04', 'All Employees', 'hrd@ptpgp.co.id', 'Published'),
  ('comm-04', 'Policy Distribution', 'Distribusi Kebijakan K3 Gudang', 'Seluruh staf operasional wajib membaca dan memahami kebijakan K3 terbaru.', 'cc-03', 'Operational Division', 'hrd@ptpgp.co.id', 'Published'),
  ('comm-05', 'Circular', 'Surat Edaran Jam Kerja Bulan Ramadhan', 'Penyesuaian jam kerja selama bulan Ramadhan.', 'cc-01', 'All Employees', 'hrd@ptpgp.co.id', 'Published'),
  ('comm-06', 'Emergency', 'Peringatan Cuaca Ekstrem — Operasional Pelabuhan', 'Tim lapangan diminta waspada terhadap cuaca ekstrem di area Tanjung Priok.', 'cc-03', 'Operational Division', 'hrd@ptpgp.co.id', 'Published')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped communications: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO communication_reads (id, communication_id, karyawan_id) VALUES
  ('cr-01', 'comm-01', 'e1a0ca47-173f-4c93-a2bb-678e68a2fa61'), ('cr-02', 'comm-01', '11bf125b-b66a-44ea-9a30-73ed9524e7bc'), ('cr-03', 'comm-01', '1cd2c026-2b1b-479e-9282-58ac97a61028'),
  ('cr-04', 'comm-02', 'e1a0ca47-173f-4c93-a2bb-678e68a2fa61'), ('cr-05', 'comm-03', 'a512a9ac-2954-4bf0-a34e-7f71e515e346')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped communication_reads: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO participation_entries (id, participation_type, karyawan_id, title, description, score, status, response, responded_by) VALUES
  ('part-01', 'Suggestion', '1cd2c026-2b1b-479e-9282-58ac97a61028', 'Digitalisasi Dokumen Kepabeanan', 'Usulan agar dokumen kepabeanan sepenuhnya digital untuk mempercepat proses.', NULL, 'Under Review', NULL, NULL),
  ('part-02', 'Innovation', 'f489b27a-5dee-490b-b578-4e750c4faff1', 'Sistem Tracking Real-time Kontainer', 'Ide integrasi GPS tracking untuk seluruh armada trucking.', NULL, 'Accepted', 'Akan dievaluasi bersama tim IT.', 'hrd@ptpgp.co.id'),
  ('part-03', 'Voice of Employee', NULL, 'Ruang Istirahat Gudang Kurang Memadai', 'Aspirasi anonim terkait fasilitas istirahat di area gudang.', NULL, 'Submitted', NULL, NULL),
  ('part-04', 'Polling', 'a512a9ac-2954-4bf0-a34e-7f71e515e346', 'eNPS Q1 2026', 'Seberapa besar kemungkinan merekomendasikan perusahaan sebagai tempat kerja?', 72, 'Submitted', NULL, NULL),
  ('part-05', 'Polling', '303e8e80-07bf-494c-99a3-8f7469d12eac', 'eNPS Q1 2026', 'Seberapa besar kemungkinan merekomendasikan perusahaan sebagai tempat kerja?', 65, 'Submitted', NULL, NULL),
  ('part-06', 'Feedback', '1cd2c026-2b1b-479e-9282-58ac97a61028', 'Masukan Proses Onboarding', 'Proses onboarding sudah baik namun materi pelatihan bisa lebih lengkap.', NULL, 'Submitted', NULL, NULL),
  ('part-07', 'Satisfaction Survey', 'e1a0ca47-173f-4c93-a2bb-678e68a2fa61', 'Employee Satisfaction Survey 2026-H1', 'Survei kepuasan karyawan periode pertama 2026.', 82, 'Submitted', NULL, NULL),
  ('part-08', 'Satisfaction Survey', '11bf125b-b66a-44ea-9a30-73ed9524e7bc', 'Employee Satisfaction Survey 2026-H1', 'Survei kepuasan karyawan periode pertama 2026.', 78, 'Submitted', NULL, NULL),
  ('part-09', 'Satisfaction Survey', 'af1f9c79-9add-4140-ba9d-a564fcda5bc8', 'Employee Satisfaction Survey 2026-H1', 'Survei kepuasan karyawan periode pertama 2026.', 90, 'Submitted', NULL, NULL),
  ('part-10', 'Satisfaction Survey', 'fc90f329-b1d3-41ce-9ec8-683b2af3ce08', 'Employee Satisfaction Survey 2026-H1', 'Survei kepuasan karyawan periode pertama 2026.', 61, 'Submitted', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped participation_entries: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO employee_cases (id, case_type, case_category_id, reporter_karyawan_id, subject_karyawan_id, subject_department, title, description, status, pic_karyawan_id, sla_due_date) VALUES
  ('case-01', 'Complaint', 'cat-complaint', '1cd2c026-2b1b-479e-9282-58ac97a61028', NULL, 'Operational Division', 'Keterlambatan Penggajian', 'Slip gaji bulan lalu terlambat diterima.', 'Case Closed', 'a512a9ac-2954-4bf0-a34e-7f71e515e346', CURRENT_DATE - 10),
  ('case-02', 'Grievance', 'cat-grievance', '84019708-d3d6-43f8-817b-da2ff8052eeb', 'fc90f329-b1d3-41ce-9ec8-683b2af3ce08', 'Operational Division', 'Ketidakadilan Pembagian Shift', 'Pembagian shift dirasa tidak merata antar staf gudang.', 'Investigation', '94dde282-3c16-4f5d-887f-59395dd1b4b4', CURRENT_DATE + 5),
  ('case-03', 'Ethics Violation', 'cat-ethics', NULL, NULL, 'Procurement Division', 'Dugaan Konflik Kepentingan Vendor', 'Laporan dugaan konflik kepentingan dalam pemilihan vendor.', 'Committee Review', 'b7b46400-4225-45ac-a4de-97af1a68da3c', CURRENT_DATE + 2),
  ('case-04', 'Fraud', 'cat-fraud', NULL, NULL, 'Finance', 'Dugaan Manipulasi Laporan Biaya', 'Indikasi ketidaksesuaian laporan reimbursement.', 'Investigation', '58291f18-63d9-443c-9c3d-bc37bebe61ea', CURRENT_DATE - 2),
  ('case-05', 'Harassment', 'cat-harassment', 'e1a0ca47-173f-4c93-a2bb-678e68a2fa61', NULL, 'HR & GA', 'Laporan Perundungan Verbal', 'Laporan perundungan verbal antar rekan kerja.', 'Corrective Action', 'a512a9ac-2954-4bf0-a34e-7f71e515e346', CURRENT_DATE - 1),
  ('case-06', 'Whistleblowing', 'cat-whistleblow', NULL, NULL, 'Operational Division', 'Dugaan Penyalahgunaan Aset Perusahaan', 'Pelaporan anonim dugaan penyalahgunaan kendaraan operasional.', 'Case Created', NULL, CURRENT_DATE + 6)
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped employee_cases: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO case_investigations (id, case_id, investigation_type_id, investigator_karyawan_id, findings, status) VALUES
  ('cinv-01', 'case-02', 'it-01', '94dde282-3c16-4f5d-887f-59395dd1b4b4', 'Wawancara awal menunjukkan perlu revisi jadwal shift.', 'In Progress'),
  ('cinv-02', 'case-04', 'it-02', '58291f18-63d9-443c-9c3d-bc37bebe61ea', 'Sedang mengumpulkan bukti dokumen transaksi.', 'In Progress')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped case_investigations: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO case_corrective_actions (id, case_id, disciplinary_category_id, action_description, issued_by, status) VALUES
  ('cca-01', 'case-05', 'dc-02', 'Surat Peringatan 1 dan sesi konseling wajib.', 'hrd@ptpgp.co.id', 'Issued')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped case_corrective_actions: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO labour_unions (id, name, chairman_karyawan_id, member_count, registered_date, status) VALUES
  ('lu-01', 'Serikat Pekerja PT Pratama Galuh Perkasa (SP-PGP)', 'f489b27a-5dee-490b-b578-4e750c4faff1', 45, '2020-01-15', 'Active')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped labour_unions: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO industrial_meetings (id, meeting_type, title, agenda, participants, outcome, meeting_date, status) VALUES
  ('im-01', 'Bipartite', 'Rapat Bipartit Triwulan Q1 2026', 'Pembahasan kondisi kerja dan kesejahteraan karyawan.', 'Manajemen, Perwakilan SP-PGP', 'Disepakati penyesuaian tunjangan transport.', CURRENT_DATE - 20, 'Completed'),
  ('im-02', 'Tripartite', 'Mediasi Dinas Ketenagakerjaan', 'Pembahasan kasus perselisihan shift kerja.', 'Manajemen, SP-PGP, Disnaker', NULL, CURRENT_DATE + 10, 'Scheduled'),
  ('im-03', 'Mediation', 'Mediasi Internal Kasus Shift Gudang', 'Negosiasi penyelesaian keluhan pembagian shift.', 'HR, Manager Gudang, Karyawan terkait', NULL, CURRENT_DATE + 3, 'Scheduled'),
  ('im-04', 'Dispute', 'Pencatatan Perselisihan Lembur', 'Dokumentasi perselisihan terkait perhitungan lembur.', 'HR, Karyawan terkait', NULL, CURRENT_DATE - 5, 'Completed'),
  ('im-05', 'PHI Documentation', 'Dokumentasi PHI Kasus 2025-003', 'Berkas pendukung proses PHI tahun lalu.', 'Legal, HR', 'Diselesaikan melalui mediasi.', CURRENT_DATE - 60, 'Completed')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped industrial_meetings: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO industrial_compliance_items (id, regulation_name, compliance_status, due_date, notes) VALUES
  ('ic-01', 'UU Ketenagakerjaan No. 13/2003', 'Compliant', NULL, 'Seluruh ketentuan dasar telah dipenuhi.'),
  ('ic-02', 'Wajib Lapor Ketenagakerjaan (WLTK)', 'Compliant', CURRENT_DATE + 90, 'Pelaporan tahunan sudah dilakukan.'),
  ('ic-03', 'BPJS Ketenagakerjaan & Kesehatan', 'At Risk', CURRENT_DATE + 15, 'Beberapa karyawan baru belum terdaftar, proses pendaftaran berjalan.'),
  ('ic-04', 'Peraturan Perusahaan (PP) Registrasi Ulang', 'Compliant', CURRENT_DATE + 300, 'Registrasi PP 2026 sudah disahkan Disnaker.')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped industrial_compliance_items: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO employee_separations (id, separation_type, karyawan_id, exit_reason_id, effective_date, reason, exit_interview_done, exit_interview_notes, status) VALUES
  ('sep-01', 'End of Contract', '217ac2be-f6bc-4481-bdb6-db3d68a26083', 'er-02', CURRENT_DATE + 30, 'Kontrak kerja berakhir, tidak diperpanjang.', FALSE, NULL, 'Diajukan'),
  ('sep-02', 'Retirement', '9f388845-acbf-4178-8ef3-c4e5ac4511ac', 'er-03', CURRENT_DATE + 180, 'Memasuki usia pensiun.', FALSE, NULL, 'Disetujui')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped employee_separations: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO er_approvals (id, category, reference_id, approver_role, approver_karyawan_id, status) VALUES
  ('erapp-01', 'Complaint', 'case-01', 'HR Manager', 'a512a9ac-2954-4bf0-a34e-7f71e515e346', 'Approved'),
  ('erapp-02', 'Investigation', 'case-02', 'Department Head', '94dde282-3c16-4f5d-887f-59395dd1b4b4', 'Pending'),
  ('erapp-03', 'Corrective Action', 'case-05', 'HR Director', 'b7b46400-4225-45ac-a4de-97af1a68da3c', 'Pending'),
  ('erapp-04', 'Industrial', 'im-02', 'HR Director', 'b7b46400-4225-45ac-a4de-97af1a68da3c', 'Pending'),
  ('erapp-05', 'Separation', 'sep-01', 'HR Manager', 'a512a9ac-2954-4bf0-a34e-7f71e515e346', 'Pending'),
  ('erapp-06', 'Case Closure', 'case-01', 'HR Director', 'b7b46400-4225-45ac-a4de-97af1a68da3c', 'Approved')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped er_approvals: %', SQLERRM;
END $$;
