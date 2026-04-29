/**
 * Floor/base plan generation from build model only (no meshes, scene, or Three.js).
 * Uses builderRules.js as source of truth for Bramwood floor sizes.
 * A = 2×1 upright (perimeter); B = 2×2 as required (internal joists).
 */
import { formatFeet, formatInchesToFeetInches } from "./formatUnits";
import {
  getFloorActualWidth,
  getFloorActualDepth,
  getFloorGroupALength,
  getFloorGroupBLength,
  getCentresAcrossWidth,
} from "../../config/builderRules";

const DIM_OFFSET = 14;
const MIN_SPAN_FOR_DIMS = 20;
const JOIST_SPACING = 24;

/**
 * Derive floor A and B member groups from builderRules.js.
 * A lengths from group A (width and depth nominals).
 * B length from group B (nominal of span axis); count from 2ft centres.
 */
function deriveFloorMemberGroups(nominalWidthFeet, nominalDepthFeet, actualFloorWidth, actualFloorDepth) {
  const aLong = getFloorGroupALength(nominalWidthFeet);
  const aShort = getFloorGroupALength(nominalDepthFeet);
  const longAxis = Math.max(actualFloorWidth, actualFloorDepth);
  const shortAxis = Math.min(actualFloorWidth, actualFloorDepth);
  const spanNominal = actualFloorWidth >= actualFloorDepth ? nominalDepthFeet : nominalWidthFeet;
  const bLength = getFloorGroupBLength(spanNominal);
  const bPositions = getCentresAcrossWidth(longAxis, JOIST_SPACING);
  const bCount = Math.max(2, bPositions.length - 2);

  const memberGroupA = {
    spec: "2x1",
    description: "upright",
    longLengthInches: aLong,
    shortLengthInches: aShort,
    countLong: 2,
    countShort: 2,
  };

  const memberGroupB = {
    spec: "2x2",
    description: "as required",
    lengthInches: bLength,
    count: bCount,
  };

  return { memberGroupA, memberGroupB };
}

/**
 * Build display-friendly member schedule (builder-style, inches).
 */
function buildMemberSchedule(memberGroupA, memberGroupB) {
  const aItems = [];
  if (memberGroupA.countLong > 0 && memberGroupA.longLengthInches != null) {
    aItems.push({
      qty: memberGroupA.countLong,
      lengthInches: memberGroupA.longLengthInches,
      formatted: `${memberGroupA.countLong} @ ${memberGroupA.longLengthInches}in`,
    });
  }
  if (memberGroupA.countShort > 0 && memberGroupA.shortLengthInches != null) {
    const existing = aItems.find((i) => i.lengthInches === memberGroupA.shortLengthInches);
    if (existing) {
      existing.qty += memberGroupA.countShort;
      existing.formatted = `${existing.qty} @ ${existing.lengthInches}in`;
    } else {
      aItems.push({
        qty: memberGroupA.countShort,
        lengthInches: memberGroupA.shortLengthInches,
        formatted: `${memberGroupA.countShort} @ ${memberGroupA.shortLengthInches}in`,
      });
    }
  }

  const groupA = {
    label: "A",
    spec: memberGroupA.spec,
    description: memberGroupA.description,
    items: aItems,
    summary: aItems.map((i) => i.formatted).join(", "),
  };

  const groupB = {
    label: "B",
    spec: memberGroupB.spec,
    description: memberGroupB.description,
    items: [
      {
        qty: memberGroupB.count,
        lengthInches: memberGroupB.lengthInches,
        formatted: `${memberGroupB.count} @ ${memberGroupB.lengthInches}in`,
      },
    ],
    summary: `${memberGroupB.count} @ ${memberGroupB.lengthInches}in`,
  };

  return { groupA, groupB };
}

/**
 * @param {Object} buildModel - From getBuildModel()
 * @returns {Object} { modules: Array<floorModule>, dimensions: Array } - floor drawing data
 */
export function getFloorPlan(buildModel) {
  const modules = buildModel?.modules ?? [];

  const floorModules = modules.map((mod) => {
    const nominalW = mod.nominalWidthFeet ?? Math.round((mod.width ?? 0) / 12);
    const nominalD = mod.nominalDepthFeet ?? Math.round((mod.depth ?? 0) / 12);

    const actualFloorWidth = getFloorActualWidth(nominalW);
    const actualFloorDepth = getFloorActualDepth(nominalD);
    const { memberGroupA, memberGroupB } = deriveFloorMemberGroups(
      nominalW,
      nominalD,
      actualFloorWidth,
      actualFloorDepth
    );
    const memberSchedule = buildMemberSchedule(memberGroupA, memberGroupB);

    const cx = mod.offsetX ?? 0;
    const cz = mod.offsetZ ?? 0;
    const x = cx - actualFloorWidth / 2;
    const z = cz - actualFloorDepth / 2;

    const outline = { x, z, width: actualFloorWidth, depth: actualFloorDepth };
    // Bramwood sheet-style label positions: A on left side, B at bottom
    const labelA = { x: x - 10, z: cz };
    const labelB = { x: cx, z: z + actualFloorDepth + 10 };

    const { sideMembers, internalMembers } = buildFloorMemberGroups(
      actualFloorWidth,
      actualFloorDepth,
      x,
      z
    );

    return {
      moduleId: mod.id,
      outline,
      labelA,
      labelB,
      nominalWidthFeet: nominalW,
      nominalDepthFeet: nominalD,
      actualFloorWidth,
      actualFloorDepth,
      memberGroupA,
      memberGroupB,
      memberSchedule,
      sideMembers,
      internalMembers,
      label: `${mod.id} ${formatFeet(nominalW)}×${formatFeet(nominalD)}`,
    };
  });

  const dimensions = buildFloorDimensions(floorModules);

  return {
    modules: floorModules,
    dimensions,
  };
}

/**
 * Floor member layout from builderRules (2ft centres).
 * Side members = A perimeter; internal = B joists at 24" centres.
 */
function buildFloorMemberGroups(floorWidth, floorDepth, baseX, baseZ) {
  const sideMembers = [
    { type: "side", x1: baseX, z1: baseZ, x2: baseX, z2: baseZ + floorDepth },
    {
      type: "side",
      x1: baseX + floorWidth,
      z1: baseZ,
      x2: baseX + floorWidth,
      z2: baseZ + floorDepth,
    },
    { type: "end", x1: baseX, z1: baseZ, x2: baseX + floorWidth, z2: baseZ },
    {
      type: "end",
      x1: baseX,
      z1: baseZ + floorDepth,
      x2: baseX + floorWidth,
      z2: baseZ + floorDepth,
    },
  ];

  const longAxis = Math.max(floorWidth, floorDepth);
  const positions = getCentresAcrossWidth(longAxis, JOIST_SPACING);
  const internalMembers = [];

  if (floorWidth >= floorDepth) {
    for (let i = 1; i < positions.length - 1; i++) {
      const x = baseX + positions[i];
      internalMembers.push({
        type: "internal",
        x1: x,
        z1: baseZ,
        x2: x,
        z2: baseZ + floorDepth,
      });
    }
  } else {
    for (let i = 1; i < positions.length - 1; i++) {
      const z = baseZ + positions[i];
      internalMembers.push({
        type: "internal",
        x1: baseX,
        z1: z,
        x2: baseX + floorWidth,
        z2: z,
      });
    }
  }

  return { sideMembers, internalMembers };
}

/**
 * Outside dimensions for floor plan. One width + one depth per module (or shared if joined).
 * First pass: dimension each module.
 */
function buildFloorDimensions(floorModules) {
  const dims = [];

  for (const mod of floorModules) {
    const { x, z, width, depth } = mod.outline;

    if (width < MIN_SPAN_FOR_DIMS || depth < MIN_SPAN_FOR_DIMS) continue;

    dims.push({
      type: "width",
      moduleId: mod.moduleId,
      startX: x,
      startZ: z - DIM_OFFSET,
      endX: x + width,
      endZ: z - DIM_OFFSET,
      witness1X: x,
      witness1Z: z,
      witness2X: x + width,
      witness2Z: z,
      label: formatInchesToFeetInches(width),
    });

    dims.push({
      type: "depth",
      moduleId: mod.moduleId,
      startX: x - DIM_OFFSET,
      startZ: z,
      endX: x - DIM_OFFSET,
      endZ: z + depth,
      witness1X: x,
      witness1Z: z,
      witness2X: x,
      witness2Z: z + depth,
      label: formatInchesToFeetInches(depth),
    });
  }

  return dims;
}
