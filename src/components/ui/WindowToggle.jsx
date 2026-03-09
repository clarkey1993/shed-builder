import { useConfigurator } from "../../context/ConfiguratorContext";

const WindowToggle = () => {
  const { windows, setWindows } = useConfigurator();

  return (
    <div>
      <h3 className="text-xl font-semibold mb-3 text-gray-700">Extras</h3>
      <label className="flex items-center justify-between bg-gray-200 rounded-lg p-4 cursor-pointer hover:bg-gray-300 transition-colors">
        <span className="font-semibold text-gray-800">Add Window</span>
        <input
          type="checkbox"
          checked={windows}
          onChange={(e) => setWindows(e.target.checked)}
          className="form-checkbox h-5 w-5 text-blue-600 rounded"
        />
      </label>
    </div>
  );
};

export default WindowToggle;
