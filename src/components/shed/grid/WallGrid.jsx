/**
 * WallGrid - cell grid overlay with stud spacing highlight.
 * Shown when window is selected or dragged for precise placement.
 * Supports rectangular, trapezoid, and gable wall profiles.
 */
import { useMemo } from "react";
import * as THREE from "three";
import { GRID } from "../../../config/buildGrid";

const CELL_SIZE = GRID.CELL_SIZE;
const STUD_SPACING = GRID.STUD_SPACING;
const GRID_COLOR = 0x4a5568;
const STUD_COLOR = 0x2d3748;
const OPACITY = 0.6;
const Z_OFFSET = 0.3;

function getTrapezoidTopAtX(width, heightAtStart, heightAtEnd, yCenter, x) {
  const t = (x + width / 2) / width;
  const topHeight = heightAtStart + (heightAtEnd - heightAtStart) * t;
  return topHeight - yCenter;
}

function getGableTopAtX(width, eaveHeight, peakHeight, yCenter, x) {
  const halfW = width / 2;
  const t = 1 - Math.abs(x) / halfW;
  const topHeight = eaveHeight + (peakHeight - eaveHeight) * t;
  return topHeight - yCenter;
}

const WallGrid = ({
  wallId,
  width,
  height,
  visible,
  isTrapezoidal = false,
  isGable = false,
  heightAtStart,
  heightAtEnd,
  eaveHeight,
  peakHeight,
  yCenter,
}) => {
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
    const bottomY =
      isTrapezoidal || isGable
        ? -yCenter
        : -height / 2;

    const getTopAtX = (x) => {
      if (
        isTrapezoidal &&
        typeof heightAtStart === "number" &&
        typeof heightAtEnd === "number" &&
        typeof yCenter === "number"
      ) {
        return getTrapezoidTopAtX(width, heightAtStart, heightAtEnd, yCenter, x);
      }

      if (
        isGable &&
        typeof eaveHeight === "number" &&
        typeof peakHeight === "number" &&
        typeof yCenter === "number"
      ) {
        return getGableTopAtX(width, eaveHeight, peakHeight, yCenter, x);
      }

      return height / 2;
    };

    const maxTopY =
      isTrapezoidal || isGable
        ? Math.max(getTopAtX(-halfW), getTopAtX(0), getTopAtX(halfW))
        : height / 2;

    // Vertical lines
    for (let x = -halfW; x <= halfW + 0.1; x += CELL_SIZE) {
      const isStud = Math.abs((x + halfW) % STUD_SPACING) < 0.5;
      const yTop = getTopAtX(x);
      const pts = [
        new THREE.Vector3(x, bottomY, Z_OFFSET),
        new THREE.Vector3(x, yTop, Z_OFFSET),
      ];
      group.add(
        new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(pts),
          isStud ? studMaterial : material
        )
      );
    }

    // Horizontal lines
    for (let y = bottomY; y <= maxTopY + 0.1; y += CELL_SIZE) {
      if (
        isTrapezoidal &&
        typeof heightAtStart === "number" &&
        typeof heightAtEnd === "number" &&
        typeof yCenter === "number"
      ) {
        let segmentStart = null;

        for (let x = -halfW; x <= halfW + 0.1; x += 1) {
          const yTop = getTrapezoidTopAtX(width, heightAtStart, heightAtEnd, yCenter, x);
          const inside = y <= yTop;

          if (inside && segmentStart === null) {
            segmentStart = x;
          } else if (!inside && segmentStart !== null) {
            const pts = [
              new THREE.Vector3(segmentStart, y, Z_OFFSET),
              new THREE.Vector3(x - 1, y, Z_OFFSET),
            ];
            group.add(
              new THREE.Line(
                new THREE.BufferGeometry().setFromPoints(pts),
                material
              )
            );
            segmentStart = null;
          }
        }

        if (segmentStart !== null) {
          const pts = [
            new THREE.Vector3(segmentStart, y, Z_OFFSET),
            new THREE.Vector3(halfW, y, Z_OFFSET),
          ];
          group.add(
            new THREE.Line(
              new THREE.BufferGeometry().setFromPoints(pts),
              material
            )
          );
        }
      } else if (
        isGable &&
        typeof eaveHeight === "number" &&
        typeof peakHeight === "number" &&
        typeof yCenter === "number"
      ) {
        let segmentStart = null;

        for (let x = -halfW; x <= halfW + 0.1; x += 1) {
          const yTop = getGableTopAtX(width, eaveHeight, peakHeight, yCenter, x);
          const inside = y <= yTop;

          if (inside && segmentStart === null) {
            segmentStart = x;
          } else if (!inside && segmentStart !== null) {
            const pts = [
              new THREE.Vector3(segmentStart, y, Z_OFFSET),
              new THREE.Vector3(x - 1, y, Z_OFFSET),
            ];
            group.add(
              new THREE.Line(
                new THREE.BufferGeometry().setFromPoints(pts),
                material
              )
            );
            segmentStart = null;
          }
        }

        if (segmentStart !== null) {
          const pts = [
            new THREE.Vector3(segmentStart, y, Z_OFFSET),
            new THREE.Vector3(halfW, y, Z_OFFSET),
          ];
          group.add(
            new THREE.Line(
              new THREE.BufferGeometry().setFromPoints(pts),
              material
            )
          );
        }
      } else {
        const isStud = Math.abs((y - bottomY) % STUD_SPACING) < 0.5;
        const pts = [
          new THREE.Vector3(-halfW, y, Z_OFFSET),
          new THREE.Vector3(halfW, y, Z_OFFSET),
        ];
        group.add(
          new THREE.Line(
            new THREE.BufferGeometry().setFromPoints(pts),
            isStud ? studMaterial : material
          )
        );
      }
    }

    return group;
  }, [
    width,
    height,
    visible,
    isTrapezoidal,
    isGable,
    heightAtStart,
    heightAtEnd,
    eaveHeight,
    peakHeight,
    yCenter,
  ]);

  if (!visible || !lines) return null;
  return <primitive object={lines} />;
};

export default WallGrid;
