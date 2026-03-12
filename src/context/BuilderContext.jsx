/**
 * BuilderContext - Guided step-by-step workflow layer.
 * Does NOT modify ConfiguratorContext core logic.
 */
import { createContext, useContext, useState, useCallback } from "react";

export const BUILDER_STEPS = [
  "BASE",
  "FRONT_WALL",
  "SIDE_WALLS",
  "BACK_WALL",
  "ROOF",
  "INTERIOR",
];

export const INTERACTION_MODES = { IDLE: "IDLE", SELECT: "SELECT", DRAG: "DRAG" };

const BuilderContext = createContext();

export function BuilderProvider({ children }) {
  const [builderStep, setBuilderStep] = useState("BASE");
  const [interactionMode, setInteractionMode] = useState(INTERACTION_MODES.IDLE);
  const [showDimensions, setShowDimensions] = useState(false);
  const [isDraggingElement, setIsDraggingElement] = useState(false);
  const [selectedElementId, setSelectedElementId] = useState(null);
  const [showFraming, setShowFraming] = useState(false);
  const [debugShowFullShed, setDebugShowFullShed] = useState(false);

  const goToStep = (step) => {
    if (BUILDER_STEPS.includes(step)) setBuilderStep(step);
  };

  const goNext = () => {
    const idx = BUILDER_STEPS.indexOf(builderStep);
    if (idx >= 0 && idx < BUILDER_STEPS.length - 1) {
      setBuilderStep(BUILDER_STEPS[idx + 1]);
    }
  };

  const goPrev = () => {
    const idx = BUILDER_STEPS.indexOf(builderStep);
    if (idx > 0) setBuilderStep(BUILDER_STEPS[idx - 1]);
  };

  const canGoNext = builderStep !== "INTERIOR";
  const canGoPrev = builderStep !== "BASE";

  return (
    <BuilderContext.Provider
      value={{
        builderStep,
        setBuilderStep: goToStep,
        goNext,
        goPrev,
        canGoNext,
        canGoPrev,
        interactionMode,
        setInteractionMode,
        showDimensions,
        setShowDimensions,
        isDraggingElement,
        setIsDraggingElement,
        selectedElementId,
        setSelectedElementId,
        showFraming,
        setShowFraming,
        debugShowFullShed,
        setDebugShowFullShed,
      }}
    >
      {children}
    </BuilderContext.Provider>
  );
}

export function useBuilder() {
  const ctx = useContext(BuilderContext);
  if (!ctx) throw new Error("useBuilder must be used within BuilderProvider");
  return ctx;
}
