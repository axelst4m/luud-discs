/**
 * parsers/screenshot.js
 *
 * On-device OCR for screenshots of a Soulseek / Nicotine+ user folder.
 * Everything runs inside the user's browser via tesseract.js — the image
 * never leaves their machine. tesseract.js is loaded via dynamic import
 * so the ~2-3 MB WASM + language data blob only downloads the first
 * time the user actually uses SCREENSHOT mode.
 *
 * Returns the recognized text as a string, filename-per-line where
 * possible. A small postprocessing pass removes obvious junk lines.
 */

/**
 * @typedef {Object} OcrProgress
 * @property {string}  status     tesseract.js status code (e.g. 'loading tesseract core', 'recognizing text')
 * @property {number}  progress   0 → 1
 * @property {string}  label      user-friendly label derived from status
 */

/**
 * Run OCR on a File, Blob, or HTMLImageElement.
 *
 * @param {File | Blob | HTMLImageElement | string} image
 * @param {(p: OcrProgress) => void} [onProgress]
 * @param {{ langs?: string }} [opts]
 * @returns {Promise<string>}  the extracted text, already lightly cleaned
 */
export async function parseScreenshot(image, onProgress, opts = {}) {
  const { createWorker } = await import('tesseract.js');
  const langs = opts.langs || 'eng';

  const logger = (m) => {
    if (typeof onProgress !== 'function') return;
    onProgress({
      status:   m.status,
      progress: typeof m.progress === 'number' ? m.progress : 0,
      label:    humanizeStatus(m.status),
    });
  };

  const worker = await createWorker(langs, 1, { logger });
  try {
    const { data } = await worker.recognize(image);
    return postprocess(typeof data?.text === 'string' ? data.text : '');
  } finally {
    await worker.terminate();
  }
}

/**
 * Cleanup the raw OCR output:
 *  - normalize line endings
 *  - trim each line
 *  - drop empty lines and lines that look like noise (too short, or just
 *    punctuation / digits that can't possibly be a filename)
 *
 * Exported for testability.
 * @param {string} raw
 * @returns {string}
 */
export function postprocess(raw) {
  if (typeof raw !== 'string') return '';
  return raw
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => looksLikeFilename(line))
    .join('\n');
}

/**
 * Heuristic: a line is kept if it has any letter and is at least 4 chars
 * long. We don't try to match on extension because the OCR may not have
 * recognized ".mp3" / ".flac" correctly — we stay permissive and let the
 * user fix things in the review textarea.
 * @param {string} line
 */
export function looksLikeFilename(line) {
  if (!line) return false;
  if (line.length < 4) return false;
  if (!/[a-z]/i.test(line)) return false;
  return true;
}

/**
 * Map tesseract.js cryptic status codes to short user-friendly labels.
 * @param {string} status
 */
export function humanizeStatus(status) {
  const map = {
    'loading tesseract core': 'booting OCR engine',
    'initializing tesseract': 'booting OCR engine',
    'loading language traineddata': 'loading language',
    'initializing api': 'initializing',
    'recognizing text': 'reading image',
  };
  return map[status] || status || 'working';
}
