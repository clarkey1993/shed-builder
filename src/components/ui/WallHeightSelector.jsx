import { useConfigurator } from "../../context/ConfiguratorContext";

const OPTIONS = [
  { name: "Standard (66\")", type: "standard" },
  { name: "Workshop (70\")", type: "workshop" },
];

export default function WallHeightSelector() {
  const { wallHeightType, setWallHeightType } = useConfigurator();

  return (
    <div className="flex flex-col gap-2">
      {OPTIONS.map((opt) => (
        <button
          key={opt.type}
          type="button"
          onClick={() => setWallHeightType(opt.type)}
          className={`btn-option text-left ${wallHeightType === opt.type ? "btn-option-active" : "btn-option-inactive"}`}
        >
          {opt.name}
        </button>
      ))}
    </div>
  );
}
