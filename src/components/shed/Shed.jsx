import { useConfigurator } from "../../context/ConfiguratorContext";
import { Box } from "@react-three/drei";
import ApexRoof from "./ApexRoof";
import PentRoof from "./PentRoof";

const Shed = () => {
  const { size, roofStyle, windows } = useConfigurator();

  const wallHeight = 2.5;

  return (
    <group>
      {/* Floor */}
      <Box args={[size.width, 0.1, size.depth]} position={[0, 0, 0]} receiveShadow>
        <meshStandardMaterial color={"#a9a9a9"} />
      </Box>

      {/* Walls */}
      <Box args={[size.width, wallHeight, 0.1]} position={[0, wallHeight / 2, size.depth / 2]} castShadow>
        <meshStandardMaterial color={"#b06500"} />
      </Box>
      <Box args={[size.width, wallHeight, 0.1]} position={[0, wallHeight / 2, -size.depth / 2]} castShadow>
        <meshStandardMaterial color={"#b06500"} />
      </Box>
      <Box args={[0.1, wallHeight, size.depth]} position={[size.width / 2, wallHeight / 2, 0]} castShadow>
        <meshStandardMaterial color={"#b06500"} />
      </Box>
      <Box args={[0.1, wallHeight, size.depth]} position={[-size.width / 2, wallHeight / 2, 0]} castShadow>
        <meshStandardMaterial color={"#b06500"} />
      </Box>

      {/* Roof */}
      {roofStyle === "apex" ? <ApexRoof /> : <PentRoof />}

      {/* Window */}
      {windows && (
        <Box args={[0.8, 0.8, 0.2]} position={[0, wallHeight / 2, size.depth / 2 - 0.05]} castShadow>
          <meshStandardMaterial color={"#404040"} />
        </Box>
      )}
    </group>
  );
};

export default Shed;
