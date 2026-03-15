import { Box } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useConfigurator } from "../../../context/ConfiguratorContext";
import { useBuilder } from "../../../context/BuilderContext";
import { useShedTexturesContext } from "../../../context/ShedTextureContext";
import { getWindowDimensions, getDoorDimensions } from "../../../systems/openings/getOpeningDimensions";
import { getWallHeight, getWallMinHeight, getWallYCenter, getWallHeightAtX } from "../../../systems/roof/getWallProfiles";
import DoorFrame from "../doors/DoorFrame";
import DraggableDoor from "../doors/DraggableDoor";
import Window from "../windows/Window";
import WallGrid from "../grid/WallGrid";
import Shiplap from "../cladding/Shiplap";
import WallFraming from "../framing/WallFraming";

const WARM_CEDAR = "#e0b890";

function makeTrapezoidGeometry(width, heightAtStart, heightAtEnd) {
  const yCenter = (heightAtStart + heightAtEnd) / 4;
  const h = new THREE.BufferGeometry();
  const v = new Float32Array([
    -width / 2, -yCenter, 0,
    width / 2, -yCenter, 0,
    width / 2, heightAtEnd - yCenter, 0,
    -width / 2, heightAtStart - yCenter, 0,
  ]);
  const i = new Uint16Array([0, 1, 2, 0, 2, 3]);
  h.setAttribute("position", new THREE.BufferAttribute(v, 3));
  h.setIndex(new THREE.BufferAttribute(i, 1));
  h.computeVertexNormals();
  return h;
}

function makeGableGeometry(width, eaveHeight, peakHeight) {
  const yCenter = (eaveHeight + peakHeight) / 2;
  const g = new THREE.BufferGeometry();
  const v = new Float32Array([
    -width / 2, -yCenter, 0,
    width / 2, -yCenter, 0,
    width / 2, eaveHeight - yCenter, 0,
    0, peakHeight - yCenter, 0,
    -width / 2, eaveHeight - yCenter, 0,
  ]);
  const i = new Uint16Array([0, 1, 2, 0, 2, 3, 0, 3, 4]);
  g.setAttribute("position", new THREE.BufferAttribute(v, 3));
  g.setIndex(new THREE.BufferAttribute(i, 1));
  g.computeVertexNormals();
  return g;
}

const Wall = ({
  wallId,
  width,
  profile,
  position,
  rotation,
  windowPositions = [],
  hasDoor,
  doorType,
  claddingOpacity = 1,
  exteriorZSign = 1,
  doorCenterX = 0,
}) => {
  const wallGroupRef = useRef();
  const dragPlaneRef = useRef();
  const { shedConfig, setWindowPosition, windowTypes = {}, wallHeightType, roofStyle } = useConfigurator();
  const { selectedElementId, showFraming, debugShowDragPlanes } = useBuilder();
  const { woodFraming } = useShedTexturesContext();

  const height = getWallHeight(profile);
  const isTrapezoidal = typeof profile?.heightAtStart === "number" && typeof profile?.heightAtEnd === "number";
  const isGable = typeof profile?.eaveHeight === "number" && typeof profile?.peakHeight === "number";
  const eaveHeight = profile?.eaveHeight ?? height;
  const peakHeight = profile?.peakHeight ?? height;
  // For left and back walls, local X start/end are opposite to profile convention; use normalized profile so high/low sides match physical corners.
  const profileForTrapezoid = useMemo(() => {
    if (!isTrapezoidal || !profile) return profile;
    if (wallId !== "left" && wallId !== "back") return profile;
    return { ...profile, heightAtStart: profile.heightAtEnd, heightAtEnd: profile.heightAtStart };
  }, [isTrapezoidal, profile, wallId]);
  const hStart = (profileForTrapezoid ?? profile)?.heightAtStart ?? height;
  const hEnd = (profileForTrapezoid ?? profile)?.heightAtEnd ?? height;
  const yCenter = getWallYCenter(profile);

  const plateThickness = shedConfig.framing.upright_middles_thickness_x;
  const effectiveDoorCenterX = hasDoor ? (doorCenterX ?? 0) : 0;

  // Leave a band of cladding above the door (top clearance) for both apex and pent.
  const DOOR_TOP_CLEARANCE = 10; // inches
  const MIN_PENT_DOOR_WALL_HEIGHT = 60; // minimum effective wall height for door sizing on shallow pents
  const MIN_APEX_DOOR_WALL_HEIGHT = 56; // minimum effective wall height for apex doors

  const wallHeightForDoor = useMemo(() => {
    if (!hasDoor || doorType === "none") return height;

    if (roofStyle === "apex") {
      const effectiveWallH = isGable ? getWallMinHeight(profile) : height;
      const effectiveHeight = effectiveWallH - DOOR_TOP_CLEARANCE;
      return Math.max(MIN_APEX_DOOR_WALL_HEIGHT, effectiveHeight);
    }

    if (roofStyle === "pent") {
      if (isTrapezoidal) {
        const prelim = getDoorDimensions({
          doorType,
          wallHeightType: wallHeightType || "standard",
          wallHeight: getWallMinHeight(profile),
          topPlateThickness: plateThickness,
        });
        const doorLeft = effectiveDoorCenterX - prelim.width / 2;
        const doorRight = effectiveDoorCenterX + prelim.width / 2;
        const prof = profileForTrapezoid ?? profile;
        const hLeft = getWallHeightAtX(prof, width, doorLeft);
        const hRight = getWallHeightAtX(prof, width, doorRight);
        const minHeightAtDoor = Math.min(hLeft, hRight);
        const effectiveHeight = minHeightAtDoor - DOOR_TOP_CLEARANCE;
        return Math.max(MIN_PENT_DOOR_WALL_HEIGHT, effectiveHeight);
      }
      const effectiveHeight = height - DOOR_TOP_CLEARANCE;
      return Math.max(MIN_PENT_DOOR_WALL_HEIGHT, effectiveHeight);
    }

    return height;
  }, [roofStyle, isTrapezoidal, isGable, hasDoor, doorType, height, profile, profileForTrapezoid, width, effectiveDoorCenterX, wallHeightType, plateThickness]);

  const doorDims = hasDoor && doorType !== "none"
    ? getDoorDimensions({
        doorType,
        wallHeightType: wallHeightType || "standard",
        wallHeight: wallHeightForDoor,
        topPlateThickness: plateThickness,
      })
    : null;
  const doorHalfWidth = doorDims ? doorDims.width / 2 : 0;
  const framingZOffset = -exteriorZSign * (plateThickness / 2 + 0.75);
  const trimMat = <meshStandardMaterial color={WARM_CEDAR} roughness={0.75} metalness={0.02} />;

  const showWallGrid = selectedElementId !== null && selectedElementId.startsWith(`window-${wallId}-`);
  const doorOpening = doorDims
    ? { x: effectiveDoorCenterX, width: doorDims.width, height: doorDims.height }
    : null;

  const WINDOW_BOARD_HEIGHT = 4;
  const SHIPLAP_BOARD_OFFSET = 5;
  const windowsForFraming = useMemo(
    () => windowPositions.map((pos, i) => {
      const type = (windowTypes[wallId] || [])[i] || "STANDARD";
      const dims = getWindowDimensions(type);
      const x = typeof pos === "number" && Number.isFinite(pos) ? pos : 0;
      let windowTop;
      if (isTrapezoidal) {
        const prof = profileForTrapezoid ?? profile;
        const topAtX = getWallHeightAtX(prof, width, x) - yCenter;
        windowTop = topAtX - WINDOW_BOARD_HEIGHT - SHIPLAP_BOARD_OFFSET;
      } else if (isGable) {
        const topAtX = getWallHeightAtX(profile, width, x) - yCenter;
        windowTop = topAtX - WINDOW_BOARD_HEIGHT - SHIPLAP_BOARD_OFFSET;
      } else {
        windowTop = height / 2 - WINDOW_BOARD_HEIGHT - SHIPLAP_BOARD_OFFSET;
      }
      const windowCenterY = windowTop - dims.height / 2;
      return { x, y: windowCenterY, width: dims.width, height: dims.height };
    }),
    [windowPositions, windowTypes, wallId, height, isTrapezoidal, isGable, profile, profileForTrapezoid, width, yCenter]
  );
  const doorsForFraming = useMemo(() => {
    if (!doorOpening) return [];
    return [{ x: doorOpening.x, width: doorOpening.width, height: doorOpening.height }];
  }, [doorOpening]);

  const trapezoidGeometry = useMemo(
    () => isTrapezoidal ? makeTrapezoidGeometry(width, hStart, hEnd) : null,
    [isTrapezoidal, width, hStart, hEnd]
  );
  const gableGeometry = useMemo(
    () => isGable ? makeGableGeometry(width, eaveHeight, peakHeight) : null,
    [isGable, width, eaveHeight, peakHeight]
  );
  const wallGeometry = trapezoidGeometry || gableGeometry;

  return (
    <group ref={wallGroupRef} position={position} rotation={rotation}>
      <WallGrid wallId={wallId} width={width} height={height} visible={showWallGrid} />
      <mesh ref={dragPlaneRef} position={[0, 0, 0.2 * exteriorZSign]}>
        {wallGeometry ? (
          <primitive object={wallGeometry} attach="geometry" />
        ) : (
          <planeGeometry args={[width, height]} />
        )}
        <meshBasicMaterial
          side={THREE.DoubleSide}
          color="#3388ff"
          transparent
          opacity={debugShowDragPlanes ? 0.25 : 0}
          depthWrite={false}
        />
      </mesh>

      {/* Framing: plates + studs. Trapezoid/gable walls use profile-driven positions and sloped top plate. */}
      {showFraming && (
        <group position={[0, 0, framingZOffset]}>
          {isTrapezoidal ? (
            <>
              <Box args={[width, plateThickness, plateThickness]} position={[0, -yCenter + plateThickness / 2, 0]} castShadow>
                {woodFraming ? <meshStandardMaterial map={woodFraming} roughness={0.8} metalness={0.02} color="#5c4033" /> : <meshStandardMaterial color="#5c4033" roughness={0.8} />}
              </Box>
              <Box
                args={[width, plateThickness, plateThickness]}
                position={[0, (hStart + hEnd) / 2 - yCenter - plateThickness / 2, 0]}
                rotation={[Math.atan((hEnd - hStart) / width), 0, 0]}
                castShadow
              >
                {woodFraming ? <meshStandardMaterial map={woodFraming} roughness={0.8} metalness={0.02} color="#5c4033" /> : <meshStandardMaterial color="#5c4033" roughness={0.8} />}
              </Box>
            </>
          ) : isGable ? (
            <>
              <Box args={[width, plateThickness, plateThickness]} position={[0, -yCenter + plateThickness / 2, 0]} castShadow>
                {woodFraming ? <meshStandardMaterial map={woodFraming} roughness={0.8} metalness={0.02} color="#5c4033" /> : <meshStandardMaterial color="#5c4033" roughness={0.8} />}
              </Box>
              <Box
                args={[width, plateThickness, plateThickness]}
                position={[0, (eaveHeight + peakHeight) / 2 - yCenter - plateThickness / 2, 0]}
                rotation={[Math.atan2(peakHeight - eaveHeight, width / 2), 0, 0]}
                castShadow
              >
                {woodFraming ? <meshStandardMaterial map={woodFraming} roughness={0.8} metalness={0.02} color="#5c4033" /> : <meshStandardMaterial color="#5c4033" roughness={0.8} />}
              </Box>
            </>
          ) : (
            <>
              <Box args={[width, plateThickness, plateThickness]} position={[0, height / 2 - plateThickness / 2, 0]} castShadow>
                {woodFraming ? <meshStandardMaterial map={woodFraming} roughness={0.8} metalness={0.02} color="#5c4033" /> : <meshStandardMaterial color="#5c4033" roughness={0.8} />}
              </Box>
              <Box args={[width, plateThickness, plateThickness]} position={[0, -height / 2 + plateThickness / 2, 0]} castShadow>
                {woodFraming ? <meshStandardMaterial map={woodFraming} roughness={0.8} metalness={0.02} color="#5c4033" /> : <meshStandardMaterial color="#5c4033" roughness={0.8} />}
              </Box>
            </>
          )}
          <WallFraming
            wallWidth={width}
            wallHeight={height}
            heightAtStart={isTrapezoidal ? hStart : undefined}
            heightAtEnd={isTrapezoidal ? hEnd : undefined}
            eaveHeight={isGable ? eaveHeight : undefined}
            peakHeight={isGable ? peakHeight : undefined}
            yCenter={(isTrapezoidal || isGable) ? yCenter : undefined}
            windows={windowsForFraming}
            doors={doorsForFraming}
            framingConfig={shedConfig.framing}
          />
        </group>
      )}

      <Shiplap
        width={width}
        height={(isTrapezoidal || isGable) ? 2 * yCenter : height}
        heightAtStart={isTrapezoidal ? hStart : undefined}
        heightAtEnd={isTrapezoidal ? hEnd : undefined}
        eaveHeight={isGable ? eaveHeight : undefined}
        peakHeight={isGable ? peakHeight : undefined}
        yCenter={(isTrapezoidal || isGable) ? yCenter : undefined}
        windowOpenings={windowsForFraming}
        doorOpening={doorOpening}
        claddingOpacity={claddingOpacity}
        exteriorZSign={exteriorZSign}
      />

      {hasDoor && doorType !== "none" && doorDims && (
        <DraggableDoor
          wallId={wallId}
          wallWidth={width}
          wallHeight={height}
          doorType={doorType}
          doorWidth={doorDims.width}
          doorHeight={doorDims.height}
          dragPlaneRef={dragPlaneRef}
          wallGroupRef={wallGroupRef}
          trimMat={trimMat}
          exteriorZSign={exteriorZSign}
          windowOpenings={windowsForFraming}
          isTrapezoidWall={isTrapezoidal || isGable}
          doorBottomY={(isTrapezoidal || isGable) ? -yCenter : -height / 2}
        />
      )}
      {windowPositions.map((pos, i) => (
        <Window
          key={i}
          x={typeof pos === "number" && Number.isFinite(pos) ? pos : 0}
          windowCenterY={windowsForFraming[i]?.y ?? 0}
          wallId={wallId}
          index={i}
          wallWidth={width}
          hasDoor={hasDoor && doorType !== "none"}
          doorCenterX={doorOpening?.x ?? null}
          doorWidth={doorDims?.width ?? 0}
          showFraming={showFraming}
          onPositionChange={setWindowPosition}
          dragPlaneRef={dragPlaneRef}
          wallGroupRef={wallGroupRef}
          trimMat={trimMat}
          windowType={(windowTypes[wallId] || [])[i] || "STANDARD"}
          otherWindows={windowPositions.map((ox, j) => {
            const type = (windowTypes[wallId] || [])[j] || "STANDARD";
            const x = typeof ox === "number" && Number.isFinite(ox) ? ox : 0;
            return { x, ...getWindowDimensions(type) };
          }).filter((_, j) => j !== i)}
          exteriorZSign={exteriorZSign}
        />
      ))}
    </group>
  );
};

export default Wall;
