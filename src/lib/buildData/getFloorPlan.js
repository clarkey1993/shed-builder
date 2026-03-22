/**
 * Floor/base plan generation from build model only (no meshes, scene, or Three.js).
 * Bramwood-style floor drawing: outline, side rails, internal joists.
 * Derives floor sizes from Bramwood floor table (floor_widths_inches, nominal depth × 12).
 * A members = 2×1 perimeter rails; B members = 2×2 internal joists as required.
 */
import shedData from "../../shedData.json";
import { formatFeet, formatInchesToFeetInches } from "./formatUnits";

const DIM_OFFSET = 14;
const MIN_SPAN_FOR_DIMS = 20;

// --- Bramwood floor sizing rules (from shedData; fallbacks if JSON incomplete) ---
// A members: 2×1 uprights (upright_ends_thickness: 2×1) - perimeter rails
// B members: 2×2 (upright_middles_thickness: 2×2) - internal joists
// Joist spacing: framing.spacing_ft × 12 (e.g. 2 → 24")
const JOIST_SPACING = (shedData.framing?.spacing_ft ?? 2) * 12;

/**
 * Get actual floor dimensions from Bramwood rules.
 * @param {number} nominalWidthFeet - Nominal width in feet (e.g. 8)
 * @param {number} nominalDepthFeet - Nominal depth in feet (e.g. 6)
 * @returns {{ actualFloorWidth: number, actualFloorDepth: number }}
 */
function getBramwoodFloorDimensions(nominalWidthFeet, nominalDepthFeet) {
  const fw = shedData.floor_widths_inches ?? {};
  const actualFloorWidth =
    fw[String(nominalWidthFeet)] ?? nominalWidthFeet * 12;
  const actualFloorDepth = (nominalDepthFeet || 1) * 12;
  return { actualFloorWidth, actualFloorDepth };
}

/**
 * Derive Bramwood A and B member groups for a floor module.
 * A = 2×1 perimeter rails (2 long + 2 short)
 * B = 2×2 internal joists spanning short dimension, spaced at JOIST_SPACING
 * @param {number} actualFloorWidth - Floor width in inches
 * @param {number} actualFloorDepth - Floor depth in inches
 * @returns {{ memberGroupA: object, memberGroupB: object }}
 */
function deriveBramwoodMemberGroups(actualFloorWidth, actualFloorDepth) {
  const long = Math.max(actualFloorWidth, actualFloorDepth);
  const short = Math.min(actualFloorWidth, actualFloorDepth);

  // A members: 2×1 perimeter rails (2 long, 2 short)
  const memberGroupA = {
    spec: "2×1",
    description: "2×1 perimeter rails",
    longLengthInches: long,
    shortLengthInches: short,
    countLong: 2,
    countShort: 2,
  };

  // B members: 2×2 joists spanning short dimension, spaced along long dimension
  const spanAxis = long;
  const joistCount = Math.max(2, Math.floor(spanAxis / JOIST_SPACING) + 1);
  const memberGroupB = {
    spec: "2×2",
    description: "2×2 joists",
    lengthInches: short,
    count: joistCount,
  };

  return { memberGroupA, memberGroupB };
}

/**
 * Build display-friendly member schedule for Bramwood floor sheet.
 * @param {Object} memberGroupA - From deriveBramwoodMemberGroups
 * @param {Object} memberGroupB - From deriveBramwoodMemberGroups
 * @returns {Object} { groupA, groupB } with formatted display strings
 */
function buildMemberSchedule(memberGroupA, memberGroupB) {
  const aItems = [];
  if (memberGroupA.countLong > 0 && memberGroupA.longLengthInches != null) {
    aItems.push({
      qty: memberGroupA.countLong,
      lengthInches: memberGroupA.longLengthInches,
      formatted: `${memberGroupA.countLong} @ ${formatInchesToFeetInches(memberGroupA.longLengthInches)}`,
    });
  }
  if (memberGroupA.countShort > 0 && memberGroupA.shortLengthInches != null) {
    const existing = aItems.find((i) => i.lengthInches === memberGroupA.shortLengthInches);
    if (existing) {
      existing.qty += memberGroupA.countShort;
      existing.formatted = `${existing.qty} @ ${formatInchesToFeetInches(existing.lengthInches)}`;
    } else {
      aItems.push({
        qty: memberGroupA.countShort,
        lengthInches: memberGroupA.shortLengthInches,
        formatted: `${memberGroupA.countShort} @ ${formatInchesToFeetInches(memberGroupA.shortLengthInches)}`,
      });
    }
  }

  const groupA = {
    label: "A",
    spec: memberGroupA.spec,
    description: "Perimeter rails",
    items: aItems,
    summary: aItems.map((i) => i.formatted).join(", "),
  };

  const groupB = {
    label: "B",
    spec: memberGroupB.spec,
    description: "Joists",
    items: [
      {
        qty: memberGroupB.count,
        lengthInches: memberGroupB.lengthInches,
        formatted: `${memberGroupB.count} @ ${formatInchesToFeetInches(memberGroupB.lengthInches)}`,
      },
    ],
    summary: `${memberGroupB.count} @ ${formatInchesToFeetInches(memberGroupB.lengthInches)}`,
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

    // Derive from Bramwood rules (not wall outlines or guessed values)
    const { actualFloorWidth, actualFloorDepth } =
      getBramwoodFloorDimensions(nominalW, nominalD);
    const { memberGroupA, memberGroupB } = deriveBramwoodMemberGroups(
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
 * Bramwood-style floor member layout.
 * - sideMembers: perimeter rails (A members, 2×1) - the outer frame.
 * - internalMembers: joists (B members, 2×2) spanning the shorter dimension, spaced at JOIST_SPACING.
 * Joists span the short dimension for structural efficiency and are spaced along the long dimension.
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

  const internalMembers = [];
  // Joists span the short dimension; spaced along the long dimension at JOIST_SPACING
  const longAxis = Math.max(floorWidth, floorDepth);
  const numJoists = Math.max(2, Math.floor(longAxis / JOIST_SPACING) + 1);

  // When width >= depth: joists run along Z (vertical in plan), spaced along X
  // When width < depth: joists run along X (horizontal in plan), spaced along Z
  if (floorWidth >= floorDepth) {
    for (let i = 1; i < numJoists; i++) {
      const localX = i * JOIST_SPACING;
      if (localX >= floorWidth) break;
      const x = baseX + localX;
      internalMembers.push({
        type: "internal",
        x1: x,
        z1: baseZ,
        x2: x,
        z2: baseZ + floorDepth,
      });
    }
  } else {
    for (let i = 1; i < numJoists; i++) {
      const localZ = i * JOIST_SPACING;
      if (localZ >= floorDepth) break;
      const z = baseZ + localZ;
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
