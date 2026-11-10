alter table public.properties
  add column if not exists area text
    check (area is null or char_length(area) <= 120);

update public.properties
set area = case
  when address ilike '%Dhanmondi%' then 'Dhanmondi'
  when address ilike '%Kalabagan%' then 'Kalabagan'
  when address ilike '%Shahbag%' then 'Shahbag'
  when address ilike '%Ramna%' then 'Ramna'
  when address ilike '%Segunbagicha%' then 'Segunbagicha'
  when address ilike '%Motijheel%' then 'Motijheel'
  when address ilike '%Paltan%' then 'Paltan'
  when address ilike '%Gulistan%' then 'Gulistan'
  when address ilike '%Wari%' then 'Wari'
  when address ilike '%Sutrapur%' then 'Sutrapur'
  when address ilike '%Lalbagh%' then 'Lalbagh'
  when address ilike '%Chawkbazar%' then 'Chawkbazar'
  when address ilike '%Kotwali%' then 'Kotwali (Old Dhaka)'
  when address ilike '%Hazaribagh%' then 'Hazaribagh'
  when address ilike '%Kamrangirchar%' then 'Kamrangirchar'
  when address ilike '%Malibagh%' then 'Malibagh'
  when address ilike '%Shantinagar%' then 'Shantinagar'
  when address ilike '%Khilgaon%' then 'Khilgaon'
  when address ilike '%Basabo%' then 'Basabo'
  when address ilike '%Mugda%' then 'Mugda'
  when address ilike '%Jatrabari%' then 'Jatrabari'
  when address ilike '%Demra%' then 'Demra'
  else area
end
where area is null;

create index if not exists properties_city_area_idx
  on public.properties (city, area);

notify pgrst, 'reload schema';
