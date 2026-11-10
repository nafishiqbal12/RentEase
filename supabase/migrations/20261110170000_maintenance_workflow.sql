alter table public.maintenance_requests
  add column if not exists owner_note text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'maintenance-photos',
  'maintenance-photos',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Tenants can upload maintenance photos" on storage.objects;
create policy "Tenants can upload maintenance photos"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'maintenance-photos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create or replace function public.notify_maintenance_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is distinct from old.status then
    insert into public.notifications (user_id, title, description, category)
    values (
      new.tenant_id,
      'Maintenance request updated',
      '“' || new.title || '” is now ' ||
        replace(initcap(new.status::text), '_', ' ') ||
        case
          when new.owner_note is null or char_length(trim(new.owner_note)) = 0 then '.'
          else '. Note: ' || trim(new.owner_note)
        end,
      'maintenance'
    );
  end if;
  return new;
end;
$$;

drop trigger if exists maintenance_status_notification on public.maintenance_requests;
create trigger maintenance_status_notification
after update of status on public.maintenance_requests
for each row
execute function public.notify_maintenance_status_change();
