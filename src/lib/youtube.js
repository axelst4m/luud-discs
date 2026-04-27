/**
 * youtube.js
 *
 * Client-side YouTube search. Turns a text query into a YouTube video ID so
 * the player can embed it. Goes through Piped (https://piped.video) — a
 * privacy-friendly YouTube front-end with a public JSON API and CORS
 * enabled. We try several Piped instances in order with a short timeout
 * each, so a single dead instance doesn't kill the whole feature.
 *
 * No API key, no auth, no user config.
 */

/**
 * Public Piped API instances, tried in order. Swap / extend as instances
 * come and go; the list should be easy to update.
 *
 * Verify with: curl 'https://<host>/search?q=test&filter=music_songs'
 */
const PIPED_INSTANCES = [
  'https://pipedapi.kavin.rocks',
  'https://pipedapi.leptons.xyz',
  'https://pipedapi.adminforge.de',
  'https://api.piped.yt',
];

const REQUEST_TIMEOUT_MS = 2500;

/**
 * @typedef {Object} YoutubeHit
 * @property {string} videoId
 * @property {string} title
 * @property {string} uploader
 * @property {string} source   - which Piped instance served the result
 */

/**
 * Find the first video matching a query.
 * @param {string} query
 * @param {{ fetchFn?: typeof fetch, instances?: string[], timeoutMs?: number }} [opts]
 * @returns {Promise<YoutubeHit|null>}
 */
export async function searchFirstVideo(query, opts = {}) {
  const q = (query || '').trim();
  if (!q) return null;

  const fetchFn   = opts.fetchFn   ?? fetch;
  const instances = opts.instances ?? PIPED_INSTANCES;
  const timeoutMs = opts.timeoutMs ?? REQUEST_TIMEOUT_MS;

  for (const base of instances) {
    try {
      const hit = await searchOne(base, q, fetchFn, timeoutMs);
      if (hit) return hit;
    } catch {
      // try the next instance
    }
  }
  return null;
}

/**
 * @param {string} base
 * @param {string} query
 * @param {typeof fetch} fetchFn
 * @param {number} timeoutMs
 * @returns {Promise<YoutubeHit|null>}
 */
async function searchOne(base, query, fetchFn, timeoutMs) {
  const url = `${base}/search?q=${encodeURIComponent(query)}&filter=music_songs`;

  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), timeoutMs);

  try {
    const res = await fetchFn(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return extractFirstHit(data, base);
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Piped returns { items: [{ url, title, uploaderName, ... }] }.
 * "url" is like "/watch?v=XXXXXXXXXXX"; we extract the id.
 *
 * @param {unknown} data
 * @param {string} source
 * @returns {YoutubeHit|null}
 */
export function extractFirstHit(data, source) {
  if (!data || typeof data !== 'object') return null;
  const items = /** @type {any} */ (data).items;
  if (!Array.isArray(items)) return null;

  for (const item of items) {
    if (!item || typeof item !== 'object') continue;
    const videoId = parseVideoId(item.url);
    if (!videoId) continue;
    return {
      videoId,
      title:    typeof item.title === 'string' ? item.title : '',
      uploader: typeof item.uploaderName === 'string' ? item.uploaderName : '',
      source,
    };
  }
  return null;
}

/**
 * Extract an 11-character YouTube video id from a Piped-style "/watch?v=XX.."
 * url. Accepts absolute urls too. Returns null if no id is found.
 * @param {unknown} url
 * @returns {string|null}
 */
export function parseVideoId(url) {
  if (typeof url !== 'string') return null;
  const m = url.match(/[?&]v=([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

/**
 * Fallback when Piped is down: the normal YouTube search page URL.
 * Used by the player's "failed" state to give users a way out.
 * @param {string} query
 */
export function youtubeSearchUrl(query) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query || '')}`;
}

/**
 * Official YouTube iframe embed URL for a given video id.
 * @param {string} videoId
 * @param {{ autoplay?: boolean }} [opts]
 */
export function youtubeEmbedUrl(videoId, opts = {}) {
  const autoplay = opts.autoplay === false ? 0 : 1;
  return `https://www.youtube.com/embed/${encodeURIComponent(videoId)}?autoplay=${autoplay}&rel=0&modestbranding=1`;
}
