/**
 * Ground - Larger plane with grass texture, receives shadows.
 * Sits under the shed for a natural outdoor environment.
 */
import { Plane } from "@react-three/drei";
import { useShedTexturesContext } from "../../context/ShedTextureContext";

const GROUND_SIZE = 200; // Larger than before for natural env

export default function Ground({ hideForBackground = false }) {
  const { grass } = useShedTexturesContext();
  if (!grass) return null;
  grass.repeat.set(4, 4);
  return (
    <Plane args={[GROUND_SIZE, GROUND_SIZE]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <meshStandardMaterial
        map={grass}
        roughness={0.9}
        metalness={0.05}
        transparent={hideForBackground}
        opacity={hideForBackground ? 0 : 1}
      />
    </Plane>
  );
}
