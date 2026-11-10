create or replace function public.activate_rental_lease(lease_uuid uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  lease_row record;
  payment_month integer;
  payment_due date;
begin
  if not public.is_admin() then
    raise exception 'Only an active administrator can activate leases';
  end if;

  select leases.*, properties.status as property_status, properties.title
  into lease_row
  from public.leases
  join public.properties on properties.id = leases.property_id
  where leases.id = lease_uuid
  for update of leases, properties;

  if not found then
    raise exception 'Lease not found';
  end if;
  if lease_row.status <> 'draft' then
    raise exception 'Only draft leases can be activated';
  end if;
  if lease_row.property_status not in ('approved', 'rented') then
    raise exception 'The property must be approved before lease activation';
  end if;
  if exists (
    select 1
    from public.leases
    where property_id = lease_row.property_id
      and status = 'active'
      and id <> lease_row.id
      and start_date < lease_row.end_date
      and end_date > lease_row.start_date
  ) then
    raise exception 'This property already has a conflicting active lease';
  end if;

  update public.leases
  set status = 'active',
      signed_at = timezone('utc', now())
  where id = lease_row.id;

  update public.properties
  set status = 'rented'
  where id = lease_row.property_id;

  for payment_month in 0..(lease_row.duration_months - 1) loop
    payment_due := make_date(
      extract(year from (lease_row.start_date + (payment_month || ' months')::interval))::integer,
      extract(month from (lease_row.start_date + (payment_month || ' months')::interval))::integer,
      lease_row.payment_due_day
    );
    insert into public.payments (
      lease_id, tenant_id, owner_id, amount, due_date, status
    )
    values (
      lease_row.id, lease_row.tenant_id, lease_row.owner_id,
      lease_row.monthly_rent, payment_due, 'pending'
    );
  end loop;

  insert into public.notifications (user_id, title, description, category)
  values
    (
      lease_row.tenant_id,
      'Agreement activated',
      'Your rental agreement for ' || lease_row.title || ' is now active.',
      'lease'
    ),
    (
      lease_row.owner_id,
      'Agreement activated',
      'The rental agreement for ' || lease_row.title || ' is now active.',
      'lease'
    );

  return lease_row.id;
end;
$$;

revoke all on function public.activate_rental_lease(uuid) from public;
grant execute on function public.activate_rental_lease(uuid) to authenticated;

revoke all on function public.approve_rental_application(uuid) from authenticated;

notify pgrst, 'reload schema';
