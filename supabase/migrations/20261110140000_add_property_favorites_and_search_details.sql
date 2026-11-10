create table public.property_favorites (
  user_id uuid not null references public.profiles (id) on delete cascade,
  property_id uuid not null references public.properties (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, property_id)
);

alter table public.property_favorites enable row level security;

create policy "Users can view their property favorites"
on public.property_favorites for select
to authenticated
using (user_id = (select auth.uid()));

create policy "Users can add their property favorites"
on public.property_favorites for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.properties
    where id = property_id
      and status = 'approved'
  )
);

create policy "Users can remove their property favorites"
on public.property_favorites for delete
to authenticated
using (user_id = (select auth.uid()));

create or replace function public.get_approved_property_owners(property_ids uuid[])
returns table (property_id uuid, owner_name text)
language sql
stable
security definer
set search_path = public
as $$
  select properties.id, profiles.full_name
  from public.properties
  join public.profiles on profiles.id = properties.owner_id
  where properties.id = any(property_ids)
    and properties.status = 'approved';
$$;

create or replace function public.get_approved_property_reviews(property_uuid uuid)
returns table (
  property_rating smallint,
  owner_rating smallint,
  body text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select reviews.property_rating, reviews.owner_rating, reviews.body, reviews.created_at
  from public.reviews
  join public.properties on properties.id = reviews.property_id
  where reviews.property_id = property_uuid
    and properties.status = 'approved'
  order by reviews.created_at desc;
$$;

revoke all on function public.get_approved_property_owners(uuid[]) from public;
grant execute on function public.get_approved_property_owners(uuid[]) to authenticated;
revoke all on function public.get_approved_property_reviews(uuid) from public;
grant execute on function public.get_approved_property_reviews(uuid) to authenticated;
