// 3D Brain Neural Network Projects Section
// - Default: brain-shaped blob of colorful tangled axon fibers, slowly rotating
// - Project nodes glow inside the brain
// - Click a node → camera zooms in → dense colorful 3D neural network expands
// - Glassmorphism detail panel slides in
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Stars, Float } from "@react-three/drei";
import { useRef, useState, useEffect, Suspense, useMemo, useCallback } from "react";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";

// ─── Data ────────────────────────────────────────────────────────────────────
const PROJECTS = [
  {
    id: "p1",
    title: "MoodTunes AI",
    subtitle: "ML · Music Recommender",
    desc: "LightGBM trained on 114K+ Spotify tracks. F1 score 0.5652 on 5-class mood classification with real-time recommendation API.",
    tech: ["Python", "LightGBM", "Spotify API", "scikit-learn", "pandas"],
    stats: [["0.5652", "F1 Score"], ["114K+", "Tracks"], ["5", "Moods"]] as [string, string][],
    color: "#00d4ff",
    position: new THREE.Vector3(-1.2, 0.5, 0.3),
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
    position: new THREE.Vector3(1.1, 0.2, 0.5),
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
    position: new THREE.Vector3(-0.3, -0.8, 0.8),
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
    position: new THREE.Vector3(0.8, -0.6, -0.4),
    github: "https://github.com/HeinHtet-Phyo",
  },
];

type Project = typeof PROJECTS[0];

// ─── Utility: point on brain-shaped ellipsoid ────────────────────────────────
function brainPoint(rng: () => number): THREE.Vector3 {
  // Roughly brain-shaped: wider in X, slightly flattened in Z
  const theta = rng() * Math.PI * 2;
  const phi = Math.acos(2 * rng() - 1);
  const r = 0.85 + rng() * 0.15;
  const x = r * 1.35 * Math.sin(phi) * Math.cos(theta);
  const y = r * 1.0 * Math.sin(phi) * Math.sin(theta);
  const z = r * 0.75 * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

// Seeded pseudo-random
function seededRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// ─── Brain Axon Fibers ───────────────────────────────────────────────────────
function BrainFibers({ opacity }: { opacity: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const linesRef = useRef<THREE.LineSegments | null>(null);

  const { positions, colors } = useMemo(() => {
    const rng = seededRng(42);
    const FIBER_COUNT = 220;
    const SEGMENTS = 18;
    const posArr: number[] = [];
    const colArr: number[] = [];

    const palette = [
      new THREE.Color("#00d4ff"),
      new THREE.Color("#4488ff"),
      new THREE.Color("#a855f7"),
      new THREE.Color("#10b981"),
      new THREE.Color("#f59e0b"),
      new THREE.Color("#ff6b6b"),
      new THREE.Color("#00ffcc"),
      new THREE.Color("#7c3aed"),
    ];

    for (let f = 0; f < FIBER_COUNT; f++) {
      const start = brainPoint(rng);
      const end = brainPoint(rng);
      const ctrl1 = start.clone().lerp(end, 0.33).add(new THREE.Vector3(
        (rng() - 0.5) * 1.2,
        (rng() - 0.5) * 1.2,
        (rng() - 0.5) * 1.2,
      ));
      const ctrl2 = start.clone().lerp(end, 0.66).add(new THREE.Vector3(
        (rng() - 0.5) * 1.2,
        (rng() - 0.5) * 1.2,
        (rng() - 0.5) * 1.2,
      ));

      const curve = new THREE.CubicBezierCurve3(start, ctrl1, ctrl2, end);
      const pts = curve.getPoints(SEGMENTS);
      const col = palette[Math.floor(rng() * palette.length)];
      const colEnd = palette[Math.floor(rng() * palette.length)];

      for (let i = 0; i < pts.length - 1; i++) {
        posArr.push(pts[i].x, pts[i].y, pts[i].z);
        posArr.push(pts[i + 1].x, pts[i + 1].y, pts[i + 1].z);
        const t = i / (pts.length - 1);
        const c = col.clone().lerp(colEnd, t);
        colArr.push(c.r, c.g, c.b);
        colArr.push(c.r, c.g, c.b);
      }
    }
    return { positions: new Float32Array(posArr), colors: new Float32Array(colArr) };
  }, []);

  useEffect(() => {
    if (!linesRef.current) return;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    linesRef.current.geometry = geo;
  }, [positions, colors]);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.08;
      groupRef.current.rotation.x += delta * 0.02;
    }
  });

  return (
    <group ref={groupRef}>
      <lineSegments ref={linesRef}>
        <bufferGeometry />
        <lineBasicMaterial vertexColors transparent opacity={opacity} />
      </lineSegments>
    </group>
  );
}

// ─── Dense Expanded Network (shown when a project is selected) ───────────────
function ExpandedNetwork({ project, visible }: { project: Project | null; visible: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const linesRef = useRef<THREE.LineSegments | null>(null);
  const nodesRef = useRef<THREE.InstancedMesh | null>(null);

  const { positions, colors, nodePositions } = useMemo(() => {
    if (!project) return { positions: new Float32Array(0), colors: new Float32Array(0), nodePositions: [] };
    const rng = seededRng(project.id.charCodeAt(1) * 17);
    const NODE_COUNT = 60;
    const nodePos: THREE.Vector3[] = [];
    const baseColor = new THREE.Color(project.color);

    for (let i = 0; i < NODE_COUNT; i++) {
      const theta = rng() * Math.PI * 2;
      const phi = Math.acos(2 * rng() - 1);
      const r = 0.3 + rng() * 1.4;
      nodePos.push(new THREE.Vector3(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi),
      ));
    }

    const posArr: number[] = [];
    const colArr: number[] = [];
    const palette = [
      baseColor,
      new THREE.Color("#00d4ff"),
      new THREE.Color("#ffffff"),
      new THREE.Color("#a855f7"),
      new THREE.Color("#f59e0b"),
    ];

    // Connect nearby nodes
    for (let i = 0; i < NODE_COUNT; i++) {
      for (let j = i + 1; j < NODE_COUNT; j++) {
        const dist = nodePos[i].distanceTo(nodePos[j]);
        if (dist < 0.85 && rng() > 0.3) {
          posArr.push(nodePos[i].x, nodePos[i].y, nodePos[i].z);
          posArr.push(nodePos[j].x, nodePos[j].y, nodePos[j].z);
          const c = palette[Math.floor(rng() * palette.length)];
          colArr.push(c.r, c.g, c.b);
          colArr.push(c.r, c.g, c.b);
        }
      }
    }

    return {
      positions: new Float32Array(posArr),
      colors: new Float32Array(colArr),
      nodePositions: nodePos,
    };
  }, [project]);

  useEffect(() => {
    if (!linesRef.current || !project) return;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    linesRef.current.geometry = geo;
  }, [positions, colors, project]);

  useEffect(() => {
    if (!nodesRef.current || !project) return;
    const dummy = new THREE.Object3D();
    const baseColor = new THREE.Color(project.color);
    nodePositions.forEach((pos, i) => {
      dummy.position.copy(pos);
      dummy.scale.setScalar(0.04 + Math.random() * 0.06);
      dummy.updateMatrix();
      nodesRef.current!.setMatrixAt(i, dummy.matrix);
      nodesRef.current!.setColorAt(i, baseColor.clone().lerp(new THREE.Color("#ffffff"), Math.random() * 0.5));
    });
    nodesRef.current.instanceMatrix.needsUpdate = true;
    if (nodesRef.current.instanceColor) nodesRef.current.instanceColor.needsUpdate = true;
  }, [nodePositions, project]);

  useFrame((_, delta) => {
    if (groupRef.current && visible) {
      groupRef.current.rotation.y += delta * 0.15;
    }
  });

  if (!project) return null;

  return (
    <group ref={groupRef} visible={visible}>
      <lineSegments ref={linesRef}>
        <bufferGeometry />
        <lineBasicMaterial vertexColors transparent opacity={0.7} />
      </lineSegments>
      <instancedMesh ref={nodesRef} args={[undefined, undefined, nodePositions.length]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial vertexColors />
      </instancedMesh>
    </group>
  );
}

// ─── Project Node Spheres ────────────────────────────────────────────────────
function ProjectNode({
  project,
  selected,
  hovered,
  onSelect,
  onHover,
}: {
  project: Project;
  selected: Project | null;
  hovered: string | null;
  onSelect: (p: Project | null) => void;
  onHover: (id: string | null) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const isSel = selected?.id === project.id;
  const isHov = hovered === project.id;
  const isDimmed = selected && !isSel;
  const color = new THREE.Color(project.color);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;
    const scale = isSel
      ? 1.4 + Math.sin(t * 2) * 0.08
      : isHov ? 1.25 : isDimmed ? 0.7 : 1.0;
    meshRef.current.scale.setScalar(scale);
    if (glowRef.current) {
      glowRef.current.scale.setScalar(scale * 2.2);
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity =
        isSel ? 0.35 + Math.sin(t * 2) * 0.1 : isHov ? 0.25 : isDimmed ? 0.02 : 0.12;
    }
  });

  return (
    <group position={project.position}>
      {/* Glow sphere */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.12} depthWrite={false} />
      </mesh>
      {/* Main node */}
      <mesh
        ref={meshRef}
        onClick={(e) => { e.stopPropagation(); onSelect(isSel ? null : project); }}
        onPointerOver={(e) => { e.stopPropagation(); onHover(project.id); }}
        onPointerOut={() => onHover(null)}
      >
        <sphereGeometry args={[0.12, 24, 24]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isSel ? 3 : isHov ? 2 : isDimmed ? 0.2 : 1.2}
          roughness={0.1}
          metalness={0.8}
          transparent
          opacity={isDimmed ? 0.25 : 1}
        />
      </mesh>
    </group>
  );
}

// ─── Camera Controller ───────────────────────────────────────────────────────
function CameraController({ selected }: { selected: Project | null }) {
  const { camera } = useThree();
  const targetPos = useRef(new THREE.Vector3(0, 0, 5));
  const targetLook = useRef(new THREE.Vector3(0, 0, 0));

  useEffect(() => {
    if (selected) {
      const p = selected.position;
      targetPos.current.set(p.x * 1.5, p.y * 1.5, p.z * 1.5 + 2.5);
      targetLook.current.copy(p);
    } else {
      targetPos.current.set(0, 0, 5);
      targetLook.current.set(0, 0, 0);
    }
  }, [selected]);

  useFrame((_, delta) => {
    camera.position.lerp(targetPos.current, delta * 2.5);
    const currentLook = new THREE.Vector3();
    camera.getWorldDirection(currentLook);
    const desiredLook = targetLook.current.clone().sub(camera.position).normalize();
    const blended = currentLook.lerp(desiredLook, delta * 2.5);
    camera.lookAt(camera.position.clone().add(blended));
  });

  return null;
}

// ─── Scene ───────────────────────────────────────────────────────────────────
function BrainScene({
  selected,
  hovered,
  onSelect,
  onHover,
}: {
  selected: Project | null;
  hovered: string | null;
  onSelect: (p: Project | null) => void;
  onHover: (id: string | null) => void;
}) {
  const showExpanded = !!selected;

  return (
    <>
      <CameraController selected={selected} />
      <Stars radius={80} depth={50} count={3000} factor={3} saturation={0} fade speed={0.5} />
      <ambientLight intensity={0.3} />
      <pointLight position={[5, 5, 5]} intensity={1.5} color="#00d4ff" />
      <pointLight position={[-5, -5, -5]} intensity={1} color="#a855f7" />

      {/* Brain fibers — fade out when a project is selected */}
      <BrainFibers opacity={selected ? 0.08 : 0.75} />

      {/* Expanded network — shown when selected */}
      <ExpandedNetwork project={selected} visible={showExpanded} />

      {/* Project nodes */}
      {PROJECTS.map((p) => (
        <ProjectNode
          key={p.id}
          project={p}
          selected={selected}
          hovered={hovered}
          onSelect={onSelect}
          onHover={onHover}
        />
      ))}

      {/* Click background to deselect */}
      <mesh
        position={[0, 0, -10]}
        onClick={() => onSelect(null)}
        visible={false}
      >
        <planeGeometry args={[200, 200]} />
        <meshBasicMaterial />
      </mesh>
    </>
  );
}

// ─── Detail Panel ────────────────────────────────────────────────────────────
function DetailPanel({ project, onClose }: { project: Project; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 60, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 280, damping: 26 }}
      style={{
        position: "absolute",
        top: "50%",
        right: "2rem",
        transform: "translateY(-50%)",
        width: "300px",
        background: "rgba(2,6,20,0.88)",
        backdropFilter: "blur(40px)",
        WebkitBackdropFilter: "blur(40px)",
        border: `1px solid ${project.color}35`,
        borderRadius: "14px",
        padding: "1.5rem",
        zIndex: 100,
        boxShadow: `0 0 80px ${project.color}20, 0 30px 80px rgba(0,0,0,0.95)`,
        pointerEvents: "all",
      }}
    >
      {/* Corner brackets */}
      {([[0,0],[0,1],[1,0],[1,1]] as [number,number][]).map(([r,c], i) => (
        <div key={i} style={{
          position: "absolute",
          top: r === 0 ? "8px" : "auto", bottom: r === 1 ? "8px" : "auto",
          left: c === 0 ? "8px" : "auto", right: c === 1 ? "8px" : "auto",
          width: "14px", height: "14px",
          borderTop: r === 0 ? `1.5px solid ${project.color}55` : "none",
          borderBottom: r === 1 ? `1.5px solid ${project.color}55` : "none",
          borderLeft: c === 0 ? `1.5px solid ${project.color}55` : "none",
          borderRight: c === 1 ? `1.5px solid ${project.color}55` : "none",
        }} />
      ))}
      <div style={{ position: "absolute", top: 0, left: "20%", right: "20%", height: "1px", background: `linear-gradient(to right, transparent, ${project.color}70, transparent)` }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
        <div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.5rem", color: project.color, letterSpacing: "0.2em", marginBottom: "0.3rem" }}>◈ {project.subtitle}</div>
          <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: "1.15rem", color: "#fff", margin: 0 }}>{project.title}</h3>
        </div>
        <button
          onClick={onClose}
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.3)", width: "26px", height: "26px", borderRadius: "6px", cursor: "pointer", fontSize: "0.65rem", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
        >✕</button>
      </div>

      <div style={{ height: "1px", background: `linear-gradient(to right, ${project.color}30, transparent)`, marginBottom: "0.85rem" }} />
      <p style={{ fontFamily: "'Inter',sans-serif", fontSize: "0.73rem", color: "rgba(255,255,255,0.45)", lineHeight: 1.75, marginBottom: "1rem" }}>{project.desc}</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "0.35rem", marginBottom: "1rem" }}>
        {project.stats.map(([v, l]) => (
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
        <a
          href={project.github}
          target="_blank"
          rel="noopener noreferrer"
          style={{ flex: 1, background: `${project.color}22`, color: project.color, border: `1px solid ${project.color}45`, padding: "0.55rem", fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: "0.65rem", letterSpacing: "0.06em", borderRadius: "7px", textDecoration: "none", textAlign: "center", display: "block" }}
        >GitHub →</a>
        <button style={{ flex: 1, background: "transparent", color: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.07)", padding: "0.55rem", fontFamily: "'JetBrains Mono',monospace", fontSize: "0.65rem", borderRadius: "7px", cursor: "pointer" }}>Live Demo</button>
      </div>
    </motion.div>
  );
}

// ─── Project List Sidebar ────────────────────────────────────────────────────
function ProjectList({ selected, onSelect }: { selected: Project | null; onSelect: (p: Project | null) => void }) {
  return (
    <div style={{
      position: "absolute",
      left: "2rem",
      top: "50%",
      transform: "translateY(-50%)",
      zIndex: 20,
      display: "flex",
      flexDirection: "column",
      gap: "0.6rem",
    }}>
      {PROJECTS.map((p) => {
        const isSel = selected?.id === p.id;
        return (
          <button
            key={p.id}
            onClick={() => onSelect(isSel ? null : p)}
            style={{
              background: isSel ? `${p.color}18` : "transparent",
              border: `1px solid ${isSel ? p.color + "50" : "rgba(255,255,255,0.06)"}`,
              borderRadius: "8px",
              padding: "0.5rem 0.75rem",
              cursor: "pointer",
              textAlign: "left",
              transition: "all 0.2s ease",
            }}
          >
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

// ─── Main Export ─────────────────────────────────────────────────────────────
export default function ProjectsSection() {
  const [selected, setSelected] = useState<Project | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setSelected(null); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleSelect = useCallback((p: Project | null) => setSelected(p), []);
  const handleHover = useCallback((id: string | null) => setHovered(id), []);

  return (
    <section
      id="projects"
      style={{ width: "100%", height: "100vh", background: "#000", position: "relative", overflow: "hidden" }}
    >
      {/* Section header */}
      <div style={{
        position: "absolute", top: "2rem", left: "50%", transform: "translateX(-50%)",
        zIndex: 20, textAlign: "center", pointerEvents: "none",
      }}>
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.55rem", color: "rgba(0,212,255,0.4)", letterSpacing: "0.25em" }}>SYS.05 · PROJECT MATRIX</div>
        <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: "2rem", color: "#fff", letterSpacing: "-0.03em", marginTop: "0.2rem" }}>Projects</div>
        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
              style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.55rem", color: "rgba(255,255,255,0.25)", marginTop: "0.3rem", letterSpacing: "0.12em" }}
            >
              NEURAL NETWORK ACTIVE · ESC TO COLLAPSE
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Three.js Canvas */}
      <Canvas
        camera={{ position: [0, 0, 5], fov: 60 }}
        style={{ position: "absolute", inset: 0 }}
        gl={{ antialias: true, alpha: false }}
      >
        <color attach="background" args={["#000000"]} />
        <Suspense fallback={null}>
          <BrainScene
            selected={selected}
            hovered={hovered}
            onSelect={handleSelect}
            onHover={handleHover}
          />
        </Suspense>
      </Canvas>

      {/* Project list sidebar */}
      <ProjectList selected={selected} onSelect={handleSelect} />

      {/* Detail panel */}
      <AnimatePresence>
        {selected && <DetailPanel project={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>

      {/* Bottom hint */}
      <AnimatePresence>
        {!selected && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "absolute", bottom: "2.5rem", left: "50%", transform: "translateX(-50%)", zIndex: 20, pointerEvents: "none", textAlign: "center" }}
          >
            <div style={{ color: "rgba(255,255,255,0.15)", fontSize: "0.58rem", fontFamily: "'JetBrains Mono',monospace", letterSpacing: "0.2em" }}>
              CLICK ANY NODE TO EXPLORE · DRAG TO ORBIT
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
