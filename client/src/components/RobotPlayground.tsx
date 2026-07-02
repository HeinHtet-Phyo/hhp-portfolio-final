// Sci-Fi Computer GLB — auto-fit camera, boosted screen emissive, original colors
import { Suspense, useRef, useEffect, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { useGLTF, OrbitControls, useAnimations } from "@react-three/drei";
import * as THREE from "three";

const MODEL_URL = "/manus-storage/sci_-_fi_computer_game_ready_575ecfbb.glb";

// Screen material names from the GLB
const SCREEN_MATS = ["digital_displays", "digital_display_sides"];

function CameraAutoFit({ box }: { box: THREE.Box3 | null }) {
  const { camera } = useThree();
  useEffect(() => {
    if (!box || box.isEmpty()) return;
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = (camera as THREE.PerspectiveCamera).fov * (Math.PI / 180);
    const dist = (maxDim / 2 / Math.tan(fov / 2)) * 1.4;
    // 3/4 view: slightly right and above
    camera.position.set(
      center.x + dist * 0.5,
      center.y + dist * 0.42,
      center.z + dist * 0.82
    );
    camera.lookAt(center);
    camera.updateProjectionMatrix();
  }, [box, camera]);
  return null;
}

function Model({ onBox }: { onBox: (b: THREE.Box3) => void }) {
  const { scene, animations } = useGLTF(MODEL_URL);
  const groupRef = useRef<THREE.Group>(null);
  const { actions, names } = useAnimations(animations, groupRef);

  // Play first animation
  useEffect(() => {
    if (names.length > 0) {
      const action = actions[names[0]];
      if (action) action.reset().fadeIn(0.3).play();
    }
  }, [actions, names]);

  // Boost screen emissive to restore original bright cyan glow
  useEffect(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        mats.forEach((mat) => {
          const m = mat as THREE.MeshStandardMaterial;
          if (SCREEN_MATS.includes(m.name)) {
            // Restore original bright emissive on screen panels
            m.emissive = new THREE.Color(0x00aaff);
            m.emissiveIntensity = 1.8;
            m.needsUpdate = true;
          }
        });
      }
    });
    // Compute bounding box
    const box = new THREE.Box3().setFromObject(scene);
    onBox(box);
  }, [scene, onBox]);

  return (
    <group ref={groupRef}>
      <primitive object={scene} />
    </group>
  );
}

export default function RobotPlayground() {
  const [box, setBox] = useState<THREE.Box3 | null>(null);

  return (
    <div style={{ width: "100%", aspectRatio: "4 / 3", background: "transparent" }}>
      <Canvas
        gl={{ alpha: true, antialias: true, outputColorSpace: THREE.SRGBColorSpace }}
        camera={{ fov: 45, near: 0.01, far: 1000 }}
        style={{ background: "transparent" }}
      >
        {/* Bright neutral lights to show original colors */}
        <ambientLight intensity={3.0} color="#ffffff" />
        <directionalLight position={[5, 8, 6]} intensity={3.5} color="#ffffff" />
        <directionalLight position={[-4, 4, 4]} intensity={2.0} color="#ddeeff" />
        {/* Subtle cyan rim from behind */}
        <pointLight position={[0, 2, -4]} intensity={1.5} color="#00aaff" />
        <Suspense fallback={null}>
          <Model onBox={setBox} />
          <CameraAutoFit box={box} />
        </Suspense>
        <OrbitControls enableZoom={false} enablePan={false} enableDamping dampingFactor={0.08} />
      </Canvas>
    </div>
  );
}

useGLTF.preload(MODEL_URL);
