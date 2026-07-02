/**
 * ProjectsSection — 3D Particle AI Brain
 * Inspired by Spline "Particle AI Brain" by jawadahmed15050
 *
 * - 15,000 white/grey particles forming an anatomical brain shape
 * - Particles breathe (drift outward and back slowly)
 * - Brain auto-rotates slowly
 * - Drag to spin with OrbitControls
 * - 4 glowing project nodes on brain surface
 * - Click node → camera zooms in, colorful expanded network appears, detail panel slides in
 */

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import { useRef, useState, useEffect, useMemo, useCallback } from "react";
import * as THREE from "three";
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
    pos: [-0.7, 0.5, 0.6] as [number, number, number],
    github: "https://github.com/HeinHtet-Phyo/moodtunes-ai-group3",
  },
  {
    id: 1,
    title: "IT Career Planner",
    subtitle: "XGBoost · Career AI",
    desc: "XGBoost classifier at 99.75% accuracy across 6,000 samples. Maps SFIA framework skills to career paths with gap analysis.",
    tech: ["Python", "XGBoost", "SFIA", "scikit-learn", "Streamlit"],
    stats: [["99.75%", "Accuracy"], ["6,000", "Samples"], ["SFIA", "Framework"]] as [string, string][],
    color: "#a855f7",
    pos: [0.7, 0.4, 0.5] as [number, number, number],
    github: "https://github.com/HeinHtet-Phyo/it-career-planner",
  },
  {
    id: 2,
    title: "CityPulse",
    subtitle: "Urban Data Analytics",
    desc: "Interactive urban analytics platform aggregating transportation, demographic, and infrastructure data into city-level intelligence.",
    tech: ["Python", "Pandas", "Plotly", "GeoPandas", "Streamlit"],
    stats: [["City", "Scale"], ["Real-time", "Data"], ["Interactive", "Maps"]] as [string, string][],
    color: "#10b981",
    pos: [-0.4, -0.5, 0.7] as [number, number, number],
    github: "https://github.com/HeinHtet-Phyo",
  },
  {
    id: 3,
    title: "PreventPath",
    subtitle: "Health AI · Prevention",
    desc: "ML pipeline predicting health risk factors from patient data, generating personalised prevention plans with risk scoring.",
    tech: ["Python", "scikit-learn", "Flask", "Healthcare ML", "Risk Scoring"],
    stats: [["AI", "Powered"], ["Personal", "Plans"], ["Risk", "Scoring"]] as [string, string][],
    color: "#f59e0b",
    pos: [0.5, -0.5, 0.6] as [number, number, number],
    github: "https://github.com/HeinHtet-Phyo",
  },
];
type Project = (typeof PROJECTS)[0];

// ─── Particle Brain ───────────────────────────────────────────────────────────
// Generates an anatomical brain shape using multiple displaced ellipsoids
function generateBrainParticles(count: number) {
  const positions = new Float32Array(count * 3);
  const phases = new Float32Array(count);

  // Seeded pseudo-random for deterministic shape
  let seed = 12345;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) & 0xffffffff;
    return (seed >>> 0) / 0xffffffff;
  };

  // Brain anatomy: [cx, cy, cz, rx, ry, rz, weight]
  // Modelled after a real brain's major regions
  const regions = [
    // Left frontal lobe
    { cx: -0.38, cy: 0.22, cz: 0.52, rx: 0.72, ry: 0.68, rz: 0.58, w: 0.14 },
    // Right frontal lobe
    { cx: 0.38, cy: 0.22, cz: 0.52, rx: 0.72, ry: 0.68, rz: 0.58, w: 0.14 },
    // Left parietal lobe
    { cx: -0.52, cy: 0.38, cz: -0.05, rx: 0.58, ry: 0.62, rz: 0.52, w: 0.12 },
    // Right parietal lobe
    { cx: 0.52, cy: 0.38, cz: -0.05, rx: 0.58, ry: 0.62, rz: 0.52, w: 0.12 },
    // Left temporal lobe
    { cx: -0.72, cy: -0.18, cz: 0.12, rx: 0.42, ry: 0.38, rz: 0.52, w: 0.10 },
    // Right temporal lobe
    { cx: 0.72, cy: -0.18, cz: 0.12, rx: 0.42, ry: 0.38, rz: 0.52, w: 0.10 },
    // Left occipital lobe
    { cx: -0.32, cy: 0.12, cz: -0.62, rx: 0.52, ry: 0.48, rz: 0.42, w: 0.09 },
    // Right occipital lobe
    { cx: 0.32, cy: 0.12, cz: -0.62, rx: 0.52, ry: 0.48, rz: 0.42, w: 0.09 },
    // Cerebellum
    { cx: 0.0, cy: -0.52, cz: -0.38, rx: 0.62, ry: 0.38, rz: 0.48, w: 0.10 },
  ];

  const totalW = regions.reduce((s, r) => s + r.w, 0);
  let idx = 0;

  for (const region of regions) {
    const regionCount = Math.floor((region.w / totalW) * count);
    for (let i = 0; i < regionCount && idx < count; i++) {
      // Sample on unit sphere surface
      const u = rand();
      const v = rand();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);

      let sx = Math.sin(phi) * Math.cos(theta);
      let sy = Math.sin(phi) * Math.sin(theta);
      let sz = Math.cos(phi);

      // Add gyri/sulci surface detail — multiple frequency noise
      const n1 = Math.sin(sx * 9.2 + sy * 7.1) * Math.cos(sz * 8.3) * 0.055;
      const n2 = Math.sin(sy * 13.4 + sz * 11.2) * Math.cos(sx * 12.1) * 0.032;
      const n3 = Math.sin(sz * 17.8 + sx * 15.3) * Math.cos(sy * 16.4) * 0.018;
      const n4 = (rand() - 0.5) * 0.015; // micro-noise
      const r = 1.0 + n1 + n2 + n3 + n4;

      sx *= r;
      sy *= r;
      sz *= r;

      positions[idx * 3 + 0] = sx * region.rx + region.cx;
      positions[idx * 3 + 1] = sy * region.ry + region.cy;
      positions[idx * 3 + 2] = sz * region.rz + region.cz;
      phases[idx] = rand() * Math.PI * 2;
      idx++;
    }
  }

  // Fill remaining
  while (idx < count) {
    const u = rand(), v = rand();
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);
    positions[idx * 3 + 0] = Math.sin(phi) * Math.cos(theta) * 0.9;
    positions[idx * 3 + 1] = Math.sin(phi) * Math.sin(theta) * 0.85 + 0.1;
    positions[idx * 3 + 2] = Math.cos(phi) * 0.75;
    phases[idx] = rand() * Math.PI * 2;
    idx++;
  }

  return { positions, phases };
}

// ─── ParticleBrain Component ──────────────────────────────────────────────────
function ParticleBrain({
  dimmed,
  groupRef,
}: {
  dimmed: boolean;
  groupRef: React.RefObject<THREE.Group | null>;
}) {
  const PARTICLE_COUNT = 15000;
  const pointsRef = useRef<THREE.Points>(null);

  const { positions: basePos, phases } = useMemo(
    () => generateBrainParticles(PARTICLE_COUNT),
    []
  );

  const animPos = useMemo(() => new Float32Array(basePos), [basePos]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(animPos, 3));

    // Vertex colors: white at top, soft blue-grey at bottom
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const y = basePos[i * 3 + 1];
      const t = Math.max(0, Math.min(1, (y + 0.7) / 1.4));
      colors[i * 3 + 0] = 0.72 + t * 0.28;
      colors[i * 3 + 1] = 0.75 + t * 0.25;
      colors[i * 3 + 2] = 0.82 + t * 0.18;
    }
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return geo;
  }, [basePos, animPos]);

  const material = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: 0.011,
        vertexColors: true,
        transparent: true,
        opacity: 0.88,
        sizeAttenuation: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    []
  );

  useFrame((state) => {
    if (!groupRef.current) return;

    // Auto-rotate when nothing selected
    if (!dimmed) {
      groupRef.current.rotation.y += 0.003;
    }

    // Breathing animation
    const t = state.clock.elapsedTime;
    const pos = geometry.attributes.position as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const ph = phases[i];
      const breathe = 1.0 + 0.022 * Math.sin(t * 0.7 + ph);
      arr[i * 3 + 0] = basePos[i * 3 + 0] * breathe;
      arr[i * 3 + 1] = basePos[i * 3 + 1] * breathe;
      arr[i * 3 + 2] = basePos[i * 3 + 2] * breathe;
    }
    pos.needsUpdate = true;

    // Smooth opacity transition
    const targetOpacity = dimmed ? 0.12 : 0.88;
    material.opacity = THREE.MathUtils.lerp(material.opacity, targetOpacity, 0.04);
  });

  return (
    <group ref={groupRef}>
      <points geometry={geometry} material={material} scale={1.35} />
    </group>
  );
}

// ─── Expanded Neural Network (shown on click) ─────────────────────────────────
function ExpandedNetwork({
  project,
  visible,
}: {
  project: Project | null;
  visible: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);

  const obj = useMemo(() => {
    if (!project) return null;
    let seed = project.id * 7919 + 31337;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) & 0xffffffff;
      return (seed >>> 0) / 0xffffffff;
    };

    const N = 80;
    const base = new THREE.Color(project.color);
    const palette = [
      base,
      new THREE.Color("#00d4ff"),
      new THREE.Color("#ffffff"),
      new THREE.Color("#a855f7"),
      new THREE.Color("#f59e0b"),
      new THREE.Color("#10b981"),
      new THREE.Color("#ff6b6b"),
    ];

    const nodePos: THREE.Vector3[] = [];
    for (let i = 0; i < N; i++) {
      const theta = rand() * Math.PI * 2;
      const phi = Math.acos(2 * rand() - 1);
      const r = 0.1 + rand() * 1.4;
      nodePos.push(
        new THREE.Vector3(
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.sin(phi) * Math.sin(theta),
          r * Math.cos(phi)
        )
      );
    }

    const posArr: number[] = [];
    const colArr: number[] = [];
    for (let i = 0; i < N; i++) {
      for (let j = i + 1; j < N; j++) {
        if (nodePos[i].distanceTo(nodePos[j]) < 0.8 && rand() > 0.25) {
          posArr.push(
            nodePos[i].x, nodePos[i].y, nodePos[i].z,
            nodePos[j].x, nodePos[j].y, nodePos[j].z
          );
          const c = palette[Math.floor(rand() * palette.length)];
          colArr.push(c.r, c.g, c.b, c.r, c.g, c.b);
        }
      }
    }

    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(posArr), 3));
    lineGeo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(colArr), 3));
    const lines = new THREE.LineSegments(
      lineGeo,
      new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.85, depthWrite: false })
    );

    const sphereGeo = new THREE.SphereGeometry(0.035, 8, 8);
    const group = new THREE.Group();
    group.add(lines);
    nodePos.forEach((p) => {
      const c = palette[Math.floor(rand() * palette.length)].clone().lerp(new THREE.Color("#ffffff"), rand() * 0.5);
      const mesh = new THREE.Mesh(
        sphereGeo,
        new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.9 })
      );
      mesh.position.copy(p);
      group.add(mesh);
    });

    return group;
  }, [project]);

  useFrame((_, delta) => {
    if (groupRef.current && visible) {
      groupRef.current.rotation.y += delta * 0.25;
      groupRef.current.rotation.x += delta * 0.08;
    }
  });

  if (!obj) return null;
  return (
    <group
      ref={groupRef}
      visible={visible}
      position={project?.pos ?? [0, 0, 0]}
      scale={visible ? 1 : 0}
    >
      <primitive object={obj} />
    </group>
  );
}

// ─── Project Node ─────────────────────────────────────────────────────────────
function ProjectNode({
  project,
  selected,
  anySelected,
  onSelect,
}: {
  project: Project;
  selected: boolean;
  anySelected: boolean;
  onSelect: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const color = useMemo(() => new THREE.Color(project.color), [project.color]);

  useFrame(({ clock }) => {
    if (!meshRef.current || !glowRef.current) return;
    const t = clock.elapsedTime;
    const pulse = selected
      ? 1.5 + 0.18 * Math.sin(t * 3.0)
      : hovered
      ? 1.3 + 0.1 * Math.sin(t * 4.0)
      : 1.0 + 0.06 * Math.sin(t * 1.8 + project.id);

    meshRef.current.scale.setScalar(pulse);
    glowRef.current.scale.setScalar(pulse * 2.0);

    const dimTarget = anySelected && !selected ? 0.08 : 1.0;
    const mat = meshRef.current.material as THREE.MeshStandardMaterial;
    mat.opacity = THREE.MathUtils.lerp(mat.opacity, dimTarget, 0.06);
    mat.emissiveIntensity = selected ? 6 : hovered ? 4 : 2.5;

    const glowMat = glowRef.current.material as THREE.MeshBasicMaterial;
    glowMat.opacity = THREE.MathUtils.lerp(
      glowMat.opacity,
      anySelected && !selected ? 0.01 : selected ? 0.55 : hovered ? 0.35 : 0.2,
      0.06
    );
  });

  return (
    <group position={project.pos}>
      {/* Outer glow sphere */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.22}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      {/* Core node */}
      <mesh
        ref={meshRef}
        onClick={(e) => { e.stopPropagation(); onSelect(); }}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = "pointer"; }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = "default"; }}
      >
        <sphereGeometry args={[0.022, 20, 20]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={2.5}
          roughness={0.1}
          metalness={0.8}
          transparent
          opacity={1}
        />
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
  const targetCamPos = useRef(new THREE.Vector3(0, 0, 5));
  const targetLook = useRef(new THREE.Vector3(0, 0, 0));

  useEffect(() => {
    if (selected) {
      const p = new THREE.Vector3(...selected.pos).multiplyScalar(1.35);
      targetCamPos.current.set(p.x * 1.8, p.y * 1.8, p.z * 1.8 + 2.2);
      targetLook.current.set(p.x * 0.8, p.y * 0.8, p.z * 0.8);
      if (controlsRef.current) controlsRef.current.enabled = false;
    } else {
      targetCamPos.current.set(0, 0, 5);
      targetLook.current.set(0, 0, 0);
      if (controlsRef.current) controlsRef.current.enabled = true;
    }
  }, [selected, controlsRef]);

  useFrame(({ camera }, delta) => {
    camera.position.lerp(targetCamPos.current, delta * 2.5);
    if (controlsRef.current) {
      controlsRef.current.target.lerp(targetLook.current, delta * 2.5);
    }
  });

  return null;
}

// ─── 3D Scene ─────────────────────────────────────────────────────────────────
function BrainScene({
  selected,
  onSelect,
  controlsRef,
}: {
  selected: Project | null;
  onSelect: (p: Project | null) => void;
  controlsRef: React.RefObject<any>;
}) {
  const groupRef = useRef<THREE.Group>(null);

  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[4, 4, 4]} intensity={1.5} color="#ffffff" />
      <pointLight position={[-3, -2, -3]} intensity={0.8} color="#4488ff" />
      <pointLight position={[0, -4, 2]} intensity={0.5} color="#8844ff" />

      <Stars radius={90} depth={60} count={4000} factor={3} fade speed={0.4} />

      <ParticleBrain dimmed={!!selected} groupRef={groupRef} />

      {/* Project nodes are in world space (not inside brain group so they don't rotate with it) */}
      {PROJECTS.map((proj) => (
        <ProjectNode
          key={proj.id}
          project={proj}
          selected={selected?.id === proj.id}
          anySelected={!!selected}
          onSelect={() => onSelect(selected?.id === proj.id ? null : proj)}
        />
      ))}

      <ExpandedNetwork project={selected} visible={!!selected} />

      <CameraController selected={selected} controlsRef={controlsRef} />

      <OrbitControls
        ref={controlsRef}
        enableZoom
        enablePan={false}
        minDistance={2.5}
        maxDistance={9}
        dampingFactor={0.08}
        enableDamping
      />
    </>
  );
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────
function DetailPanel({
  project,
  onClose,
}: {
  project: Project;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ x: 60, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 60, opacity: 0 }}
      transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
      className="absolute top-1/2 right-6 -translate-y-1/2 w-80 z-20"
      style={{
        background: "rgba(0,0,0,0.82)",
        backdropFilter: "blur(24px)",
        border: `1px solid ${project.color}45`,
        borderRadius: "14px",
        boxShadow: `0 0 50px ${project.color}20, inset 0 1px 0 ${project.color}30`,
      }}
    >
      {/* Top glow line */}
      <div
        className="h-px w-full rounded-t-xl"
        style={{ background: `linear-gradient(90deg, transparent, ${project.color}cc, transparent)` }}
      />

      {/* Corner brackets */}
      {["top-3 left-3 border-t border-l", "top-3 right-3 border-t border-r", "bottom-3 left-3 border-b border-l", "bottom-3 right-3 border-b border-r"].map((cls, i) => (
        <div key={i} className={`absolute w-4 h-4 ${cls}`} style={{ borderColor: project.color + "80" }} />
      ))}

      <div className="p-6">
        <p className="text-xs font-mono mb-1.5 tracking-wider" style={{ color: project.color }}>
          {project.subtitle}
        </p>
        <h3
          className="text-xl font-bold text-white mb-3"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          {project.title}
        </h3>
        <p className="text-xs text-gray-400 leading-relaxed mb-5">{project.desc}</p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          {project.stats.map(([val, label]) => (
            <div
              key={label}
              className="text-center p-2 rounded"
              style={{ background: `${project.color}12`, border: `1px solid ${project.color}28` }}
            >
              <div
                className="text-sm font-bold"
                style={{ color: project.color, fontFamily: "'Space Grotesk', sans-serif" }}
              >
                {val}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Tech tags */}
        <div className="flex flex-wrap gap-1.5 mb-5">
          {project.tech.map((t) => (
            <span
              key={t}
              className="text-xs px-2 py-0.5 rounded font-mono"
              style={{ border: `1px solid ${project.color}40`, color: project.color + "cc" }}
            >
              {t}
            </span>
          ))}
        </div>

        {/* Buttons */}
        <div className="flex gap-2">
          <a
            href={project.github}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center text-xs py-2 rounded font-mono transition-all duration-200"
            style={{
              background: `${project.color}20`,
              border: `1px solid ${project.color}60`,
              color: project.color,
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = `${project.color}38`)}
            onMouseOut={(e) => (e.currentTarget.style.background = `${project.color}20`)}
          >
            GitHub →
          </a>
          <button
            onClick={onClose}
            className="px-3 text-xs py-2 rounded font-mono text-gray-500 border border-white/10 hover:border-white/30 hover:text-gray-300 transition-all"
          >
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
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleClose]);

  return (
    <section
      id="projects"
      style={{ height: "100vh", background: "#000000", position: "relative", overflow: "hidden" }}
    >
      {/* Header */}
      <div
        style={{
          position: "absolute", top: 32, left: 0, right: 0,
          textAlign: "center", zIndex: 10, pointerEvents: "none",
        }}
      >
        <p style={{ fontSize: 11, fontFamily: "JetBrains Mono, monospace", color: "#00d4ff99", letterSpacing: "0.2em", marginBottom: 8 }}>
          SYS.05 · PROJECT MATRIX
        </p>
        <h2 style={{ fontSize: 36, fontWeight: 700, color: "#ffffff", fontFamily: "'Space Grotesk', sans-serif", margin: 0 }}>
          Projects
        </h2>
        <p style={{ fontSize: 11, fontFamily: "JetBrains Mono, monospace", color: "#4b5563", marginTop: 8, letterSpacing: "0.12em" }}>
          DRAG TO SPIN · SCROLL TO ZOOM · CLICK A NODE TO EXPLORE
        </p>
      </div>

      {/* Project list sidebar */}
      <div
        style={{
          position: "absolute", left: 24, top: "50%", transform: "translateY(-50%)",
          zIndex: 10, display: "flex", flexDirection: "column", gap: 8,
        }}
      >
        {PROJECTS.map((proj) => (
          <button
            key={proj.id}
            onClick={() => setSelected(selected?.id === proj.id ? null : proj)}
            style={{
              background: selected?.id === proj.id ? `${proj.color}18` : "transparent",
              border: `1px solid ${selected?.id === proj.id ? proj.color + "55" : "transparent"}`,
              borderRadius: 8, padding: "8px 12px", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 8, textAlign: "left",
              transition: "all 0.2s",
            }}
          >
            <div
              style={{
                width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                background: proj.color,
                boxShadow: `0 0 8px ${proj.color}`,
              }}
            />
            <div>
              <div style={{
                fontSize: 12, fontWeight: 600, color: selected?.id === proj.id ? proj.color : "#9ca3af",
                fontFamily: "'Space Grotesk', sans-serif",
              }}>
                {proj.title}
              </div>
              <div style={{ fontSize: 10, color: "#4b5563", fontFamily: "JetBrains Mono, monospace" }}>
                {proj.subtitle}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [0, 0, 5], fov: 60 }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: "#000000" }}
        onPointerMissed={handleClose}
      >
        <BrainScene selected={selected} onSelect={setSelected} controlsRef={controlsRef} />
      </Canvas>

      {/* Detail panel */}
      <AnimatePresence>
        {selected && (
          <DetailPanel project={selected} onClose={handleClose} />
        )}
      </AnimatePresence>
    </section>
  );
}
