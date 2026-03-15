import { useConfigurator } from "../../context/ConfiguratorContext";

const OPTIONS = [
  { name: "No Door", type: "none" },
  { name: "Single Door", type: "single" },
  { name: "Stable Door", type: "stable" },
  { name: "Double Door", type: "double" },
  { name: "Double with Windows", type: "double_with_windows" },
];

export default function DoorSelector() {
  const { doorType, setDoorType } = useConfigurator();

  return (
    <div className="flex flex-col gap-2">
      {OPTIONS.map((opt) => (
        <button
          key={opt.type}
          type="button"
          onClick={() => setDoorType(opt.type)}
          className={`btn-option text-left ${doorType === opt.type ? "btn-option-active" : "btn-option-inactive"}`}
        >
          {opt.name}
        </button>
      ))}
    </div>
  );
}
