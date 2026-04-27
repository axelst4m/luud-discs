/**
 * parsers/text.js
 *
 * Takes a raw pasted block of text (one filename per line, usually) and
 * returns a flat array of filename strings ready for the cleaner.
 *
 * This is the V1 pipeline: the user has already OCR'd their screenshot
 * with an external tool and just dumps the text in.
 */

/**
 * @param {string} raw
 * @returns {string[]}
 */
export function parseText(raw) {
  // TODO: real implementation
  //   - split on newlines
  //   - trim each line
  //   - drop empty lines
  //   - drop lines that clearly aren't filenames (headers, section titles...)
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}
