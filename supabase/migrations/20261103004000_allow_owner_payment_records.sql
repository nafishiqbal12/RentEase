-- Allow property owners to record one payment per lease and due date.
-- Existing duplicate rows are reported and block index creation; no rows are changed.

do $$
declare
  duplicate_count integer;
  duplicate_details text;
begin
  select count(*), string_agg(
    format('lease_id=%s, due_date=%s, rows=%s', lease_id, due_date, row_count),
    '; ' order by lease_id, due_date
  )
  into duplicate_count, duplicate_details
  from (
    select lease_id, due_date, count(*) as row_count
    from public.payments
    group by lease_id, due_date
    having count(*) > 1
  ) duplicates;

  if duplicate_count > 0 then
    raise exception 'Cannot create unique payment index: duplicate lease payment dates found'
      using detail = duplicate_details,
            hint = 'Resolve the reported duplicate payment rows manually, then rerun this migration.';
  end if;
end;
$$;

create unique index payments_lease_id_due_date_key
on public.payments (lease_id, due_date);

create policy "Owners can record payments for their leases"
on public.payments for insert
to authenticated
with check (
  owner_id = (select auth.uid())
  and exists (
    select 1
    from public.leases
    where leases.id = payments.lease_id
      and leases.owner_id = (select auth.uid())
      and payments.tenant_id = leases.tenant_id
      and payments.owner_id = leases.owner_id
  )
);
