create or replace function public.notify_application_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  property_title text;
  owner_uuid uuid;
begin
  select title, owner_id
  into property_title, owner_uuid
  from public.properties
  where id = new.property_id;

  if tg_op = 'INSERT' then
    insert into public.notifications (user_id, title, description, category)
    values (
      owner_uuid,
      'New rental application',
      'A tenant submitted an application for ' || coalesce(property_title, 'your property') || '.',
      'application'
    );
  elsif tg_op = 'UPDATE' and new.status is distinct from old.status
    and new.status in ('approved', 'rejected') then
    insert into public.notifications (user_id, title, description, category)
    values (
      new.tenant_id,
      case when new.status = 'approved' then 'Application approved' else 'Application rejected' end,
      case
        when new.status = 'approved'
          then 'Your application for ' || coalesce(property_title, 'the property') || ' was approved. Your agreement is ready.'
        else 'Your application for ' || coalesce(property_title, 'the property') || ' was rejected.'
      end,
      'application'
    );
  end if;
  return new;
end;
$$;

drop trigger if exists applications_notify_event on public.applications;
create trigger applications_notify_event
after insert or update of status on public.applications
for each row execute function public.notify_application_event();

revoke execute on function public.notify_application_event() from public;

drop policy if exists "Owners can review applications for their properties" on public.applications;
drop policy if exists "Owners can reject pending applications" on public.applications;
create policy "Owners can reject pending applications"
on public.applications for update
to authenticated
using (public.is_owner_of_property(property_id) and status = 'pending')
with check (
  public.is_owner_of_property(property_id)
  and status = 'rejected'
  and reviewed_by = (select auth.uid())
  and reviewed_at is not null
);

create policy "Owners can view applicant profiles"
on public.profiles for select
to authenticated
using (
  exists (
    select 1
    from public.applications
    join public.properties on properties.id = applications.property_id
    where applications.tenant_id = profiles.id
      and properties.owner_id = (select auth.uid())
  )
);

create or replace function public.approve_rental_application(application_uuid uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  application_row record;
  lease_uuid uuid;
  lease_end date;
  payment_month integer;
  payment_due date;
begin
  select
    applications.id,
    applications.property_id,
    applications.tenant_id,
    applications.move_in_date,
    applications.status,
    properties.owner_id,
    properties.title,
    properties.monthly_rent,
    coalesce(properties.security_deposit, 0) as security_deposit,
    properties.status as property_status
  into application_row
  from public.applications
  join public.properties on properties.id = applications.property_id
  where applications.id = application_uuid
  for update of applications, properties;

  if not found then
    raise exception 'Application not found';
  end if;
  if application_row.owner_id <> (select auth.uid()) then
    raise exception 'Only the property owner can approve this application';
  end if;
  if application_row.status <> 'pending' then
    raise exception 'Only pending applications can be approved';
  end if;
  if application_row.property_status <> 'approved' then
    raise exception 'Only an approved available property can be rented';
  end if;
  if exists (
    select 1
    from public.leases
    where property_id = application_row.property_id
      and status = 'active'
      and start_date < (application_row.move_in_date + interval '12 months')::date
      and end_date > application_row.move_in_date
  ) then
    raise exception 'This property already has an active lease';
  end if;

  update public.applications
  set status = 'approved',
      reviewed_by = (select auth.uid()),
      reviewed_at = timezone('utc', now())
  where id = application_row.id;

  lease_end := (application_row.move_in_date + interval '12 months')::date;
  update public.properties
  set status = 'rented'
  where id = application_row.property_id;

  insert into public.leases (
    application_id, property_id, owner_id, tenant_id, monthly_rent,
    security_deposit, duration_months, start_date, end_date,
    payment_due_day, status, signed_at
  )
  values (
    application_row.id, application_row.property_id, application_row.owner_id,
    application_row.tenant_id, application_row.monthly_rent,
    application_row.security_deposit, 12, application_row.move_in_date,
    lease_end, 5, 'active', timezone('utc', now())
  )
  returning id into lease_uuid;

  for payment_month in 0..11 loop
    payment_due := make_date(
      extract(year from (application_row.move_in_date + (payment_month || ' months')::interval))::integer,
      extract(month from (application_row.move_in_date + (payment_month || ' months')::interval))::integer,
      5
    );
    insert into public.payments (
      lease_id, tenant_id, owner_id, amount, due_date, status
    )
    values (
      lease_uuid, application_row.tenant_id, application_row.owner_id,
      application_row.monthly_rent, payment_due, 'pending'
    );
  end loop;

  return lease_uuid;
end;
$$;

revoke all on function public.approve_rental_application(uuid) from public;
grant execute on function public.approve_rental_application(uuid) to authenticated;

create or replace function public.get_my_leases()
returns table (
  id uuid,
  property_id uuid,
  monthly_rent numeric,
  security_deposit numeric,
  duration_months integer,
  start_date date,
  end_date date,
  payment_due_day smallint,
  terms text[],
  document_path text,
  signed_at timestamptz,
  status public.lease_status,
  property_title text,
  property_address text,
  property_city text,
  owner_name text,
  tenant_name text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    leases.id, leases.property_id, leases.monthly_rent, leases.security_deposit,
    leases.duration_months, leases.start_date, leases.end_date,
    leases.payment_due_day, leases.terms, leases.document_path, leases.signed_at,
    leases.status, properties.title, properties.address, properties.city,
    owner_profile.full_name, tenant_profile.full_name
  from public.leases
  join public.properties on properties.id = leases.property_id
  join public.profiles owner_profile on owner_profile.id = leases.owner_id
  join public.profiles tenant_profile on tenant_profile.id = leases.tenant_id
  where leases.owner_id = (select auth.uid())
     or leases.tenant_id = (select auth.uid());
$$;

revoke all on function public.get_my_leases() from public;
grant execute on function public.get_my_leases() to authenticated;
