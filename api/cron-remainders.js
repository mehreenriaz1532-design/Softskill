const { db, mail, wrap, esc, SITE } = require('./_lib');
// Runs once a day (see vercel.json). Emails everyone who can join a live class starting in the next 24 hours.
// Vercel calls this with "Authorization: Bearer <CRON_SECRET>".
module.exports = async (req, res) => {
  if (!process.env.CRON_SECRET || req.headers.authorization !== 'Bearer ' + process.env.CRON_SECRET) return res.status(401).end();
  const now = new Date(), end = new Date(Date.now() + 864e5);
  const { data: classes } = await db.from('live_classes').select('*,courses(title,price)').gte('starts_at', now.toISOString()).lt('starts_at', end.toISOString());
  if (!classes?.length) return res.json({ sent: 0 });
  const { data } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const users = (data?.users || []).filter(u => u.email && u.email_confirmed_at);
  let sent = 0;
  for (const c of classes) {
    let allowed = null;   // null = everyone
    if (c.course_id && c.courses?.price > 0) {
      const { data: ps } = await db.from('payments').select('user_id,course_id,courses(is_bundle)').eq('status', 'approved');
      allowed = new Set((ps || []).filter(p => p.course_id === c.course_id || p.courses?.is_bundle).map(p => p.user_id));
    }
    const emails = users.filter(u => !allowed || allowed.has(u.id)).map(u => u.email);
    const when = new Date(c.starts_at).toLocaleString('en-GB', { timeZone: 'Asia/Karachi', dateStyle: 'medium', timeStyle: 'short' }) + ' (Pakistan time)';
    for (let i = 0; i < emails.length; i += 40) {
      const ok = await mail({ to: process.env.SMTP_USER, bcc: emails.slice(i, i + 40), subject: 'Live class reminder: ' + c.title, html: wrap('Live class coming up', `<p><b>${esc(c.title)}</b></p><p>${when}</p><p><a href="${SITE()}/#/live">Open the Live classes page</a> to join.</p>`) });
      if (ok) sent += emails.slice(i, i + 40).length;
    }
  }
  res.json({ sent });
};
