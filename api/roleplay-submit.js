const { db, user } = require('./_lib');
// The server replays the student's path through the scenario and computes the scores itself,
// so the browser cannot invent points. Each skill is capped per scenario and only the best run counts.
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  const u = await user(req);
  if (!u) return res.status(401).json({ error: 'Sign in first.' });
  const { scenario_id, path } = req.body || {};
  const { data: sc } = await db.from('scenarios').select('data').eq('id', scenario_id).maybeSingle();
  if (!sc || !Array.isArray(path) || path.length > 12) return res.status(400).json({ error: 'Invalid run.' });
  const nodes = sc.data.nodes; let cur = sc.data.start; const scores = {};
  for (const step of path) {
    const n = nodes[cur], ch = n && !n.end && n.choices?.[step?.[1]];
    if (!ch || step[0] !== cur) return res.status(400).json({ error: 'Invalid run.' });
    for (const [k, v] of Object.entries(ch.score || {})) scores[k] = (scores[k] || 0) + v;
    cur = ch.next;
  }
  if (!nodes[cur]?.end) return res.status(400).json({ error: 'Scenario not finished.' });
  for (const k of Object.keys(scores)) scores[k] = Math.min(30, scores[k]);
  const source = 'scenario:' + scenario_id;
  const { data: old } = await db.from('skill_events').select('skill,points').eq('user_id', u.id).eq('source', source);
  const prev = Object.fromEntries((old || []).map(o => [o.skill, o.points]));
  const rows = Object.entries(scores).filter(([, v]) => v > 0).map(([skill, v]) => ({ user_id: u.id, source, skill, points: Math.max(v, prev[skill] || 0) }));
  if (rows.length) await db.from('skill_events').upsert(rows);
  res.json({ scores });
};
