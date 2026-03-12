import { Text } from "@react-three/drei";
import { useConfigurator } from "../../context/ConfiguratorContext";
import shedData from "../../shedData.json";

const Dimensions = () => {
  const { size, roofStyle, wallHeightType } = useConfigurator();

  const widthInches = size.width * 12 - shedData.floor_dimensions.width_offset;
  const depthInches = size.depth * 12 - shedData.floor_dimensions.depth_offset;
  const wallHeight = shedData.wall_heights[wallHeightType];
  
  let totalHeight = wallHeight;
  if (roofStyle === "apex" && shedData.apex_roof_dims[size.width]) {
    totalHeight = shedData.apex_roof_dims[size.width];
  } else if (roofStyle === "pent" && shedData.pent_roof_dims[size.width]) {
    totalHeight = shedData.pent_roof_dims[size.width].front;
  }
  

  return (
    <>
      <Text
        position={[0, totalHeight / 12 + 0.5, 0]}
        fontSize={0.25}
        color="black"
        anchorX="center"
        anchorY="middle"
      >
        {`${totalHeight.toFixed(2)}"`}
      </Text>
      <Text
        position={[0, -0.5, depthInches / 24 + 0.5]}
        fontSize={0.25}
        color="black"
        anchorX="center"
        anchorY="middle"
      >
        {`${widthInches}"`}
      </Text>
      <Text
        position={[widthInches / 24 + 0.5, -0.5, 0]}
        fontSize={0.25}
        color="black"
        anchorX="center"
        anchorY="middle"
        rotation={[0, Math.PI / 2, 0]}
      >
        {`${depthInches}"`}
      </Text>
    </>
  );
};

export default Dimensions;
