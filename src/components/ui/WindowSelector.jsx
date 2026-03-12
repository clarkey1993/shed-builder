import { useState } from "react";
import { useConfigurator } from "../../context/ConfiguratorContext";

const WALL_LABELS = { front: "Front", back: "Back", left: "Left", right: "Right" };

export default function WindowSelector() {
  const { windows, setWindows, windowPositions, addWindow, removeWindow } = useConfigurator();
  const [showLayout, setShowLayout] = useState(false);

  return (
    <div className="space-y-4">
      <label className="flex items-center gap-3 cursor-pointer group">
        <input
          type="checkbox"
          checked={windows}
          onChange={(e) => setWindows(e.target.checked)}
          className="w-4 h-4 rounded border-gray-300 text-[#2A7F7F] focus:ring-[#2A7F7F]/30"
        />
        <span className="text-gray-700 text-sm group-hover:text-gray-900 transition-colors">Enable windows</span>
      </label>
      {windows && (
        <>
          <div className="space-y-3">
            {["front", "back", "left", "right"].map((wallId) => (
              <div key={wallId}>
                <h4 className="text-[0.8125rem] font-medium text-gray-600 mb-2">{WALL_LABELS[wallId]} Wall</h4>
                <div className="flex flex-wrap gap-1.5">
                  {(windowPositions[wallId] || []).map((x, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white text-gray-700 text-sm border border-gray-200 hover:border-gray-300 transition-colors"
                    >
                      {x}"
                      <button
                        type="button"
                        onClick={() => removeWindow(wallId, i)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded p-0.5 transition-colors"
                        aria-label="Remove"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <button
                    type="button"
                    onClick={() => addWindow(wallId)}
                    className="btn-option btn-option-inactive px-3 py-1.5 text-sm"
                  >
                    + Add
                  </button>
                </div>
              </div>
            ))}
          </div>
          <label className="flex items-center gap-3 cursor-pointer text-sm text-gray-600 hover:text-gray-800 transition-colors">
            <input
              type="checkbox"
              checked={showLayout}
              onChange={(e) => setShowLayout(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-[#2A7F7F]"
            />
            <span>Show positions in sidebar</span>
          </label>
          {showLayout && (
            <pre className="p-3 rounded-lg bg-gray-50 text-xs overflow-auto max-h-24 border border-gray-100">
              {JSON.stringify(windowPositions, null, 2)}
            </pre>
          )}
        </>
      )}
    </div>
  );
}
