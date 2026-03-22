/**
 * Roof drawing generation from build model only (no meshes, scene, or Three.js).
 * Returns roof plan view data for apex and pent roofs per module.
 */
import { formatFeet, formatInchesToFeetInches } from "./formatUnits";

const DIM_OFFSET = 12;
const MIN_SPAN_FOR_DIMS = 20;

/**
 * @param {Object} buildModel - From getBuildModel()
 * @returns {Array<Object>} One roof drawing per module, ordered by module order
 */
export function getRoofDrawings(buildModel) {
  const modules = buildModel?.modules ?? [];

  return modules.map((mod) => {
    const roof = mod.roof ?? { type: "apex", pentSlopeDirection: "front_to_back" };
    const roofType = roof.type ?? "apex";
    const width = mod.width ?? mod.actualWidth ?? 0;
    const depth = mod.depth ?? mod.actualDepth ?? 0;
    const nominalW = mod.nominalWidthFeet ?? Math.round(width / 12);
    const nominalD = mod.nominalDepthFeet ?? Math.round(depth / 12);

    const footprint = {
      x: 0,
      z: 0,
      width,
      depth,
      nominalWidthFeet: nominalW,
      nominalDepthFeet: nominalD,
    };

    if (roofType === "apex") {
      return buildApexRoofDrawing(mod.id, footprint);
    }

    return buildPentRoofDrawing(
      mod.id,
      footprint,
      roof.pentSlopeDirection ?? "front_to_back"
    );
  });
}

/**
 * Apex roof: ridge runs along the longer dimension.
 * Plan coords: x = width, z = depth. Front at z=0, back at z=depth.
 */
function buildApexRoofDrawing(moduleId, footprint) {
  const { width, depth, nominalWidthFeet, nominalDepthFeet } = footprint;

  const ridgeRunsAlongWidth = width >= depth;

  let ridgeLine;
  if (ridgeRunsAlongWidth) {
    const ridgeZ = depth / 2;
    ridgeLine = {
      x1: 0,
      z1: ridgeZ,
      x2: width,
      z2: ridgeZ,
      runsAlong: "width",
    };
  } else {
    const ridgeX = width / 2;
    ridgeLine = {
      x1: ridgeX,
      z1: 0,
      x2: ridgeX,
      z2: depth,
      runsAlong: "depth",
    };
  }

  const label = `${moduleId} Apex ${formatFeet(nominalWidthFeet)}×${formatFeet(nominalDepthFeet)}`;

  const dimensions = buildRoofDimensions(width, depth, "apex", null);

  return {
    moduleId,
    roofType: "apex",
    footprint,
    ridgeLine,
    dimensions,
    label,
    nominalWidth: width,
    nominalDepth: depth,
  };
}

/**
 * Pent roof: slope direction defines high-to-low.
 * Plan coords: front z=0, back z=depth; left x=0, right x=width.
 */
function buildPentRoofDrawing(moduleId, footprint, pentSlopeDirection) {
  const { width, depth, nominalWidthFeet, nominalDepthFeet } = footprint;

  const dir = pentSlopeDirection ?? "front_to_back";

  let slopeArrow;
  let highSide;
  let lowSide;

  switch (dir) {
    case "front_to_back":
      highSide = "front";
      lowSide = "back";
      slopeArrow = {
        x1: width / 2,
        z1: depth * 0.2,
        x2: width / 2,
        z2: depth * 0.8,
        direction: "front_to_back",
      };
      break;
    case "back_to_front":
      highSide = "back";
      lowSide = "front";
      slopeArrow = {
        x1: width / 2,
        z1: depth * 0.8,
        x2: width / 2,
        z2: depth * 0.2,
        direction: "back_to_front",
      };
      break;
    case "left_to_right":
      highSide = "left";
      lowSide = "right";
      slopeArrow = {
        x1: width * 0.2,
        z1: depth / 2,
        x2: width * 0.8,
        z2: depth / 2,
        direction: "left_to_right",
      };
      break;
    case "right_to_left":
      highSide = "right";
      lowSide = "left";
      slopeArrow = {
        x1: width * 0.8,
        z1: depth / 2,
        x2: width * 0.2,
        z2: depth / 2,
        direction: "right_to_left",
      };
      break;
    default:
      highSide = "front";
      lowSide = "back";
      slopeArrow = {
        x1: width / 2,
        z1: depth * 0.2,
        x2: width / 2,
        z2: depth * 0.8,
        direction: "front_to_back",
      };
  }

  const slopeLabel = `${highSide} (high) → ${lowSide} (low)`;
  const label = `${moduleId} Pent ${formatFeet(nominalWidthFeet)}×${formatFeet(nominalDepthFeet)}`;

  const slopeRun =
    dir === "front_to_back" || dir === "back_to_front" ? depth : width;
  const slopeIsVertical =
    dir === "front_to_back" || dir === "back_to_front";

  const dimensions = buildRoofDimensions(width, depth, "pent", {
    slopeRun,
    slopeIsVertical,
    highSide,
    lowSide,
  });

  return {
    moduleId,
    roofType: "pent",
    footprint,
    slopeArrow,
    highSide,
    lowSide,
    slopeLabel,
    dimensions,
    label,
    nominalWidth: width,
    nominalDepth: depth,
  };
}

/**
 * Roof plan dimension lines. Coords: x = width, z = depth. Origin top-left.
 * Each dim: { type, startX, startZ, endX, endZ, witness1X, witness1Z, witness2X, witness2Z, label }.
 */
function buildRoofDimensions(width, depth, roofType, extra) {
  const dims = [];
  const off = DIM_OFFSET;

  if (width < MIN_SPAN_FOR_DIMS || depth < MIN_SPAN_FOR_DIMS) return dims;

  dims.push({
    type: "roofWidth",
    startX: 0,
    startZ: -off,
    endX: width,
    endZ: -off,
    witness1X: 0,
    witness1Z: 0,
    witness2X: width,
    witness2Z: 0,
    label: formatInchesToFeetInches(width),
  });

  dims.push({
    type: "roofDepth",
    startX: -off,
    startZ: 0,
    endX: -off,
    endZ: depth,
    witness1X: 0,
    witness1Z: 0,
    witness2X: 0,
    witness2Z: depth,
    label: formatInchesToFeetInches(depth),
  });

  if (roofType === "pent" && extra?.slopeRun != null) {
    const vertical = extra.slopeIsVertical === true;
    if (vertical) {
      dims.push({
        type: "slopeRun",
        startX: width + off,
        startZ: 0,
        endX: width + off,
        endZ: depth,
        witness1X: width / 2,
        witness1Z: 0,
        witness2X: width / 2,
        witness2Z: depth,
        label: formatInchesToFeetInches(extra.slopeRun) + " run",
      });
    } else {
      dims.push({
        type: "slopeRun",
        startX: 0,
        startZ: depth + off,
        endX: width,
        endZ: depth + off,
        witness1X: 0,
        witness1Z: depth / 2,
        witness2X: width,
        witness2Z: depth / 2,
        label: formatInchesToFeetInches(extra.slopeRun) + " run",
      });
    }
  }

  return dims;
}
