import { useConfigurator } from "../../context/ConfiguratorContext";
import shedData from "../../shedData.json";

export default function Summary() {
  const { size, roofStyle, wallHeightType, doorType, windows } = useConfigurator();
  const totalHeight =
    roofStyle === "apex"
      ? shedData.apex_roof_dims[size.width]
      : shedData.pent_roof_dims[size.width]?.front;

  const handleArClick = () => console.log("Preparing AR model...");

  return (
    <div className="space-y-4">
      <ul className="space-y-2 text-gray-600 text-sm">
        <li><span className="font-medium text-gray-700">Size:</span> {size.width}ft × {size.depth}ft</li>
        <li><span className="font-medium text-gray-700">Roof:</span> {roofStyle}</li>
        <li><span className="font-medium text-gray-700">Wall height:</span> {wallHeightType}</li>
        <li><span className="font-medium text-gray-700">Door:</span> {doorType}</li>
        <li><span className="font-medium text-gray-700">Windows:</span> {windows ? "Yes" : "No"}</li>
        <li><span className="font-medium text-gray-700">Peak height:</span> ~{totalHeight}"</li>
      </ul>
      <button type="button" onClick={handleArClick} className="btn-secondary w-full">
        View in Garden (AR)
      </button>
    </div>
  );
}
