# RentEase Project Audit

**Audit scope:** Source inspection of the React/Vite application, Supabase client, and all checked-in migrations.  
**Audit date:** 2026-11-04  
**Verification boundary:** `pnpm exec tsc --noEmit` and `pnpm exec vite build --outDir /tmp/rentease-audit-dist` both passed. No live Supabase project, authenticated users, deployed migration state, browser session, or production data was available; those areas are marked **Unverified** rather than assumed to work.

## A. Project Overview

RentEase is a React 19 + TypeScript application bundled with Vite 8. It uses `@supabase/supabase-js` for browser-side authentication and database access, Tailwind CSS v4 for styling, and Lucide icons. The application is a single-page workspace whose visible screen is controlled primarily by React state rather than URL routes.

The Supabase client in [`src/lib/supabase.ts`](src/lib/supabase.ts) uses `VITE_SUPABASE_URL` and the public anon key. No service-role key is exposed in the inspected source. Four checked-in migrations define the PostgreSQL schema, RLS hardening, property-image storage, and owner payment inserts.

## B. Feature Implementation Status

| Feature | Status | Evidence | Details |
|---|---|---|---|
| Tenant registration | **Working** | [`src/App.tsx`](src/App.tsx):441,521-535,1663-1673 | Auth signup collects tenant details and sends metadata; live confirmation/profile creation is unverified. |
| Owner registration | **Broken** | [`src/App.tsx`](src/App.tsx):433-439,1663-1684 | The form collects `role`, but the success callback and `register` function do not accept or send it. The profile therefore normally resolves as tenant/default, explaining owner-to-tenant redirection. |
| Login | **Working** | [`src/App.tsx`](src/App.tsx):1553-1648 | Supabase sign-in, loading, errors, profile load, and suspended-account rejection are implemented; live credentials/config are unverified. |
| Logout/session persistence | **Working** | [`src/App.tsx`](src/App.tsx):1553-1648 | Session restoration and sign-out are implemented; browser persistence cannot be verified without a running session. |
| Admin authentication | **Partial** | [`src/App.tsx`](src/App.tsx):80-107,1286-1538; migrations | Admin rendering/role checks exist. Live role data, RLS enforcement, and admin account setup are unverified. |
| Role-based dashboard redirection | **Partial** | [`src/App.tsx`](src/App.tsx):80-107,1286-1538,1682-1684 | Role rendering exists, but owner registration loses the selected role. |
| Protected routes | **Partial** | [`src/App.tsx`](src/App.tsx):80-107,1286-1538 | Workspace rendering is role-gated in client state, but there is no URL router/deep-link protection and server enforcement requires live RLS testing. |
| Browse approved properties | **Partial** | [`src/PropertySearch.tsx`](src/PropertySearch.tsx):784-847 | Query filters only `status = approved`; actual rows and RLS are unverified. |
| Search by location | **Broken** | [`src/PropertySearch.tsx`](src/PropertySearch.tsx):435-466 | Location is local state only; Search has no handler and does not alter the query. |
| Rent/type/availability/bedroom/amenity filters | **Broken** | [`src/PropertySearch.tsx`](src/PropertySearch.tsx):114-287,435-518 | Controls update local state but Apply filters never filters/refetches results. |
| Property sorting | **Broken** | [`src/PropertySearch.tsx`](src/PropertySearch.tsx):435-437,507-518 | Sort state is stored but never applied. |
| Property details | **Working** | [`src/PropertySearch.tsx`](src/PropertySearch.tsx):523-545,784-847 | Details/list/map UI is present; image data must be non-null or mapping may throw at `:821`. |
| Empty/error search states | **Partial** | [`src/PropertySearch.tsx`](src/PropertySearch.tsx):523-545 | Loading, query error, and empty states exist, but the empty message is always “No approved properties are available yet,” even for criteria with zero matches. |
| Submit rental application | **Working** | [`src/TenantApplications.tsx`](src/TenantApplications.tsx):43-138,157-220 | Supabase insert/listing, validation, duplicate handling, and feedback are implemented. |
| Application status | **Working** | [`src/TenantApplications.tsx`](src/TenantApplications.tsx):157-220 | Status display is backed by a query; live policy/data behavior is unverified. |
| Lease information | **Working** | [`src/AgreementScreen.tsx`](src/AgreementScreen.tsx):28-84 | Lease display and states are implemented. |
| Tenant payment history | **Working** | [`src/TenantPayments.tsx`](src/TenantPayments.tsx):23-74,91-116 | Payment history query and empty/error/loading states are implemented. |
| Tenant maintenance | **Broken** | [`src/TenantMaintenance.tsx`](src/TenantMaintenance.tsx):22-81,132-220 | Initial data and submission are local; no Supabase insert is performed. |
| Add/edit property | **Working** | [`src/OwnerProperties.tsx`](src/OwnerProperties.tsx):758-868 | Property persistence and image upload are implemented; storage/RLS/live bucket state are unverified. |
| Delete property | **Broken** | [`src/OwnerProperties.tsx`](src/OwnerProperties.tsx):906-908 | Delete only removes the item from React state; no database delete occurs. |
| Owner property listings | **Working** | [`src/OwnerProperties.tsx`](src/OwnerProperties.tsx) | Listing UI and owner query are present; live results/policies are unverified. |
| Upload property images | **Partial** | [`src/OwnerProperties.tsx`](src/OwnerProperties.tsx):758-868; [`supabase/migrations/20261102000500_create_property_image_storage.sql`](supabase/migrations/20261102000500_create_property_image_storage.sql) | Client upload and storage policies exist; public bucket exposure and live deployment remain concerns. |
| Approve/reject applications | **Working** | [`src/OwnerApplications.tsx`](src/OwnerApplications.tsx):40-115 | Owner update path and validation are present; database authorization is unverified. |
| Create draft lease | **Working** | [`src/OwnerApplications.tsx`](src/OwnerApplications.tsx):128-168 | Draft lease insert flow exists. |
| Activate draft lease | **Broken/Missing** | [`src/AdminDashboard.tsx`](src/AdminDashboard.tsx); [`src/App.tsx`](src/App.tsx):1522-1538 | Admin dashboard is static and no verified activation database operation was found. |
| Record owner payment | **Partial** | [`src/OwnerRentTracking.tsx`](src/OwnerRentTracking.tsx); [`supabase/migrations/20261103004000_allow_owner_payment_records.sql`](supabase/migrations/20261103004000_allow_owner_payment_records.sql) | Migration permits owner inserts, but rent tracking has a matching bug and permissive payment fields. |
| Outstanding rent calculation | **Broken** | [`src/OwnerRentTracking.tsx`](src/OwnerRentTracking.tsx):292 | Assignment (`item.id = payment.lease_id`) is used where comparison is required. |
| Owner maintenance monitoring | **Partial** | [`src/OwnerMaintenance.tsx`](src/OwnerMaintenance.tsx):1-230 | UI is present but static/non-persistent. |
| Admin user management | **Working** | [`src/AdminUsers.tsx`](src/AdminUsers.tsx):18-35 | Listing and suspend/activate persistence with feedback are implemented; admin RLS is unverified. |
| Admin property approval | **Broken/Missing** | [`src/AdminDashboard.tsx`](src/AdminDashboard.tsx):1-180 | Static UI without verified Supabase persistence. |
| Admin activities/reports | **Partial** | [`src/AdminReports.tsx`](src/AdminReports.tsx):41-106,177-182 | Reports query data; export behavior and output require verification. |
| Admin transactions | **Working** | [`src/AdminTransactions.tsx`](src/AdminTransactions.tsx):12-33 | Supabase query and states are implemented. |
| Complaints | **Broken** | [`src/ComplaintsScreen.tsx`](src/ComplaintsScreen.tsx):20-68,230-244,386-470 | Hardcoded/local state; no persistent create or status update. |
| Messages | **Broken** | [`src/MessagesScreen.tsx`](src/MessagesScreen.tsx):13-145,150-185,313 | Hardcoded/local state; sent messages are not inserted. |
| Notifications | **Broken** | [`src/NotificationsScreen.tsx`](src/NotificationsScreen.tsx):27-83,107-145 | Hardcoded/local read state; no persistence. |
| Reviews | **Broken** | [`src/ReviewsScreen.tsx`](src/ReviewsScreen.tsx):47-50,75-116 | Hardcoded data and local submission; no insert or tenancy validation. |
| Profile update | **Broken** | [`src/ProfileScreen.tsx`](src/ProfileScreen.tsx):9-14,72 | Save only sets a success flag; no profile update query. |
| TypeScript/build | **Working** | `tsc --noEmit`; `vite build --outDir /tmp/rentease-audit-dist` | Both passed during this audit. |

## C. Critical Bugs

1. **Owner signup role is discarded.** The registration form captures `role`, but `onSuccess` and `register` omit it. `loadProfile` then routes based on the stored/default profile role, commonly sending an owner to the tenant dashboard. See [`src/App.tsx`](src/App.tsx):433-439,521-535,1663-1684.
2. **Property search controls do not search.** Location, budget, property type, availability, and other controls never change the Supabase query or filter the loaded array. See [`src/PropertySearch.tsx`](src/PropertySearch.tsx):114-287,435-518.
3. **Property deletion is cosmetic.** The UI removes a card but leaves the database row intact. See [`src/OwnerProperties.tsx`](src/OwnerProperties.tsx):906-908.
4. **Rent tracking uses assignment as a comparison.** This can corrupt displayed matching state and produce incorrect payment/rent results. See [`src/OwnerRentTracking.tsx`](src/OwnerRentTracking.tsx):292.
5. **Admin approval/activation workflow is not wired.** The required property approval and lease activation steps are not demonstrated by persistent admin mutations in the inspected dashboard. See [`src/AdminDashboard.tsx`](src/AdminDashboard.tsx) and [`src/App.tsx`](src/App.tsx):1522-1538.
6. **Several core records are UI-only.** Maintenance, complaints, messages, notifications, reviews, and profile updates do not persist to Supabase.

## D. Database Issues

### Schema and workflow integrity

- The schema migration creates ten UUID-keyed tables with foreign keys and restrictive relationships in [`supabase/migrations/20261101224000_create_rentease_schema.sql`](supabase/migrations/20261101224000_create_rentease_schema.sql):26-187.
- `profiles.email` is required while `auth.users.email` can be null; the signup trigger inserts `new.email` directly. Existing users created before the trigger are not backfilled.
- There is no constraint preventing multiple approved applications or active leases for one property.
- Property `rented` status is not tied by a constraint to an active lease.
- Lease checks validate date ordering only, not property/application state.
- The payment uniqueness migration can fail on existing duplicates instead of resolving them: [`supabase/migrations/20261103004000_allow_owner_payment_records.sql`](supabase/migrations/20261103004000_allow_owner_payment_records.sql):4-30.

### CRUD and RLS

- RLS is enabled on application tables, but most policies test identity rather than active role/account status. A suspended or demoted former owner may retain access through ownership policies.
- No client/admin insert policy was found for notifications, so notification creation requires a trusted server path.
- Most tables have no delete policy. This may be intentional, but the application has no complete delete workflow for properties, applications, complaints, messages, maintenance, notifications, or reviews.
- Approved property reads require `authenticated`; anonymous browsing is not supported by the checked-in policies.
- Context-free messages can be inserted when context IDs are null, allowing unrelated direct messages under the permissive branch in [`supabase/migrations/20261101232000_harden_rentease_rls.sql`](supabase/migrations/20261101232000_harden_rentease_rls.sql):54-117,532-544.
- Clients can submit reviews with `verified = true`; there is no server/admin verification step.
- Owner payment inserts can set arbitrary status, method, and `paid_at`, and do not require an active lease or active owner account.

### Storage

The `property-images` bucket is explicitly public in [`supabase/migrations/20261102000500_create_property_image_storage.sql`](supabase/migrations/20261102000500_create_property_image_storage.sql):4-21. Upload/update/delete policies check authentication, UID-prefixed paths, and property ownership, but do not check account status or editable property status.

### Unverified database facts

The audit cannot prove that migrations are applied, tables/policies/triggers exist in the live project, grants are correct, environment variables point to the intended project, existing data satisfies constraints, or storage objects are accessible. These require Supabase dashboard/SQL and authenticated integration testing.

## E. Incomplete Features

The following screens are present but do not constitute complete backend features: maintenance requests, complaints, messages, notifications, reviews, profile editing, admin property approval, admin lease activation, and reliable property deletion. Search and sorting controls are also UI-only. Export reporting is wired to a UI action but its generated result was not verified.

Loading, validation, error, and success states are generally present on Supabase-backed forms. Static screens cannot surface server errors because they do not call the server.

## F. Security Issues

| Severity | Issue | Evidence |
|---|---|---|
| High | Owner payment policy permits client-controlled payment status, method, and paid timestamp. | [`supabase/migrations/20261103004000_allow_owner_payment_records.sql`](supabase/migrations/20261103004000_allow_owner_payment_records.sql):32-45 |
| High | Public property-image bucket allows anyone with/guessing an object URL to read images. | [`supabase/migrations/20261102000500_create_property_image_storage.sql`](supabase/migrations/20261102000500_create_property_image_storage.sql):4-21 |
| High | Suspended/demoted users are not consistently blocked by ownership policies. | [`supabase/migrations/20261101224000_create_rentease_schema.sql`](supabase/migrations/20261101224000_create_rentease_schema.sql):205-218,392-421,517-537 |
| Medium | Context-free message insertion can permit unrelated direct messages. | [`supabase/migrations/20261101232000_harden_rentease_rls.sql`](supabase/migrations/20261101232000_harden_rentease_rls.sql):54-117,532-544 |
| Medium | Clients can mark reviews as verified. | [`supabase/migrations/20261101224000_create_rentease_schema.sql`](supabase/migrations/20261101224000_create_rentease_schema.sql):591-606 |
| Medium | Client-side role gating is not a substitute for server authorization. | [`src/App.tsx`](src/App.tsx):80-107,1286-1538 |
| Unverified | Live key exposure, deployed policy state, JWT claims, privileges, and service-role handling. | [`src/lib/supabase.ts`](src/lib/supabase.ts):3-12; live environment required |

No service-role key or other secret was included in this report.

## G. Recommended Fixes

### Priority 1: Critical issues

1. Pass the selected role through registration, persist it safely through the profile creation path, and test tenant/owner/admin routing with fresh accounts.
2. Wire property search parameters into a validated Supabase query or a deterministic client-side filter, including location, min/max rent, type, availability, and approved status.
3. Replace cosmetic property deletion with an authorized database operation and handle related applications/leases according to an explicit business rule.
4. Fix the rent-tracking assignment/comparison bug and add payment matching tests.
5. Implement and authorize admin property approval and draft-lease activation mutations.

### Priority 2: Core functionality

1. Persist maintenance requests, complaints, messages, notifications, reviews, and profile updates.
2. Complete owner payment recording with server/database validation of lease, amount, status, date, and actor.
3. Add workflow constraints preventing conflicting applications/leases and invalid property state transitions.
4. Add integration tests for the full owner-admin-tenant workflow.

### Priority 3: Secondary features and hardening

1. Restrict image reads with a private bucket and signed URLs if images are not intentionally public.
2. Require active role/status in every relevant RLS policy.
3. Remove client control over review verification and sensitive payment fields.
4. Add notification creation/read/update policies and message participant validation.
5. Add URL routing/deep-link handling and user-facing search-specific empty states.

### Priority 4: Final verification

1. Apply migrations to a disposable Supabase project and run RLS tests as anonymous, tenant, owner, admin, suspended, and demoted users.
2. Run browser tests for loading, errors, empty results, duplicate submissions, refresh/session restoration, and unauthorized navigation.
3. Verify report export output, storage lifecycle cleanup, and database consistency after every workflow step.
4. Add CI type-check, build, lint/format, and integration-test commands.

## H. Final Project Completion Assessment

**Total feature areas inspected:** 35  
**Fully functional from static code evidence:** 12  
**Partially functional:** 10  
**Broken:** 11  
**Missing or not wired:** 2  
**Unverified due to lack of live Supabase/browser environment:** Applies to all database results, RLS enforcement, storage behavior, credentials, deployed migrations, and end-to-end runtime behavior.

These counts classify code paths, not successful production tests. A feature marked working means a coherent implementation was found in source; it does not claim that the live Supabase project accepts the operation.

## I. Testing Instructions

### Tenant workflow

1. Configure valid `VITE_SUPABASE_URL` and anon key for a disposable Supabase project with all migrations applied.
2. Register a fresh tenant; confirm a `profiles` row and tenant dashboard after refresh.
3. Log out and log back in; confirm session restoration and suspended-account rejection.
4. Create an approved property through the owner/admin workflow.
5. Search it using location, rent bounds, type, and availability independently; confirm each criterion changes results.
6. Open details, submit an application, refresh, and verify status persistence.
7. Activate a lease as admin; verify lease display, payment history, and outstanding amount.
8. Submit maintenance, complaint, message, review, and profile changes; refresh and confirm each persists.

### Owner workflow

1. Register a fresh owner and verify the owner dashboard (this currently exposes the known role bug).
2. Create a property with valid required fields and images; verify database row, storage objects, and owner listing.
3. Edit, refresh, and confirm changes; delete and confirm the database row is actually removed or archived.
4. Submit a tenant application, approve/reject it, and verify the tenant sees the status.
5. Create a draft lease and verify it remains draft until admin activation.
6. Record a payment with amount/date/status; refresh and verify owner and tenant histories and outstanding calculation.
7. Confirm an owner cannot access another owner’s records and a suspended owner is denied.

### Admin workflow

1. Use a separately provisioned admin profile; verify direct dashboard access and tenant/owner denial.
2. Verify all users load, suspend/activate persists, and suspended sessions are rejected.
3. Approve/reject a property and confirm tenant search visibility changes accordingly.
4. Activate a draft lease and confirm the owner/tenant workflow advances.
5. Verify reports and transactions reflect committed records, and test report export/download.
6. Attempt unauthorized reads/writes as anonymous, tenant, owner, suspended, and demoted users; record expected RLS denials.

