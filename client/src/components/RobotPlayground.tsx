// Dark Space Theme — Sci-Fi Computer GLB Viewer
// Original materials preserved, neutral lighting, animation + orbit controls
import { Suspense, useRef, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { useGLTF, OrbitControls, useAnimations } from "@react-three/drei";
import * as THREE from "three";

const ROBOT_URL = "/manus-storage/sci_-_fi_computer_game_ready_575ecfbb.glb";

function RobotModel() {
  const { scene, animations } = useGLTF(ROBOT_URL);
  const groupRef = useRef<THREE.Group>(null);
  const { actions, names } = useAnimations(animations, groupRef);

  // Play the first animation on mount
  useEffect(() => {
    if (names.length > 0) {
      const preferred = names.find(n => /idle|walk|run|dance|wave|anim|open|screen/i.test(n)) || names[0];
      const action = actions[preferred];
      if (action) {
        action.reset().fadeIn(0.3).play();
      }
    }
  }, [actions, names]);

  return (
    <group ref={groupRef}>
      <primitive object={scene} scale={0.8} position={[0, -0.5, 0]} />
    </group>
  );
}

function Lights() {
  return (
    <>
      {/* Neutral ambient — let original textures show */}
      <ambientLight intensity={1.5} color="#ffffff" />
      {/* Key light from upper front-left */}
      <directionalLight position={[-3, 6, 5]} intensity={2.5} color="#ffffff" />
      {/* Fill light from right */}
      <directionalLight position={[5, 3, 3]} intensity={1.5} color="#ffffff" />
      {/* Subtle cyan rim from behind */}
      <pointLight position={[0, 2, -6]} intensity={2.0} color="#00d4ff" distance={18} />
      {/* Front fill */}
      <directionalLight position={[0, 0, 8]} intensity={1.2} color="#ffffff" />
    </>
  );
}

export default function RobotPlayground() {
  return (
    <div style={{
      width: "100%",
      aspectRatio: "1 / 1",
      position: "relative",
      background: "transparent",
    }}>
      <Canvas
        gl={{ alpha: true, antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}
        camera={{ position: [0, 1.5, 7], fov: 48 }}
        style={{ background: "transparent" }}
      >
        <Lights />
        <Suspense fallback={null}>
          <RobotModel />
        </Suspense>
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI * 0.65}
          dampingFactor={0.08}
          enableDamping
        />
      </Canvas>
    </div>
  );
}

useGLTF.preload(ROBOT_URL);
