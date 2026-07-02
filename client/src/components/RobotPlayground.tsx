// Sci-Fi Computer GLB — full original brightness, auto-fit camera
import { Suspense, useRef, useEffect, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { useGLTF, OrbitControls, useAnimations } from "@react-three/drei";
import * as THREE from "three";

const MODEL_URL = "/manus-storage/sci_-_fi_computer_game_ready_575ecfbb.glb";

function RendererSetup() {
  const { gl } = useThree();
  useEffect(() => {
    // No tone mapping — let baked emissive textures show at full intensity
    gl.toneMapping = THREE.NoToneMapping;
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
    // Front-facing slightly elevated — matches original Sketchfab view
    const dist = (maxDim / 2 / Math.tan(fov / 2)) * 1.6;
    // Slightly left and above, mostly straight on
    camera.position.set(
      center.x - dist * 0.15,
      center.y + dist * 0.35,
      center.z + dist * 0.95
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

  useEffect(() => {
    scene.traverse((child) => {
      if (!(child as THREE.Mesh).isMesh) return;
      const mesh = child as THREE.Mesh;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      mats.forEach((mat) => {
        const m = mat as THREE.MeshStandardMaterial;
        if (m.name === "digital_displays") {
          // This material has a baked emissive texture with factor [1,1,1]
          // Crank emissiveIntensity way up so the texture blazes bright
          m.emissiveIntensity = 8.0;
          m.transparent = true;
          m.depthWrite = false;
        } else if (m.name === "digital_display_sides") {
          // Screen frame sides — give a subtle cyan glow
          m.emissive = new THREE.Color(0x00aaff);
          m.emissiveIntensity = 1.5;
          m.transparent = true;
          m.depthWrite = false;
        }
        m.needsUpdate = true;
      });
    });
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
        camera={{ fov: 42, near: 0.01, far: 1000 }}
        style={{ background: "transparent" }}
      >
        <RendererSetup />
        {/* Strong lights to illuminate the body while screen glows from emissive */}
        <ambientLight intensity={3.5} color="#ffffff" />
        <directionalLight position={[5, 8, 6]} intensity={4.0} color="#ffffff" />
        <directionalLight position={[-4, 3, 5]} intensity={2.5} color="#cce8ff" />
        {/* Cyan point light from front to fill the keyboard area */}
        <pointLight position={[0, -1, 6]} intensity={3.0} color="#00ccff" />
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
