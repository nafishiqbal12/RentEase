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
        where leases.id = lease_uuid
          and leases.property_id = property_uuid
          and (
            (leases.owner_id = sender_uuid and leases.tenant_id = recipient_uuid)
            or (leases.owner_id = recipient_uuid and leases.tenant_id = sender_uuid)
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
    );
$$;

drop policy if exists "Message participants can view messages" on public.messages;
create policy "Message participants can view messages"
on public.messages for select
to authenticated
using (
  (sender_id = (select auth.uid()) or recipient_id = (select auth.uid()))
  and (
    public.is_admin()
    or public.is_valid_message_context(
      sender_id,
      recipient_id,
      property_id,
      lease_id,
      application_id
    )
  )
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
using (
  recipient_id = (select auth.uid())
  and public.is_valid_message_context(
    sender_id,
    recipient_id,
    property_id,
    lease_id,
    application_id
  )
)
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

revoke execute on function public.is_valid_message_context(uuid, uuid, uuid, uuid, uuid) from public;
revoke execute on function public.is_valid_message_context(uuid, uuid, uuid, uuid, uuid) from authenticated;
