import SizePresets from "./SizePresets";
import RoofSelector from "./RoofSelector";
import WindowToggle from "./WindowToggle";
import ImageUpload from "./ImageUpload";

const Sidebar = ({ onImageUpload, onGetQuote }) => {
  return (
    <div className="w-96 h-full bg-white shadow-lg p-6 flex flex-col">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Shed Configurator</h1>
      <div className="flex-grow flex flex-col gap-6">
        <SizePresets />
        <RoofSelector />
        <WindowToggle />
        <ImageUpload onImageUpload={onImageUpload} />
      </div>
      <div className="mt-6">
        <button
          onClick={onGetQuote}
          className="w-full px-4 py-3 bg-green-600 text-white font-bold rounded-lg shadow-md hover:bg-green-700 transition-colors"
        >
          Get a Quote
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
