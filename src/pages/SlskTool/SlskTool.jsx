import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';

import Tabs            from '../../components/SlskTool/Tabs/Tabs';
import InputText       from '../../components/SlskTool/InputText/InputText';
import InputScreenshot from '../../components/SlskTool/InputScreenshot/InputScreenshot';
import InputNicotine   from '../../components/SlskTool/InputNicotine/InputNicotine';
import FilterBar       from '../../components/SlskTool/FilterBar/FilterBar';
import ResultsFlat     from '../../components/SlskTool/ResultsFlat/ResultsFlat';
import ResultsTree     from '../../components/SlskTool/ResultsTree/ResultsTree';
import StarredFooter   from '../../components/SlskTool/StarredFooter/StarredFooter';
import HelpModal       from '../../components/SlskTool/HelpModal/HelpModal';
import Player          from '../../components/SlskTool/Player/Player';

import { useMarks }    from '../../hooks/useMarks.js';
import { cleanOne, cleanTitles, buildLinks } from '../../lib/cleaner.js';
import { parseText }     from '../../lib/parsers/text.js';
import { parseNicotine } from '../../lib/parsers/nicotine.js';
import { filterTracks, filterTree, isEmptyCriteria } from '../../lib/filter.js';

import './SlskTool.css';

const MODE_KEY   = 'slsk.mode';
const LAYOUT_KEY = 'slsk.layout';
const FILTER_KEY = 'slsk.filter';

const SlskTool = () => {
  // ----- persistent UI state -----
  const [mode, setMode] = useState(() => readLS(MODE_KEY, 'text', ['text', 'screenshot', 'nicotine']));
  const [layout, setLayout] = useState(() => readLS(LAYOUT_KEY, 'tree', ['tree', 'flat']));
  const [filterState, setFilterState] = useState(() => readFilter());
  const [helpOpen, setHelpOpen] = useState(false);

  // ----- pipeline state -----
  const [lastNicotine, setLastNicotine] = useState(null); // { tracks, parsed, filename }
  const [lastText, setLastText]       = useState(null);   // { tracks }
  const [errorMsg, setErrorMsg]       = useState('');

  const { getMark, toggleStar, toggleHeard } = useMarks();

  // ----- effects -----

  // Title + Open Graph meta tags. Restored on unmount so other pages
  // keep the site-wide values declared in index.html.
  useEffect(() => {
    const tags = {
      title:                'SLSK-TOOL // Lüüd Discs',
      description:          'On-device tool for Soulseek and Nicotine+ users: turn a shared folder listing into a searchable list of tracks with preview links to YouTube, SoundCloud, Bandcamp and Discogs.',
      url:                  'https://luud-discs.fr/slsk-tool',
    };
    const previous = setMetaTags(tags);
    return () => restoreMetaTags(previous);
  }, []);

  // Global keyboard shortcuts. "/" focuses the search input (when one
  // is on screen), "?" opens the help modal. We don't intercept inside
  // text inputs so the shortcuts feel natural.
  useEffect(() => {
    const handler = (e) => {
      const target = e.target;
      const inField = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable;
      if (e.key === '/' && !inField) {
        const search = document.querySelector('.slsk-filter-search');
        if (search) {
          e.preventDefault();
          search.focus();
        }
      } else if (e.key === '?' && !inField) {
        e.preventDefault();
        setHelpOpen(true);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => { try { localStorage.setItem(MODE_KEY, mode); }    catch { /* swallow */ } }, [mode]);
  useEffect(() => { try { localStorage.setItem(LAYOUT_KEY, layout); } catch { /* swallow */ } }, [layout]);
  useEffect(() => {
    try {
      localStorage.setItem(FILTER_KEY, JSON.stringify({
        formats: filterState.formats,
        state:   filterState.state,
      }));
    } catch { /* swallow */ }
  }, [filterState.formats, filterState.state]);

  // Reset pipeline state when switching modes (avoids stale data flicker).
  const handleModeChange = (next) => {
    setMode(next);
    setLastNicotine(null);
    setLastText(null);
    setErrorMsg('');
  };

  // ----- input submit handlers -----
  const handleTextSubmit = useCallback(({ text }) => {
    const lines = parseText(text);
    const tracks = cleanTitles(lines).map((entry) => ({
      filename: entry.raw,
      title:    entry.title,
      links:    entry.links,
    }));
    setLastText({ tracks });
    setLastNicotine(null);
    setErrorMsg('');
  }, []);

  const handleNicotineSubmit = useCallback(({ json, filename }) => {
    let parsed;
    try {
      parsed = parseNicotine(json);
    } catch (err) {
      setErrorMsg(`not a valid Nicotine+ export: ${err.message}`);
      return;
    }
    const tracks = parsed.tracks.map((t) => {
      const title = cleanOne(t.filename);
      return {
        filename:     t.filename,
        title,
        links:        buildLinks(title),
        folderPath:   t.folderPath,
        format:       t.format,
        bitrateKbps:  t.bitrateKbps,
        sampleRateHz: t.sampleRateHz,
        bitDepth:     t.bitDepth,
        durationSec:  t.durationSec,
        sizeBytes:    t.sizeBytes,
      };
    });
    setLastNicotine({ tracks, parsed, filename });
    setLastText(null);
    setErrorMsg('');
  }, []);

  // ----- filename → track lookup for the starred footer -----
  const filenameToTrack = useMemo(() => {
    const map = new Map();
    const tracks = lastNicotine?.tracks || lastText?.tracks || [];
    for (const t of tracks) map.set(t.filename, t);
    return map;
  }, [lastNicotine, lastText]);

  const resolveStarred = useCallback(
    (fn) => filenameToTrack.get(fn) || null,
    [filenameToTrack],
  );

  // ----- filtered results -----
  const criteria = useMemo(
    () => ({ ...filterState, getMark }),
    [filterState, getMark],
  );

  const filteredText = useMemo(() => {
    if (!lastText) return null;
    return isEmptyCriteria(criteria) ? lastText.tracks : filterTracks(lastText.tracks, criteria);
  }, [lastText, criteria]);

  const filteredNicotineTree = useMemo(() => {
    if (!lastNicotine) return null;
    return isEmptyCriteria(criteria) ? lastNicotine.parsed.tree : filterTree(lastNicotine.parsed.tree, criteria);
  }, [lastNicotine, criteria]);

  const filteredNicotineFlat = useMemo(() => {
    if (!lastNicotine) return null;
    return isEmptyCriteria(criteria) ? lastNicotine.tracks : filterTracks(lastNicotine.tracks, criteria);
  }, [lastNicotine, criteria]);

  // ----- summary string -----
  const nicotineSummary = useMemo(() => {
    if (!lastNicotine) return null;
    const { tracks, parsed, filename } = lastNicotine;
    const totalHours = (parsed.stats.totalDurationSec / 3600).toFixed(1);
    const totalGB    = (parsed.stats.totalSizeBytes / (1024 ** 3)).toFixed(1);
    return `${tracks.length} tracks from ${parsed.username ?? '?'} (${filename}, ${totalGB} GB, ${totalHours}h of music)`;
  }, [lastNicotine]);

  return (
    <main className="slsk-tool">
      <header className="slsk-tool__header">
        <Link to="/" className="slsk-tool__back" title="Back to Lüüd Discs">
          &lt; luud-discs
        </Link>
        <h1 className="slsk-tool__title">SLSK-TOOL</h1>
        <span className="slsk-tool__version">v2</span>
        <button
          type="button"
          className="slsk-tool__help"
          onClick={() => setHelpOpen(true)}
        >
          ./help
        </button>
      </header>

      <section className="slsk-tool__section slsk-ascii-box" data-label="input">
        <Tabs mode={mode} onChange={handleModeChange} />
        <div className="slsk-tool__input-zone">
          {mode === 'text'       && <InputText onSubmit={handleTextSubmit} />}
          {mode === 'screenshot' && <InputScreenshot onSubmit={handleTextSubmit} onError={setErrorMsg} />}
          {mode === 'nicotine'   && <InputNicotine onSubmit={handleNicotineSubmit} onError={setErrorMsg} />}
        </div>
      </section>

      <section className="slsk-tool__section slsk-ascii-box" data-label="results">
        {errorMsg && <p className="slsk-error">{errorMsg}</p>}

        {!lastNicotine && !lastText && (
          <p className="slsk-placeholder">waiting for input</p>
        )}

        {/* TEXT mode results */}
        {lastText && (
          <>
            <div className="slsk-tool__results-header">
              <p className="slsk-tool__summary">
                {filteredText.length} track{filteredText.length === 1 ? '' : 's'} ready
              </p>
            </div>
            <ResultsFlat
              tracks={filteredText}
              getMark={getMark}
              onToggleStar={toggleStar}
              onToggleHeard={toggleHeard}
              showFolder={false}
            />
          </>
        )}

        {/* NICOTINE+ mode results */}
        {lastNicotine && (
          <>
            <div className="slsk-tool__results-header">
              <div className="slsk-tool__results-top">
                <p className="slsk-tool__summary">{nicotineSummary}</p>
                <div className="slsk-layout-toggle">
                  {['tree', 'flat'].map((l) => (
                    <button
                      key={l}
                      type="button"
                      className={`slsk-layout-toggle__btn${layout === l ? ' slsk-layout-toggle__btn--active' : ''}`}
                      onClick={() => setLayout(l)}
                    >
                      {l.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              <FilterBar value={filterState} onChange={setFilterState} />
            </div>

            {layout === 'tree' ? (
              <ResultsTree
                tree={filteredNicotineTree}
                getMark={getMark}
                onToggleStar={toggleStar}
                onToggleHeard={toggleHeard}
              />
            ) : (
              <ResultsFlat
                tracks={filteredNicotineFlat}
                getMark={getMark}
                onToggleStar={toggleStar}
                onToggleHeard={toggleHeard}
                showFolder={true}
              />
            )}
          </>
        )}
      </section>

      <StarredFooter resolve={resolveStarred} />
      <Player />
      <HelpModal isOpen={helpOpen} onClose={() => setHelpOpen(false)} />
    </main>
  );
};

// ---------------------------------------------------------------------------
// Persistence helpers
// ---------------------------------------------------------------------------

function readLS(key, fallback, allowed) {
  try {
    const v = localStorage.getItem(key);
    if (v && allowed.includes(v)) return v;
  } catch { /* swallow */ }
  return fallback;
}

function readFilter() {
  try {
    const raw = localStorage.getItem(FILTER_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        query:   '',
        formats: Array.isArray(parsed.formats) ? parsed.formats : [],
        state:   ['all', 'unheard', 'starred', 'heard'].includes(parsed.state) ? parsed.state : 'all',
      };
    }
  } catch { /* swallow */ }
  return { query: '', formats: [], state: 'all' };
}

// ---------------------------------------------------------------------------
// Open Graph / SEO meta tags helpers
// ---------------------------------------------------------------------------

const META_KEYS = [
  { selector: 'meta[property="og:title"]',       attr: 'content', from: 'title'       },
  { selector: 'meta[property="og:description"]', attr: 'content', from: 'description' },
  { selector: 'meta[property="og:url"]',         attr: 'content', from: 'url'         },
  { selector: 'meta[name="twitter:title"]',      attr: 'content', from: 'title'       },
  { selector: 'meta[name="twitter:description"]', attr: 'content', from: 'description' },
  { selector: 'meta[name="twitter:url"]',        attr: 'content', from: 'url'         },
  { selector: 'meta[name="description"]',        attr: 'content', from: 'description' },
];

function setMetaTags(values) {
  const previous = { title: document.title };
  document.title = values.title;
  for (const m of META_KEYS) {
    const el = document.querySelector(m.selector);
    if (!el) continue;
    previous[m.selector] = el.getAttribute(m.attr);
    el.setAttribute(m.attr, values[m.from]);
  }
  return previous;
}

function restoreMetaTags(previous) {
  if (previous.title) document.title = previous.title;
  for (const m of META_KEYS) {
    const el = document.querySelector(m.selector);
    if (!el || !(m.selector in previous)) continue;
    if (previous[m.selector] === null) el.removeAttribute(m.attr);
    else el.setAttribute(m.attr, previous[m.selector]);
  }
}

export default SlskTool;
