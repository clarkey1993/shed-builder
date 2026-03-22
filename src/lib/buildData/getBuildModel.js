/**
 * Build-data extraction layer.
 * Derives a pure build model from configurator state for export/schedules/plans.
 * Does not depend on rendered meshes or scene geometry.
 */
import shedData from "../../shedData.json";
import { getWallProfiles, getWallHeight } from "../../systems/roof/getWallProfiles";
import { getWindowDimensions, getDoorDimensions } from "../../systems/openings/getOpeningDimensions";

/** Nominal width (feet) from actual width (inches). Sheds are marketed by nominal size; geometry uses floor_widths_inches. */
function getNominalWidthFeet(actualWidthInches) {
  const w = Math.round(Number(actualWidthInches) || 0);
  const entry = Object.entries(shedData.floor_widths_inches || {}).find(([, v]) => Math.round(v) === w);
  return entry ? Number(entry[0]) : Math.round(w / 12) || 1;
}

const SIDES = ["front", "back", "left", "right"];
const isFrontOrBack = (side) => side === "front" || side === "back";

/** Computes overlap cut spans for joined walls. Same logic as ConfiguratorContext. */
function getWallCutSpans(modules) {
  const byId = Object.fromEntries(modules.map((m) => [m.id, m]));
  const spans = new Map();
  for (const child of modules) {
    if (!child.attachedTo || !child.attachSide) continue;
    const parent = byId[child.attachedTo];
    if (!parent) continue;
    const side = child.attachSide;
    const pW = parent.width ?? 0;
    const pD = parent.depth ?? 0;
    const cW = child.width ?? 0;
    const cD = child.depth ?? 0;
    const attachOffset = child.attachOffset ?? 0;
    if (side === "right" || side === "left") {
      const overlapHalf = Math.min(pD, cD) / 2;
      const cut = { axis: "z", cutStart: attachOffset - overlapHalf, cutEnd: attachOffset + overlapHalf };
      if (side === "right") {
        spans.set(`${parent.id}_right`, cut);
        spans.set(`${child.id}_left`, cut);
      } else {
        spans.set(`${parent.id}_left`, cut);
        spans.set(`${child.id}_right`, cut);
      }
    } else if (side === "front" || side === "back") {
      const overlapHalf = Math.min(pW, cW) / 2;
      const cut = { axis: "x", cutStart: attachOffset - overlapHalf, cutEnd: attachOffset + overlapHalf };
      if (side === "front") {
        spans.set(`${parent.id}_front`, cut);
        spans.set(`${child.id}_back`, cut);
      } else {
        spans.set(`${parent.id}_back`, cut);
        spans.set(`${child.id}_front`, cut);
      }
    }
  }
  return spans;
}

/** Wall length from module dimensions: front/back = width, left/right = depth. */
function getWallLength(module, side) {
  return isFrontOrBack(side) ? (module.width ?? 0) : (module.depth ?? 0);
}

/**
 * Builds a pure build model from configurator state.
 * @param {Object} state - Configurator state snapshot
 * @param {Array} state.modules
 * @param {Object} state.roofByModule
 * @param {Object} state.wallIncluded
 * @param {Object} state.wallJoinOverrideByWallId
 * @param {Object} state.windowPositionsRaw
 * @param {Object} state.windowTypesRaw
 * @param {Object} state.doorsByWallRaw
 * @param {Object} state.shedConfig - wallHeight, roofPeakHeight
 * @param {string} [state.wallHeightType] - "standard" | "workshop"
 * @returns {Object} Build model: { modules, walls, openings }
 */
export function getBuildModel(state) {
  if (!state?.modules?.length) {
    return { modules: [], walls: [], openings: [] };
  }

  const {
    modules,
    roofByModule = {},
    wallIncluded = {},
    wallJoinOverrideByWallId = {},
    windowPositionsRaw = {},
    windowTypesRaw = {},
    doorsByWallRaw = {},
    shedConfig = {},
    wallHeightType = "standard",
  } = state;

  const wallHeight = typeof shedConfig.wallHeight === "number" ? shedConfig.wallHeight : 66;
  const roofPeakHeight = shedConfig.roofPeakHeight ?? wallHeight;
  const cutSpans = getWallCutSpans(modules);

  // --- Modules ---
  // actualWidth/actualDepth = geometry used for layout. nominalWidthFeet/nominalDepthFeet = marketed shed size for display.
  const buildModules = modules.map((m) => {
    const roof = roofByModule[m.id] ?? { visible: false, type: "apex", pentSlopeDirection: "front_to_back" };
    const actualWidth = m.width ?? 0;
    const actualDepth = m.depth ?? 0;
    const nominalWidthFeet = getNominalWidthFeet(actualWidth);
    const nominalDepthFeet = Math.round(actualDepth / 12) || 1;
    return {
      id: m.id,
      width: actualWidth,
      depth: actualDepth,
      actualWidth,
      actualDepth,
      nominalWidthFeet,
      nominalDepthFeet,
      offsetX: m.offsetX ?? 0,
      offsetZ: m.offsetZ ?? 0,
      attachedTo: m.attachedTo ?? null,
      attachSide: m.attachSide ?? null,
      attachOffset: m.attachOffset ?? 0,
      roof: {
        visible: roof.visible ?? false,
        type: roof.type ?? "apex",
        pentSlopeDirection: roof.pentSlopeDirection ?? "front_to_back",
      },
    };
  });

  // --- Walls ---
  const buildWalls = [];
  for (const mod of modules) {
    const roof = roofByModule[mod.id] ?? { type: "apex", pentSlopeDirection: "front_to_back" };
    const profiles = getWallProfiles(
      roof.type ?? "apex",
      roof.pentSlopeDirection ?? "front_to_back",
      mod.width ?? 0,
      mod.depth ?? 0,
      wallHeight,
      roofPeakHeight
    );

    for (const side of SIDES) {
      const wallId = `${mod.id}_${side}`;
      const length = getWallLength(mod, side);
      const profile = profiles[side];
      const height = profile ? getWallHeight(profile) : wallHeight;
      const cutSpan = cutSpans.get(wallId) ?? null;
      const included = wallIncluded[wallId] !== false;
      const joinOverride = wallJoinOverrideByWallId[wallId] ?? "auto";

      buildWalls.push({
        moduleId: mod.id,
        wallId,
        side,
        length,
        height,
        included,
        joinOverride,
        cutSpan,
        // Joined when there is a cut span; future: derive paired wall from attachment state
        joined: cutSpan != null,
      });
    }
  }

  // --- Openings (windows and doors) ---
  const buildOpenings = [];

  for (const mod of modules) {
    for (const side of SIDES) {
      const wallId = `${mod.id}_${side}`;
      const positions = windowPositionsRaw[wallId] ?? [];
      const types = windowTypesRaw[wallId] ?? [];

      for (let i = 0; i < positions.length; i++) {
        const windowType = types[i] ?? "STANDARD";
        const dims = getWindowDimensions(windowType);
        const centerX = Number.isFinite(Number(positions[i])) ? Number(positions[i]) : 0;

        buildOpenings.push({
          openingId: `${wallId}_window_${i}`,
          kind: "window",
          type: windowType,
          subtype: windowType,
          moduleId: mod.id,
          wallId,
          position: centerX,
          width: dims.width,
          height: dims.height,
          // DOUBLE_VERTICAL has different aspect; orientation helps schedule layout
          orientation: windowType === "DOUBLE_VERTICAL" ? "vertical" : "horizontal",
        });
      }

      const doorData = doorsByWallRaw[wallId];
      if (doorData && doorData.type && doorData.type !== "none") {
        const doorType = doorData.type === "double_with_windows" ? "double" : doorData.type;
        const dims = getDoorDimensions({
          doorType,
          wallHeightType,
          wallHeight,
        });
        const centerX = Number.isFinite(Number(doorData.centerX)) ? Number(doorData.centerX) : 0;

        buildOpenings.push({
          openingId: `${wallId}_door`,
          kind: "door",
          type: doorData.type,
          subtype: doorType,
          moduleId: mod.id,
          wallId,
          position: centerX,
          width: dims.width,
          height: dims.height,
        });
      }
    }
  }

  return {
    modules: buildModules,
    walls: buildWalls,
    openings: buildOpenings,
    wallHeight,
    roofPeakHeight,
  };
}
