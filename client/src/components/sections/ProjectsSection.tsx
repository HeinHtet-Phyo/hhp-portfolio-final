// 3D Brain Neural Network Projects Section
// Full 3D brain: two displaced lobes + 500 colorful fiber lines on surface
// OrbitControls: drag to spin, scroll to zoom
// Project nodes glow on brain surface — click to zoom + expand dense network
// Glassmorphism detail panel slides in
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import { useRef, useState, useEffect, Suspense, useMemo, useCallback } from "react";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";

// ─── Data ─────────────────────────────────────────────────────────────────────
const PROJECTS = [
  {
    id: "p1",
    title: "MoodTunes AI",
    subtitle: "ML · Music Recommender",
    desc: "LightGBM trained on 114K+ Spotify tracks. F1 score 0.5652 on 5-class mood classification with real-time recommendation API.",
    tech: ["Python", "LightGBM", "Spotify API", "scikit-learn", "pandas"],
    stats: [["0.5652", "F1 Score"], ["114K+", "Tracks"], ["5", "Moods"]] as [string, string][],
    color: "#00d4ff",
    pos: [-0.9, 0.6, 0.7] as [number, number, number],
    github: "https://github.com/HeinHtet-Phyo/moodtunes-ai-group3",
  },
  {
    id: "p2",
    title: "IT Career Planner",
    subtitle: "XGBoost · Career AI",
    desc: "XGBoost classifier at 99.75% accuracy across 6,000 samples. Maps SFIA framework skills to career paths with gap analysis.",
    tech: ["Python", "XGBoost", "SFIA", "scikit-learn", "Streamlit"],
    stats: [["99.75%", "Accuracy"], ["6,000", "Samples"], ["SFIA", "Framework"]] as [string, string][],
    color: "#a855f7",
    pos: [0.9, 0.5, 0.6] as [number, number, number],
    github: "https://github.com/HeinHtet-Phyo/it-career-planner",
  },
  {
    id: "p3",
    title: "CityPulse",
    subtitle: "Urban Data Analytics",
    desc: "Interactive urban analytics platform aggregating transportation, demographic, and infrastructure data into city-level intelligence.",
    tech: ["Python", "Pandas", "Plotly", "GeoPandas", "Streamlit"],
    stats: [["City", "Scale"], ["Real-time", "Data"], ["Interactive", "Maps"]] as [string, string][],
    color: "#10b981",
    pos: [-0.5, -0.5, 0.9] as [number, number, number],
    github: "https://github.com/HeinHtet-Phyo",
  },
  {
    id: "p4",
    title: "PreventPath",
    subtitle: "Health AI · Prevention",
    desc: "ML pipeline predicting health risk factors from patient data, generating personalised prevention plans with risk scoring.",
    tech: ["Python", "scikit-learn", "Flask", "Healthcare ML", "Risk Scoring"],
    stats: [["AI", "Powered"], ["Personal", "Plans"], ["Risk", "Scoring"]] as [string, string][],
    color: "#f59e0b",
    pos: [0.5, -0.6, 0.8] as [number, number, number],
    github: "https://github.com/HeinHtet-Phyo",
  },
];
type Project = typeof PROJECTS[0];

// ─── Seeded RNG ───────────────────────────────────────────────────────────────
function seededRng(seed: number) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

// ─── Brain Lobe (displaced sphere) ───────────────────────────────────────────
function BrainLobe({ position, opacity }: { position: [number, number, number]; opacity: number }) {
  const geo = useMemo(() => {
    const g = new THREE.SphereGeometry(1, 48, 48);
    const pos = g.attributes.position;
    const rng = seededRng(position[0] > 0 ? 13 : 7);
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      const n = new THREE.Vector3(x, y, z).normalize();
      const d =
        Math.sin(n.x * 8 + 1.2) * 0.07 +
        Math.sin(n.y * 9 - 0.7) * 0.08 +
        Math.sin(n.z * 7 + 2.1) * 0.06 +
        Math.sin(n.x * 14 + n.y * 11) * 0.04 +
        Math.sin(n.y * 13 + n.z * 10) * 0.04 +
        (rng() - 0.5) * 0.025;
      pos.setXYZ(i, x + n.x * d, y + n.y * d, z + n.z * d);
    }
    g.computeVertexNormals();
    return g;
  }, [position]);

  return (
    <group position={position} scale={[1.15, 1.05, 1.0]}>
      {/* Solid lobe */}
      <mesh geometry={geo}>
        <meshStandardMaterial
          color="#040d2a" emissive="#001155" emissiveIntensity={0.9}
          roughness={0.8} metalness={0.1} transparent opacity={opacity * 0.5}
        />
      </mesh>
      {/* Wireframe overlay */}
      <mesh geometry={geo}>
        <meshBasicMaterial color="#1a4080" wireframe transparent opacity={opacity * 0.25} />
      </mesh>
    </group>
  );
}

// ─── Brain Fibers ─────────────────────────────────────────────────────────────
function BrainFibers({ opacity }: { opacity: number }) {
  const matRef = useRef<THREE.LineBasicMaterial>(null);

  const geo = useMemo(() => {
    const rng = seededRng(42);
    const FIBER_COUNT = 600;
    const SEGMENTS = 20;
    const posArr: number[] = [];
    const colArr: number[] = [];

    const palette = [
      new THREE.Color("#00eeff"), new THREE.Color("#0088ff"), new THREE.Color("#cc44ff"),
      new THREE.Color("#00ff99"), new THREE.Color("#ff9900"), new THREE.Color("#ff3344"),
      new THREE.Color("#00ffee"), new THREE.Color("#8844ff"), new THREE.Color("#ffffff"),
      new THREE.Color("#44aaff"), new THREE.Color("#ff44aa"), new THREE.Color("#ffee00"),
    ];

    const onBrainSurface = (): THREE.Vector3 => {
      const side = rng() > 0.5 ? -0.55 : 0.55;
      const theta = rng() * Math.PI * 2;
      const phi = Math.acos(2 * rng() - 1);
      const r = 0.98 + (rng() - 0.5) * 0.04;
      return new THREE.Vector3(
        side + r * Math.sin(phi) * Math.cos(theta),
        r * 0.92 * Math.sin(phi) * Math.sin(theta),
        r * 0.88 * Math.cos(phi),
      );
    };

    for (let f = 0; f < FIBER_COUNT; f++) {
      const start = onBrainSurface();
      const end = onBrainSurface();
      const mid = start.clone().lerp(end, 0.5).multiplyScalar(1.1 + rng() * 0.1);
      const ctrl1 = start.clone().lerp(mid, 0.5).addScaledVector(new THREE.Vector3(rng()-0.5, rng()-0.5, rng()-0.5), 0.3);
      const ctrl2 = end.clone().lerp(mid, 0.5).addScaledVector(new THREE.Vector3(rng()-0.5, rng()-0.5, rng()-0.5), 0.3);
      const curve = new THREE.CubicBezierCurve3(start, ctrl1, ctrl2, end);
      const pts = curve.getPoints(SEGMENTS);
      const c1 = palette[Math.floor(rng() * palette.length)];
      const c2 = palette[Math.floor(rng() * palette.length)];
      for (let i = 0; i < pts.length - 1; i++) {
        posArr.push(pts[i].x, pts[i].y, pts[i].z, pts[i+1].x, pts[i+1].y, pts[i+1].z);
        const t = i / (pts.length - 1);
        const c = c1.clone().lerp(c2, t);
        colArr.push(c.r, c.g, c.b, c.r, c.g, c.b);
      }
    }

    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(posArr), 3));
    g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(colArr), 3));
    return g;
  }, []);

  useEffect(() => {
    if (matRef.current) matRef.current.opacity = opacity;
  }, [opacity]);

  const lineObj = useMemo(() => {
    const mat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.95, depthWrite: false });
    return new THREE.LineSegments(geo, mat);
  }, [geo]);

  useEffect(() => {
    const mat = lineObj.material as THREE.LineBasicMaterial;
    mat.opacity = opacity;
    mat.needsUpdate = true;
  }, [opacity, lineObj]);

  return <primitive object={lineObj} />;
}

// ─── Expanded Dense Network ───────────────────────────────────────────────────
function ExpandedNetwork({ project, visible }: { project: Project | null; visible: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const obj = useMemo(() => {
    if (!project) return null;
    const rng = seededRng(project.id.charCodeAt(1) * 31);
    const N = 70;
    const base = new THREE.Color(project.color);
    const palette = [base, new THREE.Color("#00d4ff"), new THREE.Color("#ffffff"), new THREE.Color("#a855f7"), new THREE.Color("#f59e0b"), new THREE.Color("#10b981")];
    const nodePos: THREE.Vector3[] = [];
    for (let i = 0; i < N; i++) {
      const theta = rng() * Math.PI * 2;
      const phi = Math.acos(2 * rng() - 1);
      const r = 0.15 + rng() * 1.5;
      nodePos.push(new THREE.Vector3(r * Math.sin(phi) * Math.cos(theta), r * Math.sin(phi) * Math.sin(theta), r * Math.cos(phi)));
    }
    const posArr: number[] = [], colArr: number[] = [];
    for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) {
      if (nodePos[i].distanceTo(nodePos[j]) < 0.85 && rng() > 0.3) {
        posArr.push(nodePos[i].x, nodePos[i].y, nodePos[i].z, nodePos[j].x, nodePos[j].y, nodePos[j].z);
        const c = palette[Math.floor(rng() * palette.length)];
        colArr.push(c.r, c.g, c.b, c.r, c.g, c.b);
      }
    }
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(posArr), 3));
    lineGeo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(colArr), 3));
    const lines = new THREE.LineSegments(lineGeo, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.8 }));

    // Node spheres
    const sphereGeo = new THREE.SphereGeometry(0.04, 8, 8);
    const group = new THREE.Group();
    group.add(lines);
    nodePos.forEach((p, i) => {
      const c = palette[Math.floor(rng() * palette.length)].clone().lerp(new THREE.Color("#fff"), rng() * 0.4);
      const mesh = new THREE.Mesh(sphereGeo, new THREE.MeshBasicMaterial({ color: c }));
      mesh.position.copy(p);
      group.add(mesh);
    });
    return group;
  }, [project]);

  useFrame((_, delta) => {
    if (groupRef.current && visible) groupRef.current.rotation.y += delta * 0.2;
  });

  if (!obj) return null;
  return (
    <group ref={groupRef} visible={visible} position={project?.pos ?? [0, 0, 0]}>
      <primitive object={obj} />
    </group>
  );
}

// ─── Project Node ─────────────────────────────────────────────────────────────
function ProjectNode({ project, selected, hovered, onSelect, onHover }: {
  project: Project; selected: Project | null; hovered: string | null;
  onSelect: (p: Project | null) => void; onHover: (id: string | null) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const isSel = selected?.id === project.id;
  const isHov = hovered === project.id;
  const isDimmed = !!(selected && !isSel);
  const color = useMemo(() => new THREE.Color(project.color), [project.color]);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.elapsedTime;
    const s = isSel ? 1.6 + Math.sin(t * 2.5) * 0.12 : isHov ? 1.35 : isDimmed ? 0.5 : 1.0;
    meshRef.current.scale.setScalar(s);
    if (glowRef.current) {
      glowRef.current.scale.setScalar(s * 3);
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity =
        isSel ? 0.5 + Math.sin(t * 2.5) * 0.15 : isHov ? 0.35 : isDimmed ? 0.02 : 0.22;
    }
    const mat = meshRef.current.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = isSel ? 5 : isHov ? 3.5 : isDimmed ? 0.3 : 2.5;
    mat.opacity = isDimmed ? 0.15 : 1;
  });

  return (
    <group position={project.pos}>
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.22} depthWrite={false} />
      </mesh>
      <mesh ref={meshRef}
        onClick={e => { e.stopPropagation(); onSelect(isSel ? null : project); }}
        onPointerOver={e => { e.stopPropagation(); onHover(project.id); }}
        onPointerOut={() => onHover(null)}
      >
        <sphereGeometry args={[0.13, 24, 24]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2.5} roughness={0.1} metalness={0.8} transparent />
      </mesh>
    </group>
  );
}

// ─── Camera Controller ────────────────────────────────────────────────────────
function CameraController({ selected, controlsRef }: { selected: Project | null; controlsRef: React.RefObject<any> }) {
  const targetPos = useRef(new THREE.Vector3(0, 0, 4.5));
  const targetLook = useRef(new THREE.Vector3(0, 0, 0));
  const camRef = useRef<THREE.PerspectiveCamera | null>(null);

  useEffect(() => {
    if (selected) {
      const p = new THREE.Vector3(...selected.pos);
      targetPos.current.set(p.x * 2, p.y * 2, p.z * 2 + 2);
      targetLook.current.copy(p);
      if (controlsRef.current) controlsRef.current.enabled = false;
    } else {
      targetPos.current.set(0, 0, 4.5);
      targetLook.current.set(0, 0, 0);
      if (controlsRef.current) controlsRef.current.enabled = true;
    }
  }, [selected, controlsRef]);

  useFrame(({ camera }, delta) => {
    camera.position.lerp(targetPos.current, delta * 3);
    if (controlsRef.current) {
      controlsRef.current.target.lerp(targetLook.current, delta * 3);
    }
  });

  return null;
}

// ─── Brain Group ──────────────────────────────────────────────────────────────
function BrainGroup({ selected, hovered, onSelect, onHover }: {
  selected: Project | null; hovered: string | null;
  onSelect: (p: Project | null) => void; onHover: (id: string | null) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (groupRef.current && !selected) groupRef.current.rotation.y += delta * 0.1;
  });

  const fiberOpacity = selected ? 0.04 : 0.9;
  const lobeOpacity = selected ? 0.15 : 1;

  return (
    <group ref={groupRef}>
      <BrainLobe position={[-0.55, 0, 0]} opacity={lobeOpacity} />
      <BrainLobe position={[0.55, 0, 0]} opacity={lobeOpacity} />
      <BrainFibers opacity={fiberOpacity} />
      <ExpandedNetwork project={selected} visible={!!selected} />
      {PROJECTS.map(p => (
        <ProjectNode key={p.id} project={p} selected={selected} hovered={hovered} onSelect={onSelect} onHover={onHover} />
      ))}
    </group>
  );
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────
function DetailPanel({ project, onClose }: { project: Project; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 60, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 280, damping: 26 }}
      style={{
        position: "absolute", top: "50%", right: "2rem",
        transform: "translateY(-50%)", width: "300px",
        background: "rgba(2,6,20,0.92)", backdropFilter: "blur(40px)",
        border: `1px solid ${project.color}35`, borderRadius: "14px",
        padding: "1.5rem", zIndex: 100,
        boxShadow: `0 0 80px ${project.color}22, 0 30px 80px rgba(0,0,0,0.95)`,
        pointerEvents: "all",
      }}
    >
      {([[0,0],[0,1],[1,0],[1,1]] as [number,number][]).map(([r,c], i) => (
        <div key={i} style={{
          position: "absolute",
          top: r===0?"8px":"auto", bottom: r===1?"8px":"auto",
          left: c===0?"8px":"auto", right: c===1?"8px":"auto",
          width: "14px", height: "14px",
          borderTop: r===0?`1.5px solid ${project.color}55`:"none",
          borderBottom: r===1?`1.5px solid ${project.color}55`:"none",
          borderLeft: c===0?`1.5px solid ${project.color}55`:"none",
          borderRight: c===1?`1.5px solid ${project.color}55`:"none",
        }} />
      ))}
      <div style={{ position: "absolute", top: 0, left: "20%", right: "20%", height: "1px", background: `linear-gradient(to right,transparent,${project.color}70,transparent)` }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
        <div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.5rem", color: project.color, letterSpacing: "0.2em", marginBottom: "0.3rem" }}>◈ {project.subtitle}</div>
          <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: "1.15rem", color: "#fff", margin: 0 }}>{project.title}</h3>
        </div>
        <button onClick={onClose} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.3)", width: "26px", height: "26px", borderRadius: "6px", cursor: "pointer", fontSize: "0.65rem", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>✕</button>
      </div>
      <div style={{ height: "1px", background: `linear-gradient(to right,${project.color}30,transparent)`, marginBottom: "0.85rem" }} />
      <p style={{ fontFamily: "'Inter',sans-serif", fontSize: "0.73rem", color: "rgba(255,255,255,0.45)", lineHeight: 1.75, marginBottom: "1rem" }}>{project.desc}</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "0.35rem", marginBottom: "1rem" }}>
        {project.stats.map(([v,l]) => (
          <div key={l} style={{ border: `1px solid ${project.color}20`, background: `${project.color}0a`, padding: "0.5rem 0.2rem", textAlign: "center", borderRadius: "7px" }}>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: "0.78rem", color: project.color }}>{v}</div>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.42rem", color: "rgba(255,255,255,0.2)", letterSpacing: "0.08em", textTransform: "uppercase", marginTop: "2px" }}>{l}</div>
          </div>
        ))}
      </div>
      <div style={{ marginBottom: "1.1rem" }}>
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.48rem", color: "rgba(255,255,255,0.15)", letterSpacing: "0.2em", marginBottom: "0.4rem" }}>TECH STACK</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem" }}>
          {project.tech.map(t => (
            <span key={t} style={{ border: `1px solid ${project.color}28`, color: project.color, padding: "0.18rem 0.45rem", fontSize: "0.55rem", fontFamily: "'JetBrains Mono',monospace", borderRadius: "4px", background: `${project.color}0a` }}>{t}</span>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <a href={project.github} target="_blank" rel="noopener noreferrer" style={{ flex: 1, background: `${project.color}22`, color: project.color, border: `1px solid ${project.color}45`, padding: "0.55rem", fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: "0.65rem", letterSpacing: "0.06em", borderRadius: "7px", textDecoration: "none", textAlign: "center", display: "block" }}>GitHub →</a>
        <button style={{ flex: 1, background: "transparent", color: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.07)", padding: "0.55rem", fontFamily: "'JetBrains Mono',monospace", fontSize: "0.65rem", borderRadius: "7px", cursor: "pointer" }}>Live Demo</button>
      </div>
    </motion.div>
  );
}

// ─── Project List Sidebar ─────────────────────────────────────────────────────
function ProjectList({ selected, onSelect }: { selected: Project | null; onSelect: (p: Project | null) => void }) {
  return (
    <div style={{ position: "absolute", left: "2rem", top: "50%", transform: "translateY(-50%)", zIndex: 20, display: "flex", flexDirection: "column", gap: "0.6rem" }}>
      {PROJECTS.map(p => {
        const isSel = selected?.id === p.id;
        return (
          <button key={p.id} onClick={() => onSelect(isSel ? null : p)} style={{
            background: isSel ? `${p.color}18` : "transparent",
            border: `1px solid ${isSel ? p.color+"50" : "rgba(255,255,255,0.06)"}`,
            borderRadius: "8px", padding: "0.5rem 0.75rem", cursor: "pointer", textAlign: "left", transition: "all 0.2s ease",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
              <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: p.color, boxShadow: `0 0 8px ${p.color}`, flexShrink: 0 }} />
              <div>
                <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: "0.7rem", color: isSel ? p.color : "rgba(255,255,255,0.65)", whiteSpace: "nowrap" }}>{p.title}</div>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.45rem", color: "rgba(255,255,255,0.2)", marginTop: "1px" }}>{p.subtitle}</div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function ProjectsSection() {
  const [selected, setSelected] = useState<Project | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const controlsRef = useRef<any>(null);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") setSelected(null); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const handleSelect = useCallback((p: Project | null) => setSelected(p), []);
  const handleHover = useCallback((id: string | null) => setHovered(id), []);

  return (
    <section id="projects" style={{ width: "100%", height: "100vh", background: "#000", position: "relative", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ position: "absolute", top: "2rem", left: "50%", transform: "translateX(-50%)", zIndex: 20, textAlign: "center", pointerEvents: "none" }}>
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.55rem", color: "rgba(0,212,255,0.4)", letterSpacing: "0.25em" }}>SYS.05 · PROJECT MATRIX</div>
        <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: "2rem", color: "#fff", letterSpacing: "-0.03em", marginTop: "0.2rem" }}>Projects</div>
        <AnimatePresence>
          {selected && (
            <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
              style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.52rem", color: "rgba(255,255,255,0.22)", marginTop: "0.3rem", letterSpacing: "0.12em" }}>
              NEURAL NETWORK ACTIVE · ESC TO COLLAPSE
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Canvas */}
      <Canvas camera={{ position: [0, 0, 4.5], fov: 55 }} style={{ position: "absolute", inset: 0 }} gl={{ antialias: true }}>
        <color attach="background" args={["#000000"]} />
        <Suspense fallback={null}>
          <Stars radius={100} depth={60} count={5000} factor={3} saturation={0} fade speed={0.3} />
          <ambientLight intensity={0.5} />
          <pointLight position={[4, 4, 4]} intensity={10} color="#00eeff" />
          <pointLight position={[-4, -4, -4]} intensity={9} color="#cc44ff" />
          <pointLight position={[0, 4, -4]} intensity={8} color="#00ff99" />
          <pointLight position={[0, -4, 4]} intensity={7} color="#ff9900" />
          <pointLight position={[4, -4, 4]} intensity={5} color="#ff3344" />
          <BrainGroup selected={selected} hovered={hovered} onSelect={handleSelect} onHover={handleHover} />
          <CameraController selected={selected} controlsRef={controlsRef} />
          <OrbitControls ref={controlsRef} enableZoom minDistance={2.5} maxDistance={8} enablePan={false} enableDamping dampingFactor={0.05} />
        </Suspense>
      </Canvas>

      {/* Sidebar */}
      <ProjectList selected={selected} onSelect={handleSelect} />

      {/* Detail panel */}
      <AnimatePresence>
        {selected && <DetailPanel project={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>

      {/* Hint */}
      <AnimatePresence>
        {!selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "absolute", bottom: "2.5rem", left: "50%", transform: "translateX(-50%)", zIndex: 20, pointerEvents: "none", textAlign: "center" }}>
            <div style={{ color: "rgba(255,255,255,0.15)", fontSize: "0.58rem", fontFamily: "'JetBrains Mono',monospace", letterSpacing: "0.2em" }}>
              DRAG TO SPIN · SCROLL TO ZOOM · CLICK A NODE TO EXPLORE
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
