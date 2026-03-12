import { createContext, useContext } from "react";
import { useShedTextures } from "../hooks/useShedTextures";

const ShedTextureContext = createContext(null);

export function ShedTextureProvider({ children }) {
  const textures = useShedTextures();
  return (
    <ShedTextureContext.Provider value={textures}>
      {children}
    </ShedTextureContext.Provider>
  );
}

export function useShedTexturesContext() {
  const ctx = useContext(ShedTextureContext);
  if (!ctx) throw new Error("useShedTexturesContext must be used within ShedTextureProvider");
  return ctx;
}
