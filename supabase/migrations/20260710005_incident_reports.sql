-- Laporan Insiden/Kerusakan — generik untuk semua departemen (bukan hanya
-- operasional/logistik). Karyawan melapor, kepala departemennya yang
-- menindaklanjuti (approval scoping sama seperti leave_requests/business_trips).
CREATE TABLE IF NOT EXISTS incident_reports (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL,
  employee_name TEXT NOT NULL DEFAULT '',
  department TEXT DEFAULT '',
  vehicle_id TEXT,               -- opsional, FK ke vehicles.id kalau terkait kendaraan
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  severity TEXT NOT NULL DEFAULT 'Ringan', -- Ringan, Sedang, Berat
  photo_url TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Dilaporkan', -- Dilaporkan, Ditindaklanjuti, Selesai
  resolved_by TEXT DEFAULT '',
  resolution_notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_incident_reports_employee ON incident_reports(employee_id);
CREATE INDEX IF NOT EXISTS idx_incident_reports_department ON incident_reports(department);
CREATE INDEX IF NOT EXISTS idx_incident_reports_status ON incident_reports(status);

insert into storage.buckets (id, name, public)
values ('incident-photos', 'incident-photos', true)
on conflict (id) do nothing;

drop policy if exists "incident-photos public read" on storage.objects;
create policy "incident-photos public read"
on storage.objects for select
using (bucket_id = 'incident-photos');

drop policy if exists "incident-photos public insert" on storage.objects;
create policy "incident-photos public insert"
on storage.objects for insert
with check (bucket_id = 'incident-photos');
