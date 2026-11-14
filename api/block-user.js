const { admin, db } = require('../_lib');
// Block or unblock a student's login. A blocked account cannot sign in or refresh its session.
module.exports = async (req, res) => {
  const me = await admin(req, res);
  if (!me) return;
  const { user_id, block } = req.body || {};
  if (!user_id || user_id === me.id) return res.status(400).json({ error: 'You cannot block yourself.' });
  const { error } = await db.auth.admin.updateUserById(user_id, { ban_duration: block ? '876000h' : 'none' });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
};
