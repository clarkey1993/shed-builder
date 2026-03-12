/**
 * StudioBackdrop - Soft, seamless curved cyclorama behind the shed.
 * Warm grey/light taupe for a sophisticated product-shot backdrop.
 */
import { Backdrop } from "@react-three/drei";
import * as THREE from "three";
import { useBuilder } from "../../context/BuilderContext";

const BACKDROP_COLOR = "#EBE8E0";
const BACKDROP_SCALE = 80;
// Behind the shed from typical camera view (front-right)
const BACKDROP_POSITION = [-28, 12, -28];

export default function StudioBackdrop({ hideForBackground = false }) {
  const { setSelectedElementId } = useBuilder();
  if (hideForBackground) return null;

  return (
    <group position={BACKDROP_POSITION} rotation={[0, Math.PI / 4, 0]}>
      <Backdrop
        receiveShadow={false}
        onClick={() => setSelectedElementId(null)}
        scale={BACKDROP_SCALE}
        floor={0.15}
        segments={32}
      >
        <meshBasicMaterial
          color={BACKDROP_COLOR}
          side={THREE.BackSide}
          toneMapped={false}
        />
      </Backdrop>
    </group>
  );
}
