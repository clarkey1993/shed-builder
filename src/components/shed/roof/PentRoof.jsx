import { useMemo } from "react";
import { useConfigurator } from "../../../context/ConfiguratorContext";
import { Box } from "@react-three/drei";
import { useShedTexturesContext } from "../../../context/ShedTextureContext";
import shedData from "../../../shedData.json";

const EAVE_OVERHANG = 4;
const SIDE_OVERHANG = 2;
const FASCIA_HEIGHT = 5;
const FASCIA_THICKNESS = 1;
const RAFTER_SPACING = 24;
const RAFTER_W = 2;
const RAFTER_T = 3;

const PentRoof = ({ width: floorWidth, depth: floorDepth, opacity = 1, showFraming = false }) => {
  const { size, wallHeightType } = useConfigurator();
  const { roofFelt } = useShedTexturesContext();

  const wallHeight = shedData.wall_heights[wallHeightType];
  const frontHeight = shedData.pent_roof_dims[size.width]?.front || (wallHeight + 6);
  const backHeight = wallHeight;
  const roofThickness = 4;
  const angle = Math.atan((frontHeight - backHeight) / floorDepth);
  const midHeight = (frontHeight + backHeight) / 2;
  const roofW = floorWidth + EAVE_OVERHANG * 2 + SIDE_OVERHANG * 2;
  const roofD = floorDepth + EAVE_OVERHANG * 2;

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
    };
    if (!roofFelt) return <meshStandardMaterial {...matProps} />;
    const tex = roofFelt.clone();
    tex.repeat.set(roofW / 24, roofD / 24);
    return <meshStandardMaterial {...matProps} map={tex} />;
  }, [roofFelt, roofW, roofD, opacity]);

  const WARM_CEDAR = "#e0b890";
  const fasciaMat = <meshStandardMaterial color={WARM_CEDAR} roughness={0.75} metalness={0.02} transparent={opacity < 1} opacity={opacity} depthWrite={opacity >= 1} />;
  const numRafters = Math.floor(roofW / RAFTER_SPACING) + 1;

  return (
    <group position={[0, midHeight, 0]} rotation={[angle, 0, 0]}>
      <Box args={[roofW, roofThickness, roofD]} castShadow receiveShadow>{roofMat}</Box>
      <Box args={[roofW + FASCIA_THICKNESS * 2, FASCIA_HEIGHT, FASCIA_THICKNESS]} position={[0, roofThickness / 2 + FASCIA_HEIGHT / 2, -roofD / 2]} castShadow>{fasciaMat}</Box>
      <Box args={[roofW + FASCIA_THICKNESS * 2, FASCIA_HEIGHT, FASCIA_THICKNESS]} position={[0, roofThickness / 2 + FASCIA_HEIGHT / 2, roofD / 2]} castShadow>{fasciaMat}</Box>
      {showFraming && Array.from({ length: numRafters }).map((_, i) => (
        <Box key={i} args={[RAFTER_T, RAFTER_W, roofD]} position={[-roofW / 2 + i * RAFTER_SPACING, roofThickness / 2, 0]} castShadow>
          {fasciaMat}
        </Box>
      ))}
    </group>
  );
};

export default PentRoof;
