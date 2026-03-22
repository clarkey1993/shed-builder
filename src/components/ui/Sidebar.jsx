import { useState, useRef, useEffect } from "react";
import { useConfigurator, VIEW_MODES } from "../../context/ConfiguratorContext";
import { useBuilder, BUILDER_STEPS } from "../../context/BuilderContext";
import { LayoutGrid, PanelRight, SquareStack, PanelLeft, Layers, Home, Menu, ChevronLeft, ChevronRight } from "lucide-react";
import SizePresets from "./SizePresets";
import RoofSelector from "./RoofSelector";
import ImageUpload from "./ImageUpload";
import WallHeightSelector from "./WallHeightSelector";
import Summary from "./Summary";
import InteriorTools from "./InteriorTools";
import BuildDataInspectionPanel from "./BuildDataInspectionPanel";

const STEP_CONFIG = [
  { id: "BASE", label: "Base", Icon: LayoutGrid, short: "Base" },
  { id: "FRONT_WALL", label: "Front", Icon: PanelRight, short: "Front" },
  { id: "LEFT_SIDE", label: "Left Side", Icon: SquareStack, short: "Left Side" },
  { id: "RIGHT_SIDE", label: "Right Side", Icon: SquareStack, short: "Right Side" },
  { id: "BACK_WALL", label: "Back", Icon: PanelLeft, short: "Back" },
  { id: "ROOF", label: "Roof", Icon: Layers, short: "Roof" },
  { id: "INTERIOR", label: "Interior", Icon: Home, short: "Interior" },
];

const WALL_LABELS = { front: "Front", back: "Back", left: "Left", right: "Right" };

const DOOR_TYPE_OPTIONS = [
  { label: "Single Door", type: "single" },
  { label: "Stable Door", type: "stable" },
  { label: "Double Door", type: "double" },
];

function DoorPlacementSection({ heading, placementDrag, startPlacementDrag }) {
  return (
    <section className="option-group">
      <h3 className="section-heading">{heading}</h3>
      <p className="text-xs text-gray-500 mb-3">
        Choose a door type, then drag onto any wall in the 3D view to place it.
      </p>
      <div className="flex flex-wrap gap-2 mb-1">
        {DOOR_TYPE_OPTIONS.map(({ label, type }) => {
          const isActive =
            placementDrag?.item?.kind === "door" && placementDrag.item.doorType === type;
          return (
            <button
              key={type}
              type="button"
              className={`px-2 py-1 text-xs rounded ${
                isActive ? "bg-[#2A7F7F] text-white" : "btn-option btn-option-inactive"
              }`}
              onPointerDown={startPlacementDrag({ kind: "door", doorType: type })}
            >
              {label}
            </button>
          );
        })}
      </div>
      {placementDrag?.item?.kind === "door" && (
        <p className="mt-1 text-[11px] text-gray-500">
          Door placement active. Drag onto a wall in the 3D view to place the door.
        </p>
      )}
    </section>
  );
}

const WINDOW_TYPE_OPTIONS = [
  { label: "Standard", type: "STANDARD" },
  { label: "Security", type: "SECURITY" },
  { label: "Double", type: "DOUBLE" },
  { label: "Double Vertical", type: "DOUBLE_VERTICAL" },
];

const WINDOW_DRAG_OPTIONS = [
  { label: "Standard Window", type: "STANDARD" },
  { label: "Double Window", type: "DOUBLE" },
  { label: "Double Window Vertical", type: "DOUBLE_VERTICAL" },
];

function WindowPanel({ wallIds }) {
  const { windowPositions, windowTypes, setWindowType, removeWindow, windowTypeFitsWall } = useConfigurator();
  return (
    <div className="space-y-2">
      {wallIds.map((wallId) => (
        <div key={wallId} className="space-y-1.5">
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-xs text-gray-500 w-14">{WALL_LABELS[wallId]}:</span>
            {(windowPositions[wallId] || []).map((x, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white text-gray-700 text-xs border border-gray-200"
              >
                {x}"
                <button
                  type="button"
                  onClick={() => removeWindow(wallId, i)}
                  className="text-red-500 hover:text-red-700"
                  aria-label="Remove"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          {(windowPositions[wallId] || []).length > 0 && (
            <div className="pl-14 space-y-1.5">
              {(windowPositions[wallId] || []).map((x, i) => {
                const currentType = (windowTypes[wallId] || [])[i] || "STANDARD";
                return (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-400 w-6">#{i + 1}</span>
                    <span className="flex gap-1">
                      {WINDOW_TYPE_OPTIONS.map(({ label, type }) => {
                        const fits = windowTypeFitsWall(wallId, type);
                        return (
                          <button
                            key={type}
                            type="button"
                            onClick={() => fits && setWindowType(wallId, i, type)}
                            disabled={!fits}
                            className={`px-2 py-1 rounded text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                              currentType === type
                                ? "bg-[#2A7F7F] text-white"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                            title={!fits ? "Window type does not fit this wall" : undefined}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function Sidebar({ onImageUpload, onGetQuote }) {
  const {
    wallIncluded,
    setWallIncludedFor,
    wallJoinOverrideByWallId,
    setWallJoinOverride,
    activeModuleId,
    setActiveModuleId,
    roofByModule,
    setRoofVisibleFor,
    addWindowAt,
    placeDoorAt,
    addModule,
    removeModule,
    createFirstModule,
    modules,
    viewMode,
    setViewMode,
  } = useConfigurator();
  const { builderStep, setBuilderStep, goNext, goPrev, canGoNext, canGoPrev, placementTool, setPlacementTool, placementDrag, setPlacementDrag, setShowFraming } = useBuilder();

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    setShowFraming(mode === VIEW_MODES.CONSTRUCTION);
  };
  const [collapsed, setCollapsed] = useState(false);
  const currentIndex = BUILDER_STEPS.indexOf(builderStep);

  const latestPlacementDragRef = useRef(null);
  useEffect(() => {
    latestPlacementDragRef.current = placementDrag;
  }, [placementDrag]);

  const startPlacementDrag = (item) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    const pointerX = e.clientX;
    const pointerY = e.clientY;
    const initial = { item, pointerX, pointerY, lastHit: null };
    setPlacementTool(item);
    setPlacementDrag(initial);
    latestPlacementDragRef.current = initial;

    const handleMove = (ev) => {
      setPlacementDrag((prev) => {
        if (!prev) return prev;
        const next = { ...prev, pointerX: ev.clientX, pointerY: ev.clientY };
        latestPlacementDragRef.current = next;
        return next;
      });
    };

    const handleUp = () => {
      const latest = latestPlacementDragRef.current;
      if (latest?.lastHit) {
        const { wallId, x } = latest.lastHit;
        if (latest.item.kind === "window") {
          addWindowAt(wallId, x, latest.item.windowType || "STANDARD");
        } else if (latest.item.kind === "door") {
          placeDoorAt(wallId, x, latest.item.doorType || "single");
        } else if (latest.item.kind === "module") {
          const [targetModuleId, attachSide] = (wallId || "").split("_");
          const attachOffset = latest.lastHit?.attachOffset ?? 0;
          if (targetModuleId && attachSide) {
            addModule(targetModuleId, attachSide, attachOffset);
          }
        }
      }
      setPlacementDrag(null);
      setPlacementTool(null);
      latestPlacementDragRef.current = null;
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
  };

  return (
    <>
      {collapsed && (
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          className="fixed left-4 top-20 z-30 p-2.5 rounded-xl bg-white shadow-lg border border-gray-100 hover:bg-gray-50 transition-all"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5 text-gray-600" strokeWidth={1.5} />
        </button>
      )}

      <aside
        className={`
          flex-shrink-0 h-full flex flex-col bg-white
          transition-all duration-300 ease-out
          ${collapsed ? "w-0 overflow-hidden" : "w-80 lg:w-[22rem]"}
        `}
        style={{
          boxShadow: "2px 0 24px rgba(0,0,0,0.04)",
          borderRadius: collapsed ? 0 : "0 12px 12px 0",
        }}
        onWheel={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col h-full overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-[0.9375rem] font-semibold text-gray-900 tracking-tight">Build Your Shed</h2>
            <button
              type="button"
              onClick={() => setCollapsed(true)}
              className="p-1.5 -mr-1 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              aria-label="Collapse sidebar"
            >
              <span className="text-lg leading-none">←</span>
            </button>
          </div>

          {/* View mode: Client / Construction */}
          <section className="px-4 pt-3 pb-2">
            <div className="flex rounded-lg bg-gray-100 p-0.5" role="group" aria-label="View mode">
              <button
                type="button"
                onClick={() => handleViewModeChange(VIEW_MODES.CLIENT)}
                className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  viewMode === VIEW_MODES.CLIENT ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Client
              </button>
              <button
                type="button"
                onClick={() => handleViewModeChange(VIEW_MODES.CONSTRUCTION)}
                className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  viewMode === VIEW_MODES.CONSTRUCTION ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Construction
              </button>
            </div>
          </section>

          {/* Stepper progress */}
          <nav className="px-4 pt-4 pb-3">
            <div className="flex items-center gap-0.5 overflow-x-auto pb-1">
              {STEP_CONFIG.map((s, i) => {
                const isActive = s.id === builderStep;
                const isPast = BUILDER_STEPS.indexOf(s.id) < currentIndex;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setBuilderStep(s.id)}
                    className={`
                      flex flex-col items-center gap-0.5 min-w-[3rem] px-1.5 py-2 rounded-lg transition-colors
                      ${isActive ? "btn-tab-active" : isPast ? "text-gray-600 hover:bg-gray-50" : "btn-tab-inactive"}
                    `}
                    title={s.label}
                  >
                    <s.Icon className="w-4 h-4" strokeWidth={isActive ? 2 : 1.5} />
                    <span className="text-[9px] whitespace-nowrap">{s.short}</span>
                  </button>
                );
              })}
            </div>
          </nav>

          <div
            className="flex-1 overflow-y-auto overflow-x-hidden px-6 pb-6 space-y-6 min-h-0"
            onWheel={(e) => e.stopPropagation()}
          >
            {builderStep === "BASE" && (
              <div className="space-y-6">
                <section className="option-group">
                  <h3 className="section-heading">Wall Height</h3>
                  <WallHeightSelector />
                </section>
                {modules.length > 1 && (
                  <section className="option-group">
                    <h3 className="section-heading">Edit Module</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {modules.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setActiveModuleId(m.id)}
                          className={`px-2 py-1 text-xs rounded ${
                            activeModuleId === m.id ? "bg-[#2A7F7F] text-white" : "btn-option btn-option-inactive"
                          }`}
                        >
                          Module {m.id}
                        </button>
                      ))}
                    </div>
                  </section>
                )}
                {modules.length > 1 && (
                  <section className="option-group">
                    <h3 className="section-heading">Wall Override (Module {activeModuleId})</h3>
                    <p className="text-xs text-gray-500 mb-2">Override auto-suppression for joined walls.</p>
                    <div className="space-y-2">
                      {[
                        { side: "front", label: "Front" },
                        { side: "left", label: "Left" },
                        { side: "right", label: "Right" },
                        { side: "back", label: "Back" },
                      ].map(({ side, label }) => {
                        const wallId = `${activeModuleId}_${side}`;
                        const override = wallJoinOverrideByWallId[wallId] ?? "auto";
                        return (
                          <div key={wallId} className="flex items-center gap-2">
                            <span className="text-xs text-gray-600 w-12">{label}:</span>
                            <span className="flex gap-1">
                              {[
                                { mode: "auto", label: "Auto" },
                                { mode: "force_on", label: "Keep Wall" },
                                { mode: "force_off", label: "Remove Wall" },
                              ].map(({ mode, label: btnLabel }) => (
                                <button
                                  key={mode}
                                  type="button"
                                  onClick={() => setWallJoinOverride(wallId, mode)}
                                  className={`px-2 py-1 rounded text-xs ${
                                    override === mode ? "bg-[#2A7F7F] text-white" : "btn-option btn-option-inactive"
                                  }`}
                                >
                                  {btnLabel}
                                </button>
                              ))}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}
                <section className="option-group">
                  <h3 className="section-heading">Dimensions</h3>
                  <p className="text-xs text-gray-500 mb-3">
                    {modules.length > 1 ? `Width and depth for Module ${activeModuleId}.` : "Choose width and depth for your shed base."}
                  </p>
                  <SizePresets />
                </section>
                {modules.length > 0 && (
                  <section className="option-group">
                    <h3 className="section-heading">Add Module</h3>
                    <p className="text-xs text-gray-500 mb-2">Drag onto any wall in the 3D view to attach a new module.</p>
                    <button
                      type="button"
                      className={`px-2 py-1 text-xs rounded ${
                        placementDrag?.item?.kind === "module" ? "bg-[#2A7F7F] text-white" : "btn-option btn-option-inactive"
                      }`}
                      onPointerDown={startPlacementDrag({ kind: "module" })}
                    >
                      Module
                    </button>
                    {placementDrag?.item?.kind === "module" && (
                      <p className="mt-1 text-[11px] text-gray-500">
                        Drag onto a wall in the 3D view to place the module.
                      </p>
                    )}
                  </section>
                )}
                {modules.length > 1 && activeModuleId !== "A" && (
                  <section className="option-group">
                    <h3 className="section-heading">Remove Module</h3>
                    <p className="text-xs text-gray-500 mb-2">Remove the currently selected module.</p>
                    <button
                      type="button"
                      onClick={() => removeModule(activeModuleId)}
                      className="btn-option btn-option-inactive px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                    >
                      Remove Module {activeModuleId}
                    </button>
                  </section>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (builderStep === "BASE" && modules.length === 0) createFirstModule();
                    goNext();
                  }}
                  className="btn-primary"
                >
                  Continue to Front Wall
                </button>
              </div>
            )}

            {builderStep === "FRONT_WALL" && (
              <div className="space-y-6">
                {modules.length > 1 && (
                  <section className="option-group">
                    <h3 className="section-heading">Edit Module</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {modules.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setActiveModuleId(m.id)}
                          className={`px-2 py-1 text-xs rounded ${
                            activeModuleId === m.id ? "bg-[#2A7F7F] text-white" : "btn-option btn-option-inactive"
                          }`}
                        >
                          Module {m.id}
                        </button>
                      ))}
                    </div>
                  </section>
                )}
                <section className="option-group">
                  <h3 className="section-heading">Front Wall</h3>
                  <label className="flex items-center gap-2 text-xs text-gray-600">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300"
                      checked={wallIncluded[`${activeModuleId}_front`] ?? true}
                      onChange={(e) => setWallIncludedFor(`${activeModuleId}_front`, e.target.checked)}
                    />
                    Include front wall
                  </label>
                </section>
                <DoorPlacementSection
                  heading="Front Wall Doors"
                  placementDrag={placementDrag}
                  startPlacementDrag={startPlacementDrag}
                />
                <section className="option-group">
                  <h3 className="section-heading">Front Wall Windows</h3>
                  <p className="text-xs text-gray-500 mb-3">
                    Drag window types from the palette onto any wall in the 3D view.
                  </p>
                  <div className="mb-2 flex flex-wrap gap-2">
                    {WINDOW_DRAG_OPTIONS.map(({ label, type }) => {
                      const isActive =
                        placementDrag?.item?.kind === "window" &&
                        placementDrag.item.windowType === type;
                      return (
                        <button
                          key={type}
                          type="button"
                          className={`px-2 py-1 text-xs rounded ${
                            isActive ? "bg-[#2A7F7F] text-white" : "btn-option btn-option-inactive"
                          }`}
                          onPointerDown={startPlacementDrag({
                            kind: "window",
                            windowType: type,
                          })}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                  {placementDrag?.item?.kind === "window" && (
                    <p className="mt-1 text-[11px] text-gray-500">
                      Drag the ghost window onto a wall in the 3D view to place it.
                    </p>
                  )}
                  <WindowPanel wallIds={["front"]} />
                </section>
                <div className="flex gap-2">
                  <button type="button" onClick={goPrev} className="btn-secondary flex-1" disabled={!canGoPrev}>
                    <ChevronLeft className="w-4 h-4 inline mr-0.5" /> Back
                  </button>
                  <button type="button" onClick={goNext} className="btn-primary flex-1">
                    Continue to Left Side
                  </button>
                </div>
              </div>
            )}

            {builderStep === "LEFT_SIDE" && (
              <div className="space-y-6">
                {modules.length > 1 && (
                  <section className="option-group">
                    <h3 className="section-heading">Edit Module</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {modules.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setActiveModuleId(m.id)}
                          className={`px-2 py-1 text-xs rounded ${
                            activeModuleId === m.id ? "bg-[#2A7F7F] text-white" : "btn-option btn-option-inactive"
                          }`}
                        >
                          Module {m.id}
                        </button>
                      ))}
                    </div>
                  </section>
                )}
                <section className="option-group">
                  <h3 className="section-heading">Left Side Wall</h3>
                  <label className="flex items-center gap-2 text-xs text-gray-600">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300"
                      checked={wallIncluded[`${activeModuleId}_left`] ?? true}
                      onChange={(e) => setWallIncludedFor(`${activeModuleId}_left`, e.target.checked)}
                    />
                    Include left wall
                  </label>
                </section>
                <DoorPlacementSection
                  heading="Left Side Doors"
                  placementDrag={placementDrag}
                  startPlacementDrag={startPlacementDrag}
                />
                <section className="option-group">
                  <h3 className="section-heading">Left Side Windows</h3>
                  <p className="text-xs text-gray-500 mb-3">
                    Drag window types from the palette onto any wall in the 3D view.
                  </p>
                  <div className="mb-2 flex flex-wrap gap-2">
                    {WINDOW_DRAG_OPTIONS.map(({ label, type }) => {
                      const isActive =
                        placementDrag?.item?.kind === "window" &&
                        placementDrag.item.windowType === type;
                      return (
                        <button
                          key={type}
                          type="button"
                          className={`px-2 py-1 text-xs rounded ${
                            isActive ? "bg-[#2A7F7F] text-white" : "btn-option btn-option-inactive"
                          }`}
                          onPointerDown={startPlacementDrag({
                            kind: "window",
                            windowType: type,
                          })}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                  {placementDrag?.item?.kind === "window" && (
                    <p className="mt-1 text-[11px] text-gray-500">
                      Drag the ghost window onto a wall in the 3D view to place it.
                    </p>
                  )}
                  <WindowPanel wallIds={["left"]} />
                </section>
                <div className="flex gap-2">
                  <button type="button" onClick={goPrev} className="btn-secondary flex-1" disabled={!canGoPrev}>
                    <ChevronLeft className="w-4 h-4 inline mr-0.5" /> Back
                  </button>
                  <button type="button" onClick={goNext} className="btn-primary flex-1">
                    Continue to Right Side
                  </button>
                </div>
              </div>
            )}

            {builderStep === "RIGHT_SIDE" && (
              <div className="space-y-6">
                {modules.length > 1 && (
                  <section className="option-group">
                    <h3 className="section-heading">Edit Module</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {modules.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setActiveModuleId(m.id)}
                          className={`px-2 py-1 text-xs rounded ${
                            activeModuleId === m.id ? "bg-[#2A7F7F] text-white" : "btn-option btn-option-inactive"
                          }`}
                        >
                          Module {m.id}
                        </button>
                      ))}
                    </div>
                  </section>
                )}
                <section className="option-group">
                  <h3 className="section-heading">Right Side Wall</h3>
                  <label className="flex items-center gap-2 text-xs text-gray-600">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300"
                      checked={wallIncluded[`${activeModuleId}_right`] ?? true}
                      onChange={(e) => setWallIncludedFor(`${activeModuleId}_right`, e.target.checked)}
                    />
                    Include right wall
                  </label>
                </section>
                <DoorPlacementSection
                  heading="Right Side Doors"
                  placementDrag={placementDrag}
                  startPlacementDrag={startPlacementDrag}
                />
                <section className="option-group">
                  <h3 className="section-heading">Right Side Windows</h3>
                  <p className="text-xs text-gray-500 mb-3">
                    Drag window types from the palette onto any wall in the 3D view.
                  </p>
                  <div className="mb-2 flex flex-wrap gap-2">
                    {WINDOW_DRAG_OPTIONS.map(({ label, type }) => {
                      const isActive =
                        placementDrag?.item?.kind === "window" &&
                        placementDrag.item.windowType === type;
                      return (
                        <button
                          key={type}
                          type="button"
                          className={`px-2 py-1 text-xs rounded ${
                            isActive ? "bg-[#2A7F7F] text-white" : "btn-option btn-option-inactive"
                          }`}
                          onPointerDown={startPlacementDrag({
                            kind: "window",
                            windowType: type,
                          })}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                  {placementDrag?.item?.kind === "window" && (
                    <p className="mt-1 text-[11px] text-gray-500">
                      Drag the ghost window onto a wall in the 3D view to place it.
                    </p>
                  )}
                  <WindowPanel wallIds={["right"]} />
                </section>
                <div className="flex gap-2">
                  <button type="button" onClick={goPrev} className="btn-secondary flex-1" disabled={!canGoPrev}>
                    <ChevronLeft className="w-4 h-4 inline mr-0.5" /> Back
                  </button>
                  <button type="button" onClick={goNext} className="btn-primary flex-1">
                    Continue to Back Wall
                  </button>
                </div>
              </div>
            )}

            {builderStep === "BACK_WALL" && (
              <div className="space-y-6">
                {modules.length > 1 && (
                  <section className="option-group">
                    <h3 className="section-heading">Edit Module</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {modules.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setActiveModuleId(m.id)}
                          className={`px-2 py-1 text-xs rounded ${
                            activeModuleId === m.id ? "bg-[#2A7F7F] text-white" : "btn-option btn-option-inactive"
                          }`}
                        >
                          Module {m.id}
                        </button>
                      ))}
                    </div>
                  </section>
                )}
                <section className="option-group">
                  <h3 className="section-heading">Back Wall</h3>
                  <label className="flex items-center gap-2 text-xs text-gray-600">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300"
                      checked={wallIncluded[`${activeModuleId}_back`] ?? true}
                      onChange={(e) => setWallIncludedFor(`${activeModuleId}_back`, e.target.checked)}
                    />
                    Include back wall
                  </label>
                </section>
                <DoorPlacementSection
                  heading="Back Wall Doors"
                  placementDrag={placementDrag}
                  startPlacementDrag={startPlacementDrag}
                />
                <section className="option-group">
                  <h3 className="section-heading">Back Wall Windows</h3>
                  <p className="text-xs text-gray-500 mb-3">
                    Drag window types from the palette onto any wall in the 3D view.
                  </p>
                  <div className="mb-2 flex flex-wrap gap-2">
                    {WINDOW_DRAG_OPTIONS.map(({ label, type }) => {
                      const isActive =
                        placementDrag?.item?.kind === "window" &&
                        placementDrag.item.windowType === type;
                      return (
                        <button
                          key={type}
                          type="button"
                          className={`px-2 py-1 text-xs rounded ${
                            isActive ? "bg-[#2A7F7F] text-white" : "btn-option btn-option-inactive"
                          }`}
                          onPointerDown={startPlacementDrag({
                            kind: "window",
                            windowType: type,
                          })}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                  {placementDrag?.item?.kind === "window" && (
                    <p className="mt-1 text-[11px] text-gray-500">
                      Drag the ghost window onto a wall in the 3D view to place it.
                    </p>
                  )}
                  <WindowPanel wallIds={["back"]} />
                </section>
                <div className="flex gap-2">
                  <button type="button" onClick={goPrev} className="btn-secondary flex-1" disabled={!canGoPrev}>
                    <ChevronLeft className="w-4 h-4 inline mr-0.5" /> Back
                  </button>
                  <button type="button" onClick={goNext} className="btn-primary flex-1">
                    Continue to Roof
                  </button>
                </div>
              </div>
            )}

            {builderStep === "ROOF" && (
              <div className="space-y-6">
                {modules.length > 1 && (
                  <section className="option-group">
                    <h3 className="section-heading">Edit Module</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {modules.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setActiveModuleId(m.id)}
                          className={`px-2 py-1 text-xs rounded ${
                            activeModuleId === m.id ? "bg-[#2A7F7F] text-white" : "btn-option btn-option-inactive"
                          }`}
                        >
                          Module {m.id}
                        </button>
                      ))}
                    </div>
                  </section>
                )}
                <section className="option-group">
                  <h3 className="section-heading">Roof Style</h3>
                  <p className="text-xs text-gray-500 mb-3">Select apex or pent roof.</p>
                  <RoofSelector />
                </section>
                <section className="option-group">
                  <h3 className="section-heading">Roof</h3>
                  <label className="flex items-center gap-2 text-xs text-gray-600">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300"
                      checked={roofByModule[activeModuleId]?.visible ?? false}
                      onChange={(e) => setRoofVisibleFor(activeModuleId, e.target.checked)}
                    />
                    Include roof
                  </label>
                </section>
                <div className="flex gap-2">
                  <button type="button" onClick={goPrev} className="btn-secondary flex-1" disabled={!canGoPrev}>
                    <ChevronLeft className="w-4 h-4 inline mr-0.5" /> Back
                  </button>
                  <button type="button" onClick={goNext} className="btn-primary flex-1">
                    Continue to Interior
                  </button>
                </div>
              </div>
            )}

            {builderStep === "INTERIOR" && (
              <div className="space-y-6">
                <InteriorTools />
                <BuildDataInspectionPanel />
                <section className="option-group">
                  <h3 className="section-heading">Summary</h3>
                  <Summary />
                </section>
                <section className="option-group">
                  <ImageUpload onImageUpload={onImageUpload} />
                </section>
                <div className="flex gap-2">
                  <button type="button" onClick={goPrev} className="btn-secondary flex-1" disabled={!canGoPrev}>
                    <ChevronLeft className="w-4 h-4 inline mr-0.5" /> Back
                  </button>
                  <button type="button" onClick={onGetQuote} className="btn-primary flex-1">
                    Get a Quote
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
      {placementDrag && (
        <div
          className="pointer-events-none fixed z-50 px-2 py-1 rounded bg-[#2A7F7F] text-white text-[11px] shadow"
          style={{
            left: placementDrag.pointerX + 12,
            top: placementDrag.pointerY + 12,
          }}
        >
          {placementDrag.item.kind === "window"
            ? placementDrag.item.windowType === "DOUBLE"
              ? "Double Window"
              : placementDrag.item.windowType === "DOUBLE_VERTICAL"
                ? "Double Window Vertical"
                : "Standard Window"
            : placementDrag.item.kind === "module"
              ? "Module"
              :               (() => {
                  const t = placementDrag.item.doorType;
                  if (t === "stable") return "Stable Door";
                  if (t === "double") return "Double Door";
                  return "Single Door";
                })()}
        </div>
      )}
    </>
  );
}
