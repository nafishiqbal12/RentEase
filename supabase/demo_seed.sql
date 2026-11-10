-- RentEase demo seed (safe to run repeatedly).
--
-- Before running, create these three accounts in Supabase Auth:
--   tenant.demo@rentease.local
--   owner.demo@rentease.local
--   admin.demo@rentease.local
-- Never put passwords in this file. Assign the admin role only from the
-- Supabase SQL editor while signed in as the project owner:
--   update public.profiles set role = 'admin' where email = 'admin.demo@rentease.local';
--
-- The seed uses existing profiles and therefore cannot create fake users or
-- attach records to a real account accidentally.

do $$
declare
  owner_uuid uuid;
  tenant_uuid uuid;
  property_uuid uuid;
begin
  select id into owner_uuid
  from public.profiles
  where email = 'owner.demo@rentease.local'
    and role = 'owner'
    and status = 'active';

  select id into tenant_uuid
  from public.profiles
  where email = 'tenant.demo@rentease.local'
    and role = 'tenant'
    and status = 'active';

  if owner_uuid is null then
    raise exception 'Create owner.demo@rentease.local and confirm it before running this seed';
  end if;

  insert into public.properties (
    owner_id, title, description, property_type, address, city,
    bedrooms, bathrooms, size_sq_ft, monthly_rent, security_deposit,
    availability_date, amenities, status
  )
  select
    owner_uuid,
    'DEMO - Dhanmondi Family Apartment',
    'Clearly labeled demonstration listing for the RentEase workflow.',
    'apartment',
    'Road 8A, Dhanmondi',
    'Dhaka',
    3,
    2,
    1450,
    38000,
    76000,
    current_date,
    array['Lift', '24/7 Security', 'Generator'],
    'pending_verification'
  where not exists (
    select 1
    from public.properties
    where owner_id = owner_uuid
      and title = 'DEMO - Dhanmondi Family Apartment'
  )
  returning id into property_uuid;

  if property_uuid is null then
    select id into property_uuid
    from public.properties
    where owner_id = owner_uuid
      and title = 'DEMO - Dhanmondi Family Apartment'
    limit 1;
  end if;

  if tenant_uuid is not null and not exists (
    select 1
    from public.applications
    where property_id = property_uuid
      and tenant_id = tenant_uuid
  ) then
    insert into public.applications (
      property_id, tenant_id, move_in_date, occupants, occupation, message
    )
    values (
      property_uuid, tenant_uuid, current_date + 14, 2,
      'University demonstrator',
      'DEMO application: use this record to demonstrate owner review.'
    );
  end if;
end;
$$;
