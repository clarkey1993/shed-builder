import { useMemo } from "react";
import { useConfigurator } from "../../context/ConfiguratorContext";
import { useInteriorView } from "../../context/InteriorViewContext";
import { useBuilder } from "../../context/BuilderContext";
import { Box } from "@react-three/drei";
import { ApexRoof, PentRoof, Wall } from "./index";
import InternalPartition from "./InternalPartition";
import { useShedTexturesContext } from "../../context/ShedTextureContext";

const CORNER_TRIM_WIDTH = 3;
const CORNER_TRIM_THICKNESS = 1.5;

const Shed = () => {
  const { shedConfig, roofStyle, windowPositions, doorType } = useConfigurator();
  const { viewMode, partitions } = useInteriorView();
  const { builderStep, showFraming, debugShowFullShed } = useBuilder();
  const { woodFraming, osb } = useShedTexturesContext();

  const isInterior = viewMode === "interior";

  // Step-based visibility (or full shed when debug mode enabled)
  const showBase = true;
  const showFrontWall = debugShowFullShed || ["FRONT_WALL", "SIDE_WALLS", "BACK_WALL", "ROOF", "INTERIOR"].includes(builderStep);
  const showSideWalls = debugShowFullShed || ["SIDE_WALLS", "BACK_WALL", "ROOF", "INTERIOR"].includes(builderStep);
  const showBackWall = debugShowFullShed || ["BACK_WALL", "ROOF", "INTERIOR"].includes(builderStep);
  const showCornerPosts = debugShowFullShed || showSideWalls || showBackWall;
  const showRoof = debugShowFullShed || builderStep === "ROOF";
  const showPartitions = builderStep === "INTERIOR" && isInterior;
  const claddingOpacity = (isInterior || builderStep === "INTERIOR") && !debugShowFullShed ? 0.15 : 1;
  const roofOpacity = isInterior && !debugShowFullShed ? 0 : 1;

  const floorWidth = shedConfig.width;
  const floorDepth = shedConfig.depth;
  const wallHeight = shedConfig.wallHeight;
  const floorThickness = shedConfig.framing.upright_middles_thickness_x;

  const bearerMat = woodFraming ? (
    <meshStandardMaterial map={woodFraming} roughness={0.7} metalness={0} color="#8b6914" />
  ) : (
    <meshStandardMaterial color="#8B4513" roughness={0.7} />
  );
  const cornerPostMat = woodFraming ? (
    <meshStandardMaterial map={woodFraming} roughness={0.7} metalness={0} color="#8b5a2b" />
  ) : (
    <meshStandardMaterial color="#8b5a2b" roughness={0.7} />
  );
  const floorMat = useMemo(() => {
    if (!osb) return <meshStandardMaterial color="#a9a9a9" roughness={0.85} />;
    const tex = osb.clone();
    tex.repeat.set(floorWidth / 24, floorDepth / 24);
    return <meshStandardMaterial map={tex} roughness={0.85} metalness={0} color="#a9a9a9" />;
  }, [osb, floorWidth, floorDepth]);

  return (
    <group scale={1 / 12}>
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

      {/* Corner trims (vertical boards to hide cladding ends) - subtle timber corner boards */}
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

      {/* Walls: sides use local +Z=exterior; front/back use exteriorZSign=-1; framing derived from exteriorZSign */}
      {showFrontWall && (
        <Wall wallId="front" width={floorWidth} height={wallHeight} position={[0, wallHeight / 2, -floorDepth / 2]} rotation={[0, 0, 0]} exteriorZSign={-1} hasDoor doorType={doorType} windowPositions={windowPositions.front} claddingOpacity={claddingOpacity} />
      )}
      {showBackWall && (
        <Wall wallId="back" width={floorWidth} height={wallHeight} position={[0, wallHeight / 2, floorDepth / 2]} rotation={[0, Math.PI, 0]} exteriorZSign={-1} windowPositions={windowPositions.back} claddingOpacity={claddingOpacity} />
      )}
      {showSideWalls && (
        <>
          <Wall wallId="left" width={floorDepth} height={wallHeight} position={[-floorWidth / 2, wallHeight / 2, 0]} rotation={[0, Math.PI / 2, 0]} exteriorZSign={-1} windowPositions={windowPositions.left} claddingOpacity={claddingOpacity} />
          <Wall wallId="right" width={floorDepth} height={wallHeight} position={[floorWidth / 2, wallHeight / 2, 0]} rotation={[0, -Math.PI / 2, 0]} exteriorZSign={-1} windowPositions={windowPositions.right} claddingOpacity={claddingOpacity} />
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
