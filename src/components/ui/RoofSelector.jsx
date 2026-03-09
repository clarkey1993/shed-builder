import { useConfigurator } from "../../context/ConfiguratorContext";

const RoofSelector = () => {
  const { roofStyle, setRoofStyle } = useConfigurator();

  return (
    <div>
      <h3 className="text-xl font-semibold mb-3 text-gray-700">Roof Style</h3>
      <div className="flex bg-gray-200 rounded-lg p-1">
        <button
          className={`w-full font-bold py-2 px-4 rounded-lg transition-colors ${
            roofStyle === "apex" ? "bg-blue-600 text-white" : "text-gray-800 hover:bg-gray-300"
          }`}
          onClick={() => setRoofStyle("apex")}
        >
          Apex
        </button>
        <button
          className={`w-full font-bold py-2 px-4 rounded-lg transition-colors ${
            roofStyle === "pent" ? "bg-blue-600 text-white" : "text-gray-800 hover:bg-gray-300"
          }`}
          onClick={() => setRoofStyle("pent")}
        >
          Pent
        </button>
      </div>
    </div>
  );
};

export default RoofSelector;
