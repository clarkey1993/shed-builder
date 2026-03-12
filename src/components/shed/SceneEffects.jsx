/**
 * SceneEffects - Subtle depth of field for photo-realistic product render.
 * Front corner of shed sharp, far back and backdrop soften slightly.
 */
import { extend, useThree } from "@react-three/fiber";
import { Effects } from "@react-three/drei";
import { BokehPass, GammaCorrectionShader } from "three-stdlib";

extend({ BokehPass });

export default function SceneEffects() {
  const { scene, camera, size } = useThree();

  return (
    <Effects disableGamma>
      <bokehPass
        args={[
          scene,
          camera,
          {
            focus: 8,
            aperture: 0.008,
            maxblur: 0.004,
            width: size.width,
            height: size.height,
          },
        ]}
      />
      <shaderPass args={[GammaCorrectionShader]} />
    </Effects>
  );
}
