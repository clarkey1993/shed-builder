/**
 * Shared opening dimension helpers - Bramwood rules.
 * Use for wall framing, window rendering, door framing, and spacing.
 */
import shedData from "../../shedData.json";

const WINDOW_RULES = {
  STANDARD: { width: 24, height: 24 },
  SECURITY: { width: 24, height: 12 },
};

/**
 * @param {string} windowType - "STANDARD" | "SECURITY"
 * @returns {{ width: number, height: number }}
 */
export function getWindowDimensions(windowType) {
  return WINDOW_RULES[windowType] || WINDOW_RULES.STANDARD;
}

/**
 * @param {Object} opts
 * @param {string} opts.doorType - "single" | "double"
 * @param {string} opts.wallHeightType - "standard" | "workshop"
 * @param {number} opts.wallHeight - wall height in inches
 * @returns {{ width: number, height: number }}
 */
export function getDoorDimensions({ doorType, wallHeightType, wallHeight }) {
  const width = shedData.door_widths[doorType]?.[wallHeightType] ?? shedData.door_widths.single?.standard ?? 31;
  return { width, height: wallHeight };
}
