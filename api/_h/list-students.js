const { admin, db } = require('../_lib');
// Students overview for the admin panel: name, email (from the login system), courses, activity counts, blocked or not.
module.exports = async (req, res) => {
  if (!(await admin(req, res))) return;
  const [ps, st, cs, ul] = await Promise.all([
    db.from('profiles').select('id,full_name,city,university,is_admin,created_at').order('created_at', { ascending: false }).limit(1000),
    db.rpc('admin_student_stats'),
    db.from('courses').select('id,title,price').order('position'),
    db.auth.admin.listUsers({ page: 1, perPage: 1000 })
  ]);
  if (st.error) return res.status(500).json({ error: 'Run supabase/migration-admin.sql first (' + st.error.message + ').' });
  const users = Object.fromEntries((ul.data?.users || []).map(u => [u.id, u]));
  const stats = Object.fromEntries((st.data || []).map(s => [s.user_id, s]));
  const now = Date.now();
  res.json({
    courses: cs.data || [],
    students: (ps.data || []).map(p => {
      const u = users[p.id] || {}, s = stats[p.id] || {};
      return { id: p.id, name: p.full_name, city: p.city, university: p.university, is_admin: p.is_admin, email: u.email || '',
        blocked: !!u.banned_until && new Date(u.banned_until) > now, last: u.last_sign_in_at || null,
        modules_done: +s.modules_done || 0, quizzes_passed: +s.quizzes_passed || 0, pitches: +s.pitches || 0, courses: s.courses || [] };
    })
  });
};
