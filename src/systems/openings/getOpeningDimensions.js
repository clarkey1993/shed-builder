/**
 * Shared opening dimension helpers - Bramwood rules.
 * Use for wall framing, window rendering, door framing, and spacing.
 */
import shedData from "../../shedData.json";

const WINDOW_RULES = {
  STANDARD: { width: 24, height: 24 },
  SECURITY: { width: 24, height: 12 },
  /** Two side-by-side panels with central mullion; combined nominal width 50" (24 + 2 + 24), height 24". */
  DOUBLE: { width: 50, height: 24 },
};

/**
 * @param {string} windowType - "STANDARD" | "SECURITY" | "DOUBLE"
 * @returns {{ width: number, height: number }}
 */
export function getWindowDimensions(windowType) {
  return WINDOW_RULES[windowType] || WINDOW_RULES.STANDARD;
}

/**
 * Door dimensions.
 * Height is clamped so the door never exceeds the usable wall height:
 * usableWallHeight = wallHeight - topPlateThickness - 1.
 *
 * @param {Object} opts
 * @param {string} opts.doorType - "single" | "stable" | "double" | "double_with_windows"
 * @param {string} opts.wallHeightType - "standard" | "workshop"
 * @param {number} opts.wallHeight - wall height in inches (single source for nominal door height)
 * @param {number} [opts.topPlateThickness] - optional plate thickness in inches; falls back to shedData.framing.upright_middles_thickness_x
 * @returns {{ width: number, height: number }}
 */
export function getDoorDimensions({ doorType, wallHeightType, wallHeight, topPlateThickness }) {
  const width = shedData.door_widths[doorType]?.[wallHeightType] ?? shedData.door_widths.single?.standard ?? 31;
  const plate = typeof topPlateThickness === "number"
    ? topPlateThickness
    : shedData.framing.upright_middles_thickness_x;
  const usableWallHeight = Math.max(0, wallHeight - plate - 1);
  const height = Math.min(wallHeight, usableWallHeight);
  return { width, height };
}
