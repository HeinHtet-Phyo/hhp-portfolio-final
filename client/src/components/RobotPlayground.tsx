// Sci-Fi Computer GLB — auto-fit camera, full original brightness
import { Suspense, useRef, useEffect, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { useGLTF, OrbitControls, useAnimations } from "@react-three/drei";
import * as THREE from "three";

const MODEL_URL = "/manus-storage/sci_-_fi_computer_game_ready_575ecfbb.glb";

// All material names in the GLB
const SCREEN_MATS = ["digital_displays", "digital_display_sides"];

function RendererSetup() {
  const { gl } = useThree();
  useEffect(() => {
    // Disable tone mapping so original baked emissive colors show at full brightness
    gl.toneMapping = THREE.NoToneMapping;
    gl.toneMappingExposure = 1.0;
  }, [gl]);
  return null;
}

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

  // Restore full original brightness on all materials
  useEffect(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        mats.forEach((mat) => {
          const m = mat as THREE.MeshStandardMaterial;
          if (SCREEN_MATS.includes(m.name)) {
            // Screen panels: bright cyan emissive glow
            m.emissive = new THREE.Color(0x00ccff);
            m.emissiveIntensity = 3.0;
          } else {
            // All other materials: boost emissive so they don't look washed out
            if (m.emissiveIntensity !== undefined) {
              m.emissiveIntensity = Math.max(m.emissiveIntensity, 0.3);
            }
          }
          m.needsUpdate = true;
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
        gl={{
          alpha: true,
          antialias: true,
          outputColorSpace: THREE.SRGBColorSpace,
          toneMapping: THREE.NoToneMapping,
        }}
        camera={{ fov: 45, near: 0.01, far: 1000 }}
        style={{ background: "transparent" }}
      >
        <RendererSetup />
        {/* Strong neutral lights to show original colors at full brightness */}
        <ambientLight intensity={4.0} color="#ffffff" />
        <directionalLight position={[5, 8, 6]} intensity={5.0} color="#ffffff" />
        <directionalLight position={[-4, 4, 4]} intensity={3.0} color="#eef4ff" />
        {/* Cyan fill light from front-left */}
        <pointLight position={[-3, 3, 5]} intensity={3.0} color="#00ddff" />
        {/* Warm fill from right */}
        <pointLight position={[4, 2, 3]} intensity={2.0} color="#ffffff" />
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
