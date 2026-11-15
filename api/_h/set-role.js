const { admin, db } = require('../_lib');
// Give or remove the instructor role. Only an admin (with the admin code) can do this; the website itself cannot change roles.
module.exports = async (req, res) => {
  if (!(await admin(req, res))) return;
  const { user_id, instructor } = req.body || {};
  if (!user_id) return res.status(400).json({ error: 'Choose a student.' });
  const { data: p } = await db.from('profiles').select('id,is_admin').eq('id', user_id).maybeSingle();
  if (!p) return res.status(404).json({ error: 'Student not found.' });
  if (p.is_admin) return res.status(400).json({ error: 'Admins already have full access.' });
  const { error } = await db.from('profiles').update({ is_instructor: !!instructor }).eq('id', user_id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
};
