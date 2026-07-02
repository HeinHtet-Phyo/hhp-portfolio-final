// Sci-Fi Computer GLB — original model, no modifications
import { Suspense, useRef, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { useGLTF, OrbitControls, useAnimations } from "@react-three/drei";
import * as THREE from "three";

const MODEL_URL = "/manus-storage/sci_-_fi_computer_game_ready_575ecfbb.glb";

function Model() {
  const { scene, animations } = useGLTF(MODEL_URL);
  const groupRef = useRef<THREE.Group>(null);
  const { actions, names } = useAnimations(animations, groupRef);

  useEffect(() => {
    if (names.length > 0) {
      const action = actions[names[0]];
      if (action) action.reset().fadeIn(0.3).play();
    }
  }, [actions, names]);

  return (
    <group ref={groupRef}>
      <primitive object={scene} />
    </group>
  );
}

export default function RobotPlayground() {
  return (
    <div style={{ width: "100%", aspectRatio: "1 / 1", background: "transparent" }}>
      <Canvas
        gl={{ alpha: true, antialias: true }}
        camera={{ position: [2.5, 2.5, 4.5], fov: 46 }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={1.0} />
        <directionalLight position={[5, 5, 5]} intensity={1.5} />
        <directionalLight position={[-5, 3, 3]} intensity={1.0} />
        <Suspense fallback={null}>
          <Model />
        </Suspense>
        <OrbitControls enableZoom={false} enablePan={false} enableDamping dampingFactor={0.08} />
      </Canvas>
    </div>
  );
}

useGLTF.preload(MODEL_URL);
