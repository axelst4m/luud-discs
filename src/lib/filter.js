/**
 * filter.js
 *
 * Pure filtering helpers for the results pipeline. Same criteria shape
 * works for FLAT (filterTracks) and TREE (filterTree). No DOM here — the
 * UI layer decides what to do with the filtered data.
 */

/**
 * @typedef {Object} FilterCriteria
 * @property {string=} query                       free-text match (case-insensitive)
 * @property {Set<string>|string[]=} formats       keep only these formats; empty/absent = all
 * @property {"all"|"unheard"|"starred"|"heard"=} state
 * @property {(filename: string) => { starred?: boolean, heard?: boolean }} getMark
 */

/**
 * Reduce a flat list of tracks down to those matching the criteria.
 *
 * @template {Object} T
 * @param {T[]} tracks
 * @param {FilterCriteria} criteria
 * @returns {T[]}
 */
export function filterTracks(tracks, criteria) {
  const { query, formats, state, getMark } = normalize(criteria);
  const out = [];
  for (const t of tracks) {
    if (trackMatches(t, query, formats, state, getMark)) out.push(t);
  }
  return out;
}

/**
 * Recursively filter a folder tree. Folders survive if they (or any
 * descendant) hold at least one matching track. Returns a new tree —
 * original nodes are never mutated.
 *
 * @param {import('./parsers/nicotine.js').FolderNode} root
 * @param {FilterCriteria} criteria
 * @returns {import('./parsers/nicotine.js').FolderNode}
 */
export function filterTree(root, criteria) {
  const norm = normalize(criteria);
  return filterNode(root, norm);
}

/**
 * Does this set of criteria match "show everything"?
 * Handy for skipping the filter pass when nothing is active.
 * @param {FilterCriteria} criteria
 */
export function isEmptyCriteria(criteria) {
  if (!criteria) return true;
  if (criteria.query && criteria.query.trim().length) return false;
  if (criteria.formats && sizeOf(criteria.formats) > 0) return false;
  if (criteria.state && criteria.state !== 'all') return false;
  return true;
}

// ---------------------------------------------------------------------------
// internals
// ---------------------------------------------------------------------------

function normalize(criteria) {
  const c = criteria || {};
  return {
    query:    (c.query || '').trim().toLowerCase(),
    formats:  toSet(c.formats),
    state:    c.state || 'all',
    getMark:  typeof c.getMark === 'function' ? c.getMark : () => ({}),
  };
}

function toSet(v) {
  if (!v) return null;
  if (v instanceof Set) return v.size > 0 ? v : null;
  if (Array.isArray(v)) return v.length > 0 ? new Set(v) : null;
  return null;
}

function sizeOf(v) {
  if (!v) return 0;
  if (v instanceof Set) return v.size;
  if (Array.isArray(v)) return v.length;
  return 0;
}

/**
 * @param {any} track
 * @param {string} q
 * @param {Set<string>|null} formats
 * @param {string} state
 * @param {(f: string) => any} getMark
 */
function trackMatches(track, q, formats, state, getMark) {
  if (q) {
    const haystack = (
      (track.title      || '') + ' ' +
      (track.filename   || '') + ' ' +
      (track.folderPath || '')
    ).toLowerCase();
    if (!haystack.includes(q)) return false;
  }
  if (formats && track.format && !formats.has(track.format)) return false;
  if (state !== 'all') {
    const m = getMark(track.filename) || {};
    if (state === 'starred' && !m.starred) return false;
    if (state === 'heard'   && !m.heard)   return false;
    if (state === 'unheard' && m.heard)    return false;
  }
  return true;
}

function filterNode(node, crit) {
  const keptTracks = [];
  for (const t of node.tracks) {
    if (trackMatches(t, crit.query, crit.formats, crit.state, crit.getMark)) {
      keptTracks.push(t);
    }
  }
  const keptChildren = [];
  for (const c of node.children) {
    const sub = filterNode(c, crit);
    if (sub.tracks.length > 0 || sub.children.length > 0) keptChildren.push(sub);
  }
  return {
    name: node.name,
    path: node.path,
    children: keptChildren,
    tracks: keptTracks,
    stats: node.stats, // keep original aggregated stats for summary context
  };
}
