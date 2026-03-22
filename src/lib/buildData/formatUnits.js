/**
 * Display-only unit formatters for plan annotations.
 * Internal data stays in inches; these format for builder-friendly display.
 */

/**
 * Format inches as feet-and-inches. Exact multiples of 12 show as "6ft" not "6ft 0in".
 * @param {number} value - Inches
 * @returns {string} e.g. "6ft", "7ft 10in", "5in", "0in"
 */
export function formatInchesToFeetInches(value) {
  const n = Math.floor(Number(value) || 0);
  if (n < 12) return `${n}in`;
  const feet = Math.floor(n / 12);
  const inches = n % 12;
  return inches === 0 ? `${feet}ft` : `${feet}ft ${inches}in`;
}

/**
 * Format whole feet for nominal display (e.g. module labels).
 * @param {number} feet - Whole feet
 * @returns {string} e.g. "6ft"
 */
export function formatFeet(feet) {
  const n = Math.floor(Number(feet) || 0);
  return `${n}ft`;
}

/**
 * Format inches only (for future toggle / alternate display).
 * @param {number} value - Inches
 * @returns {string} e.g. "94\""
 */
export function formatInches(value) {
  const n = Math.floor(Number(value) || 0);
  return `${n}"`;
}

/**
 * Format inches for Bramwood-style wall drawings (inch fractions).
 * Supports ¼, ½, ¾. Values rounded to nearest quarter-inch.
 * @param {number} value - Inches (decimal)
 * @returns {string} e.g. "66\"", "66¼\"", "73¾\"", "81½\""
 */
export function formatInchesDrawing(value) {
  const v = Number(value) || 0;
  const whole = Math.floor(v);
  const frac = v - whole;
  const q = Math.round(frac * 4);
  if (q >= 4) return `${whole + 1}"`;
  const fracChar = q === 0 ? "" : q === 1 ? "¼" : q === 2 ? "½" : "¾";
  return `${whole}${fracChar}"`;
}
