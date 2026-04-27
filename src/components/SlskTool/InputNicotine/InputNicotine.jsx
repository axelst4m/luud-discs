import { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import './InputNicotine.css';

/**
 * NICOTINE+ JSON input mode: drop a Nicotine+ shares export, parse it,
 * push the parsed JSON to the parent which runs parseNicotine and feeds
 * the rest of the pipeline.
 */
const InputNicotine = ({ onSubmit, onError }) => {
  const [state, setState] = useState('idle'); // idle / hover / loading / error
  const [errorMsg, setErrorMsg] = useState(null);
  const fileInputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    setState('loading');
    setErrorMsg(null);
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      onSubmit({ json, filename: file.name });
      setState('idle');
    } catch (err) {
      setState('error');
      const msg = `could not read "${file.name}": ${err.message}`;
      setErrorMsg(msg);
      if (onError) onError(msg);
      setTimeout(() => setState('idle'), 3000);
    }
  };

  const onDragOver = (e) => {
    e.preventDefault();
    setState('hover');
  };
  const onDragLeave = () => setState('idle');
  const onDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (file) handleFile(file);
  };
  const onPick = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div
      className="slsk-dropzone"
      data-state={state}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div className="slsk-dropzone__inner">
        <p className="slsk-dropzone__title">
          drop a Nicotine+ JSON export here
          {state === 'loading' && <span className="slsk-dropzone__suffix"> reading…</span>}
        </p>
        <p className="slsk-dropzone__or">or</p>
        <label className="slsk-dropzone__pick">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            hidden
            onChange={onPick}
          />
          <span>pick a file</span>
        </label>
        <p className="slsk-dropzone__hint">
          On macOS the export file lives at <code>/Users/&lt;your-user&gt;/.local/share/nicotine/usershares/</code>.
          Add <code>.json</code> to the filename, then drop it here.
        </p>
        {errorMsg && state === 'error' && (
          <p className="slsk-dropzone__error">{errorMsg}</p>
        )}
      </div>
    </div>
  );
};

InputNicotine.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onError:  PropTypes.func,
};

export default InputNicotine;
