import { useState } from 'react';
import PropTypes from 'prop-types';
import Row from '../Row/Row';
import { fmtBytes, fmtTotalDuration } from '../../../lib/format.js';
import { cleanOne } from '../../../lib/cleaner.js';
import { buildLinks } from '../../../lib/cleaner.js';
import './ResultsTree.css';

/**
 * TREE layout for Nicotine+ exports. Folders are native <details>/<summary>
 * for free keyboard accessibility. Children of a folder are rendered
 * lazily on the first expand (we track which folders have been opened).
 */
const ResultsTree = ({ tree, getMark, onToggleStar, onToggleHeard }) => {
  if (!tree || !tree.children || tree.children.length === 0) {
    return <p className="slsk-placeholder">waiting for input</p>;
  }

  // If the virtual root has a single top-level folder (the common case
  // with Nicotine+ exports under "@@user\share-root"), surface that
  // folder as a breadcrumb and list its children directly to skip a
  // useless indentation level.
  const single = tree.children.length === 1 ? tree.children[0] : null;
  const top = single ? single.children : tree.children;

  return (
    <div className="slsk-tree">
      {single && (
        <div className="slsk-tree__ancestor">
          {single.name} · {fmtFolderStats(single)}
        </div>
      )}
      <div>
        {top.map((node) => (
          <Folder
            key={node.path}
            node={node}
            depth={0}
            getMark={getMark}
            onToggleStar={onToggleStar}
            onToggleHeard={onToggleHeard}
          />
        ))}
      </div>
    </div>
  );
};

const Folder = ({ node, depth, getMark, onToggleStar, onToggleHeard }) => {
  const [opened, setOpened] = useState(false);

  return (
    <details
      className="slsk-folder"
      style={{ '--depth': depth }}
      onToggle={(e) => { if (e.currentTarget.open && !opened) setOpened(true); }}
    >
      <summary className="slsk-folder__header">
        <span className="slsk-folder__chevron">▶</span>
        <span className="slsk-folder__name">{node.name || '(root)'}</span>
        <span className="slsk-folder__stats">{fmtFolderStats(node)}</span>
      </summary>
      <div className="slsk-folder__body">
        {opened && (
          <>
            {node.children?.map((child) => (
              <Folder
                key={child.path}
                node={child}
                depth={depth + 1}
                getMark={getMark}
                onToggleStar={onToggleStar}
                onToggleHeard={onToggleHeard}
              />
            ))}
            {node.tracks && node.tracks.length > 0 && (
              <ul className="slsk-results__list slsk-results__list--in-tree">
                {node.tracks.map((t, i) => {
                  const display = toDisplay(t);
                  return (
                    <Row
                      key={`${display.filename}-${i}`}
                      track={display}
                      mark={getMark(display.filename)}
                      onToggleStar={onToggleStar}
                      onToggleHeard={onToggleHeard}
                      showFolder={false}
                    />
                  );
                })}
              </ul>
            )}
          </>
        )}
      </div>
    </details>
  );
};

function toDisplay(t) {
  const title = cleanOne(t.filename);
  return {
    filename:     t.filename,
    title,
    links:        buildLinks(title),
    format:       t.format,
    bitrateKbps:  t.bitrateKbps,
    sampleRateHz: t.sampleRateHz,
    bitDepth:     t.bitDepth,
    durationSec:  t.durationSec,
  };
}

function fmtFolderStats(node) {
  const s = node.stats || {};
  const parts = [];
  const n = s.trackCount || 0;
  parts.push(`${n} track${n === 1 ? '' : 's'}`);
  if (s.totalDurationSec) parts.push(fmtTotalDuration(s.totalDurationSec));
  if (s.totalSizeBytes)   parts.push(fmtBytes(s.totalSizeBytes));
  const formats = Object.entries(s.formats || {})
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([fmt]) => fmt.toUpperCase());
  if (formats.length) parts.push(formats.join('/'));
  return parts.join(' · ');
}

Folder.propTypes = {
  node: PropTypes.object.isRequired,
  depth: PropTypes.number.isRequired,
  getMark: PropTypes.func.isRequired,
  onToggleStar: PropTypes.func.isRequired,
  onToggleHeard: PropTypes.func.isRequired,
};

ResultsTree.propTypes = {
  tree: PropTypes.object,
  getMark: PropTypes.func.isRequired,
  onToggleStar: PropTypes.func.isRequired,
  onToggleHeard: PropTypes.func.isRequired,
};

export default ResultsTree;
