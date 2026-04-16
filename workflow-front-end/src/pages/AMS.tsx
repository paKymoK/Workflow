import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";
import OfficeScene from "../components/ams/OfficeScene";

export default function AMS() {
  return (
    <div className="w-screen h-screen">
      <Canvas
        shadows
        camera={{ position: [0, 1.8, 7], fov: 55 }}
        gl={{ antialias: true, toneMapping: THREE.NoToneMapping }}
      >
        <color attach="background" args={["#03060f"]} />
        <Suspense fallback={null}>
          <OfficeScene />
          <EffectComposer>
            <Bloom
              intensity={2.2}
              luminanceThreshold={0.1}
              luminanceSmoothing={0.9}
              mipmapBlur
            />
          </EffectComposer>
        </Suspense>
      </Canvas>
    </div>
  );
}
