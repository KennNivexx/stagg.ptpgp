-- Storage bucket for internal HRD document uploads (SOP documents, company
-- documents) — supports device upload as an alternative to pasting a link.
-- Apply via: Supabase Dashboard > SQL Editor

-- sop_documents never had a document_url column even though saveSop() (before
-- this fix) already tried to read a "document_url" form field and the list UI
-- already renders sop.document_url as an external-link icon — the link typed
-- by the user was silently discarded on every save.
ALTER TABLE sop_documents ADD COLUMN IF NOT EXISTS document_url TEXT;

insert into storage.buckets (id, name, public)
values ('hrd-files', 'hrd-files', true)
on conflict (id) do nothing;

drop policy if exists "hrd-files public read" on storage.objects;
create policy "hrd-files public read"
on storage.objects for select
using (bucket_id = 'hrd-files');

drop policy if exists "hrd-files public insert" on storage.objects;
create policy "hrd-files public insert"
on storage.objects for insert
with check (bucket_id = 'hrd-files');

drop policy if exists "hrd-files public update" on storage.objects;
create policy "hrd-files public update"
on storage.objects for update
using (bucket_id = 'hrd-files');
