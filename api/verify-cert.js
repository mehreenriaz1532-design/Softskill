const { db } = require('./_lib');
// Public: anyone with a certificate ID (or its QR code) can check it. Only name, course and date are returned.
module.exports = async (req, res) => {
  const code = String(req.query?.code || '');
  res.setHeader('Cache-Control', 'no-store');
  if (!/^SS-[A-F0-9]{8}$/.test(code)) return res.json({ valid: false });
  const { data: c } = await db.from('certificates').select('issued_at,user_id,courses(title)').eq('code', code).maybeSingle();
  if (!c) return res.json({ valid: false });
  const { data: p } = await db.from('profiles').select('full_name').eq('id', c.user_id).maybeSingle();
  res.json({ valid: true, name: p?.full_name || 'Student', course: c.courses?.title, issued_at: c.issued_at });
};
