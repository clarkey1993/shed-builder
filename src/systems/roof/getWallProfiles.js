/**
 * Wall height profiles for apex vs pent roofs.
 * APEX: all walls use the same height (standard/workshop).
 * PENT: high wall = 70 + run (feet), low = 70"; which walls are high/low and which
 * are trapezoidal depends on slope direction (Bramwood build drawings).
 */

const PENT_LOW_HEIGHT = 70; // inches
const PENT_SLOPE_PER_FOOT = 1; // inches per foot of run

/**
 * Returns wall profile for each wall. Used by Shed and Wall for geometry.
 * Apex: front/back are gable (eaveHeight, peakHeight); left/right rectangular.
 * @param {"apex"|"pent"} roofStyle
 * @param {"front_to_back"|"back_to_front"|"left_to_right"|"right_to_left"} pentSlopeDirection - only used when roofStyle === "pent"
 * @param {number} floorWidthInches - shed width in inches
 * @param {number} floorDepthInches - shed depth in inches
 * @param {number} apexWallHeight - wall height for apex (eave height)
 * @param {number} [apexPeakHeight] - ridge height for apex gable ends; defaults to apexWallHeight if omitted
 * @returns {{ front: {...}, back: {...}, left: {...}, right: {...}, cornerHeights: {...} }}
 */
export function getWallProfiles(roofStyle, pentSlopeDirection, floorWidthInches, floorDepthInches, apexWallHeight, apexPeakHeight) {
  if (roofStyle !== "pent") {
    const h = typeof apexWallHeight === "number" && Number.isFinite(apexWallHeight) ? apexWallHeight : 66;
    const peak = typeof apexPeakHeight === "number" && Number.isFinite(apexPeakHeight) ? apexPeakHeight : h;
    return {
      front: { eaveHeight: h, peakHeight: peak },
      back: { eaveHeight: h, peakHeight: peak },
      left: { height: h },
      right: { height: h },
      cornerHeights: { frontLeft: h, frontRight: h, backLeft: h, backRight: h },
    };
  }

  const dir = pentSlopeDirection || "front_to_back";
  const runInches = (dir === "front_to_back" || dir === "back_to_front") ? floorDepthInches : floorWidthInches;
  const runFeet = runInches / 12;
  const low = PENT_LOW_HEIGHT;
  const high = PENT_LOW_HEIGHT + runFeet * PENT_SLOPE_PER_FOOT;

  if (dir === "front_to_back") {
    return {
      front: { height: high },
      back: { height: low },
      left: { heightAtStart: high, heightAtEnd: low },
      right: { heightAtStart: high, heightAtEnd: low },
      cornerHeights: { frontLeft: high, frontRight: high, backLeft: low, backRight: low },
    };
  }
  if (dir === "back_to_front") {
    return {
      front: { height: low },
      back: { height: high },
      left: { heightAtStart: low, heightAtEnd: high },
      right: { heightAtStart: low, heightAtEnd: high },
      cornerHeights: { frontLeft: low, frontRight: low, backLeft: high, backRight: high },
    };
  }
  if (dir === "left_to_right") {
    return {
      front: { heightAtStart: high, heightAtEnd: low },
      back: { heightAtStart: high, heightAtEnd: low },
      left: { height: high },
      right: { height: low },
      cornerHeights: { frontLeft: high, frontRight: low, backLeft: high, backRight: low },
    };
  }
  // right_to_left
  return {
    front: { heightAtStart: low, heightAtEnd: high },
    back: { heightAtStart: low, heightAtEnd: high },
    left: { height: low },
    right: { height: high },
    cornerHeights: { frontLeft: low, frontRight: high, backLeft: low, backRight: high },
  };
}

/**
 * Get the effective (single) height for a wall profile for layout/rendering.
 * Rectangular: profile.height. Trapezoid: max(heightAtStart, heightAtEnd). Gable: peakHeight.
 */
export function getWallHeight(profile) {
  if (!profile) return 70;
  if (typeof profile.height === "number") return profile.height;
  if (typeof profile.eaveHeight === "number" && typeof profile.peakHeight === "number") return profile.peakHeight;
  const a = profile.heightAtStart;
  const b = profile.heightAtEnd;
  return (typeof a === "number" && typeof b === "number") ? Math.max(a, b) : 70;
}

/**
 * Get the minimum wall height (low side of a trapezoid; eave for gable). Use for safe opening zone.
 */
export function getWallMinHeight(profile) {
  if (!profile) return 70;
  if (typeof profile.height === "number") return profile.height;
  if (typeof profile.eaveHeight === "number" && typeof profile.peakHeight === "number") return profile.eaveHeight;
  const a = profile.heightAtStart;
  const b = profile.heightAtEnd;
  return (typeof a === "number" && typeof b === "number") ? Math.min(a, b) : 70;
}

/**
 * Get the vertical center Y (inches) for positioning a wall group so the wall base sits on the floor (y=0).
 * Rectangle: height/2. Trapezoid: (heightAtStart + heightAtEnd) / 4. Gable: (eaveHeight + peakHeight) / 2.
 */
export function getWallCenterY(profile) {
  if (!profile) return 35;
  if (typeof profile.height === "number") return profile.height / 2;
  if (typeof profile.eaveHeight === "number" && typeof profile.peakHeight === "number") return (profile.eaveHeight + profile.peakHeight) / 2;
  const a = profile.heightAtStart;
  const b = profile.heightAtEnd;
  return (typeof a === "number" && typeof b === "number") ? (a + b) / 4 : 35;
}

/**
 * For trapezoid/gable: local Y of wall center (bottom of wall in local coords is at -yCenter).
 * For rectangular walls returns height/2.
 */
export function getWallYCenter(profile) {
  if (!profile) return 35;
  if (typeof profile.height === "number") return profile.height / 2;
  if (typeof profile.eaveHeight === "number" && typeof profile.peakHeight === "number") return (profile.eaveHeight + profile.peakHeight) / 2;
  const a = profile.heightAtStart;
  const b = profile.heightAtEnd;
  return (typeof a === "number" && typeof b === "number") ? (a + b) / 4 : 35;
}

/**
 * Wall height in inches at a given x (wall local x from -width/2 to width/2).
 * Rectangular: profile.height. Trapezoid: linear interpolation. Gable: symmetric triangle (eave at sides, peak at center).
 */
export function getWallHeightAtX(profile, width, x) {
  if (!profile || typeof width !== "number") return 70;
  if (typeof profile.height === "number") return profile.height;
  const eave = profile.eaveHeight;
  const peak = profile.peakHeight;
  if (typeof eave === "number" && typeof peak === "number") {
    const halfW = width / 2;
    const frac = Math.max(0, 1 - (2 * Math.abs(x)) / width);
    return eave + (peak - eave) * frac;
  }
  const a = profile.heightAtStart;
  const b = profile.heightAtEnd;
  if (typeof a !== "number" || typeof b !== "number") return 70;
  const t = (x + width / 2) / width;
  return a + (b - a) * Math.max(0, Math.min(1, t));
}
