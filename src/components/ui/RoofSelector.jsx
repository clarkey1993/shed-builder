import { useConfigurator } from "../../context/ConfiguratorContext";

export default function RoofSelector() {
  const { roofStyle, setRoofStyle } = useConfigurator();

  return (
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
  );
}
