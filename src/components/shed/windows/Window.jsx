import { useRef, useCallback, useState } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import WindowFrame from "./WindowFrame";
import { useBuilder } from "../../../context/BuilderContext";
import { getWindowDimensions } from "../../../systems/openings/getOpeningDimensions";
import { EDGE_CLEARANCE, minGapBetween, STUD, clampAndSnap } from "../../../systems/openings/windowPlacement";

// clampAndSnap now lives in windowPlacement.js and is shared with sidebar placement.

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
  onDelete,
  dragPlaneRef,
  wallGroupRef,
  trimMat,
  windowType = "STANDARD",
  otherWindows = [],
  exteriorZSign = 1,
}) {
  const { camera, raycaster, gl } = useThree();
  const { setIsDraggingElement, setSelectedElementId, selectedElementId, setPointerDownOnInteractive } = useBuilder();
  const ptr = useRef(new THREE.Vector2());
  const didDragRef = useRef(false);
  const startPosRef = useRef({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [snappedToStud, setSnappedToStud] = useState(false);

  const elementId = ELEMENT_ID(wallId, index);
  const isSelected = selectedElementId === elementId;
  const dims = getWindowDimensions(windowType);
  const { width: windowWidth, height: windowHeight } = dims;
  // Match exterior trim Z from WindowFrame (TRIM_Z * exteriorZSign), then push slightly outward
  const exteriorTrimZ = (0.2 + 0.6 / 2) * exteriorZSign; // TRIM_Z from WindowFrame.jsx
  const deleteButtonZ = exteriorTrimZ + 0.3 * exteriorZSign;

  const updateX = useCallback(
    (clientX, clientY) => {
      if (!dragPlaneRef?.current || !wallGroupRef?.current) return;
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
    startPosRef.current = { x: e.clientX, y: e.clientY };
    setPointerDownOnInteractive(true);
    setSelectedElementId(elementId);
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

  const safeX = Number.isFinite(x) ? x : 0;
  return (
    <group position={[safeX, windowCenterY, 0.5 * exteriorZSign]} castShadow>
      <mesh
        position={[0, 0, 0.1]}
        onPointerDown={onPointerDown}
        onPointerOver={(e) => { e.stopPropagation(); setIsHovered(true); gl.domElement.style.cursor = "move"; }}
        onPointerOut={(e) => { setIsHovered(false); gl.domElement.style.cursor = ""; }}
      >
        <boxGeometry args={[windowWidth + STUD * 2, windowHeight + STUD * 2, 0.5]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      {isSelected && typeof onDelete === "function" && (
        <mesh
          position={[windowWidth / 2 + 6, windowHeight / 2 + 6, deleteButtonZ]}
          onPointerDown={(e) => {
            e.stopPropagation();
            onDelete(wallId, index);
          }}
        >
          <boxGeometry args={[6, 6, 0.5]} />
          <meshBasicMaterial color="#ff4b4b" />
        </mesh>
      )}
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
