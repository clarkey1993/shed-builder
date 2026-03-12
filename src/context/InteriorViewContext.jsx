/**
 * InteriorViewContext - View mode and internal partitions.
 * Does NOT modify ConfiguratorContext or dimension math.
 */
import { createContext, useContext, useState, useCallback } from "react";

const InteriorViewContext = createContext();

const STUD_SPACING = 24; // 2ft = 24" (from framing spacing_ft * 12)

export function InteriorViewProvider({ children }) {
  const [viewMode, setViewMode] = useState("exterior");
  const [partitions, setPartitions] = useState([]);

  const addPartition = useCallback((partition) => {
    const id = crypto.randomUUID?.() ?? `p-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setPartitions((prev) => [...prev, { ...partition, id }]);
    return id;
  }, []);

  const updatePartition = useCallback((id, updates) => {
    setPartitions((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  }, []);

  const removePartition = useCallback((id) => {
    setPartitions((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const snapToStud = useCallback((value, extent) => {
    const studIndex = Math.round((value - (-extent / 2)) / STUD_SPACING);
    const clamped = Math.max(0, Math.min(Math.floor(extent / STUD_SPACING), studIndex));
    return -extent / 2 + clamped * STUD_SPACING;
  }, []);

  return (
    <InteriorViewContext.Provider
      value={{
        viewMode,
        setViewMode,
        partitions,
        addPartition,
        updatePartition,
        removePartition,
        snapToStud,
        studSpacing: STUD_SPACING,
      }}
    >
      {children}
    </InteriorViewContext.Provider>
  );
}

export function useInteriorView() {
  const ctx = useContext(InteriorViewContext);
  if (!ctx) throw new Error("useInteriorView must be used within InteriorViewProvider");
  return ctx;
}
