-- Run once in Supabase > SQL Editor, after the other migrations.
-- 1) Course ratings and reviews, and general feedback  2) Quiz timer and shuffled questions

-- A student can rate a course once they have access and have finished at least one lesson; one review per course, editable.
create table reviews(
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses on delete cascade,
  user_id uuid not null references profiles on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text check (char_length(comment) <= 1000),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(course_id,user_id));
alter table reviews enable row level security;
create policy "read reviews" on reviews for select to authenticated using (true);
create policy "review a course you are taking" on reviews for insert to authenticated with check (
  user_id=auth.uid() and has_access(course_id)
  and exists(select 1 from lesson_progress lp join lessons l on l.id=lp.lesson_id where lp.user_id=auth.uid() and l.course_id=reviews.course_id));
create policy "edit own review" on reviews for update to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy "delete own or admin" on reviews for delete to authenticated using (user_id=auth.uid() or is_admin());

-- Public average rating per course (numbers only, so it can show on the course catalog before login)
create view course_ratings as
  select course_id, round(avg(rating)::numeric,1) as avg_rating, count(*)::int as n from reviews group by course_id;
grant select on course_ratings to anon, authenticated;

-- General feedback box (max 5 messages per student per day)
create table feedback(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles on delete cascade,
  rating int check (rating between 1 and 5),
  category text not null default 'other' check (category in ('courses','website','live','other')),
  message text not null check (char_length(message) between 3 and 2000),
  status text not null default 'new' check (status in ('new','read')),
  created_at timestamptz default now());
alter table feedback enable row level security;
create policy "send feedback" on feedback for insert to authenticated with check (
  user_id=auth.uid() and status='new'
  and (select count(*) from feedback f where f.user_id=auth.uid() and f.created_at>now()-interval '1 day') < 5);
create policy "own or admin read" on feedback for select to authenticated using (user_id=auth.uid() or is_admin());
create policy "admin update" on feedback for update to authenticated using (is_admin()) with check (is_admin());
create policy "admin delete" on feedback for delete to authenticated using (is_admin());

-- Quiz timer. A timed quiz starts when the student presses Start; the server keeps the clock and rejects late answers.
alter table quizzes add column if not exists time_limit_min int check (time_limit_min between 1 and 300);
alter table quizzes add column if not exists shuffle boolean not null default false;
create table quiz_starts(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles on delete cascade,
  quiz_id uuid not null references quizzes on delete cascade,
  started_at timestamptz not null default now(),
  finished_at timestamptz);
alter table quiz_starts enable row level security;   -- no policies: only the server (service role) reads or writes it
create index on quiz_starts(user_id,quiz_id,started_at desc);
create index on reviews(course_id,created_at desc);
create index on feedback(created_at desc);
