import { useRef, useCallback, useState } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import WindowFrame from "./WindowFrame";
import { useBuilder } from "../../../context/BuilderContext";
import { getWindowDimensions } from "../../../systems/openings/getOpeningDimensions";
import { GRID_SNAP, STUD_SNAP, STUD_ASSIST_DIST } from "../../../systems/snapping/snapRules";

const STUD = 3;
const CLADDING_BOARD_HEIGHT = 5;

function minGapBetween(windowWidth, otherWidth) {
  return windowWidth / 2 + otherWidth / 2 + STUD * 2;
}

function clampAndSnap(x, wallWidth, doorHalfWidth, windowWidth, otherWindows = []) {
  const hw = windowWidth / 2 + STUD;
  let min = -wallWidth / 2 + hw, max = wallWidth / 2 - hw;
  if (doorHalfWidth > 0) {
    const doorMin = -doorHalfWidth - hw, doorMax = doorHalfWidth + hw;
    if (x >= doorMin && x <= doorMax) x = x < 0 ? doorMin : doorMax;
  }
  for (const other of otherWindows) {
    const gap = minGapBetween(windowWidth, other.width);
    if (x > other.x - gap / 2 && x < other.x + gap / 2) {
      x = x < other.x ? other.x - gap / 2 : other.x + gap / 2;
    }
  }
  x = Math.max(min, Math.min(max, x));
  const studSnap = Math.round(x / STUD_SNAP) * STUD_SNAP;
  if (Math.abs(x - studSnap) <= STUD_ASSIST_DIST) return studSnap;
  return Math.round(x / GRID_SNAP) * GRID_SNAP;
}

const ELEMENT_ID = (wallId, index) => `window-${wallId}-${index}`;

export default function Window({
  x, wallId, index, wallWidth, wallHeight,
  hasDoor, doorHalfWidth, showFraming = false,
  onPositionChange, dragPlaneRef, wallGroupRef, trimMat,
  windowType = "STANDARD",
  otherWindows = [],
  exteriorZSign = 1,
}) {
  const { camera, raycaster, gl } = useThree();
  const { setIsDraggingElement, setSelectedElementId, selectedElementId } = useBuilder();
  const ptr = useRef(new THREE.Vector2());
  const didDragRef = useRef(false);
  const [isHovered, setIsHovered] = useState(false);

  const elementId = ELEMENT_ID(wallId, index);
  const isSelected = selectedElementId === elementId;
  const dims = getWindowDimensions(windowType);
  const { width: windowWidth, height: windowHeight } = dims;
  const windowTop = wallHeight / 2 - CLADDING_BOARD_HEIGHT;
  const windowCenterY = windowTop - windowHeight / 2;

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
        onPositionChange(wallId, index, clampAndSnap(pt.x, wallWidth, hasDoor ? doorHalfWidth : 0, windowWidth, otherWindows));
      }
    },
    [camera, raycaster, gl, dragPlaneRef, wallGroupRef, wallWidth, hasDoor, doorHalfWidth, onPositionChange, wallId, index, windowWidth, otherWindows]
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
        positionX={0}
        positionY={0}
        trimMat={trimMat}
        isHovered={isHovered}
        isSelected={isSelected}
        exteriorZSign={exteriorZSign}
        showStructuralFraming={showFraming}
      />
    </group>
  );
}
