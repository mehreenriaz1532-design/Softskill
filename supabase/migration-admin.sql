-- Run once in Supabase > SQL Editor, after the other migrations.

-- 1) Help pages (FAQ, Terms, Privacy, Refund) that the admin can edit. Readable before login, so people can read the terms before signing up.
create table pages(
  key text primary key check (key in ('faq','terms','privacy','refund')),
  body text not null, updated_at timestamptz default now());
alter table pages enable row level security;
create policy "read" on pages for select to anon, authenticated using (true);
create policy "admin write" on pages for all to authenticated using (is_admin()) with check (is_admin());

-- 2) Admin can grant access by hand (cash payment, scholarship, correction) and can revoke a certificate.
alter table payments drop constraint if exists payments_method_check;
alter table payments add constraint payments_method_check check (method in ('JazzCash','EasyPaisa','Manual'));
create policy "admin delete" on certificates for delete to authenticated using (is_admin());

-- 3) Student overview for the admin Students tab (counts only, no private journal or pitch content). Server-only.
create or replace function admin_student_stats()
returns table(user_id uuid, modules_done bigint, quizzes_passed bigint, pitches bigint, courses text[])
language sql security definer set search_path=public as $$
  select p.id,
    (select count(*) from lesson_progress lp join lessons l on l.id=lp.lesson_id where lp.user_id=p.id and l.kind='module'),
    (select count(distinct qa.quiz_id) from quiz_attempts qa where qa.user_id=p.id and qa.passed),
    (select count(*) from pitch_attempts pa where pa.user_id=p.id),
    coalesce((select array_agg(distinct c.title) from payments pm join courses c on c.id=pm.course_id where pm.user_id=p.id and pm.status='approved'), '{}')
  from profiles p
$$;
revoke all on function admin_student_stats() from public, anon, authenticated;
grant execute on function admin_student_stats() to service_role;
