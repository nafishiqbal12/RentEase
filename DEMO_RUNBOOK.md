# RentEase demonstration runbook

## 1. Apply the database changes

Apply the checked-in migrations in timestamp order in the linked Supabase
project:

1. `supabase/migrations/20261101224000_create_rentease_schema.sql`
2. `supabase/migrations/20261101232000_harden_rentease_rls.sql`
3. `supabase/migrations/20261102000500_create_property_image_storage.sql`
4. `supabase/migrations/20261103004000_allow_owner_payment_records.sql`
5. `supabase/migrations/20261104150000_preserve_public_registration_role.sql`
6. `supabase/migrations/20261110130000_prevent_conflicting_active_leases.sql`
7. `supabase/migrations/20261110140000_add_property_favorites_and_search_details.sql`
8. `supabase/migrations/20261110150000_transactional_rental_approval.sql`
9. `supabase/migrations/20261110160000_mock_rent_payment_gateway.sql`
10. `supabase/migrations/20261110170000_maintenance_workflow.sql`
11. `supabase/migrations/20261110180000_complaint_workflow.sql`
12. `supabase/migrations/20261110190000_enable_realtime_messaging_notifications.sql`
13. `supabase/migrations/20261110200000_review_workflow.sql`
14. `supabase/migrations/20261110210000_property_verification_and_admin_workflow.sql`
15. `supabase/migrations/20261110220000_harden_message_participant_access.sql`
16. `supabase/migrations/20261111100000_allow_service_role_demo_seed.sql`

If the earlier migrations are already applied, apply only unapplied migrations
in timestamp order. Apply the lease migration only once; it creates the
`leases_prevent_active_conflict` trigger. Apply the search/favorites migration
once after the base schema. Apply the service-role seed migration only once
after the role-preservation migration. Do not manually rerun an already-applied
migration.
The lease migration creates the `leases_prevent_active_conflict` trigger and
does not repair or delete existing lease rows. The service-role seed migration
only permits the protected `service_role` process to reconcile its own demo
profiles; it does not change RLS or grant public/authenticated users access.

The storage migration creates or updates the public `property-images` bucket,
allows JPEG/PNG/WebP files up to 10 MB, and adds owner-scoped upload/update/
delete policies. No additional storage setup is required after it succeeds.

The mock payment migration adds `bank_transfer` and the authenticated-only
`pay_rent_mock` RPC. It does not expose the service-role key and does not allow
tenants to update payment rows directly.

The maintenance workflow migration adds owner notes, the `maintenance-photos`
bucket, and a trigger that notifies the tenant whenever an owner changes a
request status. Apply it once after the base schema and RLS migrations.

The complaint workflow migration adds admin replies and notifies the complaint
tenant whenever an Admin changes status or sends a reply. Apply it once.

The Realtime migration adds `messages` and `notifications` to the
`supabase_realtime` publication. It enables live conversations, notification
refresh, and unread badge updates; apply it once after the base schema.

The review workflow migration enforces one review per tenant and property and
allows reviews from active, expired, or terminated leases. It stops with a
clear error if existing duplicate reviews must be resolved first.

The property verification migration adds rejection reasons and notifies owners
when an Admin approves or rejects a property. It also supports the Admin user
suspend/activate workflow through the existing Admin-only profile policy.

The message hardening migration requires every message to belong to an active
lease, valid application/property relationship, or other valid rental context.
It prevents unrelated tenants from reading or sending messages.

## 9. Demonstrate rent payment

After an owner approves a tenant application, the transactional approval creates
the active agreement and its monthly payment rows. In the Tenant workspace,
open **Payments**, select a pending or overdue row, choose bKash, Nagad, Card,
or Bank transfer, and confirm. RentEase records the method, mock transaction
reference, and paid timestamp in `payments`, then creates notifications for the
tenant and owner. Use **Receipt** and **Print receipt** to show the persisted
receipt. Owner **Rent Tracking** and Admin **Transactions** read the same row.
The dashboard **Pay rent now** button opens the first pending or overdue row.

## 2. Create the three dedicated demo accounts

Use email addresses that belong only to this demonstration:

1. **Tenant:** Create `tenant.demo@rentease.local` either through Supabase
   Dashboard > Authentication > Users or through the RentEase registration
   screen with **Tenant** selected. Confirm the email and verify that the
   profile is active.
2. **Owner:** Create `owner.demo@rentease.local` through the RentEase
   registration screen with **Owner** selected. Confirm the email and verify
   that the profile has `role = 'owner'` and `status = 'active'`.
3. **Admin:** Create `admin.demo@rentease.local` through Supabase Dashboard >
   Authentication > Users. Do not use public registration for Admin. Confirm
   the email, then promote the automatically created profile using the
   transaction below.

Never put these passwords, a service-role key, or any secret in source code.

### Promote the Admin profile safely

First verify that the Auth trigger created exactly one profile:

```sql
select id, email, role, status
from public.profiles
where email = 'admin.demo@rentease.local';
```

Run the following transaction in the Supabase SQL editor as the project owner.
It temporarily disables only `profiles_role_guard` so the SQL-editor session
can promote the profile; the trigger must be re-enabled before the transaction
finishes. Never leave the trigger disabled.

```sql
begin;

alter table public.profiles
disable trigger profiles_role_guard;

do $$
begin
  if not exists (
    select 1
    from public.profiles
    where email = 'admin.demo@rentease.local'
  ) then
    raise exception 'Admin profile does not exist';
  end if;
end
$$;

update public.profiles
set role = 'admin',
    status = 'active'
where email = 'admin.demo@rentease.local';

alter table public.profiles
enable trigger profiles_role_guard;

commit;
```

If any statement fails before `commit`, immediately run:

```sql
rollback;
```

Then verify the trigger is enabled and the promotion succeeded:

```sql
select t.tgenabled
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname = 'profiles'
  and t.tgname = 'profiles_role_guard';

select id, email, role, status
from public.profiles
where email = 'admin.demo@rentease.local';
```

Expected results are `tgenabled = 'O'`, `role = 'admin'`, and
`status = 'active'`.

## 3. Complete workflow demonstration

1. Log in as the Owner and add a property with a title, location, rent,
   deposit, type, rooms, description, amenities, and an image. Confirm it is
   persisted as **Pending Verification**.
2. Log out and log in as the Admin. Open **Property Verification**, inspect the
   owner/property details, and approve the listing.
3. Log out and log in as the Tenant. Open **Search Properties**, search by
   city/area, apply rent/type/bedroom filters, open the approved listing, and
   submit an application.
4. Log in as the Owner. Open **Applications**, inspect the tenant details, and
   approve the application. Create a draft lease with dates, rent, deposit,
   due day, and terms.
5. Log in as the Admin. Activate the draft lease. The database prevents a
   conflicting active lease for the same property/date range.
6. Log in as the Tenant and open **Agreement** to show the active lease.
7. Use **Maintenance**, **Complaints**, **Messages**, **Notifications**, and
   **Reviews** only when their required lease/application state exists; each
   now reports empty states instead of presenting unsaved demo records.

## 4. Populate repeatable demo data

The TypeScript seed creates these confirmed accounts if they do not already
exist: `admin@rentease.test`, `owner1@rentease.test` through
`owner3@rentease.test`, and `tenant1@rentease.test` through
`tenant5@rentease.test`. It resolves the existing Samira account by Auth email
or profile email and never updates that account. Do not use any of these
addresses for real users.

Create a local `.env` (ignored by Git) containing only:

```dotenv
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
DEMO_PASSWORD=Demo@12345
```

Run the seed from the project root:

```bash
pnpm db:seed
```

The service-role key is server-only and must never be copied into `VITE_*`
variables or frontend code. The seed creates 30 labeled properties linked to
the three demo Owner profile IDs, 24 approved, 3 rented, and 3 pending
verification. Area names are included in each address because the current
properties schema has no area column; floor and facing are included in the
description for the same reason. Images use public `picsum.photos` URLs.

The seed is safe to run twice: it uses deterministic IDs and upserts, and it
does not delete data. Rerunning it reconciles only the labeled demo records; it
does not reset approval, application, lease, or payment status on unrelated
records. The script does not attach records to real accounts and will stop
before creating records if the existing Samira account cannot be found.

The older [`supabase/demo_seed.sql`](./supabase/demo_seed.sql) remains a
separate small SQL example and is not required when using `pnpm db:seed`.

## 5. Troubleshooting

If a screen reports a Supabase permission error, verify the migrations were
applied in order and that the signed-in profile has the expected role/status.
