-- Rename tabel database (Fase 2: tabel inti/shared — employees, departments,
-- users, dll) supaya konsisten dengan istilah di sidebar aplikasi. Kode di
-- src/ SUDAH diubah untuk memanggil nama-nama baru ini — migration ini WAJIB
-- dijalankan SEGERA SETELAH Fase 1 (20260710008), sebelum deploy kode baru,
-- karena tabel-tabel ini dipakai di 100+ file termasuk login, absensi, dan
-- payroll — aplikasi TIDAK akan berjalan sampai migration ini dieksekusi.
--
-- ALTER TABLE RENAME bersifat metadata-only (data & foreign key tidak
-- disentuh sama sekali, Postgres melacak relasi lewat OID internal, bukan
-- nama tabel).

ALTER TABLE IF EXISTS employees RENAME TO karyawan;
ALTER TABLE IF EXISTS departments RENAME TO departemen;
ALTER TABLE IF EXISTS kpi_evaluations RENAME TO evaluasi_kpi;
ALTER TABLE IF EXISTS users RENAME TO pengguna;
ALTER TABLE IF EXISTS notifications RENAME TO notifikasi;
ALTER TABLE IF EXISTS job_postings RENAME TO lowongan_kerja;
ALTER TABLE IF EXISTS payroll RENAME TO penggajian;
ALTER TABLE IF EXISTS applications RENAME TO pelamar;
ALTER TABLE IF EXISTS leave_requests RENAME TO pengajuan_cuti;
ALTER TABLE IF EXISTS trainings RENAME TO pelatihan;
ALTER TABLE IF EXISTS training_enrollments RENAME TO peserta_pelatihan;
ALTER TABLE IF EXISTS skills RENAME TO master_kompetensi;
ALTER TABLE IF EXISTS workforce_requests RENAME TO permintaan_sdm;
ALTER TABLE IF EXISTS system_settings RENAME TO pengaturan_sistem;
ALTER TABLE IF EXISTS position_skills RENAME TO kompetensi_jabatan;
ALTER TABLE IF EXISTS attendance RENAME TO absensi;
ALTER TABLE IF EXISTS positions RENAME TO jabatan;
ALTER TABLE IF EXISTS employee_skills RENAME TO kompetensi_karyawan;
ALTER TABLE IF EXISTS resignations RENAME TO pengunduran_diri;
ALTER TABLE IF EXISTS org_units RENAME TO unit_organisasi;
ALTER TABLE IF EXISTS warnings RENAME TO surat_peringatan;
ALTER TABLE IF EXISTS job_descriptions RENAME TO deskripsi_kerja;
ALTER TABLE IF EXISTS employee_faces RENAME TO data_wajah_karyawan;
