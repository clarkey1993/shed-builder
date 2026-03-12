import { useState } from "react";
import { useConfigurator } from "../../context/ConfiguratorContext";
import { useBuilder, BUILDER_STEPS } from "../../context/BuilderContext";
import { LayoutGrid, PanelRight, SquareStack, PanelLeft, Layers, Home, Menu, ChevronLeft, ChevronRight } from "lucide-react";
import SizePresets from "./SizePresets";
import RoofSelector from "./RoofSelector";
import ImageUpload from "./ImageUpload";
import WallHeightSelector from "./WallHeightSelector";
import DoorSelector from "./DoorSelector";
import Summary from "./Summary";
import InteriorTools from "./InteriorTools";

const STEP_CONFIG = [
  { id: "BASE", label: "Base", Icon: LayoutGrid, short: "Base" },
  { id: "FRONT_WALL", label: "Front", Icon: PanelRight, short: "Front" },
  { id: "SIDE_WALLS", label: "Sides", Icon: SquareStack, short: "Sides" },
  { id: "BACK_WALL", label: "Back", Icon: PanelLeft, short: "Back" },
  { id: "ROOF", label: "Roof", Icon: Layers, short: "Roof" },
  { id: "INTERIOR", label: "Interior", Icon: Home, short: "Interior" },
];

const WALL_LABELS = { front: "Front", back: "Back", left: "Left", right: "Right" };

function WindowPanel({ wallIds }) {
  const { windowPositions, addWindow, removeWindow } = useConfigurator();
  return (
    <div className="space-y-2">
      {wallIds.map((wallId) => (
        <div key={wallId} className="flex flex-wrap gap-1.5 items-center">
          <span className="text-xs text-gray-500 w-14">{WALL_LABELS[wallId]}:</span>
          {(windowPositions[wallId] || []).map((x, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white text-gray-700 text-xs border border-gray-200"
            >
              {x}"
              <button type="button" onClick={() => removeWindow(wallId, i)} className="text-red-500 hover:text-red-700" aria-label="Remove">×</button>
            </span>
          ))}
          <button type="button" onClick={() => addWindow(wallId)} className="btn-option btn-option-inactive px-2 py-1 text-xs">
            + Add
          </button>
        </div>
      ))}
    </div>
  );
}

export default function Sidebar({ onImageUpload, onGetQuote }) {
  const { builderStep, setBuilderStep, goNext, goPrev, canGoNext, canGoPrev } = useBuilder();
  const [collapsed, setCollapsed] = useState(false);
  const currentIndex = BUILDER_STEPS.indexOf(builderStep);

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

          <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-6">
            {builderStep === "BASE" && (
              <div className="space-y-6">
                <section className="option-group">
                  <h3 className="section-heading">Dimensions</h3>
                  <p className="text-xs text-gray-500 mb-3">Choose width and depth for your shed base.</p>
                  <SizePresets />
                </section>
                <button type="button" onClick={goNext} className="btn-primary">
                  Continue to Front Wall
                </button>
              </div>
            )}

            {builderStep === "FRONT_WALL" && (
              <div className="space-y-6">
                <section className="option-group">
                  <h3 className="section-heading">Door</h3>
                  <p className="text-xs text-gray-500 mb-3">Select door type for the front wall.</p>
                  <DoorSelector />
                </section>
                <section className="option-group">
                  <h3 className="section-heading">Front Wall Windows</h3>
                  <p className="text-xs text-gray-500 mb-3">Add windows and drag to position on the wall.</p>
                  <WindowPanel wallIds={["front"]} />
                </section>
                <div className="flex gap-2">
                  <button type="button" onClick={goPrev} className="btn-secondary flex-1" disabled={!canGoPrev}>
                    <ChevronLeft className="w-4 h-4 inline mr-0.5" /> Back
                  </button>
                  <button type="button" onClick={goNext} className="btn-primary flex-1">
                    Continue to Side Walls
                  </button>
                </div>
              </div>
            )}

            {builderStep === "SIDE_WALLS" && (
              <div className="space-y-6">
                <section className="option-group">
                  <h3 className="section-heading">Wall Height</h3>
                  <WallHeightSelector />
                </section>
                <section className="option-group">
                  <h3 className="section-heading">Side Wall Windows</h3>
                  <p className="text-xs text-gray-500 mb-3">Add windows to left and right walls. Drag to position.</p>
                  <WindowPanel wallIds={["left", "right"]} />
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
                <section className="option-group">
                  <h3 className="section-heading">Back Wall Windows</h3>
                  <p className="text-xs text-gray-500 mb-3">Add optional windows. Drag to position.</p>
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
                <section className="option-group">
                  <h3 className="section-heading">Roof Style</h3>
                  <p className="text-xs text-gray-500 mb-3">Select apex or pent roof.</p>
                  <RoofSelector />
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
    </>
  );
}
