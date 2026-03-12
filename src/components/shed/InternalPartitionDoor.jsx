/**
 * InternalPartitionDoor - Single door on internal partition.
 * Uses getDoorDimensions for Bramwood-consistent dimensions.
 * Fixed to partition; moves when partition moves.
 */
import { Box } from "@react-three/drei";
import { useConfigurator } from "../../context/ConfiguratorContext";
import { useShedTexturesContext } from "../../context/ShedTextureContext";
import { getDoorDimensions } from "../../systems/openings/getOpeningDimensions";

const WARM_CEDAR = "#e0b890";
const STUD_WIDTH = 3;
const TRIM_W = 2;
const TRIM_T = 1;

const InternalPartitionDoor = ({ doorOffset, partitionLength, wallHeight }) => {
  const { wallHeightType } = useConfigurator();
  const { woodFraming } = useShedTexturesContext();
  const { width: doorWidth, height: doorHeight } = getDoorDimensions({
    doorType: "single",
    wallHeightType: wallHeightType || "standard",
    wallHeight,
  });

  const framingMat = woodFraming ? (
    <meshStandardMaterial map={woodFraming} roughness={0.7} metalness={0.05} color={WARM_CEDAR} />
  ) : (
    <meshStandardMaterial color={WARM_CEDAR} roughness={0.7} />
  );
  const trimMat = woodFraming ? (
    <meshStandardMaterial map={woodFraming} roughness={0.75} metalness={0.05} color={WARM_CEDAR} />
  ) : (
    <meshStandardMaterial color={WARM_CEDAR} roughness={0.75} />
  );

  const doorTop = -wallHeight / 2 + doorHeight;
  const doorBottom = -wallHeight / 2;
  const fullW = doorWidth + STUD_WIDTH * 2 + 0.5 * 2;

  return (
    <group position={[doorOffset, 0, 0]}>
      <Box args={[doorWidth + STUD_WIDTH * 2, STUD_WIDTH * 2, 2]} position={[0, doorHeight / 2, 0]} castShadow>
        {framingMat}
      </Box>
      <Box args={[STUD_WIDTH, doorHeight, 2]} position={[-doorWidth / 2 - STUD_WIDTH / 2, -wallHeight / 2 + doorHeight / 2, 0]} castShadow>
        {framingMat}
      </Box>
      <Box args={[STUD_WIDTH, doorHeight, 2]} position={[doorWidth / 2 + STUD_WIDTH / 2, -wallHeight / 2 + doorHeight / 2, 0]} castShadow>
        {framingMat}
      </Box>
      <Box args={[STUD_WIDTH, wallHeight - STUD_WIDTH * 2, 2]} position={[-doorWidth / 2 - STUD_WIDTH * 1.5, 0, 0]} castShadow>
        {framingMat}
      </Box>
      <Box args={[STUD_WIDTH, wallHeight - STUD_WIDTH * 2, 2]} position={[doorWidth / 2 + STUD_WIDTH * 1.5, 0, 0]} castShadow>
        {framingMat}
      </Box>

      <Box args={[fullW, TRIM_W, TRIM_T]} position={[0, doorTop + TRIM_W / 2, 0.25 + TRIM_T / 2]} castShadow>
        {trimMat}
      </Box>
      <Box args={[TRIM_W, doorHeight + 1, TRIM_T]} position={[-doorWidth / 2 - STUD_WIDTH - 0.5 - TRIM_W / 2, -wallHeight / 2 + doorHeight / 2, 0.25 + TRIM_T / 2]} castShadow>
        {trimMat}
      </Box>
      <Box args={[TRIM_W, doorHeight + 1, TRIM_T]} position={[doorWidth / 2 + STUD_WIDTH + 0.5 + TRIM_W / 2, -wallHeight / 2 + doorHeight / 2, 0.25 + TRIM_T / 2]} castShadow>
        {trimMat}
      </Box>
      <Box args={[fullW, TRIM_W, TRIM_T]} position={[0, doorBottom - TRIM_W / 2, 0.25 + TRIM_T / 2]} castShadow>
        {trimMat}
      </Box>
    </group>
  );
};

export default InternalPartitionDoor;
