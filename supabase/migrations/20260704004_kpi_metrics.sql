-- KPI Metrics breakdown (Metric|Bobot|Nilai per baris di KpiForm.tsx).
-- Skor Total dihitung otomatis dari rata-rata tertimbang metrics ini saat
-- metrics diisi; kolom score tetap dipakai sebagai input manual untuk
-- fallback ketika metrics kosong.
-- Apply via: Supabase Dashboard > SQL Editor

ALTER TABLE kpi_evaluations ADD COLUMN IF NOT EXISTS metrics JSONB;
