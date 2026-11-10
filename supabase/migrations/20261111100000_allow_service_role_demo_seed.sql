-- Allow the protected service-role seed process to reconcile demo account roles.
-- This does not grant the public or authenticated roles any additional access.

create or replace function public.prevent_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(auth.jwt() ->> 'role', '') = 'service_role' then
    return new;
  end if;

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
