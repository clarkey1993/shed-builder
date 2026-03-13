import { Box, RoundedBoxGeometry } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useConfigurator } from "../../../context/ConfiguratorContext";
import { useBuilder } from "../../../context/BuilderContext";
import { useShedTexturesContext } from "../../../context/ShedTextureContext";
import { getWindowDimensions, getDoorDimensions } from "../../../systems/openings/getOpeningDimensions";
import DoorFrame from "../doors/DoorFrame";
import Window from "../windows/Window";
import WallGrid from "../grid/WallGrid";
import Shiplap from "../cladding/Shiplap";
import WallFraming from "../framing/WallFraming";

const WARM_CEDAR = "#e0b890";

const Wall = ({
  wallId,
  width,
  height,
  position,
  rotation,
  windowPositions = [],
  hasDoor,
  doorType,
  claddingOpacity = 1,
  exteriorZSign = 1,
}) => {
  const wallGroupRef = useRef();
  const dragPlaneRef = useRef();
  const { shedConfig, setWindowPosition, windowTypes = {}, wallHeightType } = useConfigurator();
  const { selectedElementId, showFraming, debugShowDragPlanes } = useBuilder();
  const { woodFraming } = useShedTexturesContext();

  const doorDims = hasDoor && doorType !== "none"
    ? getDoorDimensions({ doorType, wallHeightType: wallHeightType || "standard", wallHeight: height })
    : null;
  const doorHalfWidth = doorDims ? doorDims.width / 2 : 0;
  const plateThickness = shedConfig.framing.upright_middles_thickness_x;
  const framingZOffset = -exteriorZSign * (plateThickness / 2 + 0.75);
  const trimMat = <meshStandardMaterial color={WARM_CEDAR} roughness={0.75} metalness={0.02} />;

  const showWallGrid = selectedElementId !== null && selectedElementId.startsWith(`window-${wallId}-`);

  const BOARD_HEIGHT = 5;
  const windowsForFraming = useMemo(
    () => windowPositions.map((x, i) => {
      const type = (windowTypes[wallId] || [])[i] || "STANDARD";
      const dims = getWindowDimensions(type);
      const windowTop = height / 2 - BOARD_HEIGHT;
      const centerY = windowTop - dims.height / 2;
      return { x, y: centerY, width: dims.width, height: dims.height };
    }),
    [windowPositions, windowTypes, wallId, height]
  );
  const doorsForFraming = useMemo(() => {
    if (!doorDims) return [];
    return [{ x: 0, width: doorDims.width, height: doorDims.height }];
  }, [doorDims]);

  return (
    <group ref={wallGroupRef} position={position} rotation={rotation}>
      <WallGrid wallId={wallId} width={width} height={height} visible={showWallGrid} />
      <mesh ref={dragPlaneRef} position={[0, 0, 0.2 * exteriorZSign]}>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial
          side={THREE.DoubleSide}
          color="#3388ff"
          transparent
          opacity={debugShowDragPlanes ? 0.25 : 0}
          depthWrite={false}
        />
      </mesh>

      {/* Framing overlay: plates + studs on interior face, only when showFraming */}
      {showFraming && (
        <group position={[0, 0, framingZOffset]}>
          <Box args={[width, plateThickness, plateThickness]} position={[0, height / 2 - plateThickness / 2, 0]} castShadow>
            {woodFraming ? <meshStandardMaterial map={woodFraming} roughness={0.7} metalness={0} color="#8b4513" /> : <meshStandardMaterial color="#8B4513" roughness={0.7} />}
          </Box>
          <Box args={[width, plateThickness, plateThickness]} position={[0, -height / 2 + plateThickness / 2, 0]} castShadow>
            {woodFraming ? <meshStandardMaterial map={woodFraming} roughness={0.7} metalness={0} color="#8b4513" /> : <meshStandardMaterial color="#8B4513" roughness={0.7} />}
          </Box>
          <WallFraming
            wallWidth={width}
            wallHeight={height}
            windows={windowsForFraming}
            doors={doorsForFraming}
            framingConfig={shedConfig.framing}
          />
        </group>
      )}

      <Shiplap
        width={width}
        height={height}
        windowOpenings={windowsForFraming}
        hasDoor={hasDoor && doorType !== "none"}
        doorHalfWidth={doorHalfWidth}
        doorHeight={doorDims?.height}
        claddingOpacity={claddingOpacity}
        exteriorZSign={exteriorZSign}
      />

      {hasDoor && doorType !== "none" && (
        <DoorFrame doorType={doorType} wallHeight={height} trimMat={trimMat} exteriorZSign={exteriorZSign} />
      )}
      {windowPositions.map((x, i) => (
        <Window
          key={i}
          x={x}
          wallId={wallId}
          index={i}
          wallWidth={width}
          wallHeight={height}
          hasDoor={hasDoor && doorType !== "none"}
          doorHalfWidth={doorHalfWidth}
          showFraming={showFraming}
          onPositionChange={setWindowPosition}
          dragPlaneRef={dragPlaneRef}
          wallGroupRef={wallGroupRef}
          trimMat={trimMat}
          windowType={(windowTypes[wallId] || [])[i] || "STANDARD"}
          otherWindows={windowPositions.map((ox, j) => {
            const type = (windowTypes[wallId] || [])[j] || "STANDARD";
            return { x: ox, ...getWindowDimensions(type) };
          }).filter((_, j) => j !== i)}
          exteriorZSign={exteriorZSign}
        />
      ))}
    </group>
  );
};

export default Wall;
