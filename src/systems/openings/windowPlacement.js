import { GRID_SNAP, STUD_SNAP, STUD_ASSIST_DIST } from "../snapping/snapRules";

/**
 * Window placement validity - shared rules for add and drag.
 * Uses same edge clearance and window-to-window gap as Window.jsx clampAndSnap.
 * Single source of truth so add-time checks and drag limits stay consistent.
 */

export const STUD = 3; // stud thickness (inches) for clearance and hitbox padding
export const EDGE_CLEARANCE = STUD * 2; // 6" between opening edge and wall corner

export function minGapBetween(windowWidth, otherWidth) {
  const w = typeof windowWidth === "number" && Number.isFinite(windowWidth) ? windowWidth : 24;
  const o = typeof otherWidth === "number" && Number.isFinite(otherWidth) ? otherWidth : 24;
  return w / 2 + o / 2 + STUD * 2;
}

function isFiniteNumber(n) {
  return typeof n === "number" && Number.isFinite(n);
}

/**
 * Returns free intervals [min, max] for window center x after excluding other windows.
 * Uses full minGapBetween so the new window's center must be at least that distance from
 * each existing window (edge-to-edge clearance respected). Does not exclude door zone.
 * Returns [] if wallWidth/windowWidth invalid to avoid NaN and crashes.
 */
function getFreeIntervals(wallWidth, windowWidth, otherWindows = []) {
  if (!isFiniteNumber(wallWidth) || wallWidth <= 0 || !isFiniteNumber(windowWidth) || windowWidth <= 0) return [];
  const halfWindow = windowWidth / 2;
  let min = -wallWidth / 2 + halfWindow + EDGE_CLEARANCE;
  let max = wallWidth / 2 - halfWindow - EDGE_CLEARANCE;
  if (min > max || !Number.isFinite(min) || !Number.isFinite(max)) return [];

  let intervals = [[min, max]];
  for (const other of otherWindows) {
    const ox = Number(other.x);
    const owidth = isFiniteNumber(other.width) ? other.width : 24;
    const gap = minGapBetween(windowWidth, owidth);
    const low = (Number.isFinite(ox) ? ox : 0) - gap;
    const high = (Number.isFinite(ox) ? ox : 0) + gap;
    const next = [];
    for (const [a, b] of intervals) {
      if (high <= a || low >= b) next.push([a, b]);
      else {
        if (a < low) next.push([a, low]);
        if (high < b) next.push([high, b]);
      }
    }
    intervals = next;
  }
  return intervals.filter(([a, b]) => b - a > 0.001);
}

/**
 * Returns true if at least one valid position exists for one more window.
 * Valid = within wall bounds (minus edge clearance) and not overlapping any existing window.
 * @param {number} wallWidth - Wall width in inches
 * @param {number} windowWidth - Nominal width of the window to place
 * @param {Array<{ x: number, width: number }>} otherWindows - Existing windows { center x, width }
 */
export function canFitOneMoreWindow(wallWidth, windowWidth, otherWindows = []) {
  return getFreeIntervals(wallWidth, windowWidth, otherWindows).length > 0;
}

/**
 * Shared opening fit validation: does the opening fit the wall?
 * Used for both doors and windows so the app does not allow oversized openings.
 * @param {number} wallWidth - Wall width in inches
 * @param {number} openingWidth - Nominal opening width in inches (door width or window width)
 * @param {{ edgeClearance?: boolean }} [opts] - If true (default), require 2*EDGE_CLEARANCE for windows; use false for doors
 * @returns {boolean}
 */
export function openingFitsWall(wallWidth, openingWidth, opts = {}) {
  const edgeClearance = opts.edgeClearance !== false;
  if (!isFiniteNumber(wallWidth) || wallWidth <= 0 || !isFiniteNumber(openingWidth) || openingWidth <= 0) return false;
  const required = openingWidth + (edgeClearance ? 2 * EDGE_CLEARANCE : 0);
  return wallWidth >= required;
}

/** Small margin (inches) so "prefer not over door" doesn't exclude positions just next to the door */
const DOOR_PREFER_CLEARANCE = 2;

/**
 * Returns a valid center x for a window: if currentX lies in a valid interval, returns it (or the interval center);
 * otherwise returns the center of the nearest valid interval so the layout stays valid after resize.
 * @param {number} wallWidth - Wall width in inches
 * @param {number} windowWidth - Nominal width of the window
 * @param {number} currentX - Current center x (may be invalid after resize)
 * @param {Array<{ x: number, width: number }>} otherWindows - Other windows (with valid positions) for overlap check
 * @returns {number}
 */
export function clampWindowPositionToValid(wallWidth, windowWidth, currentX, otherWindows = []) {
  const intervals = getFreeIntervals(wallWidth, windowWidth, otherWindows);
  if (intervals.length === 0) return 0;
  const x = Number.isFinite(currentX) ? currentX : 0;
  for (const [a, b] of intervals) {
    if (x >= a && x <= b) return x;
  }
  let best = (intervals[0][0] + intervals[0][1]) / 2;
  let bestDist = Math.abs(x - best);
  for (let i = 1; i < intervals.length; i++) {
    const center = (intervals[i][0] + intervals[i][1]) / 2;
    const d = Math.abs(x - center);
    if (d < bestDist) {
      bestDist = d;
      best = center;
    }
  }
  return best;
}

/**
 * Returns a sensible default center x for a new window.
 * Prefers a position not over the door when the wall has a door and such a position exists;
 * otherwise returns a valid position (including over the door) so intentional over-door is still possible.
 * @param {number} wallWidth - Wall width in inches
 * @param {number} windowWidth - Nominal width of the new window
 * @param {Array<{ x: number, width: number }>} otherWindows - Existing windows
 * @param {number|null} doorCenterX - Door center x (inches), or null if no door
 * @param {number} doorWidth - Door width (inches), 0 if no door
 */
export function getDefaultWindowPosition(wallWidth, windowWidth, otherWindows = [], doorCenterX = null, doorWidth = 0) {
  const intervals = getFreeIntervals(wallWidth, windowWidth, otherWindows);
  if (intervals.length === 0) return 0;

  const hasDoor = doorCenterX != null && doorWidth > 0;
  const doorLeft = hasDoor ? doorCenterX - doorWidth / 2 - DOOR_PREFER_CLEARANCE : -Infinity;
  const doorRight = hasDoor ? doorCenterX + doorWidth / 2 + DOOR_PREFER_CLEARANCE : Infinity;

  const notOverDoor = intervals.filter(([a, b]) => b <= doorLeft || a >= doorRight);
  const preferred = notOverDoor.length > 0 ? notOverDoor : intervals;
  const [a, b] = preferred[0];
  const center = (a + b) / 2;
  return Number.isFinite(center) ? center : 0;
}

/**
 * Shared clamp + snap used for both drag and placement.
 * Keeps edge clearance, window-to-window gap, stud snap, and grid snap consistent.
 */
export function clampAndSnap(
  x,
  wallWidth,
  doorCenterX,
  doorWidth,
  windowWidth,
  otherWindows = []
) {
  if (typeof wallWidth !== "number" || !Number.isFinite(wallWidth) || wallWidth <= 0) {
    return { x: 0, snappedToStud: false };
  }
  const halfWindow = (typeof windowWidth === "number" && Number.isFinite(windowWidth) ? windowWidth : 24) / 2;
  let min = -wallWidth / 2 + halfWindow + EDGE_CLEARANCE;
  let max = wallWidth / 2 - halfWindow - EDGE_CLEARANCE;
  if (!Number.isFinite(min) || !Number.isFinite(max) || min > max) {
    return { x: 0, snappedToStud: false };
  }

  for (const other of otherWindows) {
    const ow = typeof other.width === "number" && Number.isFinite(other.width) ? other.width : 24;
    const ox = typeof other.x === "number" && Number.isFinite(other.x) ? other.x : 0;
    const gap = minGapBetween(windowWidth, ow);
    if (x > ox - gap / 2 && x < ox + gap / 2) {
      x = x < ox ? ox - gap / 2 : ox + gap / 2;
    }
  }

  x = Math.max(min, Math.min(max, Number.isFinite(x) ? x : 0));

  const validBays = getValidBayCenters(wallWidth, min, max, doorCenterX, doorWidth, windowWidth, otherWindows);
  if (validBays.length > 0) {
    let nearest = validBays[0];
    let bestDist = Math.abs(x - nearest);
    for (let i = 1; i < validBays.length; i++) {
      const d = Math.abs(x - validBays[i]);
      if (Number.isFinite(d) && d < bestDist) {
        bestDist = d;
        nearest = validBays[i];
      }
    }
    if (Number.isFinite(nearest) && bestDist <= STUD_ASSIST_DIST) {
      const snapped = Math.max(min, Math.min(max, nearest));
      const out = Number.isFinite(snapped) ? snapped : Math.max(min, Math.min(max, 0));
      return { x: out, snappedToStud: true };
    }
  }

  const gridSnap = Math.round(x / GRID_SNAP) * GRID_SNAP;
  const snapped = Math.max(min, Math.min(max, Number.isFinite(gridSnap) ? gridSnap : 0));
  const out = Number.isFinite(snapped) ? snapped : Math.max(min, Math.min(max, 0));
  return { x: out, snappedToStud: false };
}

function getValidBayCenters(wallWidth, min, max, doorCenterX, doorWidth, windowWidth, otherWindows = []) {
  if (typeof wallWidth !== "number" || !Number.isFinite(wallWidth) || wallWidth <= 0) return [];
  const halfW = wallWidth / 2;
  const numStuds = Math.floor(wallWidth / STUD_SNAP) + 1;
  if (numStuds <= 1) return [];
  const actualSpacing = wallWidth / (numStuds - 1);
  if (!Number.isFinite(actualSpacing)) return [];
  const centers = [];
  for (let i = 0; i < numStuds - 1; i++) {
    const c = -halfW + (i + 0.5) * actualSpacing;
    if (!Number.isFinite(c) || c < min || c > max) continue;
    let blocked = false;
    for (const other of otherWindows) {
      const ow = typeof other.width === "number" && Number.isFinite(other.width) ? other.width : 24;
      const ox = typeof other.x === "number" && Number.isFinite(other.x) ? other.x : 0;
      const gap = minGapBetween(windowWidth, ow);
      if (c >= ox - gap / 2 && c <= ox + gap / 2) {
        blocked = true;
        break;
      }
    }
    if (!blocked) centers.push(c);
  }
  return centers.filter((c) => Number.isFinite(c));
}
