/**
 * Automatic wall framing generation.
 * Supports rectangular (wallHeight), trapezoid (heightAtStart, heightAtEnd, yCenter), or gable (eaveHeight, peakHeight, yCenter).
 */

const STUD_SPACING = 24;
const NOGGIN_SPACING = 36;
const FRAMING_MARGIN = 3;

function heightAtXTrapezoid(heightAtStart, heightAtEnd, width, x) {
  const t = (x + width / 2) / width;
  return heightAtStart + (heightAtEnd - heightAtStart) * Math.max(0, Math.min(1, t));
}

function heightAtXGable(eaveHeight, peakHeight, width, x) {
  const frac = Math.max(0, 1 - (2 * Math.abs(x)) / width);
  return eaveHeight + (peakHeight - eaveHeight) * frac;
}

/**
 * Generate wall framing layout.
 * @param {Object} params
 * @param {number} params.wallWidth - Wall width in inches
 * @param {number} params.wallHeight - Wall height in inches (used for rectangular or as fallback)
 * @param {number} [params.heightAtStart] - For trapezoid: height at wall start (left)
 * @param {number} [params.heightAtEnd] - For trapezoid: height at wall end (right)
 * @param {number} [params.eaveHeight] - For gable: eave height
 * @param {number} [params.peakHeight] - For gable: peak height
 * @param {number} [params.yCenter] - For trapezoid/gable: local Y of wall center (bottom at -yCenter)
 */
export function generateWallFraming({
  wallWidth,
  wallHeight,
  heightAtStart,
  heightAtEnd,
  eaveHeight,
  peakHeight,
  yCenter,
  studSpacing = STUD_SPACING,
  windows = [],
  doors = [],
  isWorkshop = false,
}) {
  const plateThickness = 1.5;
  const isTrapezoid = typeof heightAtStart === "number" && typeof heightAtEnd === "number" && typeof yCenter === "number";
  const isGable = typeof eaveHeight === "number" && typeof peakHeight === "number" && typeof yCenter === "number";
  const halfW = wallWidth / 2;
  const wallBottom = isTrapezoid || isGable ? -yCenter : -wallHeight / 2;
  const studHeightRect = wallHeight - plateThickness * 2;
  const heightAtX = (x) => isGable ? heightAtXGable(eaveHeight, peakHeight, wallWidth, x) : heightAtXTrapezoid(heightAtStart, heightAtEnd, wallWidth, x);

  const studPositions = [];
  const nogginPositions = [];
  const headerPositions = [];

  const openings = [
    ...windows.map((w) => {
      const centerY = w.y ?? 0;
      return {
        xMin: w.x - w.width / 2 - FRAMING_MARGIN,
        xMax: w.x + w.width / 2 + FRAMING_MARGIN,
        yMin: centerY - w.height / 2 - 2,
        yMax: centerY + w.height / 2 + 2,
      };
    }),
    ...doors.map((d) => ({
      xMin: d.x - d.width / 2 - FRAMING_MARGIN,
      xMax: d.x + d.width / 2 + FRAMING_MARGIN,
      yMin: wallBottom,
      yMax: wallBottom + d.height + 2,
    })),
  ];

  const isInOpening = (x) => openings.some((o) => x >= o.xMin && x <= o.xMax);
  const isInOpeningAtY = (x, y) => openings.some((o) => x >= o.xMin && x <= o.xMax && y >= o.yMin && y <= o.yMax);

  const numStuds = Math.floor(wallWidth / studSpacing) + 1;
  const actualSpacing = wallWidth / (numStuds - 1) || studSpacing;

  for (let i = 0; i < numStuds; i++) {
    const studX = -halfW + i * actualSpacing;
    if (isInOpening(studX)) continue;
    const type = i === 0 || i === numStuds - 1 ? "corner" : "regular";
    if (isTrapezoid || isGable) {
      const h = heightAtX(studX);
      const studH = h - plateThickness * 2;
      studPositions.push({ x: studX, type, studHeight: studH });
    } else {
      studPositions.push({ x: studX, type });
    }
  }

  openings.forEach((o) => {
    const kingLeft = o.xMin;
    const kingRight = o.xMax;
    if (!studPositions.some((s) => Math.abs(s.x - kingLeft) < 0.5)) {
      const sh = (isTrapezoid || isGable) ? heightAtX(kingLeft) - plateThickness * 2 : studHeightRect;
      studPositions.push((isTrapezoid || isGable) ? { x: kingLeft, type: "king", studHeight: sh } : { x: kingLeft, type: "king" });
    }
    if (!studPositions.some((s) => Math.abs(s.x - kingRight) < 0.5)) {
      const sh = (isTrapezoid || isGable) ? heightAtX(kingRight) - plateThickness * 2 : studHeightRect;
      studPositions.push((isTrapezoid || isGable) ? { x: kingRight, type: "king", studHeight: sh } : { x: kingRight, type: "king" });
    }
  });

  studPositions.sort((a, b) => a.x - b.x);

  const yMin = (isTrapezoid || isGable) ? wallBottom + NOGGIN_SPACING : -studHeightRect / 2 + NOGGIN_SPACING;
  const yMaxForNoggin = (x) => {
    if (!isTrapezoid && !isGable) return studHeightRect / 2 - 2;
    const topY = heightAtX(x) - yCenter - plateThickness;
    return topY - 2;
  };
  const yMaxLoop = (isTrapezoid || isGable)
    ? (isGable ? peakHeight - yCenter : Math.min(heightAtStart - yCenter, heightAtEnd - yCenter)) - plateThickness - 2
    : studHeightRect / 2 - 2;
  for (let y = yMin; y < yMaxLoop; y += NOGGIN_SPACING) {
    for (let i = 0; i < studPositions.length - 1; i++) {
      const leftX = studPositions[i].x;
      const rightX = studPositions[i + 1].x;
      const centerX = (leftX + rightX) / 2;
      if (y >= yMaxForNoggin(centerX)) continue;
      if (isInOpeningAtY(centerX, y)) continue;
      nogginPositions.push({ x: centerX, y, width: rightX - leftX - 1.5 });
    }
  }

  windows.forEach((w) => {
    const centerY = w.y ?? 0;
    headerPositions.push({ x: w.x, y: centerY + w.height / 2 + 2, width: w.width + FRAMING_MARGIN * 2, height: 3.5 });
  });
  doors.forEach((d) => {
    const headerY = wallBottom + d.height + 2;
    headerPositions.push({ x: d.x, y: headerY, width: d.width + FRAMING_MARGIN * 2, height: 3.5 });
  });

  const studHeight = (isTrapezoid || isGable) ? undefined : studHeightRect;
  const topPlateSlope = isTrapezoid ? { heightAtStart, heightAtEnd, yCenter, plateThickness } : isGable ? { eaveHeight, peakHeight, yCenter, plateThickness } : null;

  return {
    studPositions,
    nogginPositions,
    headerPositions,
    plateThickness,
    studHeight,
    studSize: isWorkshop ? { w: 2.5, t: 1.5 } : { w: 1.5, t: 1.5 },
    isTrapezoid,
    isGable,
    topPlateSlope,
  };
}
