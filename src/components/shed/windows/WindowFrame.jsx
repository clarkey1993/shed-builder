import { useMemo } from "react";
import { Box } from "@react-three/drei";
import * as THREE from "three";
import { useShedTexturesContext } from "../../../context/ShedTextureContext";

const STUD_THICKNESS = 2;
const STUD_WIDTH = 3;
const TRIM_W = 2;
const TRIM_T = 1;
const TRIM_OFFSET = 0.5;

const WindowFrame = ({ windowWidth, windowHeight, positionX, positionY, trimMat, isHovered = false, isSelected = false }) => {
  const { woodFraming } = useShedTexturesContext();
  const emissive = (isHovered || isSelected) ? 0.08 : 0;
  const WARM_CEDAR = "#d4a574";
  const framingMat = woodFraming ? (
    <meshStandardMaterial map={woodFraming} roughness={0.75} metalness={0.05} color={WARM_CEDAR} emissive="#222" emissiveIntensity={emissive} />
  ) : (
    <meshStandardMaterial color={WARM_CEDAR} roughness={0.75} metalness={0.05} emissive="#222" emissiveIntensity={emissive} />
  );
  const trim = trimMat || framingMat;
  const fullW = windowWidth + TRIM_OFFSET * 2;
  const fullH = windowHeight + TRIM_OFFSET * 2;

  const outlineLine = useMemo(() => {
    const m = 2;
    const pts = [
      new THREE.Vector3(-fullW / 2 - m, fullH / 2 + m, 0.5),
      new THREE.Vector3(fullW / 2 + m, fullH / 2 + m, 0.5),
      new THREE.Vector3(fullW / 2 + m, -fullH / 2 - m, 0.5),
      new THREE.Vector3(-fullW / 2 - m, -fullH / 2 - m, 0.5),
      new THREE.Vector3(-fullW / 2 - m, fullH / 2 + m, 0.5),
    ];
    const geom = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineBasicMaterial({ color: 0x4a5568 });
    return new THREE.Line(geom, mat);
  }, [fullW, fullH]);

  return (
    <group position={[positionX, positionY, 0]}>
      {(isHovered || isSelected) && <primitive object={outlineLine} />}
      <Box args={[windowWidth, STUD_WIDTH, STUD_THICKNESS]} position={[0, windowHeight / 2 - STUD_WIDTH / 2, 0]} castShadow>
        {framingMat}
      </Box>
      <Box args={[windowWidth, STUD_WIDTH, STUD_THICKNESS]} position={[0, -windowHeight / 2 + STUD_WIDTH / 2, 0]} castShadow>
        {framingMat}
      </Box>
      <Box args={[STUD_WIDTH, windowHeight - STUD_WIDTH * 2, STUD_THICKNESS]} position={[-windowWidth / 2 - STUD_WIDTH / 2, 0, 0]} castShadow>
        {framingMat}
      </Box>
      <Box args={[STUD_WIDTH, windowHeight - STUD_WIDTH * 2, STUD_THICKNESS]} position={[windowWidth / 2 + STUD_WIDTH / 2, 0, 0]} castShadow>
        {framingMat}
      </Box>
      <Box args={[fullW, TRIM_W, TRIM_T]} position={[0, windowHeight / 2 + TRIM_OFFSET + TRIM_W / 2, 0.25 + TRIM_T / 2]} castShadow>
        {trim}
      </Box>
      <Box args={[fullW, TRIM_W, TRIM_T]} position={[0, -windowHeight / 2 - TRIM_OFFSET - TRIM_W / 2, 0.25 + TRIM_T / 2]} castShadow>
        {trim}
      </Box>
      <Box args={[TRIM_W, fullH, TRIM_T]} position={[-windowWidth / 2 - TRIM_OFFSET - TRIM_W / 2, 0, 0.25 + TRIM_T / 2]} castShadow>
        {trim}
      </Box>
      <Box args={[TRIM_W, fullH, TRIM_T]} position={[windowWidth / 2 + TRIM_OFFSET + TRIM_W / 2, 0, 0.25 + TRIM_T / 2]} castShadow>
        {trim}
      </Box>
    </group>
  );
};

export default WindowFrame;
