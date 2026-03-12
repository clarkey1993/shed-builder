/**
 * Log-lap cladding - Horizontal wooden boards with rounded front profile.
 * Boards run horizontally, overlap the board below, stack vertically.
 * Warm cedar tone with ±5% brightness variation.
 */
import { useMemo, useRef, useEffect } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "@react-three/drei";
import { useShedTexturesContext } from "../../../context/ShedTextureContext";

const BOARD_HEIGHT = 5;
const VISIBLE_COVERAGE = 4;
const BOARD_THICKNESS = 0.9; // Visible timber thickness for log-lap profile
const OVERLAP = 0.12;
const ROW_DEPTH_OFFSET = 0.18; // Depth stagger for clear shadow lines between rows
const LIGHT_CEDAR = "#c89b6d";
const COLOR_VARIATION = 0.05;

const Shiplap = ({
  width,
  height,
  windowOpenings = [],
  hasDoor,
  doorHalfWidth,
  doorHeight,
  claddingOpacity = 1,
}) => {
  const claddingRef = useRef();
  const { woodCladding, woodCladdingBump } = useShedTexturesContext();
  const plateThickness = 1.5;
  const studHeight = height - plateThickness * 2;
  // Fallback only when callers omit doorHeight (e.g. malformed props). Normal path: Wall passes doorDims.height.
  const doorH = doorHeight ?? 6 * 12;

  const doorTop = -height / 2 + doorH;
  const doorBottom = -height / 2;

  const flatCladdingInstances = useMemo(() => {
    const rows = [];
    const halfStudH = studHeight / 2;
    for (let y = -halfStudH + VISIBLE_COVERAGE / 2; y <= halfStudH - VISIBLE_COVERAGE / 2 + 0.1; y += VISIBLE_COVERAGE - OVERLAP) {
      let segs = [{ start: -width / 2, end: width / 2 }];
      const cut = (minX, maxX) => {
        segs = segs.flatMap((s) => {
          if (s.end <= minX || s.start >= maxX) return [s];
          const out = [];
          if (s.start < minX) out.push({ start: s.start, end: minX });
          if (s.end > maxX) out.push({ start: maxX, end: s.end });
          return out;
        });
      };
      if (doorHalfWidth > 0 && y >= doorBottom && y <= doorTop) {
        // TODO: move margin (2) into getOpeningClearance()
        cut(-doorHalfWidth - 2, doorHalfWidth + 2);
      }
      windowOpenings.forEach(({ x: wx, width: ww, height: wh }) => {
        // TODO: move margins (2 vertical, 3 horizontal) into getOpeningClearance()
        const winHalfH = wh / 2 + 2;
        if (y >= -winHalfH && y <= winHalfH) cut(wx - ww / 2 - 3, wx + ww / 2 + 3);
      });
      const segments = segs
        .filter((s) => s.end - s.start > 1)
        .map((s) => ({ xCenter: (s.start + s.end) / 2, segWidth: s.end - s.start }));
      rows.push({ y, segments });
    }
    const list = [];
    rows.forEach((row, rowIdx) => {
      row.segments.forEach((seg) => {
        list.push({
          x: seg.xCenter,
          y: row.y,
          width: seg.segWidth,
          rowIndex: rowIdx,
        });
      });
    });
    return list;
  }, [studHeight, width, doorHalfWidth, doorTop, doorBottom, windowOpenings]);

  useEffect(() => {
    const m = new THREE.Matrix4();
    const mesh = claddingRef.current;
    if (!mesh) return;
    const baseColor = new THREE.Color(LIGHT_CEDAR);
    flatCladdingInstances.forEach((inst, i) => {
      const depthOff = inst.rowIndex * ROW_DEPTH_OFFSET;
      m.compose(
        new THREE.Vector3(inst.x, inst.y, -BOARD_THICKNESS / 2 - 0.2 - depthOff),
        new THREE.Quaternion(),
        new THREE.Vector3(inst.width, 1, 1)
      );
      mesh.setMatrixAt(i, m);
      const shade = 1 + (Math.random() - 0.5) * COLOR_VARIATION * 2;
      const color = baseColor.clone().multiplyScalar(shade);
      mesh.setColorAt(i, color);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [flatCladdingInstances]);

  const claddingMat = useMemo(() => {
    const matProps = {
      color: LIGHT_CEDAR,
      roughness: 0.7,
      metalness: 0.1,
      transparent: claddingOpacity < 1,
      opacity: claddingOpacity,
      vertexColors: true,
    };
    if (!woodCladding) return <meshStandardMaterial {...matProps} />;
    const tex = woodCladding.clone();
    tex.repeat.set(width / 24, studHeight / 24);
    const bump = woodCladdingBump?.clone();
    if (bump) bump.repeat.set(width / 24, studHeight / 24);
    return <meshStandardMaterial {...matProps} map={tex} bumpMap={bump} bumpScale={0.02} />;
  }, [woodCladding, woodCladdingBump, studHeight, width, claddingOpacity]);

  if (flatCladdingInstances.length === 0) return null;

  return (
    <instancedMesh ref={claddingRef} args={[null, null, flatCladdingInstances.length]} castShadow receiveShadow>
      <RoundedBoxGeometry attach="geometry" args={[1, VISIBLE_COVERAGE, BOARD_THICKNESS]} radius={0.5} smoothness={4} />
      {claddingMat}
    </instancedMesh>
  );
};

export default Shiplap;
