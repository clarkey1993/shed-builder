/**
 * StudioFloor - Premium product visualization floor.
 * Soft-reflection material to receive realistic contact shadows.
 * Clicking the floor clears window selection.
 */
import { Plane } from "@react-three/drei";
import { useBuilder } from "../../context/BuilderContext";

const FLOOR_SIZE = 500;

export default function StudioFloor({ hideForBackground = false }) {
  const { setSelectedElementId } = useBuilder();
  return (
    <Plane
      args={[FLOOR_SIZE, FLOOR_SIZE]}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.02, 0]}
      receiveShadow
      onClick={() => setSelectedElementId(null)}
    >
      <meshStandardMaterial
        color="#E8E6E2"
        roughness={0.6}
        metalness={0.12}
        transparent={hideForBackground}
        opacity={hideForBackground ? 0 : 1}
        envMapIntensity={0.4}
      />
    </Plane>
  );
}
