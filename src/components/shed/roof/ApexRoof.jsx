import { useMemo } from "react";
import * as THREE from "three";
import { Box, Cone } from "@react-three/drei";
import { useConfigurator } from "../../../context/ConfiguratorContext";
import { useShedTexturesContext } from "../../../context/ShedTextureContext";

const EAVE_OVERHANG = 4;
const SIDE_OVERHANG = 4; // Visible past side walls; shape X = left/right eave extent
const ROOF_PANEL_THICKNESS = 4; // Thickness perpendicular to the sloped roof face
const FASCIA_HEIGHT = 2; // Trim at eave only; keep low so gable cladding is not covered
const FASCIA_THICKNESS = 1;
const RIDGE_CAP_WIDTH = 4;
const FINIAL_H = 6;
const FINIAL_R = 2;
const RAFTER_SPACING = 24;
const RAFTER_W = 2;
const RAFTER_T = 3;

const ApexRoof = ({ width, depth, opacity = 1, showFraming = false }) => {
  const { shedConfig } = useConfigurator();
  const { roofFelt } = useShedTexturesContext();

  const wallHeight = shedConfig.wallHeight;
  const totalHeight = shedConfig.roofPeakHeight;
  const roofPeak = totalHeight - wallHeight;

  const roofDepth = depth + EAVE_OVERHANG * 2;
  const roofWidth = width + EAVE_OVERHANG * 2 + SIDE_OVERHANG * 2;
  const halfSpan = width / 2 + EAVE_OVERHANG + SIDE_OVERHANG;

  const rafterLen = Math.sqrt(halfSpan * halfSpan + roofPeak * roofPeak);
  const thick = ROOF_PANEL_THICKNESS;
  const rafterAngle = Math.atan2(roofPeak, halfSpan);
  const numRafters = Math.floor(roofDepth / RAFTER_SPACING) + 1;

  // Original visible roof-plane midpoints.
  // Left top face runs from (-halfSpan, 0) to (0, roofPeak)
  // Right top face runs from (0, roofPeak) to (halfSpan, 0)
  const slopeMidY = roofPeak / 2;
  const leftSlopeMidX = -halfSpan / 2;
  const rightSlopeMidX = halfSpan / 2;

  // Place the box centers inward by half thickness so the OUTER TOP FACE
  // still lies exactly on the original roof planes.
  const leftRoofCenter = useMemo(() => {
    const inward = new THREE.Vector3(
      Math.sin(rafterAngle),
      -Math.cos(rafterAngle),
      0
    ).multiplyScalar(thick / 2);

    return [
      leftSlopeMidX + inward.x,
      slopeMidY + inward.y,
      roofDepth / 2,
    ];
  }, [leftSlopeMidX, slopeMidY, roofDepth, rafterAngle, thick]);

  const rightRoofCenter = useMemo(() => {
    const inward = new THREE.Vector3(
      -Math.sin(rafterAngle),
      -Math.cos(rafterAngle),
      0
    ).multiplyScalar(thick / 2);

    return [
      rightSlopeMidX + inward.x,
      slopeMidY + inward.y,
      roofDepth / 2,
    ];
  }, [rightSlopeMidX, slopeMidY, roofDepth, rafterAngle, thick]);

  const roofMat = useMemo(() => {
    const transparent = opacity < 1;
    const roofColor = "#2a2a2e";
    const matProps = {
      color: roofColor,
      roughness: 0.99,
      metalness: 0,
      transparent,
      opacity,
      depthWrite: !transparent,
      flatShading: true,
    };

    if (!roofFelt) return <meshStandardMaterial {...matProps} />;

    const tex = roofFelt.clone();
    tex.repeat.set(roofWidth / 24, roofDepth / 24);

    return <meshStandardMaterial {...matProps} map={tex} />;
  }, [roofFelt, roofWidth, roofDepth, opacity]);

  const WARM_CEDAR = "#e0b890";
  const fasciaMat = (
    <meshStandardMaterial
      color={WARM_CEDAR}
      roughness={0.75}
      metalness={0.02}
      transparent={opacity < 1}
      opacity={opacity}
      depthWrite={opacity >= 1}
    />
  );

  const roofPos = [0, wallHeight, -depth / 2 - EAVE_OVERHANG];

  return (
    <group position={roofPos}>
      <Box
        args={[rafterLen, thick, roofDepth]}
        position={leftRoofCenter}
        rotation={[0, 0, rafterAngle]}
        castShadow
        receiveShadow
      >
        {roofMat}
      </Box>

      <Box
        args={[rafterLen, thick, roofDepth]}
        position={rightRoofCenter}
        rotation={[0, 0, -rafterAngle]}
        castShadow
        receiveShadow
      >
        {roofMat}
      </Box>

      {/* Left/right eave fascia along roof depth (no fascia across front/back gables) */}
      <Box
        args={[FASCIA_THICKNESS, FASCIA_HEIGHT, roofDepth]}
        position={[-halfSpan, -FASCIA_HEIGHT / 2, roofDepth / 2]}
        castShadow
      >
        {fasciaMat}
      </Box>

      <Box
        args={[FASCIA_THICKNESS, FASCIA_HEIGHT, roofDepth]}
        position={[halfSpan, -FASCIA_HEIGHT / 2, roofDepth / 2]}
        castShadow
      >
        {fasciaMat}
      </Box>

      {/* Ridge cap - board along roof ridge */}
      <Box
        args={[RIDGE_CAP_WIDTH, 1, roofDepth]}
        position={[0, roofPeak + 0.5, roofDepth / 2]}
        castShadow
      >
        {fasciaMat}
      </Box>

      <Cone
        args={[FINIAL_R, FINIAL_H, 4]}
        position={[0, roofPeak + FINIAL_H / 2, 0]}
        rotation={[0, 0, Math.PI / 4]}
        castShadow
      >
        {fasciaMat}
      </Cone>

      <Cone
        args={[FINIAL_R, FINIAL_H, 4]}
        position={[0, roofPeak + FINIAL_H / 2, roofDepth]}
        rotation={[0, 0, Math.PI / 4]}
        castShadow
      >
        {fasciaMat}
      </Cone>

      {showFraming && (
        <>
          {Array.from({ length: numRafters }).map((_, i) => (
            <group
              key={`L-${i}`}
              position={[-halfSpan / 2, roofPeak / 2, i * RAFTER_SPACING]}
            >
              <Box
                args={[rafterLen, RAFTER_W, RAFTER_T]}
                rotation={[0, 0, -rafterAngle]}
                castShadow
              >
                {fasciaMat}
              </Box>
            </group>
          ))}

          {Array.from({ length: numRafters }).map((_, i) => (
            <group
              key={`R-${i}`}
              position={[halfSpan / 2, roofPeak / 2, i * RAFTER_SPACING]}
            >
              <Box
                args={[rafterLen, RAFTER_W, RAFTER_T]}
                rotation={[0, 0, rafterAngle]}
                castShadow
              >
                {fasciaMat}
              </Box>
            </group>
          ))}
        </>
      )}
    </group>
  );
};

export default ApexRoof;
