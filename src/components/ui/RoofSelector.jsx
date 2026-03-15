import { useConfigurator } from "../../context/ConfiguratorContext";

const PENT_SLOPE_OPTIONS = [
  { value: "front_to_back", label: "Front → Back" },
  { value: "back_to_front", label: "Back → Front" },
  { value: "left_to_right", label: "Left → Right" },
  { value: "right_to_left", label: "Right → Left" },
];

export default function RoofSelector() {
  const { roofStyle, setRoofStyle, pentSlopeDirection, setPentSlopeDirection } = useConfigurator();

  return (
    <div className="space-y-4">
      <div className="flex rounded-lg bg-gray-50 p-1 gap-1">
        <button
          type="button"
          onClick={() => setRoofStyle("apex")}
          className={`flex-1 btn-option ${roofStyle === "apex" ? "btn-option-active" : "btn-option-inactive"}`}
        >
          Apex
        </button>
        <button
          type="button"
          onClick={() => setRoofStyle("pent")}
          className={`flex-1 btn-option ${roofStyle === "pent" ? "btn-option-active" : "btn-option-inactive"}`}
        >
          Pent
        </button>
      </div>
      {roofStyle === "pent" && (
        <div className="space-y-2">
          <label className="block text-xs font-medium text-gray-600">Pent slope direction</label>
          <div className="flex flex-wrap gap-1.5">
            {PENT_SLOPE_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setPentSlopeDirection(value)}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  pentSlopeDirection === value ? "bg-[#2A7F7F] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
