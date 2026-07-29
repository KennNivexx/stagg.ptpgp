-- ============================================================================
-- SEED DATA DUMMY UNTUK SEMUA MODUL — Learning, Performance, Reward, Knowledge
-- Vehicles, Trips, Assignments, Competency
-- Copy-paste ke Supabase SQL Editor, jalankan SETELAH seed_struktur_organisasi_lengkap.sql
-- ============================================================================

-- PART 0: MIGRASI KOLOM — pastikan semua kolom ada sebelum insert
-- Setiap ALTER berdiri sendiri; IF NOT EXISTS mencegah error duplikat
ALTER TABLE pelatihan ADD COLUMN IF NOT EXISTS skill_id TEXT;
ALTER TABLE pelatihan ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE pelatihan ADD COLUMN IF NOT EXISTS method TEXT DEFAULT 'Offline';
ALTER TABLE pelatihan ADD COLUMN IF NOT EXISTS provider TEXT;
ALTER TABLE pelatihan ADD COLUMN IF NOT EXISTS instruktur TEXT;
ALTER TABLE pelatihan ADD COLUMN IF NOT EXISTS jenis_instruktur TEXT DEFAULT 'Internal';
ALTER TABLE pelatihan ADD COLUMN IF NOT EXISTS lokasi TEXT;
ALTER TABLE pelatihan ADD COLUMN IF NOT EXISTS durasi_jam NUMERIC;
ALTER TABLE evaluasi_pelatihan ADD COLUMN IF NOT EXISTS reaction_score INTEGER;
ALTER TABLE evaluasi_pelatihan ADD COLUMN IF NOT EXISTS learning_score INTEGER;
ALTER TABLE evaluasi_pelatihan ADD COLUMN IF NOT EXISTS behavior_score INTEGER;
ALTER TABLE evaluasi_pelatihan ADD COLUMN IF NOT EXISTS result_score INTEGER;
ALTER TABLE evaluasi_pelatihan ADD COLUMN IF NOT EXISTS catatan TEXT;
ALTER TABLE tna_kompetensi ADD COLUMN IF NOT EXISTS skill_id TEXT;
ALTER TABLE tna_kompetensi ADD COLUMN IF NOT EXISTS current_level INTEGER;
ALTER TABLE tna_kompetensi ADD COLUMN IF NOT EXISTS required_level INTEGER;
ALTER TABLE tna_kompetensi ADD COLUMN IF NOT EXISTS gap INTEGER;
ALTER TABLE tna_kompetensi ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Open';
ALTER TABLE penggajian ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE kompetensi_karyawan ADD COLUMN IF NOT EXISTS evidence TEXT;
ALTER TABLE kompetensi_karyawan ADD COLUMN IF NOT EXISTS assessment_type TEXT DEFAULT 'Supervisor';
ALTER TABLE trip_supir ADD COLUMN IF NOT EXISTS incentive_generated BOOLEAN DEFAULT FALSE;
ALTER TABLE artikel_pengetahuan ADD COLUMN IF NOT EXISTS skill_id TEXT;
ALTER TABLE artikel_pengetahuan ADD COLUMN IF NOT EXISTS mandatory BOOLEAN DEFAULT FALSE;
ALTER TABLE dokumen_sop ADD COLUMN IF NOT EXISTS skill_id TEXT;
ALTER TABLE dokumen_sop ADD COLUMN IF NOT EXISTS mandatory BOOLEAN DEFAULT FALSE;
ALTER TABLE kebijakan_perusahaan ADD COLUMN IF NOT EXISTS skill_id TEXT;
ALTER TABLE kebijakan_perusahaan ADD COLUMN IF NOT EXISTS mandatory BOOLEAN DEFAULT FALSE;

-- PART 1: MASTER KOMPETENSI — 12 kompetensi dengan kode_kompetensi dan kode_perusahaan
TRUNCATE TABLE master_kompetensi CASCADE;
INSERT INTO master_kompetensi (id, name, category, department, jenis_kompetensi, kode_kompetensi, kode_perusahaan, deskripsi, status) VALUES
('sk-001','Mengemudi Kendaraan Berat','Operasional','Operasional','Hard Skill','KMP-OPR-001','PGP-COMP-OPR-001','Kemampuan mengoperasikan truk trailer, dump truck, dan kendaraan berat lainnya sesuai standar keselamatan.','Aktif'),
('sk-002','Kepabeanan & PIB/PEB','Teknis','Operasional','Hard Skill','KMP-TEK-001','PGP-COMP-TEK-001','Penguasaan dokumen kepabeanan, PIB, PEB, dan regulasi ekspor-impor.','Aktif'),
('sk-003','Manajemen Gudang & Inventori','Operasional','Operasional','Hard Skill','KMP-OPR-002','PGP-COMP-OPR-002','Pengelolaan gudang, stok barang, sistem FIFO/LIFO, dan administrasi inventori.','Aktif'),
('sk-004','K3 & Keselamatan Kerja','K3','HSE','Hard Skill','KMP-K3L-001','PGP-COMP-K3L-001','Pengetahuan dan implementasi K3LH, APD, prosedur darurat, dan investigasi insiden.','Aktif'),
('sk-005','Akuntansi & Pelaporan Keuangan','Teknis','Finance / Accounting','Hard Skill','KMP-TEK-002','PGP-COMP-TEK-002','Penyusunan laporan keuangan, jurnal, neraca, laba rugi sesuai SAK.','Aktif'),
('sk-006','Procurement & Negosiasi','Teknis','SCM (Supply Chain Management)','Hard Skill','KMP-TEK-003','PGP-COMP-TEK-003','Proses pengadaan barang/jasa, evaluasi vendor, negosiasi kontrak.','Aktif'),
('sk-007','Kepemimpinan & Manajemen Tim','Manajemen',NULL,'Soft Skill','KMP-MGT-001','PGP-COMP-MGT-001','Kemampuan memimpin, memotivasi, dan mengelola tim untuk mencapai target.','Aktif'),
('sk-008','Komunikasi Efektif','Soft Skills',NULL,'Soft Skill','KMP-SFT-001','PGP-COMP-SFT-001','Kemampuan menyampaikan informasi secara jelas, lisan maupun tulisan, termasuk presentasi dan negosiasi.','Aktif'),
('sk-009','Problem Solving & Analisis','Manajemen',NULL,'Soft Skill','KMP-MGT-002','PGP-COMP-MGT-002','Kemampuan mengidentifikasi akar masalah, menganalisis data, dan mengambil keputusan tepat.','Aktif'),
('sk-010','Quality Control & Inspeksi','Teknis','Quality Control (QC)','Hard Skill','KMP-TEK-004','PGP-COMP-TEK-004','Penerapan standar mutu, inspeksi visual, pengukuran, dan dokumentasi QC.','Aktif'),
('sk-011','Microsoft Office & Administrasi','Teknis','Divisi HR & GA','Hard Skill','KMP-TEK-005','PGP-COMP-TEK-005','Penguasaan Excel, Word, PowerPoint untuk pelaporan dan administrasi kantor.','Aktif'),
('sk-012','Manajemen Risiko & Kepatuhan','Manajemen','Management Representative','Hard Skill','KMP-MGT-003','PGP-COMP-MGT-003','Identifikasi risiko, compliance management, audit internal, dan ISO.','Aktif');

-- PART 2: KOMPETENSI JABATAN — mapping 7 segmen kode_jabatan
INSERT INTO kompetensi_jabatan (position_code, skill_id, required_level, is_minimum) VALUES
-- Supir Truk
('1.1.3.1.3.1.1','sk-001',4,true),
('1.1.3.1.3.1.1','sk-004',3,true),
('1.1.3.1.3.1.1','sk-009',2,false),
('1.1.3.1.3.1.2','sk-001',4,true),
('1.1.3.1.3.1.2','sk-004',3,true),
('1.1.3.1.3.1.3','sk-001',3,true),
('1.1.3.1.3.1.3','sk-004',3,true),
-- Staff PPJK
('1.1.3.1.1.1.1','sk-002',4,true),
('1.1.3.1.1.1.1','sk-009',3,false),
('1.1.3.1.1.1.2','sk-002',3,true),
-- Staff Gudang
('1.1.3.1.2.1.1','sk-003',3,true),
('1.1.3.1.2.1.1','sk-004',2,true),
('1.1.3.1.2.1.2','sk-003',2,true),
('1.1.3.1.2.1.2','sk-011',3,true),
-- Manager HR
('1.1.1.1.1.0.0','sk-007',4,true),
('1.1.1.1.1.0.0','sk-008',4,true),
('1.1.1.1.1.0.0','sk-009',3,true),
-- Staff HR
('1.1.1.1.1.1.1','sk-011',3,true),
('1.1.1.1.1.1.1','sk-008',3,false),
('1.1.1.1.1.1.2','sk-011',3,true),
-- Manager Finance
('1.1.2.1.1.0.0','sk-005',5,true),
('1.1.2.1.1.0.0','sk-007',4,true),
-- Staff Accounting
('1.1.2.1.1.1.1','sk-005',3,true),
('1.1.2.1.1.1.1','sk-011',2,true),
-- Manager Procurement
('1.1.4.1.1.0.0','sk-006',4,true),
('1.1.4.1.1.0.0','sk-008',3,false),
-- Staff Procurement
('1.1.4.1.1.1.1','sk-006',2,true),
-- QC Inspector
('1.1.5.1.1.1.2','sk-010',4,true),
('1.1.5.1.1.1.2','sk-004',2,true),
-- MR Coordinator
('1.1.6.1.1.1.1','sk-012',4,true),
('1.1.6.1.1.1.1','sk-008',3,false),
-- HSE Officer
('1.1.7.1.1.1.1','sk-004',5,true),
('1.1.7.1.1.1.1','sk-009',3,true),
-- General Manager level
('1.1.1.1.0.0.0','sk-007',5,true),
('1.1.1.1.0.0.0','sk-009',4,true),
('1.1.2.1.0.0.0','sk-007',5,true),
('1.1.3.1.0.0.0','sk-007',5,true),
('1.1.4.1.0.0.0','sk-007',4,true),
('1.1.5.1.0.0.0','sk-007',4,true);

-- PART 3: PELATIHAN — 8 program training
TRUNCATE TABLE pelatihan CASCADE;
INSERT INTO pelatihan (id, title, skill_id, description, date_start, date_end, status, department, category, method, provider, instruktur, jenis_instruktur, lokasi, durasi_jam, budget_status) VALUES
('trn-001','Defensive Driving & Keselamatan Berkendara','sk-001','Pelatihan teknik mengemudi defensif, inspeksi kendaraan pra-operasi, prosedur darurat di jalan.','2026-05-10','2026-05-12','Completed','Operasional','Teknis','Offline','PT Safety Drive Indonesia','Bpk. Hendra Gunawan, SST','Eksternal','Pool Kendaraan PTPGP',24,'Disetujui'),
('trn-002','SOP Kepabeanan Ekspor-Impor 2026','sk-002','Update regulasi kepabeanan terbaru, pengisian PIB/PEB elektronik, dan penanganan dokumen ekspor.','2026-06-01','2026-06-03','Completed','Operasional','Teknis','Offline','Bea Cukai RI','Tim Bea Cukai Tanjung Priok','Eksternal','Kantor Pusat',24,'Disetujui'),
('trn-003','Manajemen Gudang Modern & WMS','sk-003','Pengenalan sistem Warehouse Management System, tata letak gudang optimal, dan inventory control.','2026-07-15','2026-07-16','Ongoing','Operasional','Operasional','Offline','PT Logistik Nusantara','Bpk. Agus Riyadi, M.Log','Eksternal','Gudang PTPGP',16,'Disetujui'),
('trn-004','Sertifikasi Ahli K3 Umum','sk-004','Sertifikasi AK3U — identifikasi bahaya, HIRADC, audit K3, dan tanggap darurat.','2026-03-01','2026-03-14','Completed','HSE','K3','Offline','KEMNAKER RI','Instruktur KEMNAKER','Eksternal','Kantor Pusat',80,'Disetujui'),
('trn-005','Leadership Development Program','sk-007','Program pengembangan kepemimpinan untuk manajer dan supervisor: coaching, feedback, team building.','2026-08-01','2026-08-03','Planned',NULL,'Manajemen','Offline','PT Daya Dimensi Indonesia','Tim Trainer DDI','Eksternal','Aula PTPGP',24,'Disetujui'),
('trn-006','Excel Advanced & Dashboard Reporting','sk-011','Advanced Excel: Pivot Table, Power Query, Dashboard interaktif untuk pelaporan HR & Finance.','2026-08-15','2026-08-16','Planned',NULL,'Teknis','Offline','PT Komputer Media','Ibu Dina Rahmawati, M.Kom','Eksternal','Ruang Training IT',16,'Disetujui'),
('trn-007','Service Excellence & Komunikasi Pelanggan','sk-008','Pelayanan prima, komunikasi efektif, penanganan keluhan, dan customer relationship.','2026-05-20','2026-05-21','Completed','General Affairs','Soft Skills','Online','Udemy Business','-','Internal','Online (Zoom)',12,'Disetujui'),
('trn-008','Internal Auditor ISO 9001:2015','sk-012','Pelatihan auditor internal: perencanaan audit, pelaksanaan, pelaporan, dan tindak lanjut.','2026-09-01','2026-09-03','Planned','Management Representative','Manajemen','Offline','BSI Group Indonesia','Ir. Sutrisno, Lead Auditor','Eksternal','Kantor Pusat',24,'Disetujui');

-- PART 4: PESERTA PELATIHAN — karyawan di-assign ke training
DO $$ BEGIN
INSERT INTO peserta_pelatihan (id, training_id, employee_id, status) VALUES
('enr-001','trn-001',(SELECT id FROM karyawan WHERE position='Supir Truk / Driver' AND kode_jabatan='1.1.3.1.3.1.1' LIMIT 1),'Completed'),
('enr-002','trn-001',(SELECT id FROM karyawan WHERE position='Supir Truk / Driver' AND kode_jabatan='1.1.3.1.3.1.2' LIMIT 1),'Completed'),
('enr-003','trn-001',(SELECT id FROM karyawan WHERE position='Supir Truk / Driver' AND kode_jabatan='1.1.3.1.3.1.3' LIMIT 1),'Completed'),
('enr-004','trn-001',(SELECT id FROM karyawan WHERE position='Koordinator Armada' LIMIT 1),'Completed'),
('enr-005','trn-002',(SELECT id FROM karyawan WHERE position='Staff PPJK (PIB/PEB)' AND kode_jabatan='1.1.3.1.1.1.1' LIMIT 1),'Completed'),
('enr-006','trn-002',(SELECT id FROM karyawan WHERE position='Staff PPJK (Dokumentasi)' AND kode_jabatan='1.1.3.1.1.1.2' LIMIT 1),'Completed'),
('enr-007','trn-002',(SELECT id FROM karyawan WHERE position='Manager Kepabeanan (PPJK)' LIMIT 1),'Completed'),
('enr-008','trn-003',(SELECT id FROM karyawan WHERE position='Staff Gudang (Bongkar Muat)' LIMIT 1),'Enrolled'),
('enr-009','trn-003',(SELECT id FROM karyawan WHERE position='Staff Administrasi Gudang' LIMIT 1),'Enrolled'),
('enr-010','trn-003',(SELECT id FROM karyawan WHERE position='Supervisor Gudang & Cargo' LIMIT 1),'Enrolled'),
('enr-011','trn-004',(SELECT id FROM karyawan WHERE position='HSE Officer' LIMIT 1),'Completed'),
('enr-012','trn-004',(SELECT id FROM karyawan WHERE position='Safety Inspector' LIMIT 1),'Completed'),
('enr-013','trn-004',(SELECT id FROM karyawan WHERE position='Supervisor Gudang & Cargo' LIMIT 1),'Completed'),
('enr-014','trn-005',(SELECT id FROM karyawan WHERE position='Manager HR & GA' LIMIT 1),'Enrolled'),
('enr-015','trn-005',(SELECT id FROM karyawan WHERE position='Manager Finance & Accounting' LIMIT 1),'Enrolled'),
('enr-016','trn-005',(SELECT id FROM karyawan WHERE position='Manager Gudang & Cargo' LIMIT 1),'Enrolled'),
('enr-017','trn-005',(SELECT id FROM karyawan WHERE position='Manager Kepabeanan (PPJK)' LIMIT 1),'Enrolled'),
('enr-018','trn-005',(SELECT id FROM karyawan WHERE position='Manager Armada & Trucking' LIMIT 1),'Enrolled'),
('enr-019','trn-006',(SELECT id FROM karyawan WHERE position='Staff HRD (Payroll & Adm)' LIMIT 1),'Enrolled'),
('enr-020','trn-006',(SELECT id FROM karyawan WHERE position='Staff Accounting' LIMIT 1),'Enrolled'),
('enr-021','trn-007',(SELECT id FROM karyawan WHERE position='Customer Service Ekspor-Impor' LIMIT 1),'Completed'),
('enr-022','trn-007',(SELECT id FROM karyawan WHERE position='Staff General Affairs (GA)' LIMIT 1),'Completed'),
('enr-023','trn-008',(SELECT id FROM karyawan WHERE position='MR Coordinator' LIMIT 1),'Enrolled'),
('enr-024','trn-008',(SELECT id FROM karyawan WHERE position='Manager MR & Compliance' LIMIT 1),'Enrolled');
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped peserta_pelatihan: %', SQLERRM;
END $$;

-- PART 5: MATERI PELATIHAN
INSERT INTO materi_pelatihan (id, training_id, title, type, file_size) VALUES
('mat-001','trn-001','Modul Defensive Driving','PDF','2.4 MB'),
('mat-002','trn-001','Video Inspeksi Kendaraan Pra-Operasi','Video','45 MB'),
('mat-003','trn-001','Checklist Keselamatan Berkendara','PDF','0.8 MB'),
('mat-004','trn-002','Panduan PIB/PEB Elektronik 2026','PDF','3.1 MB'),
('mat-005','trn-002','Template Dokumen Ekspor','Excel','1.2 MB'),
('mat-006','trn-003','Pengenalan WMS Modern','PDF','5.0 MB'),
('mat-007','trn-004','Modul HIRADC & JSA','PDF','4.2 MB'),
('mat-008','trn-005','Leadership Competency Framework','PDF','1.8 MB'),
('mat-009','trn-006','Excel Advanced Workbook','Excel','8.5 MB'),
('mat-010','trn-007','Slide Service Excellence','PPT','3.0 MB');

-- PART 6: KUIS PELATIHAN
INSERT INTO kuis_pelatihan (id, training_id, title, questions_count, pass_score, duration_minutes, status) VALUES
('quiz-001','trn-001','Tes Defensive Driving',20,75,30,'Draft'),
('quiz-002','trn-002','Tes Kepabeanan',25,70,45,'Draft'),
('quiz-003','trn-004','Tes AK3U — Modul 1',30,80,60,'Draft'),
('quiz-004','trn-004','Tes AK3U — Modul 2',25,80,45,'Draft'),
('quiz-005','trn-007','Tes Service Excellence',15,70,20,'Draft'),
('quiz-006','trn-008','Simulasi Audit ISO',20,75,40,'Draft');

-- PART 7: SERTIFIKAT PELATIHAN
INSERT INTO sertifikat_pelatihan (id, training_id, employee_id, certificate_number, completion_date, status) VALUES
('cert-001','trn-001',(SELECT id FROM karyawan WHERE kode_jabatan='1.1.3.1.3.1.1' LIMIT 1),'CERT/2026/DD/001','2026-05-12','Terbit'),
('cert-002','trn-001',(SELECT id FROM karyawan WHERE kode_jabatan='1.1.3.1.3.1.2' LIMIT 1),'CERT/2026/DD/002','2026-05-12','Terbit'),
('cert-003','trn-002',(SELECT id FROM karyawan WHERE kode_jabatan='1.1.3.1.1.1.1' LIMIT 1),'CERT/2026/KB/001','2026-06-03','Terbit'),
('cert-004','trn-004',(SELECT id FROM karyawan WHERE position='HSE Officer' LIMIT 1),'CERT/2026/K3/001','2026-03-14','Terbit'),
('cert-005','trn-004',(SELECT id FROM karyawan WHERE position='Safety Inspector' LIMIT 1),'CERT/2026/K3/002','2026-03-14','Terbit'),
('cert-006','trn-007',(SELECT id FROM karyawan WHERE position='Customer Service Ekspor-Impor' LIMIT 1),'CERT/2026/SE/001','2026-05-21','Terbit'),
('cert-007','trn-001',(SELECT id FROM karyawan WHERE kode_jabatan='1.1.3.1.3.1.3' LIMIT 1),'CERT/2026/DD/003','2026-05-12','Terbit');

-- PART 8: EVALUASI PELATIHAN (Kirkpatrick)
DO $$ BEGIN
INSERT INTO evaluasi_pelatihan (id, training_id, karyawan_id, reaction_score, learning_score, behavior_score, result_score, catatan) VALUES
('evl-001','trn-001',(SELECT id FROM karyawan WHERE kode_jabatan='1.1.3.1.3.1.1' LIMIT 1),4,4,3,NULL,'Materi sangat aplikatif. Sudah menerapkan teknik defensive driving di lapangan.'),
('evl-002','trn-001',(SELECT id FROM karyawan WHERE kode_jabatan='1.1.3.1.3.1.2' LIMIT 1),5,4,4,NULL,'Instruktur berpengalaman, studi kasus relevan dengan medan operasional.'),
('evl-003','trn-002',(SELECT id FROM karyawan WHERE kode_jabatan='1.1.3.1.1.1.1' LIMIT 1),4,5,4,NULL,'Pemahaman regulasi kepabeanan meningkat signifikan setelah training.'),
('evl-004','trn-004',(SELECT id FROM karyawan WHERE position='HSE Officer' LIMIT 1),5,5,5,NULL,'Pelatihan K3 sangat komprehensif. Langsung bisa implementasi HIRADC di lapangan.'),
('evl-005','trn-007',(SELECT id FROM karyawan WHERE position='Customer Service Ekspor-Impor' LIMIT 1),4,3,3,NULL,'Materi komunikasi cukup membantu. Perlu lebih banyak roleplay dan simulasi kasus.'),
('evl-006','trn-004',(SELECT id FROM karyawan WHERE position='Safety Inspector' LIMIT 1),4,4,3,NULL,'Modul tanggap darurat sangat bagus. Perlu refreshing berkala setiap 6 bulan.');
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped evaluasi_pelatihan: %', SQLERRM;
END $$;

-- PART 9: TNA KOMPETENSI — Training Need Analysis
DO $$ BEGIN
INSERT INTO tna_kompetensi (id, employee_id, skill_id, current_level, required_level, gap, status, created_at) VALUES
('tna-001',(SELECT id FROM karyawan WHERE kode_jabatan='1.1.3.1.3.1.3' LIMIT 1),'sk-001',2,3,1,'Open',NOW()),
('tna-002',(SELECT id FROM karyawan WHERE kode_jabatan='1.1.3.1.3.1.1' LIMIT 1),'sk-009',1,2,1,'Open',NOW()),
('tna-003',(SELECT id FROM karyawan WHERE kode_jabatan='1.1.3.1.2.1.1' LIMIT 1),'sk-004',1,2,1,'Open',NOW()),
('tna-004',(SELECT id FROM karyawan WHERE kode_jabatan='1.1.1.1.1.1.1' LIMIT 1),'sk-009',1,3,2,'Open',NOW()),
('tna-005',(SELECT id FROM karyawan WHERE kode_jabatan='1.1.1.1.1.1.2' LIMIT 1),'sk-011',2,3,1,'Open',NOW()),
('tna-006',(SELECT id FROM karyawan WHERE kode_jabatan='1.1.2.1.1.1.1' LIMIT 1),'sk-005',2,3,1,'Open',NOW()),
('tna-007',(SELECT id FROM karyawan WHERE kode_jabatan='1.1.4.1.1.1.1' LIMIT 1),'sk-006',1,2,1,'Open',NOW()),
('tna-008',(SELECT id FROM karyawan WHERE kode_jabatan='1.1.5.1.1.1.2' LIMIT 1),'sk-010',3,4,1,'Open',NOW());
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped tna_kompetensi: %', SQLERRM;
END $$;

-- PART 10: EVALUASI KPI — Performance
TRUNCATE TABLE evaluasi_kpi CASCADE;
INSERT INTO evaluasi_kpi (id, employee_id, period, final_score, status, created_at) VALUES
('kpi-001',(SELECT id FROM karyawan WHERE position='Supir Truk / Driver' AND kode_jabatan='1.1.3.1.3.1.1' LIMIT 1),'Q2/2026',82,'Completed','2026-07-01'),
('kpi-002',(SELECT id FROM karyawan WHERE position='Supir Truk / Driver' AND kode_jabatan='1.1.3.1.3.1.2' LIMIT 1),'Q2/2026',78,'Completed','2026-07-01'),
('kpi-003',(SELECT id FROM karyawan WHERE position='Supir Truk / Driver' AND kode_jabatan='1.1.3.1.3.1.3' LIMIT 1),'Q2/2026',75,'Completed','2026-07-01'),
('kpi-004',(SELECT id FROM karyawan WHERE position='Manager Gudang & Cargo' LIMIT 1),'Q2/2026',88,'Completed','2026-07-02'),
('kpi-005',(SELECT id FROM karyawan WHERE position='Manager HR & GA' LIMIT 1),'Q2/2026',91,'Completed','2026-07-02'),
('kpi-006',(SELECT id FROM karyawan WHERE position='Manager Finance & Accounting' LIMIT 1),'Q2/2026',85,'Completed','2026-07-02'),
('kpi-007',(SELECT id FROM karyawan WHERE position='Staff Accounting' LIMIT 1),'Q2/2026',80,'Completed','2026-07-03'),
('kpi-008',(SELECT id FROM karyawan WHERE position='Staff HRD (Rekrutmen)' LIMIT 1),'Q2/2026',86,'Completed','2026-07-03'),
('kpi-009',(SELECT id FROM karyawan WHERE position='HSE Officer' LIMIT 1),'Q2/2026',92,'Completed','2026-07-01'),
('kpi-010',(SELECT id FROM karyawan WHERE position='MR Coordinator' LIMIT 1),'Q2/2026',79,'Completed','2026-07-02'),
('kpi-011',(SELECT id FROM karyawan WHERE position='Direktur HR & GA' LIMIT 1),'Q2/2026',90,'Completed','2026-07-05'),
('kpi-012',(SELECT id FROM karyawan WHERE position='Direktur Finance' LIMIT 1),'Q2/2026',87,'Completed','2026-07-05'),
('kpi-013',(SELECT id FROM karyawan WHERE position='Koordinator Armada' LIMIT 1),'Q2/2026',83,'Completed','2026-07-01'),
('kpi-014',(SELECT id FROM karyawan WHERE position='Supervisor HR & GA' LIMIT 1),'Q2/2026',84,'Completed','2026-07-02');

-- PART 11: REVIEW KINERJA
DO $$ BEGIN
INSERT INTO review_kinerja (id, employee_id, period, reviewer_id, score, catatan, created_at) VALUES
('rev-001',(SELECT id FROM karyawan WHERE kode_jabatan='1.1.3.1.3.1.1' LIMIT 1),'Q2/2026',(SELECT id FROM karyawan WHERE position='Koordinator Armada' LIMIT 1),4,'Pengemudi handal, zero accident, tepat waktu pengiriman. Tingkatkan administrasi trip log.','2026-07-01'),
('rev-002',(SELECT id FROM karyawan WHERE kode_jabatan='1.1.3.1.1.1.1' LIMIT 1),'Q2/2026',(SELECT id FROM karyawan WHERE position='Manager Kepabeanan (PPJK)' LIMIT 1),5,'Sangat teliti dalam dokumen PIB/PEB, tidak ada reject bea cukai.','2026-07-01'),
('rev-003',(SELECT id FROM karyawan WHERE position='Staff Accounting' LIMIT 1),'Q2/2026',(SELECT id FROM karyawan WHERE position='Manager Finance & Accounting' LIMIT 1),4,'Laporan keuangan akurat dan tepat waktu. Asah skill analisis data.','2026-07-03'),
('rev-004',(SELECT id FROM karyawan WHERE position='Staff HRD (Rekrutmen)' LIMIT 1),'Q2/2026',(SELECT id FROM karyawan WHERE position='Manager HR & GA' LIMIT 1),4,'Pipeline rekrutmen berjalan baik. Kurangi time-to-hire untuk posisi supir.','2026-07-03'),
('rev-005',(SELECT id FROM karyawan WHERE position='HSE Officer' LIMIT 1),'Q2/2026',(SELECT id FROM karyawan WHERE position='Manager HSE' LIMIT 1),5,'Inspeksi K3 rutin, zero lost-time injury. Pertahankan dan lanjutkan program safety talk.','2026-07-01'),
('rev-006',(SELECT id FROM karyawan WHERE kode_jabatan='1.1.3.1.2.1.1' LIMIT 1),'Q2/2026',(SELECT id FROM karyawan WHERE position='Supervisor Gudang & Cargo' LIMIT 1),3,'Produktivitas bongkar muat perlu ditingkatkan. Beberapa kali keterlambatan administrasi gudang.','2026-07-01');
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped review_kinerja: %', SQLERRM;
END $$;

-- PART 12: UMPAN BALIK
DO $$ BEGIN
INSERT INTO umpan_balik (id, employee_id, from_employee_id, feedback_type, message, created_at) VALUES
('fb-001',(SELECT id FROM karyawan WHERE kode_jabatan='1.1.3.1.3.1.1' LIMIT 1),(SELECT id FROM karyawan WHERE position='Koordinator Armada' LIMIT 1),'Pujian','Selalu bersedia lembur saat ada pengiriman mendesak. Semangat kerja tinggi.','2026-06-15'),
('fb-002',(SELECT id FROM karyawan WHERE kode_jabatan='1.1.3.1.2.1.1' LIMIT 1),(SELECT id FROM karyawan WHERE position='Supervisor Gudang & Cargo' LIMIT 1),'Perbaikan','Mohon lebih teliti dalam pencatatan stok barang masuk/keluar.','2026-06-20'),
('fb-003',(SELECT id FROM karyawan WHERE position='Staff General Affairs (GA)' LIMIT 1),(SELECT id FROM karyawan WHERE position='Manager HR & GA' LIMIT 1),'Pujian','Kantor selalu bersih dan rapi. Housekeeping excellent.','2026-06-25'),
('fb-004',(SELECT id FROM karyawan WHERE position='Staff HRD (Rekrutmen)' LIMIT 1),(SELECT id FROM karyawan WHERE position='Supervisor HR & GA' LIMIT 1),'Perbaikan','Percepat proses screening CV untuk posisi supir yang banyak lowongan.','2026-06-18');
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped umpan_balik: %', SQLERRM;
END $$;

-- PART 13: PENGGAJIAN — Payroll per Juli 2026
TRUNCATE TABLE penggajian CASCADE;
INSERT INTO penggajian (id, employee_id, month, year, basic_salary, allowances, deductions, net_salary, status, department) VALUES
(gen_random_uuid(),(SELECT id FROM karyawan WHERE kode_jabatan='1.1.3.1.3.1.1' LIMIT 1),7,2026,4800000,1000000,200000,5600000,'Draft','Divisi Operasional'),
(gen_random_uuid(),(SELECT id FROM karyawan WHERE kode_jabatan='1.1.3.1.3.1.2' LIMIT 1),7,2026,4800000,1000000,150000,5650000,'Draft','Divisi Operasional'),
(gen_random_uuid(),(SELECT id FROM karyawan WHERE kode_jabatan='1.1.3.1.3.1.3' LIMIT 1),7,2026,4800000,800000,200000,5400000,'Draft','Divisi Operasional'),
(gen_random_uuid(),(SELECT id FROM karyawan WHERE kode_jabatan='1.1.1.1.1.1.1' LIMIT 1),7,2026,6500000,1500000,300000,7700000,'Draft','Divisi HR & GA'),
(gen_random_uuid(),(SELECT id FROM karyawan WHERE kode_jabatan='1.1.1.1.1.1.2' LIMIT 1),7,2026,5500000,1500000,250000,6750000,'Draft','Divisi HR & GA'),
(gen_random_uuid(),(SELECT id FROM karyawan WHERE kode_jabatan='1.1.2.1.1.1.1' LIMIT 1),7,2026,7500000,2000000,400000,9100000,'Draft','Divisi Finance & Accounting'),
(gen_random_uuid(),(SELECT id FROM karyawan WHERE kode_jabatan='1.1.2.1.1.1.2' LIMIT 1),7,2026,5500000,1500000,250000,6750000,'Draft','Divisi Finance & Accounting'),
(gen_random_uuid(),(SELECT id FROM karyawan WHERE kode_jabatan='1.1.3.1.1.1.1' LIMIT 1),7,2026,7500000,2000000,350000,9150000,'Draft','Divisi Operasional'),
(gen_random_uuid(),(SELECT id FROM karyawan WHERE kode_jabatan='1.1.3.1.2.1.1' LIMIT 1),7,2026,4800000,800000,200000,5400000,'Draft','Divisi Operasional'),
(gen_random_uuid(),(SELECT id FROM karyawan WHERE position='Manager Armada & Trucking' LIMIT 1),7,2026,16000000,5000000,800000,20200000,'Draft','Divisi Operasional'),
(gen_random_uuid(),(SELECT id FROM karyawan WHERE position='Manager HR & GA' LIMIT 1),7,2026,15500000,5000000,750000,19750000,'Draft','Divisi HR & GA'),
(gen_random_uuid(),(SELECT id FROM karyawan WHERE position='Manager Finance & Accounting' LIMIT 1),7,2026,16000000,5000000,800000,20200000,'Draft','Divisi Finance & Accounting');

-- PART 14: INSENTIF — Trip-based & performance incentives
TRUNCATE TABLE insentif CASCADE;
INSERT INTO insentif (id, employee_id, period, amount, program, alasan, status) VALUES
('inc-001',(SELECT id FROM karyawan WHERE kode_jabatan='1.1.3.1.3.1.1' LIMIT 1),'07/2026',450000,'Insentif Trip Bulanan','Total jarak 1,250 km x Rp 2,000 rate = Rp 2.5jt trip Juli. Dibayarkan sebagian.','Pending'),
('inc-002',(SELECT id FROM karyawan WHERE kode_jabatan='1.1.3.1.3.1.2' LIMIT 1),'07/2026',380000,'Insentif Trip Bulanan','Total jarak 1,100 km x Rp 2,000 rate = Rp 2.2jt trip Juli.','Pending'),
('inc-003',(SELECT id FROM karyawan WHERE kode_jabatan='1.1.1.1.1.1.1' LIMIT 1),'07/2026',1000000,'Bonus Rekrutmen Q2','Berhasil merekrut 5 supir baru dalam 1 kuartal.','Disetujui'),
('inc-004',(SELECT id FROM karyawan WHERE position='HSE Officer' LIMIT 1),'07/2026',1500000,'Bonus Kinerja K3','Zero accident selama 6 bulan berturut-turut.','Disetujui'),
('inc-005',(SELECT id FROM karyawan WHERE kode_jabatan='1.1.3.1.1.1.1' LIMIT 1),'07/2026',500000,'Insentif Produktivitas','Penyelesaian 100% dokumen PIB/PEB tanpa revisi.','Pending'),
('inc-006',(SELECT id FROM karyawan WHERE kode_jabatan='1.1.3.1.3.1.3' LIMIT 1),'07/2026',320000,'Insentif Trip Bulanan','Total jarak 950 km x Rp 2,000 rate = Rp 1.9jt trip Juli.','Pending');

-- PART 15: KENDARAAN — Fleet
TRUNCATE TABLE kendaraan CASCADE;
INSERT INTO kendaraan (id, plate_number, type, brand, model, year, status, stnk_expiry, kir_expiry, insurance_expiry, assigned_driver_id, notes) VALUES
('veh-001','B 9876 CD','Truk Trailer','Hino','FM 260 JD',2020,'Aktif','2027-03-15','2026-11-20','2027-03-15',(SELECT id FROM karyawan WHERE kode_jabatan='1.1.3.1.3.1.1' LIMIT 1),'Truk utama rute Jakarta-Surabaya'),
('veh-002','B 8765 EF','Truk Box','Mitsubishi','Fuso FN 527',2019,'Aktif','2026-09-10','2027-01-05','2027-09-10',(SELECT id FROM karyawan WHERE kode_jabatan='1.1.3.1.3.1.2' LIMIT 1),'Truk pengiriman kargo'),
('veh-003','B 7654 GH','Dump Truck','Hino','Dutro 130 HD',2021,'Aktif','2027-06-22','2027-02-14','2026-12-22',(SELECT id FROM karyawan WHERE kode_jabatan='1.1.3.1.3.1.3' LIMIT 1),'Truk angkut material'),
('veh-004','B 6543 IJ','Pickup','Toyota','Hilux DC',2022,'Aktif','2028-01-30','2027-06-15','2028-01-30',NULL,'Kendaraan operasional kantor'),
('veh-005','B 5432 KL','Truk Trailer','Mercedes-Benz','Axor 2528',2018,'Servis','2026-08-15','2026-05-01','2026-12-15',NULL,'Masuk bengkel — overhaul mesin');

-- PART 16: TRIP SUPIR
TRUNCATE TABLE trip_supir CASCADE;
INSERT INTO trip_supir (id, driver_id, driver_name, department, vehicle_id, vehicle_plate, origin, destination, trip_date, start_time, end_time, distance_km, rate_per_km, status, incentive_generated, notes) VALUES
('trip-001',(SELECT id FROM karyawan WHERE kode_jabatan='1.1.3.1.3.1.1' LIMIT 1),'Agus Salim','Divisi Operasional','veh-001','B 9876 CD','Jakarta','Surabaya','2026-07-10','2026-07-10 06:00:00','2026-07-10 18:00:00',800,2000,'Selesai',false,'Pengiriman kontainer ekspor'),
('trip-002',(SELECT id FROM karyawan WHERE kode_jabatan='1.1.3.1.3.1.1' LIMIT 1),'Agus Salim','Divisi Operasional','veh-001','B 9876 CD','Surabaya','Jakarta','2026-07-12','2026-07-12 05:00:00','2026-07-12 17:00:00',800,2000,'Selesai',false,'Kembali ke Jakarta'),
('trip-003',(SELECT id FROM karyawan WHERE kode_jabatan='1.1.3.1.3.1.2' LIMIT 1),'Budi Santoso','Divisi Operasional','veh-002','B 8765 EF','Jakarta','Bandung','2026-07-11','2026-07-11 07:00:00','2026-07-11 13:00:00',200,2000,'Selesai',false,'Pengiriman kargo'),
('trip-004',(SELECT id FROM karyawan WHERE kode_jabatan='1.1.3.1.3.1.3' LIMIT 1),'Cecep Supriyadi','Divisi Operasional','veh-003','B 7654 GH','Jakarta','Bekasi','2026-07-20','2026-07-20 08:00:00',NULL,150,2000,'Berjalan',false,'Angkut material proyek'),
('trip-005',(SELECT id FROM karyawan WHERE kode_jabatan='1.1.3.1.3.1.1' LIMIT 1),'Agus Salim','Divisi Operasional','veh-001','B 9876 CD','Jakarta','Semarang','2026-07-22','2026-07-22 05:30:00',NULL,500,2000,'Berjalan',false,'Pengiriman mesin industri');

-- PART 17: MONITORING KINERJA PENGEMUDI
DO $$ BEGIN
INSERT INTO monitoring_kinerja_pengemudi (id, employee_id, employee_name, periode, evaluator, catatan, hasil, tindak_lanjut) VALUES
('mkp-001',(SELECT id FROM karyawan WHERE kode_jabatan='1.1.3.1.3.1.1' LIMIT 1),'Agus Salim','Q2/2026','Koordinator Armada','Pengemudi teladan. Zero accident, selalu tepat waktu, kendaraan terawat. Jam mengemudi dalam batas aman.','Baik',NULL),
('mkp-002',(SELECT id FROM karyawan WHERE kode_jabatan='1.1.3.1.3.1.2' LIMIT 1),'Budi Santoso','Q2/2026','Koordinator Armada','Cukup baik. Ada 1 kali keterlambatan. Perlu briefing tentang manajemen waktu.','Perlu Perbaikan','Briefing/Pelatihan Tambahan'),
('mkp-003',(SELECT id FROM karyawan WHERE kode_jabatan='1.1.3.1.3.1.3' LIMIT 1),'Cecep Supriyadi','Q2/2026','Koordinator Armada','Baik, hanya perlu lebih rajin mencatat logbook perjalanan. Tidak ada masalah keselamatan.','Baik',NULL);
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped monitoring_kinerja_pengemudi: %', SQLERRM;
END $$;

-- PART 18: PENUGASAN KERJA
TRUNCATE TABLE penugasan_kerja CASCADE;
INSERT INTO penugasan_kerja (id, karyawan_id, unit_organisasi_id, supervisor_karyawan_id, nama_project, nama_klien, tanggal_mulai, tanggal_selesai, status) VALUES
('pgs-001',(SELECT id FROM karyawan WHERE kode_jabatan='1.1.3.1.3.1.1' LIMIT 1),'unit-ops',(SELECT id FROM karyawan WHERE position='Koordinator Armada' LIMIT 1),'Proyek Logistik Nataru','PT Maju Bersama','2026-07-01','2026-09-30','Aktif'),
('pgs-002',(SELECT id FROM karyawan WHERE kode_jabatan='1.1.3.1.3.1.2' LIMIT 1),'unit-ops',(SELECT id FROM karyawan WHERE position='Koordinator Armada' LIMIT 1),'Proyek Logistik Nataru','PT Maju Bersama','2026-07-01','2026-09-30','Aktif'),
('pgs-003',(SELECT id FROM karyawan WHERE kode_jabatan='1.1.3.1.1.1.1' LIMIT 1),'unit-ops',(SELECT id FROM karyawan WHERE position='Manager Kepabeanan (PPJK)' LIMIT 1),'Customs Clearance PLB','PT Global Trade','2026-06-15',NULL,'Aktif'),
('pgs-004',(SELECT id FROM karyawan WHERE position='HSE Officer' LIMIT 1),'unit-hse',(SELECT id FROM karyawan WHERE position='Manager HSE' LIMIT 1),'Safety Audit Proyek','Internal','2026-07-05','2026-07-20','Selesai');

-- PART 19: KOMPETENSI KARYAWAN — Employee current skill levels
TRUNCATE TABLE kompetensi_karyawan CASCADE;
INSERT INTO kompetensi_karyawan (id, employee_id, skill_id, current_level, assessed_by, assessment_type, evidence) VALUES
('esk-001',(SELECT id FROM karyawan WHERE kode_jabatan='1.1.3.1.3.1.1' LIMIT 1),'sk-001',4,'staff.hrd1@ptpgp.co.id','Supervisor','Memiliki sertifikasi defensive driving, zero accident 2 tahun'),
('esk-002',(SELECT id FROM karyawan WHERE kode_jabatan='1.1.3.1.3.1.1' LIMIT 1),'sk-004',3,'staff.hrd1@ptpgp.co.id','Supervisor','Sudah ikut pelatihan K3 dasar'),
('esk-003',(SELECT id FROM karyawan WHERE kode_jabatan='1.1.3.1.3.1.1' LIMIT 1),'sk-009',2,'staff.hrd1@ptpgp.co.id','Self','Mampu menyelesaikan masalah di jalan secara mandiri'),
('esk-004',(SELECT id FROM karyawan WHERE kode_jabatan='1.1.3.1.3.1.2' LIMIT 1),'sk-001',3,'staff.hrd1@ptpgp.co.id','Supervisor','Mengemudi baik, perlu defensive driving'),
('esk-005',(SELECT id FROM karyawan WHERE kode_jabatan='1.1.3.1.1.1.1' LIMIT 1),'sk-002',4,'staff.hrd1@ptpgp.co.id','Supervisor','Ahli PIB/PEB, 5 tahun pengalaman'),
('esk-006',(SELECT id FROM karyawan WHERE kode_jabatan='1.1.1.1.1.1.1' LIMIT 1),'sk-011',3,'staff.hrd1@ptpgp.co.id','Self','Mahir Excel dan administrasi'),
('esk-007',(SELECT id FROM karyawan WHERE kode_jabatan='1.1.2.1.1.1.1' LIMIT 1),'sk-005',3,'staff.hrd1@ptpgp.co.id','Supervisor','Laporan keuangan akurat'),
('esk-008',(SELECT id FROM karyawan WHERE position='HSE Officer' LIMIT 1),'sk-004',5,'staff.hrd1@ptpgp.co.id','Supervisor','Sertifikasi AK3U, 8 tahun pengalaman HSE'),
('esk-009',(SELECT id FROM karyawan WHERE position='HSE Officer' LIMIT 1),'sk-009',3,'staff.hrd1@ptpgp.co.id','Self','Problem solving insiden kerja'),
('esk-010',(SELECT id FROM karyawan WHERE position='Safety Inspector' LIMIT 1),'sk-004',3,'staff.hrd1@ptpgp.co.id','Supervisor','Pelatihan K3 dasar selesai'),
('esk-011',(SELECT id FROM karyawan WHERE kode_jabatan='1.1.3.1.2.1.1' LIMIT 1),'sk-003',2,'staff.hrd1@ptpgp.co.id','Supervisor','Pengalaman gudang terbatas'),
('esk-012',(SELECT id FROM karyawan WHERE kode_jabatan='1.1.4.1.1.1.1' LIMIT 1),'sk-006',2,'staff.hrd1@ptpgp.co.id','Supervisor','Mulai belajar proses procurement'),
('esk-013',(SELECT id FROM karyawan WHERE kode_jabatan='1.1.5.1.1.1.2' LIMIT 1),'sk-010',3,'staff.hrd1@ptpgp.co.id','Supervisor','QC inspeksi rutin'),
('esk-014',(SELECT id FROM karyawan WHERE kode_jabatan='1.1.6.1.1.1.1' LIMIT 1),'sk-012',3,'staff.hrd1@ptpgp.co.id','Supervisor','Pengalaman audit internal');

-- PART 20: KNOWLEDGE — SOP, Kebijakan, dan Artikel Pengetahuan dengan mapping ke kompetensi
DO $$ BEGIN TRUNCATE TABLE dokumen_sop CASCADE; EXCEPTION WHEN OTHERS THEN NULL; END $$;
INSERT INTO dokumen_sop (id, number, title, department, version, description, status, mandatory, skill_id) VALUES
('sop-001','SOP-OPS-001','SOP Mengemudi Defensif untuk Armada','Operasional','v2.1','Prosedur standar mengemudi defensif: inspeksi pra-operasi, teknik pengereman, jarak aman, prosedur darurat, dan pelaporan insiden.','Published',true,'sk-001'),
('sop-002','SOP-OPS-002','SOP Pengisian PIB Elektronik','Operasional','v1.3','Step-by-step pengisian Pemberitahuan Impor Barang (PIB) melalui sistem CEISA. Termasuk kode HS, tarif, dan dokumen pendukung.','Published',true,'sk-002'),
('sop-003','SOP-WH-001','SOP Manajemen Gudang FIFO','Operasional','v1.0','SOP pengelolaan gudang dengan sistem First-In-First-Out. Mencakup penerimaan, penyimpanan, pengambilan, dan pengiriman barang.','Published',true,'sk-003'),
('sop-004','SOP-MR-001','Prosedur Audit Internal ISO 9001','Management Representative','v2.0','Langkah-langkah audit internal: perencanaan, checklist, pelaksanaan, temuan, dan tindakan perbaikan sesuai ISO 9001:2015.','Published',true,'sk-012');

DO $$ BEGIN TRUNCATE TABLE kebijakan_perusahaan CASCADE; EXCEPTION WHEN OTHERS THEN NULL; END $$;
INSERT INTO kebijakan_perusahaan (id, title, content, category, status, mandatory, skill_id) VALUES
('pol-001','Kebijakan K3LH Perusahaan','Dokumen resmi kebijakan Kesehatan, Keselamatan Kerja, dan Lingkungan Hidup PT PGP. Mencakup komitmen manajemen, struktur organisasi K3, dan program kerja.','K3','Published',true,'sk-004'),
('pol-002','Kebijakan Anti Korupsi & Kode Etik','Kode etik perusahaan: anti korupsi, gratifikasi, konflik kepentingan, dan whistleblowing. Wajib dibaca seluruh karyawan.','Etik','Published',true,'sk-012');

DO $$ BEGIN TRUNCATE TABLE artikel_pengetahuan CASCADE; EXCEPTION WHEN OTHERS THEN NULL; END $$;
INSERT INTO artikel_pengetahuan (id, title, content, category, status, mandatory, author, skill_id) VALUES
('art-001','Template Excel Dashboard HR','Template siap pakai untuk dashboard HR: headcount, turnover, absensi, dan pelatihan. Dilengkapi pivot table dan grafik otomatis.','Panduan','Published',false,'Staff HRD','sk-011'),
('art-002','Panduan Service Excellence','Panduan pelayanan prima, komunikasi efektif, penanganan keluhan, dan customer relationship untuk semua staf front-line.','Panduan','Published',true,'Customer Service','sk-008');

-- PART 21: PENGETAHUAN MAPPING — Connect knowledge to employee gaps
-- (links are implicit via skill_id above; TNA gaps auto-suggest relevant pengetahuan)
