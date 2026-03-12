import { useMemo } from "react";
import { useConfigurator } from "../../context/ConfiguratorContext";
import { useInteriorView } from "../../context/InteriorViewContext";
import { useBuilder } from "../../context/BuilderContext";
import { Box } from "@react-three/drei";
import { ApexRoof, PentRoof, Wall } from "./index";
import InternalPartition from "./InternalPartition";
import { useShedTexturesContext } from "../../context/ShedTextureContext";

const CORNER_TRIM_WIDTH = 3;
const CORNER_TRIM_THICKNESS = 0.75;

const Shed = () => {
  const { shedConfig, roofStyle, windowPositions, doorType } = useConfigurator();
  const { viewMode, partitions } = useInteriorView();
  const { builderStep, showFraming } = useBuilder();
  const { woodFraming, osb } = useShedTexturesContext();

  const isInterior = viewMode === "interior";

  // Step-based visibility
  const showBase = true;
  const showFrontWall = ["FRONT_WALL", "SIDE_WALLS", "BACK_WALL", "ROOF", "INTERIOR"].includes(builderStep);
  const showSideWalls = ["SIDE_WALLS", "BACK_WALL", "ROOF", "INTERIOR"].includes(builderStep);
  const showBackWall = ["BACK_WALL", "ROOF", "INTERIOR"].includes(builderStep);
  const showCornerPosts = showSideWalls || showBackWall;
  const showRoof = builderStep === "ROOF";
  const showPartitions = builderStep === "INTERIOR" && isInterior;
  const claddingOpacity = (isInterior || builderStep === "INTERIOR") ? 0.15 : 1;
  const roofOpacity = isInterior ? 0 : 1;

  const floorWidth = shedConfig.width;
  const floorDepth = shedConfig.depth;
  const wallHeight = shedConfig.wallHeight;
  const floorThickness = shedConfig.framing.upright_middles_thickness_x;

  const bearerMat = woodFraming ? (
    <meshStandardMaterial map={woodFraming} roughness={0.7} metalness={0} color="#8b6914" />
  ) : (
    <meshStandardMaterial color="#8B4513" roughness={0.7} />
  );
  const cornerPostMat = <meshStandardMaterial color="#ff0000" roughness={0.7} metalness={0} />;
  const floorMat = useMemo(() => {
    if (!osb) return <meshStandardMaterial color="#a9a9a9" roughness={0.85} />;
    const tex = osb.clone();
    tex.repeat.set(floorWidth / 24, floorDepth / 24);
    return <meshStandardMaterial map={tex} roughness={0.85} metalness={0} color="#a9a9a9" />;
  }, [osb, floorWidth, floorDepth]);

  return (
    <group scale={1 / 12}>
      {/* TEMP: Live Shed component marker - remove after verifying render path */}
      <Box args={[200, 80, 200]} position={[0, 150, 0]} castShadow>
        <meshStandardMaterial color="#ff00ff" />
      </Box>
      {/* Floor Bearers - wood texture, slightly varied roughness */}
      {(() => {
        const bearers = [];
        const bearerThickness = 2;
        const bearerSpacing = 12;
        const numBearers = Math.floor(floorWidth / bearerSpacing) + 1;
        for (let i = 0; i < numBearers; i++) {
          const bearerX = -floorWidth / 2 + i * bearerSpacing;
          bearers.push(
            <Box
              key={i}
              args={[bearerThickness, bearerThickness, floorDepth]}
              position={[bearerX, -floorThickness / 2 - bearerThickness / 2, 0]}
              castShadow
            >
              {bearerMat}
            </Box>
          );
        }
        return bearers;
      })()}

      {/* Floor - OSB texture */}
      <Box args={[floorWidth, floorThickness, floorDepth]} position={[0, -floorThickness / 2, 0]} receiveShadow castShadow>
        {floorMat}
      </Box>

      {/* Corner trims (vertical boards to hide cladding ends) - width 3", thickness 0.75" */}
      {showCornerPosts && (
        <>
          <Box args={[CORNER_TRIM_WIDTH, wallHeight, CORNER_TRIM_THICKNESS]} position={[-floorWidth / 2 - CORNER_TRIM_THICKNESS / 2, wallHeight / 2, -floorDepth / 2]} castShadow>{cornerPostMat}</Box>
          <Box args={[CORNER_TRIM_THICKNESS, wallHeight, CORNER_TRIM_WIDTH]} position={[-floorWidth / 2, wallHeight / 2, -floorDepth / 2 - CORNER_TRIM_THICKNESS / 2]} castShadow>{cornerPostMat}</Box>
          <Box args={[CORNER_TRIM_WIDTH, wallHeight, CORNER_TRIM_THICKNESS]} position={[floorWidth / 2 + CORNER_TRIM_THICKNESS / 2, wallHeight / 2, -floorDepth / 2]} castShadow>{cornerPostMat}</Box>
          <Box args={[CORNER_TRIM_THICKNESS, wallHeight, CORNER_TRIM_WIDTH]} position={[floorWidth / 2, wallHeight / 2, -floorDepth / 2 - CORNER_TRIM_THICKNESS / 2]} castShadow>{cornerPostMat}</Box>
          <Box args={[CORNER_TRIM_WIDTH, wallHeight, CORNER_TRIM_THICKNESS]} position={[-floorWidth / 2 - CORNER_TRIM_THICKNESS / 2, wallHeight / 2, floorDepth / 2]} castShadow>{cornerPostMat}</Box>
          <Box args={[CORNER_TRIM_THICKNESS, wallHeight, CORNER_TRIM_WIDTH]} position={[-floorWidth / 2, wallHeight / 2, floorDepth / 2 + CORNER_TRIM_THICKNESS / 2]} castShadow>{cornerPostMat}</Box>
          <Box args={[CORNER_TRIM_WIDTH, wallHeight, CORNER_TRIM_THICKNESS]} position={[floorWidth / 2 + CORNER_TRIM_THICKNESS / 2, wallHeight / 2, floorDepth / 2]} castShadow>{cornerPostMat}</Box>
          <Box args={[CORNER_TRIM_THICKNESS, wallHeight, CORNER_TRIM_WIDTH]} position={[floorWidth / 2, wallHeight / 2, floorDepth / 2 + CORNER_TRIM_THICKNESS / 2]} castShadow>{cornerPostMat}</Box>
        </>
      )}

      {/* Walls - door on front per guided builder flow */}
      {showFrontWall && (
        <Wall wallId="front" width={floorWidth} height={wallHeight} position={[0, wallHeight / 2, -floorDepth / 2]} hasDoor doorType={doorType} windowPositions={windowPositions.front} claddingOpacity={claddingOpacity} />
      )}
      {showBackWall && (
        <Wall wallId="back" width={floorWidth} height={wallHeight} position={[0, wallHeight / 2, floorDepth / 2]} windowPositions={windowPositions.back} claddingOpacity={claddingOpacity} />
      )}
      {showSideWalls && (
        <>
          <Wall wallId="left" width={floorDepth} height={wallHeight} position={[-floorWidth / 2, wallHeight / 2, 0]} rotation={[0, Math.PI / 2, 0]} windowPositions={windowPositions.left} claddingOpacity={claddingOpacity} />
          <Wall wallId="right" width={floorDepth} height={wallHeight} position={[floorWidth / 2, wallHeight / 2, 0]} rotation={[0, Math.PI / 2, 0]} windowPositions={windowPositions.right} claddingOpacity={claddingOpacity} />
        </>
      )}

      {/* Internal Partitions (Interior step only) */}
      {showPartitions &&
        partitions.map((p) => (
          <InternalPartition
            key={p.id}
            partition={p}
            floorWidth={floorWidth}
            floorDepth={floorDepth}
            wallHeight={wallHeight}
          />
        ))}

      {/* Roof */}
      {showRoof && (roofStyle === "apex" ? (
        <ApexRoof width={floorWidth} depth={floorDepth} opacity={roofOpacity} showFraming={showFraming} />
      ) : (
        <PentRoof width={floorWidth} depth={floorDepth} opacity={roofOpacity} showFraming={showFraming} />
      ))}
    </group>
  );
};

export default Shed;
