// Shared server helpers. Runs only on Vercel, so the secret keys below never reach the browser.
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

async function user(req) {
  const t = (req.headers.authorization || '').replace('Bearer ', '');
  if (!t) return null;
  const { data } = await db.auth.getUser(t);
  return data?.user || null;
}

const same = (a, b) => {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

// Admin gate: signed in + is_admin in the database + correct ADMIN_CODE. 5 wrong codes lock it for 15 minutes.
async function admin(req, res) {
  const u = await user(req);
  if (!u) { res.status(401).json({ error: 'Sign in first.' }); return null; }
  const { data: p } = await db.from('profiles').select('is_admin').eq('id', u.id).maybeSingle();
  if (!p?.is_admin) { res.status(403).json({ error: 'Not allowed.' }); return null; }
  const { data: a } = await db.from('admin_attempts').select('*').eq('user_id', u.id).maybeSingle();
  if (a?.locked_until && new Date(a.locked_until) > new Date()) { res.status(429).json({ error: 'Too many wrong codes. Try again in 15 minutes.' }); return null; }
  if (!process.env.ADMIN_CODE || !same(req.headers['x-admin-code'] || '', process.env.ADMIN_CODE)) {
    const n = (a?.failed || 0) + 1;
    await db.from('admin_attempts').upsert({ user_id: u.id, failed: n >= 5 ? 0 : n, locked_until: n >= 5 ? new Date(Date.now() + 15 * 60000).toISOString() : null });
    res.status(401).json({ error: 'Wrong admin code.' }); return null;
  }
  if (a?.failed) await db.from('admin_attempts').upsert({ user_id: u.id, failed: 0, locked_until: null });
  return u;
}

// Calls Groq (OpenAI-compatible API) and returns the first JSON object in the reply.
// content: a string, or an array of parts (text / image_url) for receipt images.
async function ai(content, system, max = 1500) {
  const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: 'Bearer ' + process.env.GROQ_API_KEY },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL || 'qwen/qwen3.8-27b',
      max_tokens: max + 2000, temperature: 0,
      messages: [{ role: 'system', content: system }, { role: 'user', content }]
    })
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error?.message || 'AI request failed');
  const txt = String(j.choices?.[0]?.message?.content || '').replace(/<think>[\s\S]*?<\/think>/g, '');
  const m = txt.match(/\{[\s\S]*\}/);
  if (!m) throw new Error('AI returned no JSON');
  return JSON.parse(m[0]);
}

const SK = ['communication', 'eq', 'leadership', 'negotiation', 'presence'];
// Validates a roleplay scenario: every choice points to a real node, every decision has 2-4 choices, scores are 0-10.
function cleanScenario(o) {
  const raw = o?.nodes || {}, ids = Object.keys(raw).slice(0, 14), nodes = {};
  for (const id of ids) {
    const n = raw[id] || {}, node = { text: String(n.text || '').slice(0, 500) };
    if (n.end) node.end = true;
    else node.choices = (n.choices || []).slice(0, 4).map(c => ({
      text: String(c.text || '').slice(0, 240), next: String(c.next || ''),
      score: Object.fromEntries(SK.filter(k => Number.isFinite(+c.score?.[k])).map(k => [k, Math.max(0, Math.min(10, Math.round(+c.score[k])))]))
    }));
    nodes[id] = node;
  }
  for (const id of ids) {
    const n = nodes[id];
    if (!n.text) return null;
    if (!n.end && (!n.choices || n.choices.length < 2 || n.choices.some(c => !c.text || !nodes[c.next]))) return null;
  }
  if (!ids.some(i => nodes[i].end)) return null;
  return { start: nodes[o.start] ? o.start : ids[0], nodes };
}

module.exports = { db, user, admin, ai, cleanScenario, SK };
