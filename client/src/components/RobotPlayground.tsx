// Dark Space Theme — Robot Playground GLB Viewer
// Bright original colors, no rotation, animation only, orbit controls
import { Suspense, useRef, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { useGLTF, OrbitControls, useAnimations } from "@react-three/drei";
import * as THREE from "three";

const ROBOT_URL = "/manus-storage/robot_playground_8db15507.glb";

function RobotModel() {
  const { scene, animations } = useGLTF(ROBOT_URL);
  const groupRef = useRef<THREE.Group>(null);
  const { actions, names } = useAnimations(animations, groupRef);

  // Play the first animation on mount — no rotation, just the built-in animation
  useEffect(() => {
    if (names.length > 0) {
      const preferred = names.find(n => /idle|walk|run|dance|wave|anim/i.test(n)) || names[0];
      const action = actions[preferred];
      if (action) {
        action.reset().fadeIn(0.3).play();
      }
    }
  }, [actions, names]);

  // Restore original bright materials — remove any dark tint
  useEffect(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        mats.forEach((mat) => {
          if (mat instanceof THREE.MeshStandardMaterial) {
            // Reset emissive to black so original colors show through
            mat.emissive = new THREE.Color(0x000000);
            mat.emissiveIntensity = 0;
            mat.needsUpdate = true;
          }
        });
      }
    });
  }, [scene]);

  return (
    <group ref={groupRef}>
      <primitive object={scene} scale={1.4} position={[0, -1.0, 0]} />
    </group>
  );
}

function Lights() {
  return (
    <>
      {/* Strong neutral ambient so original colors are fully visible */}
      <ambientLight intensity={2.5} color="#ffffff" />
      {/* Key light from upper front-left */}
      <directionalLight position={[-2, 5, 4]} intensity={3.0} color="#ffffff" />
      {/* Fill light from right */}
      <directionalLight position={[4, 2, 2]} intensity={2.0} color="#e0f8ff" />
      {/* Subtle cyan rim from behind */}
      <pointLight position={[0, 3, -5]} intensity={2.0} color="#00d4ff" distance={15} />
      {/* Soft bottom fill */}
      <pointLight position={[0, -3, 3]} intensity={1.0} color="#ffffff" distance={10} />
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
        gl={{ alpha: true, antialias: true, toneMapping: THREE.LinearToneMapping, toneMappingExposure: 1.0 }}
        camera={{ position: [0, 0.8, 7], fov: 38 }}
        style={{ background: "transparent" }}
      >
        <Lights />
        <Suspense fallback={null}>
          <RobotModel />
        </Suspense>
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI * 0.7}
          dampingFactor={0.08}
          enableDamping
        />
      </Canvas>
    </div>
  );
}

useGLTF.preload(ROBOT_URL);
