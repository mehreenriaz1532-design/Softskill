const { admin, db, mail, wrap, esc, SITE } = require('../_lib');
// Approve or reject a payment and email the student.
module.exports = async (req, res) => {
  if (!(await admin(req, res))) return;
  const { payment_id, action } = req.body || {};
  const reason = String(req.body?.reason || '').slice(0, 300);
  if (!['approve', 'reject'].includes(action)) return res.status(400).json({ error: 'Invalid action.' });
  const { data: p } = await db.from('payments').select('id,user_id,status,courses(title)').eq('id', payment_id).maybeSingle();
  if (!p || p.status !== 'pending') return res.status(400).json({ error: 'This payment is no longer pending.' });
  const patch = action === 'approve' ? { status: 'approved', reason: null } : { status: 'rejected', reason: reason || 'Receipt could not be verified.' };
  const { error } = await db.from('payments').update(patch).eq('id', p.id).eq('status', 'pending');
  if (error) return res.status(500).json({ error: 'Could not update the payment.' });
  const { data: u } = await db.auth.admin.getUserById(p.user_id);
  if (u?.user?.email) {
    const title = esc(p.courses?.title);
    await mail(action === 'approve'
      ? { to: u.user.email, subject: 'Your payment is approved - softskill', html: wrap('Payment approved', `<p>Your payment for <b>${title}</b> was verified. Your content is now unlocked.</p><p><a href="${SITE()}/#/app">Open softskill</a></p>`) }
      : { to: u.user.email, subject: 'Your payment needs attention - softskill', html: wrap('Payment not approved', `<p>We could not approve your payment for <b>${title}</b>.</p><p><b>Reason:</b> ${esc(patch.reason)}</p><p>You can submit it again from your dashboard.</p><p><a href="${SITE()}/#/app">Open softskill</a></p>`) });
  }
  res.json({ ok: true });
};
