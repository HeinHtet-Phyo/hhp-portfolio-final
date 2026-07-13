/**
 * BrainProjectsSection — 3D Brain Projects HUD
 *
 * Design aligns with portfolio:
 * - Transparent background (inherits portfolio dark bg)
 * - White/silver brain (no teal/cyan)
 * - Section label matches "01 — About" pattern
 * - Project popup matches portfolio card style
 * - Glowing circular platform (white/grey)
 * - HUD corner brackets (white, low opacity)
 * - 4 white hotspot dots on brain surface
 * - Click dot → camera zoom → popup
 */

import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { Suspense, useRef, useState, useEffect, useMemo, useCallback } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { motion, AnimatePresence } from "framer-motion";

// Force full page reload on HMR to prevent R3F reconciler crash
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
    github: "https://github.com/HeinHtet-Phyo/moodtunes-ai-group3",
    code: "MOOD_AI_v2.3",
  },
  {
    id: 1,
    title: "IT Career Planner",
    subtitle: "XGBoost · Career AI",
    desc: "XGBoost classifier at 99.75% accuracy across 6,000 samples. Maps SFIA framework skills to career paths with gap analysis.",
    tech: ["Python", "XGBoost", "SFIA", "scikit-learn", "Streamlit"],
    stats: [["99.75%", "Accuracy"], ["6,000", "Samples"], ["SFIA", "Framework"]] as [string, string][],
    github: "https://github.com/HeinHtet-Phyo/it-career-planner",
    code: "CAREER_XGB_v1.1",
  },
  {
    id: 2,
    title: "CityPulse",
    subtitle: "Urban Data Analytics",
    desc: "Interactive urban analytics platform aggregating transportation, demographic, and infrastructure data into city-level intelligence.",
    tech: ["Python", "Pandas", "Plotly", "GeoPandas", "Streamlit"],
    stats: [["City", "Scale"], ["Real-time", "Data"], ["Interactive", "Maps"]] as [string, string][],
    github: "https://github.com/HeinHtet-Phyo",
    code: "CITY_PULSE_v0.9",
  },
  {
    id: 3,
    title: "PreventPath",
    subtitle: "Health AI · Prevention",
    desc: "ML pipeline predicting health risk factors from patient data, generating personalised prevention plans with risk scoring.",
    tech: ["Python", "scikit-learn", "Flask", "Healthcare ML", "Risk Scoring"],
    stats: [["AI", "Powered"], ["Personal", "Plans"], ["Risk", "Scoring"]] as [string, string][],
    github: "https://github.com/HeinHtet-Phyo",
    code: "PREV_PATH_v1.0",
  },
];
type Project = (typeof PROJECTS)[0];

// ─── Colours (B&W palette) ────────────────────────────────────────────────────
const WHITE      = "#ffffff";
const SILVER     = "#c8c8c8";
const WHITE_DIM  = "#888888";
const WHITE_GLOW = "#e0e0e0";

// ─── Project hotspot positions — on brain surface ─────────────────────────────
const PROJECT_HOTSPOTS: [number, number, number][] = [
  [-0.08,  0.20,  0.24],  // 0: MoodTunes — frontal lobe
  [ 0.12,  0.14,  0.22],  // 1: IT Career — parietal
  [-0.04,  0.00,  0.26],  // 2: CityPulse — temporal
  [ 0.08, -0.08,  0.22],  // 3: PreventPath — occipital
];

// ─── Hotspot Dot (3D) ─────────────────────────────────────────────────────────
function HotspotDot({ position, index, active, onSelect }: {
  position: [number, number, number];
  index: number;
  active: boolean;
  onSelect: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (meshRef.current) {
      const s = active ? 1.5 : (1.0 + 0.2 * Math.sin(t * 2.5 + index));
      meshRef.current.scale.setScalar(s);
    }
    if (ringRef.current) {
      const rs = 1.0 + 0.5 * Math.sin(t * 2.0 + index * 1.2);
      ringRef.current.scale.setScalar(rs);
      (ringRef.current.material as THREE.MeshBasicMaterial).opacity =
        active ? 0.9 : (0.25 + 0.25 * Math.sin(t * 2.0 + index));
    }
  });

  return (
    <group position={position}>
      {/* Outer pulsing ring */}
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.022, 0.004, 8, 32]} />
        <meshBasicMaterial color={WHITE} transparent opacity={0.4} />
      </mesh>
      {/* Core dot — clickable */}
      <mesh ref={meshRef} onClick={(e) => { e.stopPropagation(); onSelect(); }}>
        <sphereGeometry args={[0.013, 16, 16]} />
        <meshBasicMaterial color={active ? WHITE : SILVER} />
      </mesh>
      {/* Glow halo — additive */}
      <mesh>
        <circleGeometry args={[0.018, 16]} />
        <meshBasicMaterial
          color={WHITE}
          transparent
          opacity={active ? 0.45 : 0.12}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      {/* HTML label */}
      <Html
        position={[0.04, 0.025, 0]}
        style={{ pointerEvents: "none", userSelect: "none" }}
        distanceFactor={1.2}
      >
        <div style={{
          background: active ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.65)",
          border: `1px solid ${active ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.2)"}`,
          borderRadius: 3,
          padding: "3px 7px",
          fontSize: 9,
          fontFamily: "JetBrains Mono, monospace",
          color: active ? "#ffffff" : "rgba(255,255,255,0.6)",
          whiteSpace: "nowrap",
          backdropFilter: "blur(4px)",
          boxShadow: active ? "0 0 12px rgba(255,255,255,0.3)" : "none",
          transition: "all 0.2s ease",
          letterSpacing: "0.05em",
        }}>
          {PROJECTS[index].title}
        </div>
      </Html>
    </group>
  );
}

// ─── Connecting lines between hotspots ───────────────────────────────────────
function NeuralLines({ activeIndex }: { activeIndex: number | null }) {
  const linesRef = useRef<THREE.LineSegments>(null);

  const geometry = useMemo(() => {
    const positions: number[] = [];
    // Connect all pairs
    for (let i = 0; i < PROJECT_HOTSPOTS.length; i++) {
      for (let j = i + 1; j < PROJECT_HOTSPOTS.length; j++) {
        positions.push(...PROJECT_HOTSPOTS[i], ...PROJECT_HOTSPOTS[j]);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    return geo;
  }, []);

  useFrame(({ clock }) => {
    if (linesRef.current) {
      const mat = linesRef.current.material as THREE.LineBasicMaterial;
      mat.opacity = 0.12 + 0.06 * Math.sin(clock.elapsedTime * 0.8);
    }
  });

  return (
    <lineSegments ref={linesRef} geometry={geometry}>
      <lineBasicMaterial color={WHITE} transparent opacity={0.15} depthWrite={false} />
    </lineSegments>
  );
}

// ─── Glowing circular platform ────────────────────────────────────────────────
function Platform() {
  const groupRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (groupRef.current) {
      const t = clock.elapsedTime;
      groupRef.current.children.forEach((child, i) => {
        const mat = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
        if (mat && mat.opacity !== undefined) {
          mat.opacity = (0.06 + 0.04 * Math.sin(t * 0.7 + i * 0.5)) * (1 - i * 0.15);
        }
      });
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.72, 0]} rotation={[Math.PI / 2, 0, 0]}>
      {[0.55, 0.72, 0.90, 1.08].map((r, i) => (
        <mesh key={i}>
          <torusGeometry args={[r, 0.006 - i * 0.001, 6, 80]} />
          <meshBasicMaterial color={WHITE} transparent opacity={0.08 - i * 0.015} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

// ─── HUD corner brackets (2D overlay) ────────────────────────────────────────
function HudBrackets() {
  const size = 20;
  const thickness = 2;
  const color = "rgba(255,255,255,0.18)";
  const corners = [
    { top: 12, left: 12, rotate: "0deg" },
    { top: 12, right: 12, rotate: "90deg" },
    { bottom: 12, right: 12, rotate: "180deg" },
    { bottom: 12, left: 12, rotate: "270deg" },
  ];
  return (
    <>
      {corners.map((c, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            ...c,
            width: size,
            height: size,
            borderTop: `${thickness}px solid ${color}`,
            borderLeft: `${thickness}px solid ${color}`,
            transform: `rotate(${c.rotate})`,
            pointerEvents: "none",
          }}
        />
      ))}
    </>
  );
}

// ─── Camera controller — zoom toward active hotspot ──────────────────────────
function CameraController({ activeIndex, brainRotY }: { activeIndex: number | null; brainRotY: number }) {
  const { camera } = useThree();
  const targetPos = useRef(new THREE.Vector3(0, 0.08, 2.6));
  const targetLook = useRef(new THREE.Vector3(0, 0, 0));

  useEffect(() => {
    if (activeIndex !== null) {
      const hp = PROJECT_HOTSPOTS[activeIndex];
      // Rotate hotspot by current brain Y rotation
      const cos = Math.cos(brainRotY);
      const sin = Math.sin(brainRotY);
      const wx = hp[0] * cos + hp[2] * sin;
      const wy = hp[1];
      const wz = -hp[0] * sin + hp[2] * cos;
      targetPos.current.set(wx * 1.5, wy + 0.1, wz + 1.4);
      targetLook.current.set(wx * 0.5, wy, wz * 0.5);
    } else {
      targetPos.current.set(0, 0.08, 2.6);
      targetLook.current.set(0, 0, 0);
    }
  }, [activeIndex, brainRotY]);

  useFrame(() => {
    camera.position.lerp(targetPos.current, 0.04);
    const lookTarget = new THREE.Vector3();
    lookTarget.lerpVectors(
      new THREE.Vector3(camera.position.x, camera.position.y, camera.position.z - 2.6),
      targetLook.current,
      0.04
    );
    camera.lookAt(targetLook.current);
  });

  return null;
}

// ─── Brain mesh (white/silver holographic) ───────────────────────────────────
function BrainMesh({ activeIndex, onHotspotSelect }: {
  activeIndex: number | null;
  onHotspotSelect: (i: number) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const gltf = useLoader(GLTFLoader, "/manus-storage/BrainUVs_42a27899.glb");
  const [brainRotY, setBrainRotY] = useState(0);

  const { outerMat, innerMat } = useMemo(() => {
    const outer = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0.92, 0.92, 0.92),
      emissive: new THREE.Color(0.25, 0.25, 0.25),
      emissiveIntensity: 0.6,
      metalness: 0.4,
      roughness: 0.45,
      transparent: true,
      opacity: 0.92,
    });
    const inner = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0.4, 0.4, 0.4),
      emissive: new THREE.Color(0.08, 0.08, 0.08),
      emissiveIntensity: 0.3,
      metalness: 0.1,
      roughness: 0.8,
      transparent: true,
      opacity: 0.55,
      side: THREE.BackSide,
    });
    return { outerMat: outer, innerMat: inner };
  }, []);

  const brainMeshes = useMemo(() => {
    const meshes: THREE.Mesh[] = [];
    gltf.scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) meshes.push(child as THREE.Mesh);
    });
    return meshes;
  }, [gltf]);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    if (activeIndex === null) {
      groupRef.current.rotation.y += 0.003;
    }
    setBrainRotY(groupRef.current.rotation.y);
    const t = clock.elapsedTime;
    // Subtle emissive pulse
      outerMat.emissiveIntensity = 0.5 + 0.2 * Math.sin(t * 0.9);
  });

  return (
    <group ref={groupRef} position={[0, 0.05, 0]}>
      {/* Inner glow layer */}
      {brainMeshes.map((m, i) => (
        <mesh key={`inner-${i}`} geometry={m.geometry} material={innerMat} />
      ))}
      {/* Outer brain mesh */}
      {brainMeshes.map((m, i) => (
        <mesh key={`outer-${i}`} geometry={m.geometry} material={outerMat} />
      ))}
      {/* Neural connecting lines */}
      <NeuralLines activeIndex={activeIndex} />
      {/* Hotspot dots */}
      {PROJECT_HOTSPOTS.map((pos, i) => (
        <HotspotDot
          key={i}
          position={pos}
          index={i}
          active={activeIndex === i}
          onSelect={() => onHotspotSelect(i)}
        />
      ))}
      {/* Platform */}
      <Platform />
      {/* Camera controller */}
      <CameraController activeIndex={activeIndex} brainRotY={brainRotY} />
    </group>
  );
}

// ─── Project popup (portfolio card style) ─────────────────────────────────────
function ProjectPopup({ project, onClose, onPrev, onNext }: {
  project: Project;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 16, scale: 0.97 }}
      transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
      style={{
        position: "absolute",
        bottom: "2.5rem",
        left: "50%",
        transform: "translateX(-50%)",
        width: "min(520px, 90vw)",
        background: "rgba(8, 8, 8, 0.92)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: "6px",
        padding: "1.6rem 1.8rem",
        backdropFilter: "blur(16px)",
        zIndex: 20,
        boxShadow: "0 8px 40px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.06)",
        fontFamily: "'JetBrains Mono', monospace",
      }}
    >
      {/* Close */}
      <button
        onClick={onClose}
        style={{
          position: "absolute",
          top: "0.9rem",
          right: "1rem",
          background: "none",
          border: "none",
          color: "rgba(255,255,255,0.4)",
          cursor: "pointer",
          fontSize: "1rem",
          lineHeight: 1,
          padding: "2px 6px",
          transition: "color 0.15s",
        }}
        onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.9)")}
        onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}
      >
        ×
      </button>

      {/* Header */}
      <div style={{ marginBottom: "1rem" }}>
        <div style={{
          fontSize: "0.62rem",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.35)",
          marginBottom: "0.35rem",
        }}>
          {project.code}
        </div>
        <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#ffffff", letterSpacing: "0.02em" }}>
          {project.title}
        </div>
        <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.45)", marginTop: "0.2rem" }}>
          {project.subtitle}
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: "flex", gap: "1.2rem", marginBottom: "1rem" }}>
        {project.stats.map(([val, label], i) => (
          <div key={i} style={{ textAlign: "center" }}>
            <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#ffffff" }}>{val}</div>
            <div style={{ fontSize: "0.58rem", color: "rgba(255,255,255,0.35)", letterSpacing: "0.12em", textTransform: "uppercase" }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Description */}
      <p style={{
        fontSize: "0.75rem",
        lineHeight: 1.65,
        color: "rgba(255,255,255,0.6)",
        marginBottom: "1rem",
        fontFamily: "inherit",
      }}>
        {project.desc}
      </p>

      {/* Tech tags */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "1.2rem" }}>
        {project.tech.map((t) => (
          <span key={t} style={{
            fontSize: "0.6rem",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            padding: "3px 8px",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: "2px",
            color: "rgba(255,255,255,0.5)",
          }}>
            {t}
          </span>
        ))}
      </div>

      {/* Footer — nav + github */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button onClick={onPrev} style={navBtnStyle}>← Prev</button>
          <button onClick={onNext} style={navBtnStyle}>Next →</button>
        </div>
        <a
          href={project.github}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: "0.65rem",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "#ffffff",
            textDecoration: "none",
            border: "1px solid rgba(255,255,255,0.3)",
            padding: "5px 12px",
            borderRadius: "3px",
            transition: "background 0.15s, border-color 0.15s",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
        >
          GitHub ↗
        </a>
      </div>
    </motion.div>
  );
}

const navBtnStyle: React.CSSProperties = {
  fontSize: "0.62rem",
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "rgba(255,255,255,0.45)",
  background: "none",
  border: "1px solid rgba(255,255,255,0.1)",
  padding: "4px 10px",
  borderRadius: "3px",
  cursor: "pointer",
  fontFamily: "JetBrains Mono, monospace",
  transition: "color 0.15s, border-color 0.15s",
};

// ─── Loading fallback ─────────────────────────────────────────────────────────
function BrainLoader() {
  return (
    <Html center>
      <div style={{
        fontFamily: "JetBrains Mono, monospace",
        fontSize: "0.65rem",
        letterSpacing: "0.2em",
        color: "rgba(255,255,255,0.35)",
        textTransform: "uppercase",
      }}>
        Loading neural mesh...
      </div>
    </Html>
  );
}

// ─── Main section ─────────────────────────────────────────────────────────────
export default function BrainProjectsSection() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [inView, setInView] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold: 0.06 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const handleSelect = useCallback((i: number) => {
    setActiveIndex(prev => (prev === i ? null : i));
  }, []);

  const handleClose = useCallback(() => setActiveIndex(null), []);

  const handlePrev = useCallback(() => {
    setActiveIndex(prev => prev === null ? 0 : (prev - 1 + PROJECTS.length) % PROJECTS.length);
  }, []);

  const handleNext = useCallback(() => {
    setActiveIndex(prev => prev === null ? 0 : (prev + 1) % PROJECTS.length);
  }, []);

  return (
    <section
      id="projects"
      ref={sectionRef}
      style={{
        minHeight: "100vh",
        padding: "6rem 8vw 4rem",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        zIndex: 1,
      }}
    >
      {/* ── Section label — matches portfolio "01 — About" style ── */}
      <div
        style={{
          opacity: inView ? 1 : 0,
          transform: inView ? "translateY(0)" : "translateY(16px)",
          transition: "opacity 0.6s ease, transform 0.6s ease",
          marginBottom: "0.6rem",
          display: "flex",
          alignItems: "center",
          gap: "0.6rem",
        }}
      >
        <span style={{
          width: 7, height: 7, borderRadius: "50%",
          background: "#84cc16", flexShrink: 0, display: "inline-block",
        }} />
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "0.68rem",
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          opacity: 0.55,
        }}>
          03 — Projects
        </span>
      </div>

      {/* ── Section heading ── */}
      <div
        style={{
          opacity: inView ? 1 : 0,
          transform: inView ? "translateY(0)" : "translateY(20px)",
          transition: "opacity 0.7s ease 0.1s, transform 0.7s ease 0.1s",
          marginBottom: "0.4rem",
        }}
      >
        <h2 style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: "clamp(2rem, 4vw, 3.2rem)",
          fontWeight: 700,
          letterSpacing: "-0.02em",
          color: "#ffffff",
          margin: 0,
          lineHeight: 1.1,
        }}>
          Neural Projects
        </h2>
      </div>

      {/* ── Subtitle ── */}
      <div
        style={{
          opacity: inView ? 1 : 0,
          transform: inView ? "translateY(0)" : "translateY(16px)",
          transition: "opacity 0.7s ease 0.2s, transform 0.7s ease 0.2s",
          marginBottom: "1rem",
        }}
      >
        <p style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "0.72rem",
          color: "rgba(255,255,255,0.35)",
          letterSpacing: "0.08em",
          margin: 0,
        }}>
          Click a node on the brain to explore each project
        </p>
      </div>

      {/* ── 3D Brain canvas ── */}
      <div
        style={{
        flex: 1,
        position: "relative",
        minHeight: "72vh",
          opacity: inView ? 1 : 0,
          transition: "opacity 1s ease 0.3s",
        }}
      >
        {/* HUD corner brackets */}
        <HudBrackets />

        {/* Project count label — top right */}
        <div style={{
          position: "absolute",
          top: 16,
          right: 16,
          fontFamily: "JetBrains Mono, monospace",
          fontSize: "0.6rem",
          letterSpacing: "0.18em",
          color: "rgba(255,255,255,0.25)",
          textTransform: "uppercase",
          zIndex: 5,
          pointerEvents: "none",
        }}>
          {activeIndex !== null ? `${String(activeIndex + 1).padStart(2, "0")} / 04` : "PROJECTS [04]"}
        </div>

        {/* Node index labels — bottom left */}
        <div style={{
          position: "absolute",
          bottom: activeIndex !== null ? "14rem" : "1rem",
          left: 16,
          fontFamily: "JetBrains Mono, monospace",
          fontSize: "0.58rem",
          letterSpacing: "0.15em",
          color: "rgba(255,255,255,0.2)",
          textTransform: "uppercase",
          zIndex: 5,
          pointerEvents: "none",
          transition: "bottom 0.4s ease",
        }}>
          {activeIndex !== null
            ? `NODE_${activeIndex} · ${PROJECTS[activeIndex].code}`
            : "HOVER NODES · CLICK TO EXPLORE"}
        </div>

        <Canvas
          camera={{ position: [0, 0.08, 2.6], fov: 48 }}
          style={{ width: "100%", height: "100%", background: "transparent" }}
          gl={{ alpha: true, antialias: true }}
        >
          {/* Lighting — white/neutral */}
          <ambientLight intensity={1.2} color="#ffffff" />
          <directionalLight position={[2, 3, 2]} intensity={2.0} color="#ffffff" />
          <directionalLight position={[-2, 1, -1]} intensity={0.8} color="#dddddd" />
          <directionalLight position={[0, -2, 1]} intensity={0.5} color="#bbbbbb" />
          <pointLight position={[0, 2, 1]} intensity={1.5} color="#ffffff" distance={6} />
          <pointLight position={[0, -1, 0]} intensity={0.6} color="#aaaaaa" distance={5} />

          <Suspense fallback={<BrainLoader />}>
            <BrainMesh activeIndex={activeIndex} onHotspotSelect={handleSelect} />
          </Suspense>
        </Canvas>

        {/* Project popup */}
        <AnimatePresence>
          {activeIndex !== null && (
            <ProjectPopup
              key={activeIndex}
              project={PROJECTS[activeIndex]}
              onClose={handleClose}
              onPrev={handlePrev}
              onNext={handleNext}
            />
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
