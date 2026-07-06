-- Storage bucket for Video Tutorial uploads (device upload, not just pasted links).
-- Apply via: Supabase Dashboard > SQL Editor

insert into storage.buckets (id, name, public)
values ('training-videos', 'training-videos', true)
on conflict (id) do nothing;

drop policy if exists "training-videos public read" on storage.objects;
create policy "training-videos public read"
on storage.objects for select
using (bucket_id = 'training-videos');

drop policy if exists "training-videos public insert" on storage.objects;
create policy "training-videos public insert"
on storage.objects for insert
with check (bucket_id = 'training-videos');

drop policy if exists "training-videos public update" on storage.objects;
create policy "training-videos public update"
on storage.objects for update
using (bucket_id = 'training-videos');
