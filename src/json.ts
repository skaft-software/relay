/**
 * Sanitize lone UTF-16 surrogates in a string.
 *
 * Upstream tools may truncate text mid-emoji at JavaScript code-unit
 * boundaries (e.g. `str.slice(0, 250)`), producing orphaned high surrogates
 * (U+D800..U+DBFF) or lone low surrogates (U+DC00..U+DFFF).  The upstream
 * C++ JSON parser (nlohmann/json) rejects these.
 *
 * This function replaces them with U+FFFD (Unicode replacement character)
 * so the string stays valid for JSON serialisation.
 */
export function replaceLoneSurrogates(text: string): string {
  return text
    .replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/g, '\uFFFD')
    .replace(/(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, '\uFFFD');
}

/**
 * Recursively walk a parsed value and replace lone surrogates in every
 * string.  This catches escaped JSON surrogate sequences
 * (e.g. `"\\ud83d"`) that `JSON.parse()` resolves into actual lone
 * surrogates inside the resulting JS strings.
 */
export function sanitizeLoneSurrogates(value: unknown): unknown {
  if (typeof value === 'string') {
    return replaceLoneSurrogates(value);
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeLoneSurrogates);
  }
  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      out[key] = sanitizeLoneSurrogates(val);
    }
    return out;
  }
  return value;
}

/**
 * Parse a JSON string, applying surrogate sanitisation both before and
 * after parsing for defence-in-depth.
 */
export function parseJson(text: string): unknown {
  return sanitizeLoneSurrogates(JSON.parse(replaceLoneSurrogates(text)));
}
