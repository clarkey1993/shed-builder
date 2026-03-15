import { useMemo } from "react";
import { useConfigurator } from "../../context/ConfiguratorContext";
import { useInteriorView } from "../../context/InteriorViewContext";
import { useBuilder } from "../../context/BuilderContext";
import { Box } from "@react-three/drei";
import { ApexRoof, PentRoof, Wall } from "./index";
import InternalPartition from "./InternalPartition";
import { useShedTexturesContext } from "../../context/ShedTextureContext";
import { getWallProfiles, getWallHeight, getWallCenterY } from "../../systems/roof/getWallProfiles";

const CORNER_TRIM_WIDTH = 3;
const CORNER_TRIM_THICKNESS = 1.5;

const Shed = () => {
  const { shedConfig, roofStyle, pentSlopeDirection, windowPositions, doorType, frontDoorCenterX } = useConfigurator();
  const { viewMode, partitions } = useInteriorView();
  const { builderStep, showFraming, debugShowFullShed } = useBuilder();
  const { woodFraming, osb } = useShedTexturesContext();

  const isInterior = viewMode === "interior";

  const floorWidth = shedConfig.width;
  const floorDepth = shedConfig.depth;
  const apexWallHeight = shedConfig.wallHeight;
  const apexPeakHeight = shedConfig.roofPeakHeight;
  const floorThickness = shedConfig.framing.upright_middles_thickness_x;

  const wallProfiles = useMemo(
    () => getWallProfiles(roofStyle, pentSlopeDirection, floorWidth, floorDepth, apexWallHeight, apexPeakHeight),
    [roofStyle, pentSlopeDirection, floorWidth, floorDepth, apexWallHeight, apexPeakHeight]
  );
  const { cornerHeights } = wallProfiles;
  const wallHeightForPartitions = roofStyle === "apex" ? apexWallHeight : (cornerHeights.frontLeft + cornerHeights.backLeft) / 2;

  // Full shed visible as soon as user leaves BASE (steps only control editing focus, not what exists)
  const showBase = true;
  const pastBase = builderStep !== "BASE";
  const showFrontWall = debugShowFullShed || pastBase;
  const showSideWalls = debugShowFullShed || pastBase;
  const showBackWall = debugShowFullShed || pastBase;
  const showCornerPosts = debugShowFullShed || pastBase;
  const showRoof = (debugShowFullShed || pastBase) && builderStep !== "INTERIOR";
  const showPartitions = builderStep === "INTERIOR" && isInterior;
  const baseCladdingOpacity = (isInterior || builderStep === "INTERIOR") && !debugShowFullShed ? 0.15 : 1;
  const claddingOpacity = showFraming && baseCladdingOpacity === 1 ? 0.82 : baseCladdingOpacity;
  const roofOpacity = isInterior && !debugShowFullShed ? 0 : 1;

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

      {/* Corner trims (vertical boards) - apex only; pent uses clean wall/roof join without uprights */}
      {showCornerPosts && roofStyle === "apex" && (
        <>
          <Box args={[CORNER_TRIM_WIDTH, cornerHeights.frontLeft, CORNER_TRIM_THICKNESS]} position={[-floorWidth / 2 - CORNER_TRIM_THICKNESS / 2, cornerHeights.frontLeft / 2, -floorDepth / 2]} castShadow>{cornerPostMat}</Box>
          <Box args={[CORNER_TRIM_THICKNESS, cornerHeights.frontLeft, CORNER_TRIM_WIDTH]} position={[-floorWidth / 2, cornerHeights.frontLeft / 2, -floorDepth / 2 - CORNER_TRIM_THICKNESS / 2]} castShadow>{cornerPostMat}</Box>
          <Box args={[CORNER_TRIM_WIDTH, cornerHeights.frontRight, CORNER_TRIM_THICKNESS]} position={[floorWidth / 2 + CORNER_TRIM_THICKNESS / 2, cornerHeights.frontRight / 2, -floorDepth / 2]} castShadow>{cornerPostMat}</Box>
          <Box args={[CORNER_TRIM_THICKNESS, cornerHeights.frontRight, CORNER_TRIM_WIDTH]} position={[floorWidth / 2, cornerHeights.frontRight / 2, -floorDepth / 2 - CORNER_TRIM_THICKNESS / 2]} castShadow>{cornerPostMat}</Box>
          <Box args={[CORNER_TRIM_WIDTH, cornerHeights.backLeft, CORNER_TRIM_THICKNESS]} position={[-floorWidth / 2 - CORNER_TRIM_THICKNESS / 2, cornerHeights.backLeft / 2, floorDepth / 2]} castShadow>{cornerPostMat}</Box>
          <Box args={[CORNER_TRIM_THICKNESS, cornerHeights.backLeft, CORNER_TRIM_WIDTH]} position={[-floorWidth / 2, cornerHeights.backLeft / 2, floorDepth / 2 + CORNER_TRIM_THICKNESS / 2]} castShadow>{cornerPostMat}</Box>
          <Box args={[CORNER_TRIM_WIDTH, cornerHeights.backRight, CORNER_TRIM_THICKNESS]} position={[floorWidth / 2 + CORNER_TRIM_THICKNESS / 2, cornerHeights.backRight / 2, floorDepth / 2]} castShadow>{cornerPostMat}</Box>
          <Box args={[CORNER_TRIM_THICKNESS, cornerHeights.backRight, CORNER_TRIM_WIDTH]} position={[floorWidth / 2, cornerHeights.backRight / 2, floorDepth / 2 + CORNER_TRIM_THICKNESS / 2]} castShadow>{cornerPostMat}</Box>
        </>
      )}

      {/* Walls: profiles from getWallProfiles (apex = same height; pent = rectangular or trapezoidal per slope direction) */}
      {showFrontWall && (
        <Wall
          wallId="front"
          width={floorWidth}
          profile={wallProfiles.front}
          position={[0, getWallCenterY(wallProfiles.front), -floorDepth / 2]}
          rotation={[0, 0, 0]}
          exteriorZSign={-1}
          hasDoor
          doorType={doorType}
          windowPositions={windowPositions.front}
          claddingOpacity={claddingOpacity}
          doorCenterX={frontDoorCenterX}
        />
      )}
      {showBackWall && (
        <Wall
          wallId="back"
          width={floorWidth}
          profile={wallProfiles.back}
          position={[0, getWallCenterY(wallProfiles.back), floorDepth / 2]}
          rotation={[0, Math.PI, 0]}
          exteriorZSign={-1}
          windowPositions={windowPositions.back}
          claddingOpacity={claddingOpacity}
        />
      )}
      {showSideWalls && (
        <>
          <Wall
            wallId="left"
            width={floorDepth}
            profile={wallProfiles.left}
            position={[-floorWidth / 2, getWallCenterY(wallProfiles.left), 0]}
            rotation={[0, Math.PI / 2, 0]}
            exteriorZSign={-1}
            windowPositions={windowPositions.left}
            claddingOpacity={claddingOpacity}
          />
          <Wall
            wallId="right"
            width={floorDepth}
            profile={wallProfiles.right}
            position={[floorWidth / 2, getWallCenterY(wallProfiles.right), 0]}
            rotation={[0, -Math.PI / 2, 0]}
            exteriorZSign={-1}
            windowPositions={windowPositions.right}
            claddingOpacity={claddingOpacity}
          />
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
            wallHeight={wallHeightForPartitions}
          />
        ))}

      {/* Roof */}
      {showRoof && (roofStyle === "apex" ? (
        <ApexRoof width={floorWidth} depth={floorDepth} opacity={roofOpacity} showFraming={showFraming} />
      ) : (
        <PentRoof
          width={floorWidth}
          depth={floorDepth}
          opacity={roofOpacity}
          showFraming={showFraming}
          slopeDirection={pentSlopeDirection}
          wallProfiles={wallProfiles}
        />
      ))}
    </group>
  );
};

export default Shed;
