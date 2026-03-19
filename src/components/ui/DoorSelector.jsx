import { useConfigurator } from "../../context/ConfiguratorContext";

const OPTIONS = [
  { name: "No Door", type: "none" },
  { name: "Single Door", type: "single" },
  { name: "Stable Door", type: "stable" },
  { name: "Double Door", type: "double" },
  { name: "Double with Windows", type: "double_with_windows" },
];

export default function DoorSelector() {
  const { doorsByWall, placeDoorAt, removeDoor, doorFitsWall } = useConfigurator();
  const frontDoorType = doorsByWall.front?.type ?? "none";

  return (
    <div className="flex flex-col gap-2">
      {OPTIONS.map((opt) => {
        const fits = doorFitsWall("front", opt.type);
        return (
          <button
            key={opt.type}
            type="button"
            onClick={() => {
              if (!fits) return;
              if (opt.type === "none") removeDoor("front");
              else placeDoorAt("front", doorsByWall.front?.centerX ?? 0, opt.type);
            }}
            disabled={!fits}
            className={`btn-option text-left ${frontDoorType === opt.type ? "btn-option-active" : "btn-option-inactive"} disabled:opacity-50 disabled:cursor-not-allowed`}
            title={!fits ? "Door does not fit this wall width" : undefined}
          >
            {opt.name}
          </button>
        );
      })}
    </div>
  );
}
