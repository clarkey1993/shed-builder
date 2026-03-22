/**
 * Top-down plan generation from build model only (inches, XZ plan = world XZ).
 * Matches Shed.jsx module layout: center (offsetX, offsetZ), front at z - depth/2.
 */
import { formatInchesToFeetInches } from "./formatUnits";

const SIDES = ["front", "back", "left", "right"];
const DIM_OFFSET = 18; // inches outward from wall for dimension lines

/**
 * @param {Object} buildModel - From getBuildModel()
 * @returns {{
 *   modules: Array<{ moduleId, x, z, width, depth }>,
 *   wallEdges: Array<{ moduleId, wallId, side, x1, z1, x2, z2, included, joined }>,
 *   openingMarkers: Array<{
 *     openingId, moduleId, wallId, kind, type, position, width, height,
 *     orientation?, centerX, centerZ, x1, z1, x2, z2
 *   }>
 * }}
 */
export function getTopDownPlan(buildModel) {
  const modules = buildModel?.modules ?? [];
  const walls = buildModel?.walls ?? [];
  const openings = buildModel?.openings ?? [];

  const byId = Object.fromEntries(modules.map((m) => [m.id, m]));

  const planModules = modules.map((m) => {
    const w = m.actualWidth ?? m.width ?? 0;
    const d = m.actualDepth ?? m.depth ?? 0;
    const cx = m.offsetX ?? 0;
    const cz = m.offsetZ ?? 0;
    return {
      moduleId: m.id,
      x: cx - w / 2,
      z: cz - d / 2,
      width: w,
      depth: d,
      actualWidth: w,
      actualDepth: d,
      nominalWidthFeet: m.nominalWidthFeet ?? Math.round(w / 12),
      nominalDepthFeet: m.nominalDepthFeet ?? Math.round(d / 12),
    };
  });

  /** Wall segment in world XZ for one full side of a module (no join trimming). */
  function wallSegmentForSide(mod, side) {
    const cx = mod.offsetX ?? 0;
    const cz = mod.offsetZ ?? 0;
    const hw = (mod.width ?? 0) / 2;
    const hd = (mod.depth ?? 0) / 2;
    switch (side) {
      case "front":
        return { x1: cx - hw, z1: cz - hd, x2: cx + hw, z2: cz - hd };
      case "back":
        return { x1: cx - hw, z1: cz + hd, x2: cx + hw, z2: cz + hd };
      case "left":
        return { x1: cx - hw, z1: cz - hd, x2: cx - hw, z2: cz + hd };
      case "right":
        return { x1: cx + hw, z1: cz - hd, x2: cx + hw, z2: cz + hd };
      default:
        return { x1: cx, z1: cz, x2: cx, z2: cz };
    }
  }

  const wallIncludedById = Object.fromEntries(walls.map((w) => [w.wallId, w.included !== false]));
  const wallLengthById = Object.fromEntries(walls.map((w) => [w.wallId, w.length ?? 0]));

  const wallEdges = [];
  for (const w of walls) {
    const mod = byId[w.moduleId];
    if (!mod) continue;
    const seg = wallSegmentForSide(mod, w.side);
    const len = w.length ?? 0;
    const midX = (seg.x1 + seg.x2) / 2;
    const midZ = (seg.z1 + seg.z2) / 2;
    wallEdges.push({
      moduleId: w.moduleId,
      wallId: w.wallId,
      side: w.side,
      x1: seg.x1,
      z1: seg.z1,
      x2: seg.x2,
      z2: seg.z2,
      length: len,
      midX,
      midZ,
      included: w.included !== false,
      joined: w.joined === true,
    });
  }

  /** Opening center and edge segment along wall (matches Wall rotations in Shed.jsx). */
  function openingWorldGeometry(mod, side, position, openingWidth) {
    const cx = mod.offsetX ?? 0;
    const cz = mod.offsetZ ?? 0;
    const hw = (mod.width ?? 0) / 2;
    const hd = (mod.depth ?? 0) / 2;
    const p = Number.isFinite(Number(position)) ? Number(position) : 0;
    const half = (openingWidth ?? 0) / 2;

    switch (side) {
      case "front": {
        const x0 = cx + p - half;
        const x1 = cx + p + half;
        const z = cz - hd;
        return { centerX: cx + p, centerZ: z, x1: x0, z1: z, x2: x1, z2: z };
      }
      case "back": {
        // Back wall: local +X is -world X after rotation π
        const x0 = cx - p - half;
        const x1 = cx - p + half;
        const z = cz + hd;
        return { centerX: cx - p, centerZ: z, x1: x0, z1: z, x2: x1, z2: z };
      }
      case "left": {
        // Shed: left wall rotation Y=π/2 maps local +X to world -Z
        const x = cx - hw;
        const z0 = cz - p - half;
        const z1 = cz - p + half;
        return { centerX: x, centerZ: cz - p, x1: x, z1: z0, x2: x, z2: z1 };
      }
      case "right": {
        const x = cx + hw;
        const z0 = cz + p - half;
        const z1 = cz + p + half;
        return { centerX: x, centerZ: cz + p, x1: x, z1: z0, x2: x, z2: z1 };
      }
      default:
        return { centerX: cx, centerZ: cz, x1: cx, z1: cz, x2: cx, z2: cz };
    }
  }

  let doorCount = 0;
  let windowCount = 0;
  const openingMarkers = [];
  for (const o of openings) {
    const mod = byId[o.moduleId];
    if (!mod) continue;
    const wallId = o.wallId ?? "";
    if (wallIncludedById[wallId] === false) continue;

    const underscore = wallId.indexOf("_");
    const side = underscore >= 0 ? wallId.slice(underscore + 1) : "";
    const validSide = SIDES.includes(side) ? side : "front";
    const geom = openingWorldGeometry(mod, validSide, o.position, o.width);

    const isDoor = (o.kind ?? "window") === "door";
    const displayLabel = isDoor ? `D${++doorCount}` : `W${++windowCount}`;
    const w = o.width ?? 0;
    const h = o.height ?? 0;
    const sizeLabel = `${Math.round(w)}×${Math.round(h)}`;
    const wallLen = wallLengthById[wallId] ?? 0;
    const pos = Number.isFinite(Number(o.position)) ? Number(o.position) : 0;
    const offsetFromStart = wallLen > 0 ? Math.round((wallLen / 2) + pos) : null;

    const row = {
      openingId: o.openingId ?? `${o.wallId}_${o.kind}_${o.position}`,
      moduleId: o.moduleId,
      wallId: o.wallId,
      kind: o.kind ?? "window",
      type: o.type ?? "STANDARD",
      position: o.position ?? 0,
      width: o.width ?? 0,
      height: o.height ?? 0,
      centerX: geom.centerX,
      centerZ: geom.centerZ,
      x1: geom.x1,
      z1: geom.z1,
      x2: geom.x2,
      z2: geom.z2,
      displayLabel,
      sizeLabel,
      offsetFromStart,
      side: validSide,
    };
    if (o.orientation != null) row.orientation = o.orientation;
    openingMarkers.push(row);
  }

  /** Dimension line: start/end of main line, witness points for ticks, label, type. */
  const dimensionLines = [];

  for (const m of planModules) {
    const off = DIM_OFFSET;
    const x1 = m.x;
    const z1 = m.z;
    const x2 = m.x + m.width;
    const z2 = m.z + m.depth;
    if (m.width <= 0 || m.depth <= 0) continue;

    dimensionLines.push({
      type: "module_width",
      moduleId: m.moduleId,
      startX: x1,
      startZ: z1 - off,
      endX: x2,
      endZ: z1 - off,
      witness1X: x1,
      witness1Z: z1,
      witness2X: x2,
      witness2Z: z1,
      label: formatInchesToFeetInches(m.width),
    });
    dimensionLines.push({
      type: "module_depth",
      moduleId: m.moduleId,
      startX: x1 - off,
      startZ: z1,
      endX: x1 - off,
      endZ: z2,
      witness1X: x1,
      witness1Z: z1,
      witness2X: x1,
      witness2Z: z2,
      label: formatInchesToFeetInches(m.depth),
    });
  }

  for (const e of wallEdges) {
    if (!e.included || e.length <= 0) continue;
    if (e.side === "front" || e.side === "left") continue;
    const off = DIM_OFFSET;
    const isHoriz = Math.abs(e.z2 - e.z1) < 0.1;
    const dx = isHoriz ? 0 : (e.side === "left" ? -off : off);
    const dz = isHoriz ? (e.side === "front" ? -off : off) : 0;
    dimensionLines.push({
      type: "wall",
      wallId: e.wallId,
      moduleId: e.moduleId,
      startX: e.x1 + dx,
      startZ: e.z1 + dz,
      endX: e.x2 + dx,
      endZ: e.z2 + dz,
      witness1X: e.x1,
      witness1Z: e.z1,
      witness2X: e.x2,
      witness2Z: e.z2,
      label: formatInchesToFeetInches(e.length),
    });
  }

  /** Chained opening dimensions: dedicated row farther from wall than main dims for clear separation. */
  const OPENING_CHAIN_OFFSET = DIM_OFFSET + 18;
  const openingChains = [];
  const openingsByWall = new Map();
  for (const o of openingMarkers) {
    const list = openingsByWall.get(o.wallId) ?? [];
    list.push(o);
    openingsByWall.set(o.wallId, list);
  }

  for (const [wallId, wallOpenings] of openingsByWall) {
    if (wallOpenings.length === 0) continue;
    const o = wallOpenings[0];
    const side = o.side ?? "front";
    const wall = wallEdges.find((e) => e.wallId === wallId);
    if (!wall || !wall.included) continue;
    const pm = planModules.find((p) => p.moduleId === o.moduleId);
    if (!pm) continue;

    const wx1 = wall.x1;
    const wz1 = wall.z1;
    const wx2 = wall.x2;
    const wz2 = wall.z2;
    const isHoriz = Math.abs(wz2 - wz1) < 0.1;
    const dx = isHoriz ? 0 : (side === "left" ? -OPENING_CHAIN_OFFSET : OPENING_CHAIN_OFFSET);
    const dz = isHoriz ? (side === "front" ? -OPENING_CHAIN_OFFSET : OPENING_CHAIN_OFFSET) : 0;

    const segments = [];
    const addSeg = (sx, sz, ex, ez, label) => {
      segments.push({
        startX: sx + dx,
        startZ: sz + dz,
        endX: ex + dx,
        endZ: ez + dz,
        witness1X: sx,
        witness1Z: sz,
        witness2X: ex,
        witness2Z: ez,
        label,
      });
    };

    if (isHoriz) {
      const z = wz1 + dz;
      const dist1 = Math.abs(o.x1 - wx1);
      const dist2 = o.width ?? 0;
      const dist3 = Math.abs(wx2 - o.x2);
      addSeg(wx1, wz1, o.x1, wz1, formatInchesToFeetInches(dist1));
      addSeg(o.x1, wz1, o.x2, wz1, formatInchesToFeetInches(dist2));
      addSeg(o.x2, wz1, wx2, wz1, formatInchesToFeetInches(dist3));
    } else {
      const x = wx1 + dx;
      const dist1 = Math.abs(o.z1 - wz1);
      const dist2 = o.width ?? 0;
      const dist3 = Math.abs(wz2 - o.z2);
      addSeg(wx1, wz1, wx1, o.z1, formatInchesToFeetInches(dist1));
      addSeg(wx1, o.z1, wx1, o.z2, formatInchesToFeetInches(dist2));
      addSeg(wx1, o.z2, wx1, wz2, formatInchesToFeetInches(dist3));
    }

    openingChains.push({
      wallId,
      moduleId: o.moduleId,
      side,
      segments,
    });
  }

  return {
    modules: planModules,
    wallEdges,
    openingMarkers,
    dimensionLines,
    openingChains,
  };
}
