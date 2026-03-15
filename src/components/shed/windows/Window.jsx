import { useRef, useCallback, useState } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import WindowFrame from "./WindowFrame";
import { useBuilder } from "../../../context/BuilderContext";
import { getWindowDimensions } from "../../../systems/openings/getOpeningDimensions";
import { GRID_SNAP, STUD_SNAP, STUD_ASSIST_DIST } from "../../../systems/snapping/snapRules";

const STUD = 3;
const EDGE_CLEARANCE = STUD * 2; // 6" of timber between opening edge and wall corner

function minGapBetween(windowWidth, otherWidth) {
  return windowWidth / 2 + otherWidth / 2 + STUD * 2;
}

/**
 * Clamp to structurally valid range (edges, door, other windows), then snap.
 * Primary: 24" stud spacing when within STUD_ASSIST_DIST; secondary: 6" grid.
 * Returns both the snapped X and whether it hit a stud line.
 */
function clampAndSnap(
  x,
  wallWidth,
  doorCenterX,
  doorWidth,
  windowWidth,
  otherWindows = []
) {
  const halfWindow = windowWidth / 2;
  let min = -wallWidth / 2 + halfWindow + EDGE_CLEARANCE;
  let max = wallWidth / 2 - halfWindow - EDGE_CLEARANCE;

  if (doorCenterX != null && doorWidth > 0) {
    const gap = minGapBetween(windowWidth, doorWidth);
    const doorHalfW = doorWidth / 2;
    const blockMin = doorCenterX - doorHalfW - gap / 2;
    const blockMax = doorCenterX + doorHalfW + gap / 2;
    if (x > blockMin && x < blockMax) {
      x = x < doorCenterX ? blockMin : blockMax;
    }
  }

  for (const other of otherWindows) {
    const gap = minGapBetween(windowWidth, other.width);
    if (x > other.x - gap / 2 && x < other.x + gap / 2) {
      x = x < other.x ? other.x - gap / 2 : other.x + gap / 2;
    }
  }

  x = Math.max(min, Math.min(max, x));

  const studSnap = Math.round(x / STUD_SNAP) * STUD_SNAP;
  if (Math.abs(x - studSnap) <= STUD_ASSIST_DIST) {
    return { x: studSnap, snappedToStud: true };
  }
  return { x: Math.round(x / GRID_SNAP) * GRID_SNAP, snappedToStud: false };
}

const ELEMENT_ID = (wallId, index) => `window-${wallId}-${index}`;

export default function Window({
  x,
  windowCenterY,
  wallId,
  index,
  wallWidth,
  hasDoor,
  doorCenterX = null,
  doorWidth = 0,
  showFraming = false,
  onPositionChange,
  dragPlaneRef,
  wallGroupRef,
  trimMat,
  windowType = "STANDARD",
  otherWindows = [],
  exteriorZSign = 1,
}) {
  const { camera, raycaster, gl } = useThree();
  const { setIsDraggingElement, setSelectedElementId, selectedElementId } = useBuilder();
  const ptr = useRef(new THREE.Vector2());
  const didDragRef = useRef(false);
  const [isHovered, setIsHovered] = useState(false);
  const [snappedToStud, setSnappedToStud] = useState(false);

  const elementId = ELEMENT_ID(wallId, index);
  const isSelected = selectedElementId === elementId;
  const dims = getWindowDimensions(windowType);
  const { width: windowWidth, height: windowHeight } = dims;

  const updateX = useCallback(
    (clientX, clientY) => {
      if (!dragPlaneRef?.current || !wallGroupRef?.current) return;
      didDragRef.current = true;
      const rect = gl.domElement.getBoundingClientRect();
      ptr.current.set((clientX - rect.left) / rect.width * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
      raycaster.setFromCamera(ptr.current, camera);
      const hits = raycaster.intersectObject(dragPlaneRef.current);
      if (hits.length) {
        const pt = hits[0].point.clone();
        wallGroupRef.current.worldToLocal(pt);
        const result = clampAndSnap(
          pt.x,
          wallWidth,
          hasDoor ? doorCenterX : null,
          hasDoor ? doorWidth : 0,
          windowWidth,
          otherWindows
        );
        setSnappedToStud(result.snappedToStud);
        onPositionChange(wallId, index, result.x);
      }
    },
    [camera, raycaster, gl, dragPlaneRef, wallGroupRef, wallWidth, hasDoor, doorCenterX, doorWidth, onPositionChange, wallId, index, windowWidth, otherWindows]
  );

  const onPointerDown = (e) => {
    e.stopPropagation();
    e.target.setPointerCapture(e.pointerId);
    didDragRef.current = false;
    setSelectedElementId(elementId);
    setIsDraggingElement(true);
    const canvas = gl.domElement;
    const cleanup = () => {
      canvas.onpointermove = null;
      canvas.onpointerup = null;
      canvas.onpointerleave = null;
      e.target.releasePointerCapture?.(e.pointerId);
      setIsDraggingElement(false);
      if (didDragRef.current) setSelectedElementId(null);
    };
    canvas.onpointermove = (ev) => updateX(ev.clientX, ev.clientY);
    canvas.onpointerup = cleanup;
    canvas.onpointerleave = cleanup;
  };

  return (
    <group position={[x, windowCenterY, 0.5 * exteriorZSign]} castShadow>
      <mesh
        position={[0, 0, 0.1]}
        onPointerDown={onPointerDown}
        onPointerOver={(e) => { e.stopPropagation(); setIsHovered(true); gl.domElement.style.cursor = "move"; }}
        onPointerOut={(e) => { setIsHovered(false); gl.domElement.style.cursor = ""; }}
      >
        <boxGeometry args={[windowWidth + STUD * 2, windowHeight + STUD * 2, 0.5]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <WindowFrame
        windowWidth={windowWidth}
        windowHeight={windowHeight}
        windowType={windowType}
        positionX={0}
        positionY={0}
        trimMat={trimMat}
        isHovered={isHovered}
        isSelected={isSelected}
        isSnappedToStud={snappedToStud}
        exteriorZSign={exteriorZSign}
        showStructuralFraming={showFraming}
      />
    </group>
  );
}
