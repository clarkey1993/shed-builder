import { Box, Cylinder } from "@react-three/drei";
import { useConfigurator } from "../../../context/ConfiguratorContext";
import { useShedTexturesContext } from "../../../context/ShedTextureContext";
import shedData from "../../../shedData.json";

const STUD_THICKNESS = 2;
const STUD_WIDTH = 3;
const TRIM_W = 2;
const TRIM_T = 1;
const TRIM_OFFSET = 0.5;

const metalMat = <meshStandardMaterial color="#9ca3af" roughness={0.85} metalness={0.6} />;

const DoorFrame = ({ doorType, wallHeight, trimMat }) => {
  const { wallHeightType } = useConfigurator();
  const { woodFraming } = useShedTexturesContext();
  const doorWidth = shedData.door_widths[doorType][wallHeightType];
  const doorHeight = 6 * 12;
  const doorTop = -wallHeight / 2 + doorHeight;
  const doorBottom = -wallHeight / 2;

  const framingMat = woodFraming ? (
    <meshStandardMaterial map={woodFraming} roughness={0.65} metalness={0.1} color="#b06500" />
  ) : (
    <meshStandardMaterial color="#b06500" roughness={0.65} metalness={0.1} />
  );

  const trim = trimMat || framingMat;
  const fullW = doorWidth + STUD_WIDTH * 2 + TRIM_OFFSET * 2;

  return (
    <group>
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
