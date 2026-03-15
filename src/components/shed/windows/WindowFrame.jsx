/**
 * WindowFrame - Finished exterior trim (customer) + optional structural framing (builder).
 * Customer view: slim exterior trim only. Builder view (showStructuralFraming): add header/sill/jambs.
 */
import { useMemo } from "react";
import { Box } from "@react-three/drei";
import * as THREE from "three";
import { useShedTexturesContext } from "../../../context/ShedTextureContext";

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

const TRIM_Z = 0.2 + EXTERIOR_TRIM_THICKNESS / 2;
const WindowFrame = ({
  windowWidth,
  windowHeight,
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
  const STRUCTURAL_TIMBER = "#5c4033";
  const structuralFramingMat = woodFraming ? (
    <meshStandardMaterial map={woodFraming} roughness={0.8} metalness={0.02} color={STRUCTURAL_TIMBER} emissive="#111" emissiveIntensity={emissive} />
  ) : (
    <meshStandardMaterial color={STRUCTURAL_TIMBER} roughness={0.8} metalness={0.02} emissive="#111" emissiveIntensity={emissive} />
  );
  const trim = trimMat || <meshStandardMaterial color={WARM_CEDAR} roughness={0.72} metalness={0.02} />;
  const tw = EXTERIOR_TRIM_WIDTH;
  const tt = EXTERIOR_TRIM_THICKNESS;

  // Structural opening (unchanged; used by cladding/framing elsewhere - not for customer-facing size).
  const openingW = windowWidth + OPENING_SIDE_MARGIN * 2;
  const openingH = windowHeight + OPENING_TOP_BOTTOM_MARGIN * 2;

  // Customer-facing visual: nominal unit + slim trim allowance so it reads close to quoted 24×24.
  const visualW = windowWidth + 2 * VISUAL_TRIM_ALLOWANCE;
  const visualH = windowHeight + 2 * VISUAL_TRIM_ALLOWANCE;
  const fullVisualW = visualW + 2 * tw;
  const fullVisualH = visualH + 2 * tw;
  const glazingZ = trimZ - tt * 0.6;
  const GLAZING_COLOR = "#f5f5f0";

  const outlineLine = useMemo(() => {
    const m = 2;
    const outlineZ = 0.5 * exteriorZSign;
    const pts = [
      new THREE.Vector3(-fullVisualW / 2 - m, fullVisualH / 2 + m, outlineZ),
      new THREE.Vector3(fullVisualW / 2 + m, fullVisualH / 2 + m, outlineZ),
      new THREE.Vector3(fullVisualW / 2 + m, -fullVisualH / 2 - m, outlineZ),
      new THREE.Vector3(-fullVisualW / 2 - m, -fullVisualH / 2 - m, outlineZ),
      new THREE.Vector3(-fullVisualW / 2 - m, fullVisualH / 2 + m, outlineZ),
    ];
    const geom = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineBasicMaterial({ color: 0x4a5568 });
    return new THREE.Line(geom, mat);
  }, [fullVisualW, fullVisualH, exteriorZSign]);

  return (
    <group position={[positionX, positionY, 0]}>
      {(isHovered || isSelected) && <primitive object={outlineLine} />}
      {/* Structural framing: builder/debug only; not shown in customer view */}
      {showStructuralFraming && (
        <>
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
        </>
      )}
      {/* Customer-facing glazing: nominal unit + slim allowance, centered */}
      <Box args={[visualW, visualH, 0.08]} position={[0, 0, glazingZ]} castShadow>
        <meshStandardMaterial color={GLAZING_COLOR} roughness={0.4} metalness={0.02} />
      </Box>
      {/* Customer-facing trim: sized from nominal + allowance */}
      <Box
        args={[visualW, tw, tt]}
        position={[0, visualH / 2 + tw / 2, trimZ]}
        castShadow
      >
        {trim}
      </Box>
      <Box
        args={[visualW, tw, tt]}
        position={[0, -visualH / 2 - tw / 2, trimZ]}
        castShadow
      >
        {trim}
      </Box>
      <Box
        args={[tw, visualH, tt]}
        position={[-visualW / 2 - tw / 2, 0, trimZ]}
        castShadow
      >
        {trim}
      </Box>
      <Box
        args={[tw, visualH, tt]}
        position={[visualW / 2 + tw / 2, 0, trimZ]}
        castShadow
      >
        {trim}
      </Box>
    </group>
  );
};

export default WindowFrame;
