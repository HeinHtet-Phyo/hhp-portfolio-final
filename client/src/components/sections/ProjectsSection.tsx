/*
 * ProjectsSection — HUD Brain Interface
 *
 * Visual references:
 *   Photo 1: Teal brain in side-profile (horizontal), HUD corner brackets, bottom data bar
 *   Photo 2: Holographic brain on glowing circular platform, UI panels left/right, deep blue bg
 *
 * Design:
 * - Brain oriented horizontally (side profile, X-axis rotation ~15deg so it looks like photo 1)
 * - Single cyan/teal colour with emissive glow (not multi-colour gradient)
 * - Glowing circular platform/base underneath the brain (concentric rings, light beam)
 * - HUD corner brackets in all 4 corners of the canvas
 * - Left panel: scrolling code/data readout (like photo 2 left side)
 * - Right panel: project cards (click to select)
 * - Bottom bar: HUD data readout (like photo 1 bottom)
 * - Brain slowly rotates on Y axis (like sitting on a turntable)
 * - Deep dark teal/navy background (#020d18)
 */

import { Canvas, useFrame, useLoader } from "@react-three/fiber";
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

// ─── Colours ──────────────────────────────────────────────────────────────────
const TEAL       = "#00e5ff";
const TEAL_DIM   = "#00b4cc";
const TEAL_GLOW  = "#00d4ff";
const BG         = "#020d18";

// ─── Brain Model (teal, horizontal side-profile) ──────────────────────────────
function BrainModel({ selected }: { selected: Project | null }) {
  const gltf     = useLoader(GLTFLoader, "/manus-storage/BrainUVs_afbd3b7b.glb");
  const groupRef = useRef<THREE.Group>(null);

  const mat = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      uTime:    { value: 0 },
      uOpacity: { value: 1.0 },
    },
    vertexShader: /* glsl */`
      varying vec3 vNormal;
      varying vec3 vWorldPos;
      varying vec3 vViewDir;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPos = wp.xyz;
        vNormal   = normalize(normalMatrix * normal);
        vViewDir  = normalize(cameraPosition - wp.xyz);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */`
      uniform float uTime;
      uniform float uOpacity;
      varying vec3 vNormal;
      varying vec3 vWorldPos;
      varying vec3 vViewDir;

      void main() {
        vec3 N = normalize(vNormal);
        vec3 V = normalize(vViewDir);

        // Strong fresnel — glassy rim glow like reference image
        float NdotV = max(dot(N, V), 0.0);
        float fresnel = pow(1.0 - NdotV, 3.5);

        // Primary key light — upper-left (matches reference bright left side)
        vec3 L1 = normalize(vec3(-2.0, 3.5, 2.5));
        float diff1 = max(dot(N, L1), 0.0);

        // Secondary fill from right
        vec3 L2 = normalize(vec3(2.5, 1.5, 1.0));
        float diff2 = max(dot(N, L2), 0.0) * 0.4;

        // Back light for rim depth
        vec3 L3 = normalize(vec3(0.0, 1.0, -2.0));
        float diff3 = max(dot(N, L3), 0.0) * 0.25;

        // Tight specular highlights — white hot spots on gyri ridges (like reference)
        vec3 H1 = normalize(L1 + V);
        float spec1 = pow(max(dot(N, H1), 0.0), 120.0) * 3.5;
        vec3 H2 = normalize(L2 + V);
        float spec2 = pow(max(dot(N, H2), 0.0), 80.0) * 1.8;

        // Slow shimmer
        float shimmer = 0.04 * sin(uTime * 0.5 + vWorldPos.y * 5.0);

        // Colour palette — vivid cyan matching reference
        vec3 tealDeep  = vec3(0.00, 0.18, 0.28);  // deep shadow
        vec3 tealMid   = vec3(0.00, 0.75, 0.95);  // main body
        vec3 tealLight = vec3(0.30, 0.95, 1.00);  // bright lit areas
        vec3 white     = vec3(0.90, 1.00, 1.00);  // specular hot spots

        float lit = diff1 + diff2 + diff3 + shimmer;
        // Base: deep shadow → vivid mid → bright
        vec3 base = mix(tealDeep, tealMid, clamp(lit * 1.1, 0.0, 1.0));
        base = mix(base, tealLight, clamp(lit * 0.7 - 0.2, 0.0, 1.0));

        // White specular highlights on ridges
        base = mix(base, white, clamp(spec1, 0.0, 1.0));
        base = mix(base, tealLight, clamp(spec2 * 0.6, 0.0, 1.0));

        // Glowing cyan rim (strong like reference)
        vec3 rimColor = mix(tealMid, tealLight, fresnel);
        vec3 rim = rimColor * fresnel * 2.8;

        // Emissive inner glow — brain glows from within
        float pulse = 0.08 * sin(uTime * 1.0);
        vec3 emissive = tealMid * (0.22 + pulse);

        // Interior translucency hint — brighter at grazing angles
        vec3 interior = tealLight * pow(1.0 - NdotV, 1.2) * 0.35;

        vec3 color = base + rim + emissive + interior;
        // Clamp to avoid over-saturation but keep whites white
        color = min(color, vec3(1.1, 1.1, 1.1));
        gl_FragColor = vec4(color, uOpacity);
      }
    `,
    transparent: false,
    depthWrite: true,
    side: THREE.DoubleSide,
  }), []);

  useEffect(() => {
    // Only assign custom teal shader material — no geometry rotation baking.
    gltf.scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.material = mat;
      }
    });
  }, [gltf, mat]);

  const SPIN_SPEED = 0.30;  // rad/s
  // Y_OFFSET: start at left lateral profile (frontal lobe facing left)
  const Y_OFFSET = Math.PI / 2;  // start showing left lateral profile (frontal lobe left)

  useFrame((state, _delta) => {
    if (!groupRef.current) return;
    // Y-axis turntable spin on outer group, starting at left lateral profile
    groupRef.current.rotation.y = Y_OFFSET + state.clock.elapsedTime * SPIN_SPEED;
    mat.uniforms.uTime.value = state.clock.elapsedTime;
    mat.uniforms.uOpacity.value = THREE.MathUtils.lerp(
      mat.uniforms.uOpacity.value,
      selected ? 0.65 : 1.0,
      0.05
    );
  });

  return (
    <group ref={groupRef}>
      {/* rotation.x = Math.PI/2 stands the brain upright (Z-up OBJ → Y-up Three.js) */}
      <group rotation={[0, -Math.PI / 2, 0]} position={[0, 0.08, 0]} scale={[0.0018, 0.0018, 0.0018]}>
        <primitive object={gltf.scene} />
      </group>
    </group>
  );
}

// ─── Glowing Circular Platform ────────────────────────────────────────────────
function Platform() {
  const ringRef1 = useRef<THREE.Mesh>(null);
  const ringRef2 = useRef<THREE.Mesh>(null);
  const ringRef3 = useRef<THREE.Mesh>(null);
  const beamRef  = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    // Pulse the rings
    if (ringRef1.current) (ringRef1.current.material as THREE.MeshBasicMaterial).opacity = 0.5 + 0.3 * Math.sin(t * 1.5);
    if (ringRef2.current) (ringRef2.current.material as THREE.MeshBasicMaterial).opacity = 0.3 + 0.2 * Math.sin(t * 1.5 + 1.0);
    if (ringRef3.current) (ringRef3.current.material as THREE.MeshBasicMaterial).opacity = 0.15 + 0.1 * Math.sin(t * 1.5 + 2.0);
    if (beamRef.current)  (beamRef.current.material  as THREE.MeshBasicMaterial).opacity = 0.04 + 0.03 * Math.sin(t * 2.0);
  });

  const ringMat  = (opacity: number) => new THREE.MeshBasicMaterial({ color: TEAL_GLOW, transparent: true, opacity, side: THREE.DoubleSide });
  const torusGeo = (r: number) => new THREE.TorusGeometry(r, 0.008, 8, 128);

  return (
    <group position={[0, -0.42, 0]}>
      {/* Concentric glowing rings */}
      <mesh ref={ringRef1} geometry={torusGeo(0.38)} material={ringMat(0.7)} rotation={[Math.PI / 2, 0, 0]} />
      <mesh ref={ringRef2} geometry={torusGeo(0.52)} material={ringMat(0.4)} rotation={[Math.PI / 2, 0, 0]} />
      <mesh ref={ringRef3} geometry={torusGeo(0.66)} material={ringMat(0.2)} rotation={[Math.PI / 2, 0, 0]} />

      {/* Solid disc (platform surface) */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.38, 64]} />
        <meshBasicMaterial color="#001a2e" transparent opacity={0.85} side={THREE.DoubleSide} />
      </mesh>

      {/* Light beam removed — was intersecting brain and causing visible split */}

      {/* Floor glow disc */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <circleGeometry args={[0.70, 64]} />
        <meshBasicMaterial color={TEAL_GLOW} transparent opacity={0.08} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// ─── Ambient Particles ────────────────────────────────────────────────────────
function AmbientParticles() {
  const COUNT = 1200;
  const ref   = useRef<THREE.Points>(null);

  const { geo, phases } = useMemo(() => {
    const pos = new Float32Array(COUNT * 3);
    const ph  = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      const r = 0.5 + Math.random() * 1.2;
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(2 * Math.random() - 1);
      pos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.6;
      pos[i * 3 + 2] = r * Math.cos(phi);
      ph[i] = Math.random() * Math.PI * 2;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return { geo: g, phases: ph };
  }, []);

  const mat = useMemo(() => new THREE.PointsMaterial({
    color: TEAL_GLOW, size: 0.006, transparent: true, opacity: 0.55,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }), []);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t   = clock.elapsedTime;
    const pos = ref.current.geometry.attributes.position;
    const arr = pos.array as Float32Array;
    for (let i = 0; i < COUNT; i++) {
      const ph = phases[i];
      arr[i * 3 + 1] += 0.0003 * Math.sin(t * 0.4 + ph);
    }
    pos.needsUpdate = true;
  });

  return <points ref={ref} geometry={geo} material={mat} />;
}

// ─── Scene ────────────────────────────────────────────────────────────────────
function BrainScene({ selected }: { selected: Project | null }) {
  return (
    <>
      <ambientLight intensity={0.04} />
      <directionalLight position={[3, 4, 2]}  intensity={1.2} color={TEAL} />
      <directionalLight position={[-2, 2, 1]} intensity={0.5} color="#004466" />
      <pointLight position={[0, -0.4, 0]} intensity={3.0} color={TEAL_GLOW} distance={1.5} />

      <Suspense fallback={null}>
        <BrainModel selected={selected} />
      </Suspense>
      <Platform />
      <AmbientParticles />
    </>
  );
}

// ─── HUD Corner Brackets ──────────────────────────────────────────────────────
function HudCorner({ pos }: { pos: "tl" | "tr" | "bl" | "br" }) {
  const isLeft  = pos === "tl" || pos === "bl";
  const isTop   = pos === "tl" || pos === "tr";
  const size    = 28;
  const thick   = 2;
  const style: React.CSSProperties = {
    position: "absolute",
    width:  size,
    height: size,
    ...(isLeft  ? { left:  16 } : { right:  16 }),
    ...(isTop   ? { top:   16 } : { bottom: 16 }),
  };
  const h: React.CSSProperties = {
    position: "absolute",
    background: TEAL,
    height: thick,
    width:  size,
    ...(isTop ? { top: 0 } : { bottom: 0 }),
    opacity: 0.85,
  };
  const v: React.CSSProperties = {
    position: "absolute",
    background: TEAL,
    width:  thick,
    height: size,
    ...(isLeft ? { left: 0 } : { right: 0 }),
    ...(isTop  ? { top: 0 }  : { bottom: 0 }),
    opacity: 0.85,
  };
  return <div style={style}><div style={h} /><div style={v} /></div>;
}

// ─── Scrolling Code Panel (left side, like photo 2) ───────────────────────────
const CODE_LINES = [
  "NEURAL_NET.init()",
  "loading brain_mesh.glb...",
  "vertices: 48,527",
  "faces: 94,174",
  "shader: teal_hud_v2",
  "rotation: 0.30 rad/s",
  "platform: active",
  "particles: 1,200",
  "projects: 4 loaded",
  "MoodTunes AI → F1: 0.5652",
  "IT Career → ACC: 99.75%",
  "CityPulse → LIVE",
  "PreventPath → RISK_AI",
  "status: ONLINE",
  "ping: 12ms",
  "uptime: 99.9%",
  "HHP.portfolio v3.0",
  "location: London, UK",
  "available: TRUE",
];

function CodePanel() {
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setOffset((o) => (o + 1) % CODE_LINES.length), 1200);
    return () => clearInterval(id);
  }, []);

  const visible = [...CODE_LINES.slice(offset), ...CODE_LINES.slice(0, offset)].slice(0, 9);

  return (
    <div style={{
      position: "absolute", left: 18, top: "50%", transform: "translateY(-50%)",
      width: 190, zIndex: 10, pointerEvents: "none",
    }}>
      {/* Panel header */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
        <div style={{ width: 6, height: 6, background: TEAL, borderRadius: "50%", boxShadow: `0 0 6px ${TEAL}` }} />
        <span style={{ fontSize: 9, color: TEAL, fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.15em" }}>
          SYS.LOG
        </span>
      </div>
      {/* Border */}
      <div style={{ border: `1px solid ${TEAL}30`, borderRadius: 4, padding: "10px 12px", background: "rgba(0,20,35,0.75)", backdropFilter: "blur(4px)" }}>
        {visible.map((line, i) => (
          <div key={i} style={{
            fontSize: 9, fontFamily: "JetBrains Mono, monospace",
            color: i === 0 ? TEAL : `${TEAL_DIM}${i < 3 ? "cc" : "55"}`,
            marginBottom: 4, lineHeight: 1.5,
            transition: "color 0.4s ease",
          }}>
            {i === 0 ? "▶ " : "  "}{line}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Project Cards Panel (right side) ─────────────────────────────────────────
function ProjectsPanel({ selected, onSelect }: { selected: Project | null; onSelect: (p: Project | null) => void }) {
  return (
    <div style={{
      position: "absolute", right: 18, top: "50%", transform: "translateY(-50%)",
      width: 200, zIndex: 10, display: "flex", flexDirection: "column", gap: 6,
    }}>
      {/* Panel header */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
        <div style={{ width: 6, height: 6, background: TEAL, borderRadius: "50%", boxShadow: `0 0 6px ${TEAL}` }} />
        <span style={{ fontSize: 9, color: TEAL, fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.15em" }}>
          PROJECTS [{PROJECTS.length}]
        </span>
      </div>
      {PROJECTS.map((proj) => {
        const active = selected?.id === proj.id;
        return (
          <button
            key={proj.id}
            onClick={() => onSelect(active ? null : proj)}
            style={{
              background: active ? `rgba(0,229,255,0.08)` : "rgba(0,20,35,0.75)",
              border: `1px solid ${active ? TEAL + "80" : TEAL + "20"}`,
              borderRadius: 4, padding: "8px 10px", cursor: "pointer",
              textAlign: "left", backdropFilter: "blur(4px)",
              transition: "all 0.2s ease",
              boxShadow: active ? `0 0 12px ${TEAL}30` : "none",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
              <div style={{
                width: 5, height: 5, borderRadius: "50%",
                background: active ? TEAL : TEAL_DIM,
                boxShadow: active ? `0 0 8px ${TEAL}` : "none",
                flexShrink: 0,
              }} />
              <span style={{ fontSize: 10, fontWeight: 600, color: active ? TEAL : "#4dd9f0", fontFamily: "'Space Grotesk', sans-serif" }}>
                {proj.title}
              </span>
            </div>
            <div style={{ fontSize: 8, color: `${TEAL_DIM}88`, fontFamily: "JetBrains Mono, monospace", paddingLeft: 11 }}>
              {proj.subtitle}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ─── Bottom HUD Data Bar (like photo 1) ───────────────────────────────────────
function HudBottomBar({ selected }: { selected: Project | null }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 800);
    return () => clearInterval(id);
  }, []);

  const data = selected
    ? selected.stats.map(([v, k]) => `${k}: ${v}`)
    : ["VERTICES: 48,527", "FACES: 94,174", "ROTATION: ACTIVE", "STATUS: ONLINE", `TICK: ${String(tick).padStart(4, "0")}`];

  return (
    <div style={{
      position: "absolute", bottom: 0, left: 0, right: 0, height: 36, zIndex: 10,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 20px",
      background: "linear-gradient(to top, rgba(0,10,20,0.95), transparent)",
      borderTop: `1px solid ${TEAL}18`,
      pointerEvents: "none",
    }}>
      {data.map((item, i) => (
        <span key={i} style={{
          fontSize: 8, fontFamily: "JetBrains Mono, monospace",
          color: i === 0 ? `${TEAL}cc` : `${TEAL_DIM}55`,
          letterSpacing: "0.12em",
        }}>
          {item}
        </span>
      ))}
    </div>
  );
}

// ─── Project Detail Panel ─────────────────────────────────────────────────────
function DetailPanel({ project, onClose }: { project: Project; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
      style={{
        position: "absolute", bottom: 50, left: "50%", transform: "translateX(-50%)",
        width: 420, zIndex: 20,
        background: "rgba(0,15,28,0.92)",
        border: `1px solid ${TEAL}40`,
        borderRadius: 8, padding: "18px 22px",
        backdropFilter: "blur(12px)",
        boxShadow: `0 0 30px ${TEAL}20`,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 8, fontFamily: "JetBrains Mono, monospace", color: `${TEAL}80`, letterSpacing: "0.2em", marginBottom: 4 }}>
            PROJECT.{String(project.id + 1).padStart(2, "0")} · {project.code}
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: TEAL, fontFamily: "'Space Grotesk', sans-serif" }}>
            {project.title}
          </div>
          <div style={{ fontSize: 10, color: `${TEAL_DIM}99`, fontFamily: "JetBrains Mono, monospace", marginTop: 2 }}>
            {project.subtitle}
          </div>
        </div>
        <button onClick={onClose} style={{
          background: "transparent", border: `1px solid ${TEAL}30`,
          color: `${TEAL_DIM}80`, borderRadius: 4, padding: "4px 8px",
          fontSize: 9, fontFamily: "JetBrains Mono, monospace", cursor: "pointer",
        }}>ESC</button>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        {project.stats.map(([val, key], i) => (
          <div key={i} style={{
            flex: 1, background: `${TEAL}08`, border: `1px solid ${TEAL}20`,
            borderRadius: 4, padding: "8px 10px", textAlign: "center",
          }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: TEAL, fontFamily: "'Space Grotesk', sans-serif" }}>{val}</div>
            <div style={{ fontSize: 8, color: `${TEAL_DIM}70`, fontFamily: "JetBrains Mono, monospace", marginTop: 2 }}>{key}</div>
          </div>
        ))}
      </div>

      {/* Description */}
      <p style={{ fontSize: 11, color: `${TEAL_DIM}aa`, fontFamily: "'Space Grotesk', sans-serif", lineHeight: 1.6, marginBottom: 12 }}>
        {project.desc}
      </p>

      {/* Tech stack */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 14 }}>
        {project.tech.map((t) => (
          <span key={t} style={{
            fontSize: 8, padding: "3px 7px", borderRadius: 3,
            background: `${TEAL}10`, border: `1px solid ${TEAL}25`,
            color: `${TEAL}cc`, fontFamily: "JetBrains Mono, monospace",
          }}>{t}</span>
        ))}
      </div>

      {/* GitHub link */}
      <a href={project.github} target="_blank" rel="noreferrer" style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        fontSize: 9, fontFamily: "JetBrains Mono, monospace",
        color: TEAL, textDecoration: "none",
        border: `1px solid ${TEAL}40`, borderRadius: 4, padding: "6px 12px",
        background: `${TEAL}08`,
        transition: "all 0.2s ease",
      }}>
        ↗ VIEW ON GITHUB
      </a>
    </motion.div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function ProjectsSection() {
  const [selected, setSelected] = useState<Project | null>(null);

  const handleClose = useCallback(() => setSelected(null), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleClose]);

  return (
    <section id="projects" style={{
      height: "100vh", background: BG, position: "relative", overflow: "hidden",
    }}>
      {/* Subtle grid background */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 0,
        backgroundImage: `
          linear-gradient(${TEAL}08 1px, transparent 1px),
          linear-gradient(90deg, ${TEAL}08 1px, transparent 1px)
        `,
        backgroundSize: "40px 40px",
        pointerEvents: "none",
      }} />

      {/* Header */}
      <div style={{
        position: "absolute", top: 22, left: 0, right: 0,
        textAlign: "center", zIndex: 10, pointerEvents: "none",
      }}>
        <p style={{ fontSize: 9, fontFamily: "JetBrains Mono, monospace", color: `${TEAL}70`, letterSpacing: "0.25em", marginBottom: 5 }}>
          SYS.05 · PROJECT MATRIX
        </p>
        <h2 style={{ fontSize: 30, fontWeight: 700, color: "#ffffff", fontFamily: "'Space Grotesk', sans-serif", margin: 0 }}>
          Projects
        </h2>
        <p style={{ fontSize: 8, fontFamily: "JetBrains Mono, monospace", color: `${TEAL}40`, marginTop: 5, letterSpacing: "0.15em" }}>
          SELECT A PROJECT TO INSPECT
        </p>
      </div>

      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [0, 0, 1.25], fov: 45, near: 0.01, far: 100 }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: BG, position: "absolute", inset: 0 }}
      >
        <BrainScene selected={selected} />
      </Canvas>

      {/* HUD Corners */}
      <HudCorner pos="tl" />
      <HudCorner pos="tr" />
      <HudCorner pos="bl" />
      <HudCorner pos="br" />

      {/* Left code panel */}
      <CodePanel />

      {/* Right projects panel */}
      <ProjectsPanel selected={selected} onSelect={setSelected} />

      {/* Bottom data bar */}
      <HudBottomBar selected={selected} />

      {/* Detail panel on project select */}
      <AnimatePresence>
        {selected && (
          <DetailPanel key={selected.id} project={selected} onClose={handleClose} />
        )}
      </AnimatePresence>
    </section>
  );
}
