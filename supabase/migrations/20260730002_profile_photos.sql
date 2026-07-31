-- Profile photo support for every account (employee, department_manager,
-- hrd, director, superadmin). Session identity can resolve to either
-- `pengguna.id` (primary login path) or `karyawan.id` (legacy fallback auth
-- — see auth.ts tryEmployeesAuth), so the column is added to both tables
-- and resolved by email at read/write time, matching the established
-- dual-table-identity pattern used elsewhere in this app.
-- Apply via: Supabase Dashboard > SQL Editor

alter table pengguna add column if not exists photo_url text;
alter table karyawan add column if not exists photo_url text;

-- Storage bucket for profile photos. Unlike website-images (public insert,
-- since it's edited only by already-role-gated CMS actions), uploads here
-- go through a "use server" action (requireAuth + supabaseAdmin, i.e. the
-- service role, which bypasses RLS entirely) — so no public insert policy
-- is needed or wanted. Only a public read policy so <img> tags can load
-- the resulting public URL directly.
insert into storage.buckets (id, name, public)
values ('profile-photos', 'profile-photos', true)
on conflict (id) do nothing;

drop policy if exists "profile-photos public read" on storage.objects;
create policy "profile-photos public read"
on storage.objects for select
using (bucket_id = 'profile-photos');
