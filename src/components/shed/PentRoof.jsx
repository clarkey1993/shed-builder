import { useConfigurator } from "../../context/ConfiguratorContext";
import { Box } from "@react-three/drei";

const PentRoof = () => {
  const { size } = useConfigurator();

  return (
    <Box args={[size.width, 0.2, size.depth]} position={[0, 2.6, 0]} rotation={[0, 0, -Math.PI / 16]} castShadow>
      <meshStandardMaterial color={"#43382c"} />
    </Box>
  );
};

export default PentRoof;
