// Dark Space Theme — Sci-Fi Computer GLB Viewer
// 3/4 camera angle, space background, vivid cyan keyboard + screen glow
import { Suspense, useRef, useEffect, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, OrbitControls, useAnimations } from "@react-three/drei";
import * as THREE from "three";

const ROBOT_URL = "/manus-storage/sci_-_fi_computer_game_ready_575ecfbb.glb";

// Procedural starfield background
function Starfield() {
  const pointsRef = useRef<THREE.Points>(null);
  const { positions, count } = useMemo(() => {
    const count = 300;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 40;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 40;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20 - 10;
    }
    return { positions, count };
  }, []);

  useFrame((_, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.01;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={count}
        />
      </bufferGeometry>
      <pointsMaterial color="#88ccff" size={0.06} transparent opacity={0.7} sizeAttenuation />
    </points>
  );
}

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

  // Boost keyboard and screen emissive to match reference vivid cyan glow
  useEffect(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const name = (mesh.name + (mesh.parent?.name ?? "")).toLowerCase();
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        mats.forEach((mat) => {
          if (mat instanceof THREE.MeshStandardMaterial) {
            // Keyboard keys — vivid cyan glow
            if (/key|keyboard|button|kb/i.test(name)) {
              mat.emissive = new THREE.Color(0x00aaff);
              mat.emissiveIntensity = 1.2;
              mat.color = new THREE.Color(0x00ccff);
            }
            // Screen/display — bright blue UI glow
            else if (/screen|display|monitor|glass|panel|lcd|emit/i.test(name)) {
              mat.emissive = new THREE.Color(0x0044aa);
              mat.emissiveIntensity = 0.8;
            }
            mat.needsUpdate = true;
          }
        });
      }
    });
  }, [scene]);

  return (
    <group ref={groupRef}>
      {/* Tilt model slightly so keyboard + screen both visible */}
      <primitive object={scene} scale={0.9} position={[0, -0.8, 0]} rotation={[0.15, -0.3, 0]} />
    </group>
  );
}

function Lights() {
  return (
    <>
      <ambientLight intensity={1.2} color="#c8e8ff" />
      {/* Key light from upper front — illuminates screen */}
      <directionalLight position={[-2, 5, 6]} intensity={2.5} color="#ffffff" />
      {/* Fill from right */}
      <directionalLight position={[5, 2, 3]} intensity={1.5} color="#e0f8ff" />
      {/* Cyan rim from behind */}
      <pointLight position={[0, 3, -8]} intensity={3.0} color="#00d4ff" distance={20} />
      {/* Keyboard glow from below */}
      <pointLight position={[0, -2, 3]} intensity={2.0} color="#00aaff" distance={10} />
      {/* Front fill so keyboard keys are lit */}
      <directionalLight position={[0, -1, 8]} intensity={1.5} color="#aaddff" />
    </>
  );
}

export default function RobotPlayground() {
  return (
    <div style={{
      width: "100%",
      aspectRatio: "1 / 1",
      position: "relative",
      background: "radial-gradient(ellipse at 50% 40%, #0a1628 0%, #030810 70%, #000005 100%)",
      borderRadius: "12px",
      overflow: "hidden",
    }}>
      <Canvas
        gl={{ alpha: false, antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.3 }}
        camera={{ position: [2, 2.5, 7], fov: 46 }}
        style={{ background: "transparent" }}
      >
        <color attach="background" args={["#030810"]} />
        <fog attach="fog" args={["#030810", 20, 50]} />
        <Starfield />
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
