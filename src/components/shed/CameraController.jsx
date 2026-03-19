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
const AUTO_MOVE_CAMERA_ON_STEP = false;

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export default function CameraController() {
  const { camera } = useThree();
  const { builderStep, isDraggingElement } = useBuilder();
  const { shedConfig, structureBounds } = useConfigurator();
  const controlsRef = useRef(null);

  const startPosition = useRef(new THREE.Vector3());
  const startTarget = useRef(new THREE.Vector3());
  const desiredPosition = useRef(new THREE.Vector3());
  const desiredTarget = useRef(new THREE.Vector3());
  const isAnimating = useRef(false);
  const animProgress = useRef(0);

  const bounds = structureBounds ?? {
    centerX: 0, centerZ: 0, spanX: shedConfig?.width ?? 96, spanZ: shedConfig?.depth ?? 72,
  };
  const width = bounds.spanX / 12;
  const depth = bounds.spanZ / 12;
  const centerX = (bounds.centerX ?? 0) / 12;
  const centerZ = (bounds.centerZ ?? 0) / 12;
  const wallHeight = (shedConfig?.wallHeight ?? 66) / 12;
  const radius = Math.sqrt(width * width + depth * depth) / 2;
  const frontDistance = radius * 2.2;
  const sideDistance = radius * 2.2;
  const largestSpan = Math.max(bounds.spanX ?? 0, bounds.spanZ ?? 0) / 12;
  const maxDistance = Math.max(25, largestSpan * 2.5);

  const stepCameras = useMemo(() => ({
    BASE: { position: [centerX + radius * 1.2, wallHeight * 1.2, centerZ + radius * 1.2], target: [centerX, wallHeight * 0.5, centerZ] },
    FRONT_WALL: { position: [centerX, wallHeight * 0.9, centerZ - frontDistance], target: [centerX, wallHeight * 0.5, centerZ] },
    LEFT_SIDE: { position: [centerX + sideDistance, wallHeight * 0.9, centerZ], target: [centerX, wallHeight * 0.5, centerZ] },
    RIGHT_SIDE: { position: [centerX + sideDistance, wallHeight * 0.9, centerZ], target: [centerX, wallHeight * 0.5, centerZ] },
    BACK_WALL: { position: [centerX, wallHeight * 0.9, centerZ + frontDistance], target: [centerX, wallHeight * 0.5, centerZ] },
    ROOF: { position: [centerX + width * 0.8, wallHeight * 1.8, centerZ + depth * 0.8], target: [centerX, wallHeight * 0.5, centerZ] },
    INTERIOR: { position: [centerX + width * 0.4, wallHeight * 0.8, centerZ + depth * 0.4], target: [centerX, wallHeight * 0.5, centerZ] },
  }), [width, depth, wallHeight, radius, frontDistance, sideDistance, centerX, centerZ]);

  useEffect(() => {
    if (!AUTO_MOVE_CAMERA_ON_STEP) return;
    const cfg = stepCameras[builderStep] || stepCameras.BASE;
    desiredPosition.current.set(...cfg.position);
    desiredTarget.current.set(...cfg.target);
    startPosition.current.copy(camera.position);
    startTarget.current.copy(controlsRef.current?.target ?? desiredTarget.current);
    animProgress.current = 0;
    isAnimating.current = true;
  }, [builderStep, stepCameras, camera]);

  useFrame((_, delta) => {
    if (!AUTO_MOVE_CAMERA_ON_STEP || !isAnimating.current) return;
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
      maxDistance={maxDistance}
      target={[centerX, targetY, centerZ]}
      enablePan
      enabled={!isDraggingElement}
    />
  );
}
