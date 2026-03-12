import { useConfigurator } from "../../context/ConfiguratorContext";
import shedData from "../../shedData.json";

export default function SizePresets() {
  const { size, setSize } = useConfigurator();
  const availableWidths = Object.keys(shedData.floor_widths_inches)
    .map(Number)
    .sort((a, b) => a - b);
  const depths = Array.from({ length: 13 }, (_, i) => i + 4);

  return (
    <div className="space-y-5">
      <div>
        <h4 className="text-[0.8125rem] font-medium text-gray-600 mb-2">Width</h4>
        <div className="grid grid-cols-4 gap-1.5">
          {availableWidths.map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => setSize({ ...size, width: w })}
              className={`btn-option ${size.width === w ? "btn-option-active" : "btn-option-inactive"}`}
            >
              {w}ft
            </button>
          ))}
        </div>
      </div>
      <div>
        <h4 className="text-[0.8125rem] font-medium text-gray-600 mb-2">Depth</h4>
        <div className="grid grid-cols-4 gap-1.5">
          {depths.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setSize({ ...size, depth: d })}
              className={`btn-option ${size.depth === d ? "btn-option-active" : "btn-option-inactive"}`}
            >
              {d}ft
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
