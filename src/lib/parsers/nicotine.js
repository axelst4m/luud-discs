/**
 * parsers/nicotine.js
 *
 * Turns a parsed Nicotine+ shares export into two consumable structures:
 *   - a flat `tracks[]` for list / search / filter UIs
 *   - a hierarchical `tree` for folder-browser UIs
 *
 * Plus the source user's name (extracted from the "@@username\" path prefix)
 * and global stats aggregated over the whole export.
 *
 * ---------------------------------------------------------------------------
 * Export shape reminder:
 *
 *   [ [folderPath, [ [code, filename, sizeBytes, null, metaDict], ... ]], ... ]
 *
 * - folderPath starts with "@@username\" and is backslash-separated (Windows).
 * - metaDict keys are strings of small numbers:
 *     "0" = bitrate kbps (MP3 only)
 *     "1" = duration seconds
 *     "4" = sample rate Hz (FLAC)
 *     "5" = bit depth       (FLAC)
 * ---------------------------------------------------------------------------
 */

// ---------------------------------------------------------------------------
// Types (JSDoc)
// ---------------------------------------------------------------------------

/**
 * @typedef {"mp3"|"flac"|"wav"|"m4a"|"aiff"|"ogg"|"opus"|"aac"|"wma"|"alac"|"other"} Format
 */

/**
 * @typedef {Object} Track
 * @property {string}  filename
 * @property {string}  folderPath   backslash-separated, WITHOUT the @@user\ prefix
 * @property {string[]} folderParts  split version of folderPath
 * @property {number}  sizeBytes
 * @property {Format}  format
 * @property {number=} durationSec
 * @property {number=} bitrateKbps
 * @property {number=} sampleRateHz
 * @property {number=} bitDepth
 */

/**
 * @typedef {Object} FolderStats
 * @property {number} trackCount
 * @property {number} totalSizeBytes
 * @property {number} totalDurationSec
 * @property {Record<Format, number>} formats
 */

/**
 * @typedef {Object} FolderNode
 * @property {string} name          last path segment (empty string for the virtual root)
 * @property {string} path          full folder path (joined by "\")
 * @property {FolderNode[]} children
 * @property {Track[]} tracks
 * @property {FolderStats} stats
 */

/**
 * @typedef {Object} NicotineParseResult
 * @property {Track[]} tracks
 * @property {FolderNode} tree
 * @property {string|null} username
 * @property {FolderStats} stats
 */

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Parse a Nicotine+ shares export.
 * @param {unknown} json  already JSON.parse'd export data
 * @returns {NicotineParseResult}
 */
export function parseNicotine(json) {
  if (!Array.isArray(json)) {
    throw new TypeError('parseNicotine: expected an array at the root');
  }

  const username = inferUsername(json);
  const tracks = [];

  // Build the flat list in one pass over the raw entries.
  for (const entry of json) {
    if (!Array.isArray(entry) || entry.length < 2) continue;
    const [rawPath, files] = entry;
    if (!Array.isArray(files)) continue;

    const relPath = stripUsername(rawPath, username);
    const folderParts = splitPath(relPath);

    for (const file of files) {
      const track = buildTrack(file, relPath, folderParts);
      if (track) tracks.push(track);
    }
  }

  // Build the folder tree from the flat track list.
  const tree = buildTree(tracks);
  computeStats(tree); // mutates each node to attach stats

  return {
    tracks,
    tree,
    username,
    stats: { ...tree.stats },
  };
}

// ---------------------------------------------------------------------------
// Helpers — exported for targeted unit tests
// ---------------------------------------------------------------------------

/**
 * Find the "@@username\" prefix by scanning the entries.
 * @param {unknown[]} entries
 * @returns {string|null}
 */
export function inferUsername(entries) {
  for (const entry of entries) {
    if (!Array.isArray(entry)) continue;
    const path = entry[0];
    if (typeof path !== 'string') continue;
    const m = path.match(/^@@([^\\]+)\\/);
    if (m) return m[1];
    // Some exports might have "@@username" with no trailing backslash if
    // that user shares nothing at the root — handle it too.
    if (path.startsWith('@@')) return path.slice(2);
  }
  return null;
}

/**
 * Remove the "@@username\" prefix from a path. If username is null or the
 * path doesn't start with that prefix, the path is returned as-is.
 * @param {string} rawPath
 * @param {string|null} username
 * @returns {string}
 */
export function stripUsername(rawPath, username) {
  if (typeof rawPath !== 'string') return '';
  if (!username) return rawPath;
  const prefix = `@@${username}\\`;
  if (rawPath.startsWith(prefix)) return rawPath.slice(prefix.length);
  if (rawPath === `@@${username}`) return '';
  return rawPath;
}

/**
 * Split a backslash-separated path into non-empty segments.
 * @param {string} path
 * @returns {string[]}
 */
export function splitPath(path) {
  if (!path) return [];
  return path.split('\\').filter(Boolean);
}

/**
 * Guess the audio format from a filename's extension.
 * @param {string} filename
 * @returns {Format}
 */
export function inferFormat(filename) {
  if (typeof filename !== 'string') return 'other';
  const m = filename.match(/\.([a-z0-9]+)$/i);
  if (!m) return 'other';
  const ext = m[1].toLowerCase();
  const known = ['mp3','flac','wav','m4a','aiff','ogg','opus','aac','wma','alac'];
  return known.includes(ext) ? /** @type {Format} */ (ext) : 'other';
}

/**
 * Decode a Nicotine+ metadata dict (numeric-string keys) into named fields.
 * Missing keys come out as `undefined`, not zero, so consumers can tell
 * "not provided" apart from a legitimate zero.
 *
 * @param {unknown} dict
 * @returns {{ bitrateKbps?:number, durationSec?:number, sampleRateHz?:number, bitDepth?:number }}
 */
export function parseMetaDict(dict) {
  if (!dict || typeof dict !== 'object') return {};
  const out = {};
  const d = /** @type {Record<string, unknown>} */ (dict);
  if (typeof d['0'] === 'number') out.bitrateKbps  = d['0'];
  if (typeof d['1'] === 'number') out.durationSec  = d['1'];
  if (typeof d['4'] === 'number') out.sampleRateHz = d['4'];
  if (typeof d['5'] === 'number') out.bitDepth     = d['5'];
  return out;
}

/**
 * Produce a Track from a raw file tuple. Returns null for malformed tuples.
 * @param {unknown} fileTuple
 * @param {string} folderPath
 * @param {string[]} folderParts
 * @returns {Track|null}
 */
export function buildTrack(fileTuple, folderPath, folderParts) {
  if (!Array.isArray(fileTuple) || fileTuple.length < 3) return null;
  const [, filename, sizeBytes, , metaDict] = fileTuple;
  if (typeof filename !== 'string') return null;

  const meta = parseMetaDict(metaDict);
  return {
    filename,
    folderPath,
    folderParts,
    sizeBytes: typeof sizeBytes === 'number' ? sizeBytes : 0,
    format:   inferFormat(filename),
    ...meta,
  };
}

/**
 * Build a folder tree from a flat list of tracks. The returned node is a
 * virtual root (empty name/path) whose `children` are the top-level folders.
 *
 * @param {Track[]} tracks
 * @returns {FolderNode}
 */
export function buildTree(tracks) {
  const root = makeNode('', '');
  for (const track of tracks) {
    let node = root;
    let pathAcc = '';
    for (const part of track.folderParts) {
      pathAcc = pathAcc ? pathAcc + '\\' + part : part;
      let child = node.children.find((c) => c.name === part);
      if (!child) {
        child = makeNode(part, pathAcc);
        node.children.push(child);
      }
      node = child;
    }
    node.tracks.push(track);
  }
  return root;
}

/**
 * Walk the tree post-order, attaching aggregated stats to each node.
 * Mutates nodes in place. Returns the root node for chaining.
 * @param {FolderNode} node
 * @returns {FolderNode}
 */
export function computeStats(node) {
  const formats = /** @type {Record<Format, number>} */ ({});
  let trackCount = 0;
  let totalSizeBytes = 0;
  let totalDurationSec = 0;

  for (const child of node.children) {
    computeStats(child);
    trackCount      += child.stats.trackCount;
    totalSizeBytes  += child.stats.totalSizeBytes;
    totalDurationSec += child.stats.totalDurationSec;
    for (const [fmt, n] of Object.entries(child.stats.formats)) {
      formats[fmt] = (formats[fmt] || 0) + n;
    }
  }

  for (const t of node.tracks) {
    trackCount      += 1;
    totalSizeBytes  += t.sizeBytes || 0;
    totalDurationSec += t.durationSec || 0;
    formats[t.format] = (formats[t.format] || 0) + 1;
  }

  node.stats = { trackCount, totalSizeBytes, totalDurationSec, formats };
  return node;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * @param {string} name
 * @param {string} path
 * @returns {FolderNode}
 */
function makeNode(name, path) {
  return {
    name,
    path,
    children: [],
    tracks: [],
    stats: { trackCount: 0, totalSizeBytes: 0, totalDurationSec: 0, formats: {} },
  };
}
