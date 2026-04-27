import PropTypes from 'prop-types';
import { PLATFORMS } from '../../../lib/platforms.js';
import { fmtDuration } from '../../../lib/format.js';
import { useQueue } from '../../../hooks/useQueue.js';
import './Row.css';

/**
 * Single track row used in both FLAT and TREE results layouts.
 *
 * Receives:
 *  - `track`: normalized display object with title, filename, links, optional metadata
 *  - `mark`:  current mark state for that track (`{ starred?, heard? }`)
 *  - `onToggleStar`, `onToggleHeard`: callbacks fired on the buttons
 *  - `showFolder`: when true, displays the folder path on its own line below
 *
 * The Q button is wired straight to the queue store so the row can stay
 * thin: no callback to thread from the parent for that one.
 */
const Row = ({ track, mark, onToggleStar, onToggleHeard, showFolder }) => {
  const queue = useQueue();
  const inQueue = queue.isQueued(track.filename);
  const klass = [
    'slsk-row',
    mark?.starred ? 'slsk-row--starred' : '',
    mark?.heard   ? 'slsk-row--heard'   : '',
  ].filter(Boolean).join(' ');

  return (
    <li className={klass} data-filename={track.filename}>
      <div className="slsk-row__main">
        <span className="slsk-row__title">{track.title || '(empty)'}</span>
        <Badges track={track} />
      </div>
      <div className="slsk-row__links">
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
      </div>
      <div className="slsk-row__marks">
        <button
          type="button"
          className={`slsk-row__mark slsk-row__mark--queue${inQueue ? ' slsk-row__mark--active' : ''}`}
          onClick={() => {
            if (inQueue) queue.remove(track.filename);
            else queue.enqueue({
              filename:    track.filename,
              title:       track.title,
              format:      track.format,
              durationSec: track.durationSec,
            });
          }}
          title={inQueue ? 'Remove from preview queue' : 'Add to preview queue'}
        >
          {inQueue ? 'IN Q' : '+ Q'}
        </button>
        <button
          type="button"
          className={`slsk-row__mark slsk-row__mark--star${mark?.starred ? ' slsk-row__mark--active' : ''}`}
          onClick={() => onToggleStar(track.filename)}
          title="Star this track (adds it to the shortlist)"
        >
          STAR
        </button>
        <button
          type="button"
          className={`slsk-row__mark slsk-row__mark--heard${mark?.heard ? ' slsk-row__mark--active' : ''}`}
          onClick={() => onToggleHeard(track.filename)}
          title="Mark as already heard"
        >
          HEARD
        </button>
      </div>
      {showFolder && track.folderPath && (
        <div className="slsk-row__folder" title={track.folderPath}>
          {track.folderPath}
        </div>
      )}
    </li>
  );
};

const Badges = ({ track }) => {
  const out = [];
  if (track.format) {
    out.push(
      <span key="fmt" className={`slsk-badge slsk-badge--${track.format}`}>
        {track.format.toUpperCase()}
      </span>,
    );
  }
  if (track.bitrateKbps) {
    out.push(
      <span key="bitrate" className="slsk-badge slsk-badge--meta">
        {track.bitrateKbps} kbps
      </span>,
    );
  }
  if (track.sampleRateHz) {
    const khz = (track.sampleRateHz / 1000).toFixed(track.sampleRateHz % 1000 ? 1 : 0);
    const bd = track.bitDepth ? `/${track.bitDepth}bit` : '';
    out.push(
      <span key="sample" className="slsk-badge slsk-badge--meta">
        {khz}kHz{bd}
      </span>,
    );
  }
  if (track.durationSec) {
    out.push(
      <span key="dur" className="slsk-badge slsk-badge--dim">
        {fmtDuration(track.durationSec)}
      </span>,
    );
  }
  if (out.length === 0) return null;
  return <span className="slsk-row__badges">{out}</span>;
};

Badges.propTypes = {
  track: PropTypes.object.isRequired,
};

Row.propTypes = {
  track: PropTypes.shape({
    filename:     PropTypes.string.isRequired,
    title:        PropTypes.string.isRequired,
    links:        PropTypes.object.isRequired,
    folderPath:   PropTypes.string,
    format:       PropTypes.string,
    bitrateKbps:  PropTypes.number,
    sampleRateHz: PropTypes.number,
    bitDepth:     PropTypes.number,
    durationSec:  PropTypes.number,
  }).isRequired,
  mark: PropTypes.shape({
    starred: PropTypes.bool,
    heard:   PropTypes.bool,
  }),
  onToggleStar:  PropTypes.func.isRequired,
  onToggleHeard: PropTypes.func.isRequired,
  showFolder:    PropTypes.bool,
};

Row.defaultProps = {
  mark: {},
  showFolder: false,
};

export default Row;
