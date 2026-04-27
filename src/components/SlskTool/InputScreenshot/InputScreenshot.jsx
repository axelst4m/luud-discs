import { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { parseScreenshot } from '../../../lib/parsers/screenshot.js';
import './InputScreenshot.css';

/**
 * SCREENSHOT input mode: drop an image, on-device OCR via tesseract.js
 * (lazy-loaded), then a review textarea so the user can fix any OCR
 * mishaps before processing. Same `onSubmit({text})` contract as
 * InputText so the downstream pipeline is identical.
 */
const InputScreenshot = ({ onSubmit, onError }) => {
  const [state, setState] = useState('idle'); // idle / loading / review / error
  const [previewUrl, setPreviewUrl] = useState(null);
  const [filename, setFilename] = useState('');
  const [progress, setProgress] = useState({ label: 'booting OCR engine', progress: 0 });
  const [text, setText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const inputRef = useRef(null);

  const reset = () => {
    setState('idle');
    setPreviewUrl(null);
    setFilename('');
    setProgress({ label: 'booting OCR engine', progress: 0 });
    setText('');
    setErrorMsg('');
  };

  const report = (msg) => {
    if (onError) onError(msg);
    else console.error('[screenshot input]', msg);
  };

  const handleFile = async (file) => {
    if (!file) return;
    if (!/^image\//.test(file.type)) {
      report(`not an image: ${file.name}`);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setFilename(file.name);
    setState('loading');

    try {
      const ocrText = await parseScreenshot(file, (p) => {
        setProgress({ label: p.label, progress: p.progress || 0 });
      });
      setText(ocrText);
      setState('review');
    } catch (err) {
      setErrorMsg(err?.message || String(err));
      setState('error');
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (file) handleFile(file);
  };
  const onPick = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  if (state === 'idle') {
    return (
      <div
        className="slsk-dropzone slsk-dropzone--shot"
        onDragOver={(e) => { e.preventDefault(); }}
        onDrop={onDrop}
      >
        <div className="slsk-dropzone__inner">
          <p className="slsk-dropzone__title">drop a screenshot of a user folder</p>
          <p className="slsk-dropzone__or">or</p>
          <label className="slsk-dropzone__pick">
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={onPick}
            />
            <span>pick an image</span>
          </label>
          <p className="slsk-dropzone__hint">
            works best on sharp monospace text. dark background with light text recognized most reliably. PNG / JPG / WEBP.
          </p>
        </div>
      </div>
    );
  }

  if (state === 'loading') {
    const pct = Math.round((progress.progress || 0) * 100);
    return (
      <div className="slsk-shot">
        <div className="slsk-shot__side">
          <img className="slsk-shot__preview" src={previewUrl} alt="uploaded screenshot" />
          <p className="slsk-shot__filename">{filename}</p>
        </div>
        <div className="slsk-shot__main">
          <p className="slsk-shot__status">
            <span className="slsk-shot__status-label">{progress.label}</span>
            <span className="slsk-shot__status-pct">{pct}%</span>
          </p>
          <div className="slsk-shot__progress">
            <div className="slsk-shot__progress-bar" style={{ width: `${pct}%` }} />
          </div>
          <p className="slsk-shot__note">First run fetches ~2 MB of Tesseract data. Cached for subsequent runs.</p>
        </div>
      </div>
    );
  }

  if (state === 'review') {
    return (
      <div className="slsk-shot slsk-shot--review">
        <div className="slsk-shot__side">
          <img className="slsk-shot__preview" src={previewUrl} alt="uploaded screenshot" />
          <button type="button" className="slsk-shot__reset" onClick={reset}>
            try another image
          </button>
        </div>
        <div className="slsk-shot__main">
          <p className="slsk-shot__review-label">OCR done. Review and edit if needed, then process.</p>
          <textarea
            className="slsk-shot__textarea slsk-input-text__area"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows="14"
            spellCheck={false}
          />
          <button
            type="button"
            className="slsk-btn-magic slsk-shot__submit"
            onClick={() => {
              if (text.trim().length === 0) return;
              onSubmit({ text });
            }}
          >
            DO YA THING
          </button>
        </div>
      </div>
    );
  }

  // state === 'error'
  return (
    <div className="slsk-shot slsk-shot--error">
      {previewUrl && (
        <img className="slsk-shot__preview slsk-shot__preview--error" src={previewUrl} alt="uploaded screenshot" />
      )}
      <p className="slsk-error">OCR failed: {errorMsg}</p>
      <button type="button" className="slsk-shot__reset" onClick={reset}>
        try another image
      </button>
    </div>
  );
};

InputScreenshot.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onError:  PropTypes.func,
};

export default InputScreenshot;
