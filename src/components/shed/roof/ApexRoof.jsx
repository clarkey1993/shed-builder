import { useMemo } from "react";
import * as THREE from "three";
import { Box, Cone } from "@react-three/drei";
import { useConfigurator } from "../../../context/ConfiguratorContext";
import { useShedTexturesContext } from "../../../context/ShedTextureContext";

const EAVE_OVERHANG = 5;
const FASCIA_W = 4;
const FASCIA_T = 1.5;
const FINIAL_H = 6;
const FINIAL_R = 2;
const RAFTER_SPACING = 24;
const RAFTER_W = 2;
const RAFTER_T = 3;

const ApexRoof = ({ width, depth, opacity = 1, showFraming = false }) => {
  const { shedConfig } = useConfigurator();
  const { roofFelt, woodFraming } = useShedTexturesContext();

  const wallHeight = shedConfig.wallHeight;
  const totalHeight = shedConfig.roofPeakHeight;
  const roofPeak = totalHeight - wallHeight;
  const roofDepth = depth + EAVE_OVERHANG * 2;
  const roofWidth = width + EAVE_OVERHANG * 2;

  const shape = new THREE.Shape();
  shape.moveTo(-width / 2 - EAVE_OVERHANG, 0);
  shape.lineTo(width / 2 + EAVE_OVERHANG, 0);
  shape.lineTo(0, roofPeak);
  shape.closePath();

  const extrudeSettings = useMemo(
    () => ({ steps: 1, depth: roofDepth, bevelEnabled: false }),
    [roofDepth]
  );

  const roofMat = useMemo(() => {
    const transparent = opacity < 1;
    if (!roofFelt) return <meshStandardMaterial color="#2d2d2d" roughness={0.96} metalness={0} transparent={transparent} opacity={opacity} depthWrite={!transparent} />;
    const tex = roofFelt.clone();
    tex.repeat.set(roofWidth / 24, roofDepth / 24);
    return <meshStandardMaterial map={tex} roughness={0.96} metalness={0} color="#2d2d2d" transparent={transparent} opacity={opacity} depthWrite={!transparent} />;
  }, [roofFelt, roofWidth, roofDepth, opacity]);

  const fasciaMat = woodFraming ? (
    <meshStandardMaterial map={woodFraming} roughness={0.7} metalness={0.1} color="#8b5a2b" transparent={opacity < 1} opacity={opacity} depthWrite={opacity >= 1} />
  ) : (
    <meshStandardMaterial color="#8b5a2b" roughness={0.7} metalness={0.1} transparent={opacity < 1} opacity={opacity} depthWrite={opacity >= 1} />
  );

  const roofPos = [0, wallHeight, -depth / 2 - EAVE_OVERHANG];
  const halfSpan = width / 2 + EAVE_OVERHANG;
  const rafterLen = Math.sqrt(halfSpan * halfSpan + roofPeak * roofPeak);
  const rafterAngle = Math.atan2(roofPeak, halfSpan);
  const numRafters = Math.floor(roofDepth / RAFTER_SPACING) + 1;

  return (
    <group position={roofPos}>
      <mesh castShadow receiveShadow>
        <extrudeGeometry args={[shape, extrudeSettings]} />
        {roofMat}
      </mesh>
      <Box args={[roofWidth + FASCIA_T * 2, FASCIA_W, FASCIA_T]} position={[0, -FASCIA_W / 2, 0]} castShadow>{fasciaMat}</Box>
      <Box args={[roofWidth + FASCIA_T * 2, FASCIA_W, FASCIA_T]} position={[0, -FASCIA_W / 2, roofDepth]} castShadow>{fasciaMat}</Box>
      <Cone args={[FINIAL_R, FINIAL_H, 4]} position={[0, roofPeak + FINIAL_H / 2, 0]} rotation={[0, 0, Math.PI / 4]} castShadow>{fasciaMat}</Cone>
      <Cone args={[FINIAL_R, FINIAL_H, 4]} position={[0, roofPeak + FINIAL_H / 2, roofDepth]} rotation={[0, 0, Math.PI / 4]} castShadow>{fasciaMat}</Cone>
      {showFraming && (
        <>
          {Array.from({ length: numRafters }).map((_, i) => (
            <group key={`L-${i}`} position={[-halfSpan / 2, roofPeak / 2, i * RAFTER_SPACING]}>
              <Box args={[rafterLen, RAFTER_W, RAFTER_T]} rotation={[0, 0, -rafterAngle]} castShadow>{fasciaMat}</Box>
            </group>
          ))}
          {Array.from({ length: numRafters }).map((_, i) => (
            <group key={`R-${i}`} position={[halfSpan / 2, roofPeak / 2, i * RAFTER_SPACING]}>
              <Box args={[rafterLen, RAFTER_W, RAFTER_T]} rotation={[0, 0, rafterAngle]} castShadow>{fasciaMat}</Box>
            </group>
          ))}
        </>
      )}
    </group>
  );
};

export default ApexRoof;
