import PropTypes from 'prop-types';
import Row from '../Row/Row';

/**
 * FLAT layout: a flat list of <Row>, one per track.
 */
const ResultsFlat = ({ tracks, getMark, onToggleStar, onToggleHeard, showFolder }) => {
  if (!tracks || tracks.length === 0) {
    return <p className="slsk-placeholder">waiting for input</p>;
  }

  return (
    <ul className="slsk-results__list">
      {tracks.map((t, i) => (
        <Row
          key={`${t.filename}-${i}`}
          track={t}
          mark={getMark(t.filename)}
          onToggleStar={onToggleStar}
          onToggleHeard={onToggleHeard}
          showFolder={showFolder}
        />
      ))}
    </ul>
  );
};

ResultsFlat.propTypes = {
  tracks:        PropTypes.array.isRequired,
  getMark:       PropTypes.func.isRequired,
  onToggleStar:  PropTypes.func.isRequired,
  onToggleHeard: PropTypes.func.isRequired,
  showFolder:    PropTypes.bool,
};

ResultsFlat.defaultProps = {
  showFolder: true,
};

export default ResultsFlat;
