/**
 * Multi-section builder pack preview.
 * Composes plan, elevations, roof, and summary into separate page-like sections.
 * Expects sheet from getBuilderSheet(buildModel).
 */
import FloorPlanPreview from "./FloorPlanPreview";
import ElevationPreview from "./ElevationPreview";
import RoofDrawingPreview from "./RoofDrawingPreview";

function SectionBlock({ title, children, minHeight = "auto" }) {
  return (
    <div
      className="border border-gray-300 bg-white rounded-lg overflow-hidden"
      style={{ minHeight }}
    >
      <div className="px-3 py-2 bg-gray-100 border-b border-gray-200">
        <h5 className="text-[11px] font-semibold text-gray-800 uppercase tracking-wide">
          {title}
        </h5>
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
}

export default function BuilderSheetPreview({ sheet }) {
  if (!sheet) {
    return <p className="text-[11px] text-gray-400 italic py-4">No sheet data.</p>;
  }

  const { metadata, floorPlan, elevations, roofDrawings, scheduleSummary } = sheet;

  return (
    <div className="w-full space-y-6">
      {/* Pack header */}
      <header className="border border-gray-200 rounded-lg bg-gray-50 px-4 py-3">
        <h4 className="text-sm font-semibold text-gray-800">
          {metadata?.projectTitle ?? "Builder Pack"}
        </h4>
        <div className="flex flex-wrap gap-x-5 gap-y-1 mt-1.5 text-[11px] text-gray-600">
          <span>Size: {metadata?.nominalSize ?? "—"}</span>
          <span>Modules: {metadata?.moduleCount ?? 0}</span>
          <span>Roof: {metadata?.roofSummary ?? "—"}</span>
          <span>Date: {metadata?.generatedAt ?? "—"}</span>
        </div>
      </header>

      {/* 1. Base / Plan */}
      <SectionBlock title="Base / Plan" minHeight="12rem">
        <FloorPlanPreview floorPlan={floorPlan} />
      </SectionBlock>

      {/* 2. Walls / Elevations */}
      <SectionBlock title="Walls / Elevations" minHeight="14rem">
        <ElevationPreview elevations={elevations} />
      </SectionBlock>

      {/* 3. Roof */}
      <SectionBlock title="Roof" minHeight="10rem">
        <RoofDrawingPreview drawings={roofDrawings} />
      </SectionBlock>

      {/* 4. Summary */}
      <SectionBlock title="Summary">
        <div className="text-[11px] font-mono text-gray-700 space-y-1.5">
          <p>{scheduleSummary?.summary ?? "No data"}</p>
          {(scheduleSummary?.moduleLines ?? []).length > 0 && (
            <div className="pt-1 space-y-0.5">
              {scheduleSummary.moduleLines.map((line, i) => (
                <div key={i} className="text-[10px] text-gray-600">
                  {line}
                </div>
              ))}
            </div>
          )}
        </div>
      </SectionBlock>
    </div>
  );
}
