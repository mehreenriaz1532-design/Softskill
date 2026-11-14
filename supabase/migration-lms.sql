-- Run once in Supabase > SQL Editor, after the other migrations.
-- Quizzes: students can read questions of courses they can access; correct answers are server-only.
create table quizzes(
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses on delete cascade,
  title text not null, pass_mark int not null default 60 check (pass_mark between 1 and 100),
  position int default 0, created_at timestamptz default now());
create table quiz_questions(
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references quizzes on delete cascade,
  position int default 0, question text not null, options jsonb not null);
create table quiz_answers(
  question_id uuid primary key references quiz_questions on delete cascade,
  correct int not null check (correct between 0 and 3), explanation text);
create table quiz_attempts(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles on delete cascade,
  quiz_id uuid not null references quizzes on delete cascade,
  score int not null, passed boolean not null, answers jsonb,
  created_at timestamptz default now());

alter table quizzes enable row level security;
alter table quiz_questions enable row level security;
alter table quiz_answers enable row level security;
alter table quiz_attempts enable row level security;
create policy "list" on quizzes for select to authenticated using (true);
create policy "admin write" on quizzes for all to authenticated using (is_admin()) with check (is_admin());
create policy "read if course open" on quiz_questions for select to authenticated using (
  exists(select 1 from quizzes z where z.id=quiz_id and has_access(z.course_id)));
create policy "admin write" on quiz_questions for all to authenticated using (is_admin()) with check (is_admin());
create policy "admin only" on quiz_answers for all to authenticated using (is_admin()) with check (is_admin());
create policy "own or admin read" on quiz_attempts for select to authenticated using (user_id=auth.uid() or is_admin());   -- written by the server only

-- Assignments: students submit text or a link; the admin grades.
create table assignments(
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses on delete cascade,
  title text not null, instructions text, max_marks int not null default 100,
  created_at timestamptz default now());
create table submissions(
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references assignments on delete cascade,
  user_id uuid not null references profiles on delete cascade,
  body text not null check (char_length(body) between 1 and 5000),
  marks int, feedback text, graded_at timestamptz,
  created_at timestamptz default now(),
  unique(assignment_id,user_id));
alter table assignments enable row level security;
alter table submissions enable row level security;
create policy "list" on assignments for select to authenticated using (true);
create policy "admin write" on assignments for all to authenticated using (is_admin()) with check (is_admin());
create policy "own or admin read" on submissions for select to authenticated using (user_id=auth.uid() or is_admin());
create policy "submit own" on submissions for insert to authenticated with check (
  user_id=auth.uid() and marks is null and feedback is null and graded_at is null
  and exists(select 1 from assignments a where a.id=assignment_id and has_access(a.course_id)));
create policy "edit before grading" on submissions for update to authenticated
  using (user_id=auth.uid() and marks is null) with check (user_id=auth.uid() and marks is null and feedback is null and graded_at is null);
create policy "admin grade" on submissions for update to authenticated using (is_admin()) with check (is_admin());

create index on quizzes(course_id);
create index on quiz_questions(quiz_id,position);
create index on quiz_attempts(user_id,quiz_id,created_at desc);
create index on assignments(course_id);
create index on submissions(assignment_id);
