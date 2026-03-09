import { useThree, useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { useEffect } from "react";

const Background = ({ imageUrl }) => {
  const { scene } = useThree();
  const texture = useLoader(THREE.TextureLoader, imageUrl);

  useEffect(() => {
    if (texture) {
      texture.colorSpace = THREE.SRGBColorSpace;
      scene.background = texture;
    }
  }, [scene, texture]);

  return null;
};

export default Background;
