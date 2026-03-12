/**
 * InteriorTools - Exterior/Interior view toggle and partition controls.
 */
import { useInteriorView } from "../../context/InteriorViewContext";
import { useConfigurator } from "../../context/ConfiguratorContext";
import { Sun, Home, Plus, Trash2, DoorOpen, ChevronLeft, ChevronRight } from "lucide-react";
import shedData from "../../shedData.json";

export default function InteriorTools() {
  const { viewMode, setViewMode, partitions, addPartition, updatePartition, removePartition } =
    useInteriorView();
  const { shedConfig } = useConfigurator();

  const floorWidth = shedConfig.width;
  const floorDepth = shedConfig.depth;
  const framing = shedData.framing;
  const studSpacingInches = framing.spacing_ft * 12;
  const numStudsWidth = Math.floor(floorWidth / studSpacingInches) + 1;
  const numStudsDepth = Math.floor(floorDepth / studSpacingInches) + 1;

  const maxStudX = numStudsWidth - 1;
  const maxStudZ = numStudsDepth - 1;
  const maxValidStudX = maxStudX - 1;
  const maxValidStudZ = maxStudZ - 1;

  const addPartitionAlongX = () => {
    const midStud = Math.floor(numStudsDepth / 2);
    const studIndex = Math.max(1, Math.min(maxStudZ - 1, midStud));
    addPartition({ axis: "x", studIndex, hasDoor: false });
  };

  const addPartitionAlongZ = () => {
    const midStud = Math.floor(numStudsWidth / 2);
    const studIndex = Math.max(1, Math.min(maxStudX - 1, midStud));
    addPartition({ axis: "z", studIndex, hasDoor: false });
  };

  return (
    <div className="space-y-4">
      <section className="option-group">
        <h3 className="section-heading">View</h3>
        <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-gray-50/80">
          <button
            type="button"
            onClick={() => setViewMode("exterior")}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              viewMode === "exterior"
                ? "bg-white text-gray-900 shadow-sm border border-gray-200"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Sun className="w-4 h-4" strokeWidth={1.5} />
            Exterior
          </button>
          <button
            type="button"
            onClick={() => setViewMode("interior")}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              viewMode === "interior"
                ? "bg-white text-gray-900 shadow-sm border border-gray-200"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Home className="w-4 h-4" strokeWidth={1.5} />
            Interior
          </button>
        </div>
      </section>

      {viewMode === "interior" && (
        <section className="option-group">
          <h3 className="section-heading">Internal Partitions</h3>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={addPartitionAlongX}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={2} />
              Along width
            </button>
            <button
              type="button"
              onClick={addPartitionAlongZ}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={2} />
              Along depth
            </button>
          </div>

          {partitions.length > 0 && (
            <div className="mt-3 space-y-2">
              {partitions.map((p, i) => {
                const isX = p.axis === "x";
                const maxStud = isX ? maxValidStudZ : maxValidStudX;
                return (
                  <div
                    key={p.id}
                    className="p-3 rounded-lg border border-gray-100 bg-gray-50/50 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-600">
                        Partition {i + 1} ({isX ? "width" : "depth"})
                      </span>
                      <button
                        type="button"
                        onClick={() => removePartition(p.id)}
                        className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        aria-label="Remove partition"
                      >
                        <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updatePartition(p.id, { studIndex: Math.max(1, p.studIndex - 1) })}
                        disabled={p.studIndex <= 1}
                        className="p-1.5 rounded border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        aria-label="Move partition left"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" strokeWidth={2} />
                      </button>
                      <span className="text-xs text-gray-500 flex-1 text-center">
                        Stud {p.studIndex} of {maxStud}
                      </span>
                      <button
                        type="button"
                        onClick={() => updatePartition(p.id, { studIndex: Math.min(maxStud - 2, p.studIndex + 1) })}
                        disabled={p.studIndex >= maxStud}
                        className="p-1.5 rounded border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        aria-label="Move partition right"
                      >
                        <ChevronRight className="w-3.5 h-3.5" strokeWidth={2} />
                      </button>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!p.hasDoor}
                        onChange={(e) =>
                          updatePartition(p.id, {
                            hasDoor: e.target.checked,
                            doorOffset: e.target.checked ? 0 : undefined,
                          })
                        }
                        className="rounded border-gray-300 text-gray-900 focus:ring-gray-500"
                      />
                      <span className="text-xs text-gray-600 flex items-center gap-1">
                        <DoorOpen className="w-3.5 h-3.5" strokeWidth={1.5} />
                        31" door
                      </span>
                    </label>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
