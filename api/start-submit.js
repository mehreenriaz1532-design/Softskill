const { db, user, access } = require('../_lib');

// Combined Quiz Endpoint: Handles both starting/resuming a quiz and submitting answers.
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  
  const u = await user(req);
  if (!u) return res.status(401).json({ error: 'Sign in first.' });

  const { action, quiz_id, answers } = req.body || {};
  const targetQuizId = quiz_id || req.body?.quiz_id;

  if (!targetQuizId) {
    return res.status(400).json({ error: 'Quiz ID is required.' });
  }

  // Fetch quiz details common for both actions
  const { data: z } = await db.from('quizzes').select('*').eq('id', targetQuizId).maybeSingle();
  if (!z) return res.status(404).json({ error: 'Quiz not found.' });

  if (!(await access(u.id, z.course_id))) {
    return res.status(403).json({ error: 'Unlock this course first.' });
  }

  const now = Date.now();

  // ---------------------------------------------------------------------------
  // ACTION 1: START OR RESUME QUIZ
  // ---------------------------------------------------------------------------
  if (action === 'start') {
    const limit = z.time_limit_min || null;
    const reply = s => res.json({ 
      started_at: s, 
      time_limit_min: limit, 
      seconds_left: limit ? Math.max(0, Math.round(limit * 60 - (now - new Date(s)) / 1000)) : null 
    });

    const { data: open } = await db.from('quiz_starts').select('id,started_at').eq('user_id', u.id).eq('quiz_id', z.id).is('finished_at', null).order('started_at', { ascending: false }).limit(1);
    
    if (open?.length) {
      const age = (now - new Date(open[0].started_at)) / 1000;
      if (!limit || age < limit * 60) return reply(open[0].started_at); // still running
      await db.from('quiz_starts').update({ finished_at: new Date(now).toISOString() }).eq('id', open[0].id); // ran out
    }

    const since = new Date(now - 864e5).toISOString();
    const { count } = await db.from('quiz_starts').select('id', { count: 'exact', head: true }).eq('user_id', u.id).eq('quiz_id', z.id).gte('started_at', since);
    
    if ((count || 0) >= 5) {
      return res.status(429).json({ error: 'You have used 5 attempts today. Review the lessons and try again tomorrow.' });
    }

    const { data: s, error } = await db.from('quiz_starts').insert({ user_id: u.id, quiz_id: z.id }).select('started_at').single();
    if (error) return res.status(500).json({ error: 'Could not start the quiz.' });
    
    return reply(s.started_at);
  }

  // ---------------------------------------------------------------------------
  // ACTION 2: SUBMIT QUIZ
  // ---------------------------------------------------------------------------
  const { data: open } = await db.from('quiz_starts').select('id,started_at').eq('user_id', u.id).eq('quiz_id', targetQuizId).is('finished_at', null).order('started_at', { ascending: false }).limit(1);
  const start = open?.[0] || null;

  if (z.time_limit_min) {
    if (!start) return res.status(400).json({ error: 'Press Start to begin this timed quiz.' });
    const age = (Date.now() - new Date(start.started_at)) / 1000;
    if (age > z.time_limit_min * 60 + 20) {
      await db.from('quiz_starts').update({ finished_at: new Date().toISOString() }).eq('id', start.id);
      return res.status(408).json({ error: 'Time is up for this attempt. You can start again.' });
    }
  } else {
    const since = new Date(Date.now() - 864e5).toISOString();
    const { count } = await db.from('quiz_attempts').select('id', { count: 'exact', head: true }).eq('user_id', u.id).eq('quiz_id', targetQuizId).gte('created_at', since);
    if ((count || 0) >= 5) return res.status(429).json({ error: 'You have used 5 attempts today. Review the lessons and try again tomorrow.' });
  }

  const { data: qs } = await db.from('quiz_questions').select('id').eq('quiz_id', targetQuizId).order('position');
  if (!qs?.length || !Array.isArray(answers) || answers.length !== qs.length || answers.some(a => !Number.isInteger(a) || a < -1 || a > 3)) {
    return res.status(400).json({ error: 'Something went wrong with your answers. Please try again.' });
  }

  const { data: key } = await db.from('quiz_answers').select('question_id,correct,explanation').in('question_id', qs.map(x => x.id));
  const by = Object.fromEntries((key || []).map(k => [k.question_id, k]));
  const wrong = [];
  
  qs.forEach((x, i) => { 
    if (answers[i] < 0 || by[x.id]?.correct !== answers[i]) {
      wrong.push({ i, unanswered: answers[i] < 0, explanation: by[x.id]?.explanation || '' }); 
    } 
  });

  const score = Math.round((qs.length - wrong.length) / qs.length * 100);
  const passed = score >= z.pass_mark;

  await db.from('quiz_attempts').insert({ user_id: u.id, quiz_id: targetQuizId, score, passed, answers });
  if (start) await db.from('quiz_starts').update({ finished_at: new Date().toISOString() }).eq('id', start.id);

  return res.json({ score, passed, pass_mark: z.pass_mark, wrong, unanswered: wrong.filter(w => w.unanswered).length });
};
