/**
 * SHED_RULES - Single source of truth for Bramwood construction dimensions.
 * Do NOT replace existing shedData.json or ConfiguratorContext calculations.
 * Use for verification and as reference for future alignment.
 */
export const SHED_RULES = {
  apex: {
    standardWallHeight: 66,
    workshopWallHeight: 70,
  },
  pent: {
    backWallHeight: 70,
    slopePerFoot: 1,
  },
  windows: {
    standard: {
      width: 24,
      height: 24,
    },
    security: {
      width: 24,
      height: 12,
    },
  },
  doors: {
    singleWidth: 27,
    doubleWidth: 60,
  },
  cladding: {
    boardWidth: 5,
    visibleCoverage: 4,
    orientation: "horizontal",
  },
  framing: {
    standardStud: "2x2",
    workshopStud: "3x2",
    studSpacing: 24,
  },
};

/**
 * Returns front/back wall heights for pent roof sheds (inches).
 * depth: shed depth in feet.
 * Not yet applied to wall rendering; for future alignment.
 */
export function getPentWallHeights(depth) {
  const back = SHED_RULES.pent.backWallHeight;
  const front = back + (depth * SHED_RULES.pent.slopePerFoot);
  return { back, front };
}
