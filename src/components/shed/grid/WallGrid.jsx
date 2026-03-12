/**
 * WallGrid - 6" cell grid overlay with 24" stud spacing highlight.
 * Shown when window is selected or dragged for precise placement.
 */
import { useMemo } from "react";
import * as THREE from "three";
import { GRID } from "../../../config/buildGrid";

const CELL_SIZE = GRID.CELL_SIZE;
const STUD_SPACING = GRID.STUD_SPACING;
const GRID_COLOR = 0x4a5568;
const STUD_COLOR = 0x2d3748;
const OPACITY = 0.6;

const WallGrid = ({ wallId, width, height, visible }) => {
  const lines = useMemo(() => {
    if (!visible) return null;
    const group = new THREE.Group();
    const material = new THREE.LineBasicMaterial({
      color: GRID_COLOR,
      transparent: true,
      opacity: OPACITY,
      depthTest: false,
    });
    const studMaterial = new THREE.LineBasicMaterial({
      color: STUD_COLOR,
      transparent: true,
      opacity: OPACITY * 1.2,
      depthTest: false,
    });
    const halfW = width / 2;
    const halfH = height / 2;
    for (let x = -halfW; x <= halfW + 0.1; x += CELL_SIZE) {
      const isStud = Math.abs((x + halfW) % STUD_SPACING) < 0.5;
      const pts = [new THREE.Vector3(x, -halfH, 0.3), new THREE.Vector3(x, halfH, 0.3)];
      group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), isStud ? studMaterial : material));
    }
    for (let y = -halfH; y <= halfH + 0.1; y += CELL_SIZE) {
      const isStud = Math.abs((y + halfH) % STUD_SPACING) < 0.5;
      const pts = [new THREE.Vector3(-halfW, y, 0.3), new THREE.Vector3(halfW, y, 0.3)];
      group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), isStud ? studMaterial : material));
    }
    return group;
  }, [width, height, visible]);

  if (!visible || !lines) return null;
  return <primitive object={lines} />;
};

export default WallGrid;
