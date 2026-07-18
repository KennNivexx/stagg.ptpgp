-- ============================================================================
-- DUMMY DATA — Career Development & Succession Management engine tables
-- (career_profiles, talent_pools, talent_reviews, critical_positions,
-- succession_plans, career_assessments, individual_development_plans,
-- idp_items, career_recommendations, career_transactions, career_approvals).
--
-- Purely additive, safe on top of 20260720002_seed_dummy_data.sql and
-- 20260723001_org_hierarchy_full.sql — uses the demo-emp-* employee ids
-- seeded by those two migrations. Run after both.
-- ============================================================================

DO $$ BEGIN
INSERT INTO career_profiles (id, karyawan_id, career_stream_id, career_level_id, target_jabatan_id, last_assessment_date) VALUES
  ('cprof-01', '1cd2c026-2b1b-479e-9282-58ac97a61028', 'str-04', 'lvl-05', 'demo-jab-spv-ppjk2', CURRENT_DATE - 30),
  ('cprof-02', 'f489b27a-5dee-490b-b578-4e750c4faff1',   'str-01', 'lvl-06', 'demo-jab-mgr-ppjk',  CURRENT_DATE - 45),
  ('cprof-03', 'af1f9c79-9add-4140-ba9d-a564fcda5bc8',   'str-01', 'lvl-07', 'demo-jab-gm-ops',    CURRENT_DATE - 20),
  ('cprof-04', 'a512a9ac-2954-4bf0-a34e-7f71e515e346',     'str-01', 'lvl-07', 'demo-jab-gm-hr',    CURRENT_DATE - 60),
  ('cprof-05', '303e8e80-07bf-494c-99a3-8f7469d12eac',    'str-01', 'lvl-07', 'demo-jab-gm-fin',    CURRENT_DATE - 15)
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped career_profiles: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO talent_pools (id, karyawan_id, current_jabatan_id, target_jabatan_id, status, entered_at, keterangan) VALUES
  ('tp-01', '1cd2c026-2b1b-479e-9282-58ac97a61028', 'demo-jab-staff-ppjk2', 'demo-jab-spv-ppjk2', 'Development', CURRENT_DATE - 90, 'Kandidat kuat, sedang menyelesaikan sertifikasi kepabeanan.'),
  ('tp-02', 'f489b27a-5dee-490b-b578-4e750c4faff1',   'demo-jab-spv-ppjk2',   'demo-jab-mgr-ppjk',  'Ready',       CURRENT_DATE - 200, 'Siap dipromosikan pada rotasi berikutnya.'),
  ('tp-03', 'a512a9ac-2954-4bf0-a34e-7f71e515e346',     'demo-jab-mgr-hr',      'demo-jab-gm-hr',     'Ready',       CURRENT_DATE - 150, 'Skor leadership tinggi, direkomendasikan Assessment Center.'),
  ('tp-04', '303e8e80-07bf-494c-99a3-8f7469d12eac',    'demo-jab-mgr-fin',     'demo-jab-gm-fin',    'On Hold',     CURRENT_DATE - 60, 'Menunggu ketersediaan posisi.')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped talent_pools: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO talent_reviews (id, karyawan_id, period, performance_score, potential_score, classification_id, reviewer_id, notes, review_date) VALUES
  ('trv-01', '1cd2c026-2b1b-479e-9282-58ac97a61028', '2026-H1', 82, 78, 'tcl-3', 'af1f9c79-9add-4140-ba9d-a564fcda5bc8', 'Konsisten, siap dikembangkan lebih lanjut.', CURRENT_DATE - 30),
  ('trv-02', 'f489b27a-5dee-490b-b578-4e750c4faff1',   '2026-H1', 91, 88, 'tcl-1', '94dde282-3c16-4f5d-887f-59395dd1b4b4',   'High potential, kandidat suksesi kuat.', CURRENT_DATE - 25),
  ('trv-03', 'a512a9ac-2954-4bf0-a34e-7f71e515e346',     '2026-H1', 90, 87, 'tcl-1', 'b7b46400-4225-45ac-a4de-97af1a68da3c',   'Leadership dan engagement sangat baik.', CURRENT_DATE - 20),
  ('trv-04', '303e8e80-07bf-494c-99a3-8f7469d12eac',    '2026-H1', 76, 72, 'tcl-4', '58291f18-63d9-443c-9c3d-bc37bebe61ea',  'Solid, perlu pengembangan strategic thinking.', CURRENT_DATE - 18),
  ('trv-05', 'fc90f329-b1d3-41ce-9ec8-683b2af3ce08', '2026-H1', 65, 60, 'tcl-5', '94dde282-3c16-4f5d-887f-59395dd1b4b4',   'Perlu coaching intensif pada people management.', CURRENT_DATE - 15)
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped talent_reviews: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO critical_positions (id, jabatan_id, reason, status) VALUES
  ('cp-01', 'demo-jab-gm-ops', 'Posisi strategis, mengendalikan seluruh operasional forwarding.', 'Active'),
  ('cp-02', 'demo-jab-mgr-ppjk', 'Kepabeanan adalah kompetensi inti bisnis, risiko tinggi bila kosong.', 'Active'),
  ('cp-03', 'demo-jab-gm-hr', 'Kunci keberlanjutan organisasi dan suksesi kepemimpinan.', 'Active')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped critical_positions: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO succession_plans (id, critical_position_id, karyawan_id, readiness_status, notes) VALUES
  ('sp-01', 'cp-01', 'af1f9c79-9add-4140-ba9d-a564fcda5bc8',   'Ready Within 1 Year', 'Perlu pengalaman lintas fungsi tambahan.'),
  ('sp-02', 'cp-02', 'f489b27a-5dee-490b-b578-4e750c4faff1',   'Ready Now',           'Sudah menjalankan tugas Manager secara acting selama 6 bulan.'),
  ('sp-03', 'cp-03', 'a512a9ac-2954-4bf0-a34e-7f71e515e346',     'Ready Within 6 Months','Menunggu hasil Assessment Center.')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped succession_plans: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO career_assessments (id, karyawan_id, period, performance_score, competency_score, skills_score, leadership_score, learning_score, attendance_score, discipline_score, innovation_score, experience_score, final_career_score, readiness_rule_id, assessment_date) VALUES
  ('ca-01', '1cd2c026-2b1b-479e-9282-58ac97a61028', '2026-H1', 82, 78, 80, 70, 85, 96, 100, 65, 70, 79.5, 'crr-3', CURRENT_DATE - 20),
  ('ca-02', 'f489b27a-5dee-490b-b578-4e750c4faff1',   '2026-H1', 91, 88, 85, 84, 90, 98, 100, 75, 85, 88.9, 'crr-2', CURRENT_DATE - 18),
  ('ca-03', 'a512a9ac-2954-4bf0-a34e-7f71e515e346',     '2026-H1', 90, 87, 88, 92, 88, 97, 100, 80, 90, 90.2, 'crr-1', CURRENT_DATE - 15),
  ('ca-04', '303e8e80-07bf-494c-99a3-8f7469d12eac',    '2026-H1', 76, 72, 75, 68, 70, 95, 95, 60, 75, 74.1, 'crr-3', CURRENT_DATE - 12)
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped career_assessments: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO individual_development_plans (id, karyawan_id, assessment_id, period, status) VALUES
  ('idp-01', '1cd2c026-2b1b-479e-9282-58ac97a61028', 'ca-01', '2026-H1', 'In Progress'),
  ('idp-02', '303e8e80-07bf-494c-99a3-8f7469d12eac',    'ca-04', '2026-H1', 'Draft')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped individual_development_plans: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO idp_items (id, idp_id, activity_type, description, target_date, pic_karyawan_id, status) VALUES
  ('idpi-01', 'idp-01', 'Training', 'Sertifikasi Ahli Kepabeanan Lanjutan', CURRENT_DATE + 60, 'af1f9c79-9add-4140-ba9d-a564fcda5bc8', 'In Progress'),
  ('idpi-02', 'idp-01', 'Coaching', 'Coaching leadership bulanan dengan Supervisor', CURRENT_DATE + 90, 'f489b27a-5dee-490b-b578-4e750c4faff1', 'Not Started'),
  ('idpi-03', 'idp-02', 'Job Rotation', 'Rotasi 3 bulan ke tim Procurement untuk pengalaman lintas fungsi', CURRENT_DATE + 120, 'ed9e51c3-f645-485b-aad7-5c9443a677b2', 'Not Started')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped idp_items: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO career_recommendations (id, karyawan_id, assessment_id, recommendation_type, target_jabatan_id, target_unit_id, reason, status) VALUES
  ('crec-01', 'f489b27a-5dee-490b-b578-4e750c4faff1', 'ca-02', 'Promotion', 'demo-jab-mgr-ppjk', 'demo-unit-ops', 'Career Score 88.9, sudah menjalankan tugas Manager secara acting.', 'Proposed'),
  ('crec-02', 'a512a9ac-2954-4bf0-a34e-7f71e515e346',   'ca-03', 'Promotion', 'demo-jab-gm-hr',    'demo-unit-hr',  'Career Score 90.2, kandidat teratas Leadership Pipeline.', 'Proposed')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped career_recommendations: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO career_transactions (id, karyawan_id, transaction_type, current_jabatan_id, current_unit_id, target_jabatan_id, target_unit_id, recommendation_id, effective_date, status, reason) VALUES
  ('ctx-01', 'f489b27a-5dee-490b-b578-4e750c4faff1', 'Promotion', 'demo-jab-spv-ppjk2', 'demo-unit-ops', 'demo-jab-mgr-ppjk', 'demo-unit-ops', 'crec-01', CURRENT_DATE + 30, 'In Review', 'Rekomendasi Career Development Engine.'),
  ('ctx-02', 'fc90f329-b1d3-41ce-9ec8-683b2af3ce08', 'Rotation', 'demo-jab-mgr-gudang', 'demo-unit-ops', 'demo-jab-mgr-armada', 'demo-unit-ops', NULL, CURRENT_DATE + 45, 'Draft', 'Pengembangan pengalaman lintas fungsi operasional.')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped career_transactions: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO career_approvals (id, transaction_id, step_number, approver_role, approver_karyawan_id, status) VALUES
  ('capp-01', 'ctx-01', 1, 'Department Head', '94dde282-3c16-4f5d-887f-59395dd1b4b4', 'Approved'),
  ('capp-02', 'ctx-01', 2, 'HR Director', 'b7b46400-4225-45ac-a4de-97af1a68da3c', 'Pending'),
  ('capp-03', 'ctx-01', 3, 'Career Committee', NULL, 'Pending'),
  ('capp-04', 'ctx-02', 1, 'Department Head', '94dde282-3c16-4f5d-887f-59395dd1b4b4', 'Pending')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped career_approvals: %', SQLERRM;
END $$;
