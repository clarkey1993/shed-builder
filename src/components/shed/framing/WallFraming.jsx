/**
 * WallFraming - Renders studs, plates, noggins, headers when showFraming is true.
 * Supports rectangular (wallHeight) or trapezoid (heightAtStart, heightAtEnd, yCenter) profiles.
 */
import { useMemo, useRef, useEffect } from "react";
import * as THREE from "three";
import { Box } from "@react-three/drei";
import { useShedTexturesContext } from "../../../context/ShedTextureContext";
import { generateWallFraming } from "../../../systems/framing/generateWallFraming";

const WallFraming = ({ wallWidth, wallHeight, heightAtStart, heightAtEnd, eaveHeight, peakHeight, yCenter, windows, doors, framingConfig }) => {
  const studsRef = useRef();
  const { woodFraming } = useShedTexturesContext();

  const framing = useMemo(() => {
    return generateWallFraming({
      wallWidth,
      wallHeight,
      heightAtStart,
      heightAtEnd,
      eaveHeight,
      peakHeight,
      yCenter,
      studSpacing: (framingConfig?.spacing_ft || 2) * 12,
      windows,
      doors,
      isWorkshop: false,
    });
  }, [wallWidth, wallHeight, heightAtStart, heightAtEnd, eaveHeight, peakHeight, yCenter, windows, doors, framingConfig]);

  const { studPositions, nogginPositions, headerPositions, plateThickness, studHeight, studSize, isTrapezoid, topPlateSlope } = framing;

  useEffect(() => {
    const mesh = studsRef.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    const baseStudHeight = studHeight ?? 60;
    studPositions.forEach((s, i) => {
      const h = s.studHeight ?? baseStudHeight;
      m.compose(
        new THREE.Vector3(s.x, 0, 0),
        new THREE.Quaternion(),
        new THREE.Vector3(1, h / baseStudHeight, 1)
      );
      mesh.setMatrixAt(i, m);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [studPositions, studHeight]);

  const structuralColor = "#5c4033";
  const framingMat = woodFraming ? (
    <meshStandardMaterial map={woodFraming} roughness={0.8} metalness={0.02} color={structuralColor} />
  ) : (
    <meshStandardMaterial color={structuralColor} roughness={0.8} metalness={0.02} />
  );

  const baseStudHeight = studHeight ?? 60;

  return (
    <>
      {studPositions.length > 0 && (
        <instancedMesh ref={studsRef} args={[null, null, studPositions.length]} castShadow>
          <boxGeometry args={[studSize.t, baseStudHeight, studSize.w]} />
          {framingMat}
        </instancedMesh>
      )}

      {nogginPositions.map((n, i) => (
        <Box key={i} args={[n.width, plateThickness, studSize.w]} position={[n.x, n.y, 0]} castShadow>
          {framingMat}
        </Box>
      ))}

      {headerPositions.map((h, i) => (
        <Box key={i} args={[h.width, h.height, studSize.w]} position={[h.x, h.y, 0]} castShadow>
          {framingMat}
        </Box>
      ))}
    </>
  );
};

export default WallFraming;
