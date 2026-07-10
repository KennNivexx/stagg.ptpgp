-- Rename tabel database (Fase 1: tabel "sempit"/spesifik-fitur, risiko rendah)
-- supaya nama tabel konsisten dengan istilah di sidebar aplikasi (bahasa
-- Indonesia), memudahkan penjelasan ke client. Kode di src/ SUDAH diubah
-- untuk memanggil nama-nama baru ini — migration ini WAJIB dijalankan agar
-- aplikasi tidak error, karena tabel lama tidak akan ditemukan lagi.
--
-- ALTER TABLE RENAME bersifat metadata-only (tidak menyentuh/menghapus data),
-- dan seluruh foreign key serta index otomatis ikut karena Postgres melacak
-- relasi lewat OID internal, bukan nama.

ALTER TABLE IF EXISTS incident_reports RENAME TO laporan_insiden;
ALTER TABLE IF EXISTS incentive_payments RENAME TO insentif;
ALTER TABLE IF EXISTS business_trips RENAME TO perjalanan_dinas;
ALTER TABLE IF EXISTS work_locations RENAME TO lokasi_kerja;
ALTER TABLE IF EXISTS wa_conversations RENAME TO percakapan_wa;
ALTER TABLE IF EXISTS trips RENAME TO trip_supir;
ALTER TABLE IF EXISTS training_certificates RENAME TO sertifikat_pelatihan;
ALTER TABLE IF EXISTS sop_documents RENAME TO dokumen_sop;
ALTER TABLE IF EXISTS salary_structures RENAME TO struktur_gaji;
ALTER TABLE IF EXISTS okr_objectives RENAME TO okr;
ALTER TABLE IF EXISTS job_specifications RENAME TO spesifikasi_kerja;
ALTER TABLE IF EXISTS documents RENAME TO dokumen_perusahaan;
ALTER TABLE IF EXISTS complaints RENAME TO keluhan;
ALTER TABLE IF EXISTS audit_logs RENAME TO log_audit;
ALTER TABLE IF EXISTS workforce_request_history RENAME TO riwayat_permintaan_sdm;
ALTER TABLE IF EXISTS wa_message_log RENAME TO log_pesan_wa;
ALTER TABLE IF EXISTS vehicles RENAME TO kendaraan;
ALTER TABLE IF EXISTS training_roi RENAME TO roi_pelatihan;
ALTER TABLE IF EXISTS training_quizzes RENAME TO kuis_pelatihan;
ALTER TABLE IF EXISTS training_materials RENAME TO materi_pelatihan;
ALTER TABLE IF EXISTS employee_licenses RENAME TO sim_sertifikasi_karyawan;
ALTER TABLE IF EXISTS employee_contracts RENAME TO kontrak_kerja;
ALTER TABLE IF EXISTS development_plans RENAME TO rencana_pengembangan;
ALTER TABLE IF EXISTS department_forecasts RENAME TO proyeksi_departemen;
ALTER TABLE IF EXISTS change_policies RENAME TO kebijakan_perubahan;
ALTER TABLE IF EXISTS change_initiatives RENAME TO inisiatif_perubahan;
ALTER TABLE IF EXISTS change_communications RENAME TO komunikasi_perubahan;
ALTER TABLE IF EXISTS career_requests RENAME TO permintaan_karir;
ALTER TABLE IF EXISTS career_promotions RENAME TO promosi_karir;
ALTER TABLE IF EXISTS career_mutations RENAME TO mutasi_karir;
ALTER TABLE IF EXISTS wa_verifications RENAME TO verifikasi_wa;
ALTER TABLE IF EXISTS vendors RENAME TO vendor;
ALTER TABLE IF EXISTS vehicle_procurement_requests RENAME TO pengadaan_kendaraan;
ALTER TABLE IF EXISTS training_videos RENAME TO video_pelatihan;
ALTER TABLE IF EXISTS training_requests RENAME TO permintaan_pelatihan;
ALTER TABLE IF EXISTS survey_responses RENAME TO jawaban_survei;
ALTER TABLE IF EXISTS succession_talent_pool RENAME TO pool_suksesi;
ALTER TABLE IF EXISTS succession_readiness_assessments RENAME TO penilaian_kesiapan_suksesi;
ALTER TABLE IF EXISTS succession_critical_positions RENAME TO posisi_kritis;
ALTER TABLE IF EXISTS succession_candidates RENAME TO kandidat_suksesor;
ALTER TABLE IF EXISTS skill_level_guides RENAME TO panduan_level_kompetensi;
ALTER TABLE IF EXISTS shifts RENAME TO shift_kerja;
ALTER TABLE IF EXISTS shift_schedules RENAME TO jadwal_shift;
ALTER TABLE IF EXISTS recruitment_tests RENAME TO tes_rekrutmen;
ALTER TABLE IF EXISTS performance_feedback RENAME TO umpan_balik_kinerja;
ALTER TABLE IF EXISTS password_reset_otps RENAME TO otp_reset_password;
ALTER TABLE IF EXISTS notification_settings RENAME TO pengaturan_notifikasi;
ALTER TABLE IF EXISTS knowledge_articles RENAME TO artikel_pengetahuan;
ALTER TABLE IF EXISTS guides RENAME TO panduan_bantuan;
ALTER TABLE IF EXISTS face_change_requests RENAME TO permintaan_ubah_wajah;
ALTER TABLE IF EXISTS employee_surveys RENAME TO survei_karyawan;
ALTER TABLE IF EXISTS employee_awards RENAME TO penghargaan_karyawan;
ALTER TABLE IF EXISTS department_requests RENAME TO usulan_departemen;
ALTER TABLE IF EXISTS contact_messages RENAME TO pesan_kontak;
ALTER TABLE IF EXISTS competency_requests RENAME TO usulan_kompetensi;
ALTER TABLE IF EXISTS company_policies RENAME TO kebijakan_perusahaan;
ALTER TABLE IF EXISTS attendance_archives RENAME TO arsip_absensi;
ALTER TABLE IF EXISTS approval_configs RENAME TO konfigurasi_approval;

-- Bonus: "work_shifts" di kode lama adalah bug/typo (tabel itu tidak pernah
-- ada) — sudah diperbaiki di src/app/hrd/workplace/page.tsx supaya memanggil
-- shift_kerja (dulu bernama shifts) yang benar. Tidak ada rename tambahan
-- diperlukan untuk ini.
