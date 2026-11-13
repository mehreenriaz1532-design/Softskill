-- Run once in Supabase > SQL Editor, after schema.sql and migration-live.sql.
create table admin_attempts(
  user_id uuid primary key references profiles on delete cascade,
  failed int not null default 0, locked_until timestamptz);
alter table admin_attempts enable row level security;  -- no policies: only the server (service role) can touch it

create table payment_ai(
  payment_id uuid primary key references payments on delete cascade,
  verdict text not null check (verdict in ('pass','review')),
  note text, created_at timestamptz default now());
alter table payment_ai enable row level security;
create policy "admin read" on payment_ai for select to authenticated using (is_admin());

insert into settings(key,value) values ('ai_auto_approve','off') on conflict do nothing;

-- indexes so the site stays fast with a few hundred students
create index on lessons(course_id,kind,position);
create index on payments(user_id,status);
create index on payments(status,created_at desc);
create index on lesson_progress(user_id);
create index on live_classes(starts_at);
