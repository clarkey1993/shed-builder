/**
 * DebugDimensionLabels - Optional labels for wall height, window size, door width.
 * Only visible when showDimensions is enabled (debug toggle).
 */
import { Text } from "@react-three/drei";
import { useConfigurator } from "../../context/ConfiguratorContext";
import { useBuilder } from "../../context/BuilderContext";
import shedData from "../../shedData.json";

const FONT_SIZE = 0.2;
const COLOR = "#333";

export default function DebugDimensionLabels() {
  const { shedConfig, size, doorType, windowPositions } = useConfigurator();
  const { showDimensions } = useBuilder();

  if (!showDimensions) return null;

  const wallHeight = shedConfig.wallHeight;
  const floorWidth = shedConfig.width / 12;
  const floorDepth = shedConfig.depth / 12;
  const doorWidth = doorType && doorType !== "none" ? shedData.door_widths[doorType]?.standard : 0;
  const windowW = 22;
  const windowH = 36;

  return (
    <group>
      <Text
        position={[-floorWidth / 2 - 0.8, wallHeight / 12 / 2, 0]}
        fontSize={FONT_SIZE}
        color={COLOR}
        anchorX="center"
        anchorY="middle"
      >
        {`Wall: ${wallHeight}"`}
      </Text>
      <Text
        position={[0, wallHeight / 12 / 2 + 0.3, -floorDepth / 2 - 0.4]}
        fontSize={FONT_SIZE}
        color={COLOR}
        anchorX="center"
        anchorY="middle"
      >
        {`Window: ${windowW}"×${windowH}"`}
      </Text>
      {doorWidth > 0 && (
        <Text
          position={[0.6, wallHeight / 12 / 2 - 0.2, -floorDepth / 2 - 0.4]}
          fontSize={FONT_SIZE}
          color={COLOR}
          anchorX="center"
          anchorY="middle"
        >
          {`Door: ${doorWidth}"`}
        </Text>
      )}
    </group>
  );
}
