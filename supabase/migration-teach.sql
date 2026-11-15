-- Run once in Supabase > SQL Editor, after the other migrations.
-- Instructor role + course builder: sections, draft/publish, scheduled release of lessons.

alter table profiles add column if not exists is_instructor boolean not null default false;
alter table courses add column if not exists owner_id uuid references profiles(id) on delete set null;
alter table courses add column if not exists status text not null default 'published' check (status in ('draft','published'));

create table sections(
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses on delete cascade,
  title text not null, position int not null default 0,
  created_at timestamptz default now());
alter table lessons add column if not exists section_id uuid references sections(id) on delete set null;
alter table lessons add column if not exists release_at timestamptz;   -- lesson stays locked until this time
create index on sections(course_id,position);
create index on lessons(section_id);
create index on courses(owner_id);

-- Only the owner of a course (an instructor) or an admin can change it. Nobody can grant themselves the role:
-- the trigger below blocks is_admin / is_instructor changes from the website; roles are set from the admin panel (server) or SQL Editor.
create or replace function is_instructor() returns boolean language sql stable security definer set search_path=public as
$$ select coalesce((select is_instructor from profiles where id=auth.uid()),false) $$;

create or replace function owns_course(cid uuid) returns boolean language sql stable security definer set search_path=public as
$$ select is_admin() or exists(select 1 from courses c where c.id=cid and c.owner_id=auth.uid() and is_instructor()) $$;

create or replace function has_access(cid uuid) returns boolean language sql stable security definer set search_path=public as
$$ select owns_course(cid)
   or exists(select 1 from courses c where c.id=cid and c.price=0)
   or exists(select 1 from payments p join courses c on c.id=p.course_id
             where p.user_id=auth.uid() and p.status='approved' and (p.course_id=cid or c.is_bundle)) $$;

create or replace function block_admin_flag_change() returns trigger
language plpgsql security definer set search_path=public as $$
begin
  if (new.is_admin is distinct from old.is_admin or new.is_instructor is distinct from old.is_instructor) and auth.uid() is not null then
    raise exception 'Roles can only be changed by the admin panel or the Supabase SQL Editor';
  end if;
  return new;
end $$;
drop trigger if exists protect_admin_flag on profiles;
create trigger protect_admin_flag before update on profiles for each row execute function block_admin_flag_change();

-- Courses: students and visitors see published courses only; owners and admins also see their drafts.
drop policy if exists "catalog read" on courses;
create policy "published or own" on courses for select to anon, authenticated using (status='published' or owns_course(id));
-- Instructors cannot create bundles (a bundle would unlock every course for whoever pays for it).
create policy "instructor create" on courses for insert to authenticated
  with check (is_instructor() and owner_id=auth.uid() and status='draft' and is_bundle=false);
create policy "instructor edit own" on courses for update to authenticated
  using (owner_id=auth.uid() and is_instructor())
  with check (owner_id=auth.uid() and is_instructor() and is_bundle=false);
create policy "instructor delete own" on courses for delete to authenticated using (owner_id=auth.uid() and is_instructor());

-- Lessons and sections: the list follows the course's visibility; only the course owner (or admin) can write.
drop policy if exists "lesson list read" on lessons;
create policy "visible lessons" on lessons for select to anon, authenticated using (
  exists(select 1 from courses c where c.id=course_id and (c.status='published' or owns_course(c.id))));
create policy "owner write" on lessons for all to authenticated using (owns_course(course_id)) with check (owns_course(course_id));

alter table sections enable row level security;
create policy "visible sections" on sections for select to anon, authenticated using (
  exists(select 1 from courses c where c.id=course_id and (c.status='published' or owns_course(c.id))));
create policy "owner write" on sections for all to authenticated using (owns_course(course_id)) with check (owns_course(course_id));

-- Lesson links and files: hidden until the lesson is released AND the student has access (owners always see their own).
drop policy if exists "secret read when allowed" on lesson_secrets;
create policy "secret read when allowed" on lesson_secrets for select to authenticated using (
  exists(select 1 from lessons l where l.id=lesson_id and (
    owns_course(l.course_id) or ((l.release_at is null or l.release_at<=now()) and (l.is_free or has_access(l.course_id))))));
create policy "owner write" on lesson_secrets for all to authenticated
  using (exists(select 1 from lessons l where l.id=lesson_id and owns_course(l.course_id)))
  with check (exists(select 1 from lessons l where l.id=lesson_id and owns_course(l.course_id)));

-- PDF notes: same rules for the files; instructors can upload into their own course's folder (notes/<course id>/...).
drop policy if exists "notes read when allowed" on storage.objects;
create policy "notes read when allowed" on storage.objects for select to authenticated using (
  bucket_id='notes' and (is_admin() or exists(
    select 1 from lesson_secrets s join lessons l on l.id=s.lesson_id
    where s.file_path=name and (owns_course(l.course_id) or ((l.release_at is null or l.release_at<=now()) and (l.is_free or has_access(l.course_id)))))));
create policy "notes owner write" on storage.objects for all to authenticated
  using (bucket_id='notes' and case when (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$' then owns_course(((storage.foldername(name))[1])::uuid) else false end)
  with check (bucket_id='notes' and case when (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$' then owns_course(((storage.foldername(name))[1])::uuid) else false end);
