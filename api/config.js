// Serves the public Supabase settings from Vercel environment variables.
// The anon key is designed to be public; Row Level Security in the SQL files protects the data.
// Never put the service_role key in this project.
// Open /api/config?check=1 to see (without any secret values) whether every setting is present and the server files load.
module.exports = (req, res) => {
  if (req.query && req.query.check) {
    const names = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'GROQ_API_KEY', 'ADMIN_CODE', 'SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'SITE_URL', 'CRON_SECRET'];
    const report = { env: Object.fromEntries(names.map(n => [n, !!process.env[n]])), handlers: {}, lib: null };
    try { report.lib = Object.keys(require('./_lib')); } catch (e) { report.lib = 'FAILED: ' + String(e.message).split('\n')[0]; }
    for (const [group, list] of [['admin', ['admin-unlock', 'ai-course', 'ai-live', 'ai-scenario', 'ai-quiz', 'approve-payment', 'list-students', 'grant-access', 'block-user', 'set-role']], ['app', ['issue-cert', 'quiz-start', 'quiz-submit', 'roleplay-submit', 'pitch-coach', 'verify-payment']]]) {
      for (const h of list) {
        try { report.handlers[group + '/' + h] = typeof require('./_h/' + h) === 'function' ? 'ok' : 'NOT A FUNCTION'; }
        catch (e) { report.handlers[group + '/' + h] = 'FAILED: ' + String(e.message).split('\n')[0]; }
      }
    }
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json(report);
  }
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.status(200).json({ url: process.env.SUPABASE_URL, anon: process.env.SUPABASE_ANON_KEY });
};
