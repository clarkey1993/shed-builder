/**
 * Log-lap cladding - Horizontal wooden boards with rounded front profile.
 * Boards run horizontally, overlap the board below, stack vertically.
 * Supports rectangular walls (height) or trapezoid (heightAtStart, heightAtEnd, yCenter).
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

function getTrapezoidXRangeAtY(width, heightAtStart, heightAtEnd, yCenter, y) {
  const yTopLeft = heightAtStart - yCenter;
  const yTopRight = heightAtEnd - yCenter;
  const yMin = Math.min(yTopLeft, yTopRight);
  const yMax = Math.max(yTopLeft, yTopRight);
  if (y <= yMin) return { xLeft: -width / 2, xRight: width / 2 };
  if (y > yMax) return null;
  const slope = (yTopRight - yTopLeft) / width;
  if (Math.abs(slope) < 1e-6) return { xLeft: -width / 2, xRight: width / 2 };
  const xAtY = (y - yTopLeft) / slope - width / 2;
  if (yTopLeft < yTopRight) return { xLeft: xAtY, xRight: width / 2 };
  return { xLeft: -width / 2, xRight: xAtY };
}

function getGableXRangeAtY(width, eaveHeight, peakHeight, yCenter, y) {
  const yEave = eaveHeight - yCenter;
  const yPeak = peakHeight - yCenter;
  if (y <= yEave) return { xLeft: -width / 2, xRight: width / 2 };
  if (y > yPeak) return null;
  const rise = peakHeight - eaveHeight;
  if (rise <= 0) return { xLeft: -width / 2, xRight: width / 2 };
  const halfW = (yPeak - y) / rise * (width / 2);
  return { xLeft: -halfW, xRight: halfW };
}

const Shiplap = ({
  width,
  height,
  heightAtStart,
  heightAtEnd,
  eaveHeight,
  peakHeight,
  yCenter,
  windowOpenings = [],
  doorOpening = null,
  claddingOpacity = 1,
  exteriorZSign = 1,
}) => {
  const meshRef0 = useRef();
  const meshRef1 = useRef();
  const meshRef2 = useRef();
  const plateThickness = 1.5;
  const isTrapezoid = typeof heightAtStart === "number" && typeof heightAtEnd === "number" && typeof yCenter === "number";
  const isGable = typeof eaveHeight === "number" && typeof peakHeight === "number" && typeof yCenter === "number";

  const studHeight = isTrapezoid ? Math.max(heightAtStart, heightAtEnd) - plateThickness * 2 : isGable ? peakHeight - plateThickness * 2 : height - plateThickness * 2;
  const halfStudH = studHeight / 2;
  const doorBottom = -height / 2;
  const doorTop = doorOpening ? -height / 2 + doorOpening.height : -height / 2;
  const doorMinX = doorOpening ? doorOpening.x - doorOpening.width / 2 - OPENING_MARGIN : 0;
  const doorMaxX = doorOpening ? doorOpening.x + doorOpening.width / 2 + OPENING_MARGIN : 0;

  const flatCladdingInstances = useMemo(() => {
    const rows = [];
    const step = VISIBLE_COVERAGE - OVERLAP;
    const yStart = isTrapezoid || isGable ? -yCenter + VISIBLE_COVERAGE / 2 : -halfStudH + VISIBLE_COVERAGE / 2;
    const yMaxWallTrap = isTrapezoid ? Math.max(heightAtStart, heightAtEnd) - yCenter : null;
    const yMaxWallGable = isGable ? peakHeight - yCenter : null;

    let rowYValues;
    if (isTrapezoid) {
      const yTopRowCenter = yMaxWallTrap - VISIBLE_COVERAGE / 2;
      rowYValues = [];
      for (let y = yStart; y < yTopRowCenter - 0.01; y += step) rowYValues.push(y);
      if (rowYValues.length === 0 || rowYValues[rowYValues.length - 1] < yTopRowCenter - 0.01) {
        rowYValues.push(yTopRowCenter);
      }
    } else if (isGable) {
      const yTopRowCenter = yMaxWallGable - VISIBLE_COVERAGE / 2;
      rowYValues = [];
      for (let y = yStart; y < yTopRowCenter - 0.01; y += step) rowYValues.push(y);
      if (rowYValues.length === 0 || rowYValues[rowYValues.length - 1] < yTopRowCenter - 0.01) {
        rowYValues.push(yTopRowCenter);
      }
    } else {
      const yEnd = halfStudH - VISIBLE_COVERAGE / 2 + 0.1;
      rowYValues = [];
      for (let y = yStart; y <= yEnd; y += step) rowYValues.push(y);
    }

    for (const y of rowYValues) {
      let xLeft, xRight;
      if (isTrapezoid) {
        const yBoardTop = y + VISIBLE_COVERAGE / 2;
        if (yBoardTop > yMaxWallTrap) continue;
        const range = getTrapezoidXRangeAtY(width, heightAtStart, heightAtEnd, yCenter, yBoardTop);
        if (!range) continue;
        xLeft = range.xLeft;
        xRight = range.xRight;
      } else if (isGable) {
        const yBoardTop = y + VISIBLE_COVERAGE / 2;
        if (yBoardTop > yMaxWallGable) continue;
        const range = getGableXRangeAtY(width, eaveHeight, peakHeight, yCenter, yBoardTop);
        if (!range) continue;
        xLeft = range.xLeft;
        xRight = range.xRight;
      } else {
        xLeft = -width / 2;
        xRight = width / 2;
      }
      let segs = [{ start: xLeft, end: xRight }];
      const cut = (minX, maxX) => {
        segs = segs.flatMap((s) => {
          if (s.end <= minX || s.start >= maxX) return [s];
          const out = [];
          if (s.start < minX) out.push({ start: s.start, end: minX });
          if (s.end > maxX) out.push({ start: maxX, end: s.end });
          return out;
        });
      };
      if (doorOpening && y >= doorBottom && y <= doorTop) cut(doorMinX, doorMaxX);
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
        list.push({ x: seg.xCenter, y: row.y, width: seg.segWidth, rowIndex: rowIdx });
      });
    });
    return list;
  }, [isTrapezoid, isGable, width, height, heightAtStart, heightAtEnd, eaveHeight, peakHeight, yCenter, studHeight, halfStudH, doorOpening, doorTop, doorBottom, doorMinX, doorMaxX, windowOpenings]);

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
