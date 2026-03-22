/**
 * Builder-sheet composition layer.
 * Derives a single structured sheet object from existing build-data outputs.
 * Pure data composition; no meshes, scene, or Three.js.
 */
import { getTopDownPlan } from "./getTopDownPlan";
import { getFloorPlan } from "./getFloorPlan";
import { getElevations } from "./getElevations";
import { getRoofDrawings } from "./getRoofDrawings";
import { getBuildSchedules } from "./getSchedules";
import { formatFeet, formatInchesToFeetInches } from "./formatUnits";

/**
 * Composes a single builder-sheet object from the build model.
 * Reuses getTopDownPlan, getElevations, getBuildSchedules.
 * @param {Object} buildModel - From getBuildModel()
 * @returns {Object} { metadata, plan, elevations, scheduleSummary }
 */
export function getBuilderSheet(buildModel) {
  const plan = getTopDownPlan(buildModel);
  const floorPlan = getFloorPlan(buildModel);
  const elevations = getElevations(buildModel);
  const roofDrawings = getRoofDrawings(buildModel);
  const schedules = getBuildSchedules(buildModel);

  const modules = buildModel?.modules ?? [];
  const primary = modules[0];

  let nominalSize = "—";
  if (primary) {
    const nw = primary.nominalWidthFeet ?? Math.round((primary.width ?? 0) / 12);
    const nd = primary.nominalDepthFeet ?? Math.round((primary.depth ?? 0) / 12);
    nominalSize = `${formatFeet(nw)} × ${formatFeet(nd)}`;
    if (modules.length > 1) {
      nominalSize += ` (${modules.length} modules)`;
    }
  }

  const roofTypes = [...new Set(schedules.roofs.map((r) => r.roofType ?? "apex"))];
  const roofSummary =
    roofTypes.length === 0 ? "—" : roofTypes.map((t) => (t === "apex" ? "Apex" : "Pent")).join(", ");

  const metadata = {
    projectTitle: "Bramwood Shed – Builder Sheet",
    nominalSize,
    moduleCount: modules.length,
    roofSummary,
    generatedAt: new Date().toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    }),
  };

  const scheduleSummary = buildScheduleSummary(schedules, modules);

  return {
    metadata,
    plan,
    floorPlan,
    elevations,
    roofDrawings,
    scheduleSummary,
  };
}

/**
 * Compact schedule summary for sheet layout (no raw tables).
 */
function buildScheduleSummary(schedules, modules) {
  const mods = schedules.modules ?? [];
  const walls = schedules.walls ?? [];
  const openings = schedules.openings ?? [];

  const includedWalls = walls.filter((w) => w.included !== false);
  const doorCount = openings.filter((o) => o.kind === "door").length;
  const windowCount = openings.filter((o) => o.kind === "window").length;

  const lines = [
    `${mods.length} module${mods.length !== 1 ? "s" : ""} · ${includedWalls.length} walls`,
    `${doorCount} door${doorCount !== 1 ? "s" : ""} · ${windowCount} window${windowCount !== 1 ? "s" : ""}`,
  ];

  const moduleLines = mods.slice(0, 4).map((m) => {
    const w = m.width ?? 0;
    const d = m.depth ?? 0;
    const roof = m.roofType ?? "apex";
    const size = `${formatInchesToFeetInches(w)} × ${formatInchesToFeetInches(d)}`;
    return `${m.moduleId ?? "?"}: ${size} ${roof}`;
  });

  return {
    summary: lines.join(" · "),
    moduleLines,
    doorCount,
    windowCount,
  };
}
