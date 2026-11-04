const SCORES_PATH = "/api/flappy/scores";
const MAX_SCORE = 100000;

function jsonResponse(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...headers,
    },
  });
}

async function handleFlappyScores(request, env) {
  if (!env.DB) {
    return jsonResponse({ error: "database_unavailable" }, 503);
  }

  const url = new URL(request.url);

  if (request.method === "GET") {
    const requested = Number.parseInt(url.searchParams.get("limit") || "10", 10);
    const limit = Number.isFinite(requested) ? Math.min(Math.max(requested, 1), 50) : 10;

    try {
      const [scoresResult, totalResult] = await env.DB.batch([
        env.DB.prepare(
          "SELECT score, created_at FROM flappy_scores ORDER BY score DESC, created_at ASC LIMIT ?"
        ).bind(limit),
        env.DB.prepare("SELECT COUNT(*) AS total FROM flappy_scores"),
      ]);

      const scores = (scoresResult.results || []).map((row) => ({
        score: Number(row.score) || 0,
        date: row.created_at,
      }));

      return jsonResponse({
        scores,
        total: Number(totalResult.results?.[0]?.total) || 0,
      });
    } catch (error) {
      return jsonResponse({ error: "database_error" }, 500);
    }
  }

  if (request.method === "POST") {
    const origin = request.headers.get("Origin");
    if (origin && origin !== url.origin) {
      return jsonResponse({ error: "forbidden" }, 403);
    }

    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      return jsonResponse({ error: "invalid_content_type" }, 415);
    }

    let payload;
    try {
      payload = await request.json();
    } catch (error) {
      return jsonResponse({ error: "invalid_json" }, 400);
    }

    const score = payload && payload.score;
    if (!Number.isInteger(score) || score < 0 || score > MAX_SCORE) {
      return jsonResponse({ error: "invalid_score" }, 400);
    }

    try {
      await env.DB.prepare(
        "INSERT INTO flappy_scores (score, created_at) VALUES (?, ?)"
      )
        .bind(score, new Date().toISOString())
        .run();

      return jsonResponse({ ok: true }, 201);
    } catch (error) {
      return jsonResponse({ error: "database_error" }, 500);
    }
  }

  return jsonResponse({ error: "method_not_allowed" }, 405, { allow: "GET, POST" });
}

export default {
  fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === SCORES_PATH || url.pathname === SCORES_PATH + "/") {
      return handleFlappyScores(request, env);
    }

    return env.ASSETS.fetch(request);
  },
};
