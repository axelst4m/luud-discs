import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './FilterBar.css';

const ALL_FORMATS = ['mp3', 'flac', 'wav', 'other'];
const ALL_STATES = [
  { value: 'all',     label: 'ALL'     },
  { value: 'unheard', label: 'UNHEARD' },
  { value: 'starred', label: 'STARRED' },
  { value: 'heard',   label: 'HEARD'   },
];

/**
 * Search input + format checkboxes + state selector. Controlled by the
 * parent which owns the criteria. The internal search input is locally
 * state-managed and debounced (100 ms) before being lifted up.
 */
const FilterBar = ({ value, onChange }) => {
  const [localQuery, setLocalQuery] = useState(value.query || '');

  // Debounce the search input: lift the change up only when the user
  // stops typing for ~100 ms.
  useEffect(() => {
    const t = setTimeout(() => {
      if (localQuery !== value.query) {
        onChange({ ...value, query: localQuery });
      }
    }, 100);
    return () => clearTimeout(t);
  }, [localQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleFormat = (fmt) => {
    const formats = value.formats.includes(fmt)
      ? value.formats.filter((f) => f !== fmt)
      : [...value.formats, fmt];
    onChange({ ...value, formats });
  };

  const setState = (next) => {
    if (next === value.state) return;
    onChange({ ...value, state: next });
  };

  return (
    <div className="slsk-filter-bar">
      <input
        type="search"
        className="slsk-filter-search"
        placeholder="search in titles and folder paths..."
        value={localQuery}
        onChange={(e) => setLocalQuery(e.target.value)}
        autoComplete="off"
        spellCheck={false}
      />
      <div className="slsk-filter-formats">
        {ALL_FORMATS.map((fmt) => (
          <label key={fmt} className="slsk-filter-chk">
            <input
              type="checkbox"
              checked={value.formats.includes(fmt)}
              onChange={() => toggleFormat(fmt)}
            />
            <span>{fmt.toUpperCase()}</span>
          </label>
        ))}
      </div>
      <div className="slsk-filter-states">
        {ALL_STATES.map((s) => (
          <button
            key={s.value}
            type="button"
            className={`slsk-filter-state${value.state === s.value ? ' slsk-filter-state--active' : ''}`}
            onClick={() => setState(s.value)}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
};

FilterBar.propTypes = {
  value: PropTypes.shape({
    query:   PropTypes.string,
    formats: PropTypes.arrayOf(PropTypes.string),
    state:   PropTypes.oneOf(['all', 'unheard', 'starred', 'heard']),
  }).isRequired,
  onChange: PropTypes.func.isRequired,
};

export default FilterBar;
