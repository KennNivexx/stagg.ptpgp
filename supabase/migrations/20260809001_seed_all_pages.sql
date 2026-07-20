-- ============================================================================
-- COMPREHENSIVE DUMMY DATA SEED — fills every page/module that still shows
-- empty. Run AFTER all migrations up to 20260808001.
-- Safe to re-run: all INSERTs use ON CONFLICT DO NOTHING.
-- Each section is wrapped in its own DO $$ block so one failure doesn't
-- block the rest.
-- ============================================================================

-- ══════════════════════════════════════════════════════════════════════════
-- KNOWN EMPLOYEE UUIDs (from 20260720002 / 20260723001 seed)
-- e1a0ca47 = Siti Rahayu         (HR & GA Staff)
-- 11bf125b = Budi Santoso        (HR & GA Supervisor)
-- 9f388845 = Fajar Nugroho       (Operational Manager)
-- ccb5862d = Dewi Lestari        (Staff PPJK)
-- 533fb02e = Rina Marlina        (Finance & Accounting Staff)
-- e19a4e1b = Hendra Saputra      (Koordinator Armada)
-- f132413c = Maya Kusuma         (Customer Service)
-- 84019708 = Agus Purnomo        (Supervisor Gudang)
-- 217ac2be = Yudi Firmansyah     (HSE Officer)
-- ab2109d1 = Wawan Setiadi       (Staff Dokumentasi)
-- ══════════════════════════════════════════════════════════════════════════

-- ══════════════════════════════════════════════════════════════════════════
-- 1. INFRASTRUCTURE — Kendaraan, Lokasi Kerja, Kontrak, SIM/Sertifikasi
-- ══════════════════════════════════════════════════════════════════════════
DO $$ BEGIN
INSERT INTO kendaraan (id, plate_number, type, brand, model, year, capacity, status, assigned_to, fuel_type, last_service_date, notes) VALUES
  ('kend-01', 'B 1234 PGP', 'Truck', 'Mitsubishi', 'Colt Diesel FE 74', 2021, 8000, 'Tersedia', NULL, 'Solar', '2026-05-10', 'Armada utama pengiriman cargo'),
  ('kend-02', 'B 5678 PGP', 'Truck', 'Isuzu', 'Elf NLR 55', 2022, 5000, 'Digunakan', 'e19a4e1b-d365-4d5a-826c-7b66aa8cca62', 'Solar', '2026-06-01', 'Pengiriman rute dalam kota'),
  ('kend-03', 'B 9012 PGP', 'Minibus', 'Toyota', 'Innova Reborn', 2023, 8, 'Tersedia', NULL, 'Bensin', '2026-06-15', 'Kendaraan operasional kantor'),
  ('kend-04', 'B 3456 PGP', 'Truck', 'Hino', 'Ranger FM 260', 2020, 15000, 'Perawatan', NULL, 'Solar', '2026-07-01', 'Sedang servis rutin di bengkel')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'kendaraan: %', SQLERRM; END $$;

DO $$ BEGIN
INSERT INTO lokasi_kerja (id, name, address, latitude, longitude, radius_meter, is_active) VALUES
  ('lok-kerja-01', 'Kantor Pusat & Gudang PGP', 'Jl. Enggano No. 5, Tanjung Priok, Jakarta Utara', -6.1054, 106.8723, 100, TRUE),
  ('lok-kerja-02', 'Gudang Cabang Bekasi', 'Jl. Industri Raya No. 12, Cikarang, Bekasi', -6.3500, 107.1430, 150, TRUE),
  ('lok-kerja-03', 'Pelabuhan Tanjung Priok - Gate 4', 'Jl. Pelabuhan Tanjung Priok, Jakarta Utara', -6.1000, 106.8800, 200, TRUE)
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'lokasi_kerja: %', SQLERRM; END $$;

DO $$ BEGIN
INSERT INTO sim_sertifikasi_karyawan (id, employee_id, employee_name, category, license_type, license_number, expiry_date, status) VALUES
  ('simser-01', 'e19a4e1b-d365-4d5a-826c-7b66aa8cca62', 'Hendra Saputra', 'SIM', 'SIM B2 Umum', 'SIM-B2-2024-001', CURRENT_DATE + 400, 'Aktif'),
  ('simser-02', '84019708-d3d6-43f8-817b-da2ff8052eeb', 'Agus Purnomo', 'SIM', 'SIM A Umum', 'SIM-A-2024-002', CURRENT_DATE + 200, 'Aktif'),
  ('simser-03', '217ac2be-f6bc-4481-bdb6-db3d68a26083', 'Yudi Firmansyah', 'Sertifikat', 'Ahli K3 Umum', 'K3-UMUM-2025-017', CURRENT_DATE + 300, 'Aktif'),
  ('simser-04', 'ccb5862d-21dc-4d07-8da0-dd411bb3d97e', 'Dewi Lestari', 'Sertifikat', 'PPJK (Kepabeanan)', 'PPJK-2024-089', CURRENT_DATE - 10, 'Kadaluarsa')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'sim_sertifikasi_karyawan: %', SQLERRM; END $$;

-- ══════════════════════════════════════════════════════════════════════════
-- 2. VEHICLE REQUESTS (Pengadaan Kendaraan)
-- ══════════════════════════════════════════════════════════════════════════
DO $$ BEGIN
INSERT INTO pengadaan_kendaraan (id, requested_by, department, vehicle_type, purpose, quantity, estimated_cost, urgency, status, notes, created_at) VALUES
  ('pkend-01', '9f388845-acbf-4178-8ef3-c4e5ac4511ac', 'Operational Division', 'Truck Bak', 'Penambahan armada pengiriman cargo rute Jabodetabek', 2, 450000000, 'Tinggi', 'Pending', 'Kebutuhan mendesak karena peningkatan volume ekspor Q3 2026', NOW() - INTERVAL '5 days'),
  ('pkend-02', '11bf125b-b66a-44ea-9a30-73ed9524e7bc', 'HR & GA', 'Minibus', 'Kendaraan antar-jemput direksi dan tamu penting', 1, 380000000, 'Sedang', 'Disetujui', NULL, NOW() - INTERVAL '20 days'),
  ('pkend-03', '217ac2be-f6bc-4481-bdb6-db3d68a26083', 'HSE', 'Pickup', 'Kendaraan inspeksi lapangan dan K3', 1, 180000000, 'Rendah', 'Ditolak', 'Budget tidak tersedia di kuartal ini', NOW() - INTERVAL '30 days')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'pengadaan_kendaraan: %', SQLERRM; END $$;

-- ══════════════════════════════════════════════════════════════════════════
-- 3. BUSINESS TRIPS (Perjalanan Dinas)
-- ══════════════════════════════════════════════════════════════════════════
DO $$ BEGIN
INSERT INTO perjalanan_dinas (id, employee_id, employee_name, department, destination, purpose, departure_date, return_date, transport_type, estimated_cost, actual_cost, status, approved_by, created_at) VALUES
  ('pjd-01', 'ccb5862d-21dc-4d07-8da0-dd411bb3d97e', 'Dewi Lestari', 'Operational Division', 'Tanjung Priok - Bea Cukai', 'Pengurusan PIB untuk shipment ekspor furnitur', CURRENT_DATE + 3, CURRENT_DATE + 3, 'Kendaraan Dinas', 150000, NULL, 'Disetujui', 'Fajar Nugroho', NOW() - INTERVAL '2 days'),
  ('pjd-02', '9f388845-acbf-4178-8ef3-c4e5ac4511ac', 'Fajar Nugroho', 'Operational Division', 'Surabaya', 'Rapat koordinasi klien PT Sumber Makmur', CURRENT_DATE + 7, CURRENT_DATE + 8, 'Pesawat', 3500000, NULL, 'Pending', NULL, NOW() - INTERVAL '1 day'),
  ('pjd-03', 'ab2109d1-e11f-4e79-8ecf-c8dc5b87cb5a', 'Wawan Setiadi', 'Operational Division', 'Pelabuhan Tanjung Emas, Semarang', 'Supervisi pengiriman cargo Semarang', CURRENT_DATE - 5, CURRENT_DATE - 4, 'Bus', 600000, 580000, 'Selesai', 'Fajar Nugroho', NOW() - INTERVAL '10 days'),
  ('pjd-04', 'f132413c-0c1d-4de9-ac53-21b0bcbe57d4', 'Maya Kusuma', 'Operational Division', 'Bandung', 'Kunjungan klien baru PT Tekstil Bandung Raya', CURRENT_DATE + 14, CURRENT_DATE + 14, 'Kendaraan Dinas', 250000, NULL, 'Pending', NULL, NOW())
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'perjalanan_dinas: %', SQLERRM; END $$;

-- ══════════════════════════════════════════════════════════════════════════
-- 4. TRIPS (Supir / Driver Trips)
-- ══════════════════════════════════════════════════════════════════════════
DO $$ BEGIN
INSERT INTO trip_supir (id, driver_id, driver_name, vehicle_id, origin, destination, purpose, departure_time, arrival_time, distance_km, fuel_used_liter, status, notes) VALUES
  ('trip-01', 'e19a4e1b-d365-4d5a-826c-7b66aa8cca62', 'Hendra Saputra', 'kend-02', 'Gudang PGP Tanjung Priok', 'PT Kayu Jati Nusantara, Bekasi', 'Pengiriman cargo 2x20ft furnitur ekspor', NOW() - INTERVAL '1 day', NOW() - INTERVAL '20 hours', 42, 18.5, 'Selesai', NULL),
  ('trip-02', 'e19a4e1b-d365-4d5a-826c-7b66aa8cca62', 'Hendra Saputra', 'kend-02', 'Gudang PGP Tanjung Priok', 'Pelabuhan Tanjung Priok Gate 4', 'Antar kontainer ke pelabuhan', NOW() - INTERVAL '3 hours', NULL, NULL, NULL, 'Berjalan', 'Dalam perjalanan ke pelabuhan'),
  ('trip-03', 'e19a4e1b-d365-4d5a-826c-7b66aa8cca62', 'Hendra Saputra', 'kend-01', 'Pelabuhan Tanjung Priok', 'Gudang CV Sumber Makmur, Surabaya', 'Distribusi cargo antar kota', NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days', 780, 312, 'Selesai', 'Tanpa insiden')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'trip_supir: %', SQLERRM; END $$;

-- ══════════════════════════════════════════════════════════════════════════
-- 5. INCIDENTS (Laporan Insiden)
-- ══════════════════════════════════════════════════════════════════════════
DO $$ BEGIN
INSERT INTO laporan_insiden (id, reporter_id, reporter_name, department, incident_type, location, description, severity, status, action_taken, reported_at) VALUES
  ('ins-01', '217ac2be-f6bc-4481-bdb6-db3d68a26083', 'Yudi Firmansyah', 'HSE', 'Kecelakaan Kerja Ringan', 'Gudang Cargo Lt. 1', 'Staf mengalami lecet di tangan saat memindahkan palet cargo tanpa sarung tangan yang sesuai', 'Rendah', 'Ditangani', 'Diberikan P3K, karyawan diingatkan menggunakan APD lengkap', NOW() - INTERVAL '7 days'),
  ('ins-02', '84019708-d3d6-43f8-817b-da2ff8052eeb', 'Agus Purnomo', 'Operational Division', 'Hampir Celaka', 'Area Bongkar Muat', 'Forklift hampir menabrak karyawan yang melintas di zona merah tanpa rompi safety', 'Sedang', 'Dalam Investigasi', NULL, NOW() - INTERVAL '2 days'),
  ('ins-03', 'ccb5862d-21dc-4d07-8da0-dd411bb3d97e', 'Dewi Lestari', 'Operational Division', 'Kerusakan Properti', 'Gudang Dokumentasi', 'Printer rusak akibat tegangan listrik tidak stabil, kehilangan 2 jam kerja', 'Rendah', 'Selesai', 'Printer diperbaiki, UPS dipasang di ruang dokumentasi', NOW() - INTERVAL '14 days')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'laporan_insiden: %', SQLERRM; END $$;

-- ══════════════════════════════════════════════════════════════════════════
-- 6. KNOWLEDGE MANAGEMENT (Kebijakan, Artikel, SOP, Video)
-- ══════════════════════════════════════════════════════════════════════════
DO $$ BEGIN
INSERT INTO kebijakan_perusahaan (id, title, category, content, effective_date, revision, created_by, status, mandatory, media_type) VALUES
  ('pol-01', 'Kebijakan Kode Etik dan Integritas', 'Etika & Perilaku', 'Seluruh karyawan PT Pratama Galuh Perkasa wajib menjunjung tinggi integritas, kejujuran, dan profesionalisme dalam setiap aspek pekerjaan. Pelanggaran terhadap kode etik akan dikenakan sanksi sesuai ketentuan perusahaan.', '2026-01-01', 'Rev.2', 'hrd@ptpgp.co.id', 'Published', TRUE, 'PDF'),
  ('pol-02', 'Kebijakan Keselamatan dan Kesehatan Kerja (K3)', 'HSE', 'Perusahaan berkomitmen menciptakan lingkungan kerja yang aman. Seluruh karyawan wajib menggunakan APD yang sesuai, mengikuti prosedur K3, dan melaporkan setiap potensi bahaya kepada supervisor atau HSE Officer.', '2026-02-01', 'Rev.1', 'yudi.firmansyah@ptpgp.co.id', 'Published', TRUE, 'PDF'),
  ('pol-03', 'Kebijakan Penggunaan Aset Perusahaan', 'Aset & Fasilitas', 'Seluruh aset perusahaan hanya digunakan untuk kepentingan pekerjaan. Penggunaan di luar keperluan kerja atau kerusakan akibat kelalaian akan menjadi tanggung jawab karyawan yang bersangkutan.', '2026-03-01', 'Rev.1', 'hrd@ptpgp.co.id', 'Published', FALSE, 'PDF'),
  ('pol-04', 'Kebijakan Cuti dan Izin Tidak Masuk', 'SDM', 'Karyawan berhak atas 12 hari cuti tahunan setelah masa kerja 1 tahun. Pengajuan cuti minimum 3 hari sebelumnya melalui sistem HRIS. Izin mendadak harus dikomunikasikan kepada atasan langsung.', '2026-01-01', 'Rev.2', 'hrd@ptpgp.co.id', 'Published', TRUE, 'PDF')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'kebijakan_perusahaan: %', SQLERRM; END $$;

DO $$ BEGIN
INSERT INTO artikel_pengetahuan (id, title, category, author, content, views, status, version, media_type, mandatory) VALUES
  ('art-01', 'Panduan Lengkap Proses PIB (Pemberitahuan Impor Barang)', 'Kepabeanan', 'Dewi Lestari', 'PIB adalah dokumen yang wajib diisi importir untuk keperluan pengeluaran barang dari kawasan pabean. Dokumen ini mencakup data importir, data barang, nilai pabean, dan tarif bea masuk yang berlaku...', 245, 'Published', 'v2.0', 'HTML', TRUE),
  ('art-02', 'Prosedur Pengajuan PEB (Pemberitahuan Ekspor Barang)', 'Kepabeanan', 'Dewi Lestari', 'PEB wajib disampaikan oleh eksportir kepada Bea Cukai sebelum barang keluar dari kawasan pabean. Berikut adalah langkah-langkah pengajuan PEB melalui sistem CEISA...', 189, 'Published', 'v1.5', 'HTML', TRUE),
  ('art-03', 'Mengenal Incoterms 2020: Panduan Lengkap untuk Tim Operasional', 'Logistics', 'Fajar Nugroho', 'Incoterms (International Commercial Terms) adalah standar internasional yang menentukan hak dan kewajiban antara penjual dan pembeli dalam transaksi perdagangan internasional. Versi terbaru adalah Incoterms 2020...', 312, 'Published', 'v1.0', 'HTML', FALSE),
  ('art-04', 'SOP Penggunaan Sistem CEISA Bea Cukai', 'Sistem & Teknologi', 'Wawan Setiadi', 'CEISA (Customs-Excise Information System and Automation) adalah sistem informasi utama Bea Cukai Indonesia. Artikel ini menjelaskan cara login, navigasi, dan pengajuan dokumen melalui CEISA...', 156, 'Published', 'v1.0', 'HTML', TRUE)
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'artikel_pengetahuan: %', SQLERRM; END $$;

DO $$ BEGIN
INSERT INTO dokumen_sop (id, title, category, department, description, version, status, created_by, effective_date, mandatory, media_type) VALUES
  ('sop-01', 'SOP Pengurusan Dokumen Ekspor (PIB/PEB)', 'Operasional', 'Operational Division', 'Prosedur standar pengurusan dokumen kepabeanan ekspor dan impor meliputi persiapan, pengajuan, monitoring, dan arsip', 'v3.0', 'Published', 'dewi.lestari@ptpgp.co.id', '2026-01-15', TRUE, 'PDF'),
  ('sop-02', 'SOP Bongkar Muat Cargo Gudang', 'K3 & Operasional', 'Operational Division', 'Prosedur keselamatan dan teknis dalam proses bongkar muat barang di area gudang, termasuk penggunaan forklift dan APD wajib', 'v2.0', 'Published', 'yudi.firmansyah@ptpgp.co.id', '2026-02-01', TRUE, 'PDF'),
  ('sop-03', 'SOP Rekrutmen dan Onboarding Karyawan', 'SDM', 'HR & GA', 'Prosedur perekrutan mulai dari pengajuan kebutuhan SDM, seleksi, interview, hingga orientasi karyawan baru', 'v2.1', 'Published', 'hrd@ptpgp.co.id', '2026-01-01', FALSE, 'PDF'),
  ('sop-04', 'SOP Penanganan Keluhan Klien', 'Layanan Pelanggan', 'Operational Division', 'Prosedur penanganan dan eskalasi keluhan dari klien forwarding, target resolusi dalam 24 jam untuk keluhan prioritas tinggi', 'v1.5', 'Published', 'maya.kusuma@ptpgp.co.id', '2026-03-01', FALSE, 'PDF')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'dokumen_sop: %', SQLERRM; END $$;

DO $$ BEGIN
INSERT INTO video_pelatihan (id, title, category, video_url, duration, description, created_by, status, version, media_type, mandatory) VALUES
  ('vid-01', 'Prosedur Bongkar Muat Aman di Gudang', 'K3', 'https://storage.ptpgp.co.id/videos/bongkar-muat-aman.mp4', '18:45', 'Panduan visual lengkap prosedur bongkar muat cargo yang aman, termasuk penggunaan APD dan zona keselamatan', 'hrd@ptpgp.co.id', 'Published', 'v1.0', 'MP4', TRUE),
  ('vid-02', 'Tutorial Pengisian PIB di Sistem CEISA', 'Kepabeanan', 'https://storage.ptpgp.co.id/videos/tutorial-pib-ceisa.mp4', '32:10', 'Panduan langkah demi langkah pengisian dan pengajuan PIB melalui sistem CEISA Bea Cukai', 'hrd@ptpgp.co.id', 'Published', 'v2.0', 'MP4', TRUE),
  ('vid-03', 'Orientasi Karyawan Baru PT Pratama Galuh Perkasa', 'Onboarding', 'https://storage.ptpgp.co.id/videos/orientasi-karyawan-baru.mp4', '24:30', 'Video orientasi yang wajib ditonton oleh seluruh karyawan baru, membahas visi misi, budaya perusahaan, dan tata tertib', 'hrd@ptpgp.co.id', 'Published', 'v1.0', 'MP4', TRUE)
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'video_pelatihan: %', SQLERRM; END $$;

-- ══════════════════════════════════════════════════════════════════════════
-- 7. PERFORMANCE MANAGEMENT (KPI Metrics, OKR, Framework, Reviews)
-- ══════════════════════════════════════════════════════════════════════════
DO $$ BEGIN
INSERT INTO kpi_metrics (id, name, unit, target_value, category, department, created_by) VALUES
  ('kpi-m-01', 'Waktu Proses Dokumen PIB/PEB', 'Hari', 1.5, 'Efisiensi Operasional', 'Operational Division', 'hrd@ptpgp.co.id'),
  ('kpi-m-02', 'Tingkat Ketepatan Waktu Pengiriman', '%', 95, 'Layanan Pelanggan', 'Operational Division', 'hrd@ptpgp.co.id'),
  ('kpi-m-03', 'Kepuasan Pelanggan (CSAT Score)', 'Poin (1-5)', 4.5, 'Layanan Pelanggan', 'Operational Division', 'hrd@ptpgp.co.id'),
  ('kpi-m-04', 'Zero Accident Rate', 'Kejadian', 0, 'K3', 'HSE', 'hrd@ptpgp.co.id'),
  ('kpi-m-05', 'Tingkat Kehadiran Karyawan', '%', 97, 'SDM', 'HR & GA', 'hrd@ptpgp.co.id'),
  ('kpi-m-06', 'Realisasi Budget Pengadaan', '%', 90, 'Efisiensi Keuangan', 'Finance', 'hrd@ptpgp.co.id')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'kpi_metrics: %', SQLERRM; END $$;

DO $$ BEGIN
INSERT INTO evaluasi_kpi (id, employee_id, period, period_start, period_end, score, final_score, status, comments, evaluator_id) VALUES
  ('ekpi-01', '9f388845-acbf-4178-8ef3-c4e5ac4511ac', '2026-H1', '2026-01-01', '2026-06-30', 91, 91, 'Selesai', 'Pencapaian operasional di atas target. Kepemimpinan divisi sangat baik.', '11bf125b-b66a-44ea-9a30-73ed9524e7bc'),
  ('ekpi-02', '11bf125b-b66a-44ea-9a30-73ed9524e7bc', '2026-H1', '2026-01-01', '2026-06-30', 85, 85, 'Selesai', 'Program HR berjalan sesuai rencana. Rekrutmen tepat waktu.', '9f388845-acbf-4178-8ef3-c4e5ac4511ac'),
  ('ekpi-03', 'ccb5862d-21dc-4d07-8da0-dd411bb3d97e', '2026-H1', '2026-01-01', '2026-06-30', 78, 78, 'Selesai', 'Penguasaan regulasi kepabeanan baik, perlu meningkatkan kecepatan proses dokumen.', '9f388845-acbf-4178-8ef3-c4e5ac4511ac'),
  ('ekpi-04', '217ac2be-f6bc-4481-bdb6-db3d68a26083', '2026-H1', '2026-01-01', '2026-06-30', 88, 88, 'Selesai', 'Zero incident selama H1 2026, program K3 berjalan efektif.', '9f388845-acbf-4178-8ef3-c4e5ac4511ac'),
  ('ekpi-05', 'e1a0ca47-173f-4c93-a2bb-678e68a2fa61', '2026-H1', '2026-01-01', '2026-06-30', 80, 80, 'Selesai', 'Administrasi HR rapi dan akurat. Perlu meningkatkan inisiatif.', '11bf125b-b66a-44ea-9a30-73ed9524e7bc'),
  ('ekpi-06', '84019708-d3d6-43f8-817b-da2ff8052eeb', '2026-H1', '2026-01-01', '2026-06-30', 83, 83, 'Selesai', 'Supervisi gudang solid. Efisiensi bongkar muat meningkat 12%.', '9f388845-acbf-4178-8ef3-c4e5ac4511ac'),
  ('ekpi-07', 'f132413c-0c1d-4de9-ac53-21b0bcbe57d4', '2026-H1', '2026-01-01', '2026-06-30', 76, 76, 'Selesai', 'Layanan klien memuaskan, response time masih perlu ditingkatkan.', '9f388845-acbf-4178-8ef3-c4e5ac4511ac'),
  ('ekpi-08', '533fb02e-c137-444e-94b5-a0f7ea88058c', '2026-H1', '2026-01-01', '2026-06-30', 87, 87, 'Selesai', 'Laporan keuangan akurat dan tepat waktu. Rekonsiliasi tanpa selisih.', '9f388845-acbf-4178-8ef3-c4e5ac4511ac')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'evaluasi_kpi: %', SQLERRM; END $$;

DO $$ BEGIN
INSERT INTO okr (id, department, objective, key_results, period, progress, status) VALUES
  ('okr-01', 'Operational Division', 'Meningkatkan efisiensi proses kepabeanan dan forwarding', 'Kurangi waktu proses PIB dari 3 hari ke 1.5 hari; Capai 95% on-time delivery; 0 penolakan dokumen kepabeanan', '2026-H1', 70, 'Berjalan'),
  ('okr-02', 'HR & GA', 'Memperkuat kapabilitas SDM dan employee engagement', 'Capai eNPS > 70; Selesaikan rekrutmen dalam 30 hari; Tingkat kehadiran > 97%', '2026-H1', 55, 'Berjalan'),
  ('okr-03', 'HSE', 'Mencapai Zero Accident selama 2026', '0 kecelakaan kerja berat; 100% karyawan terlatih K3; Audit K3 tanpa temuan kritis', '2026-H1', 80, 'Berjalan'),
  ('okr-04', 'Finance', 'Meningkatkan akurasi dan kecepatan pelaporan keuangan', 'Laporan bulanan H+3; 0 selisih rekonsiliasi; Realisasi budget 90-105%', '2026-H1', 65, 'Berjalan')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'okr: %', SQLERRM; END $$;

DO $$ BEGIN
INSERT INTO umpan_balik_kinerja (id, employee_id, reviewer_name, category, rating, comment, period) VALUES
  ('ufk-01', 'ccb5862d-21dc-4d07-8da0-dd411bb3d97e', 'Fajar Nugroho', 'Keahlian Teknis', 4, 'Penguasaan dokumen kepabeanan sangat baik, cepat dalam mengurus PIB/PEB.', '2026-H1'),
  ('ufk-02', 'ccb5862d-21dc-4d07-8da0-dd411bb3d97e', 'Wawan Setiadi', 'Kolaborasi Tim', 4, 'Selalu siap membantu kolega, komunikatif.', '2026-H1'),
  ('ufk-03', '84019708-d3d6-43f8-817b-da2ff8052eeb', 'Fajar Nugroho', 'Kepemimpinan', 4, 'Mampu mengelola tim gudang dengan baik meski tekanan tinggi.', '2026-H1'),
  ('ufk-04', 'e19a4e1b-d365-4d5a-826c-7b66aa8cca62', 'Fajar Nugroho', 'Inisiatif', 5, 'Proaktif mengusulkan perbaikan rute pengiriman yang menghemat 15% biaya BBM.', '2026-H1'),
  ('ufk-05', 'e1a0ca47-173f-4c93-a2bb-678e68a2fa61', 'Budi Santoso', 'Ketelitian', 4, 'Administrasi HR sangat rapi dan selalu up-to-date.', '2026-H1')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'umpan_balik_kinerja: %', SQLERRM; END $$;

-- ══════════════════════════════════════════════════════════════════════════
-- 8. REWARDS & PAYROLL (Struktur Gaji, Penggajian, Penghargaan, Tax, Bonus)
-- ══════════════════════════════════════════════════════════════════════════
DO $$ BEGIN
INSERT INTO struktur_gaji (id, employee_id, basic_salary, transport_allowance, meal_allowance, position_allowance, ptkp_status) VALUES
  ('sg-01', 'e1a0ca47-173f-4c93-a2bb-678e68a2fa61',   6500000,  500000, 500000,       0, 'TK/0'),
  ('sg-02', '11bf125b-b66a-44ea-9a30-73ed9524e7bc',  10500000,  750000, 500000, 1000000, 'K/2'),
  ('sg-03', '9f388845-acbf-4178-8ef3-c4e5ac4511ac',  16000000, 1500000, 750000, 2000000, 'K/3'),
  ('sg-04', 'ccb5862d-21dc-4d07-8da0-dd411bb3d97e',   8500000,  600000, 500000,       0, 'TK/0'),
  ('sg-05', '533fb02e-c137-444e-94b5-a0f7ea88058c',   9000000,  600000, 500000,  500000, 'K/1'),
  ('sg-06', 'e19a4e1b-d365-4d5a-826c-7b66aa8cca62',   9500000,  750000, 500000,  750000, 'K/1'),
  ('sg-07', 'f132413c-0c1d-4de9-ac53-21b0bcbe57d4',   7500000,  500000, 500000,       0, 'TK/0'),
  ('sg-08', '84019708-d3d6-43f8-817b-da2ff8052eeb',  11000000,  750000, 500000, 1000000, 'K/2'),
  ('sg-09', '217ac2be-f6bc-4481-bdb6-db3d68a26083',   8000000,  600000, 500000,  500000, 'TK/0'),
  ('sg-10', 'ab2109d1-e11f-4e79-8ecf-c8dc5b87cb5a',   7000000,  500000, 500000,       0, 'TK/0')
ON CONFLICT (employee_id) DO UPDATE SET
  basic_salary = EXCLUDED.basic_salary,
  transport_allowance = EXCLUDED.transport_allowance,
  meal_allowance = EXCLUDED.meal_allowance,
  position_allowance = EXCLUDED.position_allowance;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'struktur_gaji: %', SQLERRM; END $$;

DO $$ BEGIN
INSERT INTO penggajian (id, employee_id, month, year, basic_salary, allowances, bonus, tax, bpjs_health, bpjs_employment, deductions, net_salary, status) VALUES
  (gen_random_uuid(), 'e1a0ca47-173f-4c93-a2bb-678e68a2fa61',  6, 2026,  6500000, 1000000,       0,  100000,  65000,  195000,       0,  7140000, 'Dibayarkan'),
  (gen_random_uuid(), '11bf125b-b66a-44ea-9a30-73ed9524e7bc', 6, 2026, 10500000, 2250000,       0,  400000, 105000,  315000,       0, 11930000, 'Dibayarkan'),
  (gen_random_uuid(), '9f388845-acbf-4178-8ef3-c4e5ac4511ac', 6, 2026, 16000000, 4250000,       0, 1500000, 120000,  480000,       0, 18150000, 'Dibayarkan'),
  (gen_random_uuid(), 'ccb5862d-21dc-4d07-8da0-dd411bb3d97e', 6, 2026,  8500000, 1100000,       0,  200000,  85000,  255000,       0,  9060000, 'Dibayarkan'),
  (gen_random_uuid(), '533fb02e-c137-444e-94b5-a0f7ea88058c', 6, 2026,  9000000, 1600000,       0,  250000,  90000,  270000,       0, 10090000, 'Dibayarkan'),
  (gen_random_uuid(), 'e19a4e1b-d365-4d5a-826c-7b66aa8cca62', 6, 2026,  9500000, 2000000, 2000000,  300000,  95000,  285000,       0, 12820000, 'Dibayarkan'),
  (gen_random_uuid(), 'f132413c-0c1d-4de9-ac53-21b0bcbe57d4', 6, 2026,  7500000, 1000000,       0,  150000,  75000,  225000,       0,  8050000, 'Dibayarkan'),
  (gen_random_uuid(), '84019708-d3d6-43f8-817b-da2ff8052eeb', 6, 2026, 11000000, 2250000,       0,  450000, 110000,  330000,       0, 12360000, 'Dibayarkan'),
  (gen_random_uuid(), 'e1a0ca47-173f-4c93-a2bb-678e68a2fa61',  7, 2026,  6500000, 1000000,       0,  100000,  65000,  195000,       0,  7140000, 'Draft'),
  (gen_random_uuid(), '11bf125b-b66a-44ea-9a30-73ed9524e7bc', 7, 2026, 10500000, 2250000,       0,  400000, 105000,  315000,       0, 11930000, 'Draft'),
  (gen_random_uuid(), '9f388845-acbf-4178-8ef3-c4e5ac4511ac', 7, 2026, 16000000, 4250000,       0, 1500000, 120000,  480000,       0, 18150000, 'Draft')
ON CONFLICT DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'penggajian: %', SQLERRM; END $$;

DO $$ BEGIN
INSERT INTO penghargaan_karyawan (id, employee_id, employee_name, department, category, description, award_date, given_by) VALUES
  ('pgh-01', 'e19a4e1b-d365-4d5a-826c-7b66aa8cca62', 'Hendra Saputra',    'Operational Division', 'Employee of the Month', 'Inovasi rute pengiriman yang menghemat biaya BBM 15% selama Q2 2026', '2026-06-30', 'Manajemen PT PGP'),
  ('pgh-02', 'ccb5862d-21dc-4d07-8da0-dd411bb3d97e', 'Dewi Lestari',      'Operational Division', 'Best Performance',      'Tidak ada penolakan dokumen kepabeanan selama 6 bulan berturut-turut', '2026-06-30', 'Manajemen PT PGP'),
  ('pgh-03', '217ac2be-f6bc-4481-bdb6-db3d68a26083', 'Yudi Firmansyah',   'HSE',                  'Safety Champion',       'Zero Accident selama 180 hari consecutif, program K3 terbaik 2026', '2026-06-30', 'Manajemen PT PGP'),
  ('pgh-04', '9f388845-acbf-4178-8ef3-c4e5ac4511ac', 'Fajar Nugroho',     'Operational Division', 'Leadership Award',      'Kepemimpinan divisi operasional meraih target on-time delivery 97%', '2026-06-30', 'Direktur')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'penghargaan_karyawan: %', SQLERRM; END $$;

DO $$ BEGIN
INSERT INTO insentif (id, employee_id, program, amount, period, notes, type, status) VALUES
  ('ins-01', 'e19a4e1b-d365-4d5a-826c-7b66aa8cca62', 'Insentif Kinerja Q2 2026',     2000000, '06/2026', 'Pencapaian target on-time delivery > 97%', 'incentive', 'Dibayarkan'),
  ('ins-02', 'ccb5862d-21dc-4d07-8da0-dd411bb3d97e', 'Insentif Ketelitian Dokumen',   750000,  '06/2026', '6 bulan tanpa penolakan dokumen kepabeanan', 'incentive', 'Dibayarkan'),
  ('ins-03', '84019708-d3d6-43f8-817b-da2ff8052eeb', 'Bonus Efisiensi Gudang Q2',    1500000, '06/2026', 'Peningkatan throughput gudang 18%',         'bonus',     'Disetujui'),
  ('ins-04', '9f388845-acbf-4178-8ef3-c4e5ac4511ac', 'Bonus Target Operasional H1',  5000000, '06/2026', 'Divisi operasional melampaui semua KPI H1 2026', 'bonus', 'Disetujui'),
  ('ins-05', '533fb02e-c137-444e-94b5-a0f7ea88058c', 'Bonus Akurasi Laporan Keuangan', 1000000, '06/2026', '0 selisih rekonsiliasi selama H1 2026',    'bonus',     'Pending')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'insentif: %', SQLERRM; END $$;

-- ══════════════════════════════════════════════════════════════════════════
-- 9. EMPLOYEE RELATIONS (Keluhan, SP, Pengunduran Diri, Survei)
-- ══════════════════════════════════════════════════════════════════════════
DO $$ BEGIN
INSERT INTO surat_peringatan (id, employee_id, employee_name, employee_email, sp_level, reason, valid_until, issued_by, status) VALUES
  ('sp-01', 'f132413c-0c1d-4de9-ac53-21b0bcbe57d4', 'Maya Kusuma',   'maya.kusuma@ptpgp.co.id',   'SP1', 'Terlambat hadir > 3x dalam sebulan tanpa pemberitahuan', CURRENT_DATE + 150, 'Budi Santoso', 'Aktif'),
  ('sp-02', 'ab2109d1-e11f-4e79-8ecf-c8dc5b87cb5a', 'Wawan Setiadi', 'wawan.setiadi@ptpgp.co.id', 'SP1', 'Kelalaian pengarsipan dokumen PIB mengakibatkan denda keterlambatan', CURRENT_DATE + 120, 'Fajar Nugroho', 'Aktif'),
  ('sp-03', 'e1a0ca47-173f-4c93-a2bb-678e68a2fa61', 'Siti Rahayu',   'siti.rahayu@ptpgp.co.id',   'SP1', 'Peringatan terkait keterlambatan input data karyawan baru', CURRENT_DATE - 60, 'Budi Santoso', 'Berakhir')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'surat_peringatan: %', SQLERRM; END $$;

DO $$ BEGIN
INSERT INTO keluhan (id, employee_id, employee_name, employee_email, subject, category, description, status) VALUES
  ('kel-01', 'f132413c-0c1d-4de9-ac53-21b0bcbe57d4', 'Maya Kusuma',   'maya.kusuma@ptpgp.co.id',   'Fasilitas Kantin Kurang Memadai',           'Fasilitas',   'Kantin sering kehabisan menu sebelum jam istirahat berakhir. Karyawan terpaksa beli di luar dan terlambat kembali bekerja.', 'Diajukan'),
  ('kel-02', '84019708-d3d6-43f8-817b-da2ff8052eeb', 'Agus Purnomo',  'agus.purnomo@ptpgp.co.id',  'AC Gudang Rusak - Suhu Terlalu Panas',      'Fasilitas',   'AC di gudang cargo rusak sudah 2 minggu, suhu sangat panas hingga 38°C saat siang hari. Mempengaruhi produktivitas dan kesehatan.', 'Dalam Proses'),
  ('kel-03', 'ccb5862d-21dc-4d07-8da0-dd411bb3d97e', 'Dewi Lestari',  'dewi.lestari@ptpgp.co.id',  'Koneksi Internet Kantor Tidak Stabil',      'IT & Sistem',  'Internet di ruang dokumentasi sering putus terutama saat mengakses sistem CEISA. Menghambat pekerjaan utama.', 'Selesai'),
  ('kel-04', 'e1a0ca47-173f-4c93-a2bb-678e68a2fa61', 'Siti Rahayu',   'siti.rahayu@ptpgp.co.id',   'Kurangnya Pelatihan untuk Karyawan Baru',   'Pengembangan', 'Karyawan baru tidak mendapat pelatihan yang cukup sebelum mulai bekerja, sehingga banyak kesalahan di awal.', 'Diajukan')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'keluhan: %', SQLERRM; END $$;

DO $$ BEGIN
INSERT INTO pengunduran_diri (id, employee_id, employee_name, employee_email, reason, last_day, status) VALUES
  ('res-01', 'ab2109d1-e11f-4e79-8ecf-c8dc5b87cb5a', 'Wawan Setiadi', 'wawan.setiadi@ptpgp.co.id', 'Mendapatkan penawaran yang lebih baik di perusahaan lain dengan jabatan lebih tinggi dan gaji lebih kompetitif.', CURRENT_DATE + 30, 'Diajukan')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'pengunduran_diri: %', SQLERRM; END $$;

DO $$ BEGIN
INSERT INTO survei_karyawan (id, title, survey_type, questions, status, created_by) VALUES
  ('surv-01', 'Survei Kepuasan Kerja Q2 2026', 'Satisfaction', '[{"id":"s1","text":"Seberapa puas Anda dengan lingkungan kerja saat ini?","type":"skala"},{"id":"s2","text":"Apakah Anda merasa dihargai oleh atasan Anda?","type":"skala"},{"id":"s3","text":"Seberapa besar kemungkinan Anda merekomendasikan perusahaan ini kepada teman?","type":"skala"}]', 'Aktif', 'hrd@ptpgp.co.id'),
  ('surv-02', 'Survei Iklim Keselamatan Kerja 2026', 'Safety Climate', '[{"id":"k1","text":"Apakah Anda merasa aman bekerja di lingkungan kerja Anda saat ini?","type":"skala"},{"id":"k2","text":"Apakah prosedur K3 di perusahaan sudah memadai?","type":"skala"}]', 'Aktif', 'yudi.firmansyah@ptpgp.co.id')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'survei_karyawan: %', SQLERRM; END $$;

-- ══════════════════════════════════════════════════════════════════════════
-- 10. LEARNING & TRAINING (Pelatihan, Peserta, Materi, Kuis, ROI, TNA)
-- ══════════════════════════════════════════════════════════════════════════
DO $$ BEGIN
INSERT INTO pelatihan (id, title, description, date_start, date_end, status, department, proposed_cost, budget_status) VALUES
  ('trn-01', 'Sertifikasi PPJK (Pengusaha Pengurusan Jasa Kepabeanan)', 'Pelatihan dan ujian sertifikasi resmi untuk mendapatkan lisensi PPJK dari Bea Cukai', CURRENT_DATE + 30, CURRENT_DATE + 35, 'Direncanakan', 'Operational Division', 18000000, 'Disetujui'),
  ('trn-02', 'Pelatihan K3 & Penanganan Bahan Berbahaya', 'Pelatihan wajib K3 dan cara penanganan B3 untuk seluruh staf gudang dan operasional', CURRENT_DATE - 20, CURRENT_DATE - 18, 'Selesai', 'Operational Division', 8500000, 'Disetujui'),
  ('trn-03', 'Workshop Kepemimpinan Level Supervisor', 'Program pengembangan kepemimpinan bagi supervisor dan calon manager', CURRENT_DATE + 45, CURRENT_DATE + 47, 'Direncanakan', 'Semua Divisi', 25000000, 'Pending'),
  ('trn-04', 'Pelatihan HRIS & Digitalisasi SDM', 'Penggunaan sistem HRIS baru dan transformasi digital proses HR', CURRENT_DATE - 10, CURRENT_DATE - 9, 'Selesai', 'HR & GA', 5000000, 'Disetujui'),
  ('trn-05', 'Training Negosiasi dan Komunikasi Klien', 'Teknik negosiasi dan komunikasi efektif dengan klien forwarding internasional', CURRENT_DATE + 20, CURRENT_DATE + 21, 'Direncanakan', 'Operational Division', 7000000, 'Disetujui')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'pelatihan: %', SQLERRM; END $$;

DO $$ BEGIN
INSERT INTO peserta_pelatihan (id, training_id, employee_id, status, score, completion_date) VALUES
  ('pt-01', 'trn-01', 'ccb5862d-21dc-4d07-8da0-dd411bb3d97e', 'Terdaftar', NULL, NULL),
  ('pt-02', 'trn-01', 'ab2109d1-e11f-4e79-8ecf-c8dc5b87cb5a', 'Terdaftar', NULL, NULL),
  ('pt-03', 'trn-02', '84019708-d3d6-43f8-817b-da2ff8052eeb', 'Selesai', 88, CURRENT_DATE - 18),
  ('pt-04', 'trn-02', 'e19a4e1b-d365-4d5a-826c-7b66aa8cca62', 'Selesai', 92, CURRENT_DATE - 18),
  ('pt-05', 'trn-02', '217ac2be-f6bc-4481-bdb6-db3d68a26083', 'Selesai', 95, CURRENT_DATE - 18),
  ('pt-06', 'trn-04', '11bf125b-b66a-44ea-9a30-73ed9524e7bc', 'Selesai', 85, CURRENT_DATE - 9),
  ('pt-07', 'trn-04', 'e1a0ca47-173f-4c93-a2bb-678e68a2fa61', 'Selesai', 80, CURRENT_DATE - 9),
  ('pt-08', 'trn-05', 'f132413c-0c1d-4de9-ac53-21b0bcbe57d4', 'Terdaftar', NULL, NULL),
  ('pt-09', 'trn-05', 'ccb5862d-21dc-4d07-8da0-dd411bb3d97e', 'Terdaftar', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'peserta_pelatihan: %', SQLERRM; END $$;

DO $$ BEGIN
INSERT INTO sertifikat_pelatihan (id, training_id, employee_id, certificate_number, completion_date, status) VALUES
  ('cert-01', 'trn-02', '84019708-d3d6-43f8-817b-da2ff8052eeb', 'CERT-K3-2026-001', CURRENT_DATE - 18, 'Terbit'),
  ('cert-02', 'trn-02', 'e19a4e1b-d365-4d5a-826c-7b66aa8cca62', 'CERT-K3-2026-002', CURRENT_DATE - 18, 'Terbit'),
  ('cert-03', 'trn-02', '217ac2be-f6bc-4481-bdb6-db3d68a26083', 'CERT-K3-2026-003', CURRENT_DATE - 18, 'Terbit'),
  ('cert-04', 'trn-04', '11bf125b-b66a-44ea-9a30-73ed9524e7bc', 'CERT-HRIS-2026-001', CURRENT_DATE - 9, 'Terbit')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'sertifikat_pelatihan: %', SQLERRM; END $$;

DO $$ BEGIN
INSERT INTO roi_pelatihan (training_id, cost, benefit, notes) VALUES
  ('trn-02', 8500000,  35000000, 'Penurunan insiden K3 dan biaya pengobatan pasca pelatihan'),
  ('trn-04', 5000000,  20000000, 'Efisiensi waktu administrasi HR meningkat 40% setelah digitalisasi')
ON CONFLICT (training_id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'roi_pelatihan: %', SQLERRM; END $$;

DO $$ BEGIN
INSERT INTO permintaan_pelatihan (id, department, skill_name, current_level, required_level, reason, status) VALUES
  ('rtn-01', 'Operational Division', 'Customs Regulation (Kepabeanan)', 3, 4, 'Gap kompetensi dari hasil assessment — 3 staf perlu sertifikasi PPJK', 'Disetujui'),
  ('rtn-02', 'HR & GA',             'Sistem HRIS & HR Analytics',      2, 3, 'Implementasi HRIS baru membutuhkan skill upgrade tim HR',            'Disetujui'),
  ('rtn-03', 'Operational Division', 'Negosiasi Klien Internasional',   2, 3, 'Ekspansi klien baru memerlukan kemampuan negosiasi lebih tinggi',    'Pending')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'permintaan_pelatihan: %', SQLERRM; END $$;

-- ══════════════════════════════════════════════════════════════════════════
-- 11. COMPETENCY MANAGEMENT (Master, Jabatan Link, Karyawan, Gap)
-- ══════════════════════════════════════════════════════════════════════════
DO $$ BEGIN
INSERT INTO master_kompetensi (id, name, category, department, kode, deskripsi, status, jenis_kompetensi) VALUES
  ('sk-01', 'Customs Regulation (Kepabeanan)', 'Teknis',     'Operational Division', 'SK-01', 'Pemahaman dan penerapan regulasi kepabeanan ekspor-impor, PIB/PEB, HS Code', 'Aktif', 'Hard Skill'),
  ('sk-02', 'Cargo Handling & Warehouse',      'Teknis',     'Operational Division', 'SK-02', 'Penanganan bongkar muat cargo, tata letak gudang, manajemen stok', 'Aktif', 'Hard Skill'),
  ('sk-03', 'Freight Forwarding & Logistics',  'Teknis',     'Operational Division', 'SK-03', 'Manajemen pengiriman, routing, koordinasi carrier dan freight broker', 'Aktif', 'Hard Skill'),
  ('sk-04', 'Negosiasi & Komunikasi Klien',    'Soft Skill', NULL,                   'SK-04', 'Kemampuan bernegosiasi harga, mengelola harapan klien, presentasi efektif', 'Aktif', 'Soft Skill'),
  ('sk-05', 'Kepemimpinan & Manajemen Tim',    'Leadership', NULL,                   'SK-05', 'Kemampuan memimpin tim, delegasi, coaching, dan pengambilan keputusan', 'Aktif', 'Soft Skill'),
  ('sk-06', 'Financial Reporting & Accounting','Teknis',     'Finance',              'SK-06', 'Penyusunan laporan keuangan, rekonsiliasi, dan pengelolaan anggaran', 'Aktif', 'Hard Skill'),
  ('sk-07', 'K3 & Keselamatan Kerja',          'Teknis',     'HSE',                  'SK-07', 'Penerapan prosedur K3, identifikasi bahaya, investigasi insiden', 'Aktif', 'Hard Skill'),
  ('sk-08', 'Microsoft Office (Excel Lanjutan)','Umum',      NULL,                   'SK-08', 'Pivot table, VLOOKUP, macro dasar, analisis data dengan Excel', 'Aktif', 'Hard Skill'),
  ('sk-09', 'HR Management & Administrasi',    'Teknis',     'HR & GA',              'SK-09', 'Manajemen data karyawan, payroll, rekrutmen, dan administrasi SDM', 'Aktif', 'Hard Skill'),
  ('sk-10', 'Analisis Data & Pelaporan',       'Soft Skill', NULL,                   'SK-10', 'Kemampuan mengolah data, membuat laporan analitis, dan visualisasi data', 'Aktif', 'Hard Skill')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'master_kompetensi: %', SQLERRM; END $$;

DO $$ BEGIN
INSERT INTO kompetensi_karyawan (id, employee_id, skill_id, current_level, assessment_type, assessment_date) VALUES
  ('kk-01', 'ccb5862d-21dc-4d07-8da0-dd411bb3d97e', 'sk-01', 4, 'Manager Assessment', CURRENT_DATE - 30),
  ('kk-02', 'ccb5862d-21dc-4d07-8da0-dd411bb3d97e', 'sk-08', 3, 'Self Assessment',    CURRENT_DATE - 30),
  ('kk-03', 'ccb5862d-21dc-4d07-8da0-dd411bb3d97e', 'sk-04', 2, 'Manager Assessment', CURRENT_DATE - 30),
  ('kk-04', '84019708-d3d6-43f8-817b-da2ff8052eeb', 'sk-02', 4, 'Manager Assessment', CURRENT_DATE - 30),
  ('kk-05', '84019708-d3d6-43f8-817b-da2ff8052eeb', 'sk-05', 3, 'Manager Assessment', CURRENT_DATE - 30),
  ('kk-06', 'e19a4e1b-d365-4d5a-826c-7b66aa8cca62', 'sk-03', 4, 'Manager Assessment', CURRENT_DATE - 30),
  ('kk-07', 'e19a4e1b-d365-4d5a-826c-7b66aa8cca62', 'sk-05', 4, 'Manager Assessment', CURRENT_DATE - 30),
  ('kk-08', '533fb02e-c137-444e-94b5-a0f7ea88058c', 'sk-06', 4, 'Manager Assessment', CURRENT_DATE - 30),
  ('kk-09', '533fb02e-c137-444e-94b5-a0f7ea88058c', 'sk-10', 3, 'Self Assessment',    CURRENT_DATE - 30),
  ('kk-10', '217ac2be-f6bc-4481-bdb6-db3d68a26083', 'sk-07', 5, 'Manager Assessment', CURRENT_DATE - 30),
  ('kk-11', '11bf125b-b66a-44ea-9a30-73ed9524e7bc', 'sk-09', 4, 'Manager Assessment', CURRENT_DATE - 30),
  ('kk-12', '11bf125b-b66a-44ea-9a30-73ed9524e7bc', 'sk-05', 4, 'Manager Assessment', CURRENT_DATE - 30),
  ('kk-13', 'e1a0ca47-173f-4c93-a2bb-678e68a2fa61', 'sk-09', 3, 'Manager Assessment', CURRENT_DATE - 30),
  ('kk-14', 'f132413c-0c1d-4de9-ac53-21b0bcbe57d4', 'sk-04', 3, 'Manager Assessment', CURRENT_DATE - 30),
  ('kk-15', 'ab2109d1-e11f-4e79-8ecf-c8dc5b87cb5a', 'sk-01', 3, 'Self Assessment',    CURRENT_DATE - 30)
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'kompetensi_karyawan: %', SQLERRM; END $$;

-- ══════════════════════════════════════════════════════════════════════════
-- 12. WORKFORCE REQUESTS (Permintaan SDM + Approval Steps)
-- ══════════════════════════════════════════════════════════════════════════
DO $$ BEGIN
INSERT INTO permintaan_sdm (id, department, position, quantity, reason, urgency, status, requested_by,
  request_type_id, reason_category_id, employment_type_id) VALUES
  ('rsdm-01', 'Operational Division', 'Staff PPJK (Kepabeanan)',         2, 'Peningkatan volume ekspor-impor Q3 2026 membutuhkan penambahan SDM segera', 'Tinggi',  'Disetujui', 'fajar.nugroho@ptpgp.co.id',   'jps-03', 'aps-09', 'emt-01'),
  ('rsdm-02', 'Operational Division', 'Sopir Armada (Truck B2)',          1, 'Penambahan armada truck memerlukan pengemudi berpengalaman',                 'Sedang', 'Pending',   'fajar.nugroho@ptpgp.co.id',   'jps-02', 'aps-01', 'emt-01'),
  ('rsdm-03', 'Finance',              'Finance & Accounting Staff',       1, 'Replacement karyawan resign yang belum tergantikan',                        'Tinggi',  'Direview',  'finance@ptpgp.co.id',          'jps-02', 'aps-01', 'emt-01'),
  ('rsdm-04', 'HR & GA',              'HR Administrator (Magang)',        1, 'Kebutuhan tenaga magang untuk membantu digitalisasi data arsip HR',          'Rendah', 'Pending',   'hrd@ptpgp.co.id',             'jps-06', 'aps-04', 'emt-03'),
  ('rsdm-05', 'Operational Division', 'Customer Service Ekspor-Impor',   1, 'Peningkatan jumlah klien baru membutuhkan penambahan CS',                   'Sedang', 'Ditolak',   'fajar.nugroho@ptpgp.co.id',   'jps-03', 'aps-03', 'emt-01')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'permintaan_sdm: %', SQLERRM; END $$;

DO $$ BEGIN
INSERT INTO manpower_approval_steps (id, request_id, step_number, step_label, approver_role, approver_department, status, approved_by, approved_at, notes) VALUES
  ('mas-01-1', 'rsdm-01', 1, 'Department Head / Division Head', 'department_manager', NULL,       'Approved', 'fajar.nugroho@ptpgp.co.id',  NOW() - INTERVAL '10 days', 'Dibutuhkan segera untuk Q3'),
  ('mas-01-2', 'rsdm-01', 2, 'HRBP / HR Manager',               'hrd',                NULL,       'Approved', 'hrd@ptpgp.co.id',             NOW() - INTERVAL '8 days',  'Formasi tersedia, lanjut ke Finance'),
  ('mas-01-3', 'rsdm-01', 3, 'Finance',                         'department_manager', 'Finance',  'Approved', 'finance@ptpgp.co.id',         NOW() - INTERVAL '6 days',  'Budget tersedia dalam RKAP 2026'),
  ('mas-01-4', 'rsdm-01', 4, 'Director / CEO',                  'director',           NULL,       'Approved', 'director@ptpgp.co.id',        NOW() - INTERVAL '4 days',  'Disetujui, segera proses rekrutmen'),
  ('mas-02-1', 'rsdm-02', 1, 'Department Head / Division Head', 'department_manager', NULL,       'Pending',  NULL, NULL, NULL),
  ('mas-03-1', 'rsdm-03', 1, 'Department Head / Division Head', 'department_manager', NULL,       'Approved', 'finance@ptpgp.co.id',         NOW() - INTERVAL '5 days',  'Sangat dibutuhkan'),
  ('mas-03-2', 'rsdm-03', 2, 'HRBP / HR Manager',               'hrd',                NULL,       'Pending',  NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'manpower_approval_steps: %', SQLERRM; END $$;

-- ══════════════════════════════════════════════════════════════════════════
-- 13. JOB DESC & JOB SPEC (Deskripsi Kerja & Spesifikasi Kerja)
-- ══════════════════════════════════════════════════════════════════════════
DO $$ BEGIN
INSERT INTO deskripsi_kerja (id, position, department, responsibilities, kode) VALUES
  ('jd-01', 'Staff PPJK (Kepabeanan)',          'Operational Division',
   '1. Mengurus dan mengajukan dokumen PIB/PEB ke Bea Cukai melalui sistem CEISA\n2. Memastikan kelengkapan dokumen ekspor-impor sesuai regulasi\n3. Berkoordinasi dengan shipping line, EMKL, dan instansi terkait\n4. Mengarsip dan melaporkan status pengurusan dokumen kepada supervisor\n5. Memantau tarif bea masuk dan perkembangan regulasi kepabeanan terbaru', '1.1.1.1'),
  ('jd-02', 'Customer Service Ekspor-Impor',    'Operational Division',
   '1. Melayani dan merespons pertanyaan klien terkait layanan forwarding\n2. Membuat dan mengirimkan quotation kepada calon klien\n3. Memantau status pengiriman dan proaktif menginformasikan ke klien\n4. Menangani keluhan klien dan mengeskalasi ke supervisor bila diperlukan\n5. Memaintain database klien dan riwayat transaksi', '1.1.1.2'),
  ('jd-03', 'Supervisor Gudang & Cargo',        'Operational Division',
   '1. Mengawasi dan mengkoordinasikan seluruh aktivitas bongkar muat di gudang\n2. Memastikan keamanan dan kerapian area penyimpanan cargo\n3. Mengelola jadwal dan penugasan staf gudang\n4. Memastikan prosedur K3 diterapkan di seluruh area gudang\n5. Membuat laporan harian dan bulanan arus barang masuk/keluar', '1.1.1.3'),
  ('jd-04', 'HR & GA Supervisor',               'HR & GA',
   '1. Mengelola proses rekrutmen end-to-end mulai dari job posting hingga onboarding\n2. Mengadministrasikan data karyawan, kontrak, dan arsip kepegawaian\n3. Mengelola sistem payroll dan memastikan keakuratan data penggajian\n4. Mengkoordinasikan program pelatihan dan pengembangan karyawan\n5. Memastikan kepatuhan terhadap regulasi ketenagakerjaan', '1.2.1.1'),
  ('jd-05', 'Finance & Accounting Staff',       'Finance',
   '1. Membuat laporan keuangan bulanan dan tahunan\n2. Mengelola proses rekonsiliasi bank dan akun\n3. Memproses invoice, pembayaran, dan penagihan\n4. Membantu persiapan audit internal dan eksternal\n5. Memantau realisasi anggaran dan melaporkan deviasi', '1.3.1.1'),
  ('jd-06', 'HSE Officer',                      'HSE',
   '1. Merancang, mengimplementasikan, dan memonitor program K3 perusahaan\n2. Melakukan inspeksi rutin area kerja dan mengidentifikasi potensi bahaya\n3. Menginvestigasi setiap insiden/kecelakaan dan menyusun laporan\n4. Menyelenggarakan pelatihan dan sosialisasi K3 kepada seluruh karyawan\n5. Memastikan kepatuhan terhadap regulasi K3 dan lingkungan', '1.4.1.1')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'deskripsi_kerja: %', SQLERRM; END $$;

DO $$ BEGIN
INSERT INTO spesifikasi_kerja (id, position, department, qualifications, kode) VALUES
  ('js-01', 'Staff PPJK (Kepabeanan)',          'Operational Division',
   'Pendidikan: Min. D3 Kepabeanan/Logistik/Manajemen\nPengalaman: Min. 1 tahun di bidang kepabeanan atau PPJK\nKeahlian Wajib: Familiar dengan sistem CEISA, pemahaman PIB/PEB, HS Code\nSertifikasi: PPJK (diutamakan)\nSkill Tambahan: MS Excel, komunikasi baik, teliti', '1.1.1.1'),
  ('js-02', 'Customer Service Ekspor-Impor',    'Operational Division',
   'Pendidikan: Min. D3 semua jurusan\nPengalaman: Min. 1 tahun di customer service atau forwarding\nKeahlian Wajib: Komunikasi verbal dan tertulis yang baik, familiar dengan proses ekspor-impor\nBahasa: Inggris aktif/pasif\nSkill Tambahan: MS Office, problem solving', '1.1.1.2'),
  ('js-03', 'Supervisor Gudang & Cargo',        'Operational Division',
   'Pendidikan: Min. D3 Manajemen Logistik/Teknik\nPengalaman: Min. 3 tahun di warehouse/logistik, min. 1 tahun sebagai supervisor\nKeahlian Wajib: Warehouse management, SOP bongkar muat, K3 dasar\nSertifikasi: K3 Gudang (diutamakan)\nSkill Tambahan: Leadership, MS Office', '1.1.1.3'),
  ('js-04', 'HR & GA Supervisor',               'HR & GA',
   'Pendidikan: Min. S1 Psikologi/Manajemen SDM/Hukum\nPengalaman: Min. 3 tahun di HR, min. 1 tahun sebagai supervisor\nKeahlian Wajib: Rekrutmen, payroll, UU Ketenagakerjaan, BPJS\nSkill Tambahan: HRIS, komunikasi interpersonal', '1.2.1.1'),
  ('js-05', 'HSE Officer',                      'HSE',
   'Pendidikan: Min. S1 Teknik/K3\nPengalaman: Min. 2 tahun di bidang HSE\nSertifikasi Wajib: Ahli K3 Umum (KEMNAKER)\nKeahlian Wajib: Identifikasi bahaya, investigasi insiden, HIRAC\nSkill Tambahan: Pelatihan K3, audit lingkungan', '1.4.1.1')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'spesifikasi_kerja: %', SQLERRM; END $$;

-- ══════════════════════════════════════════════════════════════════════════
-- 14. ATTENDANCE & LEAVES (Absensi, Cuti, Saldo Cuti, Lembur)
-- ══════════════════════════════════════════════════════════════════════════
DO $$ BEGIN
INSERT INTO absensi (id, employee_id, date, check_in, check_out, status, employee_name, department, location_name, within_geofence, is_business_trip) VALUES
  ('abs-01', 'e1a0ca47-173f-4c93-a2bb-678e68a2fa61',  CURRENT_DATE,     (CURRENT_DATE||' 07:52')::timestamptz, (CURRENT_DATE||' 17:03')::timestamptz,     'Hadir',    'Siti Rahayu',   'HR & GA',              'Kantor Pusat & Gudang PGP', TRUE,  FALSE),
  ('abs-02', '11bf125b-b66a-44ea-9a30-73ed9524e7bc',  CURRENT_DATE,     (CURRENT_DATE||' 08:05')::timestamptz, NULL,                                        'Hadir',    'Budi Santoso',  'HR & GA',              'Kantor Pusat & Gudang PGP', TRUE,  FALSE),
  ('abs-03', '9f388845-acbf-4178-8ef3-c4e5ac4511ac',  CURRENT_DATE,     (CURRENT_DATE||' 07:45')::timestamptz, NULL,                                        'Hadir',    'Fajar Nugroho', 'Operational Division', 'Kantor Pusat & Gudang PGP', TRUE,  FALSE),
  ('abs-04', 'ccb5862d-21dc-4d07-8da0-dd411bb3d97e',  CURRENT_DATE,     (CURRENT_DATE||' 08:18')::timestamptz, NULL,                                        'Terlambat','Dewi Lestari',  'Operational Division', 'Kantor Pusat & Gudang PGP', TRUE,  FALSE),
  ('abs-05', '84019708-d3d6-43f8-817b-da2ff8052eeb',  CURRENT_DATE,     (CURRENT_DATE||' 07:55')::timestamptz, NULL,                                        'Hadir',    'Agus Purnomo',  'Operational Division', 'Kantor Pusat & Gudang PGP', TRUE,  FALSE),
  ('abs-06', 'f132413c-0c1d-4de9-ac53-21b0bcbe57d4',  CURRENT_DATE,     NULL,                                  NULL,                                        'Alpha',    'Maya Kusuma',   'Operational Division', NULL,                        FALSE, FALSE),
  ('abs-07', 'e19a4e1b-d365-4d5a-826c-7b66aa8cca62',  CURRENT_DATE,     (CURRENT_DATE||' 06:30')::timestamptz, NULL,                                        'Hadir',    'Hendra Saputra','Operational Division', 'Pelabuhan Tanjung Priok',   TRUE,  TRUE),
  ('abs-08', '533fb02e-c137-444e-94b5-a0f7ea88058c',  CURRENT_DATE,     (CURRENT_DATE||' 08:00')::timestamptz, NULL,                                        'Hadir',    'Rina Marlina',  'Finance',              'Kantor Pusat & Gudang PGP', TRUE,  FALSE),
  ('abs-09', 'e1a0ca47-173f-4c93-a2bb-678e68a2fa61',  CURRENT_DATE - 1, ((CURRENT_DATE-1)||' 07:55')::timestamptz, ((CURRENT_DATE-1)||' 17:00')::timestamptz, 'Hadir',  'Siti Rahayu',   'HR & GA',              'Kantor Pusat & Gudang PGP', TRUE,  FALSE),
  ('abs-10', 'ccb5862d-21dc-4d07-8da0-dd411bb3d97e',  CURRENT_DATE - 1, ((CURRENT_DATE-1)||' 08:00')::timestamptz, ((CURRENT_DATE-1)||' 17:30')::timestamptz, 'Hadir',  'Dewi Lestari',  'Operational Division', 'Kantor Pusat & Gudang PGP', TRUE,  FALSE)
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'absensi: %', SQLERRM; END $$;

DO $$ BEGIN
INSERT INTO pengajuan_cuti (id, employee_id, employee_name, department, type, start_date, end_date, reason, status) VALUES
  ('cuti-01', 'e1a0ca47-173f-4c93-a2bb-678e68a2fa61',  'Siti Rahayu',   'HR & GA',              'Cuti Tahunan', CURRENT_DATE + 14, CURRENT_DATE + 16, 'Liburan keluarga akhir tahun',                    'Pending'),
  ('cuti-02', 'ccb5862d-21dc-4d07-8da0-dd411bb3d97e',  'Dewi Lestari',  'Operational Division', 'Cuti Sakit',   CURRENT_DATE - 3,  CURRENT_DATE - 2,  'Sakit demam dan flu, sudah ada surat dokter',     'Disetujui'),
  ('cuti-03', '84019708-d3d6-43f8-817b-da2ff8052eeb',  'Agus Purnomo',  'Operational Division', 'Cuti Tahunan', CURRENT_DATE + 7,  CURRENT_DATE + 9,  'Keperluan keluarga di luar kota',                 'Disetujui'),
  ('cuti-04', 'f132413c-0c1d-4de9-ac53-21b0bcbe57d4',  'Maya Kusuma',   'Operational Division', 'Izin Khusus',  CURRENT_DATE,      CURRENT_DATE,      'Mengurus keperluan administrasi keluarga mendesak','Disetujui'),
  ('cuti-05', '533fb02e-c137-444e-94b5-a0f7ea88058c',  'Rina Marlina',  'Finance',              'Cuti Tahunan', CURRENT_DATE + 21, CURRENT_DATE + 25, 'Bulan madu pasca pernikahan',                     'Pending'),
  ('cuti-06', 'e19a4e1b-d365-4d5a-826c-7b66aa8cca62',  'Hendra Saputra','Operational Division', 'Cuti Tahunan', CURRENT_DATE + 30, CURRENT_DATE + 32, 'Istirahat tahunan',                               'Ditolak')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'pengajuan_cuti: %', SQLERRM; END $$;

DO $$ BEGIN
INSERT INTO saldo_cuti (id, karyawan_id, tahun, jenis_cuti, total_hari, terpakai) VALUES
  ('sc-01', 'e1a0ca47-173f-4c93-a2bb-678e68a2fa61',  2026, 'Cuti Tahunan', 12, 2),
  ('sc-02', '11bf125b-b66a-44ea-9a30-73ed9524e7bc',  2026, 'Cuti Tahunan', 12, 1),
  ('sc-03', '9f388845-acbf-4178-8ef3-c4e5ac4511ac',  2026, 'Cuti Tahunan', 12, 3),
  ('sc-04', 'ccb5862d-21dc-4d07-8da0-dd411bb3d97e',  2026, 'Cuti Tahunan', 12, 4),
  ('sc-05', '533fb02e-c137-444e-94b5-a0f7ea88058c',  2026, 'Cuti Tahunan', 12, 0),
  ('sc-06', 'e19a4e1b-d365-4d5a-826c-7b66aa8cca62',  2026, 'Cuti Tahunan', 12, 3),
  ('sc-07', 'f132413c-0c1d-4de9-ac53-21b0bcbe57d4',  2026, 'Cuti Tahunan', 12, 2),
  ('sc-08', '84019708-d3d6-43f8-817b-da2ff8052eeb',  2026, 'Cuti Tahunan', 12, 3),
  ('sc-09', '217ac2be-f6bc-4481-bdb6-db3d68a26083',  2026, 'Cuti Tahunan', 12, 1),
  ('sc-10', 'ab2109d1-e11f-4e79-8ecf-c8dc5b87cb5a',  2026, 'Cuti Tahunan', 12, 5)
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'saldo_cuti: %', SQLERRM; END $$;

-- ══════════════════════════════════════════════════════════════════════════
-- 15. WORKFORCE TIME (Lembur, Koreksi Absensi, Timesheet, Penugasan)
-- ══════════════════════════════════════════════════════════════════════════
DO $$ BEGIN
INSERT INTO lembur (id, karyawan_id, tanggal, jam_mulai, jam_selesai, alasan, status, reviewed_by) VALUES
  ('lb-01', 'ccb5862d-21dc-4d07-8da0-dd411bb3d97e', CURRENT_DATE - 2, '17:00', '20:30', 'Penyelesaian dokumen PIB mendesak sebelum deadline pengiriman besok pagi', 'Disetujui', 'Fajar Nugroho'),
  ('lb-02', '84019708-d3d6-43f8-817b-da2ff8052eeb', CURRENT_DATE - 1, '17:00', '21:00', 'Bongkar muat cargo kapal tiba malam, staf gudang harus standby',          'Disetujui', 'Fajar Nugroho'),
  ('lb-03', 'e19a4e1b-d365-4d5a-826c-7b66aa8cca62', CURRENT_DATE - 1, '16:00', '22:00', 'Armada pengiriman cargo jadwal malam ke Surabaya',                        'Disetujui', 'Fajar Nugroho'),
  ('lb-04', 'ab2109d1-e11f-4e79-8ecf-c8dc5b87cb5a', CURRENT_DATE,     '17:00', '19:30', 'Input dan verifikasi dokumen ekspor sebelum cutoff 20:00',                 'Pending',   NULL),
  ('lb-05', '533fb02e-c137-444e-94b5-a0f7ea88058c', CURRENT_DATE - 4, '17:00', '20:00', 'Closing laporan keuangan akhir bulan',                                    'Disetujui', 'Fajar Nugroho')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'lembur: %', SQLERRM; END $$;

DO $$ BEGIN
INSERT INTO koreksi_absensi (id, karyawan_id, tanggal, jenis_koreksi, alasan, status, reviewed_by) VALUES
  ('kor-01', 'f132413c-0c1d-4de9-ac53-21b0bcbe57d4', CURRENT_DATE - 5, 'Lupa Clock-Out', 'Meninggalkan kantor mendadak karena ada keluarga sakit, lupa clock-out', 'Disetujui', 'Budi Santoso'),
  ('kor-02', '84019708-d3d6-43f8-817b-da2ff8052eeb', CURRENT_DATE - 3, 'Lupa Clock-In',  'Langsung ke area gudang saat tiba, sensor absensi error pagi itu',       'Pending',   NULL),
  ('kor-03', 'ab2109d1-e11f-4e79-8ecf-c8dc5b87cb5a', CURRENT_DATE - 7, 'Koreksi Lokasi', 'Check-in dari pelabuhan tapi tidak terdeteksi geofence karena sinyal lemah', 'Disetujui', 'Fajar Nugroho')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'koreksi_absensi: %', SQLERRM; END $$;

DO $$ BEGIN
INSERT INTO catatan_aktivitas_harian (id, karyawan_id, tanggal, jam_mulai, jam_selesai, deskripsi_aktivitas, project_site, jam_kerja, mode_kerja) VALUES
  ('cah-01', 'ccb5862d-21dc-4d07-8da0-dd411bb3d97e', CURRENT_DATE,     '08:00', '17:00', 'Pengurusan PIB untuk 3 shipment ekspor furnitur PT Kayu Jati Nusantara', 'Kantor Pusat', 8, 'Kantor'),
  ('cah-02', 'e19a4e1b-d365-4d5a-826c-7b66aa8cca62', CURRENT_DATE,     '06:30', '15:30', 'Koordinasi armada trucking dan pengiriman cargo ke Bekasi dan Surabaya',  'Lapangan',    9, 'Dinas Luar'),
  ('cah-03', '84019708-d3d6-43f8-817b-da2ff8052eeb', CURRENT_DATE,     '07:30', '16:30', 'Supervisi bongkar muat kontainer 4x20ft, stok opname gudang bulanan',    'Gudang',      9, 'Kantor'),
  ('cah-04', '533fb02e-c137-444e-94b5-a0f7ea88058c', CURRENT_DATE,     '08:00', '17:00', 'Rekonsiliasi laporan keuangan bulan Juli dan input data invoice',         'Kantor Pusat', 8, 'Kantor'),
  ('cah-05', 'ab2109d1-e11f-4e79-8ecf-c8dc5b87cb5a', CURRENT_DATE - 1, '08:00', '17:30', 'Pengurusan dokumen ekspor & verifikasi PEB 5 shipment',                  'Kantor Pusat', 8.5, 'Kantor')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'catatan_aktivitas_harian: %', SQLERRM; END $$;

DO $$ BEGIN
INSERT INTO penugasan_kerja (id, karyawan_id, unit_organisasi_id, nama_project, nama_klien, supervisor_karyawan_id, tanggal_mulai, tanggal_selesai, status) VALUES
  ('pgs-01', 'ccb5862d-21dc-4d07-8da0-dd411bb3d97e', 'demo-unit-ops', 'Proyek Ekspor Furnitur Rattan ke Belanda', 'PT Kayu Jati Nusantara', '9f388845-acbf-4178-8ef3-c4e5ac4511ac', CURRENT_DATE - 20, CURRENT_DATE + 10, 'Aktif'),
  ('pgs-02', 'e19a4e1b-d365-4d5a-826c-7b66aa8cca62', 'demo-unit-ops', 'Distribusi Cargo Surabaya-Jakarta',        'CV Sumber Makmur',       '9f388845-acbf-4178-8ef3-c4e5ac4511ac', CURRENT_DATE - 30, CURRENT_DATE - 5,  'Selesai'),
  ('pgs-03', 'f132413c-0c1d-4de9-ac53-21b0bcbe57d4', 'demo-unit-ops', 'Layanan Impor Elektronik PT Sinar Abadi',  'PT Sinar Abadi',         '9f388845-acbf-4178-8ef3-c4e5ac4511ac', CURRENT_DATE - 10, NULL,              'Aktif')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'penugasan_kerja: %', SQLERRM; END $$;

-- ══════════════════════════════════════════════════════════════════════════
-- 16. EMPLOYEE 360° DATA (Data Pribadi, Keluarga, Pendidikan, Aset, Catatan)
-- ══════════════════════════════════════════════════════════════════════════
DO $$ BEGIN
INSERT INTO data_pribadi_karyawan (id, email, nik, birth_place, birth_date, religion, marital_status, phone, address, emergency_name, emergency_phone) VALUES
  ('dp-01', 'siti.rahayu@ptpgp.co.id',   '3174056703950002', 'Jakarta',   '1995-03-27', 'Islam',   'Menikah',  '081200000001', 'Jl. Flamboyan No. 3, Penjaringan, Jakarta Utara',   'Rudi Rahayu',     '081299991001'),
  ('dp-02', 'budi.santoso@ptpgp.co.id',  '3175091085920001', 'Bandung',   '1985-10-10', 'Islam',   'Menikah',  '081200000002', 'Jl. Pluit Sakti Raya No. 7, Jakarta Utara',          'Wulandari',       '081299991002'),
  ('dp-03', 'dewi.lestari@ptpgp.co.id',  '3171234506001001', 'Surabaya',  '2000-06-05', 'Islam',   'Lajang',   '081200000003', 'Jl. Enggano Blok C No. 12, Tanjung Priok, Jakarta',  'Bu Dewi (Ibu)',    '081299991003'),
  ('dp-04', 'hendra.saputra@ptpgp.co.id','3173045201910004', 'Semarang',  '1991-01-12', 'Islam',   'Menikah',  '081200000004', 'Jl. Yos Sudarso No. 45, Tanjung Priok, Jakarta Utara','Sri Hendra (Istri)','081299991004'),
  ('dp-05', 'agus.purnomo@ptpgp.co.id',  '3174078807880005', 'Yogyakarta','1988-08-07', 'Islam',   'Menikah',  '081200000005', 'Jl. Kramat Jaya No. 21, Cilincing, Jakarta Utara',   'Wati (Istri)',     '081299991005'),
  ('dp-06', 'rina.marlina@ptpgp.co.id',  '3278056212970006', 'Bekasi',    '1997-12-22', 'Islam',   'Lajang',   '081200000006', 'Jl. Harapan Baru Raya No. 8, Bekasi Barat',          'Pa Marlina (Ayah)','081299991006'),
  ('dp-07', 'yudi.firmansyah@ptpgp.co.id','3175081504900007','Jakarta',   '1990-04-15', 'Islam',   'Menikah',  '081200000007', 'Jl. Sunter Agung No. 15, Tanjung Priok, Jakarta',    'Sari (Istri)',     '081299991007'),
  ('dp-08', 'maya.kusuma@ptpgp.co.id',   '3174026509960008', 'Jakarta',   '1996-09-25', 'Kristen', 'Lajang',   '081200000008', 'Jl. Tanjung Priok No. 33, Jakarta Utara',            'Bu Kusuma (Ibu)',  '081299991008')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'data_pribadi_karyawan: %', SQLERRM; END $$;

DO $$ BEGIN
INSERT INTO keluarga_karyawan (id, karyawan_id, nama, hubungan, pekerjaan) VALUES
  ('kelf-01', '11bf125b-b66a-44ea-9a30-73ed9524e7bc', 'Wulandari',        'Istri',  'Guru SD'),
  ('kelf-02', '11bf125b-b66a-44ea-9a30-73ed9524e7bc', 'Budi Jr.',         'Anak',   'Pelajar'),
  ('kelf-03', 'e19a4e1b-d365-4d5a-826c-7b66aa8cca62', 'Sri Hendra',       'Istri',  'Karyawan Swasta'),
  ('kelf-04', 'e19a4e1b-d365-4d5a-826c-7b66aa8cca62', 'Fariz Hendra',     'Anak',   'Belum Sekolah'),
  ('kelf-05', '84019708-d3d6-43f8-817b-da2ff8052eeb', 'Wati Purnomo',     'Istri',  'Wirausaha'),
  ('kelf-06', '217ac2be-f6bc-4481-bdb6-db3d68a26083', 'Sari Firmansyah',  'Istri',  'Perawat'),
  ('kelf-07', '533fb02e-c137-444e-94b5-a0f7ea88058c', 'Ahmad Marlina',    'Ayah',   'Pensiunan PNS'),
  ('kelf-08', '9f388845-acbf-4178-8ef3-c4e5ac4511ac', 'Dewi Nugroho',     'Istri',  'Dokter Umum'),
  ('kelf-09', '9f388845-acbf-4178-8ef3-c4e5ac4511ac', 'Farel Nugroho',    'Anak',   'Pelajar SMP')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'keluarga_karyawan: %', SQLERRM; END $$;

DO $$ BEGIN
INSERT INTO pendidikan_karyawan (id, karyawan_id, jenjang, institusi, jurusan, tahun_lulus) VALUES
  ('pdk-01', 'ccb5862d-21dc-4d07-8da0-dd411bb3d97e', 'D3', 'Politeknik Bea Cukai', 'Kepabeanan & Cukai', '2022'),
  ('pdk-02', 'e19a4e1b-d365-4d5a-826c-7b66aa8cca62', 'D3', 'STMT Trisakti',        'Manajemen Transpor Laut', '2013'),
  ('pdk-03', '84019708-d3d6-43f8-817b-da2ff8052eeb', 'D3', 'Politeknik Negeri Jakarta', 'Teknik Mesin', '2010'),
  ('pdk-04', '533fb02e-c137-444e-94b5-a0f7ea88058c', 'S1', 'Universitas Trisakti', 'Akuntansi', '2019'),
  ('pdk-05', '11bf125b-b66a-44ea-9a30-73ed9524e7bc', 'S1', 'Universitas Indonesia', 'Manajemen SDM', '2007'),
  ('pdk-06', '217ac2be-f6bc-4481-bdb6-db3d68a26083', 'S1', 'Universitas Pancasila', 'Teknik Industri', '2012'),
  ('pdk-07', '9f388845-acbf-4178-8ef3-c4e5ac4511ac', 'S1', 'Universitas Hasanuddin', 'Teknik Sipil', '2005'),
  ('pdk-08', 'e1a0ca47-173f-4c93-a2bb-678e68a2fa61', 'S1', 'Universitas Bina Nusantara', 'Psikologi', '2017')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'pendidikan_karyawan: %', SQLERRM; END $$;

DO $$ BEGIN
INSERT INTO aset_karyawan (id, karyawan_id, nama_aset, kategori, nomor_seri, tanggal_serah, status) VALUES
  ('aset-01', 'e19a4e1b-d365-4d5a-826c-7b66aa8cca62', 'Handphone Operasional Samsung A54',      'Elektronik',  'SN-HP-0231', CURRENT_DATE - 365, 'Dipegang'),
  ('aset-02', '533fb02e-c137-444e-94b5-a0f7ea88058c', 'Laptop Lenovo ThinkPad E14',             'Elektronik',  'SN-LP-0117', CURRENT_DATE - 400, 'Dipegang'),
  ('aset-03', '84019708-d3d6-43f8-817b-da2ff8052eeb', 'Radio HT Motorola DP1400',               'Komunikasi',  'SN-HT-0045', CURRENT_DATE - 200, 'Dipegang'),
  ('aset-04', '11bf125b-b66a-44ea-9a30-73ed9524e7bc', 'Laptop ASUS ExpertBook B1',              'Elektronik',  'SN-LP-0089', CURRENT_DATE - 500, 'Dipegang'),
  ('aset-05', '9f388845-acbf-4178-8ef3-c4e5ac4511ac', 'Mobil Operasional Toyota Innova B9012PGP','Kendaraan',  'SN-KB-0001', CURRENT_DATE - 730, 'Dipegang'),
  ('aset-06', '217ac2be-f6bc-4481-bdb6-db3d68a26083', 'Kit K3 Lengkap (Helm, Rompi, Sepatu)',   'APD',         'SN-APD-001', CURRENT_DATE - 180, 'Dipegang'),
  ('aset-07', 'ccb5862d-21dc-4d07-8da0-dd411bb3d97e', 'Printer Label Barcode Zebra ZT230',      'Elektronik',  'SN-PR-0044', CURRENT_DATE - 300, 'Rusak')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'aset_karyawan: %', SQLERRM; END $$;

DO $$ BEGIN
INSERT INTO dokumen_karyawan (id, karyawan_id, jenis, judul, catatan) VALUES
  ('dokk-01', 'e1a0ca47-173f-4c93-a2bb-678e68a2fa61',  'KTP',             'Scan KTP Siti Rahayu',           NULL),
  ('dokk-02', 'e1a0ca47-173f-4c93-a2bb-678e68a2fa61',  'Ijazah',          'Ijazah S1 Psikologi',            'Universitas Bina Nusantara, 2017'),
  ('dokk-03', '11bf125b-b66a-44ea-9a30-73ed9524e7bc',  'KTP',             'Scan KTP Budi Santoso',          NULL),
  ('dokk-04', '11bf125b-b66a-44ea-9a30-73ed9524e7bc',  'Ijazah',          'Ijazah S1 Manajemen SDM',        'Universitas Indonesia, 2007'),
  ('dokk-05', 'ccb5862d-21dc-4d07-8da0-dd411bb3d97e',  'Sertifikat',      'Sertifikat PPJK dari Bea Cukai', 'No. PPJK-2024-089, berlaku s/d 2027'),
  ('dokk-06', '217ac2be-f6bc-4481-bdb6-db3d68a26083',  'Sertifikat',      'Sertifikat Ahli K3 Umum',        'Dari KEMNAKER RI, No. K3-UMUM-2025-017'),
  ('dokk-07', '9f388845-acbf-4178-8ef3-c4e5ac4511ac',  'Kontrak Kerja',   'Kontrak Kerja Tetap',            'Berlaku sejak 2024-01-10'),
  ('dokk-08', 'e19a4e1b-d365-4d5a-826c-7b66aa8cca62',  'SIM',             'Fotokopi SIM B2 Umum',           'No. SIM-B2-2024-001')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'dokumen_karyawan: %', SQLERRM; END $$;

DO $$ BEGIN
INSERT INTO catatan_karyawan (id, email, kategori, judul, catatan) VALUES
  ('catk-01', 'hendra.saputra@ptpgp.co.id',  'Prestasi',   'Inovasi Rute Pengiriman',         'Berhasil mengoptimalkan rute armada dan menghemat biaya BBM 15% di Q2 2026'),
  ('catk-02', 'dewi.lestari@ptpgp.co.id',    'Prestasi',   'Zero Reject Dokumen',             '6 bulan berturut-turut tanpa penolakan dokumen kepabeanan dari Bea Cukai'),
  ('catk-03', 'maya.kusuma@ptpgp.co.id',     'Perhatian',  'Keterlambatan Berulang',          'Terlambat hadir >3x dalam bulan Juni 2026 tanpa pemberitahuan sebelumnya'),
  ('catk-04', 'wawan.setiadi@ptpgp.co.id',   'Perhatian',  'Kelalaian Pengarsipan',           'Satu dokumen PIB salah diarsip mengakibatkan denda keterlambatan Rp 5 juta'),
  ('catk-05', 'budi.santoso@ptpgp.co.id',    'Prestasi',   'Rekrutmen Tepat Waktu',           'Berhasil menyelesaikan 3 proses rekrutmen dalam waktu kurang dari 21 hari di Q2 2026'),
  ('catk-06', 'yudi.firmansyah@ptpgp.co.id', 'Prestasi',   'Safety Champion 2026',           'Memimpin program K3 yang berhasil mencapai 180 hari zero accident')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'catatan_karyawan: %', SQLERRM; END $$;

DO $$ BEGIN
INSERT INTO pengalaman_proyek_karyawan (id, karyawan_id, nama_proyek, peran, klien, tanggal_mulai, tanggal_selesai) VALUES
  ('prj-01', 'ccb5862d-21dc-4d07-8da0-dd411bb3d97e', 'Ekspor Furnitur Rattan ke Belanda',   'PIC Dokumen Kepabeanan', 'PT Kayu Jati Nusantara', CURRENT_DATE - 20, NULL),
  ('prj-02', 'e19a4e1b-d365-4d5a-826c-7b66aa8cca62', 'Distribusi Cargo Surabaya-Jakarta',   'Koordinator Armada',    'CV Sumber Makmur',       CURRENT_DATE - 60, CURRENT_DATE - 30),
  ('prj-03', 'ab2109d1-e11f-4e79-8ecf-c8dc5b87cb5a', 'Impor Elektronik PT Sinar Abadi',    'Staf Dokumentasi',      'PT Sinar Abadi',         CURRENT_DATE - 10, NULL),
  ('prj-04', '9f388845-acbf-4178-8ef3-c4e5ac4511ac', 'Ekspor Kopi Arabika ke Jepang',      'Project Manager',       'PT Kopi Nusantara',      CURRENT_DATE - 90, CURRENT_DATE - 60)
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'pengalaman_proyek_karyawan: %', SQLERRM; END $$;

-- ══════════════════════════════════════════════════════════════════════════
-- 17. ADMIN & SYSTEM (Notifikasi, Log Audit, Pengaturan Sistem, Users)
-- ══════════════════════════════════════════════════════════════════════════
DO $$ BEGIN
INSERT INTO notifikasi (id, user_email, title, message, is_read, link) VALUES
  ('notif-01', 'hrd@ptpgp.co.id',             'Cuti Baru Menunggu Persetujuan',      'Siti Rahayu mengajukan cuti tahunan 3 hari mulai 3 Agustus 2026.',           FALSE, '/hrd/leaves'),
  ('notif-02', 'hrd@ptpgp.co.id',             'Lembur Menunggu Persetujuan',         'Wawan Setiadi mengajukan lembur 2.5 jam hari ini.',                          FALSE, '/hrd/workforce-time/overtime'),
  ('notif-03', 'hrd@ptpgp.co.id',             'SIM/Sertifikat Hampir Kadaluarsa',    'Sertifikat PPJK Dewi Lestari kadaluarsa dalam 10 hari.',                     FALSE, '/hrd/infrastructure/licenses'),
  ('notif-04', 'hrd@ptpgp.co.id',             'Permintaan SDM Baru',                 'Fajar Nugroho mengajukan permintaan penambahan 1 Sopir Armada.',              FALSE, '/hrd/workforce/requests'),
  ('notif-05', 'siti.rahayu@ptpgp.co.id',     'Pengajuan Cuti Dalam Proses',         'Pengajuan cuti tahunan Anda sedang dalam proses review oleh HR.',             TRUE,  '/employee/leaves'),
  ('notif-06', 'dewi.lestari@ptpgp.co.id',    'Peringatan Sertifikasi Kadaluarsa',   'Sertifikat PPJK Anda kadaluarsa dalam 10 hari. Segera perpanjang.',           FALSE, '/employee/profile'),
  ('notif-07', 'fajar.nugroho@ptpgp.co.id',   'Approval Permintaan SDM',             'Permintaan Staff PPJK (2 orang) sudah disetujui oleh Direktur.',              FALSE, '/hrd/workforce/requests'),
  ('notif-08', 'director@ptpgp.co.id',        'Permintaan SDM Menunggu Persetujuan', 'Permintaan Staff Finance (1 orang) menunggu persetujuan Anda.',               FALSE, '/director/requests'),
  ('notif-09', 'hrd@ptpgp.co.id',             'Pengunduran Diri Diajukan',           'Wawan Setiadi mengajukan pengunduran diri, last day 30 hari ke depan.',        FALSE, '/hrd/relations/resignations'),
  ('notif-10', 'hrd@ptpgp.co.id',             'Kandidat Pipeline Baru',              '2 pelamar baru masuk tahap Menunggu Review untuk posisi Staff PPJK.',          FALSE, '/hrd/recruitment/pipeline')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'notifikasi: %', SQLERRM; END $$;

DO $$ BEGIN
INSERT INTO log_audit (action, target_id, target_name, performed_by_role, performed_by_name, performed_by_email, detail) VALUES
  ('APPROVE_LEAVE',       'cuti-03', 'Agus Purnomo',   'hrd', 'Budi Santoso', 'hrd@ptpgp.co.id',      'Menyetujui cuti tahunan 3 hari'),
  ('APPROVE_OVERTIME',    'lb-01',   'Dewi Lestari',   'hrd', 'Fajar Nugroho','fajar.nugroho@ptpgp.co.id', 'Menyetujui lembur 3.5 jam pengurusan PIB mendesak'),
  ('CREATE_EMPLOYEE',     'e1a0ca47','Siti Rahayu',    'hrd', 'Budi Santoso', 'hrd@ptpgp.co.id',      'Menambahkan karyawan baru setelah proses rekrutmen'),
  ('UPDATE_SALARY',       'sg-04',   'Dewi Lestari',   'hrd', 'Budi Santoso', 'hrd@ptpgp.co.id',      'Kenaikan gaji berkala setelah evaluasi kinerja H1 2026'),
  ('REJECT_LEAVE',        'cuti-06', 'Hendra Saputra', 'hrd', 'Budi Santoso', 'hrd@ptpgp.co.id',      'Ditolak karena bertepatan dengan proyek pengiriman besar'),
  ('ISSUE_WARNING',       'sp-01',   'Maya Kusuma',    'hrd', 'Budi Santoso', 'hrd@ptpgp.co.id',      'Menerbitkan SP1 atas keterlambatan berulang'),
  ('APPROVE_MANPOWER_REQ','rsdm-01', 'Staff PPJK x2',  'director', 'Ade Fajar Nurcahman', 'director@ptpgp.co.id', 'Menyetujui permintaan penambahan 2 Staff PPJK')
ON CONFLICT DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'log_audit: %', SQLERRM; END $$;

DO $$ BEGIN
INSERT INTO pengaturan_sistem (key, value, description) VALUES
  ('company_name',           'PT Pratama Galuh Perkasa',           'Nama resmi perusahaan'),
  ('company_tagline',        'Forwarding & Logistics Solutions',   'Tagline perusahaan'),
  ('company_address',        'Jl. Enggano No. 5, Tanjung Priok, Jakarta Utara 14310', 'Alamat kantor pusat'),
  ('company_phone',          '+62-21-4390-xxxx',                   'Nomor telepon kantor'),
  ('company_email',          'info@ptpgp.co.id',                   'Email resmi perusahaan'),
  ('leave_quota_annual',     '12',                                 'Kuota cuti tahunan per karyawan'),
  ('working_hours_start',    '08:00',                              'Jam mulai kerja standar'),
  ('working_hours_end',      '17:00',                              'Jam selesai kerja standar'),
  ('late_tolerance_minutes', '15',                                 'Toleransi keterlambatan dalam menit'),
  ('attendance_geofence_radius', '100',                           'Radius geofence absensi dalam meter')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'pengaturan_sistem: %', SQLERRM; END $$;

-- ══════════════════════════════════════════════════════════════════════════
-- 18. E-PROCUREMENT (Vendor, Quotation)
-- ══════════════════════════════════════════════════════════════════════════
DO $$ BEGIN
INSERT INTO vendor (id, company_name, company_email, company_phone, npwp, nib, business_type, name, email, phone, status) VALUES
  ('vnd-01', 'PT Mitra Logistik Nusantara',  'info@mitralogistik.co.id',    '021-5560001', '01.234.567.8-901.000', '1234567890001', 'Freight Forwarding',     'Ahmad Kurniawan',  'ahmad@mitralogistik.co.id',    '081311110001', 'Terverifikasi'),
  ('vnd-02', 'CV Armada Jaya Transportasi',  'admin@armadajaya.co.id',      '021-6670002', '02.345.678.9-012.000', '2345678900002', 'Transportasi Darat',     'Sutrisno Jaya',    'sutrisno@armadajaya.co.id',    '081311110002', 'Terverifikasi'),
  ('vnd-03', 'PT Kemasan Prima Indonesia',   'sales@kemasanprima.co.id',    '021-7780003', '03.456.789.0-123.000', '3456789000003', 'Packaging & Supplies',   'Dewi Anggraini',   'dewi@kemasanprima.co.id',      '081311110003', 'Pending Review'),
  ('vnd-04', 'UD Bahan Operasional Mandiri', 'order@bahanmandiri.co.id',    '021-8890004', '04.567.890.1-234.000', '4567890100004', 'Supplier Alat Kantor',   'Hadi Santoso',     'hadi@bahanmandiri.co.id',      '081311110004', 'Pending Review'),
  ('vnd-05', 'PT Teknologi Sistem Integra',  'support@teknologisi.co.id',   '021-9900005', '05.678.901.2-345.000', '5678901200005', 'IT & Software',          'Reza Pratama',     'reza@teknologisi.co.id',       '081311110005', 'Ditolak')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'vendor: %', SQLERRM; END $$;

-- ══════════════════════════════════════════════════════════════════════════
-- 19. CONTACT MESSAGES (Pesan Kontak dari Website)
-- ══════════════════════════════════════════════════════════════════════════
DO $$ BEGIN
INSERT INTO pesan_kontak (id, name, email, phone, company, subject, message, status) VALUES
  ('msg-01', 'Andra Wijaya',      'andra@clientcorp.com',   '081344440001', 'PT Client Corp',         'Penawaran Jasa Freight Forwarding',     'Kami tertarik dengan jasa ekspor-impor Anda. Mohon kirimkan penawaran untuk rute Jakarta-Rotterdam.',        'Baru'),
  ('msg-02', 'Sinta Permata',     'sinta@exportindo.com',   '081344440002', 'CV Export Indo',         'Konsultasi Customs Clearance',          'Kami memiliki shipment kopi 500 ton ke Jepang bulan depan. Apakah PGP dapat membantu proses kepabeanannya?', 'Dibalas'),
  ('msg-03', 'Bambang Sutrisno',  'bambang@logistik.co.id', '081344440003', 'PT Logistik Prima',      'Kemitraan Bisnis Armada',               'Kami memiliki 10 unit truck idle yang ingin kami kerjasamakan untuk rute cargo Jabodetabek.',                'Dalam Proses'),
  ('msg-04', 'Yanti Muliawati',   'yanti@umkm.com',         '081344440004', 'UD Yanti Craft',         'Informasi Jasa Ekspor UMKM',            'Saya pemilik UMKM kerajinan rotan. Apakah PGP melayani ekspor UMKM? Berapa minimum volume pengiriman?',       'Baru')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'pesan_kontak: %', SQLERRM; END $$;

-- ══════════════════════════════════════════════════════════════════════════
-- 20. SHIFTS (Jadwal Shift)
-- ══════════════════════════════════════════════════════════════════════════
DO $$ BEGIN
INSERT INTO shift_kerja (id, name, start_time, end_time, has_bonus, bonus_amount, color) VALUES
  ('shift-pagi',   'Shift Pagi',              '07:00', '15:00', FALSE,  0,      '#3b82f6'),
  ('shift-siang',  'Shift Siang',             '15:00', '23:00', TRUE,   25000,  '#f59e0b'),
  ('shift-malam',  'Shift Malam (Gudang)',     '23:00', '07:00', TRUE,   50000,  '#8b5cf6'),
  ('shift-normal', 'Jam Kerja Normal',         '08:00', '17:00', FALSE,  0,      '#10b981')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'shift_kerja: %', SQLERRM; END $$;

DO $$ BEGIN
INSERT INTO jadwal_shift (id, employee_id, shift_id, shift_date, has_bonus, bonus_amount, notes) VALUES
  ('js-01', '84019708-d3d6-43f8-817b-da2ff8052eeb', 'shift-malam',  CURRENT_DATE + 1, TRUE,  50000, 'Bongkar muat kapal jadwal malam'),
  ('js-02', 'e19a4e1b-d365-4d5a-826c-7b66aa8cca62', 'shift-siang',  CURRENT_DATE + 1, TRUE,  25000, NULL),
  ('js-03', '84019708-d3d6-43f8-817b-da2ff8052eeb', 'shift-malam',  CURRENT_DATE + 2, TRUE,  50000, NULL),
  ('js-04', 'ab2109d1-e11f-4e79-8ecf-c8dc5b87cb5a', 'shift-normal', CURRENT_DATE + 1, FALSE, 0,     NULL),
  ('js-05', 'ccb5862d-21dc-4d07-8da0-dd411bb3d97e', 'shift-normal', CURRENT_DATE + 1, FALSE, 0,     NULL)
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'jadwal_shift: %', SQLERRM; END $$;

-- ══════════════════════════════════════════════════════════════════════════
-- 21. CAREER DEVELOPMENT (IDP / Rencana Pengembangan)
-- ══════════════════════════════════════════════════════════════════════════
DO $$ BEGIN
INSERT INTO rencana_pengembangan (id, employee_id, goals, trainings, timeline, mentor, progress, status, jenis_aksi) VALUES
  ('idp-01', 'ccb5862d-21dc-4d07-8da0-dd411bb3d97e', 'Mendapatkan sertifikasi PPJK resmi dari Bea Cukai dan meningkatkan kompetensi kepabeanan ke level 5',     'Sertifikasi Ahli Kepabeanan, Kursus Regulasi CEISA Terbaru', '6 bulan', 'Fajar Nugroho', 30, 'Aktif', 'Sertifikasi'),
  ('idp-02', 'e19a4e1b-d365-4d5a-826c-7b66aa8cca62', 'Mengembangkan kemampuan kepemimpinan untuk mempersiapkan diri ke posisi Manager Armada',                   'Workshop Kepemimpinan Level Supervisor, Coaching Manajemen', '12 bulan','9f388845-acbf-4178-8ef3-c4e5ac4511ac', 50, 'Aktif', 'Coaching'),
  ('idp-03', '84019708-d3d6-43f8-817b-da2ff8052eeb', 'Meningkatkan kemampuan manajemen gudang modern dan sertifikasi warehouse management',                       'Pelatihan WMS (Warehouse Management System), Sertifikasi Logistik', '9 bulan', 'Fajar Nugroho', 20, 'Aktif', 'Training'),
  ('idp-04', 'f132413c-0c1d-4de9-ac53-21b0bcbe57d4', 'Meningkatkan kemampuan negosiasi dan komunikasi klien internasional untuk mendukung ekspansi bisnis',        'Training Negosiasi Klien Internasional, Kursus Bahasa Inggris Bisnis', '6 bulan', '9f388845-acbf-4178-8ef3-c4e5ac4511ac', 10, 'Aktif', 'Training'),
  ('idp-05', 'e1a0ca47-173f-4c93-a2bb-678e68a2fa61', 'Memperdalam pemahaman sistem HRIS dan HR analytics untuk mendukung digitalisasi HR',                         'Pelatihan HRIS Lanjutan, Kursus HR Analytics dengan Power BI', '6 bulan', '11bf125b-b66a-44ea-9a30-73ed9524e7bc', 60, 'Aktif', 'Training'),
  ('idp-06', '533fb02e-c137-444e-94b5-a0f7ea88058c', 'Mempersiapkan diri untuk sertifikasi CPA/ACCA dan meningkatkan kompetensi laporan keuangan konsolidasi',     'Kursus ACCA Preparatory, Workshop Laporan Keuangan Konsolidasi', '18 bulan', '9f388845-acbf-4178-8ef3-c4e5ac4511ac', 15, 'Aktif', 'Sertifikasi')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'rencana_pengembangan: %', SQLERRM; END $$;

-- ══════════════════════════════════════════════════════════════════════════
-- 22. CAREER REQUESTS (Permintaan Karir dari Karyawan)
-- ══════════════════════════════════════════════════════════════════════════
DO $$ BEGIN
INSERT INTO permintaan_karir (id, employee_email, employee_name, type, job_title, job_department, status, created_at) VALUES
  ('pkr-01', 'dewi.lestari@ptpgp.co.id',   'Dewi Lestari',   'consultation', NULL, NULL, 'Pending',  NOW() - INTERVAL '3 days'),
  ('pkr-02', 'maya.kusuma@ptpgp.co.id',    'Maya Kusuma',    'application',  'Customer Service Senior', 'Operational Division', 'Reviewed', NOW() - INTERVAL '15 days'),
  ('pkr-03', 'hendra.saputra@ptpgp.co.id', 'Hendra Saputra', 'consultation', NULL, NULL, 'Completed', NOW() - INTERVAL '30 days'),
  ('pkr-04', 'siti.rahayu@ptpgp.co.id',    'Siti Rahayu',    'application',  'HR & GA Supervisor', 'HR & GA', 'Pending', NOW() - INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'permintaan_karir: %', SQLERRM; END $$;

DO $$ BEGIN
INSERT INTO mutasi_karir (id, employee_id, from_department, to_department, effective_date, reason, status, requested_by, created_at) VALUES
  ('mut-01', 'e1a0ca47-173f-4c93-a2bb-678e68a2fa61', 'HR & GA', 'Finance', '2026-09-01', 'Pengembangan lintas fungsi untuk memperluas pemahaman bisnis', 'Menunggu', 'hrd@ptpgp.co.id', NOW() - INTERVAL '5 days'),
  ('mut-02', 'ab2109d1-e11f-4e79-8ecf-c8dc5b87cb5a', 'Operational Division', 'HR & GA', '2026-08-01', 'Rotasi internal sesuai rencana talent development', 'Ditolak', 'hrd@ptpgp.co.id', NOW() - INTERVAL '20 days')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'mutasi_karir: %', SQLERRM; END $$;

DO $$ BEGIN
INSERT INTO promosi_karir (id, employee_id, from_position, to_position, effective_date, reason, criteria, status, requested_by, created_at) VALUES
  ('prm-01', 'e19a4e1b-d365-4d5a-826c-7b66aa8cca62', 'Koordinator Armada & Trucking', 'Manager Armada & Trucking', '2026-09-01', 'Hasil Talent Review 2026-H1 sangat baik, skor karir 87.2', 'KPI > 85, skor kepemimpinan > 80, masa kerja > 2 tahun', 'Disetujui', 'fajar.nugroho@ptpgp.co.id', NOW() - INTERVAL '25 days'),
  ('prm-02', '84019708-d3d6-43f8-817b-da2ff8052eeb', 'Supervisor Gudang & Cargo', 'Manager Gudang & Cargo',   '2026-10-01', 'Kinerja konsisten, throughput gudang meningkat 18%',         'KPI > 80, lulus asesmen kepemimpinan', 'Menunggu', 'fajar.nugroho@ptpgp.co.id', NOW() - INTERVAL '5 days')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'promosi_karir: %', SQLERRM; END $$;

-- ══════════════════════════════════════════════════════════════════════════
-- 23. SUCCESSION PLANNING
-- ══════════════════════════════════════════════════════════════════════════
DO $$ BEGIN
INSERT INTO posisi_kritis (id, employee_id, risk_level, vacancy_risk_date, marked_by) VALUES
  ('scp-01', '9f388845-acbf-4178-8ef3-c4e5ac4511ac', 'Tinggi',  CURRENT_DATE + 180, 'Budi Santoso'),
  ('scp-02', '11bf125b-b66a-44ea-9a30-73ed9524e7bc', 'Sedang',  CURRENT_DATE + 365, 'Budi Santoso'),
  ('scp-03', 'ab2109d1-e11f-4e79-8ecf-c8dc5b87cb5a', 'Tinggi',  CURRENT_DATE + 30,  'Budi Santoso')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'posisi_kritis: %', SQLERRM; END $$;

DO $$ BEGIN
INSERT INTO penilaian_kesiapan_suksesi (id, employee_id, year, kepemimpinan, keahlian_teknis, pengalaman, kinerja, potensi, total_score, assessed_by) VALUES
  ('pks-01', 'e19a4e1b-d365-4d5a-826c-7b66aa8cca62', 2026, 88, 85, 90, 91, 90, 89, 'Fajar Nugroho'),
  ('pks-02', '84019708-d3d6-43f8-817b-da2ff8052eeb', 2026, 75, 82, 80, 83, 78, 80, 'Fajar Nugroho'),
  ('pks-03', '11bf125b-b66a-44ea-9a30-73ed9524e7bc', 2026, 80, 78, 85, 85, 80, 82, 'Budi Santoso'),
  ('pks-04', '533fb02e-c137-444e-94b5-a0f7ea88058c', 2026, 70, 87, 75, 87, 82, 80, 'Fajar Nugroho')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'penilaian_kesiapan_suksesi: %', SQLERRM; END $$;

DO $$ BEGIN
INSERT INTO kandidat_suksesor (id, employee_id, target_position_employee_id, readiness_override, notes, added_by) VALUES
  ('ks-01', 'e19a4e1b-d365-4d5a-826c-7b66aa8cca62', '9f388845-acbf-4178-8ef3-c4e5ac4511ac', 89, 'Kandidat utama pengganti Operational Manager, siap dalam 6-12 bulan', 'Budi Santoso'),
  ('ks-02', '84019708-d3d6-43f8-817b-da2ff8052eeb', '9f388845-acbf-4178-8ef3-c4e5ac4511ac', 65, 'Kandidat cadangan, butuh 1-2 tahun pengembangan lagi', 'Budi Santoso'),
  ('ks-03', 'e1a0ca47-173f-4c93-a2bb-678e68a2fa61', '11bf125b-b66a-44ea-9a30-73ed9524e7bc', 55, 'Kandidat jangka panjang untuk HR Supervisor', 'Budi Santoso')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'kandidat_suksesor: %', SQLERRM; END $$;

DO $$ BEGIN
INSERT INTO pool_suksesi (id, employee_id, potential_rating, notes, added_by) VALUES
  ('ps-01', 'e19a4e1b-d365-4d5a-826c-7b66aa8cca62', 'Bintang',         'Talent unggulan operasional, calon Manager Armada', 'Budi Santoso'),
  ('ps-02', '84019708-d3d6-43f8-817b-da2ff8052eeb', 'Potensial Tinggi','Berkembang cepat, siap tanggung jawab lebih besar',  'Budi Santoso'),
  ('ps-03', 'ccb5862d-21dc-4d07-8da0-dd411bb3d97e', 'Solid',           'Kontributor stabil, cocok jalur teknis kepabeanan',  'Budi Santoso'),
  ('ps-04', '533fb02e-c137-444e-94b5-a0f7ea88058c', 'Potensial Tinggi','Kandidat potensial jalur Finance leadership',        'Budi Santoso')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'pool_suksesi: %', SQLERRM; END $$;

-- ══════════════════════════════════════════════════════════════════════════
-- 24. GUIDES / PANDUAN BANTUAN
-- ══════════════════════════════════════════════════════════════════════════
DO $$ BEGIN
INSERT INTO panduan_bantuan (id, role, category, title, content, order_index) VALUES
  ('guide-01', 'employee', 'Absensi',       'Cara Melakukan Check-In',              'Buka menu Absensi di sidebar. Klik tombol "Check-In". Izinkan akses lokasi. Sistem akan memverifikasi posisi Anda dalam area geofence kantor. Foto wajah opsional untuk keamanan tambahan.', 1),
  ('guide-02', 'employee', 'Cuti',          'Cara Mengajukan Cuti',                 'Buka menu Cuti di sidebar. Klik "Ajukan Cuti". Pilih jenis cuti, tanggal mulai dan selesai, isi alasan. Klik Submit. Cuti akan masuk ke antrian persetujuan atasan dan HRD.', 1),
  ('guide-03', 'employee', 'Payslip',       'Cara Melihat Slip Gaji',               'Buka menu Payroll > Slip Gaji. Pilih bulan dan tahun yang ingin dilihat. Klik tombol download untuk mengunduh dalam format PDF.', 1),
  ('guide-04', 'employee', 'Profil',        'Cara Update Data Pribadi',             'Buka menu Profil. Klik tab Data Pribadi. Isi atau update field yang dibutuhkan. Klik Simpan. Perubahan akan diverifikasi oleh HR sebelum resmi.', 2),
  ('guide-05', 'hrd',      'Absensi',       'Cara Approve Koreksi Absensi',         'Buka menu Workforce Time > Koreksi Absensi. Lihat daftar pengajuan koreksi yang masuk. Klik Approve atau Tolak sesuai validasi. Karyawan akan mendapat notifikasi hasil.', 1),
  ('guide-06', 'hrd',      'Rekrutmen',     'Cara Memindahkan Kandidat di Pipeline', 'Buka menu Rekrutmen > Pipeline Kandidat. Pilih kandidat yang ingin dimajukan. Klik tombol status berikutnya (Tes, Interview, dll). Kandidat otomatis mendapat notifikasi email.', 1),
  ('guide-07', 'hrd',      'Payroll',       'Cara Memproses Penggajian Bulanan',    'Buka menu Rewards > Penggajian. Klik "Generate Slip Gaji" untuk bulan berjalan. Review kalkulasi otomatis. Klik "Finalisasi & Kirim" untuk mengirim slip ke semua karyawan.', 1),
  ('guide-08', 'department_manager', 'Approval', 'Cara Approve Cuti Karyawan',      'Notifikasi pengajuan cuti masuk via email dan dashboard. Buka menu Leaves di sidebar. Review pengajuan. Klik Approve atau Tolak. Karyawan mendapat notifikasi langsung.', 1),
  ('guide-09', 'director', 'Requests',      'Cara Review Permintaan SDM',           'Buka menu Requests. Lihat daftar permintaan yang sudah melalui approval Department Head, HR, dan Finance. Review detail kebutuhan dan budget. Klik Approve atau Tolak dengan catatan.', 1)
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'panduan_bantuan: %', SQLERRM; END $$;

-- ══════════════════════════════════════════════════════════════════════════
-- 25. SURVEI RESPONSES (Jawaban Survei Karyawan)
-- ══════════════════════════════════════════════════════════════════════════
DO $$ BEGIN
INSERT INTO jawaban_survei (id, survey_id, employee_id, responses, submitted_at) VALUES
  ('js-resp-01', 'surv-01', 'ccb5862d-21dc-4d07-8da0-dd411bb3d97e', '{"s1": 4, "s2": 4, "s3": 5}', NOW() - INTERVAL '5 days'),
  ('js-resp-02', 'surv-01', 'e19a4e1b-d365-4d5a-826c-7b66aa8cca62', '{"s1": 5, "s2": 5, "s3": 5}', NOW() - INTERVAL '4 days'),
  ('js-resp-03', 'surv-01', '84019708-d3d6-43f8-817b-da2ff8052eeb', '{"s1": 3, "s2": 4, "s3": 4}', NOW() - INTERVAL '4 days'),
  ('js-resp-04', 'surv-01', 'f132413c-0c1d-4de9-ac53-21b0bcbe57d4', '{"s1": 3, "s2": 3, "s3": 3}', NOW() - INTERVAL '3 days'),
  ('js-resp-05', 'surv-02', '217ac2be-f6bc-4481-bdb6-db3d68a26083', '{"k1": 5, "k2": 5}',            NOW() - INTERVAL '2 days'),
  ('js-resp-06', 'surv-02', '84019708-d3d6-43f8-817b-da2ff8052eeb', '{"k1": 4, "k2": 4}',            NOW() - INTERVAL '2 days')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'jawaban_survei: %', SQLERRM; END $$;

-- ══════════════════════════════════════════════════════════════════════════
-- 26. EMPLOYEE RELATIONS — Separasi & Communication
-- ══════════════════════════════════════════════════════════════════════════
DO $$ BEGIN
INSERT INTO communications (id, comm_type, title, content, target_audience, published_by, status, published_at) VALUES
  ('comm-01', 'Announcement',        'Libur Nasional Hari Kemerdekaan RI 17 Agustus 2026',  'Diberitahukan kepada seluruh karyawan bahwa tanggal 17 Agustus 2026 adalah hari libur nasional. Seluruh operasional kantor dan gudang diliburkan.', 'All Employees', 'hrd@ptpgp.co.id', 'Published', NOW() - INTERVAL '20 days'),
  ('comm-02', 'Circular',            'Penyesuaian Jam Kerja Selama Bulan Puasa',             'Selama bulan Ramadhan, jam kerja disesuaikan menjadi 08:00–15:30 WIB. Istirahat 12:00–12:30 WIB tetap berlaku. Karyawan yang beragama Islam diperbolehkan sholat Jumat.', 'All Employees', 'hrd@ptpgp.co.id', 'Published', NOW() - INTERVAL '60 days'),
  ('comm-03', 'Memo',                'Update SOP Kepabeanan — Wajib Dibaca',                'SOP Kepabeanan versi 3.0 berlaku efektif 1 Agustus 2026. Seluruh staf PPJK dan dokumentasi wajib membaca dan memahami perubahan terkait CEISA 4.0.', 'Operational Division', 'fajar.nugroho@ptpgp.co.id', 'Published', NOW() - INTERVAL '10 days'),
  ('comm-04', 'News',                'PGP Raih Penghargaan Best Forwarder Award 2026',       'PT Pratama Galuh Perkasa berhasil meraih penghargaan Best Freight Forwarder Award 2026 kategori SME dari Asosiasi Logistik Indonesia. Terima kasih atas kerja keras seluruh tim!', 'All Employees', 'hrd@ptpgp.co.id', 'Published', NOW() - INTERVAL '7 days'),
  ('comm-05', 'Emergency',           'Prosedur Evakuasi Darurat — Simulasi 5 Agustus 2026',  'Akan diadakan simulasi evakuasi darurat pada Selasa 5 Agustus 2026 pukul 10:00. Seluruh karyawan wajib mengikuti. Instruksi akan diberikan oleh HSE Officer.', 'All Employees', 'yudi.firmansyah@ptpgp.co.id', 'Published', NOW() - INTERVAL '3 days'),
  ('comm-06', 'Policy Distribution', 'Distribusi Kebijakan K3 Terbaru 2026',                 'Kebijakan K3 versi terbaru telah diterbitkan dan wajib diketahui seluruh karyawan. Dokumen tersedia di Knowledge Management > Kebijakan Perusahaan.', 'All Employees', 'hrd@ptpgp.co.id', 'Published', NOW() - INTERVAL '15 days')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'communications: %', SQLERRM; END $$;

DO $$ BEGIN
INSERT INTO industrial_compliance_items (id, regulation_name, compliance_status, due_date, notes) VALUES
  ('ic-01', 'Wajib Lapor Ketenagakerjaan (WLTK)',       'Compliant',  '2026-12-31', 'Laporan tahunan sudah diserahkan ke Disnaker Kota Jakarta Utara pada bulan Januari 2026'),
  ('ic-02', 'Pendaftaran Peraturan Perusahaan',          'Compliant',  '2028-01-01', 'PP-2026 terdaftar dan berlaku s/d 2028, tidak ada perubahan signifikan'),
  ('ic-03', 'Kepatuhan BPJS Ketenagakerjaan',            'Compliant',  '2026-12-31', 'Seluruh 10 karyawan tetap terdaftar, iuran rutin dibayarkan'),
  ('ic-04', 'Kepatuhan BPJS Kesehatan',                  'Compliant',  '2026-12-31', 'Terdaftar di BPJS Kesehatan, tidak ada tunggakan'),
  ('ic-05', 'Audit K3 dan Lingkungan Hidup',             'At Risk',    '2026-09-30', 'Jadwal audit K3 tahunan belum dikonfirmasi, perlu follow-up dengan KEMNAKER'),
  ('ic-06', 'Perpanjangan Izin Usaha dan SIUP',          'Compliant',  '2027-03-15', 'SIUP dan NIB diperpanjang, berlaku s/d Maret 2027')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'industrial_compliance_items: %', SQLERRM; END $$;

DO $$ BEGIN
INSERT INTO industrial_meetings (id, meeting_type, title, agenda, participants, outcome, meeting_date, status) VALUES
  ('im-01', 'Bipartite',        'Rapat Bipartit Q2 2026',                     'Evaluasi kepuasan karyawan, tunjangan, dan fasilitas kerja', 'Manajemen & Perwakilan Karyawan', 'Disepakati peninjauan tunjangan transportasi dan perbaikan AC gudang', '2026-06-15', 'Completed'),
  ('im-02', 'Dispute',          'Penyelesaian Sengketa Lembur Gudang',         'Pembahasan keluhan perhitungan lembur staf gudang bulan Mei', 'HR & GA, Supervisor Gudang',      NULL, CURRENT_DATE + 7, 'Scheduled'),
  ('im-03', 'Tripartite',       'Koordinasi Rutin dengan Disnaker Jakarta Utara','Pelaporan kondisi ketenagakerjaan dan isu yang perlu diselesaikan', 'Manajemen, Disnaker, Perwakilan Karyawan', 'Tidak ada isu signifikan, perusahaan dinilai patuh', '2026-04-20', 'Completed'),
  ('im-04', 'PHI Documentation','Dokumentasi Kasus Kontrak Berakhir',          'Pencatatan dokumen untuk karyawan kontrak yang masa kerjanya berakhir', 'HR & GA, Legal', 'Dokumen lengkap, proses sesuai regulasi', '2026-03-30', 'Completed')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'industrial_meetings: %', SQLERRM; END $$;

-- ══════════════════════════════════════════════════════════════════════════
-- 27. REWARD ENGINE (Formula, Aturan, Merit Matrix, Budget)
-- ══════════════════════════════════════════════════════════════════════════
DO $$ BEGIN
INSERT INTO aturan_reward (id, nama, min_kpi_score, min_attendance_pct, no_active_warning, reward_type, calc_method, calc_value, aktif) VALUES
  ('ar-01', 'Bonus Kinerja Standar (KPI ≥ 85)',        85, 95, TRUE,  'bonus',     'percent_basic', 10, TRUE),
  ('ar-02', 'Bonus Kinerja Tinggi (KPI ≥ 90)',         90, 97, TRUE,  'bonus',     'percent_basic', 15, TRUE),
  ('ar-03', 'Insentif Kehadiran Sempurna',              70, 100, TRUE, 'incentive', 'fixed',         500000, TRUE),
  ('ar-04', 'Bonus Tahunan Karyawan Tetap',             75, 90, FALSE, 'bonus',     'fixed',         3000000, TRUE)
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'aturan_reward: %', SQLERRM; END $$;

DO $$ BEGIN
INSERT INTO merit_matrix (id, performance_min, performance_max, grade_id, merit_pct) VALUES
  ('mm-01', 90, 100,    NULL, 12),
  ('mm-02', 80, 89.99,  NULL, 8),
  ('mm-03', 70, 79.99,  NULL, 4),
  ('mm-04', 60, 69.99,  NULL, 2),
  ('mm-05', 0,  59.99,  NULL, 0)
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'merit_matrix: %', SQLERRM; END $$;

DO $$ BEGIN
INSERT INTO reward_budget (id, department, period, budget_amount) VALUES
  ('rb-01', 'Operational Division', '07/2026', 35000000),
  ('rb-02', 'HR & GA',              '07/2026', 12000000),
  ('rb-03', 'Finance',              '07/2026', 10000000),
  ('rb-04', 'HSE',                  '07/2026',  8000000),
  ('rb-05', 'Operational Division', '06/2026', 35000000),
  ('rb-06', 'HR & GA',              '06/2026', 12000000)
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'reward_budget: %', SQLERRM; END $$;

-- ══════════════════════════════════════════════════════════════════════════
-- 28. RECRUITMENT — Lowongan Kerja aktif & Tes Template
-- ══════════════════════════════════════════════════════════════════════════
DO $$ BEGIN
INSERT INTO lowongan_kerja (id, position, department, title, description, quantity, quantity_filled, education, experience, location, status) VALUES
  ('lok-01', 'Staff PPJK (Kepabeanan)',          'Operational Division', 'Staff PPJK (Kepabeanan)',          'Mengurus dokumen kepabeanan ekspor-impor, PIB/PEB, dan koordinasi dengan Bea Cukai melalui sistem CEISA.', 2, 0, 'D3/S1 Kepabeanan/Logistik', 'Min. 1 tahun', 'Tanjung Priok, Jakarta Utara', 'Open'),
  ('lok-02', 'Sopir Armada Truck (SIM B2)',       'Operational Division', 'Sopir Armada Truck',               'Mengemudikan armada truck pengiriman cargo rute Jabodetabek dan antar pulau. Wajib SIM B2 Umum aktif.', 1, 0, 'SMA/SMK', 'Min. 2 tahun', 'Tanjung Priok, Jakarta Utara', 'Open'),
  ('lok-03', 'Finance & Accounting Staff',        'Finance',              'Finance & Accounting Staff',       'Membuat laporan keuangan, rekonsiliasi, dan pengelolaan anggaran perusahaan.', 1, 0, 'S1 Akuntansi/Keuangan', 'Min. 1 tahun', 'Jakarta Utara', 'Open'),
  ('lok-04', 'Customer Service Ekspor-Impor',     'Operational Division', 'Customer Service Ekspor-Impor',   'Melayani klien forwarding, membuat quotation, dan memantau status pengiriman.', 1, 0, 'D3/S1', 'Min. 1 tahun', 'Tanjung Priok, Jakarta Utara', 'Draft')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'lowongan_kerja: %', SQLERRM; END $$;

-- ══════════════════════════════════════════════════════════════════════════
-- 29. WORKFORCE REQUESTS (SDM) — Riwayat & History
-- ══════════════════════════════════════════════════════════════════════════
DO $$ BEGIN
INSERT INTO riwayat_permintaan_sdm (id, request_id, action, actor_name, actor_role, to_status) VALUES
  ('wrh-01', 'rsdm-01', 'Diajukan ke Dept Head', 'Fajar Nugroho',     'department_manager', 'Menunggu Dept Head'),
  ('wrh-02', 'rsdm-01', 'Disetujui Dept Head',   'Fajar Nugroho',     'department_manager', 'Menunggu HRD'),
  ('wrh-03', 'rsdm-01', 'Disetujui HRD',         'Budi Santoso',      'hrd',                'Menunggu Finance'),
  ('wrh-04', 'rsdm-01', 'Disetujui Finance',      'Manager Finance',  'department_manager', 'Menunggu Direktur'),
  ('wrh-05', 'rsdm-01', 'Disetujui Direktur',     'Ade Fajar Nurcahman','director',          'Disetujui'),
  ('wrh-06', 'rsdm-02', 'Diajukan ke Dept Head', 'Fajar Nugroho',     'department_manager', 'Pending')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'riwayat_permintaan_sdm: %', SQLERRM; END $$;

-- ══════════════════════════════════════════════════════════════════════════
-- 30. USULAN DEPARTEMEN & DEPARTEMEN (untuk Director/Workplace)
-- ══════════════════════════════════════════════════════════════════════════
DO $$ BEGIN
INSERT INTO usulan_departemen (id, code, name, parent_code, requested_by, status) VALUES
  ('usdep-01', '1.5',   'Digital & IT Support',     '1', 'hrd@ptpgp.co.id',              'Pending'),
  ('usdep-02', '1.1.4', 'Customs Advisory',         '1.1', 'fajar.nugroho@ptpgp.co.id',  'Pending'),
  ('usdep-03', '1.2.2', 'Talent Acquisition',       '1.2', 'hrd@ptpgp.co.id',            'Disetujui')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'usulan_departemen: %', SQLERRM; END $$;

-- ══════════════════════════════════════════════════════════════════════════
-- SELESAI — summary notice
-- ══════════════════════════════════════════════════════════════════════════
DO $$ BEGIN
  RAISE NOTICE '=== SEED 20260809001 SELESAI ===';
  RAISE NOTICE 'Covered modules:';
  RAISE NOTICE '  Infrastructure: kendaraan, lokasi_kerja, sim_sertifikasi_karyawan';
  RAISE NOTICE '  Vehicle Requests: pengadaan_kendaraan';
  RAISE NOTICE '  Business Trips: perjalanan_dinas';
  RAISE NOTICE '  Driver Trips: trip_supir';
  RAISE NOTICE '  Incidents: laporan_insiden';
  RAISE NOTICE '  Knowledge Mgmt: kebijakan_perusahaan, artikel_pengetahuan, dokumen_sop, video_pelatihan';
  RAISE NOTICE '  Performance: kpi_metrics, evaluasi_kpi, okr, umpan_balik_kinerja';
  RAISE NOTICE '  Rewards: struktur_gaji, penggajian, penghargaan_karyawan, insentif, aturan_reward, merit_matrix, reward_budget';
  RAISE NOTICE '  Employee Relations: surat_peringatan, keluhan, pengunduran_diri, survei_karyawan, jawaban_survei';
  RAISE NOTICE '  Learning: pelatihan, peserta_pelatihan, sertifikat_pelatihan, roi_pelatihan, permintaan_pelatihan';
  RAISE NOTICE '  Competency: master_kompetensi, kompetensi_karyawan';
  RAISE NOTICE '  Workforce Requests: permintaan_sdm, manpower_approval_steps, riwayat_permintaan_sdm';
  RAISE NOTICE '  Job Desc/Spec: deskripsi_kerja, spesifikasi_kerja';
  RAISE NOTICE '  Attendance: absensi, pengajuan_cuti, saldo_cuti, lembur, koreksi_absensi, catatan_aktivitas_harian, penugasan_kerja';
  RAISE NOTICE '  Employee 360: data_pribadi_karyawan, keluarga_karyawan, pendidikan_karyawan, aset_karyawan, dokumen_karyawan, catatan_karyawan, pengalaman_proyek_karyawan';
  RAISE NOTICE '  Admin: notifikasi, log_audit, pengaturan_sistem';
  RAISE NOTICE '  E-Procurement: vendor, pesan_kontak';
  RAISE NOTICE '  Shifts: shift_kerja, jadwal_shift';
  RAISE NOTICE '  Career Dev: rencana_pengembangan, permintaan_karir, mutasi_karir, promosi_karir';
  RAISE NOTICE '  Succession: posisi_kritis, penilaian_kesiapan_suksesi, kandidat_suksesor, pool_suksesi';
  RAISE NOTICE '  Guides: panduan_bantuan';
  RAISE NOTICE '  Employee Relations: communications, industrial_compliance_items, industrial_meetings';
  RAISE NOTICE '  Recruitment: lowongan_kerja';
END $$;

-- ══════════════════════════════════════════════════════════════════════════
-- 31. SK ORGANISASI (Struktur Organisasi Versi / Surat Keputusan)
-- ══════════════════════════════════════════════════════════════════════════
DO $$ BEGIN
INSERT INTO struktur_organisasi_versi (id, nama, nomor_sk, tanggal_sk, tanggal_berlaku, versi, status, keterangan, created_by, approved_by, approved_at) VALUES
  ('sk-01', 'Struktur Organisasi PT PGP 2026',        'SK-DIR/001/I/2026',  '2026-01-10', '2026-01-15', 'V2.0', 'Approved', 'Struktur organisasi aktif tahun 2026 pasca restrukturisasi divisi operasional', 'hrd@ptpgp.co.id', 'director@ptpgp.co.id', '2026-01-14 10:00:00+07'),
  ('sk-02', 'Revisi Struktur Divisi Operasional Q2',  'SK-DIR/002/IV/2026', '2026-04-01', '2026-05-01', 'V2.1', 'Review',   'Penambahan sub-divisi Customs Advisory dan pemisahan fungsi armada dan gudang', 'hrd@ptpgp.co.id', NULL, NULL),
  ('sk-03', 'Draft Struktur Organisasi 2027',         'SK-DIR/DRAFT/2027',  '2026-07-01', '2027-01-01', 'V3.0', 'Draft',    'Persiapan struktur organisasi untuk tahun 2027 termasuk divisi Digital & IT', 'hrd@ptpgp.co.id', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'struktur_organisasi_versi: %', SQLERRM; END $$;

-- ══════════════════════════════════════════════════════════════════════════
-- 32. DOKUMEN PERUSAHAAN (Infrastructure > Documents & Employee > Documents)
-- ══════════════════════════════════════════════════════════════════════════
DO $$ BEGIN
INSERT INTO dokumen_perusahaan (id, title, category, status, visible_to_employee, visible_to_department_head) VALUES
  ('dok-01', 'Handbook Karyawan PT Pratama Galuh Perkasa 2026',     'Panduan',    'Published', TRUE,  TRUE),
  ('dok-02', 'Peraturan Perusahaan (PP) 2026–2028',                  'Regulasi',   'Published', TRUE,  TRUE),
  ('dok-03', 'Kebijakan Keselamatan dan Kesehatan Kerja (K3)',        'Kebijakan',  'Published', TRUE,  TRUE),
  ('dok-04', 'Prosedur Klaim BPJS Kesehatan dan Ketenagakerjaan',    'Panduan',    'Published', TRUE,  FALSE),
  ('dok-05', 'Struktur Organisasi PT PGP 2026 (SK-DIR/001/I/2026)',  'Organisasi', 'Published', FALSE, TRUE),
  ('dok-06', 'Panduan Penggunaan Sistem HRIS untuk Karyawan',        'Panduan',    'Published', TRUE,  TRUE),
  ('dok-07', 'Formulir Pengajuan Reimbursement Biaya Operasional',   'Formulir',   'Published', TRUE,  FALSE),
  ('dok-08', 'SLA Pelayanan Internal HR',                            'Kebijakan',  'Published', FALSE, TRUE)
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'dokumen_perusahaan: %', SQLERRM; END $$;

-- ══════════════════════════════════════════════════════════════════════════
-- 33. CAREER PATH MASTER (jalur_jabatan — directed graph antar jabatan)
-- Requires jabatan IDs from 20260723001_org_hierarchy_full.sql
-- ══════════════════════════════════════════════════════════════════════════
DO $$ BEGIN
INSERT INTO jalur_jabatan (id, jabatan_dari_id, jabatan_ke_id, keterangan) VALUES
  ('jalur-01', 'demo-jab-ppjk',    'demo-jab-hrspv',     'Jalur lintas fungsi: PPJK ke Supervisi HR setelah memenuhi kriteria kepemimpinan'),
  ('jalur-02', 'demo-jab-armada',  'demo-jab-mgr-armada','Jalur promosi utama: Koordinator Armada ke Manager Armada & Trucking'),
  ('jalur-03', 'demo-jab-gudang',  'demo-jab-mgr-gudang','Jalur promosi utama: Supervisor Gudang ke Manager Gudang & Cargo'),
  ('jalur-04', 'demo-jab-hrstaff', 'demo-jab-hrspv',     'Jalur promosi standar: HR Staff ke HR Supervisor setelah min. 3 tahun'),
  ('jalur-05', 'demo-jab-hrspv',   'demo-jab-mgr-hr',    'Jalur promosi: HR Supervisor ke Manager HR & GA'),
  ('jalur-06', 'demo-jab-dok',     'demo-jab-ppjk',      'Jalur lateral: Staff Dokumentasi ke Staff PPJK setelah sertifikasi')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'jalur_jabatan: %', SQLERRM; END $$;

-- ══════════════════════════════════════════════════════════════════════════
-- 34. GRADE JABATAN (diperlukan oleh Workplace > Grades & salary review)
-- ══════════════════════════════════════════════════════════════════════════
DO $$ BEGIN
INSERT INTO grade_jabatan (id, kode, nama, urutan, salary_min, salary_max, keterangan) VALUES
  ('grade-g01', 'G01', 'Grade 1 — Entry Level',      1,  4000000,  6000000, 'Karyawan baru / magang / junior'),
  ('grade-g02', 'G02', 'Grade 2 — Junior Staff',     2,  5500000,  7500000, 'Staff dengan pengalaman < 2 tahun'),
  ('grade-g03', 'G03', 'Grade 3 — Staff',            3,  7000000,  9500000, 'Staff reguler, pengalaman 2-4 tahun'),
  ('grade-g04', 'G04', 'Grade 4 — Senior Staff',     4,  8500000, 12000000, 'Senior staff / spesialis, pengalaman > 4 tahun'),
  ('grade-g05', 'G05', 'Grade 5 — Supervisor',       5, 10000000, 14000000, 'Level supervisor dan team lead'),
  ('grade-g06', 'G06', 'Grade 6 — Assistant Manager',6, 13000000, 18000000, 'Assistant manager dan koordinator senior'),
  ('grade-g07', 'G07', 'Grade 7 — Manager',          7, 16000000, 25000000, 'Level manajerial'),
  ('grade-g08', 'G08', 'Grade 8 — Senior Manager',   8, 22000000, 35000000, 'Senior manager dan general manager'),
  ('grade-g09', 'G09', 'Grade 9 — Director',         9, 35000000, 60000000, 'Level direktur dan C-level')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'grade_jabatan: %', SQLERRM; END $$;

-- ══════════════════════════════════════════════════════════════════════════
-- 35. SALARY REVIEW (mutasi_karir dengan review_type — tabel Rewards > Salary Review)
-- ══════════════════════════════════════════════════════════════════════════
DO $$ BEGIN
INSERT INTO mutasi_karir (id, employee_id, from_department, to_department, from_position, to_position,
  effective_date, reason, status, requested_by, review_type,
  grade_before, grade_after, salary_before, salary_after, created_at) VALUES
  ('sal-rev-01', 'e19a4e1b-d365-4d5a-826c-7b66aa8cca62',
    'Operational Division', 'Operational Division',
    'Koordinator Armada & Trucking', 'Manager Armada & Trucking',
    '2026-09-01', 'Promosi berdasarkan Talent Review 2026-H1 dan KPI di atas target',
    'Disetujui', 'hrd@ptpgp.co.id', 'salary_review',
    'grade-g05', 'grade-g07', 9500000, 16000000, NOW() - INTERVAL '10 days'),
  ('sal-rev-02', 'ccb5862d-21dc-4d07-8da0-dd411bb3d97e',
    'Operational Division', 'Operational Division',
    'Staff PPJK (Kepabeanan)', 'Staff PPJK (Kepabeanan)',
    '2026-07-01', 'Kenaikan gaji berkala — 2 tahun masa kerja, zero reject dokumen 6 bulan',
    'Disetujui', 'hrd@ptpgp.co.id', 'salary_review',
    'grade-g03', 'grade-g04', 8500000, 9500000, NOW() - INTERVAL '20 days'),
  ('sal-rev-03', '84019708-d3d6-43f8-817b-da2ff8052eeb',
    'Operational Division', 'Operational Division',
    'Supervisor Gudang & Cargo', 'Supervisor Gudang & Cargo',
    '2026-08-01', 'Kenaikan berkala dan pencapaian efisiensi gudang +18%',
    'Menunggu', 'hrd@ptpgp.co.id', 'salary_review',
    'grade-g05', 'grade-g06', 11000000, 13000000, NOW() - INTERVAL '3 days')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'mutasi_karir salary_review: %', SQLERRM; END $$;

-- ══════════════════════════════════════════════════════════════════════════
-- 36. WORKFORCE HEADCOUNT & VACANCY (data untuk dashboard headcount)
-- ══════════════════════════════════════════════════════════════════════════
DO $$ BEGIN
-- Pastikan proyeksi_departemen punya data untuk Dashboard Analytics
INSERT INTO proyeksi_departemen (id, department, year, headcount_current, headcount_target, notes) VALUES
  ('pyd-01', 'Operational Division', 2026, 6, 9,  'Target penambahan 3 staf PPJK dan Customer Service untuk ekspansi Q3-Q4'),
  ('pyd-02', 'HR & GA',              2026, 2, 3,  'Rencana penambahan 1 HR Administrator pada H2 2026'),
  ('pyd-03', 'Finance',              2026, 1, 2,  'Kebutuhan Finance Staff tambahan setelah karyawan resign'),
  ('pyd-04', 'HSE',                  2026, 1, 2,  'Target penambahan HSE Inspector pada 2026'),
  ('pyd-05', 'Procurement',          2026, 0, 1,  'Rencana buat divisi Procurement mandiri pada H2 2026')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'proyeksi_departemen: %', SQLERRM; END $$;

-- ══════════════════════════════════════════════════════════════════════════
-- 37. TALENT REVIEW & CAREER ASSESSMENTS
--     (untuk hrd/career/assessment, hrd/career/9-box, hrd/career/talent)
-- ══════════════════════════════════════════════════════════════════════════
DO $$ BEGIN
INSERT INTO talent_reviews (id, karyawan_id, period, performance_score, potential_score, classification_id, reviewer_id, notes, review_date) VALUES
  ('tv-01', 'e19a4e1b-d365-4d5a-826c-7b66aa8cca62', '2026-H1', 91, 90, 'tcl-1', '9f388845-acbf-4178-8ef3-c4e5ac4511ac', 'Performa dan potensi sangat tinggi. Siap promosi.',              '2026-06-20'),
  ('tv-02', '84019708-d3d6-43f8-817b-da2ff8052eeb', '2026-H1', 83, 78, 'tcl-3', '9f388845-acbf-4178-8ef3-c4e5ac4511ac', 'Solid performer, perlu pengembangan kepemimpinan.',              '2026-06-20'),
  ('tv-03', 'ccb5862d-21dc-4d07-8da0-dd411bb3d97e', '2026-H1', 78, 72, 'tcl-4', '9f388845-acbf-4178-8ef3-c4e5ac4511ac', 'Kontributor stabil, fokus di jalur teknis kepabeanan.',           '2026-06-20'),
  ('tv-04', '533fb02e-c137-444e-94b5-a0f7ea88058c', '2026-H1', 87, 82, 'tcl-2', '9f388845-acbf-4178-8ef3-c4e5ac4511ac', 'Emerging leader di divisi Finance, potensial tinggi.',           '2026-06-20'),
  ('tv-05', '11bf125b-b66a-44ea-9a30-73ed9524e7bc', '2026-H1', 85, 80, 'tcl-3', '9f388845-acbf-4178-8ef3-c4e5ac4511ac', 'Solid performer HR. Stabil dan konsisten.',                      '2026-06-20'),
  ('tv-06', 'e1a0ca47-173f-4c93-a2bb-678e68a2fa61', '2026-H1', 80, 76, 'tcl-4', '11bf125b-b66a-44ea-9a30-73ed9524e7bc', 'Kontributor inti HR. Perlu peningkatan inisiatif.',               '2026-06-20'),
  ('tv-07', '217ac2be-f6bc-4481-bdb6-db3d68a26083', '2026-H1', 88, 80, 'tcl-2', '9f388845-acbf-4178-8ef3-c4e5ac4511ac', 'Performa K3 luar biasa. Kandidat kuat untuk Senior HSE.',        '2026-06-20'),
  ('tv-08', 'f132413c-0c1d-4de9-ac53-21b0bcbe57d4', '2026-H1', 76, 70, 'tcl-5', '9f388845-acbf-4178-8ef3-c4e5ac4511ac', 'Perlu peningkatan. Program coaching dan PIP direkomendasikan.', '2026-06-20')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'talent_reviews: %', SQLERRM; END $$;

DO $$ BEGIN
INSERT INTO career_assessments (id, karyawan_id, period, performance_score, competency_score, skills_score, leadership_score, learning_score, attendance_score, discipline_score, innovation_score, experience_score, final_career_score, readiness_rule_id, assessment_date) VALUES
  ('ca-01', 'e19a4e1b-d365-4d5a-826c-7b66aa8cca62', '2026-H1', 91, 88, 85, 90, 82, 97, 96, 85, 92, 90.1, 'crr-2', '2026-06-25'),
  ('ca-02', '84019708-d3d6-43f8-817b-da2ff8052eeb', '2026-H1', 83, 80, 82, 75, 78, 95, 93, 72, 86, 80.6, 'crr-3', '2026-06-25'),
  ('ca-03', '533fb02e-c137-444e-94b5-a0f7ea88058c', '2026-H1', 87, 84, 86, 72, 80, 98, 97, 78, 82, 83.4, 'crr-2', '2026-06-25'),
  ('ca-04', '11bf125b-b66a-44ea-9a30-73ed9524e7bc', '2026-H1', 85, 82, 78, 80, 76, 96, 95, 74, 84, 82.1, 'crr-2', '2026-06-25'),
  ('ca-05', 'ccb5862d-21dc-4d07-8da0-dd411bb3d97e', '2026-H1', 78, 79, 80, 68, 72, 93, 90, 70, 78, 76.2, 'crr-3', '2026-06-25')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'career_assessments: %', SQLERRM; END $$;

-- ══════════════════════════════════════════════════════════════════════════
-- 38. CAREER PROFILES, TALENT POOLS, RECOMMENDATIONS
--     (untuk hrd/career/profile, talent, recommendation)
-- ══════════════════════════════════════════════════════════════════════════
DO $$ BEGIN
INSERT INTO career_profiles (id, karyawan_id, career_stream_id, career_level_id, target_jabatan_id, last_assessment_date) VALUES
  ('cp-01', 'e19a4e1b-d365-4d5a-826c-7b66aa8cca62', 'str-04', 'lvl-06', 'demo-jab-mgr-armada', '2026-06-25'),
  ('cp-02', '84019708-d3d6-43f8-817b-da2ff8052eeb', 'str-04', 'lvl-05', 'demo-jab-mgr-gudang', '2026-06-25'),
  ('cp-03', '533fb02e-c137-444e-94b5-a0f7ea88058c', 'str-02', 'lvl-04', 'demo-jab-finspv',     '2026-06-25'),
  ('cp-04', '11bf125b-b66a-44ea-9a30-73ed9524e7bc', 'str-02', 'lvl-05', 'demo-jab-mgr-hr',     '2026-06-25'),
  ('cp-05', 'ccb5862d-21dc-4d07-8da0-dd411bb3d97e', 'str-03', 'lvl-03', 'demo-jab-ppjk',       '2026-06-25'),
  ('cp-06', 'e1a0ca47-173f-4c93-a2bb-678e68a2fa61', 'str-02', 'lvl-03', 'demo-jab-hrspv',      '2026-06-25')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'career_profiles: %', SQLERRM; END $$;

DO $$ BEGIN
INSERT INTO talent_pools (id, karyawan_id, current_jabatan_id, target_jabatan_id, status, entered_at, keterangan) VALUES
  ('tpool-01', 'e19a4e1b-d365-4d5a-826c-7b66aa8cca62', 'demo-jab-armada',  'demo-jab-mgr-armada', 'Ready',       '2026-03-01', 'Kandidat utama Manager Armada, skor karir 90.1'),
  ('tpool-02', '84019708-d3d6-43f8-817b-da2ff8052eeb', 'demo-jab-gudang',  'demo-jab-mgr-gudang', 'Development', '2026-04-01', 'Perlu 6 bulan pengembangan kepemimpinan'),
  ('tpool-03', '533fb02e-c137-444e-94b5-a0f7ea88058c', 'demo-jab-finstaff','demo-jab-finspv',     'Development', '2026-05-01', 'Emerging Leader Finance, potensial tinggi')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'talent_pools: %', SQLERRM; END $$;

DO $$ BEGIN
INSERT INTO career_recommendations (id, karyawan_id, assessment_id, recommendation_type, target_jabatan_id, target_unit_id, reason, status) VALUES
  ('crec-01', 'e19a4e1b-d365-4d5a-826c-7b66aa8cca62', 'ca-01', 'Promotion',         'demo-jab-mgr-armada', 'demo-unit-ops', 'Skor karir 90.1, siap promosi dalam 3-6 bulan', 'Proposed'),
  ('crec-02', '84019708-d3d6-43f8-817b-da2ff8052eeb', 'ca-02', 'Rotation',          'demo-jab-mgr-gudang', 'demo-unit-ops', 'Perlu rotasi untuk memperluas pengalaman manajemen', 'Proposed'),
  ('crec-03', '533fb02e-c137-444e-94b5-a0f7ea88058c', 'ca-03', 'Promotion',         'demo-jab-finspv',     'demo-unit-ops', 'KPI dan kompetensi memenuhi syarat promosi ke supervisor Finance', 'Approved'),
  ('crec-04', 'f132413c-0c1d-4de9-ac53-21b0bcbe57d4', 'ca-05', 'Development Plan',  'demo-jab-cs',         'demo-unit-ops', 'Perlu program coaching 3 bulan dan target KPI perbaikan', 'Proposed')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'career_recommendations: %', SQLERRM; END $$;

-- ══════════════════════════════════════════════════════════════════════════
-- 39. CAREER TRANSACTIONS & APPROVALS
--     (untuk hrd/career/transactions, hrd/career/approval)
-- ══════════════════════════════════════════════════════════════════════════
DO $$ BEGIN
INSERT INTO career_transactions (id, karyawan_id, transaction_type, current_jabatan_id, current_unit_id, target_jabatan_id, target_unit_id, effective_date, end_date, status, reason) VALUES
  ('ctx-01', 'e19a4e1b-d365-4d5a-826c-7b66aa8cca62', 'Promotion',          'demo-jab-armada',  'demo-unit-ops', 'demo-jab-mgr-armada', 'demo-unit-ops', '2026-09-01', NULL,         'Approved',  'Promosi berdasarkan Talent Review 2026-H1 dan KPI > 90'),
  ('ctx-02', '84019708-d3d6-43f8-817b-da2ff8052eeb', 'Acting Assignment',  'demo-jab-gudang',  'demo-unit-ops', 'demo-jab-mgr-gudang', 'demo-unit-ops', '2026-07-15', '2026-10-15', 'Approved',  'Plt. Manager Gudang selama proses rekrutmen definitif'),
  ('ctx-03', '533fb02e-c137-444e-94b5-a0f7ea88058c', 'Promotion',          'demo-jab-finstaff','demo-unit-ops', 'demo-jab-finspv',     'demo-unit-ops', '2026-10-01', NULL,         'In Review', 'Promosi berdasarkan rekomendasi career assessment'),
  ('ctx-04', 'e1a0ca47-173f-4c93-a2bb-678e68a2fa61', 'Temporary Assignment','demo-jab-hrstaff', 'demo-unit-hr',  'demo-jab-hrspv',      'demo-unit-hr',  '2026-08-01', '2026-09-30', 'In Review', 'Penugasan sementara menggantikan HR Supervisor cuti panjang'),
  ('ctx-05', 'ccb5862d-21dc-4d07-8da0-dd411bb3d97e', 'Rotation',           'demo-jab-ppjk',    'demo-unit-ops', 'demo-jab-dok',        'demo-unit-ops', '2026-08-15', NULL,         'Draft',     'Rotasi lintas fungsi ke Dokumentasi Ekspor-Impor untuk pengembangan')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'career_transactions: %', SQLERRM; END $$;

DO $$ BEGIN
INSERT INTO career_approvals (id, transaction_id, step_number, approver_role, status, notes) VALUES
  ('capp-01', 'ctx-01', 1, 'Department Head', 'Approved', 'Disetujui oleh Operational Manager'),
  ('capp-02', 'ctx-01', 2, 'Career Committee', 'Approved', 'Disetujui oleh Komite Karir'),
  ('capp-03', 'ctx-02', 1, 'Department Head', 'Approved', 'Disetujui untuk penugasan sementara'),
  ('capp-04', 'ctx-02', 2, 'Career Committee', 'Approved', NULL),
  ('capp-05', 'ctx-03', 1, 'Department Head', 'Approved', 'Disetujui oleh Finance Manager'),
  ('capp-06', 'ctx-03', 2, 'Career Committee', 'Pending',  NULL),
  ('capp-07', 'ctx-04', 1, 'Department Head', 'Pending',   NULL)
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'career_approvals: %', SQLERRM; END $$;

-- ══════════════════════════════════════════════════════════════════════════
-- 40. CAREER HISTORY (untuk hrd/career/history)
-- ══════════════════════════════════════════════════════════════════════════
DO $$ BEGIN
INSERT INTO riwayat_posisi_karyawan (id, karyawan_id, jabatan_id, unit_organisasi_id, jenis_perubahan, tanggal_mulai, tanggal_selesai, created_by) VALUES
  ('rpk-01', 'e19a4e1b-d365-4d5a-826c-7b66aa8cca62', 'demo-jab-armada', 'demo-unit-ops', 'Penempatan Awal', '2024-01-10', NULL,         'hrd@ptpgp.co.id'),
  ('rpk-02', '84019708-d3d6-43f8-817b-da2ff8052eeb', 'demo-jab-gudang', 'demo-unit-ops', 'Penempatan Awal', '2024-01-10', NULL,         'hrd@ptpgp.co.id'),
  ('rpk-03', '11bf125b-b66a-44ea-9a30-73ed9524e7bc', 'demo-jab-hrspv',  'demo-unit-hr',  'Penempatan Awal', '2024-01-10', NULL,         'hrd@ptpgp.co.id'),
  ('rpk-04', 'ccb5862d-21dc-4d07-8da0-dd411bb3d97e', 'demo-jab-ppjk',   'demo-unit-ops', 'Penempatan Awal', '2024-01-10', NULL,         'hrd@ptpgp.co.id'),
  ('rpk-05', '533fb02e-c137-444e-94b5-a0f7ea88058c', 'demo-jab-finstaff','demo-unit-ops', 'Penempatan Awal', '2024-01-10', NULL,         'hrd@ptpgp.co.id')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'riwayat_posisi_karyawan: %', SQLERRM; END $$;
