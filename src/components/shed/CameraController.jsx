/**
 * CameraController - Auto-positions camera only when builderStep changes.
 * Does NOT run inside useFrame; does NOT override user orbit after step change.
 * OrbitControls: rotate (default), pan (enablePan), zoom (min/max distance).
 */
import { useRef, useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useBuilder } from "../../context/BuilderContext";

// Product-style framing: front wall at -Z, back at +Z; camera faces the wall being edited
const STEP_CAMERAS = {
  BASE: { position: [6, 5, 6], target: [0, 2.5, 0] },
  FRONT_WALL: { position: [0, 5, -10], target: [0, 2.5, 0] },
  SIDE_WALLS: { position: [14, 5, 0], target: [0, 2.5, 0] },
  BACK_WALL: { position: [0, 5, 10], target: [0, 2.5, 0] },
  ROOF: { position: [8, 10, 8], target: [0, 3.5, 0] },
  INTERIOR: { position: [5, 5, 5], target: [0, 2.5, 0] },
};

export default function CameraController() {
  const { camera } = useThree();
  const { builderStep, isDraggingElement } = useBuilder();
  const controlsRef = useRef(null);

  useEffect(() => {
    const cfg = STEP_CAMERAS[builderStep] || STEP_CAMERAS.BASE;
    camera.position.set(...cfg.position);
    if (controlsRef.current?.target) {
      controlsRef.current.target.set(...cfg.target);
    }
  }, [builderStep, camera]);

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      minDistance={4}
      maxDistance={25}
      target={[0, 2.5, 0]}
      enablePan
      enabled={!isDraggingElement}
    />
  );
}
