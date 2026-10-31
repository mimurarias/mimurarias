// Cloudflare Pages Function: GET /api/count (read), POST /api/count (increment)
// Requires a D1 binding named DB.
const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8' };

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

export async function onRequest({ request, env }) {
  const db = env.DB;
  if (!db) return json({ count: 0, error: 'D1 binding "DB" not configured' }, 503);

  // Idempotent bootstrap: works even if migrations were never applied.
  await db.exec(
    'CREATE TABLE IF NOT EXISTS counter (id INTEGER PRIMARY KEY CHECK (id = 1), count INTEGER NOT NULL DEFAULT 0);' +
    'INSERT OR IGNORE INTO counter (id, count) VALUES (1, 0);'
  );

  try {
    if (request.method === 'POST') {
      // Same-origin check: reject cross-site counter abuse.
      const origin = request.headers.get('origin');
      if (origin && new URL(origin).host !== new URL(request.url).host) {
        return json({ error: 'forbidden' }, 403);
      }

      await db.prepare('UPDATE counter SET count = count + 1 WHERE id = 1').run();
    } else if (request.method !== 'GET' && request.method !== 'HEAD') {
      return json({ error: 'method not allowed' }, 405);
    }

    const row = await db.prepare('SELECT count FROM counter WHERE id = 1').first();
    return json({ count: Number(row?.count || 0) });
  } catch (err) {
    return json({ error: 'counter unavailable', detail: String(err) }, 500);
  }
}
