/**
 * RobotViewer — Interactive 3D robot with:
 * - Slow Y-axis auto-rotation
 * - Mouse drag orbit controls
 * - Soft blue/cyan glow lighting matching the dark space theme
 * - Responsive sizing for desktop and mobile
 * - Idle animation from the RobotExpressive GLB
 */

import { Suspense, useRef, useEffect } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as THREE from "three";

const ROBOT_URL = "/models/robot_8c5dc592.glb";

function RobotModel() {
  const gltf = useLoader(GLTFLoader, ROBOT_URL);
  const groupRef = useRef<THREE.Group>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const isDragging = useRef(false);

  // Set up animation mixer — play "Idle" if available
  useEffect(() => {
    if (!gltf.animations?.length) return;
    const mixer = new THREE.AnimationMixer(gltf.scene);
    mixerRef.current = mixer;

    // Prefer "Idle" animation, fall back to first
    const idleClip =
      gltf.animations.find((a) => a.name.toLowerCase().includes("idle")) ||
      gltf.animations[0];
    const action = mixer.clipAction(idleClip);
    action.play();

    return () => { mixer.stopAllAction(); };
  }, [gltf]);

  // Keep original colors, just add subtle cyan emissive glow
  useEffect(() => {
    gltf.scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        mats.forEach((m) => {
          const mat = m as THREE.MeshStandardMaterial;
          if (!mat?.isMeshStandardMaterial) return;
          mat.emissive = new THREE.Color(0x003355);
          mat.emissiveIntensity = 0.12;
          mat.needsUpdate = true;
        });
      }
    });
  }, [gltf]);

  useFrame((state, delta) => {
    // Auto-rotate slowly on Y axis when not dragging
    if (groupRef.current && !isDragging.current) {
      groupRef.current.rotation.y += delta * 0.35;
    }
    // Advance animation mixer
    mixerRef.current?.update(delta);
  });

  return (
    <group ref={groupRef} position={[0, -1.1, 0]} scale={[1, 1, 1]}>
      <primitive object={gltf.scene} />
    </group>
  );
}

function Lights() {
  return (
    <>
      {/* Ambient — soft fill */}
      <ambientLight intensity={0.4} color="#001a2e" />

      {/* Key light — bright white-blue from front-top */}
      <directionalLight
        position={[2, 4, 3]}
        intensity={3.0}
        color="#a0e8ff"
        castShadow={false}
      />

      {/* Cyan rim light from behind */}
      <directionalLight
        position={[-2, 2, -3]}
        intensity={1.8}
        color="#00e5ff"
      />

      {/* Front fill — ensure robot is visible */}
      <directionalLight
        position={[0, 0, 5]}
        intensity={1.5}
        color="#c0f0ff"
      />

      {/* Warm fill from below */}
      <pointLight position={[0, -2, 1]} intensity={0.6} color="#004466" />

      {/* Top glow */}
      <pointLight position={[0, 5, 0]} intensity={1.0} color="#00b4cc" />
    </>
  );
}

export default function RobotViewer() {
  return (
    <div
      style={{
        width: "100%",
        height: "clamp(280px, 40vw, 420px)",
        borderRadius: "12px",
        overflow: "hidden",
        background: "transparent",
        cursor: "grab",
      }}
    >
      <Canvas
        gl={{ alpha: true, antialias: true }}
        camera={{ position: [0, 1.2, 6.5], fov: 38 }}
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
          maxPolarAngle={Math.PI / 1.6}
          rotateSpeed={0.6}
          dampingFactor={0.08}
          enableDamping
        />
      </Canvas>
    </div>
  );
}
