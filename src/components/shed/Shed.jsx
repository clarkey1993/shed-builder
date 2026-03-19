import { useMemo } from "react";
import { useConfigurator, ModuleRoofContext } from "../../context/ConfiguratorContext";
import { useInteriorView } from "../../context/InteriorViewContext";
import { useBuilder } from "../../context/BuilderContext";
import { Box, Line } from "@react-three/drei";
import { ApexRoof, PentRoof, Wall } from "./index";
import InternalPartition from "./InternalPartition";
import { useShedTexturesContext } from "../../context/ShedTextureContext";
import { getWallProfiles, getWallHeight, getWallCenterY } from "../../systems/roof/getWallProfiles";

const CORNER_TRIM_WIDTH = 3;
const CORNER_TRIM_THICKNESS = 1.5;

const Shed = () => {
  const {
    shedConfig,
    windowPositions,
    doorsByWall,
    modules,
    wallIncluded,
    getVisibleWallSegments,
    activeModuleId,
    roofByModule,
  } = useConfigurator();
  const { viewMode, partitions } = useInteriorView();
  const { builderStep, showFraming, debugShowFullShed } = useBuilder();
  const { woodFraming, osb } = useShedTexturesContext();

  const isInterior = viewMode === "interior";

  const apexWallHeight = shedConfig.wallHeight;
  const apexPeakHeight = shedConfig.roofPeakHeight;
  const floorThickness = shedConfig.framing.upright_middles_thickness_x;

  const primaryModule = modules[0];
  const primaryRoof = roofByModule[primaryModule?.id] ?? { type: "apex", pentSlopeDirection: "front_to_back" };
  const primaryW = primaryModule?.width ?? 94;
  const primaryD = primaryModule?.depth ?? 72;
  const defaultWallProfiles = useMemo(
    () => getWallProfiles(primaryRoof.type, primaryRoof.pentSlopeDirection, primaryW, primaryD, apexWallHeight, apexPeakHeight),
    [primaryRoof.type, primaryRoof.pentSlopeDirection, primaryW, primaryD, apexWallHeight, apexPeakHeight]
  );
  const { cornerHeights } = defaultWallProfiles;
  const wallHeightForPartitions = primaryRoof.type === "apex" ? apexWallHeight : (cornerHeights.frontLeft + cornerHeights.backLeft) / 2;

  const showBase = true;
  const getSegmentsForWall = (wallId, wallHalfSpan) => {
    if (debugShowFullShed) return [{ start: -wallHalfSpan, end: wallHalfSpan }];
    return getVisibleWallSegments(wallId, wallHalfSpan);
  };
  const showCornerPosts = debugShowFullShed || builderStep !== "BASE";
  const isRoofShownForModule = (moduleId) =>
    (debugShowFullShed || (roofByModule[moduleId]?.visible ?? false)) && builderStep !== "INTERIOR";
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
  const floorMatFor = (modW, modD) => {
    if (!osb) return <meshStandardMaterial color="#a9a9a9" roughness={0.85} />;
    const tex = osb.clone();
    tex.repeat.set(modW / 24, modD / 24);
    return <meshStandardMaterial map={tex} roughness={0.85} metalness={0} color="#a9a9a9" />;
  };

  return (
    <group scale={1 / 12}>
      {modules.map((module) => {
        const modW = module.width;
        const modD = module.depth;
        const wallIds = {
          front: `${module.id}_front`,
          left: `${module.id}_left`,
          right: `${module.id}_right`,
          back: `${module.id}_back`,
        };
        const modRoof = roofByModule[module.id] ?? { type: "apex", pentSlopeDirection: "front_to_back" };
        const modWallProfiles = modW === primaryW && modD === primaryD && modRoof.type === primaryRoof.type && modRoof.pentSlopeDirection === primaryRoof.pentSlopeDirection
          ? defaultWallProfiles
          : getWallProfiles(modRoof.type, modRoof.pentSlopeDirection, modW, modD, apexWallHeight, apexPeakHeight);
        const modCornerHeights = modWallProfiles.cornerHeights || defaultWallProfiles.cornerHeights;
        const isActive = module.id === activeModuleId && modules.length > 1;
        return (
        <ModuleRoofContext.Provider key={module.id} value={module.id}>
        <group position={[module.offsetX, 0, module.offsetZ]}>
      {/* Subtle outline for active module when multi-module */}
      {isActive && (
        <Line
          points={[
            [-modW / 2, 0.5, -modD / 2],
            [modW / 2, 0.5, -modD / 2],
            [modW / 2, 0.5, modD / 2],
            [-modW / 2, 0.5, modD / 2],
            [-modW / 2, 0.5, -modD / 2],
          ]}
          color="#2A7F7F"
          lineWidth={1}
        />
      )}
      {/* Floor Bearers */}
      {(() => {
        const bearers = [];
        const bearerThickness = 2;
        const bearerSpacing = 12;
        const numBearers = Math.floor(modW / bearerSpacing) + 1;
        for (let i = 0; i < numBearers; i++) {
          const bearerX = -modW / 2 + i * bearerSpacing;
          bearers.push(
            <Box
              key={i}
              args={[bearerThickness, bearerThickness, modD]}
              position={[bearerX, -floorThickness / 2 - bearerThickness / 2, 0]}
              castShadow
            >
              {bearerMat}
            </Box>
          );
        }
        return bearers;
      })()}

      {/* Floor */}
      <Box args={[modW, floorThickness, modD]} position={[0, -floorThickness / 2, 0]} receiveShadow castShadow>
        {floorMatFor(modW, modD)}
      </Box>

      {/* Corner trims - apex only */}
      {showCornerPosts && modRoof.type === "apex" && (
        <>
          <Box args={[CORNER_TRIM_WIDTH, modCornerHeights.frontLeft, CORNER_TRIM_THICKNESS]} position={[-modW / 2 - CORNER_TRIM_THICKNESS / 2, modCornerHeights.frontLeft / 2, -modD / 2]} castShadow>{cornerPostMat}</Box>
          <Box args={[CORNER_TRIM_THICKNESS, modCornerHeights.frontLeft, CORNER_TRIM_WIDTH]} position={[-modW / 2, modCornerHeights.frontLeft / 2, -modD / 2 - CORNER_TRIM_THICKNESS / 2]} castShadow>{cornerPostMat}</Box>
          <Box args={[CORNER_TRIM_WIDTH, modCornerHeights.frontRight, CORNER_TRIM_THICKNESS]} position={[modW / 2 + CORNER_TRIM_THICKNESS / 2, modCornerHeights.frontRight / 2, -modD / 2]} castShadow>{cornerPostMat}</Box>
          <Box args={[CORNER_TRIM_THICKNESS, modCornerHeights.frontRight, CORNER_TRIM_WIDTH]} position={[modW / 2, modCornerHeights.frontRight / 2, -modD / 2 - CORNER_TRIM_THICKNESS / 2]} castShadow>{cornerPostMat}</Box>
          <Box args={[CORNER_TRIM_WIDTH, modCornerHeights.backLeft, CORNER_TRIM_THICKNESS]} position={[-modW / 2 - CORNER_TRIM_THICKNESS / 2, modCornerHeights.backLeft / 2, modD / 2]} castShadow>{cornerPostMat}</Box>
          <Box args={[CORNER_TRIM_THICKNESS, modCornerHeights.backLeft, CORNER_TRIM_WIDTH]} position={[-modW / 2, modCornerHeights.backLeft / 2, modD / 2 + CORNER_TRIM_THICKNESS / 2]} castShadow>{cornerPostMat}</Box>
          <Box args={[CORNER_TRIM_WIDTH, modCornerHeights.backRight, CORNER_TRIM_THICKNESS]} position={[modW / 2 + CORNER_TRIM_THICKNESS / 2, modCornerHeights.backRight / 2, modD / 2]} castShadow>{cornerPostMat}</Box>
          <Box args={[CORNER_TRIM_THICKNESS, modCornerHeights.backRight, CORNER_TRIM_WIDTH]} position={[modW / 2, modCornerHeights.backRight / 2, modD / 2 + CORNER_TRIM_THICKNESS / 2]} castShadow>{cornerPostMat}</Box>
        </>
      )}

      {/* Walls - scoped wallIds, per-module visibility, segmented for joined walls */}
      {getSegmentsForWall(wallIds.front, modW / 2).map((seg, i) => {
        const segWidth = seg.end - seg.start;
        const segCenterX = (seg.start + seg.end) / 2;
        const frontSegments = getVisibleWallSegments(wallIds.front, modW / 2);
        const hasOpenings = frontSegments.length === 1 && segWidth >= modW - 0.01;
        return (
          <Wall
            key={`${wallIds.front}_seg_${i}`}
            wallId={wallIds.front}
            moduleId={module.id}
            width={segWidth}
            profile={modWallProfiles.front}
            position={[segCenterX, getWallCenterY(modWallProfiles.front), -modD / 2]}
            rotation={[0, 0, 0]}
            exteriorZSign={-1}
            hasDoor={hasOpenings && (doorsByWall[wallIds.front]?.type ?? "none") !== "none"}
            doorType={hasOpenings ? (doorsByWall[wallIds.front]?.type ?? "none") : "none"}
            windowPositions={hasOpenings ? (windowPositions[wallIds.front] ?? []) : []}
            claddingOpacity={claddingOpacity}
            doorCenterX={doorsByWall[wallIds.front]?.centerX ?? 0}
          />
        );
      })}
      {getSegmentsForWall(wallIds.back, modW / 2).map((seg, i) => {
        const segWidth = seg.end - seg.start;
        const segCenterX = (seg.start + seg.end) / 2;
        const backSegments = getVisibleWallSegments(wallIds.back, modW / 2);
        const hasOpenings = backSegments.length === 1 && segWidth >= modW - 0.01;
        return (
          <Wall
            key={`${wallIds.back}_seg_${i}`}
            wallId={wallIds.back}
            moduleId={module.id}
            width={segWidth}
            profile={modWallProfiles.back}
            position={[segCenterX, getWallCenterY(modWallProfiles.back), modD / 2]}
            rotation={[0, Math.PI, 0]}
            exteriorZSign={-1}
            hasDoor={hasOpenings && (doorsByWall[wallIds.back]?.type ?? "none") !== "none"}
            doorType={hasOpenings ? (doorsByWall[wallIds.back]?.type ?? "none") : "none"}
            windowPositions={hasOpenings ? (windowPositions[wallIds.back] ?? []) : []}
            claddingOpacity={claddingOpacity}
            doorCenterX={doorsByWall[wallIds.back]?.centerX ?? 0}
          />
        );
      })}
      {getSegmentsForWall(wallIds.left, modD / 2).map((seg, i) => {
        const segWidth = seg.end - seg.start;
        const segCenterZ = (seg.start + seg.end) / 2;
        const leftSegments = getVisibleWallSegments(wallIds.left, modD / 2);
        const hasOpenings = leftSegments.length === 1 && segWidth >= modD - 0.01;
        return (
          <Wall
            key={`${wallIds.left}_seg_${i}`}
            wallId={wallIds.left}
            moduleId={module.id}
            width={segWidth}
            profile={modWallProfiles.left}
            position={[-modW / 2, getWallCenterY(modWallProfiles.left), segCenterZ]}
            rotation={[0, Math.PI / 2, 0]}
            exteriorZSign={-1}
            hasDoor={hasOpenings && (doorsByWall[wallIds.left]?.type ?? "none") !== "none"}
            doorType={hasOpenings ? (doorsByWall[wallIds.left]?.type ?? "none") : "none"}
            windowPositions={hasOpenings ? (windowPositions[wallIds.left] ?? []) : []}
            claddingOpacity={claddingOpacity}
            doorCenterX={doorsByWall[wallIds.left]?.centerX ?? 0}
          />
        );
      })}
      {getSegmentsForWall(wallIds.right, modD / 2).map((seg, i) => {
        const segWidth = seg.end - seg.start;
        const segCenterZ = (seg.start + seg.end) / 2;
        const rightSegments = getVisibleWallSegments(wallIds.right, modD / 2);
        const hasOpenings = rightSegments.length === 1 && segWidth >= modD - 0.01;
        return (
          <Wall
            key={`${wallIds.right}_seg_${i}`}
            wallId={wallIds.right}
            moduleId={module.id}
            width={segWidth}
            profile={modWallProfiles.right}
            position={[modW / 2, getWallCenterY(modWallProfiles.right), segCenterZ]}
            rotation={[0, -Math.PI / 2, 0]}
            exteriorZSign={-1}
            hasDoor={hasOpenings && (doorsByWall[wallIds.right]?.type ?? "none") !== "none"}
            doorType={hasOpenings ? (doorsByWall[wallIds.right]?.type ?? "none") : "none"}
            windowPositions={hasOpenings ? (windowPositions[wallIds.right] ?? []) : []}
            claddingOpacity={claddingOpacity}
            doorCenterX={doorsByWall[wallIds.right]?.centerX ?? 0}
          />
        );
      })}

      {/* Per-module roof - visibility and type scoped per module */}
      {isRoofShownForModule(module.id) && (modRoof.type === "apex" ? (
        <ApexRoof width={modW} depth={modD} opacity={roofOpacity} showFraming={showFraming} />
      ) : (
        <PentRoof
          width={modW}
          depth={modD}
          opacity={roofOpacity}
          showFraming={showFraming}
          slopeDirection={modRoof.pentSlopeDirection}
          wallProfiles={modWallProfiles}
        />
      ))}
        </group>
        </ModuleRoofContext.Provider>
        );
      })}

      {/* Internal Partitions (Interior step only) */}
      {showPartitions &&
        partitions.map((p) => (
          <InternalPartition
            key={p.id}
            partition={p}
            floorWidth={primaryW}
            floorDepth={primaryD}
            wallHeight={wallHeightForPartitions}
          />
        ))}
    </group>
  );
};

export default Shed;
