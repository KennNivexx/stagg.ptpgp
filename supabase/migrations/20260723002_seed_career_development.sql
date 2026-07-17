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
  ('cprof-01', 'demo-emp-staff-ppjk', 'str-04', 'lvl-05', 'demo-jab-spv-ppjk2', CURRENT_DATE - 30),
  ('cprof-02', 'demo-emp-spv-ppjk',   'str-01', 'lvl-06', 'demo-jab-mgr-ppjk',  CURRENT_DATE - 45),
  ('cprof-03', 'demo-emp-mgr-ppjk',   'str-01', 'lvl-07', 'demo-jab-gm-ops',    CURRENT_DATE - 20),
  ('cprof-04', 'demo-emp-mgr-hr',     'str-01', 'lvl-07', 'demo-jab-gm-hr',    CURRENT_DATE - 60),
  ('cprof-05', 'demo-emp-mgr-fin',    'str-01', 'lvl-07', 'demo-jab-gm-fin',    CURRENT_DATE - 15)
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped career_profiles: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO talent_pools (id, karyawan_id, current_jabatan_id, target_jabatan_id, status, entered_at, keterangan) VALUES
  ('tp-01', 'demo-emp-staff-ppjk', 'demo-jab-staff-ppjk2', 'demo-jab-spv-ppjk2', 'Development', CURRENT_DATE - 90, 'Kandidat kuat, sedang menyelesaikan sertifikasi kepabeanan.'),
  ('tp-02', 'demo-emp-spv-ppjk',   'demo-jab-spv-ppjk2',   'demo-jab-mgr-ppjk',  'Ready',       CURRENT_DATE - 200, 'Siap dipromosikan pada rotasi berikutnya.'),
  ('tp-03', 'demo-emp-mgr-hr',     'demo-jab-mgr-hr',      'demo-jab-gm-hr',     'Ready',       CURRENT_DATE - 150, 'Skor leadership tinggi, direkomendasikan Assessment Center.'),
  ('tp-04', 'demo-emp-mgr-fin',    'demo-jab-mgr-fin',     'demo-jab-gm-fin',    'On Hold',     CURRENT_DATE - 60, 'Menunggu ketersediaan posisi.')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped talent_pools: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO talent_reviews (id, karyawan_id, period, performance_score, potential_score, classification_id, reviewer_id, notes, review_date) VALUES
  ('trv-01', 'demo-emp-staff-ppjk', '2026-H1', 82, 78, 'tcl-3', 'demo-emp-mgr-ppjk', 'Konsisten, siap dikembangkan lebih lanjut.', CURRENT_DATE - 30),
  ('trv-02', 'demo-emp-spv-ppjk',   '2026-H1', 91, 88, 'tcl-1', 'demo-emp-gm-ops',   'High potential, kandidat suksesi kuat.', CURRENT_DATE - 25),
  ('trv-03', 'demo-emp-mgr-hr',     '2026-H1', 90, 87, 'tcl-1', 'demo-emp-dir-hr',   'Leadership dan engagement sangat baik.', CURRENT_DATE - 20),
  ('trv-04', 'demo-emp-mgr-fin',    '2026-H1', 76, 72, 'tcl-4', 'demo-emp-dir-fin',  'Solid, perlu pengembangan strategic thinking.', CURRENT_DATE - 18),
  ('trv-05', 'demo-emp-mgr-gudang', '2026-H1', 65, 60, 'tcl-5', 'demo-emp-gm-ops',   'Perlu coaching intensif pada people management.', CURRENT_DATE - 15)
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
  ('sp-01', 'cp-01', 'demo-emp-mgr-ppjk',   'Ready Within 1 Year', 'Perlu pengalaman lintas fungsi tambahan.'),
  ('sp-02', 'cp-02', 'demo-emp-spv-ppjk',   'Ready Now',           'Sudah menjalankan tugas Manager secara acting selama 6 bulan.'),
  ('sp-03', 'cp-03', 'demo-emp-mgr-hr',     'Ready Within 6 Months','Menunggu hasil Assessment Center.')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped succession_plans: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO career_assessments (id, karyawan_id, period, performance_score, competency_score, skills_score, leadership_score, learning_score, attendance_score, discipline_score, innovation_score, experience_score, final_career_score, readiness_rule_id, assessment_date) VALUES
  ('ca-01', 'demo-emp-staff-ppjk', '2026-H1', 82, 78, 80, 70, 85, 96, 100, 65, 70, 79.5, 'crr-3', CURRENT_DATE - 20),
  ('ca-02', 'demo-emp-spv-ppjk',   '2026-H1', 91, 88, 85, 84, 90, 98, 100, 75, 85, 88.9, 'crr-2', CURRENT_DATE - 18),
  ('ca-03', 'demo-emp-mgr-hr',     '2026-H1', 90, 87, 88, 92, 88, 97, 100, 80, 90, 90.2, 'crr-1', CURRENT_DATE - 15),
  ('ca-04', 'demo-emp-mgr-fin',    '2026-H1', 76, 72, 75, 68, 70, 95, 95, 60, 75, 74.1, 'crr-3', CURRENT_DATE - 12)
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped career_assessments: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO individual_development_plans (id, karyawan_id, assessment_id, period, status) VALUES
  ('idp-01', 'demo-emp-staff-ppjk', 'ca-01', '2026-H1', 'In Progress'),
  ('idp-02', 'demo-emp-mgr-fin',    'ca-04', '2026-H1', 'Draft')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped individual_development_plans: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO idp_items (id, idp_id, activity_type, description, target_date, pic_karyawan_id, status) VALUES
  ('idpi-01', 'idp-01', 'Training', 'Sertifikasi Ahli Kepabeanan Lanjutan', CURRENT_DATE + 60, 'demo-emp-mgr-ppjk', 'In Progress'),
  ('idpi-02', 'idp-01', 'Coaching', 'Coaching leadership bulanan dengan Supervisor', CURRENT_DATE + 90, 'demo-emp-spv-ppjk', 'Not Started'),
  ('idpi-03', 'idp-02', 'Job Rotation', 'Rotasi 3 bulan ke tim Procurement untuk pengalaman lintas fungsi', CURRENT_DATE + 120, 'demo-emp-gm-fin', 'Not Started')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped idp_items: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO career_recommendations (id, karyawan_id, assessment_id, recommendation_type, target_jabatan_id, target_unit_id, reason, status) VALUES
  ('crec-01', 'demo-emp-spv-ppjk', 'ca-02', 'Promotion', 'demo-jab-mgr-ppjk', 'demo-unit-ops', 'Career Score 88.9, sudah menjalankan tugas Manager secara acting.', 'Proposed'),
  ('crec-02', 'demo-emp-mgr-hr',   'ca-03', 'Promotion', 'demo-jab-gm-hr',    'demo-unit-hr',  'Career Score 90.2, kandidat teratas Leadership Pipeline.', 'Proposed')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped career_recommendations: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO career_transactions (id, karyawan_id, transaction_type, current_jabatan_id, current_unit_id, target_jabatan_id, target_unit_id, recommendation_id, effective_date, status, reason) VALUES
  ('ctx-01', 'demo-emp-spv-ppjk', 'Promotion', 'demo-jab-spv-ppjk2', 'demo-unit-ops', 'demo-jab-mgr-ppjk', 'demo-unit-ops', 'crec-01', CURRENT_DATE + 30, 'In Review', 'Rekomendasi Career Development Engine.'),
  ('ctx-02', 'demo-emp-mgr-gudang', 'Rotation', 'demo-jab-mgr-gudang', 'demo-unit-ops', 'demo-jab-mgr-armada', 'demo-unit-ops', NULL, CURRENT_DATE + 45, 'Draft', 'Pengembangan pengalaman lintas fungsi operasional.')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped career_transactions: %', SQLERRM;
END $$;

DO $$ BEGIN
INSERT INTO career_approvals (id, transaction_id, step_number, approver_role, approver_karyawan_id, status) VALUES
  ('capp-01', 'ctx-01', 1, 'Department Head', 'demo-emp-gm-ops', 'Approved'),
  ('capp-02', 'ctx-01', 2, 'HR Director', 'demo-emp-dir-hr', 'Pending'),
  ('capp-03', 'ctx-01', 3, 'Career Committee', NULL, 'Pending'),
  ('capp-04', 'ctx-02', 1, 'Department Head', 'demo-emp-gm-ops', 'Pending')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped career_approvals: %', SQLERRM;
END $$;
