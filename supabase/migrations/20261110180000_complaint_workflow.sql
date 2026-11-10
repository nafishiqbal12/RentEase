alter table public.complaints
  add column if not exists admin_reply text;

create or replace function public.notify_complaint_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  update_text text;
begin
  if new.status is distinct from old.status
     or new.admin_reply is distinct from old.admin_reply then
    update_text := 'Status: ' || replace(initcap(new.status::text), '_', ' ');
    if new.admin_reply is not null and char_length(trim(new.admin_reply)) > 0 then
      update_text := update_text || '. Admin reply: ' || trim(new.admin_reply);
    end if;

    insert into public.notifications (user_id, title, description, category)
    values (
      new.tenant_id,
      'Complaint updated',
      'Your complaint “' || new.subject || '” was updated. ' || update_text,
      'complaint'
    );
  end if;
  return new;
end;
$$;

drop trigger if exists complaint_update_notification on public.complaints;
create trigger complaint_update_notification
after update of status, admin_reply on public.complaints
for each row
execute function public.notify_complaint_update();
