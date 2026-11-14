const crypto = require('crypto');
const { admin, db, mail, wrap, esc, SITE } = require('../_lib');
// Give a student a course by hand (recorded as an approved "Manual" payment) or remove a directly approved course.
// If the student has a bundle, remove the bundle itself.
module.exports = async (req, res) => {
  if (!(await admin(req, res))) return;
  const { user_id, course_id, mode } = req.body || {};
  const [{ data: c }, { data: p }] = await Promise.all([
    db.from('courses').select('id,title').eq('id', course_id).maybeSingle(),
    db.from('profiles').select('id').eq('id', user_id).maybeSingle()
  ]);
  if (!c || !p) return res.status(404).json({ error: 'Student or course not found.' });
  if (mode === 'revoke') {
    const { error } = await db.from('payments').update({ status: 'rejected', reason: 'Access removed by admin' }).eq('user_id', user_id).eq('course_id', course_id).eq('status', 'approved');
    return error ? res.status(500).json({ error: error.message }) : res.json({ ok: true });
  }
  if (mode !== 'grant') return res.status(400).json({ error: 'Invalid action.' });
  const { data: have } = await db.from('payments').select('id').eq('user_id', user_id).eq('course_id', course_id).eq('status', 'approved').limit(1);
  if (have?.length) return res.json({ ok: true });
  const { error } = await db.from('payments').insert({ user_id, course_id, method: 'Manual', sender_phone: 'admin', tid: 'MANUAL-' + crypto.randomBytes(6).toString('hex'), receipt_path: 'admin', status: 'approved', reason: 'Granted by admin' });
  if (error) return res.status(500).json({ error: error.message });
  const { data: u } = await db.auth.admin.getUserById(user_id);
  if (u?.user?.email) await mail({ to: u.user.email, subject: 'Course unlocked - softskill', html: wrap('Course unlocked', `<p>You now have access to <b>${esc(c.title)}</b>.</p><p><a href="${SITE()}/#/app">Open softskill</a></p>`) });
  res.json({ ok: true });
};
