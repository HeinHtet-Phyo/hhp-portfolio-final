// Dark Space Theme — Robot Playground GLB Viewer
// Cyan/blue rim lighting, auto Y-rotation, orbit controls, transparent background
import { Suspense, useRef, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, OrbitControls, useAnimations } from "@react-three/drei";
import * as THREE from "three";

const ROBOT_URL = "/manus-storage/robot_playground_8db15507.glb";

function RobotModel() {
  const { scene, animations } = useGLTF(ROBOT_URL);
  const groupRef = useRef<THREE.Group>(null);
  const { actions, names } = useAnimations(animations, groupRef);

  // Play all animations (or the first one) on mount
  useEffect(() => {
    if (names.length > 0) {
      // Try to play an idle/walk animation, fallback to first
      const preferred = names.find(n => /idle|walk|run|anim/i.test(n)) || names[0];
      const action = actions[preferred];
      if (action) {
        action.reset().fadeIn(0.3).play();
      }
    }
  }, [actions, names]);

  // Slow Y-axis auto-rotation
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.3;
    }
  });

  // Apply cyan emissive tint to all meshes for holographic feel
  scene.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      mats.forEach((mat) => {
        if (mat instanceof THREE.MeshStandardMaterial) {
          mat.emissive = new THREE.Color(0x001a2e);
          mat.emissiveIntensity = 0.15;
          mat.envMapIntensity = 1.2;
        }
      });
    }
  });

  return (
    <group ref={groupRef}>
      <primitive object={scene} scale={1.4} position={[0, -1.0, 0]} />
    </group>
  );
}

function Lights() {
  return (
    <>
      {/* Ambient base */}
      <ambientLight intensity={0.3} color="#0a1628" />
      {/* Key light — cool white from upper left */}
      <directionalLight
        position={[-3, 4, 3]}
        intensity={2.5}
        color="#c8e8ff"
        castShadow={false}
      />
      {/* Cyan rim light from right */}
      <pointLight position={[4, 1, -2]} intensity={3} color="#00d4ff" distance={12} />
      {/* Blue fill from below */}
      <pointLight position={[-2, -3, 2]} intensity={1.5} color="#0066ff" distance={10} />
      {/* Warm accent from back */}
      <pointLight position={[0, 3, -4]} intensity={1.2} color="#4488ff" distance={8} />
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
        gl={{ alpha: true, antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
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
