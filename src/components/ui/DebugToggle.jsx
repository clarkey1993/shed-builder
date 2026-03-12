/**
 * DebugToggle - Optional toggle to show dimension labels in the 3D view.
 */
import { useBuilder } from "../../context/BuilderContext";

export default function DebugToggle() {
  const { showDimensions, setShowDimensions, showFraming, setShowFraming } = useBuilder();

  return (
    <div className="flex items-center gap-4">
      <label className="flex items-center gap-1.5 cursor-pointer text-gray-500 hover:text-gray-700 transition-colors">
        <input
          type="checkbox"
          checked={showDimensions}
          onChange={(e) => setShowDimensions(e.target.checked)}
          className="w-3.5 h-3.5 rounded border-gray-300 text-[#2A7F7F] focus:ring-[#2A7F7F]/30"
        />
        <span>Show dimensions</span>
      </label>
      <label className="flex items-center gap-1.5 cursor-pointer text-gray-500 hover:text-gray-700 transition-colors">
        <input
          type="checkbox"
          checked={showFraming}
          onChange={(e) => setShowFraming(e.target.checked)}
          className="w-3.5 h-3.5 rounded border-gray-300 text-[#2A7F7F] focus:ring-[#2A7F7F]/30"
        />
        <span>Show framing</span>
      </label>
    </div>
  );
}
