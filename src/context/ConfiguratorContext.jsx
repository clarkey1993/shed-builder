import { createContext, useContext, useState } from "react";

const ConfiguratorContext = createContext();

export const ConfiguratorProvider = ({ children }) => {
  const [size, setSize] = useState({ width: 8, depth: 6 });
  const [roofStyle, setRoofStyle] = useState("apex");
  const [windows, setWindows] = useState(false);

  return (
    <ConfiguratorContext.Provider
      value={{
        size,
        setSize,
        roofStyle,
        setRoofStyle,
        windows,
        setWindows,
      }}
    >
      {children}
    </ConfiguratorContext.Provider>
  );
};

export const useConfigurator = () => {
  return useContext(ConfiguratorContext);
};
