/**
 * hooks/useMarks.js
 *
 * React hook over the pure marks module (src/lib/marks.js). Marks live in
 * a single shared store backed by localStorage; the hook subscribes
 * components to that store via useSyncExternalStore (React 18) so any
 * mutation triggers a re-render in every consumer.
 *
 * Read functions (getMark, allStarred, allMarks) are returned as-is.
 * Mutation functions are wrapped so they bump the store version and
 * notify subscribers.
 */

import { useSyncExternalStore } from 'react';
import {
  getMark,
  allMarks,
  allStarred,
  toggleStar  as _toggleStar,
  toggleHeard as _toggleHeard,
  setMark     as _setMark,
  clearStarred as _clearStarred,
  clearAll    as _clearAll,
} from '../lib/marks.js';

// ---------------------------------------------------------------------------
// Tiny store
// ---------------------------------------------------------------------------

let version = 0;
const listeners = new Set();

function notify() {
  for (const l of listeners) l();
}

function subscribe(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot() {
  return version;
}

function bump() {
  version += 1;
  notify();
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * @returns {{
 *   getMark: typeof getMark,
 *   allMarks: typeof allMarks,
 *   allStarred: typeof allStarred,
 *   toggleStar: (filename: string) => ReturnType<typeof _toggleStar>,
 *   toggleHeard: (filename: string) => ReturnType<typeof _toggleHeard>,
 *   setMark: (filename: string, patch: object) => ReturnType<typeof _setMark>,
 *   clearStarred: () => void,
 *   clearAll: () => void,
 * }}
 */
export function useMarks() {
  // Subscribes this component to mark mutations; we don't need the actual
  // value, we just want to re-render when it changes.
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  return {
    getMark,
    allMarks,
    allStarred,
    toggleStar:   (filename) => { const r = _toggleStar(filename);   bump(); return r; },
    toggleHeard:  (filename) => { const r = _toggleHeard(filename);  bump(); return r; },
    setMark:      (filename, patch) => { const r = _setMark(filename, patch); bump(); return r; },
    clearStarred: () => { _clearStarred(); bump(); },
    clearAll:     () => { _clearAll();     bump(); },
  };
}
