-- Prevent two active leases from occupying the same property at the same time.

create or replace function public.validate_active_lease_conflict()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'active' and exists (
    select 1
    from public.leases
    where property_id = new.property_id
      and status = 'active'
      and id <> new.id
      and start_date < new.end_date
      and end_date > new.start_date
  ) then
    raise exception 'This property already has a conflicting active lease';
  end if;
  return new;
end;
$$;

create trigger leases_prevent_active_conflict
before insert or update on public.leases
for each row execute function public.validate_active_lease_conflict();

revoke execute on function public.validate_active_lease_conflict() from public;
