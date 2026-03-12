/**
 * InternalPartitionDoor - 31" single door on internal partition.
 * Fixed to partition; moves when partition moves.
 */
import { Box } from "@react-three/drei";
import { useShedTexturesContext } from "../../context/ShedTextureContext";

const DOOR_WIDTH = 31;
const DOOR_HEIGHT = 6 * 12;
const STUD_WIDTH = 3;
const TRIM_W = 2;
const TRIM_T = 1;
const TRIM_COLOR = "#c49a6c";

const InternalPartitionDoor = ({ doorOffset, partitionLength, wallHeight }) => {
  const { woodFraming } = useShedTexturesContext();

  const framingMat = woodFraming ? (
    <meshStandardMaterial map={woodFraming} roughness={0.65} metalness={0} color="#b06500" />
  ) : (
    <meshStandardMaterial color="#b06500" roughness={0.65} />
  );
  const trimMat = woodFraming ? (
    <meshStandardMaterial map={woodFraming} roughness={0.7} metalness={0} color={TRIM_COLOR} />
  ) : (
    <meshStandardMaterial color={TRIM_COLOR} roughness={0.7} />
  );

  const doorTop = -wallHeight / 2 + DOOR_HEIGHT;
  const doorBottom = -wallHeight / 2;
  const fullW = DOOR_WIDTH + STUD_WIDTH * 2 + 0.5 * 2;

  return (
    <group position={[doorOffset, 0, 0]}>
      <Box args={[DOOR_WIDTH + STUD_WIDTH * 2, STUD_WIDTH * 2, 2]} position={[0, DOOR_HEIGHT / 2, 0]} castShadow>
        {framingMat}
      </Box>
      <Box args={[STUD_WIDTH, DOOR_HEIGHT, 2]} position={[-DOOR_WIDTH / 2 - STUD_WIDTH / 2, -wallHeight / 2 + DOOR_HEIGHT / 2, 0]} castShadow>
        {framingMat}
      </Box>
      <Box args={[STUD_WIDTH, DOOR_HEIGHT, 2]} position={[DOOR_WIDTH / 2 + STUD_WIDTH / 2, -wallHeight / 2 + DOOR_HEIGHT / 2, 0]} castShadow>
        {framingMat}
      </Box>
      <Box args={[STUD_WIDTH, wallHeight - STUD_WIDTH * 2, 2]} position={[-DOOR_WIDTH / 2 - STUD_WIDTH * 1.5, 0, 0]} castShadow>
        {framingMat}
      </Box>
      <Box args={[STUD_WIDTH, wallHeight - STUD_WIDTH * 2, 2]} position={[DOOR_WIDTH / 2 + STUD_WIDTH * 1.5, 0, 0]} castShadow>
        {framingMat}
      </Box>

      <Box args={[fullW, TRIM_W, TRIM_T]} position={[0, doorTop + TRIM_W / 2, 0.25 + TRIM_T / 2]} castShadow>
        {trimMat}
      </Box>
      <Box args={[TRIM_W, DOOR_HEIGHT + 1, TRIM_T]} position={[-DOOR_WIDTH / 2 - STUD_WIDTH - 0.5 - TRIM_W / 2, -wallHeight / 2 + DOOR_HEIGHT / 2, 0.25 + TRIM_T / 2]} castShadow>
        {trimMat}
      </Box>
      <Box args={[TRIM_W, DOOR_HEIGHT + 1, TRIM_T]} position={[DOOR_WIDTH / 2 + STUD_WIDTH + 0.5 + TRIM_W / 2, -wallHeight / 2 + DOOR_HEIGHT / 2, 0.25 + TRIM_T / 2]} castShadow>
        {trimMat}
      </Box>
      <Box args={[fullW, TRIM_W, TRIM_T]} position={[0, doorBottom - TRIM_W / 2, 0.25 + TRIM_T / 2]} castShadow>
        {trimMat}
      </Box>
    </group>
  );
};

export default InternalPartitionDoor;
