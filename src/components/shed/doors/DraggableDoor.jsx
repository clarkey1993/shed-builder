import { useRef, useCallback } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { useBuilder } from "../../../context/BuilderContext";
import { useConfigurator } from "../../../context/ConfiguratorContext";
import { GRID_SNAP, STUD_SNAP, STUD_ASSIST_DIST } from "../../../systems/snapping/snapRules";
import DoorFrame from "./DoorFrame";

const STUD_CLEARANCE = 3;
const CORNER_CLEARANCE = 6;

function minGapBetween(doorWidth, otherWidth) {
  return doorWidth / 2 + otherWidth / 2 + STUD_CLEARANCE;
}

function clampAndSnapDoor(x, wallWidth, doorWidth, windows = []) {
  const halfDoorW = doorWidth / 2;
  let min = -wallWidth / 2 + halfDoorW + CORNER_CLEARANCE;
  let max = wallWidth / 2 - halfDoorW - CORNER_CLEARANCE;
  for (const win of windows) {
    const gap = minGapBetween(doorWidth, win.width);
    if (x > win.x - gap / 2 && x < win.x + gap / 2) {
      x = x < win.x ? win.x - gap / 2 : win.x + gap / 2;
    }
  }
  x = Math.max(min, Math.min(max, x));
  const studSnap = Math.round(x / STUD_SNAP) * STUD_SNAP;
  if (Math.abs(x - studSnap) <= STUD_ASSIST_DIST) return studSnap;
  return Math.round(x / GRID_SNAP) * GRID_SNAP;
}

export default function DraggableDoor({
  wallId,
  wallWidth,
  wallHeight,
  doorType,
  doorWidth,
  doorHeight,
  dragPlaneRef,
  wallGroupRef,
  trimMat,
  exteriorZSign = 1,
  windowOpenings = [],
  isTrapezoidWall = false,
  doorBottomY,
}) {
  const { camera, raycaster, gl } = useThree();
  const { isDraggingElement, setIsDraggingElement, setSelectedElementId, selectedElementId, setPointerDownOnInteractive } = useBuilder();
  const { doorsByWall, setDoorPosition, removeDoor } = useConfigurator();
  const ptr = useRef(new THREE.Vector2());
  const didDragRef = useRef(false);
  const startPosRef = useRef({ x: 0, y: 0 });

  const centerX = doorsByWall[wallId]?.centerX ?? 0;
  const isSelected = selectedElementId === `door-${wallId}`;
  // Exterior trim face is at (0.25 + TRIM_T/2) * exteriorZSign = 0.75 * exteriorZSign.
  // Push delete button slightly outward by 0.35 for clear visibility.
  const deleteButtonZ = (0.25 + 1 / 2 + 0.35) * exteriorZSign;

  const updateX = useCallback(
    (clientX, clientY) => {
      if (!dragPlaneRef?.current || !wallGroupRef?.current) return;
      const rect = gl.domElement.getBoundingClientRect();
      ptr.current.set(
        (clientX - rect.left) / rect.width * 2 - 1,
        -((clientY - rect.top) / rect.height) * 2 + 1
      );
      raycaster.setFromCamera(ptr.current, camera);
      const hits = raycaster.intersectObject(dragPlaneRef.current);
      if (hits.length) {
        const pt = hits[0].point.clone();
        wallGroupRef.current.worldToLocal(pt);
        const snapped = clampAndSnapDoor(pt.x, wallWidth, doorWidth, windowOpenings);
        setDoorPosition(wallId, snapped);
      }
    },
    [camera, raycaster, gl, dragPlaneRef, wallGroupRef, wallWidth, doorWidth, windowOpenings, setDoorPosition, wallId]
  );

  const onPointerDown = (e) => {
    e.stopPropagation();
    e.target.setPointerCapture(e.pointerId);
    didDragRef.current = false;
    startPosRef.current = { x: e.clientX, y: e.clientY };
    setPointerDownOnInteractive(true);
    setSelectedElementId(`door-${wallId}`);
    setIsDraggingElement(true);
    const canvas = gl.domElement;
    const cleanup = () => {
      canvas.onpointermove = null;
      canvas.onpointerup = null;
      canvas.onpointerleave = null;
      e.target.releasePointerCapture?.(e.pointerId);
      setIsDraggingElement(false);
    };
    canvas.onpointermove = (ev) => {
      const dx = ev.clientX - startPosRef.current.x;
      const dy = ev.clientY - startPosRef.current.y;
      const distSq = dx * dx + dy * dy;
      const DRAG_THRESHOLD_PX = 9; // 3px radius
      if (!didDragRef.current && distSq > DRAG_THRESHOLD_PX * DRAG_THRESHOLD_PX) {
        didDragRef.current = true;
      }
      if (didDragRef.current) {
        updateX(ev.clientX, ev.clientY);
      }
    };
    canvas.onpointerup = cleanup;
    canvas.onpointerleave = cleanup;
  };

  return (
    <group position={[centerX, 0, 0]}>
      <mesh position={[0, 0, 0.1 * exteriorZSign]} onPointerDown={onPointerDown}>
        <boxGeometry args={[doorWidth + 6, wallHeight, 0.5]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      {isSelected && (
        <mesh
          position={[
            doorWidth / 2 + 8,
            doorBottomY + doorHeight - 6,
            deleteButtonZ,
          ]}
          onPointerDown={(e) => {
            e.stopPropagation();
            removeDoor(wallId);
            setSelectedElementId(null);
          }}
        >
          <boxGeometry args={[8, 8, 0.5]} />
          <meshBasicMaterial color="#ff4b4b" depthTest={false} />
        </mesh>
      )}
      <DoorFrame
        doorType={doorType}
        wallHeight={wallHeight}
        doorWidth={doorWidth}
        doorHeight={doorHeight}
        trimMat={trimMat}
        exteriorZSign={exteriorZSign}
        isTrapezoidWall={isTrapezoidWall}
        doorBottomY={doorBottomY}
      />
    </group>
  );
}

