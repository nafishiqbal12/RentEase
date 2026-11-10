-- RentEase initial application schema.
-- This migration is intentionally additive and has not been applied by this task.

create type public.user_role as enum ('tenant', 'owner', 'admin');
create type public.account_status as enum ('active', 'suspended');
create type public.listing_status as enum ('pending_verification', 'approved', 'rejected', 'rented');
create type public.application_status as enum ('pending', 'approved', 'rejected', 'cancelled');
create type public.lease_status as enum ('draft', 'active', 'expired', 'terminated');
create type public.payment_status as enum ('pending', 'paid', 'overdue', 'failed', 'refunded');
create type public.payment_method as enum ('bkash', 'nagad', 'card');
create type public.maintenance_status as enum ('pending', 'assigned', 'in_progress', 'completed');
create type public.maintenance_urgency as enum ('low', 'medium', 'high', 'emergency');
create type public.complaint_status as enum ('submitted', 'in_review', 'resolved');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null check (char_length(trim(full_name)) between 1 and 120),
  email text not null check (char_length(email) <= 320),
  phone text check (phone is null or char_length(phone) <= 40),
  role public.user_role not null default 'tenant',
  status public.account_status not null default 'active',
  location text check (location is null or char_length(location) <= 160),
  verified_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.properties (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete restrict,
  title text not null check (char_length(trim(title)) between 1 and 160),
  description text,
  property_type text not null check (property_type in ('apartment', 'house', 'room', 'office')),
  address text not null,
  city text not null default 'Dhaka',
  bedrooms integer not null default 0 check (bedrooms >= 0),
  bathrooms numeric(4, 1) not null default 0 check (bathrooms >= 0),
  size_sq_ft integer check (size_sq_ft is null or size_sq_ft > 0),
  monthly_rent numeric(12, 2) not null check (monthly_rent > 0),
  security_deposit numeric(12, 2) check (security_deposit is null or security_deposit >= 0),
  availability_date date,
  amenities text[] not null default '{}',
  image_urls text[] not null default '{}',
  status public.listing_status not null default 'pending_verification',
  verified_by uuid references public.profiles (id) on delete set null,
  verified_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete restrict,
  tenant_id uuid not null references public.profiles (id) on delete restrict,
  move_in_date date not null,
  occupants integer not null default 1 check (occupants > 0),
  occupation text check (occupation is null or char_length(occupation) <= 160),
  message text,
  id_document_path text,
  status public.application_status not null default 'pending',
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (property_id, tenant_id)
);

create table public.leases (
  id uuid primary key default gen_random_uuid(),
  application_id uuid unique references public.applications (id) on delete restrict,
  property_id uuid not null references public.properties (id) on delete restrict,
  owner_id uuid not null references public.profiles (id) on delete restrict,
  tenant_id uuid not null references public.profiles (id) on delete restrict,
  monthly_rent numeric(12, 2) not null check (monthly_rent > 0),
  security_deposit numeric(12, 2) not null default 0 check (security_deposit >= 0),
  duration_months integer not null check (duration_months > 0),
  start_date date not null,
  end_date date not null,
  payment_due_day smallint not null default 5 check (payment_due_day between 1 and 28),
  terms text[] not null default '{}',
  document_path text,
  status public.lease_status not null default 'draft',
  signed_at timestamptz,
  terminated_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (end_date > start_date),
  check (terminated_at is null or status = 'terminated')
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  lease_id uuid not null references public.leases (id) on delete restrict,
  tenant_id uuid not null references public.profiles (id) on delete restrict,
  owner_id uuid not null references public.profiles (id) on delete restrict,
  amount numeric(12, 2) not null check (amount > 0),
  currency text not null default 'BDT' check (currency = 'BDT'),
  due_date date not null,
  paid_at timestamptz,
  method public.payment_method,
  status public.payment_status not null default 'pending',
  provider_reference text unique,
  receipt_path text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check ((status = 'paid') = (paid_at is not null))
);

create table public.maintenance_requests (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete restrict,
  lease_id uuid references public.leases (id) on delete set null,
  tenant_id uuid not null references public.profiles (id) on delete restrict,
  assigned_to uuid references public.profiles (id) on delete set null,
  title text not null check (char_length(trim(title)) between 1 and 160),
  description text not null,
  category text not null check (category in ('plumbing', 'electrical', 'appliance', 'structural', 'other')),
  urgency public.maintenance_urgency not null default 'medium',
  photo_path text,
  status public.maintenance_status not null default 'pending',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.complaints (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.profiles (id) on delete restrict,
  property_id uuid references public.properties (id) on delete set null,
  lease_id uuid references public.leases (id) on delete set null,
  subject text not null check (char_length(trim(subject)) between 1 and 200),
  description text not null,
  attachment_path text,
  status public.complaint_status not null default 'submitted',
  resolved_by uuid references public.profiles (id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles (id) on delete restrict,
  recipient_id uuid not null references public.profiles (id) on delete restrict,
  property_id uuid references public.properties (id) on delete set null,
  lease_id uuid references public.leases (id) on delete set null,
  application_id uuid references public.applications (id) on delete set null,
  body text not null check (char_length(trim(body)) between 1 and 5000),
  read_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  check (sender_id <> recipient_id)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 200),
  description text not null,
  category text not null default 'general',
  read_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  lease_id uuid not null references public.leases (id) on delete restrict,
  property_id uuid not null references public.properties (id) on delete restrict,
  tenant_id uuid not null references public.profiles (id) on delete restrict,
  owner_id uuid not null references public.profiles (id) on delete restrict,
  property_rating smallint not null check (property_rating between 1 and 5),
  owner_rating smallint not null check (owner_rating between 1 and 5),
  body text not null check (char_length(trim(body)) between 1 and 5000),
  verified boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (lease_id, tenant_id)
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'admin'
      and status = 'active'
  );
$$;

create or replace function public.is_owner_of_property(property_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.properties
    where id = property_uuid
      and owner_id = (select auth.uid())
  );
$$;

create or replace function public.is_lease_participant(lease_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.leases
    where id = lease_uuid
      and ((owner_id = (select auth.uid())) or (tenant_id = (select auth.uid())))
  );
$$;

create or replace function public.prevent_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' and new.role <> 'tenant' and not public.is_admin() then
    raise exception 'Only an administrator can assign elevated roles';
  end if;

  if tg_op = 'UPDATE'
    and (new.role is distinct from old.role
      or new.status is distinct from old.status
      or new.verified_at is distinct from old.verified_at)
    and not public.is_admin()
  then
    raise exception 'Only an administrator can change profile access fields';
  end if;

  return new;
end;
$$;

create or replace function public.assign_user_role(target_user_id uuid, target_role public.user_role)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_profile public.profiles;
begin
  if not public.is_admin() then
    raise exception 'Administrator role required';
  end if;

  update public.profiles
  set role = target_role
  where id = target_user_id
  returning * into updated_profile;

  if updated_profile.id is null then
    raise exception 'Profile not found';
  end if;

  return updated_profile;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, phone)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), 'RentEase User'),
    new.email,
    nullif(trim(new.raw_user_meta_data ->> 'phone'), '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger profiles_role_guard
before insert or update on public.profiles
for each row execute function public.prevent_role_escalation();

create trigger properties_updated_at
before update on public.properties
for each row execute function public.set_updated_at();

create trigger applications_updated_at
before update on public.applications
for each row execute function public.set_updated_at();

create trigger leases_updated_at
before update on public.leases
for each row execute function public.set_updated_at();

create trigger payments_updated_at
before update on public.payments
for each row execute function public.set_updated_at();

create trigger maintenance_requests_updated_at
before update on public.maintenance_requests
for each row execute function public.set_updated_at();

create trigger complaints_updated_at
before update on public.complaints
for each row execute function public.set_updated_at();

create trigger reviews_updated_at
before update on public.reviews
for each row execute function public.set_updated_at();

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create index properties_owner_id_idx on public.properties (owner_id);
create index properties_status_city_idx on public.properties (status, city);
create index applications_property_id_idx on public.applications (property_id);
create index applications_tenant_id_idx on public.applications (tenant_id);
create index applications_status_idx on public.applications (status);
create index leases_tenant_id_idx on public.leases (tenant_id);
create index leases_owner_id_idx on public.leases (owner_id);
create index leases_property_id_idx on public.leases (property_id);
create index leases_status_idx on public.leases (status);
create index payments_lease_due_date_idx on public.payments (lease_id, due_date);
create index payments_tenant_status_idx on public.payments (tenant_id, status);
create index maintenance_property_status_idx on public.maintenance_requests (property_id, status);
create index maintenance_tenant_id_idx on public.maintenance_requests (tenant_id);
create index complaints_tenant_status_idx on public.complaints (tenant_id, status);
create index complaints_property_id_idx on public.complaints (property_id);
create index messages_recipient_created_idx on public.messages (recipient_id, created_at desc);
create index messages_sender_created_idx on public.messages (sender_id, created_at desc);
create index notifications_user_created_idx on public.notifications (user_id, created_at desc);
create index reviews_property_id_idx on public.reviews (property_id);

alter table public.profiles enable row level security;
alter table public.properties enable row level security;
alter table public.applications enable row level security;
alter table public.leases enable row level security;
alter table public.payments enable row level security;
alter table public.maintenance_requests enable row level security;
alter table public.complaints enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;
alter table public.reviews enable row level security;

create policy "Profiles are visible to the user and admins"
on public.profiles for select
to authenticated
using ((id = (select auth.uid())) or public.is_admin());

create policy "Users can update their profile fields"
on public.profiles for update
to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

create policy "Admins can manage profiles"
on public.profiles for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Approved properties are searchable"
on public.properties for select
to authenticated
using ((status = 'approved') or owner_id = (select auth.uid()) or public.is_admin());

create policy "Owners can create properties"
on public.properties for insert
to authenticated
with check (
  owner_id = (select auth.uid())
  and status = 'pending_verification'
  and verified_by is null
  and verified_at is null
  and exists (
    select 1 from public.profiles where id = (select auth.uid()) and role = 'owner'
  )
);

create policy "Owners can update their pending properties"
on public.properties for update
to authenticated
using (owner_id = (select auth.uid()) and status in ('pending_verification', 'rejected'))
with check (
  owner_id = (select auth.uid())
  and status in ('pending_verification', 'rejected')
  and verified_by is null
  and verified_at is null
);

create policy "Admins can manage properties"
on public.properties for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Tenants can view their applications"
on public.applications for select
to authenticated
using (tenant_id = (select auth.uid()) or public.is_owner_of_property(property_id) or public.is_admin());

create policy "Tenants can submit applications"
on public.applications for insert
to authenticated
with check (
  tenant_id = (select auth.uid())
  and status = 'pending'
  and reviewed_by is null
  and reviewed_at is null
  and exists (
    select 1 from public.profiles where id = (select auth.uid()) and role = 'tenant'
  )
);

create policy "Tenants can cancel pending applications"
on public.applications for update
to authenticated
using (tenant_id = (select auth.uid()) and status = 'pending')
with check (tenant_id = (select auth.uid()) and status = 'cancelled');

create policy "Owners can review applications for their properties"
on public.applications for update
to authenticated
using (public.is_owner_of_property(property_id) and status = 'pending')
with check (public.is_owner_of_property(property_id) and status in ('approved', 'rejected'));

create policy "Admins can manage applications"
on public.applications for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Lease participants can view leases"
on public.leases for select
to authenticated
using (public.is_lease_participant(id) or public.is_admin());

create policy "Owners can create draft leases"
on public.leases for insert
to authenticated
with check (
  owner_id = (select auth.uid())
  and status = 'draft'
  and public.is_owner_of_property(property_id)
  and exists (
    select 1
    from public.applications
    where applications.id = leases.application_id
      and applications.property_id = leases.property_id
      and applications.tenant_id = leases.tenant_id
      and applications.status = 'approved'
  )
);

create policy "Only admins can modify leases after creation"
on public.leases for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can delete leases"
on public.leases for delete
to authenticated
using (public.is_admin());

create policy "Lease participants can view payments"
on public.payments for select
to authenticated
using ((tenant_id = (select auth.uid())) or (owner_id = (select auth.uid())) or public.is_admin());

create policy "Only admins or trusted server processes can write payments"
on public.payments for insert
to authenticated
with check (public.is_admin());

create policy "Only admins can update payments"
on public.payments for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Only admins can delete payments"
on public.payments for delete
to authenticated
using (public.is_admin());

create policy "Maintenance participants can view requests"
on public.maintenance_requests for select
to authenticated
using (
  tenant_id = (select auth.uid())
  or public.is_owner_of_property(property_id)
  or assigned_to = (select auth.uid())
  or public.is_admin()
);

create policy "Tenants can create maintenance requests"
on public.maintenance_requests for insert
to authenticated
with check (
  tenant_id = (select auth.uid())
  and status = 'pending'
  and assigned_to is null
  and public.is_lease_participant(lease_id)
);

create policy "Owners and admins can update maintenance requests"
on public.maintenance_requests for update
to authenticated
using (public.is_owner_of_property(property_id) or public.is_admin())
with check (public.is_owner_of_property(property_id) or public.is_admin());

create policy "Tenants can view their complaints"
on public.complaints for select
to authenticated
using (tenant_id = (select auth.uid()) or public.is_admin() or (property_id is not null and public.is_owner_of_property(property_id)));

create policy "Tenants can create complaints"
on public.complaints for insert
to authenticated
with check (tenant_id = (select auth.uid()));

create policy "Admins can manage complaints"
on public.complaints for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Message participants can view messages"
on public.messages for select
to authenticated
using ((sender_id = (select auth.uid())) or (recipient_id = (select auth.uid())) or public.is_admin());

create policy "Users can send messages as themselves"
on public.messages for insert
to authenticated
with check (sender_id = (select auth.uid()));

create policy "Recipients can mark messages read"
on public.messages for update
to authenticated
using (recipient_id = (select auth.uid()))
with check (recipient_id = (select auth.uid()));

create policy "Users can view their notifications"
on public.notifications for select
to authenticated
using (user_id = (select auth.uid()) or public.is_admin());

create policy "Users can mark their notifications read"
on public.notifications for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "Tenants can view reviews"
on public.reviews for select
to authenticated
using (true);

create policy "Tenants can submit reviews for completed leases"
on public.reviews for insert
to authenticated
with check (
  tenant_id = (select auth.uid())
  and exists (
    select 1
    from public.leases
    where id = lease_id
      and tenant_id = (select auth.uid())
      and status in ('expired', 'terminated')
      and property_id = reviews.property_id
      and owner_id = reviews.owner_id
  )
  and verified = true
);

create policy "Admins can manage reviews"
on public.reviews for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

revoke execute on function public.assign_user_role(uuid, public.user_role) from public;
revoke execute on function public.is_admin() from public;
revoke execute on function public.is_owner_of_property(uuid) from public;
revoke execute on function public.is_lease_participant(uuid) from public;
grant execute on function public.assign_user_role(uuid, public.user_role) to authenticated;
