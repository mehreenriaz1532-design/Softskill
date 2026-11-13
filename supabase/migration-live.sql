-- Run once in Supabase > SQL Editor, AFTER schema.sql.
create table live_classes(
  id uuid primary key default gen_random_uuid(),
  title text not null, description text,
  starts_at timestamptz not null,
  course_id uuid references courses on delete cascade,  -- null = open to every signed-in student
  created_at timestamptz default now());

-- the Zoom/Meet link is kept apart so it stays hidden until the student is allowed in
create table live_links(
  class_id uuid primary key references live_classes on delete cascade,
  url text not null);

alter table live_classes enable row level security;
alter table live_links enable row level security;

create policy "live list read" on live_classes for select to authenticated using (true);
create policy "admin write" on live_classes for all to authenticated using (is_admin()) with check (is_admin());

create policy "live link read when allowed" on live_links for select to authenticated using (
  is_admin() or exists(select 1 from live_classes c where c.id=class_id and (c.course_id is null or has_access(c.course_id))));
create policy "admin write" on live_links for all to authenticated using (is_admin()) with check (is_admin());
