import { useRef, useCallback, useState } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import WindowFrame from "./WindowFrame";
import { useBuilder } from "../../../context/BuilderContext";
import { getWindowDimensions } from "../../../systems/openings/getOpeningDimensions";
import { EDGE_CLEARANCE, minGapBetween, STUD } from "../../../systems/openings/windowPlacement";
import { GRID_SNAP, STUD_SNAP, STUD_ASSIST_DIST } from "../../../systems/snapping/snapRules";

/**
 * Bay centers = midpoints between consecutive studs.
 * Uses same layout as generateWallFraming: stud spacing STUD_SNAP (24"), studs at
 * -halfW + i * actualSpacing, so bay centers at -halfW + (i + 0.5) * actualSpacing.
 * Returns only centers that are within [min, max] and clear of other windows.
 * Door zone is not excluded so windows can be placed over/above the door if desired.
 */
function getValidBayCenters(wallWidth, min, max, doorCenterX, doorWidth, windowWidth, otherWindows) {
  if (typeof wallWidth !== "number" || !Number.isFinite(wallWidth) || wallWidth <= 0) return [];
  const halfW = wallWidth / 2;
  const numStuds = Math.floor(wallWidth / STUD_SNAP) + 1;
  if (numStuds <= 1) return [];
  const actualSpacing = wallWidth / (numStuds - 1);
  if (!Number.isFinite(actualSpacing)) return [];
  const centers = [];
  for (let i = 0; i < numStuds - 1; i++) {
    const c = -halfW + (i + 0.5) * actualSpacing;
    if (!Number.isFinite(c) || c < min || c > max) continue;
    let blocked = false;
    for (const other of otherWindows) {
      const ow = typeof other.width === "number" && Number.isFinite(other.width) ? other.width : 24;
      const ox = typeof other.x === "number" && Number.isFinite(other.x) ? other.x : 0;
      const gap = minGapBetween(windowWidth, ow);
      if (c >= ox - gap / 2 && c <= ox + gap / 2) {
        blocked = true;
        break;
      }
    }
    if (!blocked) centers.push(c);
  }
  return centers.filter((c) => Number.isFinite(c));
}

/**
 * Clamp to structurally valid range (edges, other windows), then snap.
 * Door zone is not excluded so windows can be placed over/above the door if desired.
 * Primary: nearest valid bay center (structural bay midpoint) when within STUD_ASSIST_DIST;
 * secondary: 6" grid. Bay centers match framing stud layout (24" spacing).
 * Returns both the snapped X and whether it hit a bay.
 */
function clampAndSnap(
  x,
  wallWidth,
  doorCenterX,
  doorWidth,
  windowWidth,
  otherWindows = []
) {
  if (typeof wallWidth !== "number" || !Number.isFinite(wallWidth) || wallWidth <= 0) {
    return { x: 0, snappedToStud: false };
  }
  const halfWindow = (typeof windowWidth === "number" && Number.isFinite(windowWidth) ? windowWidth : 24) / 2;
  let min = -wallWidth / 2 + halfWindow + EDGE_CLEARANCE;
  let max = wallWidth / 2 - halfWindow - EDGE_CLEARANCE;
  if (!Number.isFinite(min) || !Number.isFinite(max) || min > max) {
    return { x: 0, snappedToStud: false };
  }

  for (const other of otherWindows) {
    const ow = typeof other.width === "number" && Number.isFinite(other.width) ? other.width : 24;
    const ox = typeof other.x === "number" && Number.isFinite(other.x) ? other.x : 0;
    const gap = minGapBetween(windowWidth, ow);
    if (x > ox - gap / 2 && x < ox + gap / 2) {
      x = x < ox ? ox - gap / 2 : ox + gap / 2;
    }
  }

  x = Math.max(min, Math.min(max, Number.isFinite(x) ? x : 0));

  const validBays = getValidBayCenters(wallWidth, min, max, doorCenterX, doorWidth, windowWidth, otherWindows);
  if (validBays.length > 0) {
    let nearest = validBays[0];
    let bestDist = Math.abs(x - nearest);
    for (let i = 1; i < validBays.length; i++) {
      const d = Math.abs(x - validBays[i]);
      if (Number.isFinite(d) && d < bestDist) {
        bestDist = d;
        nearest = validBays[i];
      }
    }
    if (Number.isFinite(nearest) && bestDist <= STUD_ASSIST_DIST) {
      const snapped = Math.max(min, Math.min(max, nearest));
      const out = Number.isFinite(snapped) ? snapped : Math.max(min, Math.min(max, 0));
      return { x: out, snappedToStud: true };
    }
  }

  const gridSnap = Math.round(x / GRID_SNAP) * GRID_SNAP;
  const snapped = Math.max(min, Math.min(max, Number.isFinite(gridSnap) ? gridSnap : 0));
  const out = Number.isFinite(snapped) ? snapped : Math.max(min, Math.min(max, 0));
  return { x: out, snappedToStud: false };
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
