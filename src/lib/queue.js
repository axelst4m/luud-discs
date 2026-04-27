/**
 * lib/queue.js
 *
 * Tiny queue store. Holds an ordered list of tracks the user wants to
 * preview in sequence, plus the index of the one currently playing.
 *
 * Persisted in localStorage so a refresh keeps your queue. The store
 * exposes a useSyncExternalStore-friendly subscribe/snapshot pair so
 * the React hook in src/hooks/useQueue.js can rerender consumers when
 * anything changes.
 */

const STORAGE_KEY = 'slsk.queue';

/**
 * @typedef {Object} QueueTrack
 * @property {string} filename            stable id for this track
 * @property {string} title               cleaned title (used as YT search query)
 * @property {string=} format
 * @property {number=} durationSec
 */

/**
 * @typedef {Object} QueueState
 * @property {QueueTrack[]} items
 * @property {number} currentIndex   -1 when nothing is queued or selected
 */

// ---------------------------------------------------------------------------
// state + persistence
// ---------------------------------------------------------------------------

/** @type {QueueState} */
let state = readFromStorage();

const listeners = new Set();

function readFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { items: [], currentIndex: -1 };
    const parsed = JSON.parse(raw);
    return {
      items: Array.isArray(parsed.items) ? parsed.items.filter(isValidTrack) : [],
      currentIndex: typeof parsed.currentIndex === 'number' ? parsed.currentIndex : -1,
    };
  } catch {
    return { items: [], currentIndex: -1 };
  }
}

function writeToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* swallow quota / privacy errors */ }
}

function isValidTrack(t) {
  return t && typeof t.filename === 'string' && typeof t.title === 'string';
}

function commit(next) {
  state = next;
  writeToStorage();
  for (const l of listeners) l();
}

// ---------------------------------------------------------------------------
// subscribe / snapshot (useSyncExternalStore contract)
// ---------------------------------------------------------------------------

export function subscribe(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function getSnapshot() {
  return state;
}

// ---------------------------------------------------------------------------
// public API
// ---------------------------------------------------------------------------

export function getQueueState() {
  return state;
}

/**
 * Append a track at the end of the queue. If it's already in the queue,
 * we just bump it to the end (could also be no-op; bumping signals
 * intent to re-listen).
 *
 * @param {QueueTrack} track
 * @returns {QueueState}
 */
export function enqueue(track) {
  if (!isValidTrack(track)) return state;
  const items = state.items.filter((t) => t.filename !== track.filename);
  items.push({
    filename:    track.filename,
    title:       track.title,
    format:      track.format,
    durationSec: track.durationSec,
  });
  // If nothing was playing, select the freshly-enqueued track.
  let currentIndex = state.currentIndex;
  if (currentIndex < 0) currentIndex = items.length - 1;
  commit({ items, currentIndex });
  return state;
}

/**
 * Drop a track from the queue. If it was the currently playing one, we
 * try to keep playing the next available track (or stop if the queue
 * becomes empty).
 *
 * @param {string} filename
 * @returns {QueueState}
 */
export function removeFromQueue(filename) {
  const idx = state.items.findIndex((t) => t.filename === filename);
  if (idx < 0) return state;
  const items = [...state.items.slice(0, idx), ...state.items.slice(idx + 1)];
  let currentIndex = state.currentIndex;
  if (idx === currentIndex) {
    currentIndex = items.length === 0 ? -1 : Math.min(idx, items.length - 1);
  } else if (idx < currentIndex) {
    currentIndex -= 1;
  }
  commit({ items, currentIndex });
  return state;
}

/**
 * Switch the currently-playing track to the one at the given index.
 * @param {number} index
 */
export function playAt(index) {
  if (index < 0 || index >= state.items.length) return state;
  commit({ items: state.items, currentIndex: index });
  return state;
}

/**
 * Move forward in the queue. Returns the new state. If we're on the
 * last track, stops playback (currentIndex = -1).
 */
export function playNext() {
  if (state.items.length === 0) return state;
  const next = state.currentIndex + 1;
  const currentIndex = next >= state.items.length ? -1 : next;
  commit({ items: state.items, currentIndex });
  return state;
}

/**
 * Move backward in the queue. Stops on the first track (clamped).
 */
export function playPrev() {
  if (state.items.length === 0) return state;
  const prev = Math.max(0, state.currentIndex - 1);
  commit({ items: state.items, currentIndex: prev });
  return state;
}

/**
 * Empty the queue and stop playback.
 */
export function clearQueue() {
  commit({ items: [], currentIndex: -1 });
  return state;
}

/**
 * Stop the player without removing anything from the queue.
 */
export function stopQueue() {
  commit({ items: state.items, currentIndex: -1 });
  return state;
}

/**
 * @param {string} filename
 * @returns {boolean}
 */
export function isQueued(filename) {
  return state.items.some((t) => t.filename === filename);
}
