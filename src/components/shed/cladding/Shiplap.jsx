/**
 * Log-lap cladding - Horizontal wooden boards with rounded front profile.
 * Boards run horizontally, overlap the board below, stack vertically.
 * Warm cedar tone with ±5% brightness variation.
 */
import { useMemo, useRef, useEffect } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "@react-three/drei";
const BOARD_HEIGHT = 5;
const VISIBLE_COVERAGE = 4;
const BOARD_THICKNESS = 0.9; // Thicker boards for log-lap groove shadow
const OVERLAP = 0.12;
const BASE_CEDAR = "#d2a679";
const CLADDING_OFFSET = 0.2;

const OPENING_MARGIN = 2;

const Shiplap = ({
  width,
  height,
  windowOpenings = [],
  doorOpening = null,
  claddingOpacity = 1,
  exteriorZSign = 1, // +1 = exterior at +Z, -1 = exterior at -Z (per wall rotation)
}) => {
  const meshRef0 = useRef();
  const meshRef1 = useRef();
  const meshRef2 = useRef();
  const plateThickness = 1.5;
  const studHeight = height - plateThickness * 2;

  const doorBottom = -height / 2;
  const doorTop = doorOpening ? -height / 2 + doorOpening.height : -height / 2;
  const doorMinX = doorOpening ? doorOpening.x - doorOpening.width / 2 - OPENING_MARGIN : 0;
  const doorMaxX = doorOpening ? doorOpening.x + doorOpening.width / 2 + OPENING_MARGIN : 0;

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
      if (doorOpening && y >= doorBottom && y <= doorTop) {
        cut(doorMinX, doorMaxX);
      }
      windowOpenings.forEach(({ x: wx, y: wy, width: ww, height: wh }) => {
        const centerY = wy ?? 0;
        const winMinY = centerY - wh / 2 - 2;
        const winMaxY = centerY + wh / 2 + 2;
        if (y >= winMinY && y <= winMaxY) cut(wx - ww / 2 - 3, wx + ww / 2 + 3);
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
  }, [studHeight, width, doorOpening, doorTop, doorBottom, doorMinX, doorMaxX, windowOpenings]);

  const instancesByShade = useMemo(() => {
    const groups = [[], [], []];
    flatCladdingInstances.forEach((inst) => {
      const shadeIdx = inst.rowIndex % 3;
      groups[shadeIdx].push(inst);
    });
    return groups;
  }, [flatCladdingInstances]);

  useEffect(() => {
    const m = new THREE.Matrix4();
    const claddingZ = exteriorZSign * (BOARD_THICKNESS / 2 + CLADDING_OFFSET);
    [meshRef0, meshRef1, meshRef2].forEach((ref, shadeIdx) => {
      const mesh = ref.current;
      if (!mesh) return;
      const group = instancesByShade[shadeIdx];
      group.forEach((inst, i) => {
        const yOffset = inst.rowIndex * -0.03;
        m.compose(
          new THREE.Vector3(inst.x, inst.y + yOffset, claddingZ),
          new THREE.Quaternion(),
          new THREE.Vector3(inst.width, 1, 1)
        );
        mesh.setMatrixAt(i, m);
      });
      mesh.instanceMatrix.needsUpdate = true;
    });
  }, [instancesByShade, exteriorZSign]);

  const rowShades = [0.95, 1, 1.05]; // 1 + (rowIndex % 3 - 1) * 0.05
  const materials = useMemo(() => rowShades.map((shade) => {
    const c = new THREE.Color(BASE_CEDAR).multiplyScalar(shade);
    return (
      <meshStandardMaterial
        key={shade}
        color={c.getStyle()}
        roughness={0.75}
        metalness={0.02}
      />
    );
  }), []);

  if (flatCladdingInstances.length === 0) return null;

  return (
    <>
      {instancesByShade.map((group, i) => (
        group.length > 0 && (
          <instancedMesh
            key={i}
            ref={[meshRef0, meshRef1, meshRef2][i]}
            args={[null, null, group.length]}
            castShadow={false}
            receiveShadow={false}
          >
            <RoundedBoxGeometry attach="geometry" args={[1, VISIBLE_COVERAGE, BOARD_THICKNESS]} radius={0.25} smoothness={4} />
            {materials[i]}
          </instancedMesh>
        )
      ))}
    </>
  );
};

export default Shiplap;
