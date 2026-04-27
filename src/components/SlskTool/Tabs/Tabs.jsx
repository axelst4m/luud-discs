import PropTypes from 'prop-types';
import './Tabs.css';

const TABS = [
  { mode: 'text',       label: 'TEXT' },
  { mode: 'screenshot', label: 'SCREENSHOT' },
  { mode: 'nicotine',   label: 'NICOTINE+ JSON' },
];

/**
 * Tab switcher between input modes. Controlled component:
 * the parent owns the active mode and reacts to changes.
 */
const Tabs = ({ mode, onChange }) => (
  <nav className="slsk-tabs" role="tablist" aria-label="Input mode">
    {TABS.map((t) => (
      <button
        key={t.mode}
        type="button"
        role="tab"
        aria-selected={mode === t.mode}
        className={`slsk-tabs__btn${mode === t.mode ? ' slsk-tabs__btn--active' : ''}`}
        onClick={() => onChange(t.mode)}
      >
        {t.label}
      </button>
    ))}
  </nav>
);

Tabs.propTypes = {
  mode: PropTypes.oneOf(['text', 'screenshot', 'nicotine']).isRequired,
  onChange: PropTypes.func.isRequired,
};

export default Tabs;
