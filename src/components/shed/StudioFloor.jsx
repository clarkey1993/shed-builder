/**
 * StudioFloor - Clean presentation floor to ground the shed.
 * Subtle warm light-grey, matte finish. Receives shadows.
 * Extends well beyond the shed. Clicking clears window selection.
 */
import { Plane } from "@react-three/drei";
import { useBuilder } from "../../context/BuilderContext";

const FLOOR_SIZE = 500;
const FLOOR_COLOR = "#E8E4E0"; // Warm light grey, non-distracting

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
        color={FLOOR_COLOR}
        roughness={0.92}
        metalness={0}
        transparent={hideForBackground}
        opacity={hideForBackground ? 0 : 1}
        envMapIntensity={0.15}
      />
    </Plane>
  );
}
