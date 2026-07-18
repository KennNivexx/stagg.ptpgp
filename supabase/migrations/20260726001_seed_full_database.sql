-- ============================================================================
-- COMPREHENSIVE DATABASE SEED — fills every core operational table so no
-- menu/page in the app renders empty. Generated against the LIVE schema
-- (introspected via PostgREST OpenAPI, not assumed from migration files —
-- several earlier migrations in this repo were written but never actually
-- run, so column names/types here are verified against what really exists).
--
-- Run AFTER: 20260720002, 20260723001, 20260723002, 20260724001, 20260724002.
-- Purely additive (INSERT ... ON CONFLICT DO NOTHING), exception-tolerant
-- per section like every other seed migration this session.
--
-- Two employee ID spaces are used deliberately (see project memory
-- "Dual-Table Identity"):
--   - karyawan.id (HRD-managed employee records) — the UUIDs generated in
--     20260720002/20260723001 for Siti Rahayu, Budi Santoso, etc.
--   - pengguna.id (login/session records) — the REAL live UUIDs already in
--     the pengguna table (queried directly), used for self-service tables
--     (absensi, pengajuan_cuti, keluhan, pengunduran_diri, etc.) that key
--     off the logged-in session id, not the HRD karyawan record.
-- ============================================================================

-- ── WORKFORCE TIME MANAGEMENT ────────────────────────────────────────────

DO $$ BEGIN
INSERT INTO shift_kerja (id, name, start_time, end_time, has_bonus, bonus_amount, color) VALUES
  ('shift-pagi', 'Shift Pagi', '08:00', '16:00', FALSE, 0, '#dd2c00'),
  ('shift-siang', 'Shift Siang', '14:00', '22:00', TRUE, 25000, '#1A2530'),
  ('shift-malam', 'Shift Malam (Gudang & Cargo)', '22:00', '06:00', TRUE, 50000, '#64748b')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped shift_kerja: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO kalender_kerja (id, tanggal, nama_libur, jenis) VALUES
  ('kal-01', '2026-01-01', 'Tahun Baru Masehi', 'Libur Nasional'),
  ('kal-02', '2026-03-20', 'Hari Raya Nyepi', 'Libur Nasional'),
  ('kal-03', '2026-08-17', 'Hari Kemerdekaan RI', 'Libur Nasional'),
  ('kal-04', '2026-12-25', 'Hari Raya Natal', 'Libur Nasional')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped kalender_kerja: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO absensi (id, employee_id, date, check_in, check_out, status, employee_name, department, location_name, within_geofence, is_business_trip) VALUES
  ('abs-01', '174e26b0-6a37-47ad-97f4-764ccf903680', CURRENT_DATE, (CURRENT_DATE || ' 07:55')::timestamptz, (CURRENT_DATE || ' 17:05')::timestamptz, 'Hadir', 'Siti Rahayu', 'HR & GA', 'Kantor Pusat & Gudang PGP', TRUE, FALSE),
  ('abs-02', '62c07b25-a4a4-4be2-b089-bef8d2fbc253', CURRENT_DATE, (CURRENT_DATE || ' 08:10')::timestamptz, (CURRENT_DATE || ' 17:00')::timestamptz, 'Hadir', 'Budi Santoso', 'HR & GA', 'Kantor Pusat & Gudang PGP', TRUE, FALSE),
  ('abs-03', 'f4583421-7b7e-44ec-8c10-653cd722b52c', CURRENT_DATE, (CURRENT_DATE || ' 07:45')::timestamptz, NULL, 'Hadir', 'Rina Marlina', 'Operational Division', 'Kantor Pusat & Gudang PGP', TRUE, FALSE),
  ('abs-04', '1d429be9-5a5a-4a5c-9c90-f35447866199', CURRENT_DATE - 1, (CURRENT_DATE-1 || ' 08:00')::timestamptz, (CURRENT_DATE-1 || ' 17:00')::timestamptz, 'Hadir', 'Agus Purnomo', 'Operational Division', 'Kantor Pusat & Gudang PGP', TRUE, FALSE),
  ('abs-05', '6305824c-4d89-4703-a977-76d4e77b7718', CURRENT_DATE - 1, NULL, NULL, 'Alpha', 'Hendra Saputra', 'Operational Division', NULL, FALSE, FALSE),
  ('abs-06', '3b851605-6e0f-4679-9876-972f3766fe79', CURRENT_DATE - 2, (CURRENT_DATE-2 || ' 08:20')::timestamptz, (CURRENT_DATE-2 || ' 17:10')::timestamptz, 'Terlambat', 'Maya Kusuma', 'Operational Division', 'Kantor Pusat & Gudang PGP', TRUE, FALSE)
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped absensi: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO pengajuan_cuti (id, employee_id, employee_name, department, type, start_date, end_date, reason, status) VALUES
  ('cuti-01', '174e26b0-6a37-47ad-97f4-764ccf903680', 'Siti Rahayu', 'HR & GA', 'Cuti Tahunan', CURRENT_DATE + 10, CURRENT_DATE + 12, 'Acara keluarga.', 'Pending'),
  ('cuti-02', 'f4583421-7b7e-44ec-8c10-653cd722b52c', 'Rina Marlina', 'Operational Division', 'Cuti Sakit', CURRENT_DATE - 5, CURRENT_DATE - 4, 'Sakit demam.', 'Disetujui'),
  ('cuti-03', '3b851605-6e0f-4679-9876-972f3766fe79', 'Maya Kusuma', 'Operational Division', 'Cuti Tahunan', CURRENT_DATE + 20, CURRENT_DATE + 22, 'Liburan keluarga.', 'Pending')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped pengajuan_cuti: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO saldo_cuti (id, karyawan_id, tahun, jenis_cuti, total_hari, terpakai) VALUES
  ('sc-01', 'e1a0ca47-173f-4c93-a2bb-678e68a2fa61', 2026, 'Cuti Tahunan', 12, 2),
  ('sc-02', '84019708-d3d6-43f8-817b-da2ff8052eeb', 2026, 'Cuti Tahunan', 12, 4),
  ('sc-03', 'f132413c-0c1d-4de9-ac53-21b0bcbe57d4', 2026, 'Cuti Tahunan', 12, 1)
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped saldo_cuti: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO lembur (id, karyawan_id, tanggal, jam_mulai, jam_selesai, alasan, status) VALUES
  ('lb-01', '84019708-d3d6-43f8-817b-da2ff8052eeb', CURRENT_DATE - 3, '17:00', '20:00', 'Bongkar muat cargo mendesak.', 'Disetujui'),
  ('lb-02', 'e19a4e1b-d365-4d5a-826c-7b66aa8cca62', CURRENT_DATE - 2, '17:00', '21:00', 'Pengiriman trucking jadwal malam.', 'Pending')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped lembur: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO koreksi_absensi (id, karyawan_id, tanggal, jenis_koreksi, alasan, status) VALUES
  ('ka-01', '6305824c-4d89-4703-a977-76d4e77b7718', CURRENT_DATE - 1, 'Lupa Check-in', 'Lupa absen karena langsung ke lokasi klien.', 'Pending')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped koreksi_absensi: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO jadwal_shift (id, employee_id, shift_id, shift_date, has_bonus, bonus_amount) VALUES
  ('js-01', '84019708-d3d6-43f8-817b-da2ff8052eeb', 'shift-malam', CURRENT_DATE + 1, TRUE, 50000),
  ('js-02', 'e19a4e1b-d365-4d5a-826c-7b66aa8cca62', 'shift-siang', CURRENT_DATE + 1, TRUE, 25000)
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped jadwal_shift: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO penugasan_kerja (id, karyawan_id, unit_organisasi_id, nama_project, nama_klien, supervisor_karyawan_id, tanggal_mulai, status) VALUES
  ('pk-01', '1cd2c026-2b1b-479e-9282-58ac97a61028', 'demo-unit-ops', 'Ekspor Kopi ke Rotterdam', 'PT Kopi Nusantara', 'af1f9c79-9add-4140-ba9d-a564fcda5bc8', CURRENT_DATE - 15, 'Berjalan')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped penugasan_kerja: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO catatan_aktivitas_harian (id, karyawan_id, tanggal, deskripsi_aktivitas, project_site, jam_kerja, mode_kerja) VALUES
  ('cah-01', '1cd2c026-2b1b-479e-9282-58ac97a61028', CURRENT_DATE - 1, 'Menyelesaikan dokumen PIB untuk pengiriman kontainer 2x40ft.', 'Tanjung Priok', 8, 'Lapangan')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped catatan_aktivitas_harian: %', SQLERRM;
END $$;

-- ── RECRUITMENT ──────────────────────────────────────────────────────────

DO $$ BEGIN
INSERT INTO lowongan_kerja (id, position, department, title, description, quantity, quantity_filled, education, experience, location, status) VALUES
  ('lok-01', 'Staff PPJK (Kepabeanan)', 'Operational Division', 'Staff PPJK (Kepabeanan)', 'Mengurus dokumen kepabeanan ekspor-impor.', 2, 0, 'D3/S1', '1-2 tahun', 'Tanjung Priok, Jakarta Utara', 'Open'),
  ('lok-02', 'Customer Service Ekspor-Impor', 'Operational Division', 'Customer Service Ekspor-Impor', 'Menangani komunikasi dengan klien forwarding.', 1, 0, 'D3/S1', '1 tahun', 'Tanjung Priok, Jakarta Utara', 'Open'),
  ('lok-03', 'Staff Procurement', 'Procurement Division', 'Staff Procurement', 'Pengadaan barang dan jasa operasional.', 1, 0, 'S1', '2 tahun', 'Jakarta Utara', 'Closed')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped lowongan_kerja: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO pelamar (id, full_name, email, phone, status, applied_at, salary_expectation, reached_interview) VALUES
  ('pel-01', 'Reza Firmansyah', 'reza.firmansyah@email.com', '081400000001', 'Screening', NOW() - INTERVAL '5 days', 6500000, FALSE),
  ('pel-02', 'Indah Puspita', 'indah.puspita@email.com', '081400000002', 'Interview', NOW() - INTERVAL '8 days', 7000000, TRUE),
  ('pel-03', 'Galih Pratama', 'galih.pratama@email.com', '081400000003', 'Offering', NOW() - INTERVAL '15 days', 7500000, TRUE)
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped pelamar: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO tes_rekrutmen (id, test_type, title, instructions, questions, duration_minutes, passing_score, is_active, department) VALUES
  ('tes-01', 'Psikotes', 'Tes Psikotes Dasar', 'Kerjakan seluruh soal dalam waktu yang tersedia.', '[{"q":"Contoh soal logika 1"},{"q":"Contoh soal logika 2"}]', 60, 70, TRUE, 'Operational Division')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped tes_rekrutmen: %', SQLERRM;
END $$;

-- ── COMPETENCY MANAGEMENT ────────────────────────────────────────────────

DO $$ BEGIN
INSERT INTO master_kompetensi (id, name, category, department, kode, deskripsi, status) VALUES
  ('sk-01', 'Customs Regulation (Kepabeanan)', 'Teknis', 'Operational Division', 'SK-01', 'Pemahaman regulasi kepabeanan ekspor-impor.', 'Aktif'),
  ('sk-02', 'Cargo Handling', 'Teknis', 'Operational Division', 'SK-02', 'Penanganan bongkar muat cargo secara aman.', 'Aktif'),
  ('sk-03', 'Negosiasi & Komunikasi Klien', 'Soft Skill', 'Operational Division', 'SK-03', 'Kemampuan bernegosiasi dengan klien dan vendor.', 'Aktif'),
  ('sk-04', 'Microsoft Excel Lanjutan', 'Umum', NULL, 'SK-04', 'Pengolahan data dan laporan menggunakan Excel.', 'Aktif'),
  ('sk-05', 'Kepemimpinan Tim', 'Leadership', NULL, 'SK-05', 'Kemampuan memimpin dan mengembangkan tim.', 'Aktif')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped master_kompetensi: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO kompetensi_jabatan (position_code, skill_id, required_level) VALUES
  ('JAB-OPS-01', 'sk-01', 4), ('JAB-OPS-01', 'sk-03', 3),
  ('JAB-OPS-03', 'sk-02', 4), ('JAB-OPS-06', 'sk-05', 4)
ON CONFLICT DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped kompetensi_jabatan: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO kompetensi_karyawan (id, employee_id, skill_id, current_level, assessment_type) VALUES
  ('kk-01', '1cd2c026-2b1b-479e-9282-58ac97a61028', 'sk-01', 3, 'Self Assessment'),
  ('kk-02', '1cd2c026-2b1b-479e-9282-58ac97a61028', 'sk-03', 3, 'Manager Assessment'),
  ('kk-03', '84019708-d3d6-43f8-817b-da2ff8052eeb', 'sk-02', 4, 'Manager Assessment'),
  ('kk-04', '94dde282-3c16-4f5d-887f-59395dd1b4b4', 'sk-05', 4, 'Manager Assessment')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped kompetensi_karyawan: %', SQLERRM;
END $$;

-- ── PERFORMANCE MANAGEMENT ───────────────────────────────────────────────

DO $$ BEGIN
INSERT INTO evaluasi_kpi (id, employee_id, period_start, period_end, period, score, status, final_score, comments) VALUES
  ('kpi-01', '1cd2c026-2b1b-479e-9282-58ac97a61028', '2026-01-01', '2026-06-30', '06/2026', 85, 'Selesai', 85, 'Kinerja baik, dokumen selalu tepat waktu.'),
  ('kpi-02', 'f489b27a-5dee-490b-b578-4e750c4faff1', '2026-01-01', '2026-06-30', '06/2026', 91, 'Selesai', 91, 'Kinerja sangat baik, siap dipromosikan.'),
  ('kpi-03', 'a512a9ac-2954-4bf0-a34e-7f71e515e346', '2026-01-01', '2026-06-30', '06/2026', 90, 'Selesai', 90, 'Leadership kuat, engagement tim tinggi.')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped evaluasi_kpi: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO okr (id, department, objective, key_results, period, progress, status) VALUES
  ('okr-01', 'Operational Division', 'Meningkatkan efisiensi proses kepabeanan', 'Kurangi waktu proses PIB dari 3 hari ke 1.5 hari', '2026-H1', 65, 'Berjalan'),
  ('okr-02', 'HR & GA', 'Meningkatkan employee engagement', 'Capai skor eNPS di atas 70', '2026-H1', 40, 'Berjalan')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped okr: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO umpan_balik_kinerja (id, employee_id, reviewer_name, category, rating, comment, period) VALUES
  ('ufk-01', '1cd2c026-2b1b-479e-9282-58ac97a61028', 'Wawan Setiadi', 'Kolaborasi', 4, 'Sangat kooperatif dengan tim lapangan.', '2026-H1')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped umpan_balik_kinerja: %', SQLERRM;
END $$;

-- ── LEARNING & TRAINING ──────────────────────────────────────────────────

DO $$ BEGIN
INSERT INTO pelatihan (id, title, description, date_start, date_end, status, department, proposed_cost, budget_status) VALUES
  ('trn-01', 'Sertifikasi Ahli Kepabeanan', 'Pelatihan dan sertifikasi resmi untuk staf PPJK.', CURRENT_DATE + 30, CURRENT_DATE + 32, 'Direncanakan', 'Operational Division', 15000000, 'Disetujui'),
  ('trn-02', 'K3 Gudang & Cargo', 'Pelatihan keselamatan kerja area gudang.', CURRENT_DATE - 20, CURRENT_DATE - 19, 'Selesai', 'Operational Division', 8000000, 'Disetujui')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped pelatihan: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO peserta_pelatihan (id, training_id, employee_id, status) VALUES
  ('pt-01', 'trn-01', '1cd2c026-2b1b-479e-9282-58ac97a61028', 'Terdaftar'),
  ('pt-02', 'trn-02', '84019708-d3d6-43f8-817b-da2ff8052eeb', 'Selesai')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped peserta_pelatihan: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO materi_pelatihan (id, training_id, title, type, file_size) VALUES
  ('mat-01', 'trn-02', 'Panduan K3 Gudang.pdf', 'PDF', '2.4 MB')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped materi_pelatihan: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO kuis_pelatihan (id, training_id, title, questions_count, pass_score, duration_minutes, status) VALUES
  ('kz-01', 'trn-02', 'Evaluasi K3 Gudang', 10, 70, 20, 'Aktif')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped kuis_pelatihan: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO sertifikat_pelatihan (id, training_id, employee_id, certificate_number, completion_date, status) VALUES
  ('cert-01', 'trn-02', '84019708-d3d6-43f8-817b-da2ff8052eeb', 'CERT-K3-2026-001', CURRENT_DATE - 19, 'Terbit')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped sertifikat_pelatihan: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO roi_pelatihan (training_id, cost, benefit, notes) VALUES
  ('trn-02', 8000000, 25000000, 'Penurunan insiden kerja setelah pelatihan K3.')
ON CONFLICT DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped roi_pelatihan: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO video_pelatihan (id, title, category, video_url, duration, description, created_by) VALUES
  ('vid-01', 'Prosedur Bongkar Muat Aman', 'K3', 'https://example.com/videos/bongkar-muat.mp4', '12:30', 'Video panduan bongkar muat cargo yang aman.', 'hrd@ptpgp.co.id')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped video_pelatihan: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO permintaan_pelatihan (id, department, skill_name, current_level, required_level, reason, status) VALUES
  ('rtn-01', 'Operational Division', 'Customs Regulation (Kepabeanan)', 3, 4, 'Gap kompetensi ditemukan pada Gap Analysis.', 'Diajukan')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped permintaan_pelatihan: %', SQLERRM;
END $$;

-- ── REWARD, RECOGNITION & PAYROLL ────────────────────────────────────────

DO $$ BEGIN
INSERT INTO struktur_gaji (id, employee_id, basic_salary, transport_allowance, meal_allowance, position_allowance, ptkp_status) VALUES
  ('sg-01', '1cd2c026-2b1b-479e-9282-58ac97a61028', 6500000, 500000, 500000, 0, 'TK/0'),
  ('sg-02', 'f489b27a-5dee-490b-b578-4e750c4faff1', 9500000, 750000, 500000, 1000000, 'K/1'),
  ('sg-03', 'a512a9ac-2954-4bf0-a34e-7f71e515e346', 14000000, 1000000, 500000, 1500000, 'K/2')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped struktur_gaji: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO penggajian (id, employee_id, month, year, basic_salary, allowances, deductions, net_salary, status) VALUES
  (gen_random_uuid(), '1cd2c026-2b1b-479e-9282-58ac97a61028', EXTRACT(MONTH FROM CURRENT_DATE)::int, EXTRACT(YEAR FROM CURRENT_DATE)::int, 6500000, 1000000, 450000, 7050000, 'Dibayar'),
  (gen_random_uuid(), 'f489b27a-5dee-490b-b578-4e750c4faff1', EXTRACT(MONTH FROM CURRENT_DATE)::int, EXTRACT(YEAR FROM CURRENT_DATE)::int, 9500000, 2250000, 780000, 10970000, 'Dibayar')
ON CONFLICT DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped penggajian: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO insentif (id, employee_id, program, amount, period, status) VALUES
  ('ins-01', 'f489b27a-5dee-490b-b578-4e750c4faff1', 'Bonus Kinerja Triwulan', 2000000, '06/2026', 'Disetujui'),
  ('ins-02', '84019708-d3d6-43f8-817b-da2ff8052eeb', 'Insentif Lembur Gudang', 500000, '06/2026', 'Dibayarkan')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped insentif: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO penghargaan_karyawan (id, employee_id, employee_name, department, category, description, award_date, given_by) VALUES
  ('pgh-01', 'f489b27a-5dee-490b-b578-4e750c4faff1', 'Wawan Setiadi', 'Operational Division', 'Employee of the Month', 'Konsistensi ketepatan waktu proses dokumen kepabeanan.', '2026-05-01', 'HRD')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped penghargaan_karyawan: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO aturan_reward (id, nama, min_kpi_score, min_attendance_pct, no_active_warning, reward_type, calc_method, calc_value, aktif) VALUES
  ('ar-01', 'Bonus Kinerja Standar', 85, 95, TRUE, 'bonus', 'percent_basic', 15, TRUE)
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped aturan_reward: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO merit_matrix (id, performance_min, performance_max, grade_id, merit_pct) VALUES
  ('mm-01', 90, 100, NULL, 12), ('mm-02', 80, 89.99, NULL, 8), ('mm-03', 70, 79.99, NULL, 4)
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped merit_matrix: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO reward_budget (id, department, period, budget_amount) VALUES
  ('rb-01', 'Operational Division', '06/2026', 25000000),
  ('rb-02', 'HR & GA', '06/2026', 10000000)
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped reward_budget: %', SQLERRM;
END $$;

-- ── CAREER TRANSACTIONS & SUCCESSION (legacy tables predating career_transactions) ──

DO $$ BEGIN
INSERT INTO mutasi_karir (id, employee_id, from_department, to_department, from_position, to_position, effective_date, reason, status) VALUES
  ('mut-01', '303e8e80-07bf-494c-99a3-8f7469d12eac', 'Finance', 'Finance', 'Finance & Accounting Staff', 'Manager Finance & Accounting', CURRENT_DATE - 60, 'Rotasi internal.', 'Disetujui')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped mutasi_karir: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO promosi_karir (id, employee_id, from_position, to_position, effective_date, reason, status) VALUES
  ('prm-01', 'a512a9ac-2954-4bf0-a34e-7f71e515e346', 'HR & GA Supervisor', 'Manager HR & GA', CURRENT_DATE - 90, 'Career Score tinggi dan rekomendasi Talent Review.', 'Disetujui')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped promosi_karir: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO rencana_pengembangan (id, employee_id, goals, trainings, timeline, mentor, progress, status) VALUES
  ('idp-leg-01', '1cd2c026-2b1b-479e-9282-58ac97a61028', 'Meningkatkan kompetensi kepabeanan lanjutan.', 'Sertifikasi Ahli Kepabeanan', '6 bulan', 'Wawan Setiadi', 40, 'Aktif')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped rencana_pengembangan: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO surat_peringatan (id, employee_id, employee_name, employee_email, sp_level, reason, valid_until, issued_by, status) VALUES
  ('sp-leg-01', 'ccb5862d-21dc-4d07-8da0-dd411bb3d97e', 'Dewi Lestari', 'dewi.lestari@ptpgp.co.id', 'SP1', 'Keterlambatan berulang tanpa keterangan.', CURRENT_DATE + 150, 'HRD', 'Aktif')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped surat_peringatan: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO pengunduran_diri (id, employee_id, employee_name, employee_email, reason, last_day, status) VALUES
  ('res-01', '6999fe5f-8a54-41da-ad7a-71d156e5b1c5', 'Fajar Nugroho', 'fajar.nugroho@ptpgp.co.id', 'Melanjutkan karir di perusahaan lain.', CURRENT_DATE + 30, 'Diajukan')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped pengunduran_diri: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO keluhan (id, employee_id, employee_name, employee_email, subject, category, description, status) VALUES
  ('kel-01', '3b851605-6e0f-4679-9876-972f3766fe79', 'Maya Kusuma', 'maya.kusuma@ptpgp.co.id', 'Fasilitas Kantin Kurang Memadai', 'Fasilitas', 'Kantin sering kehabisan menu sebelum jam istirahat berakhir.', 'Diajukan')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped keluhan: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO permintaan_karir (id, employee_email, employee_name, type, job_title, job_department, status) VALUES
  ('pkr-01', 'siti.rahayu@ptpgp.co.id', 'Siti Rahayu', 'Konsultasi Karir', NULL, NULL, 'Selesai')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped permintaan_karir: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO kandidat_suksesor (id, employee_id, notes, added_by) VALUES
  ('ks-01', 'f489b27a-5dee-490b-b578-4e750c4faff1', 'Kandidat kuat untuk posisi Manager Kepabeanan.', 'hrd@ptpgp.co.id')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped kandidat_suksesor: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO pool_suksesi (id, employee_id, potential_rating, notes, added_by) VALUES
  ('ps-01', 'a512a9ac-2954-4bf0-a34e-7f71e515e346', 'High', 'Kandidat suksesi General Manager HR & GA.', 'hrd@ptpgp.co.id')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped pool_suksesi: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO posisi_kritis (id, employee_id, risk_level, vacancy_risk_date, marked_by) VALUES
  ('pkr-crit-01', '94dde282-3c16-4f5d-887f-59395dd1b4b4', 'Tinggi', CURRENT_DATE + 365, 'hrd@ptpgp.co.id')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped posisi_kritis: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO penilaian_kesiapan_suksesi (id, employee_id, year, kepemimpinan, keahlian_teknis, pengalaman, kinerja, potensi, total_score, assessed_by) VALUES
  ('pks-01', 'f489b27a-5dee-490b-b578-4e750c4faff1', 2026, 80, 85, 75, 91, 88, 84, 'hrd@ptpgp.co.id')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped penilaian_kesiapan_suksesi: %', SQLERRM;
END $$;

-- ── ADMIN, SYSTEM & KNOWLEDGE ────────────────────────────────────────────

DO $$ BEGIN
INSERT INTO notifikasi (id, user_email, title, message, is_read) VALUES
  ('notif-01', 'hrd@ptpgp.co.id', 'Cuti Baru Menunggu Persetujuan', 'Siti Rahayu mengajukan cuti tahunan.', FALSE),
  ('notif-02', 'siti.rahayu@ptpgp.co.id', 'Pengajuan Cuti Disetujui', 'Pengajuan cuti Anda telah disetujui.', TRUE)
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped notifikasi: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO log_audit (action, target_id, target_name, performed_by_role, performed_by_name, performed_by_email, detail) VALUES
  ('APPROVE_LEAVE', 'cuti-02', 'Rina Marlina', 'hrd', 'Administrator HRD', 'hrd@ptpgp.co.id', 'Menyetujui pengajuan cuti sakit.'),
  ('CREATE_EMPLOYEE', 'e1a0ca47-173f-4c93-a2bb-678e68a2fa61', 'Siti Rahayu', 'hrd', 'Administrator HRD', 'hrd@ptpgp.co.id', 'Menambahkan data karyawan baru.')
ON CONFLICT DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped log_audit: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO dokumen_perusahaan (id, title, category, status, visible_to_employee, visible_to_department_head) VALUES
  ('dok-01', 'Panduan Kepabeanan Ekspor-Impor', 'SOP', 'Published', TRUE, TRUE),
  ('dok-02', 'Kebijakan K3 Gudang', 'Kebijakan', 'Published', TRUE, TRUE)
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped dokumen_perusahaan: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO panduan_bantuan (id, role, category, title, content, order_index) VALUES
  ('help-01', 'employee', 'Absensi', 'Cara Melakukan Check-in', 'Buka menu Absensi, klik tombol Check-in, izinkan akses lokasi.', 1),
  ('help-02', 'hrd', 'Cuti', 'Cara Menyetujui Cuti', 'Buka menu Absensi & Cuti, pilih pengajuan, klik Setujui.', 1)
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped panduan_bantuan: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO pesan_kontak (id, name, email, phone, subject, message, status) VALUES
  ('msg-01', 'Andra Wijaya', 'andra.wijaya@clientcorp.com', '08123456789', 'Permintaan Penawaran Jasa Forwarding', 'Kami tertarik dengan jasa ekspor-impor Anda, mohon info penawaran.', 'Baru')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped pesan_kontak: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO artikel_pengetahuan (id, title, category, author, content, views) VALUES
  ('art-01', 'Mengenal Proses PIB (Pemberitahuan Impor Barang)', 'Kepabeanan', 'HRD', 'PIB adalah dokumen yang wajib diisi importir untuk keperluan pengeluaran barang dari kawasan pabean...', 120)
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped artikel_pengetahuan: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO survei_karyawan (id, title, survey_type, questions, status, created_by) VALUES
  ('surv-01', 'Survei Kepuasan Kerja Q2 2026', 'Satisfaction', 'Seberapa puas Anda dengan lingkungan kerja saat ini?', 'Aktif', 'hrd@ptpgp.co.id')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped survei_karyawan: %', SQLERRM;
END $$;

-- ── EMPLOYEE 360° DOCUMENTS ───────────────────────────────────────────────

DO $$ BEGIN
INSERT INTO data_pribadi_karyawan (id, email, nik, birth_place, birth_date, religion, marital_status, phone, address, emergency_name, emergency_phone) VALUES
  ('dp-01', 'siti.rahayu@ptpgp.co.id', '3171234567890001', 'Jakarta', '1995-03-12', 'Islam', 'Menikah', '081200000001', 'Jl. Cempaka No. 5, Jakarta Utara', 'Rudi Rahayu', '081299999901')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped data_pribadi_karyawan: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO keluarga_karyawan (id, karyawan_id, nama, hubungan, pekerjaan) VALUES
  ('kel-fam-01', '1cd2c026-2b1b-479e-9282-58ac97a61028', 'Dian Anggraini', 'Istri', 'Ibu Rumah Tangga')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped keluarga_karyawan: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO pendidikan_karyawan (id, karyawan_id, jenjang, institusi, jurusan, tahun_lulus) VALUES
  ('pdd-01', '1cd2c026-2b1b-479e-9282-58ac97a61028', 'D3', 'Politeknik Bea Cukai', 'Kepabeanan', '2021')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped pendidikan_karyawan: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO dokumen_karyawan (id, karyawan_id, jenis, judul) VALUES
  ('dokk-01', '1cd2c026-2b1b-479e-9282-58ac97a61028', 'Sertifikat', 'Sertifikat Ahli Kepabeanan')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped dokumen_karyawan: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO kontrak_kerja (id, employee_id, contract_type, start_date, end_date) VALUES
  ('kont-01', '1cd2c026-2b1b-479e-9282-58ac97a61028', 'PKWT', '2022-03-07', '2027-03-06')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped kontrak_kerja: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO pengalaman_proyek_karyawan (id, karyawan_id, nama_proyek, peran, klien, tanggal_mulai) VALUES
  ('prj-01', '1cd2c026-2b1b-479e-9282-58ac97a61028', 'Ekspor Kopi ke Rotterdam', 'PIC Dokumen Kepabeanan', 'PT Kopi Nusantara', '2026-05-01')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped pengalaman_proyek_karyawan: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO sim_sertifikasi_karyawan (id, employee_id, employee_name, category, license_type, expiry_date) VALUES
  ('sim-01', 'e19a4e1b-d365-4d5a-826c-7b66aa8cca62', 'Hendra Saputra', 'SIM', 'SIM B2 Umum', CURRENT_DATE + 400)
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped sim_sertifikasi_karyawan: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO catatan_karyawan (id, email, kategori, judul, catatan) VALUES
  ('catk-01', 'siti.rahayu@ptpgp.co.id', 'Prestasi', 'Kontribusi Positif', 'Konsisten membantu proses onboarding karyawan baru.')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped catatan_karyawan: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO usulan_departemen (id, code, name, parent_code, requested_by, status) VALUES
  ('usdep-01', '1.8', 'Digital & IT Support', '1', 'hrd@ptpgp.co.id', 'Pending')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped usulan_departemen: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO permintaan_sdm (id, department, position, quantity, reason, urgency, status, requested_by) VALUES
  ('rsdm-01', 'Operational Division', 'Staff PPJK (Kepabeanan)', 2, 'Peningkatan volume ekspor-impor.', 'Tinggi', 'Pending', 'gm.ops@ptpgp.co.id')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped permintaan_sdm: %', SQLERRM;
END $$;

-- ── ASSETS & FACILITIES ───────────────────────────────────────────────────

DO $$ BEGIN
INSERT INTO aset_karyawan (id, karyawan_id, nama_aset, kategori, nomor_seri, status) VALUES
  ('aset-01', '1cd2c026-2b1b-479e-9282-58ac97a61028', 'Laptop Lenovo ThinkPad', 'Elektronik', 'LNV-2026-001', 'Digunakan')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped aset_karyawan: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO kendaraan (id, plate_number, type, brand, model, year, status) VALUES
  ('kend-01', 'B 9012 PGP', 'Truk Kontainer', 'Hino', 'FM 260 JD', 2022, 'Aktif'),
  ('kend-02', 'B 9013 PGP', 'Truk Kontainer', 'Hino', 'FM 260 JD', 2021, 'Aktif')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped kendaraan: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO pengadaan_kendaraan (id, requested_by, vehicle_type, quantity, estimated_cost, reason, status) VALUES
  ('penk-01', 'mgr.armada@ptpgp.co.id', 'Truk Kontainer', 1, 850000000, 'Penambahan armada untuk memenuhi permintaan pengiriman.', 'Diajukan')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped pengadaan_kendaraan: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO trip_supir (id, driver_id, driver_name, department, vehicle_plate, origin, destination, trip_date, start_time, rate_per_km, status, incentive_generated) VALUES
  ('trip-01', 'e19a4e1b-d365-4d5a-826c-7b66aa8cca62', 'Hendra Saputra', 'Operational Division', 'B 9012 PGP', 'Gudang PGP Tanjung Priok', 'Pelabuhan Tanjung Priok', CURRENT_DATE - 2, (CURRENT_DATE-2 || ' 06:00')::timestamptz, 5000, 'Selesai', TRUE)
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped trip_supir: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO perjalanan_dinas (id, employee_id, employee_name, department, destination, start_date, end_date, reason, status) VALUES
  ('dinas-01', 'af1f9c79-9add-4140-ba9d-a564fcda5bc8', 'Wawan Setiadi', 'Operational Division', 'Kantor Bea Cukai Surabaya', CURRENT_DATE + 5, CURRENT_DATE + 7, 'Koordinasi proses kepabeanan pengiriman via Surabaya.', 'Disetujui')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped perjalanan_dinas: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO vendor (id, name, category, contact_person, phone, email, status) VALUES
  ('vnd-01', 'PT Sumber Ban Jaya', 'Suku Cadang Kendaraan', 'Hendro Santoso', '0217654321', 'sales@sumberban.co.id', 'Aktif'),
  ('vnd-02', 'CV Maju Logistik Supplies', 'Perlengkapan Gudang', 'Nina Kartika', '0217654322', 'order@majulogistik.co.id', 'Aktif')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped vendor: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO deskripsi_kerja (id, position, department, title, responsibilities, requirements) VALUES
  ('jd-01', 'Staff PPJK (Kepabeanan)', 'Operational Division', 'Staff PPJK (Kepabeanan)',
    ARRAY['Mengurus dokumen PIB/PEB', 'Koordinasi dengan Bea Cukai', 'Memastikan kepatuhan regulasi ekspor-impor'],
    ARRAY['D3/S1 semua jurusan', 'Memahami regulasi kepabeanan', 'Teliti dan disiplin'])
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped deskripsi_kerja: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO spesifikasi_kerja (id, position, department, title, education, experience, skills, certifications) VALUES
  ('js-spec-01', 'Staff PPJK (Kepabeanan)', 'Operational Division', 'Staff PPJK (Kepabeanan)', 'D3/S1', '1-2 tahun',
    ARRAY['Customs Regulation', 'Microsoft Office'], ARRAY['Sertifikasi Ahli Kepabeanan (jika ada)'])
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped spesifikasi_kerja: %', SQLERRM;
END $$;
