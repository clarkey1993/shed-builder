import { useMemo } from "react";
import * as THREE from "three";
import { Box, Cylinder } from "@react-three/drei";
import { useConfigurator } from "../../../context/ConfiguratorContext";
import { getDoorDimensions } from "../../../systems/openings/getOpeningDimensions";

const STUD_THICKNESS = 2;
const STUD_WIDTH = 3;
const TRIM_W = 2;
const TRIM_T = 1;
const TRIM_OFFSET = 0.5;
const DOOR_BOARD_WIDTH = 4;
const DOOR_BOARD_THICKNESS = 0.6;
const DOOR_PANEL_Z = 0.35;
const LIGHT_CEDAR = "#e0b890"; // Warm timber, matches wall cladding
const COLOR_VARIATION = 0.05;

const metalMat = <meshStandardMaterial color="#9ca3af" roughness={0.85} metalness={0.6} />;

function variedCedarColor(index) {
  const base = new THREE.Color(LIGHT_CEDAR);
  const shade = 1.02 + (Math.sin(index * 2.3) * 0.5 + 0.5) * COLOR_VARIATION * 2 - COLOR_VARIATION;
  return base.clone().multiplyScalar(shade).getStyle();
}

const DoorFrame = ({ doorType, wallHeight, trimMat }) => {
  const { wallHeightType } = useConfigurator();
  const { width: doorWidth, height: doorHeight } = getDoorDimensions({
    doorType,
    wallHeightType: wallHeightType || "standard",
    wallHeight,
  });
  const doorTop = -wallHeight / 2 + doorHeight;
  const doorBottom = -wallHeight / 2;
  const doorCenterY = -wallHeight / 2 + doorHeight / 2;

  // Color-only framing to match wall timber; texture was darkening
  const framingMat = <meshStandardMaterial color={LIGHT_CEDAR} roughness={0.75} metalness={0.02} />;

  const doorBoardMats = useMemo(() => {
    const numBoards = Math.max(1, Math.ceil(doorWidth / DOOR_BOARD_WIDTH));
    const mats = [];
    for (let i = 0; i < numBoards; i++) {
      const color = variedCedarColor(i);
      mats.push(<meshStandardMaterial key={i} roughness={0.75} metalness={0.02} color={color} />);
    }
    return mats;
  }, [doorWidth, doorHeight]);

  const trim = trimMat || framingMat;
  const fullW = doorWidth + STUD_WIDTH * 2 + TRIM_OFFSET * 2;

  const doorBoardPositions = useMemo(() => {
    const numBoards = Math.max(1, Math.ceil(doorWidth / DOOR_BOARD_WIDTH));
    const positions = [];
    for (let i = 0; i < numBoards; i++) {
      const x = numBoards === 1
        ? 0
        : -doorWidth / 2 + DOOR_BOARD_WIDTH / 2 + (i / (numBoards - 1)) * (doorWidth - DOOR_BOARD_WIDTH);
      positions.push(x);
    }
    return positions;
  }, [doorWidth]);

  return (
    <group>
      {/* Vertical door boards - door panel */}
      {doorBoardPositions.map((x, i) => (
        <Box
          key={i}
          args={[DOOR_BOARD_WIDTH, doorHeight, DOOR_BOARD_THICKNESS]}
          position={[x, doorCenterY, DOOR_PANEL_Z]}
          castShadow
        >
          {doorBoardMats[i]}
        </Box>
      ))}
      <Box args={[doorWidth + STUD_WIDTH * 2, STUD_WIDTH * 2, STUD_THICKNESS]} position={[0, doorHeight / 2, 0]} castShadow>
        {framingMat}
      </Box>
      <Box args={[STUD_WIDTH, doorHeight, STUD_THICKNESS]} position={[-doorWidth / 2 - STUD_WIDTH / 2, -wallHeight / 2 + doorHeight / 2, 0]} castShadow>
        {framingMat}
      </Box>
      <Box args={[STUD_WIDTH, doorHeight, STUD_THICKNESS]} position={[doorWidth / 2 + STUD_WIDTH / 2, -wallHeight / 2 + doorHeight / 2, 0]} castShadow>
        {framingMat}
      </Box>
      <Box args={[STUD_WIDTH, wallHeight - STUD_WIDTH * 2, STUD_THICKNESS]} position={[-doorWidth / 2 - STUD_WIDTH * 1.5, 0, 0]} castShadow>
        {framingMat}
      </Box>
      <Box args={[STUD_WIDTH, wallHeight - STUD_WIDTH * 2, STUD_THICKNESS]} position={[doorWidth / 2 + STUD_WIDTH * 1.5, 0, 0]} castShadow>
        {framingMat}
      </Box>
      <Box args={[fullW, TRIM_W, TRIM_T]} position={[0, doorTop + TRIM_W / 2, 0.25 + TRIM_T / 2]} castShadow>
        {trim}
      </Box>
      <Box args={[TRIM_W, doorHeight + TRIM_OFFSET * 2, TRIM_T]} position={[-doorWidth / 2 - STUD_WIDTH - TRIM_OFFSET - TRIM_W / 2, -wallHeight / 2 + doorHeight / 2, 0.25 + TRIM_T / 2]} castShadow>
        {trim}
      </Box>
      <Box args={[TRIM_W, doorHeight + TRIM_OFFSET * 2, TRIM_T]} position={[doorWidth / 2 + STUD_WIDTH + TRIM_OFFSET + TRIM_W / 2, -wallHeight / 2 + doorHeight / 2, 0.25 + TRIM_T / 2]} castShadow>
        {trim}
      </Box>
      <Box args={[fullW, TRIM_W, TRIM_T]} position={[0, doorBottom - TRIM_W / 2, 0.25 + TRIM_T / 2]} castShadow>
        {trim}
      </Box>
      {[
        { y: doorTop - 4, h: 8 },
        { y: -wallHeight / 2 + doorHeight / 2, h: 10 },
        { y: doorBottom + 4, h: 8 },
      ].map(({ y, h }, i) => (
        <group key={i} position={[-doorWidth / 2 - STUD_WIDTH / 2 - 0.2, y, 0.3]}>
          <Box args={[1.5, h, 0.3]} castShadow>{metalMat}</Box>
          <Box args={[4, 1.5, 0.3]} position={[2, -h / 2, 0]} castShadow>{metalMat}</Box>
        </group>
      ))}
      <group position={[doorWidth / 2 + STUD_WIDTH / 2 + 0.2, -wallHeight / 2 + doorHeight / 2 - 8, 0.3]}>
        <Box args={[2, 6, 0.4]} castShadow>{metalMat}</Box>
        <Cylinder args={[1.5, 1.5, 0.5, 8]} rotation={[0, 0, Math.PI / 2]} castShadow>{metalMat}</Cylinder>
      </group>
    </group>
  );
};

export default DoorFrame;
