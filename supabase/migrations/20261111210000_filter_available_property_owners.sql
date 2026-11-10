create or replace function public.get_approved_property_owners(property_ids uuid[])
returns table (property_id uuid, owner_name text)
language sql
stable
security definer
set search_path = public
as $$
  select properties.id, profiles.full_name
  from public.properties
  join public.profiles on profiles.id = properties.owner_id
  where properties.id = any(property_ids)
    and properties.status = 'approved'
    and (
      properties.availability_date is null
      or properties.availability_date <= current_date
    );
$$;

revoke all on function public.get_approved_property_owners(uuid[]) from public;
grant execute on function public.get_approved_property_owners(uuid[]) to authenticated;

notify pgrst, 'reload schema';
