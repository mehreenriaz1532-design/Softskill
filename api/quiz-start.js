const { db, user, access } = require('./_lib');
// Starts (or resumes) a quiz attempt and keeps the clock on the server, so the timer cannot be cheated from the browser.
// At most 5 starts per quiz per student per day.
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  const u = await user(req);
  if (!u) return res.status(401).json({ error: 'Sign in first.' });
  const { data: z } = await db.from('quizzes').select('id,course_id,time_limit_min').eq('id', req.body?.quiz_id).maybeSingle();
  if (!z) return res.status(404).json({ error: 'Quiz not found.' });
  if (!(await access(u.id, z.course_id))) return res.status(403).json({ error: 'Unlock this course first.' });
  const limit = z.time_limit_min || null, now = Date.now();
  const reply = s => res.json({ started_at: s, time_limit_min: limit, seconds_left: limit ? Math.max(0, Math.round(limit * 60 - (now - new Date(s)) / 1000)) : null });

  const { data: open } = await db.from('quiz_starts').select('id,started_at').eq('user_id', u.id).eq('quiz_id', z.id).is('finished_at', null).order('started_at', { ascending: false }).limit(1);
  if (open?.length) {
    const age = (now - new Date(open[0].started_at)) / 1000;
    if (!limit || age < limit * 60) return reply(open[0].started_at);          // still running: resume with the time that is left
    await db.from('quiz_starts').update({ finished_at: new Date(now).toISOString() }).eq('id', open[0].id);   // ran out: that attempt is used up
  }
  const since = new Date(now - 864e5).toISOString();
  const { count } = await db.from('quiz_starts').select('id', { count: 'exact', head: true }).eq('user_id', u.id).eq('quiz_id', z.id).gte('started_at', since);
  if ((count || 0) >= 5) return res.status(429).json({ error: 'You have used 5 attempts today. Review the lessons and try again tomorrow.' });
  const { data: s, error } = await db.from('quiz_starts').insert({ user_id: u.id, quiz_id: z.id }).select('started_at').single();
  if (error) return res.status(500).json({ error: 'Could not start the quiz.' });
  reply(s.started_at);
};
