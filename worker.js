// GET  /api/count                 -> { visits, clicks }
// POST /api/count { action }      -> { visits, clicks }   action: "visit" | "click"
//
// The client can only choose which counter moves; amounts never come from the client.

const HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
};

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: HEADERS });

// Single-row upsert: atomic increment, existing totals are never overwritten.
const BUMP = `INSERT INTO counter (id, visits, clicks) VALUES (1, ?, ?)
  ON CONFLICT (id) DO UPDATE SET
    visits = counter.visits + excluded.visits,
    clicks = counter.clicks + excluded.clicks
  RETURNING visits, clicks`;

async function count(request, env) {
  if (!env.DB) return json({ error: 'counter unavailable' }, 503);

  if (request.method === 'GET' || request.method === 'HEAD') {
    try {
      const row = await env.DB.prepare('SELECT visits, clicks FROM counter WHERE id = 1').first();
      return json({ visits: row?.visits ?? 0, clicks: row?.clicks ?? 0 });
    } catch {
      return json({ error: 'counter unavailable' }, 503);
    }
  }

  if (request.method !== 'POST') return json({ error: 'method not allowed' }, 405);

  // Only the site's own pages may increment: full origin match, JSON body.
  if (request.headers.get('origin') !== new URL(request.url).origin) {
    return json({ error: 'forbidden' }, 403);
  }
  if (!(request.headers.get('content-type') || '').startsWith('application/json')) {
    return json({ error: 'unsupported media type' }, 415);
  }

  let action;
  try {
    action = (await request.json())?.action;
  } catch {
    action = null;
  }
  if (action !== 'visit' && action !== 'click') {
    return json({ error: 'invalid action' }, 400);
  }

  try {
    const row = await env.DB.prepare(BUMP)
      .bind(action === 'visit' ? 1 : 0, action === 'click' ? 1 : 0)
      .first();
    return json({ visits: row.visits, clicks: row.clicks });
  } catch {
    return json({ error: 'counter unavailable' }, 503);
  }
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (pathname === '/api/count' || pathname === '/api/count/') {
      return count(request, env);
    }
    return env.ASSETS.fetch(request);
  },
};
