// One function for every admin action, so the project stays under Vercel's 12-function limit on the free plan.
// Each handler lives in api/_h/ and still checks: signed in + is_admin + correct ADMIN_CODE.
// Handlers are loaded only when used, and any setup problem (missing file, missing key) comes back as a readable message.
const loaders = {
  'admin-unlock': () => require('./_h/admin-unlock'),
  'ai-course': () => require('./_h/ai-course'),
  'ai-live': () => require('./_h/ai-live'),
  'ai-scenario': () => require('./_h/ai-scenario'),
  'ai-quiz': () => require('./_h/ai-quiz'),
  'approve-payment': () => require('./_h/approve-payment')
};
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  const load = loaders[req.body?.action];
  if (!load) return res.status(404).json({ error: 'Unknown action.' });
  try {
    return await load()(req, res);
  } catch (e) {
    console.error('admin function error:', e);
    if (!res.headersSent) res.status(500).json({ error: 'Server setup problem: ' + String(e.message).split('\n')[0] });
  }
};
