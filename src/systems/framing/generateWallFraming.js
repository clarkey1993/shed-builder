/**
 * Automatic wall framing generation.
 * Calculates stud, noggin, and header positions based on wall dimensions and openings.
 * Used by WallFraming component for structural visualization.
 */

const STUD_SPACING = 24;
const NOGGIN_SPACING = 36;
const FRAMING_MARGIN = 3; // inches each side of opening for king/trimmer

/**
 * Generate wall framing layout.
 * @param {Object} params
 * @param {number} params.wallWidth - Wall width in inches
 * @param {number} params.wallHeight - Wall height in inches
 * @param {number} [params.studSpacing=24] - Stud spacing in inches
 * @param {Array<{x: number, width: number, height: number}>} [params.windows=[]] - Window openings {x center, width, height}
 * @param {Array<{x: number, width: number, height: number}>} [params.doors=[]] - Door openings {x center, width, height}
 * @param {boolean} [params.isWorkshop=false] - Use 3x2 studs for workshop sheds
 */
export function generateWallFraming({
  wallWidth,
  wallHeight,
  studSpacing = STUD_SPACING,
  windows = [],
  doors = [],
  isWorkshop = false,
}) {
  const plateThickness = 1.5;
  const studHeight = wallHeight - plateThickness * 2;
  const halfW = wallWidth / 2;

  const studPositions = [];
  const nogginPositions = [];
  const headerPositions = [];

  // Build list of opening ranges (xMin, xMax, yMin, yMax) for windows and doors
  const openings = [
    ...windows.map((w) => ({
      xMin: w.x - w.width / 2 - FRAMING_MARGIN,
      xMax: w.x + w.width / 2 + FRAMING_MARGIN,
      yMin: -w.height / 2 - 2,
      yMax: w.height / 2 + 2,
    })),
    ...doors.map((d) => ({
      xMin: d.x - d.width / 2 - FRAMING_MARGIN,
      xMax: d.x + d.width / 2 + FRAMING_MARGIN,
      yMin: -wallHeight / 2,
      yMax: -wallHeight / 2 + d.height + 2,
    })),
  ];

  const isInOpening = (x) =>
    openings.some((o) => x >= o.xMin && x <= o.xMax);

  const isInOpeningAtY = (x, y) =>
    openings.some((o) => x >= o.xMin && x <= o.xMax && y >= o.yMin && y <= o.yMax);

  // Generate stud positions - left corner, right corner, and every 24" between
  const numStuds = Math.floor(wallWidth / studSpacing) + 1;
  const actualSpacing = wallWidth / (numStuds - 1) || studSpacing;

  for (let i = 0; i < numStuds; i++) {
    const studX = -halfW + i * actualSpacing;
    if (isInOpening(studX)) continue;
    studPositions.push({ x: studX, type: i === 0 || i === numStuds - 1 ? "corner" : "regular" });
  }

  // King studs beside openings (full height studs at opening edges)
  openings.forEach((o) => {
    const kingLeft = o.xMin;
    const kingRight = o.xMax;
    if (!studPositions.some((s) => Math.abs(s.x - kingLeft) < 0.5)) {
      studPositions.push({ x: kingLeft, type: "king" });
    }
    if (!studPositions.some((s) => Math.abs(s.x - kingRight) < 0.5)) {
      studPositions.push({ x: kingRight, type: "king" });
    }
  });

  studPositions.sort((a, b) => a.x - b.x);

  // Noggins - every 36" vertically, between stud bays (not in openings)
  for (let y = -studHeight / 2 + NOGGIN_SPACING; y < studHeight / 2 - 2; y += NOGGIN_SPACING) {
    for (let i = 0; i < studPositions.length - 1; i++) {
      const leftX = studPositions[i].x;
      const rightX = studPositions[i + 1].x;
      const centerX = (leftX + rightX) / 2;
      if (isInOpeningAtY(centerX, y)) continue;
      nogginPositions.push({
        x: centerX,
        y,
        width: rightX - leftX - 1.5,
      });
    }
  }

  // Headers above windows and doors
  windows.forEach((w) => {
    headerPositions.push({
      x: w.x,
      y: w.height / 2 + 2,
      width: w.width + FRAMING_MARGIN * 2,
      height: 3.5,
    });
  });
  doors.forEach((d) => {
    const headerY = -wallHeight / 2 + d.height + 2;
    headerPositions.push({
      x: d.x,
      y: headerY,
      width: d.width + FRAMING_MARGIN * 2,
      height: 3.5,
    });
  });

  return {
    studPositions,
    nogginPositions,
    headerPositions,
    plateThickness,
    studHeight,
    studSize: isWorkshop ? { w: 2.5, t: 1.5 } : { w: 1.5, t: 1.5 },
  };
}
