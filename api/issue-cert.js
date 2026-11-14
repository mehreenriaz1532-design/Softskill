const crypto = require('crypto');
const { db, user } = require('./_lib');
// Issues a certificate only when the student has completed every module and has access to the course.
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  const u = await user(req);
  if (!u) return res.status(401).json({ error: 'Sign in first.' });
  const cid = req.body?.course_id;
  const { data: course } = await db.from('courses').select('id,price').eq('id', cid).maybeSingle();
  if (!course) return res.status(404).json({ error: 'Course not found.' });
  const { data: old } = await db.from('certificates').select('code').eq('user_id', u.id).eq('course_id', cid).maybeSingle();
  if (old) return res.json({ code: old.code });
  if (course.price > 0) {
    const { data: ps } = await db.from('payments').select('course_id,courses(is_bundle)').eq('user_id', u.id).eq('status', 'approved');
    if (!(ps || []).some(p => p.course_id === cid || p.courses?.is_bundle)) return res.status(403).json({ error: 'Unlock this course first.' });
  }
  const { data: mods } = await db.from('lessons').select('id').eq('course_id', cid).eq('kind', 'module');
  if (!mods?.length) return res.status(400).json({ error: 'This course has no modules yet.' });
  const { data: done } = await db.from('lesson_progress').select('lesson_id').eq('user_id', u.id).in('lesson_id', mods.map(m => m.id));
  if ((done || []).length < mods.length) return res.status(400).json({ error: 'Complete every module first.' });
  const { data: qz } = await db.from('quizzes').select('id').eq('course_id', cid);
  if (qz?.length) {
    const { data: pass } = await db.from('quiz_attempts').select('quiz_id').eq('user_id', u.id).eq('passed', true).in('quiz_id', qz.map(x => x.id));
    const ok = new Set((pass || []).map(x => x.quiz_id));
    if (qz.some(x => !ok.has(x.id))) return res.status(400).json({ error: 'Pass every quiz in this course first.' });
  }
  const code = 'SS-' + crypto.randomBytes(4).toString('hex').toUpperCase();
  const { error } = await db.from('certificates').insert({ user_id: u.id, course_id: cid, code });
  if (error) return res.status(500).json({ error: 'Could not issue the certificate.' });
  res.json({ code });
};
