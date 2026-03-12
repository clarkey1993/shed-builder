/**
 * DebugDimensionLabels - Optional labels for wall height, window size, door width.
 * Only visible when showDimensions is enabled (debug toggle).
 */
import { Text } from "@react-three/drei";
import { useConfigurator } from "../../context/ConfiguratorContext";
import { useBuilder } from "../../context/BuilderContext";
import { getWindowDimensions, getDoorDimensions } from "../../systems/openings/getOpeningDimensions";

const FONT_SIZE = 0.2;
const COLOR = "#333";

export default function DebugDimensionLabels() {
  const { shedConfig, doorType, wallHeightType } = useConfigurator();
  const { showDimensions } = useBuilder();

  if (!showDimensions) return null;

  const wallHeight = shedConfig.wallHeight;
  const floorWidth = shedConfig.width / 12;
  const floorDepth = shedConfig.depth / 12;
  const { width: windowW, height: windowH } = getWindowDimensions("STANDARD");
  const doorDims = doorType && doorType !== "none"
    ? getDoorDimensions({ doorType, wallHeightType: wallHeightType || "standard", wallHeight })
    : null;
  const doorWidth = doorDims?.width ?? 0;

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
