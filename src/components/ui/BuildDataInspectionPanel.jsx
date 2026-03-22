import { useState, useMemo } from "react";
import { useConfigurator } from "../../context/ConfiguratorContext";
import { ChevronDown, ChevronRight } from "lucide-react";
import { getElevations, getBuilderSheet, getRoofDrawings } from "../../lib/buildData";
import ElevationPreview from "./ElevationPreview";
import BuilderSheetPreview from "./BuilderSheetPreview";
import RoofDrawingPreview from "./RoofDrawingPreview";

function ScheduleSection({ title, rows, columns, emptyLabel = "No data" }) {
  const [open, setOpen] = useState(false);
  const hasRows = rows && rows.length > 0;

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100"
      >
        {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        {title} ({hasRows ? rows.length : 0})
      </button>
      {open && (
        <div className="p-2 bg-white max-h-48 overflow-y-auto">
          {!hasRows ? (
            <p className="text-[11px] text-gray-400 italic">{emptyLabel}</p>
          ) : (
            <div className="space-y-1">
              {rows.map((row, i) => (
                <div
                  key={row.moduleId ?? row.wallId ?? row.openingId ?? i}
                  className="text-[11px] font-mono leading-tight p-1.5 rounded bg-gray-50 border border-gray-100"
                >
                  {columns.map((col) => {
                    let val = row[col.key];
                    if (val == null && col.optional) return null;
                    if (col.key === "attachedTo" && val == null) val = "root";
                    const display =
                      val === true ? "✓" : val === false ? "—" : val == null ? "" : String(val);
                    return (
                      <div key={col.key} className="flex gap-1.5">
                        <span className="text-gray-400 min-w-[4rem]">{col.label}:</span>
                        <span className="text-gray-700 truncate">{display}</span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RoofDrawingSection() {
  const [open, setOpen] = useState(false);
  const { buildModel } = useConfigurator();
  const drawings = useMemo(() => getRoofDrawings(buildModel()), [buildModel]);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100"
      >
        {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        Roof drawings (plan view)
      </button>
      {open && (
        <div className="p-2 bg-white">
          <RoofDrawingPreview drawings={drawings} />
        </div>
      )}
    </div>
  );
}

function ElevationSection() {
  const [open, setOpen] = useState(false);
  const { buildModel } = useConfigurator();
  const elevations = useMemo(() => getElevations(buildModel()), [buildModel]);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100"
      >
        {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        Elevations (front/back/left/right)
      </button>
      {open && (
        <div className="p-2 bg-white">
          <ElevationPreview elevations={elevations} />
        </div>
      )}
    </div>
  );
}

function BuilderSheetSection() {
  const [open, setOpen] = useState(false);
  const { buildModel } = useConfigurator();
  const sheet = useMemo(() => getBuilderSheet(buildModel()), [buildModel]);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100"
      >
        {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        Builder pack
      </button>
      {open && (
        <div className="p-2 bg-white">
          <BuilderSheetPreview sheet={sheet} />
        </div>
      )}
    </div>
  );
}

export default function BuildDataInspectionPanel() {
  const { buildSchedules } = useConfigurator();
  const schedules = buildSchedules();

  return (
    <section className="option-group">
      <h3 className="section-heading">Build Data</h3>
      <p className="text-xs text-gray-500 mb-2">
        Read-only schedule inspection for export data. Expand each section to view.
      </p>
      <div className="space-y-2">
        <BuilderSheetSection />
        <RoofDrawingSection />
        <ElevationSection />
        <ScheduleSection
          title="Modules"
          rows={schedules.modules}
          columns={[
            { key: "moduleId", label: "ID" },
            { key: "width", label: "W" },
            { key: "depth", label: "D" },
            { key: "roofType", label: "Roof" },
            { key: "attachedTo", label: "AttachedTo" },
            { key: "attachSide", label: "Side" },
          ]}
          emptyLabel="No modules"
        />
        <ScheduleSection
          title="Walls"
          rows={schedules.walls}
          columns={[
            { key: "moduleId", label: "Mod" },
            { key: "side", label: "Side" },
            { key: "length", label: "Len" },
            { key: "height", label: "Ht" },
            { key: "included", label: "Incl" },
            { key: "joined", label: "Join" },
            { key: "joinOverride", label: "Override" },
          ]}
          emptyLabel="No walls"
        />
        <ScheduleSection
          title="Openings"
          rows={schedules.openings}
          columns={[
            { key: "openingId", label: "ID" },
            { key: "kind", label: "Kind" },
            { key: "type", label: "Type" },
            { key: "moduleId", label: "Mod" },
            { key: "wallId", label: "Wall" },
            { key: "width", label: "W" },
            { key: "height", label: "H" },
            { key: "position", label: "Pos" },
            { key: "orientation", label: "Ori", optional: true },
          ]}
          emptyLabel="No openings"
        />
        <ScheduleSection
          title="Roofs"
          rows={schedules.roofs}
          columns={[
            { key: "moduleId", label: "ID" },
            { key: "roofType", label: "Type" },
            { key: "visible", label: "Visible" },
            { key: "pentSlopeDirection", label: "Slope", optional: true },
          ]}
          emptyLabel="No roofs"
        />
      </div>
    </section>
  );
}
