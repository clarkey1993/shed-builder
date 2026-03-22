/**
 * Automatic wall framing generation for shed constructor view.
 * Simplified framing: studs at 24" centres, no noggins, top follows gable/trapezoid profile.
 * Supports rectangular (wallHeight), trapezoid (heightAtStart, heightAtEnd, yCenter), or gable (eaveHeight, peakHeight, yCenter).
 */

const STUD_SPACING = 24;
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
 * Side walls: uprights every 24", no noggins.
 * Apex walls: uprights only, top framing follows gable shape.
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

  // Studs at 24" on-centre from left edge (practical shed framing)
  const studXs = [];
  for (let i = 0; ; i++) {
    const x = -halfW + i * studSpacing;
    if (x > halfW + 0.5) break;
    studXs.push(i === 0 ? -halfW : Math.min(x, halfW));
  }
  if (studXs.length > 0 && studXs[studXs.length - 1] < halfW - 0.5) {
    studXs.push(halfW);
  }
  const seen = new Set();
  for (const studX of studXs) {
    const key = Math.round(studX * 10) / 10;
    if (seen.has(key)) continue;
    seen.add(key);
    if (isInOpening(studX)) continue;
    const type = Math.abs(studX + halfW) < 0.5 || Math.abs(studX - halfW) < 0.5 ? "corner" : "regular";
    if (isTrapezoid || isGable) {
      const h = heightAtX(studX);
      const studH = h - plateThickness * 2;
      const studCenterY = (h - 2 * yCenter) / 2;
      studPositions.push({ x: studX, type, studHeight: studH, studCenterY });
    } else {
      studPositions.push({ x: studX, type });
    }
  }

  openings.forEach((o) => {
    const kingLeft = o.xMin;
    const kingRight = o.xMax;
    if (!studPositions.some((s) => Math.abs(s.x - kingLeft) < 0.5)) {
      const sh = (isTrapezoid || isGable) ? heightAtX(kingLeft) - plateThickness * 2 : studHeightRect;
      const studCenterY = (isTrapezoid || isGable) ? (heightAtX(kingLeft) - 2 * yCenter) / 2 : undefined;
      studPositions.push((isTrapezoid || isGable) ? { x: kingLeft, type: "king", studHeight: sh, studCenterY } : { x: kingLeft, type: "king" });
    }
    if (!studPositions.some((s) => Math.abs(s.x - kingRight) < 0.5)) {
      const sh = (isTrapezoid || isGable) ? heightAtX(kingRight) - plateThickness * 2 : studHeightRect;
      const studCenterY = (isTrapezoid || isGable) ? (heightAtX(kingRight) - 2 * yCenter) / 2 : undefined;
      studPositions.push((isTrapezoid || isGable) ? { x: kingRight, type: "king", studHeight: sh, studCenterY } : { x: kingRight, type: "king" });
    }
  });

  studPositions.sort((a, b) => a.x - b.x);

  // No noggins — simplified shed framing (side walls and apex use uprights only)
  // No window headers — avoid over-framed look; king studs provide support

  doors.forEach((d) => {
    const headerY = wallBottom + d.height + 2;
    headerPositions.push({ x: d.x, y: headerY, width: d.width + FRAMING_MARGIN * 2, height: 3.5 });
  });

  const studHeight = (isTrapezoid || isGable) ? undefined : studHeightRect;
  const topPlateSlope = isTrapezoid ? { heightAtStart, heightAtEnd, yCenter, plateThickness } : isGable ? { eaveHeight, peakHeight, yCenter, plateThickness } : null;

  return {
    studPositions,
    nogginPositions: [],
    headerPositions,
    plateThickness,
    studHeight,
    studSize: isWorkshop ? { w: 2.5, t: 1.5 } : { w: 1.5, t: 1.5 },
    isTrapezoid,
    isGable,
    topPlateSlope,
  };
}
