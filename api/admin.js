// One function for every admin action, so the project stays under Vercel's 12-function limit on the free plan.
// Each handler lives in api/_h/ and still checks: signed in + is_admin + correct ADMIN_CODE.
const handlers = {
  'admin-unlock': require('./_h/admin-unlock'),
  'ai-course': require('./_h/ai-course'),
  'ai-live': require('./_h/ai-live'),
  'ai-scenario': require('./_h/ai-scenario'),
  'ai-quiz': require('./_h/ai-quiz'),
  'approve-payment': require('./_h/approve-payment')
};
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  const h = handlers[req.body?.action];
  if (!h) return res.status(404).json({ error: 'Unknown action.' });
  return h(req, res);
};
