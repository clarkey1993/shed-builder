import * as THREE from "three";
import { useConfigurator } from "../../context/ConfiguratorContext";

const ApexRoof = () => {
  const { size } = useConfigurator();
  const roofHeight = 1;

  const shape = new THREE.Shape();
  shape.moveTo(-size.width / 2, 0);
  shape.lineTo(size.width / 2, 0);
  shape.lineTo(0, roofHeight);

  const extrudeSettings = {
    steps: 1,
    depth: size.depth,
    bevelEnabled: false,
  };

  return (
    <mesh position={[0, 2.5, -size.depth/2]} castShadow>
      <extrudeGeometry args={[shape, extrudeSettings]} />
      <meshStandardMaterial color={"#43382c"} />
    </mesh>
  );
};

export default ApexRoof;
