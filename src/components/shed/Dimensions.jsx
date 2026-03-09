import { Text } from "@react-three/drei";
import { useConfigurator } from "../../context/ConfiguratorContext";

const Dimensions = () => {
  const { size } = useConfigurator();

  return (
    <>
      <Text
        position={[0, -0.5, size.depth / 2 + 0.5]}
        fontSize={0.5}
        color="black"
        anchorX="center"
        anchorY="middle"
      >
        {`${size.width}ft`}
      </Text>
      <Text
        position={[size.width / 2 + 0.5, -0.5, 0]}
        fontSize={0.5}
        color="black"
        anchorX="center"
        anchorY="middle"
        rotation={[0, Math.PI / 2, 0]}
      >
        {`${size.depth}ft`}
      </Text>
    </>
  );
};

export default Dimensions;
