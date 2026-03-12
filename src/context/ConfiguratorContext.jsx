import { createContext, useContext, useState } from "react";
import shedData from "../shedData.json"; // Import shedData

const ConfiguratorContext = createContext();

export const ConfiguratorProvider = ({ children }) => {
  const [step, setStep] = useState(1);
  const [size, setSize] = useState({ width: 8, depth: 6 }); // Nominal feet
  const [roofStyle, setRoofStyle] = useState("apex");
  const [wallHeightType, setWallHeightType] = useState("standard");
  // Window positions per wall: { front, back, left, right } each [x, x, ...] in inches from center
  const [windowPositions, setWindowPositions] = useState({ front: [], back: [], left: [], right: [] });
  // Window type per wall/index: STANDARD (default) | SECURITY. Dimensions unchanged until aligned with shedRules.
  const [windowTypes, setWindowTypes] = useState({ front: [], back: [], left: [], right: [] });
  const [doorType, setDoorType] = useState("none");

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
    setWindowTypes(prev => ({
      ...prev,
      [wallId]: (prev[wallId] || []).map((v, i) => (i === index ? type : v)),
    }));
  };

  const addWindow = (wallId) => {
    setWindowPositions(prev => ({ ...prev, [wallId]: [...(prev[wallId] || []), 0] }));
    setWindowTypes(prev => ({ ...prev, [wallId]: [...(prev[wallId] || []), "STANDARD"] }));
  };
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
        removeWindow,
        doorType,
        setDoorType,
        shedConfig, // Expose shedConfig
      }}
    >
      {children}
    </ConfiguratorContext.Provider>
  );
};

export const useConfigurator = () => {
  return useContext(ConfiguratorContext);
};
