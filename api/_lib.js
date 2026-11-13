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

// Calls Claude and returns the first JSON object in the reply.
async function ai(content, system, max = 1500) {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: process.env.AI_MODEL || 'claude-sonnet-5-5', max_tokens: max, system, messages: [{ role: 'user', content }] })
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error?.message || 'AI request failed');
  const txt = (j.content || []).map(c => c.text || '').join('');
  const m = txt.match(/\{[\s\S]*\}/);
  if (!m) throw new Error('AI returned no JSON');
  return JSON.parse(m[0]);
}

module.exports = { db, user, admin, ai };
