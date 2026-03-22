/**
 * WindowFrame - Finished exterior trim (customer) + optional structural framing (builder).
 * Customer view: slim exterior trim only. Builder view (showStructuralFraming): add header/sill/jambs.
 */
import { useMemo } from "react";
import { Box } from "@react-three/drei";
import * as THREE from "three";
import { useShedTexturesContext } from "../../../context/ShedTextureContext";
import { windowStructuralFramingZOffset } from "../../../config/wallDepth";
import { FRAMING_COLOR } from "../../../config/framingConstants";

// Structural framing (builder/debug only) - header, sill, jambs
const STUD_THICKNESS = 2;
const STUD_WIDTH = 3;

// Finished exterior trim (customer) - slim casing around the opening
const EXTERIOR_TRIM_WIDTH = 1.25;
const EXTERIOR_TRIM_THICKNESS = 0.6;

// Structural opening (for reference only; cladding/framing use their own margins - do not change).
const OPENING_SIDE_MARGIN = 3;
const OPENING_TOP_BOTTOM_MARGIN = 2;

// Customer-facing visual: size from nominal unit with a slim trim allowance so it reads close to quoted size.
const VISUAL_TRIM_ALLOWANCE = 0.5;
// Double window: central vertical divider between the two glazing panels (inches).
const MULLION_WIDTH = 2;
// Gap between glazing and mullion each side (inches).
const MULLION_GLAZING_GAP = 0.5;

const TRIM_Z = 0.2 + EXTERIOR_TRIM_THICKNESS / 2;
const WindowFrame = ({
  windowWidth,
  windowHeight,
  windowType = "STANDARD",
  positionX,
  positionY,
  trimMat,
  isHovered = false,
  isSelected = false,
  isSnappedToStud = false,
  exteriorZSign = 1,
  showStructuralFraming = false,
}) => {
  const trimZ = TRIM_Z * exteriorZSign;
  const { woodFraming } = useShedTexturesContext();
  const emissive =
    isHovered || isSelected ? 0.08 : isSnappedToStud ? 0.12 : 0;
  const WARM_CEDAR = "#e0b890";
  const structuralFramingMat = woodFraming ? (
    <meshStandardMaterial map={woodFraming} roughness={0.8} metalness={0.02} color={FRAMING_COLOR} emissive="#111" emissiveIntensity={emissive} />
  ) : (
    <meshStandardMaterial color={FRAMING_COLOR} roughness={0.8} metalness={0.02} emissive="#111" emissiveIntensity={emissive} />
  );
  const trim = trimMat || <meshStandardMaterial color={WARM_CEDAR} roughness={0.72} metalness={0.02} />;
  const tw = EXTERIOR_TRIM_WIDTH;
  const tt = EXTERIOR_TRIM_THICKNESS;

  // Structural opening (unchanged; used by cladding/framing elsewhere - not for customer-facing size).
  const openingW = windowWidth + OPENING_SIDE_MARGIN * 2;
  const openingH = windowHeight + OPENING_TOP_BOTTOM_MARGIN * 2;

  // Customer-facing glazing: nominal + slim allowance so it reads close to 24×24.
  const visualW = windowWidth + 2 * VISUAL_TRIM_ALLOWANCE;
  const visualH = windowHeight + 2 * VISUAL_TRIM_ALLOWANCE;
  // Trim bridges from glazing edge to cutout edge so no gap shows; outer trim envelope = opening.
  const topBottomTrimHeight = Math.max(tw, openingH / 2 - visualH / 2);
  const sideTrimWidth = Math.max(tw, openingW / 2 - visualW / 2);
  const glazingZ = trimZ - tt * 0.6;
  const GLAZING_COLOR = "#f5f5f0";

  // DOUBLE (horizontal): two panels side by side with vertical mullion.
  const doubleGlazingWidth = (visualW - MULLION_WIDTH - 2 * MULLION_GLAZING_GAP) / 2;
  const doubleLeftCenterX = -(MULLION_WIDTH / 2 + MULLION_GLAZING_GAP + doubleGlazingWidth / 2);
  const doubleRightCenterX = MULLION_WIDTH / 2 + MULLION_GLAZING_GAP + doubleGlazingWidth / 2;

  // DOUBLE_VERTICAL: two panels stacked with horizontal mullion.
  const doubleVertGlazingHeight = (visualH - MULLION_WIDTH - 2 * MULLION_GLAZING_GAP) / 2;
  const doubleVertTopCenterY = MULLION_WIDTH / 2 + MULLION_GLAZING_GAP + doubleVertGlazingHeight / 2;
  const doubleVertBottomCenterY = -(MULLION_WIDTH / 2 + MULLION_GLAZING_GAP + doubleVertGlazingHeight / 2);

  const outlineLine = useMemo(() => {
    const m = 2;
    const outlineZ = 0.5 * exteriorZSign;
    const pts = [
      new THREE.Vector3(-openingW / 2 - m, openingH / 2 + m, outlineZ),
      new THREE.Vector3(openingW / 2 + m, openingH / 2 + m, outlineZ),
      new THREE.Vector3(openingW / 2 + m, -openingH / 2 - m, outlineZ),
      new THREE.Vector3(-openingW / 2 - m, -openingH / 2 - m, outlineZ),
      new THREE.Vector3(-openingW / 2 - m, openingH / 2 + m, outlineZ),
    ];
    const geom = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineBasicMaterial({ color: 0x4a5568 });
    return new THREE.Line(geom, mat);
  }, [openingW, openingH, exteriorZSign]);

  // Structural framing aligned with wall framing depth; interior side only, never visible from exterior
  const interiorZ = windowStructuralFramingZOffset(exteriorZSign);

  return (
    <group position={[positionX, positionY, 0]}>
      {(isHovered || isSelected) && <primitive object={outlineLine} />}
      {/* Structural framing: interior side only — header, sill, jambs; never visible from exterior */}
      {showStructuralFraming && (
        <group position={[0, 0, interiorZ]}>
          <Box args={[windowWidth, STUD_WIDTH, STUD_THICKNESS]} position={[0, windowHeight / 2 - STUD_WIDTH / 2, 0]} castShadow>
            {structuralFramingMat}
          </Box>
          <Box args={[windowWidth, STUD_WIDTH, STUD_THICKNESS]} position={[0, -windowHeight / 2 + STUD_WIDTH / 2, 0]} castShadow>
            {structuralFramingMat}
          </Box>
          <Box args={[STUD_WIDTH, windowHeight - STUD_WIDTH * 2, STUD_THICKNESS]} position={[-windowWidth / 2 - STUD_WIDTH / 2, 0, 0]} castShadow>
            {structuralFramingMat}
          </Box>
          <Box args={[STUD_WIDTH, windowHeight - STUD_WIDTH * 2, STUD_THICKNESS]} position={[windowWidth / 2 + STUD_WIDTH / 2, 0, 0]} castShadow>
            {structuralFramingMat}
          </Box>
        </group>
      )}
      {/* Customer-facing glazing: single panel or double (horizontal/vertical) with central mullion */}
      {windowType === "DOUBLE" ? (
        <>
          <Box args={[doubleGlazingWidth, visualH, 0.08]} position={[doubleLeftCenterX, 0, glazingZ]} castShadow>
            <meshStandardMaterial color={GLAZING_COLOR} roughness={0.4} metalness={0.02} />
          </Box>
          <Box args={[doubleGlazingWidth, visualH, 0.08]} position={[doubleRightCenterX, 0, glazingZ]} castShadow>
            <meshStandardMaterial color={GLAZING_COLOR} roughness={0.4} metalness={0.02} />
          </Box>
          <Box args={[MULLION_WIDTH, visualH, tt]} position={[0, 0, glazingZ + tt / 2]} castShadow>
            <meshStandardMaterial color="#8b7355" roughness={0.75} metalness={0.02} />
          </Box>
        </>
      ) : windowType === "DOUBLE_VERTICAL" ? (
        <>
          <Box args={[visualW, doubleVertGlazingHeight, 0.08]} position={[0, doubleVertTopCenterY, glazingZ]} castShadow>
            <meshStandardMaterial color={GLAZING_COLOR} roughness={0.4} metalness={0.02} />
          </Box>
          <Box args={[visualW, doubleVertGlazingHeight, 0.08]} position={[0, doubleVertBottomCenterY, glazingZ]} castShadow>
            <meshStandardMaterial color={GLAZING_COLOR} roughness={0.4} metalness={0.02} />
          </Box>
          <Box args={[visualW, MULLION_WIDTH, tt]} position={[0, 0, glazingZ + tt / 2]} castShadow>
            <meshStandardMaterial color="#8b7355" roughness={0.75} metalness={0.02} />
          </Box>
        </>
      ) : (
        <Box args={[visualW, visualH, 0.08]} position={[0, 0, glazingZ]} castShadow>
          <meshStandardMaterial color={GLAZING_COLOR} roughness={0.4} metalness={0.02} />
        </Box>
      )}
      {/* Trim bridges glazing → cutout: no gap; outer envelope = opening */}
      <Box
        args={[openingW, topBottomTrimHeight, tt]}
        position={[0, visualH / 2 + topBottomTrimHeight / 2, trimZ]}
        castShadow
      >
        {trim}
      </Box>
      <Box
        args={[openingW, topBottomTrimHeight, tt]}
        position={[0, -visualH / 2 - topBottomTrimHeight / 2, trimZ]}
        castShadow
      >
        {trim}
      </Box>
      <Box
        args={[sideTrimWidth, openingH, tt]}
        position={[-visualW / 2 - sideTrimWidth / 2, 0, trimZ]}
        castShadow
      >
        {trim}
      </Box>
      <Box
        args={[sideTrimWidth, openingH, tt]}
        position={[visualW / 2 + sideTrimWidth / 2, 0, trimZ]}
        castShadow
      >
        {trim}
      </Box>
    </group>
  );
};

export default WindowFrame;
