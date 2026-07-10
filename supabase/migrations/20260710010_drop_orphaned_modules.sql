-- Menghapus tabel untuk 3 modul yang halamannya tidak pernah tersambung ke
-- menu manapun (Manajemen Perubahan, Strategy, dan Workforce
-- Forecast/Headcount/Vacancy) — halaman, komponen, dan server action-nya
-- sudah dihapus dari kode di sesi yang sama. Sudah diverifikasi tidak ada
-- fitur aktif lain yang memakai tabel-tabel ini.
--
-- workforce_requests (permintaan_sdm) TIDAK ikut dihapus — modul itu tetap
-- aktif dan tersambung ke menu "Perencanaan Tenaga Kerja".

DROP TABLE IF EXISTS inisiatif_perubahan;
DROP TABLE IF EXISTS komunikasi_perubahan;
DROP TABLE IF EXISTS kebijakan_perubahan;
DROP TABLE IF EXISTS proyeksi_departemen;
