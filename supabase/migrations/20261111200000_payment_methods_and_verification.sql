alter type public.payment_method add value if not exists 'rocket';
alter type public.payment_method add value if not exists 'visa';
alter type public.payment_method add value if not exists 'mastercard';

alter table public.payments
  add column if not exists verification_status text not null default 'manual_unverified'
    check (verification_status in ('manual_unverified', 'verified'));

drop policy if exists "Only admins or trusted server processes can write payments"
  on public.payments;

create policy "Authorized users can record payments"
on public.payments for insert
to authenticated
with check (
  (
    public.is_admin()
    or (
      owner_id = (select auth.uid())
      and exists (
        select 1
        from public.leases
        where leases.id = lease_id
          and leases.owner_id = (select auth.uid())
      )
    )
  )
  and status in ('pending', 'paid', 'overdue')
  and verification_status = 'manual_unverified'
);

create or replace function public.pay_rent_mock(
  payment_uuid uuid,
  payment_method public.payment_method
)
returns table (
  id uuid,
  provider_reference text,
  paid_at timestamptz,
  status public.payment_status
)
language plpgsql
security definer
set search_path = public
as $$
declare
  payment_row record;
  transaction_id text;
  payment_timestamp timestamptz := timezone('utc', now());
begin
  if payment_method not in ('bkash', 'nagad', 'rocket', 'visa', 'mastercard', 'card', 'bank_transfer') then
    raise exception 'Unsupported payment method';
  end if;

  select payments.id, payments.owner_id, payments.tenant_id, payments.amount,
    payments.status, properties.title
  into payment_row
  from public.payments
  join public.leases on leases.id = payments.lease_id
  join public.properties on properties.id = leases.property_id
  where payments.id = payment_uuid
  for update of payments;

  if not found then
    raise exception 'Payment not found';
  end if;
  if payment_row.tenant_id <> (select auth.uid()) then
    raise exception 'Only the payment tenant can confirm this payment';
  end if;
  if payment_row.status not in ('pending', 'overdue') then
    raise exception 'Only pending or overdue payments can be paid';
  end if;

  transaction_id := 'MOCK-' || upper(substr(replace(payment_uuid::text, '-', ''), 1, 16));

  update public.payments
  set status = 'paid',
      method = payment_method,
      provider_reference = transaction_id,
      paid_at = payment_timestamp,
      verification_status = 'manual_unverified'
  where payments.id = payment_uuid;

  insert into public.notifications (user_id, title, description, category)
  values
    (
      payment_row.tenant_id,
      'Rent payment recorded',
      'Your payment of ৳' || to_char(payment_row.amount, 'FM999,999,999,990.00')
        || ' for ' || payment_row.title || ' was recorded as manual/unverified. Transaction: ' || transaction_id || '.',
      'payment'
    ),
    (
      payment_row.owner_id,
      'Rent payment recorded',
      'A rent payment of ৳' || to_char(payment_row.amount, 'FM999,999,999,990.00')
        || ' for ' || payment_row.title || ' was recorded as manual/unverified. Transaction: ' || transaction_id || '.',
      'payment'
    );

  return query
  select payments.id, payments.provider_reference, payments.paid_at, payments.status
  from public.payments
  where payments.id = payment_uuid;
end;
$$;

revoke all on function public.pay_rent_mock(uuid, public.payment_method) from public;
grant execute on function public.pay_rent_mock(uuid, public.payment_method) to authenticated;

notify pgrst, 'reload schema';
