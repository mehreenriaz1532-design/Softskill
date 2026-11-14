-- Run once in Supabase > SQL Editor (any time after schema.sql).
-- Makes it impossible for a signed-in user to turn themselves (or anyone) into an admin through the website or API.
-- Admin status can only be granted from the Supabase SQL Editor, where auth.uid() is null.
create or replace function block_admin_flag_change() returns trigger
language plpgsql security definer set search_path=public as $$
begin
  if new.is_admin is distinct from old.is_admin and auth.uid() is not null then
    raise exception 'is_admin can only be changed from the Supabase SQL Editor';
  end if;
  return new;
end $$;

drop trigger if exists protect_admin_flag on profiles;
create trigger protect_admin_flag before update on profiles
  for each row execute function block_admin_flag_change();
