alter table public.properties
  add column if not exists rejection_reason text;

create or replace function public.notify_property_verification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is distinct from old.status
     and new.status in ('approved', 'rejected') then
    insert into public.notifications (user_id, title, description, category)
    values (
      new.owner_id,
      case
        when new.status = 'approved' then 'Property approved'
        else 'Property needs changes'
      end,
      case
        when new.status = 'approved'
          then 'Your property “' || new.title || '” is now approved and visible to tenants.'
        else 'Your property “' || new.title || '” was rejected.'
          || case
               when new.rejection_reason is null or char_length(trim(new.rejection_reason)) = 0 then ''
               else ' Reason: ' || trim(new.rejection_reason)
             end
      end,
      'property'
    );
  end if;
  return new;
end;
$$;

drop trigger if exists property_verification_notification on public.properties;
create trigger property_verification_notification
after update of status on public.properties
for each row
execute function public.notify_property_verification();
