-- Preserve the public Tenant/Owner registration choice without allowing Admin
-- accounts to be created through public authentication metadata.

create or replace function public.prevent_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' and new.role = 'admin' and not public.is_admin() then
    raise exception 'Only an administrator can assign the admin role';
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

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role text;
  profile_role public.user_role;
begin
  requested_role := lower(trim(coalesce(new.raw_user_meta_data ->> 'role', 'tenant')));
  profile_role := case requested_role
    when 'owner' then 'owner'::public.user_role
    else 'tenant'::public.user_role
  end;

  insert into public.profiles (id, full_name, email, phone, role)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), 'RentEase User'),
    new.email,
    nullif(trim(new.raw_user_meta_data ->> 'phone'), ''),
    profile_role
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
