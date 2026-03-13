/**
 * CameraController - Smooth transitions between builder steps.
 * Positions scale with shed size; camera animates only when builderStep changes.
 */
import { useRef, useEffect, useMemo } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useBuilder } from "../../context/BuilderContext";
import { useConfigurator } from "../../context/ConfiguratorContext";

const DURATION = 0.4;
const TOLERANCE = 0.01;

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export default function CameraController() {
  const { camera } = useThree();
  const { builderStep, isDraggingElement } = useBuilder();
  const { shedConfig } = useConfigurator();
  const controlsRef = useRef(null);

  const startPosition = useRef(new THREE.Vector3());
  const startTarget = useRef(new THREE.Vector3());
  const desiredPosition = useRef(new THREE.Vector3());
  const desiredTarget = useRef(new THREE.Vector3());
  const isAnimating = useRef(false);
  const animProgress = useRef(0);

  const width = shedConfig.width / 12;
  const depth = shedConfig.depth / 12;
  const wallHeight = shedConfig.wallHeight / 12;
  const radius = Math.sqrt(width * width + depth * depth) / 2;
  const frontDistance = radius * 2.2;
  const sideDistance = radius * 2.2;

  const stepCameras = useMemo(() => ({
    BASE: { position: [radius * 1.2, wallHeight * 1.2, radius * 1.2], target: [0, 0, 0] },
    FRONT_WALL: { position: [0, wallHeight * 0.9, -frontDistance], target: [0, wallHeight * 0.5, 0] },
    SIDE_WALLS: { position: [sideDistance, wallHeight * 0.9, 0], target: [0, wallHeight * 0.5, 0] },
    BACK_WALL: { position: [0, wallHeight * 0.9, frontDistance], target: [0, wallHeight * 0.5, 0] },
    ROOF: { position: [width * 0.8, wallHeight * 1.8, depth * 0.8], target: [0, wallHeight * 0.5, 0] },
    INTERIOR: { position: [width * 0.4, wallHeight * 0.8, depth * 0.4], target: [0, wallHeight * 0.5, 0] },
  }), [width, depth, wallHeight, radius]);

  useEffect(() => {
    const cfg = stepCameras[builderStep] || stepCameras.BASE;
    desiredPosition.current.set(...cfg.position);
    desiredTarget.current.set(...cfg.target);
    startPosition.current.copy(camera.position);
    startTarget.current.copy(controlsRef.current?.target ?? desiredTarget.current);
    animProgress.current = 0;
    isAnimating.current = true;
  }, [builderStep, stepCameras, camera]);

  useFrame((_, delta) => {
    if (!isAnimating.current) return;
    animProgress.current = Math.min(1, animProgress.current + delta / DURATION);
    const t = easeInOutCubic(animProgress.current);

    camera.position.lerpVectors(startPosition.current, desiredPosition.current, t);
    if (controlsRef.current?.target) {
      controlsRef.current.target.lerpVectors(startTarget.current, desiredTarget.current, t);
    }

    if (animProgress.current >= 1 - TOLERANCE) {
      camera.position.copy(desiredPosition.current);
      if (controlsRef.current?.target) {
        controlsRef.current.target.copy(desiredTarget.current);
      }
      isAnimating.current = false;
    }
  });

  const targetY = wallHeight * 0.5;
  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      minDistance={4}
      maxDistance={25}
      target={[0, targetY, 0]}
      enablePan
      enabled={!isDraggingElement}
    />
  );
}
