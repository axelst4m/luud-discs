import { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useMarks } from '../../../hooks/useMarks.js';
import { PLATFORMS } from '../../../lib/platforms.js';
import { fmtBytes, fmtTotalDuration } from '../../../lib/format.js';
import { cleanOne, buildLinks } from '../../../lib/cleaner.js';
import './StarredFooter.css';

/**
 * Sticky footer holding the user's STARRED tracks. Visible only when
 * at least one track is starred.
 *
 * The parent passes a `resolve(filename)` lookup that returns the rich
 * track object for that filename if known in the current session
 * (loaded JSON, pasted text, OCR'd screenshot). For stars carried over
 * from a previous session we fall back to recreating title + links on
 * the fly via the cleaner.
 */
const StarredFooter = ({ resolve }) => {
  const { allStarred, setMark, clearStarred } = useMarks();
  const [confirming, setConfirming] = useState(false);

  const starred = allStarred(); // re-read on every render thanks to useMarks subscription

  // Resolve full track info for each starred filename, with fallback.
  const tracks = useMemo(() => starred.map((fn) => {
    const known = resolve(fn);
    if (known) return known;
    const title = cleanOne(fn);
    return { filename: fn, title, links: buildLinks(title) };
  }), [starred, resolve]);

  if (tracks.length === 0) return null;

  const totalSize     = tracks.reduce((s, t) => s + (t.sizeBytes || 0), 0);
  const totalDuration = tracks.reduce((s, t) => s + (t.durationSec || 0), 0);

  const summaryParts = [`STAR ${tracks.length}`];
  if (totalDuration) summaryParts.push(fmtTotalDuration(totalDuration));
  if (totalSize)     summaryParts.push(fmtBytes(totalSize));

  const writeClipboard = async (textToCopy) => {
    try {
      await navigator.clipboard.writeText(textToCopy);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = textToCopy;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch { /* clipboard fallback failed */ }
      document.body.removeChild(ta);
    }
  };

  const onCopyOne = (fn) => writeClipboard(fn);
  const onCopyAll = () => writeClipboard(tracks.map((t) => t.filename).join('\n'));
  const onUnstar  = (fn) => setMark(fn, { starred: false });
  const onClear = () => {
    if (!confirming) {
      setConfirming(true);
      setTimeout(() => setConfirming(false), 2500);
      return;
    }
    clearStarred();
    setConfirming(false);
  };

  return (
    <footer className="slsk-starred-footer slsk-starred-footer--open">
      <div className="slsk-starred-footer__inner">
        <div className="slsk-starred-footer__header">
          <span className="slsk-starred-footer__summary">[{summaryParts.join(' · ')}]</span>
          <span className="slsk-starred-footer__actions">
            <button type="button" className="slsk-starred-footer__action" onClick={onCopyAll}>
              COPY ALL
            </button>
            <button
              type="button"
              className="slsk-starred-footer__action slsk-starred-footer__action--danger"
              onClick={onClear}
            >
              {confirming ? 'CONFIRM' : 'CLEAR'}
            </button>
          </span>
        </div>
        <ul className="slsk-starred-footer__list">
          {tracks.map((t) => (
            <StarredRow
              key={t.filename}
              track={t}
              onCopy={() => onCopyOne(t.filename)}
              onUnstar={() => onUnstar(t.filename)}
            />
          ))}
        </ul>
      </div>
    </footer>
  );
};

const StarredRow = ({ track, onCopy, onUnstar }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 900);
  };

  return (
    <li className="slsk-starred-row">
      <span className="slsk-starred-row__title">{track.title}</span>
      {track.format && (
        <span className={`slsk-badge slsk-badge--${track.format}`}>
          {track.format.toUpperCase()}
        </span>
      )}
      {track.links && (
        <span className="slsk-starred-row__links">
          {PLATFORMS.map((p) => (
            <a
              key={p.key}
              className={`slsk-row__link slsk-row__link--${p.key}`}
              href={track.links[p.key]}
              target="_blank"
              rel="noopener noreferrer"
              title={p.title}
            >
              {p.label}
            </a>
          ))}
        </span>
      )}
      <button
        type="button"
        className={`slsk-starred-row__btn${copied ? ' slsk-starred-row__btn--flash' : ''}`}
        onClick={handleCopy}
        title="Copy filename to clipboard"
      >
        {copied ? 'OK' : 'CP'}
      </button>
      <button
        type="button"
        className="slsk-starred-row__btn slsk-starred-row__btn--danger"
        onClick={onUnstar}
        title="Remove from starred"
      >
        UN
      </button>
    </li>
  );
};

StarredRow.propTypes = {
  track: PropTypes.object.isRequired,
  onCopy: PropTypes.func.isRequired,
  onUnstar: PropTypes.func.isRequired,
};

StarredFooter.propTypes = {
  resolve: PropTypes.func.isRequired,
};

export default StarredFooter;
