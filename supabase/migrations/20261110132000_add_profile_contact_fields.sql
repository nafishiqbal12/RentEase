-- Add profile contact fields used by the profile editor.
-- Existing profile rows remain unchanged.

alter table public.profiles
  add column if not exists address text
    check (address is null or char_length(address) <= 240),
  add column if not exists city text
    check (city is null or char_length(city) <= 120),
  add column if not exists area text
    check (area is null or char_length(area) <= 120),
  add column if not exists avatar_url text
    check (avatar_url is null or char_length(avatar_url) <= 2048);
