import { createContext, useContext, useState, useMemo, useEffect, useCallback } from "react";
import shedData from "../shedData.json";
import { getWindowDimensions, getDoorDimensions } from "../systems/openings/getOpeningDimensions";
import { getBuildModel, getBuildSchedules } from "../lib/buildData";
import { canFitOneMoreWindow, getDefaultWindowPosition, openingFitsWall, clampWindowPositionToValid, minGapBetween, clampAndSnap } from "../systems/openings/windowPlacement";

const ConfiguratorContext = createContext();
/** When set (inside Shed module loop), useConfigurator returns that module's roof config. Otherwise uses activeModuleId. */
export const ModuleRoofContext = createContext(null);

const DEFAULT_ROOF = { visible: false, type: "apex", pentSlopeDirection: "front_to_back" };

const getWallWidthForWallId = (modules, cid, isFrontOrBackFn) =>
  (() => {
    const parts = String(cid).split("_");
    const moduleId = parts[0];
    const mod = modules.find((m) => m.id === moduleId);
    if (!mod) return 0;
    return isFrontOrBackFn(cid) ? mod.width : mod.depth;
  })();

const computeAttachedOffset = (parentModule, childModule, attachSide, attachOffset = 0) => {
  const { offsetX: pX, offsetZ: pZ, width: pW, depth: pD } = parentModule;
  const { width: cW, depth: cD } = childModule;
  switch (attachSide) {
    case "right":
      return { offsetX: pX + pW / 2 + cW / 2, offsetZ: pZ + (attachOffset ?? 0) };
    case "left":
      return { offsetX: pX - pW / 2 - cW / 2, offsetZ: pZ + (attachOffset ?? 0) };
    case "front":
      return { offsetX: pX + (attachOffset ?? 0), offsetZ: pZ - pD / 2 - cD / 2 };
    case "back":
      return { offsetX: pX + (attachOffset ?? 0), offsetZ: pZ + pD / 2 + cD / 2 };
    default:
      return { offsetX: childModule.offsetX ?? 0, offsetZ: childModule.offsetZ ?? 0 };
  }
};

/** Snaps attachOffset to one of three valid positions: center, start-aligned, end-aligned. */
export const snapAttachOffset = (parentModule, childModule, attachSide, rawOffset) => {
  const parentSpan = (attachSide === "left" || attachSide === "right")
    ? (parentModule.depth ?? 0)
    : (parentModule.width ?? 0);
  const childSpan = (attachSide === "left" || attachSide === "right")
    ? (childModule.depth ?? 0)
    : (childModule.width ?? 0);
  const raw = Number(rawOffset);
  if (!Number.isFinite(raw) || parentSpan <= 0 || childSpan <= 0) return 0;
  const halfDiff = (parentSpan - childSpan) / 2;
  const endAligned = childSpan <= parentSpan ? halfDiff : 0;
  const startAligned = childSpan <= parentSpan ? -halfDiff : 0;
  const positions = [0, endAligned, startAligned];
  let nearest = 0;
  let bestDist = Infinity;
  for (const p of positions) {
    const d = Math.abs(raw - p);
    if (d < bestDist) {
      bestDist = d;
      nearest = p;
    }
  }
  return nearest;
};

const reflowAttachedModules = (modules) => {
  const byId = Object.fromEntries(modules.map((m) => [m.id, { ...m }]));
  for (const m of modules) {
    if (!m.attachedTo || !m.attachSide) continue;
    const parent = byId[m.attachedTo];
    if (!parent) continue;
    const attachOffset = snapAttachOffset(parent, byId[m.id], m.attachSide, m.attachOffset ?? 0);
    const { offsetX, offsetZ } = computeAttachedOffset(parent, byId[m.id], m.attachSide, attachOffset);
    byId[m.id] = { ...byId[m.id], offsetX, offsetZ, attachOffset };
  }
  return Object.values(byId);
};

/** Computes overlap cut spans for joined walls. Returns Map<wallId, { axis, cutStart, cutEnd }> in wall-local coords. */
const getWallCutSpans = (modules) => {
  const byId = Object.fromEntries(modules.map((m) => [m.id, m]));
  const spans = new Map();
  for (const child of modules) {
    if (!child.attachedTo || !child.attachSide) continue;
    const parent = byId[child.attachedTo];
    if (!parent) continue;
    const side = child.attachSide;
    const pW = parent.width;
    const pD = parent.depth;
    const cW = child.width;
    const cD = child.depth;
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
};

/**
 * Returns visible segments for a wall after manual inclusion and joined cut span.
 * wallHalfSpan: half the wall length in local coords (width/2 for front/back, depth/2 for left/right).
 * Returns [] if wall is manually removed or fully covered by cut; otherwise [{ start, end }, ...].
 */
const computeVisibleWallSegments = (wallId, wallHalfSpan, wallIncluded, wallCutSpans) => {
  if (wallIncluded[wallId] === false) return [];
  const cut = wallCutSpans.get(wallId);
  if (!cut) return [{ start: -wallHalfSpan, end: wallHalfSpan }];
  const cutStart = Math.max(-wallHalfSpan, cut.cutStart);
  const cutEnd = Math.min(wallHalfSpan, cut.cutEnd);
  if (cutStart <= -wallHalfSpan && cutEnd >= wallHalfSpan) return [];
  const segments = [];
  if (cutStart > -wallHalfSpan) segments.push({ start: -wallHalfSpan, end: cutStart });
  if (cutEnd < wallHalfSpan) segments.push({ start: cutEnd, end: wallHalfSpan });
  return segments;
};

export const VIEW_MODES = { CLIENT: "client", CONSTRUCTION: "construction" };

export const ConfiguratorProvider = ({ children }) => {
  const [step, setStep] = useState(1);
  const [viewMode, setViewMode] = useState(VIEW_MODES.CLIENT);
  const [wallHeightType, setWallHeightType] = useState("standard");
  // Wall inclusion per scoped wallId (A_front, A_left, B_front, etc.)
  const [wallIncluded, setWallIncluded] = useState(() => ({
    A_front: true,
    A_left: true,
    A_right: true,
    A_back: true,
  }));
  const [activeModuleId, setActiveModuleId] = useState("A");
  // Roof config per module: visible, type (apex|pent), pentSlopeDirection
  const [roofByModule, setRoofByModule] = useState(() => ({
    A: { ...DEFAULT_ROOF },
  }));
  const setRoofVisibleFor = (moduleId, value) => {
    setRoofByModule((prev) => ({
      ...prev,
      [moduleId]: { ...(prev[moduleId] ?? DEFAULT_ROOF), visible: value },
    }));
  };
  const setRoofConfigFor = (moduleId, updates) => {
    setRoofByModule((prev) => ({
      ...prev,
      [moduleId]: { ...(prev[moduleId] ?? DEFAULT_ROOF), ...updates },
    }));
  };

  const setWallIncludedFor = (wallId, value) => {
    setWallIncluded((prev) => ({ ...prev, [wallId]: value }));
  };

  const WALL_JOIN_OVERRIDE_MODES = ["auto", "force_on", "force_off"];
  const [wallJoinOverrideByWallId, setWallJoinOverrideByWallId] = useState({});
  const setWallJoinOverride = (wallId, mode) => {
    if (!WALL_JOIN_OVERRIDE_MODES.includes(mode)) return;
    setWallJoinOverrideByWallId((prev) => ({ ...prev, [wallId]: mode }));
  };

  const defaultWidthInches = shedData.floor_widths_inches[8];
  const defaultDepthInches = 6 * 12;
  // shedConfig: framing, wallHeight, roofPeakHeight (primary module). Width/depth come from modules.
  const [shedConfig, setShedConfig] = useState(() => ({
    roofPeakHeight: shedData.apex_roof_dims[8],
    framing: shedData.framing,
    wallHeight: shedData.wall_heights["standard"],
  }));

  // Multi-module shed: start with default module A for immediate build flow
  const [modules, setModules] = useState(() => [
    { id: "A", width: defaultWidthInches, depth: defaultDepthInches, offsetX: 0, offsetZ: 0 },
  ]);

  const primaryModule = modules[0];
  const shedConfigWithDims = useMemo(
    () => ({
      ...shedConfig,
      width: primaryModule?.width ?? defaultWidthInches,
      depth: primaryModule?.depth ?? defaultDepthInches,
    }),
    [shedConfig, primaryModule]
  );
  const wallIdToCanonical = useMemo(() => {
    const modId = activeModuleId ?? primaryModule?.id;
    if (!modId) return (id) => id;
    const map = { front: `${modId}_front`, left: `${modId}_left`, right: `${modId}_right`, back: `${modId}_back` };
    return (wallId) => map[wallId] ?? wallId;
  }, [activeModuleId, primaryModule]);

  // Window/door state uses canonical wall IDs (e.g. A_front) for module support
  const [windowPositionsRaw, setWindowPositionsRaw] = useState(() => ({ A_front: [], A_back: [], A_left: [], A_right: [] }));
  const [windowTypesRaw, setWindowTypesRaw] = useState(() => ({ A_front: [], A_back: [], A_left: [], A_right: [] }));
  const [doorsByWallRaw, setDoorsByWallRaw] = useState(() => ({
    A_front: { type: "none", centerX: 0 },
    A_left: { type: "none", centerX: 0 },
    A_right: { type: "none", centerX: 0 },
    A_back: { type: "none", centerX: 0 },
  }));

  const windowPositions = useMemo(() => {
    const base = { ...windowPositionsRaw };
    const modId = activeModuleId ?? primaryModule?.id;
    if (modId) {
      base.front = windowPositionsRaw[`${modId}_front`] ?? [];
      base.left = windowPositionsRaw[`${modId}_left`] ?? [];
      base.right = windowPositionsRaw[`${modId}_right`] ?? [];
      base.back = windowPositionsRaw[`${modId}_back`] ?? [];
    }
    return base;
  }, [activeModuleId, primaryModule, windowPositionsRaw]);

  const windowTypes = useMemo(() => {
    const base = { ...windowTypesRaw };
    const modId = activeModuleId ?? primaryModule?.id;
    if (modId) {
      base.front = windowTypesRaw[`${modId}_front`] ?? [];
      base.left = windowTypesRaw[`${modId}_left`] ?? [];
      base.right = windowTypesRaw[`${modId}_right`] ?? [];
      base.back = windowTypesRaw[`${modId}_back`] ?? [];
    }
    return base;
  }, [activeModuleId, primaryModule, windowTypesRaw]);

  const doorsByWall = useMemo(() => {
    const base = { ...doorsByWallRaw };
    const modId = activeModuleId ?? primaryModule?.id;
    if (modId) {
      const def = { type: "none", centerX: 0 };
      base.front = doorsByWallRaw[`${modId}_front`] ?? def;
      base.left = doorsByWallRaw[`${modId}_left`] ?? def;
      base.right = doorsByWallRaw[`${modId}_right`] ?? def;
      base.back = doorsByWallRaw[`${modId}_back`] ?? def;
    }
    return base;
  }, [activeModuleId, primaryModule, doorsByWallRaw]);

  const windows = Object.values(windowPositions).some(arr => arr.length > 0);

  const setWindows = (val) => {
    if (!val) {
      setWindowPositionsRaw({ A_front: [], A_back: [], A_left: [], A_right: [] });
      setWindowTypesRaw({ A_front: [], A_back: [], A_left: [], A_right: [] });
    } else {
      setWindowPositionsRaw(prev => ({ ...prev, A_left: [0] }));
      setWindowTypesRaw(prev => ({ ...prev, A_left: ["STANDARD"] }));
    }
  };

  const isFrontOrBack = (id) => id.endsWith("_front") || id.endsWith("_back");

  const setWindowPosition = (wallId, index, x) => {
    const cid = wallIdToCanonical(wallId);
    setWindowPositionsRaw(prev => ({
      ...prev,
      [cid]: (prev[cid] || []).map((v, i) => (i === index ? x : v)),
    }));
  };

  const setWindowType = (wallId, index, type) => {
    const cid = wallIdToCanonical(wallId);
    const wallWidth = getWallWidthForWallId(modules, cid, isFrontOrBack);
    if (!openingFitsWall(wallWidth, getWindowDimensions(type).width, { edgeClearance: true })) return;
    setWindowTypesRaw(prev => ({
      ...prev,
      [cid]: (prev[cid] || []).map((v, i) => (i === index ? type : v)),
    }));
  };

  const addWindow = (wallId) => {
    const cid = wallIdToCanonical(wallId);
    const wallWidth = getWallWidthForWallId(modules, cid, isFrontOrBack);
    if (typeof wallWidth !== "number" || !Number.isFinite(wallWidth) || wallWidth <= 0) return;
    const positions = windowPositionsRaw[cid] || [];
    const types = windowTypesRaw[cid] || [];
    const otherWindows = positions.map((pos, i) => ({
      x: Number.isFinite(Number(pos)) ? Number(pos) : 0,
      width: getWindowDimensions(types[i] || "STANDARD").width,
    }));
    const newWindowWidth = getWindowDimensions("STANDARD").width;
    if (!canFitOneMoreWindow(wallWidth, newWindowWidth, otherWindows)) return;

    const doorOnWall = doorsByWallRaw[cid];
    const hasDoorOnWall = doorOnWall && doorOnWall.type !== "none";
    const wallHeight = typeof shedConfig.wallHeight === "number" && Number.isFinite(shedConfig.wallHeight) ? shedConfig.wallHeight : 66;
    const doorWidth = hasDoorOnWall
      ? getDoorDimensions({ doorType: doorOnWall.type, wallHeightType: wallHeightType || "standard", wallHeight }).width
      : 0;
    const doorCenterX = hasDoorOnWall && Number.isFinite(Number(doorOnWall.centerX)) ? Number(doorOnWall.centerX) : null;
    let defaultX = getDefaultWindowPosition(wallWidth, newWindowWidth, otherWindows, doorCenterX, doorWidth);
    if (!Number.isFinite(defaultX)) defaultX = 0;

    setWindowPositionsRaw(prev => ({ ...prev, [cid]: [...(prev[cid] || []), defaultX] }));
    setWindowTypesRaw(prev => ({ ...prev, [cid]: [...(prev[cid] || []), "STANDARD"] }));
  };

  const addWindowAt = (wallId, targetX, windowType = "STANDARD") => {
    const cid = wallIdToCanonical(wallId);
    const wallWidth = getWallWidthForWallId(modules, cid, isFrontOrBack);
    if (typeof wallWidth !== "number" || !Number.isFinite(wallWidth) || wallWidth <= 0) return;
    const positions = windowPositionsRaw[cid] || [];
    const types = windowTypesRaw[cid] || [];
    const otherWindows = positions.map((pos, i) => ({
      x: Number.isFinite(Number(pos)) ? Number(pos) : 0,
      width: getWindowDimensions(types[i] || "STANDARD").width,
    }));
    const dims = getWindowDimensions(windowType);
    const windowWidth = dims.width;
    if (!canFitOneMoreWindow(wallWidth, windowWidth, otherWindows)) return;

    const doorOnWall = doorsByWallRaw[cid];
    const hasDoorOnWall = doorOnWall && doorOnWall.type !== "none";
    const wallHeight = typeof shedConfig.wallHeight === "number" && Number.isFinite(shedConfig.wallHeight) ? shedConfig.wallHeight : 66;
    const doorWidth = hasDoorOnWall
      ? getDoorDimensions({ doorType: doorOnWall.type, wallHeightType: wallHeightType || "standard", wallHeight }).width
      : 0;
    const doorCenter = hasDoorOnWall && Number.isFinite(Number(doorOnWall.centerX)) ? Number(doorOnWall.centerX) : null;

    const result = clampAndSnap(
      targetX,
      wallWidth,
      doorCenter,
      doorWidth,
      windowWidth,
      otherWindows
    );

    const snappedX = result?.x ?? 0;
    setWindowPositionsRaw(prev => ({ ...prev, [cid]: [...(prev[cid] || []), snappedX] }));
    setWindowTypesRaw(prev => ({ ...prev, [cid]: [...(prev[cid] || []), windowType] }));
  };

  const canAddWindow = useMemo(() => {
    return (wallId) => {
      const cid = wallIdToCanonical(wallId);
      const wallWidth = getWallWidthForWallId(modules, cid, isFrontOrBack);
      if (typeof wallWidth !== "number" || !Number.isFinite(wallWidth) || wallWidth <= 0) return false;
      const positions = windowPositionsRaw[cid] || [];
      const types = windowTypesRaw[cid] || [];
      const otherWindows = positions.map((pos, i) => ({
        x: Number.isFinite(Number(pos)) ? Number(pos) : 0,
        width: getWindowDimensions(types[i] || "STANDARD").width,
      }));
      return canFitOneMoreWindow(wallWidth, getWindowDimensions("STANDARD").width, otherWindows);
    };
  }, [modules, windowPositionsRaw, windowTypesRaw, wallIdToCanonical]);

  const doorFitsWall = useMemo(() => {
    return (wallId, doorTypeKey) => {
      if (doorTypeKey === "none") return true;
      const cid = wallIdToCanonical(wallId);
      const wallWidth = getWallWidthForWallId(modules, cid, isFrontOrBack);
      const wallHeight = typeof shedConfig.wallHeight === "number" && Number.isFinite(shedConfig.wallHeight) ? shedConfig.wallHeight : 66;
      const w = getDoorDimensions({ doorType: doorTypeKey, wallHeightType: wallHeightType || "standard", wallHeight }).width;
      return openingFitsWall(wallWidth, w, { edgeClearance: false });
    };
  }, [modules, shedConfig.wallHeight, wallHeightType, wallIdToCanonical]);

  const windowTypeFitsWall = useMemo(() => {
    return (wallId, windowTypeKey) => {
      const cid = wallIdToCanonical(wallId);
      const wallWidth = getWallWidthForWallId(modules, cid, isFrontOrBack);
      const wallHeight = typeof shedConfig.wallHeight === "number" && Number.isFinite(shedConfig.wallHeight) ? shedConfig.wallHeight : 66;
      const dims = getWindowDimensions(windowTypeKey);
      const fitsWidth = openingFitsWall(wallWidth, dims.width, { edgeClearance: true });
      const minWallHeightForWindow = dims.height + 14;
      const fitsHeight = wallHeight >= minWallHeightForWindow;
      return fitsWidth && fitsHeight;
    };
  }, [modules, wallIdToCanonical, shedConfig.wallHeight]);

  const removeWindow = (wallId, index) => {
    const cid = wallIdToCanonical(wallId);
    setWindowPositionsRaw(prev => ({ ...prev, [cid]: (prev[cid] || []).filter((_, i) => i !== index) }));
    setWindowTypesRaw(prev => ({ ...prev, [cid]: (prev[cid] || []).filter((_, i) => i !== index) }));
  };

  const updateModuleDimensions = (moduleId, updates) => {
    setModules((prev) => {
      const next = prev.map((m) => (m.id === moduleId ? { ...m, ...updates } : m));
      return reflowAttachedModules(next);
    });
    if (primaryModule?.id === moduleId && (updates.width != null || updates.depth != null)) {
      const mod = modules.find((m) => m.id === moduleId);
      const w = updates.width ?? mod?.width ?? defaultWidthInches;
      const nominalW = Object.keys(shedData.floor_widths_inches).find((k) => shedData.floor_widths_inches[k] === w);
      if (nominalW) {
        const primaryRoof = roofByModule[moduleId] ?? DEFAULT_ROOF;
        const roofPeak = primaryRoof.type === "apex"
          ? shedData.apex_roof_dims[nominalW]
          : shedData.pent_roof_dims[nominalW]?.front;
        setShedConfig((prev) => ({ ...prev, roofPeakHeight: roofPeak ?? prev.roofPeakHeight }));
      }
    }
  };

  const getNominalWidthFromInches = (inches) => {
    const entry = Object.entries(shedData.floor_widths_inches).find(([, v]) => v === inches);
    return entry ? Number(entry[0]) : 8;
  };

  const size = useMemo(() => {
    const mod = modules.find((m) => m.id === activeModuleId);
    if (!mod) return { width: 8, depth: 6 };
    return {
      width: getNominalWidthFromInches(mod.width),
      depth: Math.round(mod.depth / 12) || 6,
    };
  }, [modules, activeModuleId]);

  const setSize = (newSize) => {
    const widthInches = shedData.floor_widths_inches[newSize.width] ?? defaultWidthInches;
    const depthInches = (newSize.depth || 6) * 12;
    updateModuleDimensions(activeModuleId, { width: widthInches, depth: depthInches });
  };

  const createFirstModule = () => { /* No-op: module A exists from start */ };

  // Custom setter for wallHeightType that also updates shedConfig
  const updateWallHeightType = (newWallHeightType) => {
    setWallHeightType(newWallHeightType);
    setShedConfig(prevConfig => ({
      ...prevConfig,
      wallHeight: shedData.wall_heights[newWallHeightType] || prevConfig.wallHeight
    }));
  };

  const doorTypeOrder = ["double", "stable", "single"];
  /** Window type fallback order: largest to smallest. On resize, invalid types downgrade to the largest that fits. */
  const windowTypeFallbackOrder = ["DOUBLE", "DOUBLE_VERTICAL", "STANDARD", "SECURITY"];
  useEffect(() => {
    const wallHeight = typeof shedConfig.wallHeight === "number" && Number.isFinite(shedConfig.wallHeight) ? shedConfig.wallHeight : 66;
    const wallIds = modules.flatMap((m) => [`${m.id}_front`, `${m.id}_back`, `${m.id}_left`, `${m.id}_right`]);
    let needsDoorCorrection = false;
    const nextDoors = { ...doorsByWallRaw };
    for (const cid of wallIds) {
      const wallWidth = getWallWidthForWallId(modules, cid, isFrontOrBack);
      const door = doorsByWallRaw[cid];
      if (door && door.type !== "none") {
        const doorType = door.type === "double_with_windows" ? "double" : door.type;
        if (door.type === "double_with_windows") {
          nextDoors[cid] = { ...door, type: "double" };
          needsDoorCorrection = true;
        }
        const w = getDoorDimensions({ doorType, wallHeightType: wallHeightType || "standard", wallHeight }).width;
        if (!openingFitsWall(wallWidth, w, { edgeClearance: false })) {
          const firstFitting = doorTypeOrder.find((key) => {
            const dw = getDoorDimensions({ doorType: key, wallHeightType: wallHeightType || "standard", wallHeight }).width;
            return openingFitsWall(wallWidth, dw, { edgeClearance: false });
          });
          nextDoors[cid] = { type: firstFitting || "none", centerX: 0 };
          needsDoorCorrection = true;
        }
      }
    }
    if (needsDoorCorrection) {
      setDoorsByWallRaw(nextDoors);
    }

    let needsTypeCorrection = false;
    const nextTypes = {};
    for (const cid of wallIds) {
      const wallWidth = getWallWidthForWallId(modules, cid, isFrontOrBack);
      const types = windowTypesRaw[cid] || [];
      nextTypes[cid] = types.map((t) => {
        const dims = getWindowDimensions(t);
        const fitsWidth = openingFitsWall(wallWidth, dims.width, { edgeClearance: true });
        const fitsHeight = dims.height + 14 <= wallHeight;
        if (fitsWidth && fitsHeight) return t;
        needsTypeCorrection = true;
        const fallback = windowTypeFallbackOrder.find((type) => {
          const d = getWindowDimensions(type);
          return openingFitsWall(wallWidth, d.width, { edgeClearance: true }) && d.height + 14 <= wallHeight;
        });
        return fallback || "STANDARD";
      });
    }

    const nextPositions = {};
    let needsPositionCorrection = false;
    for (const cid of wallIds) {
      const wallWidth = getWallWidthForWallId(modules, cid, isFrontOrBack);
      const positions = windowPositionsRaw[cid] || [];
      const types = nextTypes[cid] || [];
      const corrected = [];
      for (let i = 0; i < positions.length; i++) {
        const type = types[i] || "STANDARD";
        const width = getWindowDimensions(type).width;
        const otherWindows = corrected.map((x, j) => ({ x, width: getWindowDimensions(types[j] || "STANDARD").width }))
          .concat(positions.slice(i + 1).map((x, j) => ({ x: Number.isFinite(Number(x)) ? Number(x) : 0, width: getWindowDimensions(types[i + 1 + j] || "STANDARD").width })));
        const currentX = Number.isFinite(Number(positions[i])) ? Number(positions[i]) : 0;
        const validX = clampWindowPositionToValid(wallWidth, width, currentX, otherWindows);
        corrected.push(validX);
        if (!needsPositionCorrection && Math.abs(validX - currentX) > 0.001) needsPositionCorrection = true;
      }
      nextPositions[cid] = corrected;

      // If too many windows: remove from end until no overlaps (predictable rule).
      const typeList = nextTypes[cid] || [];
      let n = corrected.length;
      while (n >= 2) {
        let overlaps = false;
        const lastX = corrected[n - 1];
        const lastW = getWindowDimensions(typeList[n - 1] || "STANDARD").width;
        for (let i = 0; i < n - 1; i++) {
          const gap = minGapBetween(getWindowDimensions(typeList[i] || "STANDARD").width, lastW);
          if (Math.abs(corrected[i] - lastX) < gap - 0.001) {
            overlaps = true;
            break;
          }
        }
        if (!overlaps) break;
        n--;
        needsPositionCorrection = true;
      }
      if (n < corrected.length) {
        nextPositions[cid] = corrected.slice(0, n);
        nextTypes[cid] = typeList.slice(0, n);
      }
    }

    if (needsTypeCorrection) {
      setWindowTypesRaw(prev => ({ ...prev, ...nextTypes }));
    }
    if (needsPositionCorrection) {
      setWindowPositionsRaw(prev => ({ ...prev, ...nextPositions }));
    }
  }, [modules, shedConfig.wallHeight, doorsByWallRaw, wallHeightType]);

  const placeDoorAt = (wallId, x, type) => {
    const cid = wallIdToCanonical(wallId);
    setDoorsByWallRaw((prev) => ({
      ...prev,
      [cid]: { type, centerX: Number.isFinite(Number(x)) ? Number(x) : 0 },
    }));
  };

  const setDoorPosition = (wallId, x) => {
    const cid = wallIdToCanonical(wallId);
    setDoorsByWallRaw((prev) => {
      const door = prev[cid];
      if (!door || door.type === "none") return prev;
      return { ...prev, [cid]: { ...door, centerX: Number.isFinite(Number(x)) ? Number(x) : door.centerX } };
    });
  };

  const removeDoor = (wallId) => {
    const cid = wallIdToCanonical(wallId);
    setDoorsByWallRaw((prev) => ({
      ...prev,
      [cid]: { type: "none", centerX: 0 },
    }));
  };

  const addModule = (targetModuleId, side, attachOffsetRaw) => {
    const target = modules.find((m) => m.id === targetModuleId);
    if (!target) return;
    const w = target.width;
    const d = target.depth;
    const childStub = { width: w, depth: d, offsetX: 0, offsetZ: 0 };
    const attachOffset = snapAttachOffset(target, childStub, side, attachOffsetRaw ?? 0);
    const { offsetX, offsetZ } = computeAttachedOffset(target, childStub, side, attachOffset);
    const nextId = String.fromCharCode(65 + modules.length);
    const newModule = {
      id: nextId,
      width: w,
      depth: d,
      offsetX,
      offsetZ,
      attachedTo: targetModuleId,
      attachSide: side,
      attachOffset,
    };
    setModules((prev) => [...prev, newModule]);
    setWindowPositionsRaw((prev) => ({
      ...prev,
      [`${nextId}_front`]: [],
      [`${nextId}_back`]: [],
      [`${nextId}_left`]: [],
      [`${nextId}_right`]: [],
    }));
    setWindowTypesRaw((prev) => ({
      ...prev,
      [`${nextId}_front`]: [],
      [`${nextId}_back`]: [],
      [`${nextId}_left`]: [],
      [`${nextId}_right`]: [],
    }));
    setDoorsByWallRaw((prev) => ({
      ...prev,
      [`${nextId}_front`]: { type: "none", centerX: 0 },
      [`${nextId}_back`]: { type: "none", centerX: 0 },
      [`${nextId}_left`]: { type: "none", centerX: 0 },
      [`${nextId}_right`]: { type: "none", centerX: 0 },
    }));
    setWallIncluded((prev) => ({
      ...prev,
      [`${nextId}_front`]: true,
      [`${nextId}_left`]: true,
      [`${nextId}_right`]: true,
      [`${nextId}_back`]: true,
    }));
    setRoofByModule((prev) => {
      const source = prev["A"] ?? DEFAULT_ROOF;
      return { ...prev, [nextId]: { ...DEFAULT_ROOF, ...source } };
    });
  };

  const removeModule = (moduleId) => {
    if (moduleId === "A") return;
    if (modules.length <= 1) return;
    const next = modules.filter((m) => m.id !== moduleId);
    if (next.length === 0) return;
    setModules(next);
    if (activeModuleId === moduleId) {
      setActiveModuleId(next[0].id);
    }
    const walls = ["front", "left", "right", "back"];
    const toRemove = walls.map((s) => `${moduleId}_${s}`);
    setWallIncluded((prev) => {
      const next = { ...prev };
      toRemove.forEach((k) => delete next[k]);
      return next;
    });
    setRoofByModule((prev) => {
      const next = { ...prev };
      delete next[moduleId];
      return next;
    });
    setWindowPositionsRaw((prev) => {
      const next = { ...prev };
      toRemove.forEach((k) => delete next[k]);
      return next;
    });
    setWindowTypesRaw((prev) => {
      const next = { ...prev };
      toRemove.forEach((k) => delete next[k]);
      return next;
    });
    setDoorsByWallRaw((prev) => {
      const next = { ...prev };
      toRemove.forEach((k) => delete next[k]);
      return next;
    });
    setWallJoinOverrideByWallId((prev) => {
      const next = { ...prev };
      toRemove.forEach((k) => delete next[k]);
      return next;
    });
  };

  const setRoofStyle = (moduleId, value) => {
    setRoofConfigFor(moduleId, { type: value });
    if (primaryModule?.id === moduleId) {
      const mod = modules.find((m) => m.id === moduleId);
      const nominalW = mod ? getNominalWidthFromInches(mod.width) : 8;
      setShedConfig((prev) => ({
        ...prev,
        roofPeakHeight: (value === "apex" ? shedData.apex_roof_dims[nominalW] : shedData.pent_roof_dims[nominalW]?.front) || prev.roofPeakHeight,
      }));
    }
  };
  const setPentSlopeDirection = (moduleId, value) => {
    setRoofConfigFor(moduleId, { pentSlopeDirection: value });
  };

  const structureBounds = useMemo(() => {
    if (!modules?.length) {
      const w = defaultWidthInches;
      const d = defaultDepthInches;
      return {
        minX: -w / 2, maxX: w / 2, minZ: -d / 2, maxZ: d / 2,
        centerX: 0, centerZ: 0, spanX: w, spanZ: d,
      };
    }
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    for (const m of modules) {
      const w = m.width ?? defaultWidthInches;
      const d = m.depth ?? defaultDepthInches;
      const ox = m.offsetX ?? 0;
      const oz = m.offsetZ ?? 0;
      minX = Math.min(minX, ox - w / 2);
      maxX = Math.max(maxX, ox + w / 2);
      minZ = Math.min(minZ, oz - d / 2);
      maxZ = Math.max(maxZ, oz + d / 2);
    }
    if (minX === Infinity) minX = maxX = minZ = maxZ = 0;
    return {
      minX, maxX, minZ, maxZ,
      centerX: (minX + maxX) / 2,
      centerZ: (minZ + maxZ) / 2,
      spanX: Math.max(0, maxX - minX),
      spanZ: Math.max(0, maxZ - minZ),
    };
  }, [modules]);

  const wallCutSpans = useMemo(() => getWallCutSpans(modules), [modules]);
  const getVisibleWallSegments = useMemo(
    () => (wallId, wallHalfSpan) => {
      const override = wallJoinOverrideByWallId[wallId] ?? "auto";
      if (override === "force_off") return [];
      if (override === "force_on") return [{ start: -wallHalfSpan, end: wallHalfSpan }];
      return computeVisibleWallSegments(wallId, wallHalfSpan, wallIncluded, wallCutSpans);
    },
    [wallIncluded, wallCutSpans, wallJoinOverrideByWallId]
  );

  // Build model for export/schedules: pure derivation from state, no mesh dependency
  const buildModel = useCallback(
    () =>
      getBuildModel({
        modules,
        roofByModule,
        wallIncluded,
        wallJoinOverrideByWallId,
        windowPositionsRaw,
        windowTypesRaw,
        doorsByWallRaw,
        shedConfig: shedConfigWithDims,
        wallHeightType,
      }),
    [
      modules,
      roofByModule,
      wallIncluded,
      wallJoinOverrideByWallId,
      windowPositionsRaw,
      windowTypesRaw,
      doorsByWallRaw,
      shedConfigWithDims,
      wallHeightType,
    ]
  );

  const buildSchedules = useCallback(() => getBuildSchedules(buildModel()), [buildModel]);

  return (
    <ConfiguratorContext.Provider
      value={{
        step,
        setStep,
        viewMode,
        setViewMode,
        size,
        setSize,
        wallHeightType,
        setWallHeightType: updateWallHeightType,
        windows,
        setWindows,
        windowPositions,
        windowTypes,
        setWindowPosition,
        setWindowType,
        addWindow,
        addWindowAt,
        removeWindow,
        canAddWindow,
        doorFitsWall,
        windowTypeFitsWall,
        doorsByWall,
        placeDoorAt,
        setDoorPosition,
        removeDoor,
        wallIncluded,
        setWallIncludedFor,
        wallJoinOverrideByWallId,
        setWallJoinOverride,
        getVisibleWallSegments,
        activeModuleId,
        setActiveModuleId,
        roofByModule,
        setRoofVisibleFor,
        setRoofConfigFor,
        setRoofStyle,
        setPentSlopeDirection,
        shedConfig: shedConfigWithDims,
        structureBounds,
        modules,
        setModules,
        addModule,
        removeModule,
        createFirstModule,
        updateModuleDimensions,
        snapAttachOffset,
        buildModel,
        buildSchedules,
      }}
    >
      {children}
    </ConfiguratorContext.Provider>
  );
};

export const useConfigurator = () => {
  const config = useContext(ConfiguratorContext);
  const moduleId = useContext(ModuleRoofContext);
  const effectiveModuleId = moduleId ?? config.activeModuleId ?? "A";
  const roofConfig = config.roofByModule[effectiveModuleId] ?? DEFAULT_ROOF;
  return {
    ...config,
    roofStyle: roofConfig.type,
    pentSlopeDirection: roofConfig.pentSlopeDirection,
    setRoofStyle: (v) => config.setRoofStyle(effectiveModuleId, v),
    setPentSlopeDirection: (v) => config.setPentSlopeDirection(effectiveModuleId, v),
  };
};
