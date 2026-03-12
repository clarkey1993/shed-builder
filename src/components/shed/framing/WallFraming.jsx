/**
 * WallFraming - Renders studs, plates, noggins, headers when showFraming is true.
 * Uses generateWallFraming for layout. InstancedMesh for studs when possible.
 */
import { useMemo, useRef, useEffect } from "react";
import * as THREE from "three";
import { Box } from "@react-three/drei";
import { useShedTexturesContext } from "../../../context/ShedTextureContext";
import { generateWallFraming } from "../../../systems/framing/generateWallFraming";

const WallFraming = ({ wallWidth, wallHeight, windows, doors, framingConfig }) => {
  const studsRef = useRef();
  const { woodFraming } = useShedTexturesContext();

  const framing = useMemo(() => {
    return generateWallFraming({
      wallWidth,
      wallHeight,
      studSpacing: (framingConfig?.spacing_ft || 2) * 12,
      windows,
      doors,
      isWorkshop: false,
    });
  }, [wallWidth, wallHeight, windows, doors, framingConfig]);

  const { studPositions, nogginPositions, headerPositions, plateThickness, studHeight, studSize } = framing;

  useEffect(() => {
    const mesh = studsRef.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    studPositions.forEach((s, i) => {
      m.makeTranslation(s.x, 0, 0);
      mesh.setMatrixAt(i, m);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [studPositions]);

  const framingMat = woodFraming ? (
    <meshStandardMaterial map={woodFraming} roughness={0.7} metalness={0.1} color="#8b4513" />
  ) : (
    <meshStandardMaterial color="#8B4513" roughness={0.7} metalness={0.1} />
  );

  return (
    <>
      {/* Studs - InstancedMesh */}
      {studPositions.length > 0 && (
        <instancedMesh ref={studsRef} args={[null, null, studPositions.length]} castShadow>
          <boxGeometry args={[studSize.t, studHeight, studSize.w]} />
          {framingMat}
        </instancedMesh>
      )}

      {/* Noggins */}
      {nogginPositions.map((n, i) => (
        <Box key={i} args={[n.width, plateThickness, studSize.w]} position={[n.x, n.y, 0]} castShadow>
          {framingMat}
        </Box>
      ))}

      {/* Headers above windows and doors */}
      {headerPositions.map((h, i) => (
        <Box key={i} args={[h.width, h.height, studSize.w]} position={[h.x, h.y, 0]} castShadow>
          {framingMat}
        </Box>
      ))}
    </>
  );
};

export default WallFraming;
