/**
 * youtube.js
 *
 * Client-side bridge to our own /api/yt-search endpoint, served by the
 * Cloudflare Worker at worker/index.js. The Worker does the actual
 * YouTube scraping server-side (no CORS limits, fresh on every cache
 * miss, results cached at the edge for 1h).
 *
 * Same return shape as before so the rest of the app (player, queue)
 * doesn't need to change.
 */

const DEFAULT_ENDPOINT = '/api/yt-search';

/**
 * @typedef {Object} YoutubeHit
 * @property {string} videoId
 * @property {string} title
 * @property {string} uploader   - kept for shape compatibility, currently empty
 * @property {string} source     - "self" since we own the backend
 */

/**
 * Find the first matching video for a query.
 *
 * @param {string} query
 * @param {{ fetchFn?: typeof fetch, endpoint?: string, signal?: AbortSignal }} [opts]
 * @returns {Promise<YoutubeHit | null>}
 */
export async function searchFirstVideo(query, opts = {}) {
  const q = (query || '').trim();
  if (!q) return null;

  const fetchFn  = opts.fetchFn  ?? fetch;
  const endpoint = opts.endpoint ?? DEFAULT_ENDPOINT;
  const signal   = opts.signal;

  const url = `${endpoint}?q=${encodeURIComponent(q)}`;

  let res;
  try {
    res = await fetchFn(url, { signal });
  } catch {
    return null;
  }
  if (!res.ok) return null;

  /** @type {{ videoId?: string, title?: string, error?: string }} */
  let data;
  try {
    data = await res.json();
  } catch {
    return null;
  }

  if (!data || typeof data.videoId !== 'string') return null;

  return {
    videoId:  data.videoId,
    title:    typeof data.title === 'string' ? data.title : '',
    uploader: '',
    source:   'self',
  };
}

/**
 * Fallback link to the public YouTube search page. Used by the player's
 * "failed" state to give the user a way out.
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
  return (
    `https://www.youtube.com/embed/${encodeURIComponent(videoId)}` +
    `?autoplay=${autoplay}&rel=0&modestbranding=1&enablejsapi=1`
  );
}
