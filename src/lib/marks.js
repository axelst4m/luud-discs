/**
 * marks.js
 *
 * Pure storage for per-track flags (starred, heard). Keyed by the raw
 * filename — which is stable across parses of the same export — so
 * marking persists from session to session even if the user re-uploads
 * their Nicotine+ JSON tomorrow.
 *
 * Backed by localStorage when available, falls back to an in-memory
 * object in environments that don't expose it (e.g. tests, privacy
 * mode). The public API is a small set of pure-ish functions; callers
 * should treat the returned objects as read-only snapshots.
 */

const STORAGE_KEY = 'slsk.marks';

/**
 * @typedef {Object} Mark
 * @property {boolean=} starred
 * @property {boolean=} heard
 */

/**
 * Get an in-memory backend that speaks the same API as localStorage.
 * We wrap everything in try/catch so private browsing or quota errors
 * never break the app — at worst marks are lost at reload.
 */
function makeBackend() {
  if (typeof localStorage !== 'undefined') {
    return {
      read() {
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          return raw ? JSON.parse(raw) : {};
        } catch { return {}; }
      },
      write(obj) {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(obj)); } catch { /* swallow */ }
      },
    };
  }
  // in-memory fallback
  let store = {};
  return {
    read()  { return { ...store }; },
    write(obj) { store = { ...obj }; },
  };
}

// Internal state — read once, kept in sync with storage on every write.
const backend = makeBackend();
let cache = backend.read();

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * @param {string} filename
 * @returns {Mark}
 */
export function getMark(filename) {
  if (!filename) return {};
  return { ...(cache[filename] || {}) };
}

/**
 * @returns {Record<string, Mark>}  flat map of all marks
 */
export function allMarks() {
  return { ...cache };
}

/**
 * @returns {string[]}  filenames currently starred, in insertion order
 */
export function allStarred() {
  const out = [];
  for (const [filename, mark] of Object.entries(cache)) {
    if (mark && mark.starred) out.push(filename);
  }
  return out;
}

/**
 * Toggle the "starred" flag on a single track.
 * @param {string} filename
 * @returns {Mark}  the new mark (for consumers that want to update UI state)
 */
export function toggleStar(filename) {
  return setFlag(filename, 'starred', !cache[filename]?.starred);
}

/**
 * Toggle the "heard" flag on a single track.
 * @param {string} filename
 * @returns {Mark}
 */
export function toggleHeard(filename) {
  return setFlag(filename, 'heard', !cache[filename]?.heard);
}

/**
 * Explicit setter — useful for "clear" or programmatic actions like
 * unstarring from the starred footer.
 * @param {string} filename
 * @param {Partial<Mark>} patch
 * @returns {Mark}
 */
export function setMark(filename, patch) {
  if (!filename) return {};
  const current = cache[filename] || {};
  const merged = { ...current, ...patch };
  // prune falsy flags to keep storage small and round-tripping stable
  if (!merged.starred) delete merged.starred;
  if (!merged.heard)   delete merged.heard;

  if (Object.keys(merged).length === 0) {
    delete cache[filename];
  } else {
    cache[filename] = merged;
  }
  backend.write(cache);
  return { ...(cache[filename] || {}) };
}

/**
 * Drop every mark.
 */
export function clearAll() {
  cache = {};
  backend.write(cache);
}

/**
 * Drop every "starred" flag (used by the footer's CLEAR action).
 * "heard" flags are preserved.
 */
export function clearStarred() {
  for (const f of Object.keys(cache)) {
    if (cache[f].starred) {
      const next = { ...cache[f] };
      delete next.starred;
      if (Object.keys(next).length === 0) delete cache[f];
      else cache[f] = next;
    }
  }
  backend.write(cache);
}

/**
 * Reset the cache from storage. Exposed for tests that want to pre-seed
 * localStorage and then observe our behaviour.
 */
export function __reloadFromStorage() {
  cache = backend.read();
}

// ---------------------------------------------------------------------------
// internals
// ---------------------------------------------------------------------------

function setFlag(filename, flag, value) {
  return setMark(filename, { [flag]: value || undefined });
}
