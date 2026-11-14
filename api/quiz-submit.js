const { db, user, access } = require('./_lib');
// Scores a quiz on the server. Correct answers never reach the browser, and attempts are capped at 5 per quiz per day.
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  const u = await user(req);
  if (!u) return res.status(401).json({ error: 'Sign in first.' });
  const { quiz_id, answers } = req.body || {};
  const { data: z } = await db.from('quizzes').select('*').eq('id', quiz_id).maybeSingle();
  if (!z) return res.status(404).json({ error: 'Quiz not found.' });
  if (!(await access(u.id, z.course_id))) return res.status(403).json({ error: 'Unlock this course first.' });
  const since = new Date(Date.now() - 864e5).toISOString();
  const { count } = await db.from('quiz_attempts').select('id', { count: 'exact', head: true }).eq('user_id', u.id).eq('quiz_id', quiz_id).gte('created_at', since);
  if ((count || 0) >= 5) return res.status(429).json({ error: 'You have used 5 attempts today. Review the lessons and try again tomorrow.' });
  const { data: qs } = await db.from('quiz_questions').select('id').eq('quiz_id', quiz_id).order('position');
  if (!qs?.length || !Array.isArray(answers) || answers.length !== qs.length || answers.some(a => !Number.isInteger(a) || a < 0 || a > 3)) return res.status(400).json({ error: 'Answer every question.' });
  const { data: key } = await db.from('quiz_answers').select('question_id,correct,explanation').in('question_id', qs.map(x => x.id));
  const by = Object.fromEntries((key || []).map(k => [k.question_id, k]));
  const wrong = [];
  qs.forEach((x, i) => { if (by[x.id]?.correct !== answers[i]) wrong.push({ i, explanation: by[x.id]?.explanation || '' }); });
  const score = Math.round((qs.length - wrong.length) / qs.length * 100), passed = score >= z.pass_mark;
  await db.from('quiz_attempts').insert({ user_id: u.id, quiz_id, score, passed, answers });
  res.json({ score, passed, pass_mark: z.pass_mark, wrong });
};
