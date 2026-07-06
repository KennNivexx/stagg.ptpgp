-- Storage bucket for public website image uploads (hero, gallery, services,
-- about, certification, teaser, testimonial). This bucket was referenced in
-- code (src/app/superadmin/website/_lib/upload.ts) but never actually
-- created in this Supabase project, so every "Unggah dari perangkat" image
-- upload across the website CMS was failing with "Bucket not found".
-- Apply via: Supabase Dashboard > SQL Editor

insert into storage.buckets (id, name, public)
values ('website-images', 'website-images', true)
on conflict (id) do nothing;

drop policy if exists "website-images public read" on storage.objects;
create policy "website-images public read"
on storage.objects for select
using (bucket_id = 'website-images');

drop policy if exists "website-images public insert" on storage.objects;
create policy "website-images public insert"
on storage.objects for insert
with check (bucket_id = 'website-images');

drop policy if exists "website-images public update" on storage.objects;
create policy "website-images public update"
on storage.objects for update
using (bucket_id = 'website-images');
