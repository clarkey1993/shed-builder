import { useMemo } from "react";
import * as THREE from "three";
import { Box, Cone } from "@react-three/drei";
import { useConfigurator } from "../../../context/ConfiguratorContext";
import { useShedTexturesContext } from "../../../context/ShedTextureContext";

const EAVE_OVERHANG = 4;
const FASCIA_HEIGHT = 4;
const FASCIA_THICKNESS = 0.75;
const RIDGE_CAP_WIDTH = 4;
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
    const roofColor = "#1e1e1e";
    if (!roofFelt) return <meshStandardMaterial color={roofColor} roughness={0.98} metalness={0} transparent={transparent} opacity={opacity} depthWrite={!transparent} />;
    const tex = roofFelt.clone();
    tex.repeat.set(roofWidth / 24, roofDepth / 24);
    return <meshStandardMaterial map={tex} roughness={0.98} metalness={0} color={roofColor} transparent={transparent} opacity={opacity} depthWrite={!transparent} />;
  }, [roofFelt, roofWidth, roofDepth, opacity]);

  const WARM_CEDAR = "#c89b6d";
  const fasciaMat = woodFraming ? (
    <meshStandardMaterial map={woodFraming} roughness={0.75} metalness={0.05} color={WARM_CEDAR} transparent={opacity < 1} opacity={opacity} depthWrite={opacity >= 1} />
  ) : (
    <meshStandardMaterial color={WARM_CEDAR} roughness={0.75} metalness={0.05} transparent={opacity < 1} opacity={opacity} depthWrite={opacity >= 1} />
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
      <Box args={[roofWidth + FASCIA_THICKNESS * 2, FASCIA_HEIGHT, FASCIA_THICKNESS]} position={[0, -FASCIA_HEIGHT / 2, 0]} castShadow>{fasciaMat}</Box>
      <Box args={[roofWidth + FASCIA_THICKNESS * 2, FASCIA_HEIGHT, FASCIA_THICKNESS]} position={[0, -FASCIA_HEIGHT / 2, roofDepth]} castShadow>{fasciaMat}</Box>
      {/* Ridge cap - board along roof ridge */}
      <Box args={[RIDGE_CAP_WIDTH, 1, roofDepth]} position={[0, roofPeak + 0.5, roofDepth / 2]} castShadow>{fasciaMat}</Box>
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
