/**
 * ProjectsSection — Real 3D Brain Model
 *
 * Uses a real anatomical brain GLB mesh (48K vertices, proper gyri/sulci).
 * White particle halo scatters around the brain surface like the Spline reference.
 * 4 coloured project nodes sit on the brain surface.
 *
 * Interaction:
 * - Click a node → camera zooms INTO that brain region
 * - Neural network connections appear INSIDE the brain at that location
 * - Detail panel slides in from right
 * - ESC / click background to return
 */

import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import { Suspense, useRef, useState, useEffect, useMemo, useCallback } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { motion, AnimatePresence } from "framer-motion";

// ─── Project Data ─────────────────────────────────────────────────────────────
const PROJECTS = [
  {
    id: 0,
    title: "MoodTunes AI",
    subtitle: "ML · Music Recommender",
    desc: "LightGBM trained on 114K+ Spotify tracks. F1 score 0.5652 on 5-class mood classification with real-time recommendation API.",
    tech: ["Python", "LightGBM", "Spotify API", "scikit-learn", "Pandas"],
    stats: [["0.5652", "F1 Score"], ["114K+", "Tracks"], ["5", "Moods"]] as [string, string][],
    color: "#00d4ff",
    // Position on brain surface (normalized coords relative to brain center)
    pos: [-0.18, 0.22, 0.28] as [number, number, number],
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
    pos: [0.20, 0.22, 0.26] as [number, number, number],
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
    pos: [-0.22, -0.05, 0.30] as [number, number, number],
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
    pos: [0.22, -0.05, 0.28] as [number, number, number],
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

// ─── Particle Halo ────────────────────────────────────────────────────────────
// Particles scatter around the brain surface like the Spline reference
function generateHaloParticles(count: number, brainVertices: Float32Array | null) {
  const rng = makeRng(31415);
  const positions = new Float32Array(count * 3);
  const phases    = new Float32Array(count);

  const vertCount = brainVertices ? brainVertices.length / 3 : 0;

  for (let i = 0; i < count; i++) {
    let bx = 0, by = 0, bz = 0;

    if (brainVertices && vertCount > 0) {
      // Pick a random vertex on the brain surface as the base
      const vi = Math.floor(rng() * vertCount) * 3;
      bx = brainVertices[vi];
      by = brainVertices[vi + 1];
      bz = brainVertices[vi + 2];
    } else {
      // Fallback: random sphere
      const u = rng(), v = rng();
      const theta = 2 * Math.PI * u;
      const phi   = Math.acos(2 * v - 1);
      bx = 0.3 * Math.sin(phi) * Math.cos(theta);
      by = 0.3 * Math.sin(phi) * Math.sin(theta);
      bz = 0.3 * Math.cos(phi);
    }

    // Scatter outward from surface: 60% close (0-0.08), 40% further (0.08-0.35)
    const scatter = rng();
    const dist = scatter < 0.6
      ? rng() * 0.08
      : 0.08 + rng() * 0.27;

    // Direction: outward from brain center
    const len = Math.sqrt(bx * bx + by * by + bz * bz) || 1;
    const nx = bx / len, ny = by / len, nz = bz / len;

    positions[i * 3 + 0] = bx + nx * dist;
    positions[i * 3 + 1] = by + ny * dist;
    positions[i * 3 + 2] = bz + nz * dist;
    phases[i] = rng() * Math.PI * 2;
  }

  return { positions, phases };
}

// ─── Particle Halo Component ──────────────────────────────────────────────────
function ParticleHalo({
  brainVertices,
  selected,
}: {
  brainVertices: Float32Array | null;
  selected: Project | null;
}) {
  const COUNT = 20000;
  const pointsRef = useRef<THREE.Points>(null);

  const { positions: basePos, phases } = useMemo(
    () => generateHaloParticles(COUNT, brainVertices),
    [brainVertices]
  );

  const animPos = useMemo(() => new Float32Array(basePos), [basePos]);

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(animPos, 3));
    const colors = new Float32Array(COUNT * 3);
    const rngC = makeRng(99991);
    for (let i = 0; i < COUNT; i++) {
      const b = 0.55 + rngC() * 0.45;
      colors[i * 3 + 0] = b * 0.92;
      colors[i * 3 + 1] = b * 0.95;
      colors[i * 3 + 2] = b;
    }
    g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return g;
  }, [animPos]);

  const mat = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: 0.006,
        vertexColors: true,
        transparent: true,
        opacity: 0.85,
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
      const breathe = 1.0 + 0.018 * Math.sin(t * 0.5 + ph);
      arr[i * 3 + 0] = basePos[i * 3 + 0] * breathe;
      arr[i * 3 + 1] = basePos[i * 3 + 1] * breathe;
      arr[i * 3 + 2] = basePos[i * 3 + 2] * breathe;
    }
    posAttr.needsUpdate = true;

    mat.opacity = THREE.MathUtils.lerp(mat.opacity, selected ? 0.45 : 0.85, 0.04);
  });

  return <points ref={pointsRef} geometry={geo} material={mat} />;
}

// ─── Real Brain Mesh ──────────────────────────────────────────────────────────
function BrainModel({
  onVerticesReady,
  selected,
  groupRef,
}: {
  onVerticesReady: (v: Float32Array) => void;
  selected: Project | null;
  groupRef: React.RefObject<THREE.Group | null>;
}) {
  const gltf = useLoader(GLTFLoader, "/manus-storage/brain_dc0a5366.glb");
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef  = useRef<THREE.MeshStandardMaterial | null>(null);
  const notified = useRef(false);

  const brainMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#1a1a1e",
        emissive: "#000000",
        emissiveIntensity: 0.0,
        roughness: 0.82,
        metalness: 0.04,
        side: THREE.DoubleSide,
      }),
    []
  );
  matRef.current = brainMat;

  useEffect(() => {
    if (!gltf || notified.current) return;
    // Extract vertices from the first mesh in the GLTF
    gltf.scene.traverse((child) => {
      if (notified.current) return;
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const pos = mesh.geometry.attributes.position;
        if (pos) {
          notified.current = true;
          onVerticesReady(pos.array as Float32Array);
        }
      }
    });
  }, [gltf, onVerticesReady]);

  useFrame(() => {
    if (!groupRef.current) return;
    if (!selected) groupRef.current.rotation.y += 0.0018;

    if (matRef.current) {
      matRef.current.opacity = THREE.MathUtils.lerp(
        matRef.current.opacity ?? 1,
        selected ? 0.42 : 1.0,
        0.04
      );
      matRef.current.transparent = selected ? true : false;
    }
  });

  // Apply our material to all meshes in the brain
  useEffect(() => {
    gltf.scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        (child as THREE.Mesh).material = brainMat;
      }
    });
  }, [gltf, brainMat]);

  return (
    <group ref={groupRef}>
      <primitive object={gltf.scene} />
    </group>
  );
}

// ─── Neural Network Inside Brain ──────────────────────────────────────────────
function BrainNeuralNetwork({ project, visible }: { project: Project | null; visible: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const fadeRef  = useRef(0);

  const { lines, nodes, lineMat, nodeMats } = useMemo(() => {
    if (!project) return { lines: null, nodes: null, lineMat: null, nodeMats: [] };
    const rng   = makeRng(project.id * 7919 + 42);
    const N     = 80;
    const base  = new THREE.Color(project.color);
    const white = new THREE.Color("#ffffff");
    const palette = [
      base,
      base.clone().lerp(white, 0.4),
      white.clone().multiplyScalar(0.85),
      base.clone().lerp(new THREE.Color("#00d4ff"), 0.35),
    ];

    const [px, py, pz] = project.pos;
    const nodePos: THREE.Vector3[] = [];
    for (let i = 0; i < N; i++) {
      const theta = rng() * Math.PI * 2;
      const phi   = Math.acos(2 * rng() - 1);
      const r     = 0.04 + rng() * 0.22;
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
        if (nodePos[i].distanceTo(nodePos[j]) < 0.18 && rng() > 0.35) {
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

    const sphereGeo = new THREE.SphereGeometry(0.012, 8, 8);
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
    if (!groupRef.current || !lineMat) return;
    const target = visible ? 1.0 : 0.0;
    fadeRef.current = THREE.MathUtils.lerp(fadeRef.current, target, delta * 2.5);
    lineMat.opacity = fadeRef.current * 0.9;
    nodeMats.forEach((m) => { m.opacity = fadeRef.current * 0.95; });
    if (visible && groupRef.current) groupRef.current.rotation.y += delta * 0.08;
  });

  if (!lines || !nodes) return null;
  return (
    <group ref={groupRef}>
      <primitive object={lines} />
      <primitive object={nodes} />
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
      ? 1.7 + 0.25 * Math.sin(t * 3.2)
      : hovered
      ? 1.4 + 0.12 * Math.sin(t * 4.0)
      : 1.0 + 0.09 * Math.sin(t * 1.7 + project.id * 1.4);

    coreRef.current.scale.setScalar(pulse);
    glowRef.current.scale.setScalar(pulse * 2.6);

    const coreMat = coreRef.current.material as THREE.MeshStandardMaterial;
    coreMat.emissiveIntensity = selected ? 12 : hovered ? 8 : 5;
    coreMat.opacity = THREE.MathUtils.lerp(
      coreMat.opacity,
      anySelected && !selected ? 0.06 : 1.0,
      0.07
    );

    const glowMat = glowRef.current.material as THREE.MeshBasicMaterial;
    glowMat.opacity = THREE.MathUtils.lerp(
      glowMat.opacity,
      anySelected && !selected ? 0.01 : selected ? 0.75 : hovered ? 0.50 : 0.30,
      0.07
    );
  });

  return (
    <group position={project.pos}>
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.30} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh
        ref={coreRef}
        onClick={(e) => { e.stopPropagation(); onSelect(); }}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = "pointer"; }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = "default"; }}
      >
        <sphereGeometry args={[0.018, 16, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={5} roughness={0.05} metalness={0.9} transparent opacity={1} />
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
  const targetPos  = useRef(new THREE.Vector3(0, 0, 0.9));
  const targetLook = useRef(new THREE.Vector3(0, 0, 0));

  useEffect(() => {
    if (selected) {
      const [px, py, pz] = selected.pos;
      const dir  = new THREE.Vector3(px, py, pz).normalize();
      const dist = 0.38;
      targetPos.current.set(
        dir.x * dist + px * 0.15,
        dir.y * dist + py * 0.15,
        dir.z * dist + pz * 0.15
      );
      targetLook.current.set(px * 0.5, py * 0.5, pz * 0.5);
      if (controlsRef.current) controlsRef.current.enabled = false;
    } else {
      targetPos.current.set(0, 0, 0.9);
      targetLook.current.set(0, 0, 0);
      if (controlsRef.current) controlsRef.current.enabled = true;
    }
  }, [selected, controlsRef]);

  useFrame(({ camera }, delta) => {
    camera.position.lerp(targetPos.current, delta * 2.0);
    if (controlsRef.current) {
      controlsRef.current.target.lerp(targetLook.current, delta * 2.0);
    }
  });

  return null;
}

// ─── Loading Fallback ─────────────────────────────────────────────────────────
function BrainLoader() {
  return (
    <mesh>
      <sphereGeometry args={[0.15, 16, 16]} />
      <meshBasicMaterial color="#00d4ff" wireframe />
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
  const [brainVertices, setBrainVertices] = useState<Float32Array | null>(null);

  return (
    <>
      <ambientLight intensity={0.10} />
      <directionalLight position={[3, 5, 4]}    intensity={9.0} color="#f0f4ff" />
      <directionalLight position={[-3, 2, 2]}   intensity={3.5} color="#aabbdd" />
      <directionalLight position={[0, -4, 2]}   intensity={1.8} color="#778899" />
      <directionalLight position={[0, 1, -4]}   intensity={1.0} color="#556677" />
      <pointLight position={[2, 3, 3]}  intensity={5.5} color="#ffffff" distance={3} />
      <pointLight position={[-2, 2, 2]} intensity={2.8} color="#99aabb" distance={2.5} />

      <Stars radius={120} depth={60} count={4000} factor={3} fade speed={0.25} />

      <Suspense fallback={<BrainLoader />}>
        <BrainModel
          onVerticesReady={setBrainVertices}
          selected={selected}
          groupRef={brainGroupRef}
        />
        <ParticleHalo brainVertices={brainVertices} selected={selected} />
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
      transition={{ duration: 0.42, ease: [0.23, 1, 0.32, 1] }}
      style={{
        position: "absolute", top: "50%", right: 24,
        transform: "translateY(-50%)", width: 290, zIndex: 20,
        background: "rgba(0,0,0,0.92)",
        backdropFilter: "blur(28px)",
        border: `1px solid ${project.color}40`,
        borderRadius: 14,
        boxShadow: `0 0 60px ${project.color}18, inset 0 1px 0 ${project.color}28`,
      }}
    >
      <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${project.color}bb, transparent)`, borderRadius: "14px 14px 0 0" }} />
      {[
        { top: 10, left: 10, borderTop: `1px solid ${project.color}70`, borderLeft: `1px solid ${project.color}70` },
        { top: 10, right: 10, borderTop: `1px solid ${project.color}70`, borderRight: `1px solid ${project.color}70` },
        { bottom: 10, left: 10, borderBottom: `1px solid ${project.color}70`, borderLeft: `1px solid ${project.color}70` },
        { bottom: 10, right: 10, borderBottom: `1px solid ${project.color}70`, borderRight: `1px solid ${project.color}70` },
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
            <div key={label} style={{ textAlign: "center", padding: "7px 4px", background: `${project.color}10`, border: `1px solid ${project.color}25`, borderRadius: 6 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: project.color, fontFamily: "'Space Grotesk', sans-serif" }}>{val}</div>
              <div style={{ fontSize: 9, color: "#6b7280", marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 16 }}>
          {project.tech.map((t) => (
            <span key={t} style={{ fontSize: 10, padding: "2px 7px", border: `1px solid ${project.color}38`, color: project.color + "cc", borderRadius: 4, fontFamily: "JetBrains Mono, monospace" }}>
              {t}
            </span>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <a href={project.github} target="_blank" rel="noopener noreferrer"
            style={{ flex: 1, textAlign: "center", fontSize: 11, padding: "8px 0", background: `${project.color}18`, border: `1px solid ${project.color}55`, color: project.color, borderRadius: 6, fontFamily: "JetBrains Mono, monospace", textDecoration: "none" }}>
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
        <p style={{ fontSize: 10, fontFamily: "JetBrains Mono, monospace", color: "#00d4ff88", letterSpacing: "0.22em", marginBottom: 6 }}>
          SYS.05 · PROJECT MATRIX
        </p>
        <h2 style={{ fontSize: 34, fontWeight: 700, color: "#ffffff", fontFamily: "'Space Grotesk', sans-serif", margin: 0 }}>
          Projects
        </h2>
        <p style={{ fontSize: 10, fontFamily: "JetBrains Mono, monospace", color: "#374151", marginTop: 7, letterSpacing: "0.14em" }}>
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
              background: selected?.id === proj.id ? `${proj.color}15` : "transparent",
              border: `1px solid ${selected?.id === proj.id ? proj.color + "50" : "transparent"}`,
              borderRadius: 8, padding: "7px 11px", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 8, textAlign: "left",
              transition: "all 0.2s ease",
            }}
          >
            <div style={{ width: 7, height: 7, borderRadius: "50%", flexShrink: 0, background: proj.color, boxShadow: `0 0 8px ${proj.color}` }} />
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: selected?.id === proj.id ? proj.color : "#9ca3af", fontFamily: "'Space Grotesk', sans-serif" }}>
                {proj.title}
              </div>
              <div style={{ fontSize: 9, color: "#4b5563", fontFamily: "JetBrains Mono, monospace" }}>
                {proj.subtitle}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [0, 0, 0.9], fov: 52 }}
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
