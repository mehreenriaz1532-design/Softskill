-- Run once in Supabase > SQL Editor, after migration-teach.sql.
-- Teaching tools for instructors: quizzes, assignments with files and deadlines, live classes, gradebook,
-- co-teachers and TAs, course prerequisites.

alter table courses add column if not exists prereq_id uuid references courses(id) on delete set null;   -- finish this course (certificate) first
alter table courses add column if not exists quiz_weight int not null default 50 check (quiz_weight between 0 and 100);
alter table quizzes add column if not exists shuffle boolean not null default false;
alter table assignments add column if not exists due_at timestamptz;
alter table assignments add column if not exists allow_late boolean not null default true;
alter table submissions add column if not exists file_path text;

-- Teaching team of a course. Owner = the instructor who created it. Co-teacher: edits content and grades.
-- TA: grades and sees the gradebook only. Rows are added by the server (it looks the person up by email).
create table course_staff(
  course_id uuid not null references courses on delete cascade,
  user_id uuid not null references profiles on delete cascade,
  role text not null check (role in ('co-teacher','ta')),
  created_at timestamptz default now(),
  primary key(course_id,user_id));
alter table course_staff enable row level security;

create or replace function owns_course(cid uuid) returns boolean language sql stable security definer set search_path=public as
$$ select is_admin()
   or exists(select 1 from courses c where c.id=cid and c.owner_id=auth.uid() and is_instructor())
   or exists(select 1 from course_staff s where s.course_id=cid and s.user_id=auth.uid() and s.role='co-teacher' and is_instructor()) $$;

create or replace function grades_course(cid uuid) returns boolean language sql stable security definer set search_path=public as
$$ select owns_course(cid) or exists(select 1 from course_staff s where s.course_id=cid and s.user_id=auth.uid()) $$;

-- A course with a prerequisite stays locked until the student holds a certificate for the prerequisite course.
create or replace function prereq_ok(cid uuid) returns boolean language sql stable security definer set search_path=public as
$$ select owns_course(cid)
   or not exists(select 1 from courses c where c.id=cid and c.prereq_id is not null)
   or exists(select 1 from courses c join certificates ce on ce.course_id=c.prereq_id and ce.user_id=auth.uid() where c.id=cid) $$;

create or replace function has_access(cid uuid) returns boolean language sql stable security definer set search_path=public as
$$ select grades_course(cid)
   or (prereq_ok(cid) and (
        exists(select 1 from courses c where c.id=cid and c.price=0)
        or exists(select 1 from payments p join courses c on c.id=p.course_id
                  where p.user_id=auth.uid() and p.status='approved' and (p.course_id=cid or c.is_bundle)))) $$;

create policy "see own team rows or team of own course" on course_staff for select to authenticated using (user_id=auth.uid() or owns_course(course_id));
create policy "owner removes" on course_staff for delete to authenticated using (
  is_admin() or exists(select 1 from courses c where c.id=course_id and c.owner_id=auth.uid() and is_instructor()));

-- Quizzes
drop policy if exists "list" on quizzes;
create policy "visible quizzes" on quizzes for select to authenticated using (
  exists(select 1 from courses c where c.id=course_id and (c.status='published' or grades_course(c.id))));
create policy "owner write" on quizzes for all to authenticated using (owns_course(course_id)) with check (owns_course(course_id));
create policy "owner write" on quiz_questions for all to authenticated
  using (exists(select 1 from quizzes z where z.id=quiz_id and owns_course(z.course_id)))
  with check (exists(select 1 from quizzes z where z.id=quiz_id and owns_course(z.course_id)));
create policy "owner only" on quiz_answers for all to authenticated
  using (exists(select 1 from quiz_questions x join quizzes z on z.id=x.quiz_id where x.id=question_id and owns_course(z.course_id)))
  with check (exists(select 1 from quiz_questions x join quizzes z on z.id=x.quiz_id where x.id=question_id and owns_course(z.course_id)));
create policy "staff read" on quiz_attempts for select to authenticated using (
  exists(select 1 from quizzes z where z.id=quiz_id and grades_course(z.course_id)));

-- Assignments: deadlines are enforced here, not only in the page
drop policy if exists "list" on assignments;
create policy "visible assignments" on assignments for select to authenticated using (
  exists(select 1 from courses c where c.id=course_id and (c.status='published' or grades_course(c.id))));
create policy "owner write" on assignments for all to authenticated using (owns_course(course_id)) with check (owns_course(course_id));

drop policy if exists "submit own" on submissions;
create policy "submit own" on submissions for insert to authenticated with check (
  user_id=auth.uid() and marks is null and feedback is null and graded_at is null
  and exists(select 1 from assignments a where a.id=assignment_id and has_access(a.course_id) and (a.due_at is null or a.due_at>now() or a.allow_late)));
drop policy if exists "edit before grading" on submissions;
create policy "edit before grading" on submissions for update to authenticated
  using (user_id=auth.uid() and marks is null)
  with check (user_id=auth.uid() and marks is null and feedback is null and graded_at is null
    and exists(select 1 from assignments a where a.id=assignment_id and (a.due_at is null or a.due_at>now() or a.allow_late)));
create policy "staff read" on submissions for select to authenticated using (
  exists(select 1 from assignments a where a.id=assignment_id and grades_course(a.course_id)));
create policy "staff grade" on submissions for update to authenticated
  using (exists(select 1 from assignments a where a.id=assignment_id and grades_course(a.course_id)))
  with check (exists(select 1 from assignments a where a.id=assignment_id and grades_course(a.course_id)));

-- Live classes of a course; moderating lesson Q&A
create policy "owner write" on live_classes for all to authenticated
  using (course_id is not null and owns_course(course_id)) with check (course_id is not null and owns_course(course_id));
create policy "owner write" on live_links for all to authenticated
  using (exists(select 1 from live_classes c where c.id=class_id and c.course_id is not null and owns_course(c.course_id)))
  with check (exists(select 1 from live_classes c where c.id=class_id and c.course_id is not null and owns_course(c.course_id)));
create policy "staff delete" on lesson_comments for delete to authenticated using (
  exists(select 1 from lessons l where l.id=lesson_id and grades_course(l.course_id)));

-- Student files for assignments: submissions/<course id>/<assignment id>/<student id>/<file>
insert into storage.buckets(id,name,public) values ('submissions','submissions',false) on conflict do nothing;
update storage.buckets set file_size_limit=10485760 where id='submissions';
create policy "student uploads own submission file" on storage.objects for insert to authenticated with check (
  bucket_id='submissions' and array_length(storage.foldername(name),1)=3 and (storage.foldername(name))[3]=auth.uid()::text
  and case when (storage.foldername(name))[2] ~ '^[0-9a-f-]{36}$' then
    exists(select 1 from assignments a where a.id=((storage.foldername(name))[2])::uuid and a.course_id::text=(storage.foldername(name))[1] and has_access(a.course_id))
    else false end);
create policy "own or team reads submission file" on storage.objects for select to authenticated using (
  bucket_id='submissions' and ((storage.foldername(name))[3]=auth.uid()::text
    or case when (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$' then grades_course(((storage.foldername(name))[1])::uuid) else false end));

-- Server-only helpers (never callable from the browser)
create or replace function user_id_by_email(e text) returns uuid language sql stable security definer set search_path=public,auth as
$$ select id from auth.users where lower(email)=lower(e) limit 1 $$;
revoke all on function user_id_by_email(text) from public, anon, authenticated;
grant execute on function user_id_by_email(text) to service_role;

-- One row per student of a course with the numbers the gradebook needs (best quiz scores, assignment marks)
create or replace function course_gradebook(cid uuid)
returns table(user_id uuid, full_name text, modules_done bigint, quizzes jsonb, assignments jsonb)
language sql stable security definer set search_path=public as $$
  with roster as (
    select p.user_id as uid from payments p join courses c on c.id=p.course_id where p.status='approved' and (p.course_id=cid or c.is_bundle)
    union select lp.user_id from lesson_progress lp join lessons l on l.id=lp.lesson_id where l.course_id=cid
    union select qa.user_id from quiz_attempts qa join quizzes z on z.id=qa.quiz_id where z.course_id=cid
    union select s.user_id from submissions s join assignments a on a.id=s.assignment_id where a.course_id=cid)
  select pr.id, pr.full_name,
    (select count(*) from lesson_progress lp join lessons l on l.id=lp.lesson_id where lp.user_id=pr.id and l.course_id=cid and l.kind='module'),
    coalesce((select jsonb_object_agg(b.qid::text, b.best)
              from (select qa.quiz_id as qid, max(qa.score) as best from quiz_attempts qa join quizzes z on z.id=qa.quiz_id
                    where qa.user_id=pr.id and z.course_id=cid group by qa.quiz_id) b), '{}'::jsonb),
    coalesce((select jsonb_object_agg(s.assignment_id::text, jsonb_build_object('marks', s.marks, 'late', (a.due_at is not null and s.created_at>a.due_at)))
              from submissions s join assignments a on a.id=s.assignment_id where s.user_id=pr.id and a.course_id=cid), '{}'::jsonb)
  from profiles pr join roster r on r.uid=pr.id
  order by pr.full_name
$$;
revoke all on function course_gradebook(uuid) from public, anon, authenticated;
grant execute on function course_gradebook(uuid) to service_role;

create index on course_staff(user_id);
create index on courses(prereq_id);
