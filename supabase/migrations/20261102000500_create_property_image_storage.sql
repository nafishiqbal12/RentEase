-- RentEase property image storage.
-- Review and apply after the existing schema and security migrations.

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'property-images',
  'property-images',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = 10485760,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

create policy "Property owners can upload property images"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'property-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and exists (
    select 1
    from public.properties
    where properties.id::text = (storage.foldername(name))[2]
      and properties.owner_id = (select auth.uid())
  )
);

create policy "Property owners can update property images"
on storage.objects for update
to authenticated
using (
  bucket_id = 'property-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and exists (
    select 1
    from public.properties
    where properties.id::text = (storage.foldername(name))[2]
      and properties.owner_id = (select auth.uid())
  )
)
with check (
  bucket_id = 'property-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and exists (
    select 1
    from public.properties
    where properties.id::text = (storage.foldername(name))[2]
      and properties.owner_id = (select auth.uid())
  )
);

create policy "Property owners can delete property images"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'property-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and exists (
    select 1
    from public.properties
    where properties.id::text = (storage.foldername(name))[2]
      and properties.owner_id = (select auth.uid())
  )
);
