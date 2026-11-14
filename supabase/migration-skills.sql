-- Run once in Supabase > SQL Editor, after schema.sql, migration-live.sql and migration-ai.sql.
alter table lesson_progress add column if not exists done_at timestamptz default now();

-- names only (no city/university) so classmates can see who posted or who is practising
create view public_profiles as select id, full_name from profiles;
grant select on public_profiles to authenticated;

-- Q&A under each lesson
create table lesson_comments(
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references lessons on delete cascade,
  user_id uuid not null references profiles on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz default now());
alter table lesson_comments enable row level security;
create policy "read if lesson visible" on lesson_comments for select to authenticated using (
  exists(select 1 from lessons l where l.id=lesson_id and (l.is_free or has_access(l.course_id))));
create policy "post if lesson visible" on lesson_comments for insert to authenticated with check (
  user_id=auth.uid() and exists(select 1 from lessons l where l.id=lesson_id and (l.is_free or has_access(l.course_id))));
create policy "delete own or admin" on lesson_comments for delete to authenticated using (user_id=auth.uid() or is_admin());

-- daily journal / 21-day streak
create table journal_entries(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles on delete cascade,
  day date not null, challenge text not null,
  note text not null check (char_length(note) between 1 and 2000),
  created_at timestamptz default now(),
  unique(user_id,day));
alter table journal_entries enable row level security;
create policy "own journal" on journal_entries for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());

-- roleplay scenarios (branching) and the skill points students earn from them
create table scenarios(
  id uuid primary key default gen_random_uuid(),
  title text not null, description text,
  skill text not null check (skill in ('communication','eq','leadership','negotiation','presence')),
  data jsonb not null, created_at timestamptz default now());
alter table scenarios enable row level security;
create policy "read" on scenarios for select to authenticated using (true);
create policy "admin write" on scenarios for all to authenticated using (is_admin()) with check (is_admin());

create table skill_events(
  user_id uuid references profiles on delete cascade,
  source text not null,
  skill text not null check (skill in ('communication','eq','leadership','negotiation','presence')),
  points int not null,
  primary key(user_id,source,skill));
alter table skill_events enable row level security;
create policy "own read" on skill_events for select to authenticated using (user_id=auth.uid());   -- written only by the server

-- AI pitch coach attempts
create table pitch_attempts(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles on delete cascade,
  transcript text, seconds int, words int, fillers int, wpm int,
  clarity int, confidence int, tone int, tips jsonb, improved text,
  created_at timestamptz default now());
alter table pitch_attempts enable row level security;
create policy "own read" on pitch_attempts for select to authenticated using (user_id=auth.uid());

-- certificates (issued by the server only after every module is complete)
create table certificates(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles on delete cascade,
  course_id uuid not null references courses on delete cascade,
  code text not null unique,
  issued_at timestamptz default now(),
  unique(user_id,course_id));
alter table certificates enable row level security;
create policy "own or admin read" on certificates for select to authenticated using (user_id=auth.uid() or is_admin());

-- peer mock-interview / speaking practice rooms
create table practice_slots(
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references profiles on delete cascade,
  guest_id uuid references profiles on delete set null,
  kind text not null, topic text not null,
  starts_at timestamptz not null, room text not null,
  created_at timestamptz default now());
alter table practice_slots enable row level security;
create policy "read" on practice_slots for select to authenticated using (true);
create policy "host creates" on practice_slots for insert to authenticated with check (host_id=auth.uid() and guest_id is null);
create policy "guest joins free seat" on practice_slots for update to authenticated using (guest_id is null and host_id<>auth.uid()) with check (guest_id=auth.uid());
create policy "host or admin deletes" on practice_slots for delete to authenticated using (host_id=auth.uid() or is_admin());

create index on lesson_comments(lesson_id,created_at);
create index on journal_entries(user_id,day);
create index on pitch_attempts(user_id,created_at desc);
create index on practice_slots(starts_at);

insert into scenarios(title,description,skill,data) values
('The angry client','A client is furious about a late, flawed report. Stay calm and turn it around.','eq',
$${"start":"n1","nodes":{
"n1":{"text":"A client calls, furious: 'Your team delivered late and the report is wrong!' What do you say?","choices":[
{"text":"'I am sorry you are upset. Let me understand exactly what went wrong.'","next":"n2","score":{"eq":8,"communication":6}},
{"text":"'The delay was not our fault. The brief was unclear.'","next":"n3","score":{"eq":1,"communication":2}},
{"text":"'I will fix everything by tomorrow, no problem.'","next":"n4","score":{"communication":3,"leadership":2}}]},
"n2":{"text":"The client calmly lists two errors in the figures. What next?","choices":[
{"text":"Summarise the issues back, agree a fix and a time.","next":"e1","score":{"communication":9,"leadership":7}},
{"text":"Offer a discount straight away.","next":"e2","score":{"negotiation":2,"communication":3}}]},
"n3":{"text":"The client gets louder: 'Excuses! I want answers.'","choices":[
{"text":"Pause, apologise for the experience and ask what matters most to them.","next":"n2","score":{"eq":6,"communication":5}},
{"text":"Say you will escalate this to your manager.","next":"e3","score":{"leadership":1,"communication":2}}]},
"n4":{"text":"The client replies: 'How can you promise that without checking?'","choices":[
{"text":"Admit you need to verify first and promise a call back within the hour.","next":"e1","score":{"communication":6,"eq":5,"leadership":3}},
{"text":"Insist it will definitely be done.","next":"e3","score":{"presence":1}}]},
"e1":{"end":true,"text":"Well handled. You listened first, owned the problem and agreed a clear next step, which calms most clients."},
"e2":{"end":true,"text":"Acceptable, but offering a discount before understanding the problem can look like buying silence."},
"e3":{"end":true,"text":"The tension grew. Try listening and clarifying before defending or promising."}}}$$::jsonb),
('Salary negotiation','You have a job offer below your target. Negotiate without damaging the relationship.','negotiation',
$${"start":"n1","nodes":{
"n1":{"text":"HR offers Rs. 80,000 per month. You were hoping for Rs. 95,000.","choices":[
{"text":"Accept immediately and thank them.","next":"e2","score":{"negotiation":1,"presence":2}},
{"text":"Thank them, then share market research that supports Rs. 95,000.","next":"n2","score":{"negotiation":9,"presence":7,"communication":5}},
{"text":"Demand Rs. 120,000 or you walk away.","next":"e3","score":{"negotiation":2,"presence":3}}]},
"n2":{"text":"HR replies: 'The budget for this role is fixed at Rs. 85,000.'","choices":[
{"text":"Ask about other value: a 6-month review, a training budget, flexible hours.","next":"e1","score":{"negotiation":10,"leadership":3}},
{"text":"Accept Rs. 85,000 without further discussion.","next":"e2","score":{"negotiation":3}},
{"text":"Repeat the same demand.","next":"e3","score":{"negotiation":1}}]},
"e1":{"end":true,"text":"Strong result. You stayed collaborative and found value beyond the base salary."},
"e2":{"end":true,"text":"Acceptable, but you left value on the table. Prepare numbers and ask for options."},
"e3":{"end":true,"text":"This closed the conversation. Pressure rarely works without leverage; trade value instead."}}}$$::jsonb);
