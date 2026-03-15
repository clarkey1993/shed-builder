import { useConfigurator } from "../../context/ConfiguratorContext";

const OPTIONS = [
  { name: "No Door", type: "none" },
  { name: "Single Door", type: "single" },
  { name: "Stable Door", type: "stable" },
  { name: "Double Door", type: "double" },
  { name: "Double with Windows", type: "double_with_windows" },
];

export default function DoorSelector() {
  const { doorType, setDoorType, doorFitsWall } = useConfigurator();

  return (
    <div className="flex flex-col gap-2">
      {OPTIONS.map((opt) => {
        const fits = doorFitsWall(opt.type);
        return (
          <button
            key={opt.type}
            type="button"
            onClick={() => fits && setDoorType(opt.type)}
            disabled={!fits}
            className={`btn-option text-left ${doorType === opt.type ? "btn-option-active" : "btn-option-inactive"} disabled:opacity-50 disabled:cursor-not-allowed`}
            title={!fits ? "Door does not fit this wall width" : undefined}
          >
            {opt.name}
          </button>
        );
      })}
    </div>
  );
}
