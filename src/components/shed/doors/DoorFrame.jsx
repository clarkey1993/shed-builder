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
// Customer-facing render: slimmer frame so door reads closer to nominal width (build/spec unchanged).
const VISUAL_STUD_WIDTH = 1.5;
const VISUAL_TRIM_OFFSET = 0.25;
const DOOR_BOARD_WIDTH = 4;
const DOOR_BOARD_THICKNESS = 0.65;
const DOOR_PANEL_Z = 0.35;
const LIGHT_CEDAR = "#e0b890"; // Warm timber, matches wall cladding
const COLOR_VARIATION = 0.05;
// Double-with-windows: glazed section per leaf (upper part)
const GLAZE_TOP_INSET = 2;
const GLAZE_HEIGHT = 22;
const GLAZE_SIDE_INSET = 2;
const GLAZE_FRAME_RAIL = 2;
const GLAZE_FRAME_STILE = 2;
const GLAZE_INSET = 1;
const GLAZING_COLOR = "#f5f5f0";

const metalMat = <meshStandardMaterial color="#9ca3af" roughness={0.85} metalness={0.6} />;

function variedCedarColor(index) {
  const base = new THREE.Color(LIGHT_CEDAR);
  const shade = 1.02 + (Math.sin(index * 2.3) * 0.5 + 0.5) * COLOR_VARIATION * 2 - COLOR_VARIATION;
  return base.clone().multiplyScalar(shade).getStyle();
}

const DoorFrame = ({ doorType, wallHeight, doorWidth: doorWidthProp, doorHeight: doorHeightProp, trimMat, exteriorZSign = 1, isTrapezoidWall = false, doorBottomY: doorBottomYProp }) => {
  const { wallHeightType, shedConfig } = useConfigurator();
  const topPlateThickness = shedConfig.framing.upright_middles_thickness_x;
  const dims = getDoorDimensions({
    doorType,
    wallHeightType: wallHeightType || "standard",
    wallHeight,
    topPlateThickness,
  });
  const doorWidth = doorWidthProp ?? dims.width;
  const doorHeight = doorHeightProp ?? dims.height;
  const doorBottom = typeof doorBottomYProp === "number" ? doorBottomYProp : -wallHeight / 2;
  const doorTop = doorBottom + doorHeight;
  const doorCenterY = doorBottom + doorHeight / 2;

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
  const fullW = doorWidth + VISUAL_STUD_WIDTH * 2 + VISUAL_TRIM_OFFSET * 2;
  const panelZ = DOOR_PANEL_Z * exteriorZSign;
  const trimZ = (0.25 + TRIM_T / 2) * exteriorZSign;
  const hingeZ = 0.3 * exteriorZSign;

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

  const isDoubleWithWindows = doorType === "double_with_windows";
  const leafWidth = doorWidth / 2;
  const glazeCenterY = doorCenterY + doorHeight / 2 - GLAZE_TOP_INSET - GLAZE_HEIGHT / 2;
  const glazeOuterW = leafWidth - GLAZE_SIDE_INSET * 2;
  const glazeOuterH = GLAZE_HEIGHT;
  const glassW = glazeOuterW - GLAZE_FRAME_STILE * 2 - GLAZE_INSET * 2;
  const glassH = GLAZE_HEIGHT - GLAZE_FRAME_RAIL * 2 - GLAZE_INSET * 2;
  const glazeZ = panelZ + 0.04 * exteriorZSign;

  const leftLeafBoardPositions = useMemo(() => {
    if (!isDoubleWithWindows) return [];
    const numBoards = Math.max(1, Math.ceil(leafWidth / DOOR_BOARD_WIDTH));
    const positions = [];
    for (let i = 0; i < numBoards; i++) {
      const x = numBoards === 1 ? 0 : -leafWidth / 2 + DOOR_BOARD_WIDTH / 2 + (i / (numBoards - 1)) * (leafWidth - DOOR_BOARD_WIDTH);
      positions.push(x);
    }
    return positions;
  }, [isDoubleWithWindows, leafWidth]);

  return (
    <group>
      {/* Door panel(s): single slab for single/stable/double; two leaves + glazing for double_with_windows */}
      {isDoubleWithWindows ? (
        <>
          {/* Left leaf - boards */}
          {leftLeafBoardPositions.map((lx, i) => (
            <Box
              key={`left-${i}`}
              args={[DOOR_BOARD_WIDTH, doorHeight, DOOR_BOARD_THICKNESS]}
              position={[-doorWidth / 4 + lx, doorCenterY, panelZ]}
              castShadow
            >
              {doorBoardMats[i % doorBoardMats.length]}
            </Box>
          ))}
          {/* Right leaf - boards */}
          {leftLeafBoardPositions.map((lx, i) => (
            <Box
              key={`right-${i}`}
              args={[DOOR_BOARD_WIDTH, doorHeight, DOOR_BOARD_THICKNESS]}
              position={[doorWidth / 4 + lx, doorCenterY, panelZ]}
              castShadow
            >
              {doorBoardMats[(i + 2) % doorBoardMats.length]}
            </Box>
          ))}
          {/* Left leaf - upper glazed section (frame + glass) */}
          <group position={[-doorWidth / 4, glazeCenterY, glazeZ]}>
            <Box args={[glazeOuterW + GLAZE_FRAME_STILE * 2, GLAZE_HEIGHT + GLAZE_FRAME_RAIL * 2, DOOR_BOARD_THICKNESS]} position={[0, 0, 0]} castShadow>
              {framingMat}
            </Box>
            <Box args={[glassW, glassH, 0.08]} position={[0, 0, 0.02]} castShadow>
              <meshStandardMaterial color={GLAZING_COLOR} roughness={0.4} metalness={0.02} />
            </Box>
          </group>
          {/* Right leaf - upper glazed section (frame + glass) */}
          <group position={[doorWidth / 4, glazeCenterY, glazeZ]}>
            <Box args={[glazeOuterW + GLAZE_FRAME_STILE * 2, GLAZE_HEIGHT + GLAZE_FRAME_RAIL * 2, DOOR_BOARD_THICKNESS]} position={[0, 0, 0]} castShadow>
              {framingMat}
            </Box>
            <Box args={[glassW, glassH, 0.08]} position={[0, 0, 0.02]} castShadow>
              <meshStandardMaterial color={GLAZING_COLOR} roughness={0.4} metalness={0.02} />
            </Box>
          </group>
        </>
      ) : (
        doorBoardPositions.map((x, i) => (
          <Box
            key={i}
            args={[DOOR_BOARD_WIDTH, doorHeight, DOOR_BOARD_THICKNESS]}
            position={[x, doorCenterY, panelZ]}
            castShadow
          >
            {doorBoardMats[i]}
          </Box>
        ))
      )}
      {!isTrapezoidWall && (
        <Box args={[doorWidth + VISUAL_STUD_WIDTH * 2, VISUAL_STUD_WIDTH * 2, STUD_THICKNESS]} position={[0, doorHeight / 2, 0]} castShadow>
          {framingMat}
        </Box>
      )}
      <Box args={[VISUAL_STUD_WIDTH, doorHeight, STUD_THICKNESS]} position={[-doorWidth / 2 - VISUAL_STUD_WIDTH / 2, doorCenterY, 0]} castShadow>
        {framingMat}
      </Box>
      <Box args={[VISUAL_STUD_WIDTH, doorHeight, STUD_THICKNESS]} position={[doorWidth / 2 + VISUAL_STUD_WIDTH / 2, doorCenterY, 0]} castShadow>
        {framingMat}
      </Box>
      {!isTrapezoidWall && (
        <>
          <Box args={[VISUAL_STUD_WIDTH, wallHeight - VISUAL_STUD_WIDTH * 2, STUD_THICKNESS]} position={[-doorWidth / 2 - VISUAL_STUD_WIDTH * 1.5, 0, 0]} castShadow>
            {framingMat}
          </Box>
          <Box args={[VISUAL_STUD_WIDTH, wallHeight - VISUAL_STUD_WIDTH * 2, STUD_THICKNESS]} position={[doorWidth / 2 + VISUAL_STUD_WIDTH * 1.5, 0, 0]} castShadow>
            {framingMat}
          </Box>
        </>
      )}
      {!isTrapezoidWall && (
        <Box args={[fullW, TRIM_W, TRIM_T]} position={[0, doorTop + TRIM_W / 2, trimZ]} castShadow>
          {trim}
        </Box>
      )}
      <Box args={[TRIM_W, doorHeight + VISUAL_TRIM_OFFSET * 2, TRIM_T]} position={[-doorWidth / 2 - VISUAL_STUD_WIDTH - VISUAL_TRIM_OFFSET - TRIM_W / 2, doorCenterY, trimZ]} castShadow>
        {trim}
      </Box>
      <Box args={[TRIM_W, doorHeight + VISUAL_TRIM_OFFSET * 2, TRIM_T]} position={[doorWidth / 2 + VISUAL_STUD_WIDTH + VISUAL_TRIM_OFFSET + TRIM_W / 2, doorCenterY, trimZ]} castShadow>
        {trim}
      </Box>
      <Box args={[fullW, TRIM_W, TRIM_T]} position={[0, doorBottom - TRIM_W / 2, trimZ]} castShadow>
        {trim}
      </Box>
      {[
        { y: doorTop - 4, h: 8 },
        { y: doorCenterY, h: 10 },
        { y: doorBottom + 4, h: 8 },
      ].map(({ y, h }, i) => (
        <group key={`hinge-l-${i}`} position={[-doorWidth / 2 - VISUAL_STUD_WIDTH / 2 - 0.2, y, hingeZ]}>
          <Box args={[1.5, h, 0.3]} castShadow>{metalMat}</Box>
          <Box args={[4, 1.5, 0.3]} position={[2, -h / 2, 0]} castShadow>{metalMat}</Box>
        </group>
      ))}
      {isDoubleWithWindows && [
        { y: doorTop - 4, h: 8 },
        { y: doorCenterY, h: 10 },
        { y: doorBottom + 4, h: 8 },
      ].map(({ y, h }, i) => (
        <group key={`hinge-r-${i}`} position={[doorWidth / 2 + VISUAL_STUD_WIDTH / 2 + 0.2, y, hingeZ]}>
          <Box args={[1.5, h, 0.3]} castShadow>{metalMat}</Box>
          <Box args={[4, 1.5, 0.3]} position={[-2, -h / 2, 0]} castShadow>{metalMat}</Box>
        </group>
      ))}
      <group position={[doorWidth / 2 + VISUAL_STUD_WIDTH / 2 + 0.2, doorCenterY - 8, hingeZ]}>
        <Box args={[2, 6, 0.4]} castShadow>{metalMat}</Box>
        <Cylinder args={[1.5, 1.5, 0.5, 8]} rotation={[0, 0, Math.PI / 2]} castShadow>{metalMat}</Cylinder>
      </group>
    </group>
  );
};

export default DoorFrame;
