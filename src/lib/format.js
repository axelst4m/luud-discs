/**
 * lib/format.js
 *
 * Pure formatters used by SLSK-TOOL components. Bytes, durations,
 * everything human-readable. Side-effect free, no DOM.
 */

/** "4:13" from 253 seconds */
export function fmtDuration(s) {
  if (!s) return '';
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${String(r).padStart(2, '0')}`;
}

/** "1.2 MB" / "340.8 GB" / "5 KB" */
export function fmtBytes(n) {
  if (!n) return '';
  if (n < 1024) return `${n} B`;
  if (n < 1024 ** 2) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 ** 3) return `${(n / 1024 ** 2).toFixed(1)} MB`;
  return `${(n / 1024 ** 3).toFixed(2)} GB`;
}

/** "2h 15m" / "45m" / "30s" — for aggregated stats */
export function fmtTotalDuration(s) {
  if (!s) return '';
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h) return `${h}h ${m}m`;
  if (m) return `${m}m`;
  return `${Math.floor(s)}s`;
}
