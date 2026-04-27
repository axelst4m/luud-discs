/**
 * hooks/useQueue.js
 *
 * React wrapper around the queue store in lib/queue.js. Subscribes to
 * the store via useSyncExternalStore so every consumer rerenders when
 * the queue state changes.
 */

import { useSyncExternalStore } from 'react';
import {
  subscribe,
  getSnapshot,
  enqueue,
  removeFromQueue,
  playAt,
  playNext,
  playPrev,
  clearQueue,
  stopQueue,
  isQueued,
} from '../lib/queue.js';

export function useQueue() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return {
    items:        state.items,
    currentIndex: state.currentIndex,
    current:      state.currentIndex >= 0 ? state.items[state.currentIndex] : null,
    enqueue,
    remove:       removeFromQueue,
    playAt,
    playNext,
    playPrev,
    clear:        clearQueue,
    stop:         stopQueue,
    isQueued,
  };
}
