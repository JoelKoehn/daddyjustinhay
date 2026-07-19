insert into storage.buckets (id, name, public)
values ('lot-media', 'lot-media', true)
on conflict (id) do nothing;

create policy "Public read access to lot media"
  on storage.objects for select
  using (bucket_id = 'lot-media');

create policy "Admins can upload lot media"
  on storage.objects for insert
  with check (
    bucket_id = 'lot-media'
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can delete lot media"
  on storage.objects for delete
  using (
    bucket_id = 'lot-media'
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
