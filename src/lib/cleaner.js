/**
 * cleaner.js
 *
 * Core of the tool. Turns an array of raw filename strings into an array of
 * { title, searchLinks, ... } objects, where searchLinks points to the usual
 * digging platforms (YouTube, SoundCloud, Bandcamp, Discogs).
 *
 * Pipeline is pure and side-effect-free, built from small composable steps.
 * Each step is exported so tests can target it in isolation.
 */

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

const YT_SEARCH = 'https://www.youtube.com/results?search_query=';
const SC_SEARCH = 'https://soundcloud.com/search?q=';
const BC_SEARCH = 'https://bandcamp.com/search?q=';
const DG_SEARCH = 'https://www.discogs.com/search/?q=';

/**
 * @typedef {Object} CleanedTrack
 * @property {string} raw    - original filename
 * @property {string} title  - cleaned, human-readable title
 * @property {{ youtube:string, soundcloud:string, bandcamp:string, discogs:string }} links
 */

/**
 * Clean an array of raw filenames into searchable track entries.
 * @param {string[]} rawFilenames
 * @returns {CleanedTrack[]}
 */
export function cleanTitles(rawFilenames) {
  return rawFilenames.map((raw) => {
    const title = cleanOne(raw);
    return { raw, title, links: buildLinks(title) };
  });
}

/**
 * Clean a single filename. The public entry point for the title pipeline.
 * Exported for unit tests.
 * @param {string} raw
 * @returns {string}
 */
export function cleanOne(raw) {
  if (typeof raw !== 'string') return '';
  let s = raw;
  s = stripExtension(s);
  s = stripTrailingHash(s);
  s = stripSceneTag(s);
  s = stripLeadingTrackNumber(s);
  s = stripLeadingBrackets(s);
  s = normalizeSeparators(s);
  s = collapseWhitespace(s);
  s = trimJunk(s);
  return s;
}

/**
 * @param {string} title
 * @returns {CleanedTrack["links"]}
 */
export function buildLinks(title) {
  const q = encodeURIComponent(title);
  return {
    youtube:    YT_SEARCH + q,
    soundcloud: SC_SEARCH + q,
    bandcamp:   BC_SEARCH + q,
    discogs:    DG_SEARCH + q,
  };
}

// ---------------------------------------------------------------------------
// Pipeline steps (exported for targeted tests)
// ---------------------------------------------------------------------------

/** Known audio extensions we strip without mercy. */
const EXTENSION_RE = /\.(mp3|flac|wav|m4a|aiff|aif|ogg|opus|aac|wma|alac)$/i;

/**
 * Drop the file extension at the end of the string.
 */
export function stripExtension(s) {
  return s.replace(EXTENSION_RE, '');
}

/**
 * Many Bandcamp / Beatport / Juno exports append a short hex hash at the end
 * of the filename, e.g. `01-itoa-diceman-9a7028cb`. We detect and remove it.
 *
 * Rule: 6 to 10 hex characters after the last `-`, preceded by at least one
 * alphanumeric chunk, at the very end of the string.
 */
const TRAILING_HASH_RE = /-[0-9a-f]{6,10}$/i;
export function stripTrailingHash(s) {
  return s.replace(TRAILING_HASH_RE, '');
}

/**
 * Known scene release group suffixes spotted in real Nicotine+ exports.
 * When the filename ends with `-XXXX` and XXXX matches one of these (case-
 * insensitive), we strip it. Conservative list on purpose — adding entries
 * is safer than having a broad regex eat parts of actual titles.
 */
const SCENE_GROUPS = new Set([
  'oma', 'mim', 'kouala', 'usr', 'lir', 'enslave',
  'prescription', 'nonscn', 'cmc', 'dl_int', 'dlint',
  'just', 'scrub', 'fng', 'rtb', 'h3k', 'c4', 'ftd',
  'web', 'cd', 'vinyl', '320', 'flac', '2017', '2018',
  '2019', '2020', '2021', '2022', '2023', '2024',
]);
const SCENE_TAIL_RE = /-([a-z0-9_]+)$/i;

export function stripSceneTag(s) {
  const m = s.match(SCENE_TAIL_RE);
  if (!m) return s;
  if (SCENE_GROUPS.has(m[1].toLowerCase())) {
    return s.slice(0, m.index);
  }
  return s;
}

/**
 * Strip common leading track number patterns.
 * Handles: "01 ", "01-", "01.", "01_", "[01]", "(01)", "1-01 " (disc-track),
 * vinyl positions like "A1", "a1", "1a", "[A1]", "[b2]-", etc.
 * Conservative: only strips when followed by an obvious separator.
 */
const TRACK_NUMBER_PATTERNS = [
  // Bracketed track numbers: [01], (01), [A1], [b2]
  /^[[(](?:\d{1,3}|[a-z]\d{1,2}|\d{1,2}[a-z])[\])][-.\s_]+/i,
  // Disc-track like "1-01 " or "1.01 " (strict: digit-digit-separator)
  /^\d{1,2}[-.]\d{1,3}[-.\s_]+/,
  // CD prefix "CD1 01 " etc.
  /^CD\d{1,2}[-\s_]+\d{1,3}[-.\s_]+/i,
  // Simple "01 ", "01-", "01.", "01_" at the start
  /^\d{1,3}[-.\s_]+/,
  // Vinyl position like "A1-", "a1_", "1a " (letter+digit or digit+letter, then separator)
  /^(?:[a-h]\d{1,2}|\d{1,2}[a-h])[-.\s_]+/i,
];

export function stripLeadingTrackNumber(s) {
  // Single pass only. A recursive loop would be too aggressive — it would
  // eat the "9" in "01 9 AM" (leaving just "AM") or the "400" in
  // "02 - 400 kW" (leaving just "kW"). One strip per filename is correct:
  //   "[01] [Synkro] - ..." → "[Synkro] - ..."  (brackets handled next)
  //   "1-01 Feel The Beat"  → "Feel The Beat"
  //   "01 9 AM"             → "9 AM"            (preserved)
  let cur = s;
  for (const re of TRACK_NUMBER_PATTERNS) {
    const next = cur.replace(re, '');
    if (next !== cur) return next; // stop at the first pattern that matched
  }
  return cur;
}

/**
 * After track-number stripping, some filenames still start with a leading
 * bracketed token we want to keep as information but drop from the searchable
 * title when it's redundant (artist name already repeated).
 *
 * For the cleaner's current scope we only drop leading empty brackets or
 * brackets containing artist-looking tokens followed by "- ".
 * Example: "[Synkro] - Progression" → "Synkro - Progression"
 */
const LEADING_BRACKET_ARTIST_RE = /^\[([^\]]+)\][-.\s_]+/;
export function stripLeadingBrackets(s) {
  const m = s.match(LEADING_BRACKET_ARTIST_RE);
  if (!m) return s;
  // Replace "[Artist] - " with "Artist - "
  return m[1] + ' - ' + s.slice(m[0].length);
}

/**
 * Turn separators used in filenames into spaces.
 *
 * In Nicotine+/Soulseek filenames, the "-" character is almost always a
 * separator between artist and title (e.g. "itoa-diceman"), not a true
 * hyphen inside a word. So we convert any "-" sandwiched between two
 * alphanumeric characters into " - ". This may over-split rare hyphenated
 * words like "non-stop" into "non - stop", but that's harmless for a
 * YouTube search query and the tradeoff is worth it.
 */
export function normalizeSeparators(s) {
  return s
    .replace(/_-_/g, ' - ')                   // "artist_-_title"
    .replace(/--+/g, ' - ')                   // "artist--title"
    .replace(/([a-z0-9])-([a-z0-9])/gi, '$1 - $2') // "artist-title" → "artist - title"
    .replace(/_/g, ' ')                       // remaining underscores → space
    .replace(/\s+-\s+/g, ' - ');              // normalize any existing " - "
}

/**
 * Collapse any run of whitespace into a single space.
 */
export function collapseWhitespace(s) {
  return s.replace(/\s+/g, ' ');
}

/**
 * Strip leading/trailing separators, dashes, dots and spaces.
 */
export function trimJunk(s) {
  return s.replace(/^[\s\-_.]+|[\s\-_.]+$/g, '').trim();
}
