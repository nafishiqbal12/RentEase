-- RentEase security hardening.
-- This migration assumes 20261101224000_create_rentease_schema.sql was applied.
-- It is intentionally unapplied by this task.

create or replace function public.is_valid_lease_context(
  lease_uuid uuid,
  property_uuid uuid,
  tenant_uuid uuid
)
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
      and property_id = property_uuid
      and tenant_id = tenant_uuid
  );
$$;

create or replace function public.is_valid_complaint_context(
  tenant_uuid uuid,
  property_uuid uuid,
  lease_uuid uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    (
      lease_uuid is not null
      and public.is_valid_lease_context(lease_uuid, property_uuid, tenant_uuid)
    )
    or (
      lease_uuid is null
      and property_uuid is not null
      and exists (
        select 1
        from public.applications
        where applications.property_id = property_uuid
          and applications.tenant_id = tenant_uuid
          and applications.status in ('pending', 'approved')
      )
    );
$$;

create or replace function public.is_valid_message_context(
  sender_uuid uuid,
  recipient_uuid uuid,
  property_uuid uuid,
  lease_uuid uuid,
  application_uuid uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    (
      lease_uuid is not null
      and application_uuid is null
      and exists (
        select 1
        from public.leases
        where id = lease_uuid
          and property_id = property_uuid
          and (
            (owner_id = sender_uuid and tenant_id = recipient_uuid)
            or (owner_id = recipient_uuid and tenant_id = sender_uuid)
          )
      )
    )
    or (
      application_uuid is not null
      and lease_uuid is null
      and exists (
        select 1
        from public.applications
        join public.properties on properties.id = applications.property_id
        where applications.id = application_uuid
          and applications.property_id = property_uuid
          and (
            (applications.tenant_id = sender_uuid and properties.owner_id = recipient_uuid)
            or (applications.tenant_id = recipient_uuid and properties.owner_id = sender_uuid)
          )
      )
    )
    or (
      property_uuid is not null
      and lease_uuid is null
      and application_uuid is null
      and exists (
        select 1
        from public.properties
        join public.applications on applications.property_id = properties.id
        where properties.id = property_uuid
          and applications.status in ('pending', 'approved')
          and (
            (properties.owner_id = sender_uuid and applications.tenant_id = recipient_uuid)
            or (properties.owner_id = recipient_uuid and applications.tenant_id = sender_uuid)
          )
      )
    )
    or (
      property_uuid is null
      and lease_uuid is null
      and application_uuid is null
    );
$$;

create or replace function public.validate_profile_identity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  auth_email text;
begin
  select email into auth_email from auth.users where id = new.id;
  if auth_email is null or new.email is distinct from auth_email then
    raise exception 'Profile email must match the authenticated user email';
  end if;
  return new;
end;
$$;

create or replace function public.sync_profile_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set email = new.email
  where id = new.id
    and email is distinct from new.email;
  return new;
end;
$$;

create or replace function public.validate_property_workflow()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'UPDATE' and new.owner_id is distinct from old.owner_id)
    or (new.status in ('approved', 'rented') and (
      new.verified_by is null
      or new.verified_at is null
      or new.owner_id = new.verified_by
      or not exists (
        select 1
        from public.profiles
        where id = new.verified_by
          and role = 'admin'
          and status = 'active'
      )
    ))
  then
    raise exception 'Property ownership and verification workflow is immutable';
  end if;
  return new;
end;
$$;

create or replace function public.validate_application_workflow()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.property_id is distinct from old.property_id
    or new.tenant_id is distinct from old.tenant_id
    or new.move_in_date is distinct from old.move_in_date
    or new.occupants is distinct from old.occupants
    or new.occupation is distinct from old.occupation
    or new.message is distinct from old.message
    or new.id_document_path is distinct from old.id_document_path
  then
    raise exception 'Application identity and submitted fields are immutable';
  end if;

  if new.status = 'cancelled' and old.status <> 'pending' then
    raise exception 'Only pending applications can be cancelled';
  end if;

  if new.status in ('approved', 'rejected')
    and (new.reviewed_by is null or new.reviewed_at is null)
  then
    raise exception 'Application decisions require reviewer metadata';
  end if;

  if new.status = 'cancelled'
    and (new.reviewed_by is distinct from old.reviewed_by
      or new.reviewed_at is distinct from old.reviewed_at)
  then
    raise exception 'Cancelled applications cannot receive review metadata';
  end if;

  return new;
end;
$$;

create or replace function public.validate_lease_workflow()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.properties
    where id = new.property_id
      and owner_id = new.owner_id
  ) then
    raise exception 'Lease owner and property do not match';
  end if;

  if new.application_id is not null
    and not exists (
      select 1
      from public.applications
      where id = new.application_id
        and property_id = new.property_id
        and tenant_id = new.tenant_id
        and status = 'approved'
    )
  then
    raise exception 'Lease must reference the approved tenant application';
  end if;

  if new.status in ('active', 'expired', 'terminated') and new.signed_at is null then
    raise exception 'Active or completed leases require a signature timestamp';
  end if;

  return new;
end;
$$;

create or replace function public.validate_payment_workflow()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.leases
    where id = new.lease_id
      and owner_id = new.owner_id
      and tenant_id = new.tenant_id
  ) then
    raise exception 'Payment parties must match the lease';
  end if;

  if tg_op = 'UPDATE' and (
    new.lease_id is distinct from old.lease_id
    or new.tenant_id is distinct from old.tenant_id
    or new.owner_id is distinct from old.owner_id
    or new.amount is distinct from old.amount
    or new.currency is distinct from old.currency
    or new.due_date is distinct from old.due_date
  ) then
    raise exception 'Payment identity and amount fields are immutable';
  end if;

  return new;
end;
$$;

create or replace function public.validate_maintenance_context()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.lease_id is null
    or not public.is_valid_lease_context(new.lease_id, new.property_id, new.tenant_id)
  then
    raise exception 'Maintenance request must belong to the tenant lease and property';
  end if;

  if tg_op = 'UPDATE' and (
    new.property_id is distinct from old.property_id
    or new.lease_id is distinct from old.lease_id
    or new.tenant_id is distinct from old.tenant_id
  ) then
    raise exception 'Maintenance ownership and relationship fields are immutable';
  end if;

  return new;
end;
$$;

create or replace function public.validate_complaint_context()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_valid_complaint_context(new.tenant_id, new.property_id, new.lease_id) then
    raise exception 'Complaint does not belong to the tenant property context';
  end if;

  if tg_op = 'UPDATE' and (
    new.tenant_id is distinct from old.tenant_id
    or new.property_id is distinct from old.property_id
    or new.lease_id is distinct from old.lease_id
  ) then
    raise exception 'Complaint ownership and relationship fields are immutable';
  end if;

  return new;
end;
$$;

create or replace function public.validate_message_context()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_valid_message_context(
    new.sender_id,
    new.recipient_id,
    new.property_id,
    new.lease_id,
    new.application_id
  ) then
    raise exception 'Message context does not match the participants';
  end if;

  if tg_op = 'UPDATE' and (
    new.sender_id is distinct from old.sender_id
    or new.recipient_id is distinct from old.recipient_id
    or new.property_id is distinct from old.property_id
    or new.lease_id is distinct from old.lease_id
    or new.application_id is distinct from old.application_id
    or new.body is distinct from old.body
    or new.created_at is distinct from old.created_at
  ) then
    raise exception 'Only message read state can be updated';
  end if;

  return new;
end;
$$;

create trigger profiles_validate_identity
before insert or update on public.profiles
for each row execute function public.validate_profile_identity();

create trigger auth_users_sync_profile_email
after update of email on auth.users
for each row
when (old.email is distinct from new.email)
execute function public.sync_profile_email();

create trigger properties_validate_workflow
before update on public.properties
for each row execute function public.validate_property_workflow();

create trigger applications_validate_workflow
before update on public.applications
for each row execute function public.validate_application_workflow();

create trigger leases_validate_workflow
before insert or update on public.leases
for each row execute function public.validate_lease_workflow();

create trigger payments_validate_workflow
before insert or update on public.payments
for each row execute function public.validate_payment_workflow();

create trigger maintenance_validate_context
before insert or update on public.maintenance_requests
for each row execute function public.validate_maintenance_context();

create trigger complaints_validate_context
before insert or update on public.complaints
for each row execute function public.validate_complaint_context();

create trigger messages_validate_context
before insert or update on public.messages
for each row execute function public.validate_message_context();

grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_owner_of_property(uuid) to authenticated;
grant execute on function public.is_lease_participant(uuid) to authenticated;
revoke execute on function public.is_valid_lease_context(uuid, uuid, uuid) from public;
revoke execute on function public.is_valid_complaint_context(uuid, uuid, uuid) from public;
revoke execute on function public.is_valid_message_context(uuid, uuid, uuid, uuid, uuid) from public;
revoke execute on function public.is_valid_lease_context(uuid, uuid, uuid) from authenticated;
revoke execute on function public.is_valid_complaint_context(uuid, uuid, uuid) from authenticated;
revoke execute on function public.is_valid_message_context(uuid, uuid, uuid, uuid, uuid) from authenticated;
revoke execute on function public.validate_profile_identity() from public;
revoke execute on function public.sync_profile_email() from public;
revoke execute on function public.validate_property_workflow() from public;
revoke execute on function public.validate_application_workflow() from public;
revoke execute on function public.validate_lease_workflow() from public;
revoke execute on function public.validate_payment_workflow() from public;
revoke execute on function public.validate_maintenance_context() from public;
revoke execute on function public.validate_complaint_context() from public;
revoke execute on function public.validate_message_context() from public;
revoke execute on function public.prevent_role_escalation() from public;
revoke execute on function public.handle_new_user() from public;
revoke execute on function public.assign_user_role(uuid, public.user_role) from anon;
revoke execute on function public.assign_user_role(uuid, public.user_role) from public;

drop policy if exists "Users can update their profile fields" on public.profiles;
create policy "Users can update their profile fields"
on public.profiles for update
to authenticated
using (id = (select auth.uid()))
with check (
  id = (select auth.uid())
);

drop policy if exists "Owners can update their pending properties" on public.properties;
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

drop policy if exists "Tenants can cancel pending applications" on public.applications;
create policy "Tenants can cancel pending applications"
on public.applications for update
to authenticated
using (tenant_id = (select auth.uid()) and status = 'pending')
with check (
  tenant_id = (select auth.uid())
  and status = 'cancelled'
  and reviewed_by is null
  and reviewed_at is null
);

drop policy if exists "Owners can review applications for their properties" on public.applications;
create policy "Owners can review applications for their properties"
on public.applications for update
to authenticated
using (public.is_owner_of_property(property_id) and status = 'pending')
with check (
  public.is_owner_of_property(property_id)
  and status in ('approved', 'rejected')
  and reviewed_by = (select auth.uid())
  and reviewed_at is not null
);

drop policy if exists "Only admins or trusted server processes can write payments" on public.payments;
create policy "Only admins or trusted server processes can write payments"
on public.payments for insert
to authenticated
with check (
  public.is_admin()
  and status = 'pending'
  and paid_at is null
);

drop policy if exists "Only admins can update payments" on public.payments;
create policy "Only admins can update payments"
on public.payments for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Tenants can create maintenance requests" on public.maintenance_requests;
create policy "Tenants can create maintenance requests"
on public.maintenance_requests for insert
to authenticated
with check (
  tenant_id = (select auth.uid())
  and status = 'pending'
  and assigned_to is null
  and public.is_valid_lease_context(lease_id, property_id, tenant_id)
);

drop policy if exists "Owners and admins can update maintenance requests" on public.maintenance_requests;
create policy "Owners and admins can update maintenance requests"
on public.maintenance_requests for update
to authenticated
using (public.is_owner_of_property(property_id) or public.is_admin())
with check (
  (public.is_owner_of_property(property_id) or public.is_admin())
  and public.is_valid_lease_context(lease_id, property_id, tenant_id)
);

drop policy if exists "Tenants can create complaints" on public.complaints;
create policy "Tenants can create complaints"
on public.complaints for insert
to authenticated
with check (
  tenant_id = (select auth.uid())
  and public.is_valid_complaint_context(tenant_id, property_id, lease_id)
);

drop policy if exists "Admins can manage complaints" on public.complaints;
create policy "Admins can manage complaints"
on public.complaints for update
to authenticated
using (public.is_admin())
with check (
  public.is_admin()
  and public.is_valid_complaint_context(tenant_id, property_id, lease_id)
);

drop policy if exists "Users can send messages as themselves" on public.messages;
create policy "Users can send messages as themselves"
on public.messages for insert
to authenticated
with check (
  sender_id = (select auth.uid())
  and public.is_valid_message_context(
    sender_id,
    recipient_id,
    property_id,
    lease_id,
    application_id
  )
);

drop policy if exists "Recipients can mark messages read" on public.messages;
create policy "Recipients can mark messages read"
on public.messages for update
to authenticated
using (recipient_id = (select auth.uid()))
with check (
  recipient_id = (select auth.uid())
  and public.is_valid_message_context(
    sender_id,
    recipient_id,
    property_id,
    lease_id,
    application_id
  )
);
