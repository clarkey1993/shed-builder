import { useConfigurator } from "../../context/ConfiguratorContext";

const SizePresets = () => {
  const { size, setSize } = useConfigurator();

  const presets = [
    { name: "Small (8x6)", width: 8, depth: 6 },
    { name: "Medium (10x8)", width: 10, depth: 8 },
    { name: "Large (12x10)", width: 12, depth: 10 },
  ];

  return (
    <div>
      <h3 className="text-xl font-semibold mb-3 text-gray-700">Size</h3>
      <div className="flex flex-col gap-2">
        {presets.map((preset) => (
          <button
            key={preset.name}
            className={`w-full text-left font-bold py-3 px-4 rounded-lg transition-colors ${
              size.width === preset.width
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
            }`}
            onClick={() => setSize({ width: preset.width, depth: preset.depth })}
          >
            {preset.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SizePresets;
