// One function for every signed-in student action, so the project never gets near Vercel's 12-function limit.
// Each handler lives in api/_h/ (folders starting with "_" are not counted as functions).
const loaders = {
  'issue-cert': () => require('./_h/issue-cert'),
  'quiz-start': () => require('./_h/quiz-start'),
  'quiz-submit': () => require('./_h/quiz-submit'),
  'roleplay-submit': () => require('./_h/roleplay-submit'),
  'pitch-coach': () => require('./_h/pitch-coach'),
  'verify-payment': () => require('./_h/verify-payment')
};
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  const load = loaders[req.body?.action];
  if (!load) return res.status(404).json({ error: 'Unknown action.' });
  try {
    return await load()(req, res);
  } catch (e) {
    console.error('app function error:', e);
    if (!res.headersSent) res.status(500).json({ error: 'Server setup problem: ' + String(e.message).split('\n')[0] });
  }
};
