/**
 * InternalPartition - Partition wall with shiplap and 2x2 framing.
 * Snaps to 24" stud grid. Same specs as main walls.
 */
import { useMemo, useRef } from "react";
import { Box } from "@react-three/drei";
import { useConfigurator } from "../../context/ConfiguratorContext";
import { useShedTexturesContext } from "../../context/ShedTextureContext";
import InternalPartitionDoor from "./InternalPartitionDoor";
import { getDoorDimensions } from "../../systems/openings/getOpeningDimensions";

// Bramwood rule reference: see src/config/shedRules.js
// Framing studSpacing 24". Cladding boardWidth 5", visibleCoverage 4".
const GAP = 0.25;
const BOARD_WIDTH = 5.5;
const BOARD_THICKNESS = 0.5;
const STUD_SPACING = 24;
const FRAMING_X = 2;
const FRAMING_Y = 2;

const InternalPartition = ({ partition, floorWidth, floorDepth, wallHeight }) => {
  const groupRef = useRef();
  const { wallHeightType } = useConfigurator();
  const { woodCladding, woodFraming } = useShedTexturesContext();
  const doorWidth = getDoorDimensions({
    doorType: "single",
    wallHeightType: wallHeightType || "standard",
    wallHeight,
  }).width;

  const { axis, studIndex, hasDoor, doorOffset } = partition;

  const isAlongX = axis === "x";
  const length = isAlongX ? floorWidth : floorDepth;
  const perpPos = isAlongX
    ? -floorDepth / 2 + studIndex * STUD_SPACING
    : -floorWidth / 2 + studIndex * STUD_SPACING;

  const position = isAlongX ? [0, wallHeight / 2, perpPos] : [perpPos, wallHeight / 2, 0];
  const rotation = isAlongX ? [0, 0, 0] : [0, Math.PI / 2, 0];

  const plateThickness = FRAMING_X;
  const studHeight = wallHeight - plateThickness * 2;

  const numStuds = Math.floor(length / STUD_SPACING) + 1;
  const actualSpacing = length / (numStuds - 1);
  const studPositions = useMemo(() => {
    const pos = [];
    for (let i = 0; i < numStuds; i++) {
      pos.push(-length / 2 + i * actualSpacing);
    }
    return pos;
  }, [numStuds, actualSpacing, length]);

  const claddingPositions = useMemo(() => {
    const positions = [];
    const step = BOARD_WIDTH + GAP;
    for (let x = -length / 2 + BOARD_WIDTH / 2; x <= length / 2 - BOARD_WIDTH / 2; x += step) {
      const inDoor = hasDoor && doorOffset != null && Math.abs(x - doorOffset) < doorWidth / 2 + BOARD_WIDTH / 2;
      if (!inDoor) positions.push(x);
    }
    return positions;
  }, [length, hasDoor, doorOffset, doorWidth]);

  const claddingMat = useMemo(() => {
    if (!woodCladding) return <meshStandardMaterial color="#B5651D" roughness={0.7} metalness={0} />;
    const tex = woodCladding.clone();
    tex.repeat.set(length / 24, studHeight / 24);
    return <meshStandardMaterial map={tex} roughness={0.7} metalness={0} color="#B5651D" />;
  }, [woodCladding, studHeight, length]);

  const framingMat = woodFraming ? (
    <meshStandardMaterial map={woodFraming} roughness={0.7} metalness={0} color="#8b4513" />
  ) : (
    <meshStandardMaterial color="#8B4513" roughness={0.7} />
  );

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      <Box args={[length, plateThickness, plateThickness]} position={[0, wallHeight / 2 - plateThickness / 2, 0]} castShadow>
        {framingMat}
      </Box>
      <Box args={[length, plateThickness, plateThickness]} position={[0, -wallHeight / 2 + plateThickness / 2, 0]} castShadow>
        {framingMat}
      </Box>

      {claddingPositions.map((x, i) => (
        <Box
          key={i}
          args={[BOARD_WIDTH, studHeight, BOARD_THICKNESS]}
          position={[x + ((i % 5) * 0.02 - 0.04), 0, -0.25]}
          castShadow
          receiveShadow
        >
          {claddingMat}
        </Box>
      ))}

      {studPositions.map((sx, i) => (
        <Box key={i} args={[FRAMING_X, studHeight, FRAMING_Y]} position={[sx, 0, 0]} castShadow>
          {framingMat}
        </Box>
      ))}

      {hasDoor && doorOffset != null && (
        <InternalPartitionDoor
          doorOffset={doorOffset}
          partitionLength={length}
          wallHeight={wallHeight}
        />
      )}
    </group>
  );
};

export default InternalPartition;
