const { admin } = require('./_lib');
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  if (await admin(req, res)) res.json({ ok: true });
};
