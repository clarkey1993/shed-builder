import { createContext, useContext, useState, useMemo, useEffect } from "react";
import shedData from "../shedData.json";
import { getWindowDimensions, getDoorDimensions } from "../systems/openings/getOpeningDimensions";
import { canFitOneMoreWindow, getDefaultWindowPosition, openingFitsWall, clampWindowPositionToValid, minGapBetween, clampAndSnap } from "../systems/openings/windowPlacement";

const ConfiguratorContext = createContext();

export const ConfiguratorProvider = ({ children }) => {
  const [step, setStep] = useState(1);
  const [size, setSize] = useState({ width: 8, depth: 6 }); // Nominal feet
  const [roofStyle, setRoofStyle] = useState("apex");
  /** Pent roof only: which way the slope runs. Default front_to_back (high at front, low at back). */
  const [pentSlopeDirection, setPentSlopeDirection] = useState("front_to_back");
  const [wallHeightType, setWallHeightType] = useState("standard");
  // Window positions per wall: { front, back, left, right } each [x, x, ...] in inches from center
  const [windowPositions, setWindowPositions] = useState({ front: [], back: [], left: [], right: [] });
  // Window type per wall/index: STANDARD (default) | SECURITY | DOUBLE.
  const [windowTypes, setWindowTypes] = useState({ front: [], back: [], left: [], right: [] });
  const [doorType, setDoorType] = useState("none");
  // Current door wall and horizontal center (inches from wall center); 0 = centered
  const [doorWallId, setDoorWallId] = useState("front");
  const [frontDoorCenterX, setFrontDoorCenterX] = useState(0);

  // Explicit inclusion flags for walls and roof (decoupled from builderStep)
  const [includeFrontWall, setIncludeFrontWall] = useState(false);
  const [includeLeftWall, setIncludeLeftWall] = useState(false);
  const [includeRightWall, setIncludeRightWall] = useState(false);
  const [includeBackWall, setIncludeBackWall] = useState(false);
  const [includeRoof, setIncludeRoof] = useState(false);

  // Initialize shedConfig with precise dimensions and framing
  const [shedConfig, setShedConfig] = useState(() => ({
    width: shedData.floor_widths_inches[8],
    depth: 6 * 12, // Default 6ft shed depth in inches
    roofPeakHeight: shedData.apex_roof_dims[8],
    framing: shedData.framing,
    wallHeight: shedData.wall_heights["standard"],
  }));

  const windows = Object.values(windowPositions).some(arr => arr.length > 0);

  const setWindows = (val) => {
    if (!val) {
      setWindowPositions({ front: [], back: [], left: [], right: [] });
      setWindowTypes({ front: [], back: [], left: [], right: [] });
    } else {
      setWindowPositions(prev => ({ ...prev, left: [0] }));
      setWindowTypes(prev => ({ ...prev, left: ["STANDARD"] }));
    }
  };

  const setWindowPosition = (wallId, index, x) => {
    setWindowPositions(prev => ({
      ...prev,
      [wallId]: prev[wallId].map((v, i) => (i === index ? x : v)),
    }));
  };

  const setWindowType = (wallId, index, type) => {
    const wallWidth = (wallId === "front" || wallId === "back") ? shedConfig.width : shedConfig.depth;
    if (!openingFitsWall(wallWidth, getWindowDimensions(type).width, { edgeClearance: true })) return;
    setWindowTypes(prev => ({
      ...prev,
      [wallId]: (prev[wallId] || []).map((v, i) => (i === index ? type : v)),
    }));
  };

  const addWindow = (wallId) => {
    const wallWidth = (wallId === "front" || wallId === "back") ? shedConfig.width : shedConfig.depth;
    if (typeof wallWidth !== "number" || !Number.isFinite(wallWidth) || wallWidth <= 0) return;
    const positions = windowPositions[wallId] || [];
    const types = windowTypes[wallId] || [];
    const otherWindows = positions.map((pos, i) => ({
      x: Number.isFinite(Number(pos)) ? Number(pos) : 0,
      width: getWindowDimensions(types[i] || "STANDARD").width,
    }));
    const newWindowWidth = getWindowDimensions("STANDARD").width;
    if (!canFitOneMoreWindow(wallWidth, newWindowWidth, otherWindows)) return;

    const hasDoorOnFront = wallId === "front" && doorType !== "none";
    const wallHeight = typeof shedConfig.wallHeight === "number" && Number.isFinite(shedConfig.wallHeight) ? shedConfig.wallHeight : 66;
    const doorWidth = hasDoorOnFront
      ? getDoorDimensions({ doorType, wallHeightType: wallHeightType || "standard", wallHeight }).width
      : 0;
    const doorCenterX = hasDoorOnFront && Number.isFinite(Number(frontDoorCenterX)) ? Number(frontDoorCenterX) : null;
    let defaultX = getDefaultWindowPosition(wallWidth, newWindowWidth, otherWindows, doorCenterX, doorWidth);
    if (!Number.isFinite(defaultX)) defaultX = 0;

    setWindowPositions(prev => ({ ...prev, [wallId]: [...(prev[wallId] || []), defaultX] }));
    setWindowTypes(prev => ({ ...prev, [wallId]: [...(prev[wallId] || []), "STANDARD"] }));
  };

  const addWindowAt = (wallId, targetX, windowType = "STANDARD") => {
    const wallWidth = (wallId === "front" || wallId === "back") ? shedConfig.width : shedConfig.depth;
    if (typeof wallWidth !== "number" || !Number.isFinite(wallWidth) || wallWidth <= 0) return;
    const positions = windowPositions[wallId] || [];
    const types = windowTypes[wallId] || [];
    const otherWindows = positions.map((pos, i) => ({
      x: Number.isFinite(Number(pos)) ? Number(pos) : 0,
      width: getWindowDimensions(types[i] || "STANDARD").width,
    }));
    const dims = getWindowDimensions(windowType);
    const windowWidth = dims.width;
    if (!canFitOneMoreWindow(wallWidth, windowWidth, otherWindows)) return;

    const hasDoorOnFront = wallId === "front" && doorType !== "none";
    const wallHeight = typeof shedConfig.wallHeight === "number" && Number.isFinite(shedConfig.wallHeight) ? shedConfig.wallHeight : 66;
    const doorWidth = hasDoorOnFront
      ? getDoorDimensions({ doorType, wallHeightType: wallHeightType || "standard", wallHeight }).width
      : 0;
    const doorCenter = hasDoorOnFront && Number.isFinite(Number(frontDoorCenterX)) ? Number(frontDoorCenterX) : null;

    const result = clampAndSnap(
      targetX,
      wallWidth,
      doorCenter,
      doorWidth,
      windowWidth,
      otherWindows
    );

    const snappedX = result?.x ?? 0;
    setWindowPositions(prev => ({ ...prev, [wallId]: [...(prev[wallId] || []), snappedX] }));
    setWindowTypes(prev => ({ ...prev, [wallId]: [...(prev[wallId] || []), windowType] }));
  };

  const canAddWindow = useMemo(() => {
    return (wallId) => {
      const wallWidth = (wallId === "front" || wallId === "back") ? shedConfig.width : shedConfig.depth;
      if (typeof wallWidth !== "number" || !Number.isFinite(wallWidth) || wallWidth <= 0) return false;
      const positions = windowPositions[wallId] || [];
      const types = windowTypes[wallId] || [];
      const otherWindows = positions.map((pos, i) => ({
        x: Number.isFinite(Number(pos)) ? Number(pos) : 0,
        width: getWindowDimensions(types[i] || "STANDARD").width,
      }));
      return canFitOneMoreWindow(wallWidth, getWindowDimensions("STANDARD").width, otherWindows);
    };
  }, [shedConfig.width, shedConfig.depth, windowPositions, windowTypes]);

  const doorFitsWall = useMemo(() => {
    return (doorTypeKey) => {
      if (doorTypeKey === "none") return true;
      const wallWidth = shedConfig.width;
      const wallHeight = typeof shedConfig.wallHeight === "number" && Number.isFinite(shedConfig.wallHeight) ? shedConfig.wallHeight : 66;
      const w = getDoorDimensions({ doorType: doorTypeKey, wallHeightType: wallHeightType || "standard", wallHeight }).width;
      return openingFitsWall(wallWidth, w, { edgeClearance: false });
    };
  }, [shedConfig.width, shedConfig.wallHeight, wallHeightType]);

  const windowTypeFitsWall = useMemo(() => {
    return (wallId, windowTypeKey) => {
      const wallWidth = (wallId === "front" || wallId === "back") ? shedConfig.width : shedConfig.depth;
      const w = getWindowDimensions(windowTypeKey).width;
      return openingFitsWall(wallWidth, w, { edgeClearance: true });
    };
  }, [shedConfig.width, shedConfig.depth]);

  const removeWindow = (wallId, index) => {
    setWindowPositions(prev => ({ ...prev, [wallId]: prev[wallId].filter((_, i) => i !== index) }));
    setWindowTypes(prev => ({ ...prev, [wallId]: (prev[wallId] || []).filter((_, i) => i !== index) }));
  };

  // Custom setter for size that also updates shedConfig
  const updateSize = (newSize) => {
    setSize(newSize);
    setShedConfig(prevConfig => ({
      ...prevConfig,
      width: shedData.floor_widths_inches[newSize.width] || prevConfig.width,
      depth: newSize.depth * 12, // Assuming depth is always nominal feet * 12
      // Update roof peak height if it depends on width
      roofPeakHeight: (roofStyle === "apex" ? shedData.apex_roof_dims[newSize.width] : shedData.pent_roof_dims[newSize.width]?.front) || prevConfig.roofPeakHeight
    }));
  };

  // Custom setter for roofStyle that also updates shedConfig
  const updateRoofStyle = (newRoofStyle) => {
    setRoofStyle(newRoofStyle);
    setShedConfig(prevConfig => ({
      ...prevConfig,
      roofPeakHeight: (newRoofStyle === "apex" ? shedData.apex_roof_dims[size.width] : shedData.pent_roof_dims[size.width]?.front) || prevConfig.roofPeakHeight
    }));
  };

  // Custom setter for wallHeightType that also updates shedConfig
  const updateWallHeightType = (newWallHeightType) => {
    setWallHeightType(newWallHeightType);
    setShedConfig(prevConfig => ({
      ...prevConfig,
      wallHeight: shedData.wall_heights[newWallHeightType] || prevConfig.wallHeight
    }));
  };

  const doorTypeOrder = ["double_with_windows", "double", "stable", "single"];
  /** Window type fallback order: largest to smallest. On resize, invalid types downgrade to the largest that fits. */
  const windowTypeFallbackOrder = ["DOUBLE", "STANDARD", "SECURITY"];
  useEffect(() => {
    const frontWidth = shedConfig.width;
    const wallHeight = typeof shedConfig.wallHeight === "number" && Number.isFinite(shedConfig.wallHeight) ? shedConfig.wallHeight : 66;

    if (doorType !== "none") {
      const w = getDoorDimensions({ doorType, wallHeightType: wallHeightType || "standard", wallHeight }).width;
      if (!openingFitsWall(frontWidth, w, { edgeClearance: false })) {
        const firstFitting = doorTypeOrder.find((key) => {
          const dw = getDoorDimensions({ doorType: key, wallHeightType: wallHeightType || "standard", wallHeight }).width;
          return openingFitsWall(frontWidth, dw, { edgeClearance: false });
        });
        setDoorType(firstFitting || "none");
      }
    }

    const wallIds = ["front", "back", "left", "right"];
    let needsTypeCorrection = false;
    const nextTypes = {};
    for (const wallId of wallIds) {
      const wallWidth = (wallId === "front" || wallId === "back") ? shedConfig.width : shedConfig.depth;
      const types = windowTypes[wallId] || [];
      nextTypes[wallId] = types.map((t) => {
        const fits = openingFitsWall(wallWidth, getWindowDimensions(t).width, { edgeClearance: true });
        if (fits) return t;
        needsTypeCorrection = true;
        const fallback = windowTypeFallbackOrder.find((type) =>
          openingFitsWall(wallWidth, getWindowDimensions(type).width, { edgeClearance: true })
        );
        return fallback || "STANDARD";
      });
    }

    const nextPositions = {};
    let needsPositionCorrection = false;
    for (const wallId of wallIds) {
      const wallWidth = (wallId === "front" || wallId === "back") ? shedConfig.width : shedConfig.depth;
      const positions = windowPositions[wallId] || [];
      const types = nextTypes[wallId] || [];
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
      nextPositions[wallId] = corrected;

      // If too many windows: remove from end until no overlaps (predictable rule).
      const typeList = nextTypes[wallId] || [];
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
        nextPositions[wallId] = corrected.slice(0, n);
        nextTypes[wallId] = typeList.slice(0, n);
      }
    }

    if (needsTypeCorrection) {
      setWindowTypes(prev => ({ ...prev, ...nextTypes }));
    }
    if (needsPositionCorrection) {
      setWindowPositions(prev => ({ ...prev, ...nextPositions }));
    }
  }, [shedConfig.width, shedConfig.depth, shedConfig.wallHeight]);

  const placeDoorAt = (wallId, x, type) => {
    setDoorWallId(wallId);
    setDoorType(type);
    setFrontDoorCenterX(x);
  };

  return (
    <ConfiguratorContext.Provider
      value={{
        step,
        setStep,
        size,
        setSize: updateSize, // Use custom setter
        roofStyle,
        setRoofStyle: updateRoofStyle, // Use custom setter
        wallHeightType,
        setWallHeightType: updateWallHeightType, // Use custom setter
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
        doorType,
        setDoorType,
        doorWallId,
        setDoorWallId,
        frontDoorCenterX,
        setFrontDoorCenterX,
        placeDoorAt,
        includeFrontWall,
        setIncludeFrontWall,
        includeLeftWall,
        setIncludeLeftWall,
        includeRightWall,
        setIncludeRightWall,
        includeBackWall,
        setIncludeBackWall,
        includeRoof,
        setIncludeRoof,
        shedConfig, // Expose shedConfig
        pentSlopeDirection,
        setPentSlopeDirection,
      }}
    >
      {children}
    </ConfiguratorContext.Provider>
  );
};

export const useConfigurator = () => {
  return useContext(ConfiguratorContext);
};
