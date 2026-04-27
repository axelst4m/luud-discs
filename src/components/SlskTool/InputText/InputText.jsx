import { useState } from 'react';
import PropTypes from 'prop-types';
import './InputText.css';

/**
 * TEXT input mode: paste a block of filenames, hit DO YA THING.
 * Same V1 workflow, idiomatic React.
 */
const InputText = ({ onSubmit }) => {
  const [text, setText] = useState('');

  const handleSubmit = () => {
    if (text.trim().length === 0) return;
    onSubmit({ text });
  };

  return (
    <div className="slsk-input-text">
      <textarea
        className="slsk-input-text__area"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="paste the raw filenames from a Soulseek user folder here, one per line..."
        rows="10"
        spellCheck={false}
      />
      <button
        type="button"
        className="slsk-btn-magic"
        onClick={handleSubmit}
      >
        DO YA THING
      </button>
    </div>
  );
};

InputText.propTypes = {
  onSubmit: PropTypes.func.isRequired,
};

export default InputText;
