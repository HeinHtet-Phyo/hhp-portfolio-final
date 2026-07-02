// Sci-Fi Computer GLB — original model, boosted lighting to restore bright cyan colors
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

  // Boost emissive intensity on all materials to restore original bright colors
  useEffect(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        mats.forEach((mat) => {
          const m = mat as THREE.MeshStandardMaterial;
          if (m.emissive) {
            // Amplify existing emissive color so keyboard/screen glow brightly
            m.emissiveIntensity = Math.max(m.emissiveIntensity ?? 1, 1.8);
          }
        });
      }
    });
  }, [scene]);

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
        gl={{ alpha: true, antialias: true, outputColorSpace: THREE.SRGBColorSpace }}
        camera={{ position: [4.0, 3.5, 7.5], fov: 40 }}
        style={{ background: "transparent" }}
      >
        {/* Strong white ambient so all surfaces show their true colors */}
        <ambientLight intensity={2.5} color="#ffffff" />
        {/* Key light from upper-front-right */}
        <directionalLight position={[4, 6, 5]} intensity={3.0} color="#ffffff" />
        {/* Fill light from left */}
        <directionalLight position={[-4, 3, 4]} intensity={2.0} color="#cce8ff" />
        {/* Rim light from behind to separate model from background */}
        <directionalLight position={[0, -2, -5]} intensity={1.0} color="#00d4ff" />
        <Suspense fallback={null}>
          <Model />
        </Suspense>
        <OrbitControls enableZoom={false} enablePan={false} enableDamping dampingFactor={0.08} />
      </Canvas>
    </div>
  );
}

useGLTF.preload(MODEL_URL);
