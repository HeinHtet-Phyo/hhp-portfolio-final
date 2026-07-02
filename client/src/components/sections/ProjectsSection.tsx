/**
 * ProjectsSection — Spline "Particle AI Brain" Match
 *
 * Visual reference: https://my.spline.design/particleaibrain-ydkahwSaEALCs8FRx3Kouaw6/
 *
 * Layout:
 * - Real anatomical brain mesh (dark grey, prominent gyri/sulci) — positioned centre-right
 * - Lit from upper-right: right hemisphere bright, left in shadow
 * - Massive dense white particle sphere on the left side, same size as brain
 * - Brain "emerges" from the particle cloud — left face of brain dissolves into particles
 * - Slow auto-rotation
 *
 * Interaction:
 * - 4 coloured project nodes on brain surface
 * - Click node → camera zooms into brain region, neural network glows inside
 * - Detail panel slides in
 */

import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import { Suspense, useRef, useState, useEffect, useMemo, useCallback } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { motion, AnimatePresence } from "framer-motion";

// Force full page reload on HMR to prevent R3F reconciler crash
// (HMR partial patching of Three.js objects causes removeChild null errors)
if (import.meta.hot) {
  import.meta.hot.accept(() => {
    import.meta.hot!.invalidate();
  });
}

// ─── Projects ─────────────────────────────────────────────────────────────────
const PROJECTS = [
  {
    id: 0,
    title: "MoodTunes AI",
    subtitle: "ML · Music Recommender",
    desc: "LightGBM trained on 114K+ Spotify tracks. F1 score 0.5652 on 5-class mood classification with real-time recommendation API.",
    tech: ["Python", "LightGBM", "Spotify API", "scikit-learn", "Pandas"],
    stats: [["0.5652", "F1 Score"], ["114K+", "Tracks"], ["5", "Moods"]] as [string, string][],
    color: "#00d4ff",
    pos: [-0.05, 0.18, 0.25] as [number, number, number],
    github: "https://github.com/HeinHtet-Phyo/moodtunes-ai-group3",
  },
  {
    id: 1,
    title: "IT Career Planner",
    subtitle: "XGBoost · Career AI",
    desc: "XGBoost classifier at 99.75% accuracy across 6,000 samples. Maps SFIA framework skills to career paths with gap analysis.",
    tech: ["Python", "XGBoost", "SFIA", "scikit-learn", "Streamlit"],
    stats: [["99.75%", "Accuracy"], ["6,000", "Samples"], ["SFIA", "Framework"]] as [string, string][],
    color: "#c084fc",
    pos: [0.18, 0.15, 0.22] as [number, number, number],
    github: "https://github.com/HeinHtet-Phyo/it-career-planner",
  },
  {
    id: 2,
    title: "CityPulse",
    subtitle: "Urban Data Analytics",
    desc: "Interactive urban analytics platform aggregating transportation, demographic, and infrastructure data into city-level intelligence.",
    tech: ["Python", "Pandas", "Plotly", "GeoPandas", "Streamlit"],
    stats: [["City", "Scale"], ["Real-time", "Data"], ["Interactive", "Maps"]] as [string, string][],
    color: "#34d399",
    pos: [-0.08, -0.08, 0.28] as [number, number, number],
    github: "https://github.com/HeinHtet-Phyo",
  },
  {
    id: 3,
    title: "PreventPath",
    subtitle: "Health AI · Prevention",
    desc: "ML pipeline predicting health risk factors from patient data, generating personalised prevention plans with risk scoring.",
    tech: ["Python", "scikit-learn", "Flask", "Healthcare ML", "Risk Scoring"],
    stats: [["AI", "Powered"], ["Personal", "Plans"], ["Risk", "Scoring"]] as [string, string][],
    color: "#fbbf24",
    pos: [0.20, -0.10, 0.20] as [number, number, number],
    github: "https://github.com/HeinHtet-Phyo",
  },
];
type Project = (typeof PROJECTS)[0];

// ─── Seeded RNG ───────────────────────────────────────────────────────────────
function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

// ─── Dense White Particle Cloud ───────────────────────────────────────────────
// Matches the Spline reference: dense sphere of white particles to the left of the brain,
// with some particles appearing on the brain surface (dissolving effect)
function generateParticleCloud(count: number, brainVerts: Float32Array | null) {
  const rng = makeRng(77777);
  const positions = new Float32Array(count * 3);
  const phases    = new Float32Array(count);
  const sizes     = new Float32Array(count);

  const vertCount = brainVerts ? brainVerts.length / 3 : 0;

  for (let i = 0; i < count; i++) {
    const roll = rng();

    if (roll < 0.35 && brainVerts && vertCount > 0) {
      // 35% — ON the brain surface (left hemisphere only, x < 0.05)
      // These create the "dissolving into particles" effect
      let attempts = 0;
      let vi = Math.floor(rng() * vertCount) * 3;
      while (brainVerts[vi] > 0.05 && attempts < 8) {
        vi = Math.floor(rng() * vertCount) * 3;
        attempts++;
      }
      const scatter = rng() * 0.025; // very close to surface
      const bx = brainVerts[vi], by = brainVerts[vi + 1], bz = brainVerts[vi + 2];
      const len = Math.sqrt(bx * bx + by * by + bz * bz) || 1;
      positions[i * 3 + 0] = bx + (bx / len) * scatter;
      positions[i * 3 + 1] = by + (by / len) * scatter;
      positions[i * 3 + 2] = bz + (bz / len) * scatter;
      sizes[i] = 0.4 + rng() * 0.8;
    } else {
      // 65% — Dense sphere cloud to the LEFT of the brain
      // The cloud sphere is centred at (-0.22, 0, 0) with radius ~0.28
      // This matches the Spline reference where the particle sphere is on the left
      const cx = -0.22, cy = -0.02, cz = 0.0;
      const r = 0.28;

      // Use rejection sampling for uniform sphere distribution
      let px = 0, py = 0, pz = 0;
      do {
        px = (rng() * 2 - 1) * r;
        py = (rng() * 2 - 1) * r;
        pz = (rng() * 2 - 1) * r;
      } while (px * px + py * py + pz * pz > r * r);

      // Denser near the centre of the cloud
      const distFromCentre = Math.sqrt(px * px + py * py + pz * pz);
      const densityBias = Math.pow(1 - distFromCentre / r, 0.4);
      const finalR = distFromCentre * (0.3 + 0.7 * densityBias);
      const scale = finalR / (distFromCentre || 1);

      positions[i * 3 + 0] = cx + px * scale;
      positions[i * 3 + 1] = cy + py * scale;
      positions[i * 3 + 2] = cz + pz * scale;
      sizes[i] = 0.3 + rng() * 1.2;
    }

    phases[i] = rng() * Math.PI * 2;
  }

  return { positions, phases, sizes };
}

// ─── Particle Cloud Component ─────────────────────────────────────────────────
function ParticleCloud({
  brainVerts,
  selected,
}: {
  brainVerts: Float32Array | null;
  selected: Project | null;
}) {
  const COUNT = 35000;
  const pointsRef = useRef<THREE.Points>(null);

  const { positions: basePos, phases, sizes } = useMemo(
    () => generateParticleCloud(COUNT, brainVerts),
    [brainVerts]
  );

  const animPos = useMemo(() => new Float32Array(basePos), [basePos]);

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(animPos, 3));

    // White/near-white colours with slight variation
    const colors = new Float32Array(COUNT * 3);
    const rngC = makeRng(11111);
    for (let i = 0; i < COUNT; i++) {
      const v = 0.72 + rngC() * 0.28; // 0.72–1.0 brightness
      colors[i * 3 + 0] = v;
      colors[i * 3 + 1] = v;
      colors[i * 3 + 2] = v;
    }
    g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return g;
  }, [animPos]);

  const mat = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: 0.0045,
        vertexColors: true,
        transparent: true,
        opacity: 0.92,
        sizeAttenuation: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    []
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const posAttr = geo.attributes.position as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;

    for (let i = 0; i < COUNT; i++) {
      const ph = phases[i];
      // Gentle turbulence — particles drift slightly
      const drift = 0.012 * Math.sin(t * 0.35 + ph);
      arr[i * 3 + 0] = basePos[i * 3 + 0] + drift * Math.cos(ph);
      arr[i * 3 + 1] = basePos[i * 3 + 1] + drift * Math.sin(ph * 0.7);
      arr[i * 3 + 2] = basePos[i * 3 + 2] + drift * 0.5;
    }
    posAttr.needsUpdate = true;

    // Fade particles when a project is selected (focus on brain)
    mat.opacity = THREE.MathUtils.lerp(mat.opacity, selected ? 0.35 : 0.92, 0.04);
  });

  return <points ref={pointsRef} geometry={geo} material={mat} />;
}

// ─── Brain Model ──────────────────────────────────────────────────────────────
function BrainModel({
  onVertsReady,
  selected,
  groupRef,
}: {
  onVertsReady: (v: Float32Array) => void;
  selected: Project | null;
  groupRef: React.RefObject<THREE.Group | null>;
}) {
  const gltf = useLoader(GLTFLoader, "/manus-storage/brain_dc0a5366.glb");
  const notified = useRef(false);

  // Iridescent tech-gradient ShaderMaterial: cyan -> blue -> purple
  // Uses vertex normals + world-space Y position for gradient mapping
  const mat = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime:       { value: 0 },
        uOpacity:    { value: 1.0 },
        uLightDir:   { value: new THREE.Vector3(5, 6, 4).normalize() },
        uLightDir2:  { value: new THREE.Vector3(-4, 4, 2).normalize() },
      },
      vertexShader: /* glsl */`
        varying vec3 vNormal;
        varying vec3 vWorldPos;
        varying vec3 vViewDir;
        void main() {
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPos = worldPos.xyz;
          vNormal   = normalize(normalMatrix * normal);
          vViewDir  = normalize(cameraPosition - worldPos.xyz);
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: /* glsl */`
        uniform float uTime;
        uniform float uOpacity;
        uniform vec3  uLightDir;
        uniform vec3  uLightDir2;
        varying vec3  vNormal;
        varying vec3  vWorldPos;
        varying vec3  vViewDir;

        // Tech gradient palette: deep navy -> cyan -> blue -> violet
        vec3 techGradient(float t) {
          // t in [0,1]
          vec3 c0 = vec3(0.02, 0.04, 0.12); // deep navy (shadow)
          vec3 c1 = vec3(0.00, 0.55, 0.85); // bright cyan
          vec3 c2 = vec3(0.20, 0.20, 0.90); // electric blue
          vec3 c3 = vec3(0.55, 0.10, 0.90); // violet-purple
          vec3 c4 = vec3(0.80, 0.10, 0.60); // hot pink accent
          if (t < 0.25) return mix(c0, c1, t / 0.25);
          if (t < 0.50) return mix(c1, c2, (t - 0.25) / 0.25);
          if (t < 0.75) return mix(c2, c3, (t - 0.50) / 0.25);
          return mix(c3, c4, (t - 0.75) / 0.25);
        }

        void main() {
          vec3 N = normalize(vNormal);
          vec3 V = normalize(vViewDir);

          // Fresnel rim — brighter at silhouette edges (iridescent glow)
          float fresnel = pow(1.0 - max(dot(N, V), 0.0), 2.5);

          // Gradient driven by: world Y + fresnel + slow time shimmer
          float shimmer = 0.04 * sin(uTime * 0.8 + vWorldPos.x * 3.0 + vWorldPos.z * 2.0);
          float gradT = clamp((vWorldPos.y + 0.35) / 0.70 + fresnel * 0.35 + shimmer, 0.0, 1.0);
          vec3 baseColor = techGradient(gradT);

          // Diffuse lighting from two directional lights
          float diff1 = max(dot(N, uLightDir),  0.0);
          float diff2 = max(dot(N, uLightDir2), 0.0) * 0.4;
          float diffuse = diff1 + diff2;

          // Specular highlight (Blinn-Phong)
          vec3 H = normalize(uLightDir + V);
          float spec = pow(max(dot(N, H), 0.0), 64.0) * 1.8;

          // Combine: ambient + diffuse colour + specular white + fresnel rim
          vec3 ambient = baseColor * 0.18;
          vec3 lit     = baseColor * (0.55 + diffuse * 0.70);
          vec3 rimGlow = techGradient(clamp(gradT + 0.3, 0.0, 1.0)) * fresnel * 1.2;
          vec3 color   = ambient + lit + vec3(spec) + rimGlow;

          gl_FragColor = vec4(color, uOpacity);
        }
      `,
      transparent: true,
      side: THREE.FrontSide,
    });
  }, []);

  useEffect(() => {
    gltf.scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.material = mat;
        // Compute smooth vertex normals to remove faceted low-poly look
        mesh.geometry.computeVertexNormals();
        mesh.castShadow = false;
        mesh.receiveShadow = false;
        if (!notified.current) {
          const pos = mesh.geometry.attributes.position;
          if (pos) {
            notified.current = true;
            onVertsReady(pos.array as Float32Array);
          }
        }
      }
    });
  }, [gltf, mat, onVertsReady]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    // Slow rotation when not selected
    if (!selected) groupRef.current.rotation.y += delta * 0.22;

    // Animate time uniform for shimmer effect
    mat.uniforms.uTime.value = state.clock.elapsedTime;

    // Fade brain slightly when selected to focus on neural network
    mat.uniforms.uOpacity.value = THREE.MathUtils.lerp(
      mat.uniforms.uOpacity.value,
      selected ? 0.55 : 1.0,
      0.05
    );
  });

  return (
    <group ref={groupRef}>
      <primitive object={gltf.scene} />
    </group>
  );
}

// ─── Neural Network (inside brain on click) ───────────────────────────────────
function BrainNeuralNetwork({ project, visible }: { project: Project | null; visible: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const fadeRef  = useRef(0);

  const { lines, nodes, lineMat, nodeMats } = useMemo(() => {
    if (!project) return { lines: null, nodes: null, lineMat: null, nodeMats: [] };
    const rng   = makeRng(project.id * 7919 + 42);
    const N     = 90;
    const base  = new THREE.Color(project.color);
    const white = new THREE.Color("#ffffff");
    const palette = [
      base,
      base.clone().lerp(white, 0.35),
      white.clone().multiplyScalar(0.9),
      base.clone().lerp(new THREE.Color("#00d4ff"), 0.3),
    ];

    const [px, py, pz] = project.pos;
    const nodePos: THREE.Vector3[] = [];
    for (let i = 0; i < N; i++) {
      const theta = rng() * Math.PI * 2;
      const phi   = Math.acos(2 * rng() - 1);
      const r     = 0.03 + rng() * 0.24;
      nodePos.push(
        new THREE.Vector3(
          px + r * Math.sin(phi) * Math.cos(theta),
          py + r * Math.sin(phi) * Math.sin(theta),
          pz + r * Math.cos(phi)
        )
      );
    }

    const posArr: number[] = [], colArr: number[] = [];
    for (let i = 0; i < N; i++) {
      for (let j = i + 1; j < N; j++) {
        if (nodePos[i].distanceTo(nodePos[j]) < 0.16 && rng() > 0.32) {
          posArr.push(nodePos[i].x, nodePos[i].y, nodePos[i].z, nodePos[j].x, nodePos[j].y, nodePos[j].z);
          const c = palette[Math.floor(rng() * palette.length)];
          colArr.push(c.r, c.g, c.b, c.r, c.g, c.b);
        }
      }
    }
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(posArr), 3));
    lineGeo.setAttribute("color",    new THREE.BufferAttribute(new Float32Array(colArr), 3));
    const lm = new THREE.LineBasicMaterial({
      vertexColors: true, transparent: true, opacity: 0,
      depthWrite: false, blending: THREE.AdditiveBlending,
    });
    const lines = new THREE.LineSegments(lineGeo, lm);

    const sphereGeo = new THREE.SphereGeometry(0.010, 8, 8);
    const nm: THREE.MeshBasicMaterial[] = [];
    const nodeGroup = new THREE.Group();
    nodePos.forEach((p) => {
      const c   = palette[Math.floor(rng() * palette.length)].clone();
      const mat = new THREE.MeshBasicMaterial({
        color: c, transparent: true, opacity: 0,
        blending: THREE.AdditiveBlending, depthWrite: false,
      });
      nm.push(mat);
      const mesh = new THREE.Mesh(sphereGeo, mat);
      mesh.position.copy(p);
      nodeGroup.add(mesh);
    });

    return { lines, nodes: nodeGroup, lineMat: lm, nodeMats: nm };
  }, [project]);

  useFrame((_, delta) => {
    if (!lineMat) return;
    const target = visible ? 1.0 : 0.0;
    fadeRef.current = THREE.MathUtils.lerp(fadeRef.current, target, delta * 2.2);
    lineMat.opacity = fadeRef.current * 0.88;
    nodeMats.forEach((m) => { m.opacity = fadeRef.current * 0.92; });
    if (visible && groupRef.current) groupRef.current.rotation.y += delta * 0.07;
  });

  // Always render a group — never return null from R3F components (causes reconciler crash)
  return (
    <group ref={groupRef}>
      {lines && <primitive object={lines} />}
      {nodes && <primitive object={nodes} />}
    </group>
  );
}

// ─── Project Node ─────────────────────────────────────────────────────────────
function ProjectNode({
  project, selected, anySelected, onSelect,
}: {
  project: Project; selected: boolean; anySelected: boolean; onSelect: () => void;
}) {
  const coreRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const color = useMemo(() => new THREE.Color(project.color), [project.color]);

  useFrame(({ clock }) => {
    if (!coreRef.current || !glowRef.current) return;
    const t = clock.elapsedTime;
    const pulse = selected
      ? 1.8 + 0.3 * Math.sin(t * 3.0)
      : hovered
      ? 1.5 + 0.12 * Math.sin(t * 4.0)
      : 1.0 + 0.10 * Math.sin(t * 1.6 + project.id * 1.3);

    coreRef.current.scale.setScalar(pulse);
    glowRef.current.scale.setScalar(pulse * 1.5);

    const coreMat = coreRef.current.material as THREE.MeshStandardMaterial;
    coreMat.emissiveIntensity = selected ? 14 : hovered ? 9 : 6;
    coreMat.opacity = THREE.MathUtils.lerp(
      coreMat.opacity,
      anySelected && !selected ? 0.04 : 1.0,
      0.07
    );

    const glowMat = glowRef.current.material as THREE.MeshBasicMaterial;
    glowMat.opacity = THREE.MathUtils.lerp(
      glowMat.opacity,
      anySelected && !selected ? 0.01 : selected ? 0.80 : hovered ? 0.55 : 0.32,
      0.07
    );
  });

  return (
    <group position={project.pos}>
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.010, 12, 12]} />
        <meshBasicMaterial color={color} transparent opacity={0.32} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh
        ref={coreRef}
        onClick={(e) => { e.stopPropagation(); onSelect(); }}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = "pointer"; }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = "default"; }}
      >
        <sphereGeometry args={[0.005, 12, 12]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={6} roughness={0.05} metalness={0.9} transparent opacity={1} />
      </mesh>
    </group>
  );
}

// ─── Camera Controller ────────────────────────────────────────────────────────
function CameraController({
  selected,
  controlsRef,
}: {
  selected: Project | null;
  controlsRef: React.RefObject<any>;
}) {
  const targetPos  = useRef(new THREE.Vector3(0, 0, 0.95));
  const targetLook = useRef(new THREE.Vector3(0, 0, 0));

  useEffect(() => {
    if (selected) {
      const [px, py, pz] = selected.pos;
      const dir  = new THREE.Vector3(px, py, pz).normalize();
      const dist = 0.35;
      targetPos.current.set(
        dir.x * dist + px * 0.2,
        dir.y * dist + py * 0.2,
        dir.z * dist + pz * 0.2
      );
      targetLook.current.set(px * 0.5, py * 0.5, pz * 0.5);
      if (controlsRef.current) controlsRef.current.enabled = false;
    } else {
      targetPos.current.set(0, 0, 0.95);
      targetLook.current.set(0, 0, 0);
      if (controlsRef.current) controlsRef.current.enabled = true;
    }
  }, [selected, controlsRef]);

  useFrame(({ camera }, delta) => {
    camera.position.lerp(targetPos.current, delta * 1.8);
    if (controlsRef.current) {
      controlsRef.current.target.lerp(targetLook.current, delta * 1.8);
    }
  });

  return null;
}

// ─── Loading Fallback ─────────────────────────────────────────────────────────
function BrainLoader() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.y = clock.elapsedTime * 0.5;
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.18, 12, 12]} />
      <meshBasicMaterial color="#00d4ff" wireframe opacity={0.4} transparent />
    </mesh>
  );
}

// ─── Scene ────────────────────────────────────────────────────────────────────
function BrainScene({
  selected,
  onSelect,
  controlsRef,
}: {
  selected: Project | null;
  onSelect: (p: Project | null) => void;
  controlsRef: React.RefObject<any>;
}) {
  const brainGroupRef = useRef<THREE.Group>(null);
  const [brainVerts, setBrainVerts] = useState<Float32Array | null>(null);

  return (
    <>
      {/* Lighting matches Spline: strong upper-right key light, soft fill from left */}
      <ambientLight intensity={0.06} />
      {/* Key light — upper right, creates bright right hemisphere (matches Spline) */}
      <directionalLight position={[5, 6, 4]}    intensity={14.0} color="#ffffff" />
      {/* Rim light — upper left, subtle blue-white */}
      <directionalLight position={[-4, 4, 2]}   intensity={2.5}  color="#d0dff0" />
      {/* Under fill — very dim warm */}
      <directionalLight position={[0, -5, 2]}   intensity={0.6}  color="#556677" />
      {/* Back light */}
      <directionalLight position={[0, 1, -5]}   intensity={0.4}  color="#334455" />
      {/* Point light near brain surface for specular highlights on gyri */}
      <pointLight position={[3.5, 3, 3]} intensity={8.0} color="#ffffff" distance={3.0} />

      <Stars radius={150} depth={80} count={3000} factor={2.5} fade speed={0.2} />

      <Suspense fallback={<BrainLoader />}>
        <BrainModel
          onVertsReady={setBrainVerts}
          selected={selected}
          groupRef={brainGroupRef}
        />
        <ParticleCloud brainVerts={brainVerts} selected={selected} />
      </Suspense>

      <BrainNeuralNetwork project={selected} visible={!!selected} />

      {PROJECTS.map((proj) => (
        <ProjectNode
          key={proj.id}
          project={proj}
          selected={selected?.id === proj.id}
          anySelected={!!selected}
          onSelect={() => onSelect(selected?.id === proj.id ? null : proj)}
        />
      ))}

      <CameraController selected={selected} controlsRef={controlsRef} />

      <OrbitControls
        ref={controlsRef}
        enableZoom
        enablePan={false}
        minDistance={0.3}
        maxDistance={2.5}
        dampingFactor={0.07}
        enableDamping
      />
    </>
  );
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────
function DetailPanel({ project, onClose }: { project: Project; onClose: () => void }) {
  return (
    <motion.div
      initial={{ x: 60, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 60, opacity: 0 }}
      transition={{ duration: 0.40, ease: [0.23, 1, 0.32, 1] }}
      style={{
        position: "absolute", top: "50%", right: 24,
        transform: "translateY(-50%)", width: 285, zIndex: 20,
        background: "rgba(0,0,0,0.93)",
        backdropFilter: "blur(28px)",
        border: `1px solid ${project.color}40`,
        borderRadius: 14,
        boxShadow: `0 0 60px ${project.color}15, inset 0 1px 0 ${project.color}25`,
      }}
    >
      <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${project.color}aa, transparent)`, borderRadius: "14px 14px 0 0" }} />
      {[
        { top: 10, left: 10, borderTop: `1px solid ${project.color}65`, borderLeft: `1px solid ${project.color}65` },
        { top: 10, right: 10, borderTop: `1px solid ${project.color}65`, borderRight: `1px solid ${project.color}65` },
        { bottom: 10, left: 10, borderBottom: `1px solid ${project.color}65`, borderLeft: `1px solid ${project.color}65` },
        { bottom: 10, right: 10, borderBottom: `1px solid ${project.color}65`, borderRight: `1px solid ${project.color}65` },
      ].map((s, i) => (
        <div key={i} style={{ position: "absolute", width: 12, height: 12, ...s }} />
      ))}

      <div style={{ padding: 22 }}>
        <p style={{ fontSize: 10, fontFamily: "JetBrains Mono, monospace", color: project.color, letterSpacing: "0.16em", marginBottom: 5 }}>
          {project.subtitle}
        </p>
        <h3 style={{ fontSize: 17, fontWeight: 700, color: "#ffffff", fontFamily: "'Space Grotesk', sans-serif", margin: "0 0 10px" }}>
          {project.title}
        </h3>
        <p style={{ fontSize: 11, color: "#9ca3af", lineHeight: 1.75, marginBottom: 16 }}>
          {project.desc}
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 7, marginBottom: 16 }}>
          {project.stats.map(([val, label]) => (
            <div key={label} style={{ textAlign: "center", padding: "7px 4px", background: `${project.color}10`, border: `1px solid ${project.color}22`, borderRadius: 6 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: project.color, fontFamily: "'Space Grotesk', sans-serif" }}>{val}</div>
              <div style={{ fontSize: 9, color: "#6b7280", marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 16 }}>
          {project.tech.map((t) => (
            <span key={t} style={{ fontSize: 10, padding: "2px 7px", border: `1px solid ${project.color}35`, color: project.color + "cc", borderRadius: 4, fontFamily: "JetBrains Mono, monospace" }}>
              {t}
            </span>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <a href={project.github} target="_blank" rel="noopener noreferrer"
            style={{ flex: 1, textAlign: "center", fontSize: 11, padding: "8px 0", background: `${project.color}18`, border: `1px solid ${project.color}50`, color: project.color, borderRadius: 6, fontFamily: "JetBrains Mono, monospace", textDecoration: "none" }}>
            GitHub
          </a>
          <button onClick={onClose}
            style={{ padding: "8px 12px", fontSize: 11, background: "transparent", border: "1px solid rgba(255,255,255,0.10)", color: "#6b7280", borderRadius: 6, fontFamily: "JetBrains Mono, monospace", cursor: "pointer" }}>
            ESC
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function ProjectsSection() {
  const [selected, setSelected] = useState<Project | null>(null);
  const controlsRef = useRef<any>(null);

  const handleClose = useCallback(() => {
    setSelected(null);
    document.body.style.cursor = "default";
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleClose]);

  return (
    <section id="projects" style={{ height: "100vh", background: "#000000", position: "relative", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ position: "absolute", top: 28, left: 0, right: 0, textAlign: "center", zIndex: 10, pointerEvents: "none" }}>
        <p style={{ fontSize: 10, fontFamily: "JetBrains Mono, monospace", color: "#00d4ff70", letterSpacing: "0.22em", marginBottom: 6 }}>
          SYS.05 · PROJECT MATRIX
        </p>
        <h2 style={{ fontSize: 34, fontWeight: 700, color: "#ffffff", fontFamily: "'Space Grotesk', sans-serif", margin: 0 }}>
          Projects
        </h2>
        <p style={{ fontSize: 10, fontFamily: "JetBrains Mono, monospace", color: "#2d3748", marginTop: 7, letterSpacing: "0.14em" }}>
          {selected ? "CLICK ANYWHERE TO RETURN  ·  ESC TO EXIT" : "DRAG TO SPIN  ·  SCROLL TO ZOOM  ·  CLICK A NODE TO EXPLORE"}
        </p>
      </div>

      {/* Project list sidebar */}
      <div style={{ position: "absolute", left: 20, top: "50%", transform: "translateY(-50%)", zIndex: 10, display: "flex", flexDirection: "column", gap: 6 }}>
        {PROJECTS.map((proj) => (
          <button
            key={proj.id}
            onClick={() => setSelected(selected?.id === proj.id ? null : proj)}
            style={{
              background: selected?.id === proj.id ? `${proj.color}12` : "transparent",
              border: `1px solid ${selected?.id === proj.id ? proj.color + "45" : "transparent"}`,
              borderRadius: 8, padding: "7px 11px", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 8, textAlign: "left",
              transition: "all 0.2s ease",
            }}
          >
            <div style={{ width: 7, height: 7, borderRadius: "50%", flexShrink: 0, background: proj.color, boxShadow: `0 0 8px ${proj.color}` }} />
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: selected?.id === proj.id ? proj.color : "#6b7280", fontFamily: "'Space Grotesk', sans-serif" }}>
                {proj.title}
              </div>
              <div style={{ fontSize: 9, color: "#374151", fontFamily: "JetBrains Mono, monospace" }}>
                {proj.subtitle}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [0, 0, 0.95], fov: 50 }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: "#000000" }}
        onPointerMissed={handleClose}
      >
        <BrainScene selected={selected} onSelect={setSelected} controlsRef={controlsRef} />
      </Canvas>

      {/* Detail panel */}
      <AnimatePresence>
        {selected && <DetailPanel project={selected} onClose={handleClose} />}
      </AnimatePresence>
    </section>
  );
}
