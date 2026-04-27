/**
 * Cloudflare Worker for luud-discs.fr
 *
 * Two responsibilities:
 *  1. /api/yt-search?q=...  →  scrape the first YouTube video for a query
 *     and return { videoId, title } as JSON. Used by SLSK-TOOL to power
 *     the embedded preview player without depending on third-party
 *     services like Piped or Invidious.
 *  2. Everything else  →  delegated to the static-assets binding (the
 *     Vite build output), with the SPA fallback handled by the
 *     `not_found_handling: "single-page-application"` config.
 *
 * Results from /api/yt-search are cached in `caches.default` for 1 hour
 * to keep YouTube traffic to a minimum and to make repeat clicks instant.
 */

const YT_SEARCH_BASE = 'https://www.youtube.com/results?search_query=';
const CACHE_TTL_SECONDS = 3600;

const REQUEST_HEADERS = {
  // A real-looking browser User-Agent is necessary; YouTube serves a
  // different (almost empty) HTML to obvious bots.
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.5',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
};

const JSON_CORS_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

export default {
  /**
   * @param {Request} request
   * @param {{ ASSETS: { fetch: (req: Request) => Promise<Response> } }} env
   * @param {ExecutionContext} ctx
   */
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === '/api/yt-search') {
      return handleYtSearch(url, ctx);
    }

    // Everything else: serve from the static assets binding.
    return env.ASSETS.fetch(request);
  },
};

// ---------------------------------------------------------------------------
// /api/yt-search
// ---------------------------------------------------------------------------

async function handleYtSearch(url, ctx) {
  if (url.search === '') {
    // Pre-flight or empty call: bail early without hitting YT.
    return jsonResponse({ error: 'missing q' }, 400);
  }

  const q = (url.searchParams.get('q') || '').trim();
  if (!q) return jsonResponse({ error: 'missing q' }, 400);
  if (q.length > 200) return jsonResponse({ error: 'query too long' }, 400);

  // Cache lookup. The cache key is a synthetic Request that includes the
  // query string so different queries get different entries.
  const cacheKey = new Request(`https://luud-discs.internal/api/yt-search?q=${encodeURIComponent(q)}`);
  const cache = caches.default;
  const hit = await cache.match(cacheKey);
  if (hit) return hit;

  // Fetch the YouTube search page.
  let html;
  try {
    const ytRes = await fetch(YT_SEARCH_BASE + encodeURIComponent(q), {
      headers: REQUEST_HEADERS,
      cf: { cacheEverything: false },
    });
    if (!ytRes.ok) {
      return jsonResponse({ error: `youtube responded ${ytRes.status}` }, 502);
    }
    html = await ytRes.text();
  } catch (err) {
    return jsonResponse({ error: `network error: ${err?.message || err}` }, 502);
  }

  // Extract the first videoId from ytInitialData. The pattern lives in a
  // huge JSON blob inlined in the page; we just need the first match.
  const idMatch = html.match(/"videoId":"([A-Za-z0-9_-]{11})"/);
  if (!idMatch) {
    return jsonResponse({ error: 'no video found' }, 404);
  }
  const videoId = idMatch[1];

  // Best-effort: pull the human title for that video. YouTube nests the
  // title under several possible JSON shapes; we try the most common.
  let title = '';
  const titlePattern = new RegExp(
    `"videoId":"${videoId}"[\\s\\S]{0,400}?` +
      `"title":\\s*\\{\\s*"runs":\\s*\\[\\s*\\{\\s*"text":\\s*"((?:[^"\\\\]|\\\\.)+)"`,
  );
  const titleMatch = html.match(titlePattern);
  if (titleMatch) {
    title = decodeJsonString(titleMatch[1]);
  }

  const body = JSON.stringify({ videoId, title });
  const response = new Response(body, {
    status: 200,
    headers: {
      ...JSON_CORS_HEADERS,
      'Cache-Control': `public, max-age=${CACHE_TTL_SECONDS}`,
    },
  });

  // Asynchronously persist the response in the edge cache. cache.put needs
  // a clone because the body stream can only be consumed once.
  ctx.waitUntil(cache.put(cacheKey, response.clone()));

  return response;
}

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: JSON_CORS_HEADERS,
  });
}

/**
 * Lightweight unescape for strings extracted from inlined JSON. Handles
 * \uXXXX, \", \\, \/, \n etc. — enough for video titles.
 */
function decodeJsonString(s) {
  return s
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(/\\(.)/g, '$1');
}
