-- Run this whole file once in Supabase > SQL Editor.
create extension if not exists pgcrypto;

create table profiles(
  id uuid primary key references auth.users on delete cascade,
  full_name text, city text, university text,
  is_admin boolean not null default false,
  created_at timestamptz default now());

create function is_admin() returns boolean language sql stable security definer set search_path=public as
$$ select coalesce((select is_admin from profiles where id=auth.uid()),false) $$;

create function handle_new_user() returns trigger language plpgsql security definer set search_path=public as
$$ begin
  insert into profiles(id,full_name,city,university)
  values(new.id,new.raw_user_meta_data->>'full_name',new.raw_user_meta_data->>'city',new.raw_user_meta_data->>'university');
  return new; end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();

create table courses(
  id uuid primary key default gen_random_uuid(),
  title text not null, description text,
  price int not null default 0,
  is_bundle boolean not null default false,
  position int default 0, created_at timestamptz default now());

create table lessons(
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses on delete cascade,
  kind text not null check (kind in ('module','class','note','link')),
  title text not null,
  is_free boolean not null default false,
  position int default 0,
  starts_at timestamptz,
  created_at timestamptz default now());

-- the actual video/meet link or PDF path lives here, so RLS can hide it until access is granted
create table lesson_secrets(
  lesson_id uuid primary key references lessons on delete cascade,
  url text, file_path text);

create table lesson_progress(
  user_id uuid references profiles on delete cascade,
  lesson_id uuid references lessons on delete cascade,
  primary key(user_id,lesson_id));

create table payments(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  course_id uuid not null references courses on delete cascade,
  method text not null check (method in ('JazzCash','EasyPaisa')),
  sender_phone text not null, tid text not null, receipt_path text not null,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  reason text, created_at timestamptz default now());
create unique index payments_tid_active on payments(tid) where status<>'rejected';

create table settings(key text primary key, value text);

create function has_access(cid uuid) returns boolean language sql stable security definer set search_path=public as
$$ select is_admin()
   or exists(select 1 from courses c where c.id=cid and c.price=0)
   or exists(select 1 from payments p join courses c on c.id=p.course_id
             where p.user_id=auth.uid() and p.status='approved' and (p.course_id=cid or c.is_bundle)) $$;

alter table profiles enable row level security;
alter table courses enable row level security;
alter table lessons enable row level security;
alter table lesson_secrets enable row level security;
alter table lesson_progress enable row level security;
alter table payments enable row level security;
alter table settings enable row level security;

create policy "own or admin read" on profiles for select using (id=auth.uid() or is_admin());
create policy "own update" on profiles for update using (id=auth.uid()) with check (id=auth.uid() and is_admin=is_admin());

create policy "catalog read" on courses for select to anon, authenticated using (true);
create policy "admin write" on courses for all to authenticated using (is_admin()) with check (is_admin());
create policy "lesson list read" on lessons for select to anon, authenticated using (true);
create policy "admin write" on lessons for all to authenticated using (is_admin()) with check (is_admin());

create policy "secret read when allowed" on lesson_secrets for select to authenticated using (
  is_admin() or exists(select 1 from lessons l where l.id=lesson_id and (l.is_free or has_access(l.course_id))));
create policy "admin write" on lesson_secrets for all to authenticated using (is_admin()) with check (is_admin());

create policy "own progress" on lesson_progress for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());

create policy "own or admin read" on payments for select to authenticated using (user_id=auth.uid() or is_admin());
create policy "submit own pending" on payments for insert to authenticated with check (user_id=auth.uid() and status='pending');
create policy "admin review" on payments for update to authenticated using (is_admin()) with check (is_admin());

create policy "settings read" on settings for select to authenticated using (true);
create policy "admin write" on settings for all to authenticated using (is_admin()) with check (is_admin());

insert into storage.buckets(id,name,public) values ('notes','notes',false),('receipts','receipts',false) on conflict do nothing;

create policy "notes read when allowed" on storage.objects for select to authenticated using (
  bucket_id='notes' and (is_admin() or exists(
    select 1 from lesson_secrets s join lessons l on l.id=s.lesson_id
    where s.file_path=name and (l.is_free or has_access(l.course_id)))));
create policy "notes admin write" on storage.objects for all to authenticated
  using (bucket_id='notes' and is_admin()) with check (bucket_id='notes' and is_admin());
create policy "receipt upload own folder" on storage.objects for insert to authenticated
  with check (bucket_id='receipts' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "receipt read own or admin" on storage.objects for select to authenticated
  using (bucket_id='receipts' and ((storage.foldername(name))[1]=auth.uid()::text or is_admin()));

insert into settings(key,value) values
 ('jc_number','03XX-XXXXXXX'),('jc_title','Account title'),
 ('ep_number','03XX-XXXXXXX'),('ep_title','Account title'),('raast_id','03XXXXXXXXX')
on conflict do nothing;

insert into courses(title,description,price,is_bundle,position) values
 ('Foundations & Career Readiness','Stage 1. Goal setting, CV, LinkedIn, cover letters and interview prep.',0,false,1),
 ('Digital & AI Leadership','Stage 2. Live masterclasses with recorded replays, notes and past papers.',1000,false,2),
 ('Full Bootcamp','All stages, every module, class, note and link, plus the capstone project.',1500,true,3);
