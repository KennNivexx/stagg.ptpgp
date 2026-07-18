-- ============================================================================
-- SEED — remaining policy/config/support tables not covered by earlier seed
-- migrations. Additive, exception-tolerant per section like all other seed
-- migrations this session. Run after 20260726001_seed_full_database.sql.
--
-- Deliberately NOT seeded here (see rationale):
--   - data_wajah_karyawan: face recognition encodings can't be fabricated.
--   - log_pesan_wa / percakapan_wa / verifikasi_wa / permintaan_ubah_wajah:
--     WhatsApp bot feature was intentionally removed — do not re-populate.
--   - otp_reset_password: transient auth tokens, not seed data.
--   - arsip_absensi: archive table, populates naturally via archival jobs.
--   - departemen, jobs, leaves: legacy/duplicate tables superseded by
--     unit_organisasi, lowongan_kerja, pengajuan_cuti respectively — not
--     read by any current page, seeding them would just be dead data.
--   - riwayat_permintaan_sdm: audit-trail table, populates naturally as
--     permintaan_sdm rows are actioned through the app.
-- ============================================================================

DO $$ BEGIN
INSERT INTO leadership_frameworks (id, code, name, description) VALUES
  ('lf-01', 'LF-01', 'Leadership Framework 2026', 'Kerangka kompetensi kepemimpinan standar perusahaan.')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped leadership_frameworks: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO leadership_competencies (id, framework_id, kompetensi_id, required_level, weight_pct) VALUES
  ('lc-01', 'lf-01', 'sk-05', 4, 40),
  ('lc-02', 'lf-01', 'sk-03', 3, 30)
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped leadership_competencies: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO promotion_policies (id, framework_id, minimum_grade, min_performance_score, min_competency_score, min_leadership_score, mandatory_training_pct, min_attendance_pct, allow_active_warning, must_pass_assessment, require_vacant_position) VALUES
  ('pp-01', 'frm-01', 'demo-grade-g05', 90, 85, 80, 100, 95, FALSE, TRUE, TRUE)
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped promotion_policies: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO mutation_policies (id, framework_id, min_tenure_months, min_performance_score, allow_cross_stream) VALUES
  ('mp-01', 'frm-01', 12, 70, TRUE)
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped mutation_policies: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO rotation_policies (id, framework_id, max_tenure_months, mandatory_for_talent) VALUES
  ('rp-01', 'frm-01', 36, TRUE)
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped rotation_policies: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO succession_policies (id, framework_id, min_readiness_score, max_successors_per_position) VALUES
  ('scp-01', 'frm-01', 80, 3)
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped succession_policies: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO behaviour_indicator_budaya (id, budaya_id, deskripsi, urutan) VALUES
  ('bib-01', 'demo-budaya-01', 'Jujur dan transparan dalam setiap pekerjaan.', 1),
  ('bib-02', 'demo-budaya-02', 'Aktif berkolaborasi lintas departemen.', 1),
  ('bib-03', 'demo-budaya-03', 'Responsif terhadap kebutuhan klien.', 1)
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped behaviour_indicator_budaya: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO jawaban_survei (id, survey_id, employee_id, employee_name, answers) VALUES
  ('jsurv-01', 'st-01', '174e26b0-6a37-47ad-97f4-764ccf903680', 'Siti Rahayu', '{"q1":"Puas","q2":"Sangat Puas"}')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped jawaban_survei: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO konfigurasi_approval (id, workflow_name, steps, approver_1, approver_2, approver_3) VALUES
  ('konf-01', 'Approval Promosi', 3, 'Department Head', 'HR Director', 'Managing Director'),
  ('konf-02', 'Approval Cuti', 1, 'HRD', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped konfigurasi_approval: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO kpi_jabatan (id, jabatan_id, nama_kpi, satuan, bobot_default, aktif, urutan) VALUES
  ('kpij-01', 'demo-jab-ppjk', 'Ketepatan Waktu Proses Dokumen', '%', 40, TRUE, 1),
  ('kpij-02', 'demo-jab-ppjk', 'Akurasi Dokumen Kepabeanan', '%', 30, TRUE, 2)
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped kpi_jabatan: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO laporan_insiden (id, employee_id, employee_name, department, title, description, severity, status, is_sos) VALUES
  ('inc-01', '84019708-d3d6-43f8-817b-da2ff8052eeb', 'Rina Marlina', 'Operational Division', 'Kontainer Tergelincir di Area Gudang', 'Kontainer kosong tergelincir saat proses bongkar, tidak ada korban jiwa.', 'Sedang', 'Ditindaklanjuti', FALSE)
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped laporan_insiden: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO panduan_level_kompetensi (skill_id, department, level, title, description, indicators) VALUES
  ('sk-01', 'Operational Division', 3, 'Kompeten', 'Mampu menangani dokumen kepabeanan standar secara mandiri.', 'Menyelesaikan PIB/PEB tanpa supervisi, tingkat error rendah.'),
  ('sk-01', 'Operational Division', 4, 'Mahir', 'Mampu menangani kasus kepabeanan kompleks dan membimbing staf junior.', 'Menjadi rujukan tim untuk kasus sulit, tingkat error sangat rendah.')
ON CONFLICT DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped panduan_level_kompetensi: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO usulan_kompetensi (id, name, category, department, requested_by, status) VALUES
  ('usk-01', 'Digital Documentation Tools', 'Teknis', 'Operational Division', 'gm.ops@ptpgp.co.id', 'Pending')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped usulan_kompetensi: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO pengaturan_notifikasi (event_type, email_enabled, sms_enabled, inapp_enabled, subject, body) VALUES
  ('leave_approved', TRUE, FALSE, TRUE, 'Pengajuan Cuti Disetujui', 'Pengajuan cuti Anda telah disetujui oleh HRD.'),
  ('leave_submitted', TRUE, FALSE, TRUE, 'Pengajuan Cuti Baru', 'Terdapat pengajuan cuti baru yang menunggu persetujuan.')
ON CONFLICT (event_type) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped pengaturan_notifikasi: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO pengaturan_sistem (key, value) VALUES
  ('company_name', '"PT Pratama Galuh Perkasa"'),
  ('attendance_geofence_radius_m', '250')
ON CONFLICT (key) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped pengaturan_sistem: %', SQLERRM;
END $$;
