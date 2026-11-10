do $$
declare
  duplicate_count integer;
begin
  select count(*)
  into duplicate_count
  from (
    select tenant_id, property_id
    from public.reviews
    group by tenant_id, property_id
    having count(*) > 1
  ) duplicates;

  if duplicate_count > 0 then
    raise exception 'Cannot enforce one review per tenant and property: duplicate reviews exist';
  end if;
end;
$$;

create unique index if not exists reviews_tenant_property_key
on public.reviews (tenant_id, property_id);

drop policy if exists "Tenants can submit reviews for completed leases" on public.reviews;
create policy "Tenants can submit reviews for active or past leases"
on public.reviews for insert
to authenticated
with check (
  tenant_id = (select auth.uid())
  and exists (
    select 1
    from public.leases
    where leases.id = reviews.lease_id
      and leases.tenant_id = (select auth.uid())
      and leases.status in ('active', 'expired', 'terminated')
      and leases.property_id = reviews.property_id
      and leases.owner_id = reviews.owner_id
  )
  and verified = true
);
