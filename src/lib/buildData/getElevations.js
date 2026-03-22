/**
 * Elevation generation from build model only (no meshes, scene, or Three.js).
 * Returns 2D front/back/left/right elevation data for validation and export.
 */
import shedData from "../../shedData.json";
import { getWallProfiles, getWallHeight } from "../../systems/roof/getWallProfiles";
import { formatFeet, formatInchesToFeetInches, formatInchesDrawing } from "./formatUnits";

const SIDES = ["front", "back", "left", "right"];
const DEFAULT_WINDOW_SILL = 18;
const DIM_OFFSET = 14;
const MIN_SPAN_FOR_DIMS = 24;

/** Bramwood upright spacing at 2ft centres (from framing.spacing_ft). */
const UPRIGHT_SPACING = (shedData.framing?.spacing_ft ?? 2) * 12;

/**
 * Round to nearest quarter-inch for Bramwood timber sizes.
 * @param {number} inches
 * @returns {number}
 */
function roundToQuarterInch(inches) {
  return Math.round((inches || 0) * 4) / 4;
}

/**
 * Compute apex gable upright positions and heights at 2ft centres.
 * Each upright height = roof line Y at that x (main upright size from wall drawing).
 * @param {number} wallWidth - Wall length in inches
 * @param {Object} profile - { eaveHeight, peakHeight }
 * @returns {Array<{ x: number, heightInches: number }>}
 */
function computeApexUprights(wallWidth, profile) {
  const eave = profile?.eaveHeight;
  const peak = profile?.peakHeight;
  if (typeof eave !== "number" || typeof peak !== "number" || wallWidth <= 0) {
    return [];
  }

  const uprights = [];
  const halfW = wallWidth / 2;

  for (let x = 0; x <= wallWidth; x += UPRIGHT_SPACING) {
    const clampedX = Math.min(x, wallWidth);
    const frac = Math.max(0, 1 - (2 * Math.abs(clampedX - halfW)) / wallWidth);
    const rawHeight = eave + (peak - eave) * frac;
    uprights.push({
      x: clampedX,
      heightInches: roundToQuarterInch(rawHeight),
    });
  }

  if (uprights.length > 0 && uprights[uprights.length - 1].x < wallWidth - 1) {
    const frac = Math.max(0, 1 - (2 * Math.abs(wallWidth - halfW)) / wallWidth);
    const rawHeight = eave + (peak - eave) * frac;
    uprights.push({
      x: wallWidth,
      heightInches: roundToQuarterInch(rawHeight),
    });
  }

  return uprights;
}

/**
 * @param {Object} buildModel - From getBuildModel()
 * @returns {Object} { front, back, left, right } - each with wall, roof, openings, label
 */
export function getElevations(buildModel) {
  const modules = buildModel?.modules ?? [];
  const walls = buildModel?.walls ?? [];
  const openings = buildModel?.openings ?? [];

  if (modules.length === 0) {
    return { front: null, back: null, left: null, right: null };
  }

  const primary = modules[0];
  const roof = primary.roof ?? { type: "apex", pentSlopeDirection: "front_to_back" };
  const nominalW = primary.nominalWidthFeet ?? Math.round(primary.width / 12);
  const wallHeight = buildModel.wallHeight ?? walls.find((w) => w.moduleId === primary.id)?.height ?? 66;
  const roofPeakHeight =
    buildModel.roofPeakHeight ??
    (roof.type === "apex"
      ? (shedData.apex_roof_dims?.[String(nominalW)] ?? 85)
      : shedData.pent_roof_dims?.[String(nominalW)]?.front ?? 78);

  const profiles = getWallProfiles(
    roof.type ?? "apex",
    roof.pentSlopeDirection ?? "front_to_back",
    primary.width ?? 0,
    primary.depth ?? 0,
    wallHeight,
    roofPeakHeight
  );

  const result = { front: null, back: null, left: null, right: null };

  for (const side of SIDES) {
    const wallId = `${primary.id}_${side}`;
    const wall = walls.find((w) => w.wallId === wallId);
    if (!wall || !wall.included) continue;

    const profile = profiles[side];
    const wallLen = wall.length ?? 0;
    const fullH = getWallHeight(profile);
    const wallH =
      typeof profile?.eaveHeight === "number" ? profile.eaveHeight : fullH;

    const wallOutline = {
      width: wallLen,
      height: wallH,
      fullHeight: fullH,
      baseline: 0,
      profile,
    };

    const roofSilhouette = getRoofSilhouette(
      roof.type ?? "apex",
      roof.pentSlopeDirection ?? "front_to_back",
      side,
      wallLen,
      profile,
      roofPeakHeight
    );

    const faceOpenings = openings
      .filter((o) => o.wallId === wallId)
      .map((o) => {
        const halfW = (o.width ?? 0) / 2;
        const leftX = (wallLen / 2) + (o.position ?? 0) - halfW;
        const w = o.width ?? 0;
        const h = o.height ?? 0;
        let bottomY;
        if (o.kind === "door") {
          bottomY = 0;
        } else {
          bottomY = DEFAULT_WINDOW_SILL;
        }
        return {
          kind: o.kind ?? "window",
          leftX,
          bottomY,
          width: w,
          height: h,
          openingId: o.openingId,
          offsetFromStart: leftX,
        };
      });

    const dimensions = buildElevationDimensions(
      wallLen,
      wallH,
      fullH,
      roofSilhouette,
      roof.type ?? "apex",
      faceOpenings
    );

    let uprights = null;
    let uprightSchedule = null;
    if (roof.type === "apex" && (side === "front" || side === "back") && roofSilhouette?.type === "gable") {
      uprights = computeApexUprights(wallLen, profile);
      uprightSchedule = uprights.map((u, i) => ({
        id: `U${i + 1}`,
        index: i,
        x: u.x,
        heightInches: u.heightInches,
        displayLabel: formatInchesDrawing(u.heightInches),
      }));
    }

    const nominalFeet =
      side === "front" || side === "back"
        ? primary.nominalWidthFeet ?? Math.round(primary.width / 12)
        : primary.nominalDepthFeet ?? Math.round(primary.depth / 12);

    result[side] = {
      face: side,
      moduleId: primary.id,
      wallId,
      wall: wallOutline,
      roof: roofSilhouette,
      openings: faceOpenings,
      dimensions,
      uprights,
      uprightSchedule,
      label: `${side} (${formatFeet(nominalFeet)})`,
      nominalWidth: wallLen,
    };
  }

  return result;
}

/**
 * Roof silhouette points for SVG path. Local coords: x 0..width, y up from baseline.
 * Returns { type, points } where points is array of [x,y].
 */
function getRoofSilhouette(
  roofType,
  _pentDir,
  _side,
  wallWidth,
  profile,
  peakHeight
) {
  const isGable =
    roofType === "apex" &&
    typeof profile?.eaveHeight === "number" &&
    typeof profile?.peakHeight === "number";

  if (isGable) {
    return {
      type: "gable",
      points: [
        [0, profile.eaveHeight],
        [wallWidth / 2, profile.peakHeight],
        [wallWidth, profile.eaveHeight],
      ],
    };
  }

  if (typeof profile?.height === "number") {
    return {
      type: "flat",
      points: [
        [0, profile.height],
        [wallWidth, profile.height],
      ],
    };
  }

  const hStart = profile?.heightAtStart ?? 70;
  const hEnd = profile?.heightAtEnd ?? 70;
  return {
    type: "slope",
    points: [
      [0, hStart],
      [wallWidth, hEnd],
    ],
  };
}

/**
 * Build dimension line data for an elevation. Coordinates in inches, Y up from baseline.
 * Each dim: { type, startX, startY, endX, endY, witness1X, witness1Y, witness2X, witness2Y, label }.
 */
function buildElevationDimensions(
  wallWidth,
  wallHeight,
  fullHeight,
  roofSilhouette,
  roofType,
  openings
) {
  const dims = [];
  const off = DIM_OFFSET;

  if (wallWidth < MIN_SPAN_FOR_DIMS) return dims;

  dims.push({
    type: "faceWidth",
    startX: 0,
    startY: -off,
    endX: wallWidth,
    endY: -off,
    witness1X: 0,
    witness1Y: 0,
    witness2X: wallWidth,
    witness2Y: 0,
    label: formatInchesToFeetInches(wallWidth),
  });

  dims.push({
    type: "wallHeight",
    startX: -off,
    startY: 0,
    endX: -off,
    endY: wallHeight,
    witness1X: 0,
    witness1Y: 0,
    witness2X: 0,
    witness2Y: wallHeight,
    label: formatInchesToFeetInches(wallHeight),
  });

  const peakY = roofSilhouette?.points?.reduce((max, [, y]) => Math.max(max, y), 0) ?? fullHeight;
  if (peakY > wallHeight) {
    dims.push({
      type: "roofHeight",
      startX: wallWidth + off,
      startY: 0,
      endX: wallWidth + off,
      endY: peakY,
      witness1X: wallWidth,
      witness1Y: 0,
      witness2X: wallWidth,
      witness2Y: peakY,
      label: formatInchesToFeetInches(peakY),
    });
  } else if (roofType === "pent" && roofSilhouette?.type === "slope") {
    const lo = Math.min(
      roofSilhouette.points[0]?.[1] ?? wallHeight,
      roofSilhouette.points[1]?.[1] ?? wallHeight
    );
    const hi = Math.max(
      roofSilhouette.points[0]?.[1] ?? wallHeight,
      roofSilhouette.points[1]?.[1] ?? wallHeight
    );
    if (hi - lo > 2) {
      dims.push({
        type: "roofHeight",
        startX: wallWidth + off,
        startY: lo,
        endX: wallWidth + off,
        endY: hi,
        witness1X: wallWidth,
        witness1Y: lo,
        witness2X: wallWidth,
        witness2Y: hi,
        label: formatInchesToFeetInches(hi - lo),
      });
    }
  }

  for (const o of openings) {
    if (o.width >= 4 && o.height >= 4) {
      dims.push({
        type: "openingWidth",
        openingId: o.openingId,
        startX: o.leftX,
        startY: o.bottomY - off * 0.8,
        endX: o.leftX + o.width,
        endY: o.bottomY - off * 0.8,
        witness1X: o.leftX,
        witness1Y: o.bottomY,
        witness2X: o.leftX + o.width,
        witness2Y: o.bottomY,
        label: formatInchesToFeetInches(o.width),
      });
      dims.push({
        type: "openingHeight",
        openingId: o.openingId,
        startX: o.leftX + o.width + off * 0.6,
        startY: o.bottomY,
        endX: o.leftX + o.width + off * 0.6,
        endY: o.bottomY + o.height,
        witness1X: o.leftX + o.width,
        witness1Y: o.bottomY,
        witness2X: o.leftX + o.width,
        witness2Y: o.bottomY + o.height,
        label: formatInchesToFeetInches(o.height),
      });
      if (o.offsetFromStart > 2) {
        dims.push({
          type: "openingOffset",
          openingId: o.openingId,
          startX: 0,
          startY: o.bottomY + o.height / 2,
          endX: o.leftX,
          endY: o.bottomY + o.height / 2,
          witness1X: 0,
          witness1Y: o.bottomY + o.height / 2,
          witness2X: o.leftX,
          witness2Y: o.bottomY + o.height / 2,
          label: formatInchesToFeetInches(o.offsetFromStart),
        });
      }
    }
  }

  return dims;
}
