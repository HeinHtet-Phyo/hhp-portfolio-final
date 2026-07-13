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

// ─── Colours ──────────────────────────────────────────────────────────────────
const TEAL       = "#ffffff";
const TEAL_DIM   = "#aaaaaa";
const TEAL_GLOW  = "#e0e0e0";
const BG         = "transparent";

// ─── Brain Model (teal, horizontal side-profile) ──────────────────────────────
// Project hotspot positions — placed ON the brain surface (brain radius ~0.28 at these angles)
const PROJECT_HOTSPOTS: [number, number, number][] = [
  [-0.08,  0.20,  0.24],  // 0: MoodTunes — frontal lobe (top-front)
  [ 0.12,  0.14,  0.22],  // 1: IT Career — parietal (top-right)
  [-0.04,  0.00,  0.26],  // 2: CityPulse — temporal (mid-front)
  [ 0.08, -0.08,  0.22],  // 3: PreventPath — occipital (lower-front)
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
  const proj = PROJECTS[index];

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (meshRef.current) {
      const s = active ? 1.4 : (1.0 + 0.15 * Math.sin(t * 2.5 + index));
      meshRef.current.scale.setScalar(s);
    }
    if (ringRef.current) {
      const rs = 1.0 + 0.4 * Math.sin(t * 2.0 + index * 1.2);
      ringRef.current.scale.setScalar(rs);
      (ringRef.current.material as THREE.MeshBasicMaterial).opacity = active ? 0.9 : (0.3 + 0.3 * Math.sin(t * 2.0 + index));
    }
  });

  return (
    <group position={position}>
      {/* Outer pulsing ring */}
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.022, 0.004, 8, 32]} />
        <meshBasicMaterial color={TEAL} transparent opacity={0.5} />
      </mesh>
      {/* Core dot — clickable */}
      <mesh ref={meshRef} onClick={(e) => { e.stopPropagation(); onSelect(); }}>
        <sphereGeometry args={[0.014, 16, 16]} />
        <meshBasicMaterial color={active ? "#ffffff" : TEAL} />
      </mesh>
      {/* Glow halo — very small, additive */}
      <mesh>
        <circleGeometry args={[0.018, 16]} />
        <meshBasicMaterial color={TEAL} transparent opacity={active ? 0.55 : 0.18} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      {/* HTML label */}
      <Html
        position={[0.04, 0.02, 0]}
        style={{ pointerEvents: "none", userSelect: "none" }}
        distanceFactor={1.2}
      >
        <div style={{
          background: active ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.6)",
          border: `1px solid ${active ? "#ffffff" : "rgba(255,255,255,0.3)"}`,
          borderRadius: 4, padding: "3px 7px",
          fontSize: 9, fontFamily: "JetBrains Mono, monospace",
          color: active ? "#ffffff" : "#aaaaaa",
          whiteSpace: "nowrap",
          backdropFilter: "blur(4px)",
          boxShadow: active ? "0 0 10px rgba(0,229,255,0.5)" : "none",
          transition: "all 0.2s ease",
        }}>
          {PROJECTS[index].title}
        </div>
      </Html>
    </group>
  );
}

// ─── Per-project neural network graph definitions (Obsidian-style) ────────────────
type GraphNode = { id: string; x: number; y: number; size: number; label: string; central?: boolean };
type GraphEdge = { a: string; b: string };
type ProjectGraph = { nodes: GraphNode[]; edges: GraphEdge[]; color: string; accentColor: string };

const PROJECT_GRAPHS: ProjectGraph[] = [
  // 0: MoodTunes AI — music neural net, star topology around central model
  {
    color: "rgba(0,229,255,",
    accentColor: "#ffffff",
    nodes: [
      { id: "model",   x: 256, y: 256, size: 10, label: "LightGBM",     central: true },
      { id: "spotify", x: 140, y: 160, size: 6,  label: "Spotify API" },
      { id: "mood1",   x: 360, y: 150, size: 5,  label: "Happy" },
      { id: "mood2",   x: 390, y: 270, size: 5,  label: "Sad" },
      { id: "mood3",   x: 340, y: 370, size: 5,  label: "Energetic" },
      { id: "mood4",   x: 160, y: 370, size: 5,  label: "Calm" },
      { id: "mood5",   x: 120, y: 270, size: 5,  label: "Angry" },
      { id: "feat",    x: 200, y: 200, size: 5,  label: "Features" },
      { id: "rec",     x: 300, y: 200, size: 5,  label: "Recommend" },
      { id: "tracks",  x: 256, y: 140, size: 6,  label: "114K Tracks" },
    ],
    edges: [
      { a: "spotify", b: "model" }, { a: "tracks", b: "model" }, { a: "feat", b: "model" },
      { a: "model", b: "mood1" }, { a: "model", b: "mood2" }, { a: "model", b: "mood3" },
      { a: "model", b: "mood4" }, { a: "model", b: "mood5" }, { a: "model", b: "rec" },
      { a: "feat", b: "spotify" }, { a: "rec", b: "mood1" }, { a: "rec", b: "mood2" },
    ],
  },
  // 1: IT Career Planner — skill tree / career path graph
  {
    color: "rgba(100,200,100,",
    accentColor: "#64c864",
    nodes: [
      { id: "xgb",    x: 256, y: 256, size: 10, label: "XGBoost",    central: true },
      { id: "sfia",   x: 150, y: 180, size: 7,  label: "SFIA" },
      { id: "data",   x: 350, y: 170, size: 6,  label: "Data Sci" },
      { id: "dev",    x: 370, y: 300, size: 6,  label: "Dev" },
      { id: "ai",     x: 260, y: 140, size: 6,  label: "AI/ML" },
      { id: "gap",    x: 140, y: 310, size: 5,  label: "Gap Analysis" },
      { id: "path",   x: 200, y: 370, size: 6,  label: "Career Path" },
      { id: "skills", x: 330, y: 380, size: 5,  label: "Skills" },
      { id: "acc",    x: 256, y: 380, size: 6,  label: "99.75%" },
    ],
    edges: [
      { a: "sfia", b: "xgb" }, { a: "data", b: "xgb" }, { a: "dev", b: "xgb" },
      { a: "ai", b: "xgb" }, { a: "xgb", b: "gap" }, { a: "xgb", b: "path" },
      { a: "xgb", b: "skills" }, { a: "xgb", b: "acc" }, { a: "sfia", b: "skills" },
      { a: "path", b: "data" }, { a: "path", b: "dev" }, { a: "gap", b: "skills" },
    ],
  },
  // 2: CityPulse — hub-and-spoke city data layers
  {
    color: "rgba(255,160,50,",
    accentColor: "#ffa032",
    nodes: [
      { id: "city",    x: 256, y: 256, size: 10, label: "CityPulse",   central: true },
      { id: "trans",   x: 140, y: 170, size: 6,  label: "Transport" },
      { id: "demo",    x: 370, y: 160, size: 6,  label: "Demographics" },
      { id: "infra",   x: 390, y: 300, size: 6,  label: "Infrastructure" },
      { id: "geo",     x: 280, y: 140, size: 5,  label: "GeoPandas" },
      { id: "plotly",  x: 140, y: 320, size: 5,  label: "Plotly" },
      { id: "maps",    x: 200, y: 390, size: 6,  label: "Maps" },
      { id: "realtime",x: 330, y: 380, size: 5,  label: "Real-time" },
      { id: "intel",   x: 380, y: 230, size: 5,  label: "Intelligence" },
    ],
    edges: [
      { a: "trans", b: "city" }, { a: "demo", b: "city" }, { a: "infra", b: "city" },
      { a: "geo", b: "city" }, { a: "city", b: "plotly" }, { a: "city", b: "maps" },
      { a: "city", b: "realtime" }, { a: "city", b: "intel" }, { a: "trans", b: "maps" },
      { a: "demo", b: "intel" }, { a: "infra", b: "realtime" }, { a: "geo", b: "maps" },
    ],
  },
  // 3: PreventPath — risk scoring pipeline
  {
    color: "rgba(220,80,120,",
    accentColor: "#dc5078",
    nodes: [
      { id: "risk",    x: 256, y: 256, size: 10, label: "Risk Score",  central: true },
      { id: "patient", x: 140, y: 180, size: 6,  label: "Patient Data" },
      { id: "ml",      x: 360, y: 160, size: 7,  label: "ML Pipeline" },
      { id: "flask",   x: 390, y: 290, size: 5,  label: "Flask API" },
      { id: "plan",    x: 280, y: 140, size: 6,  label: "Prevention Plan" },
      { id: "health",  x: 140, y: 320, size: 5,  label: "Health Factors" },
      { id: "alert",   x: 200, y: 390, size: 5,  label: "Alerts" },
      { id: "score",   x: 340, y: 380, size: 6,  label: "Scoring" },
      { id: "personal",x: 170, y: 260, size: 5,  label: "Personalised" },
    ],
    edges: [
      { a: "patient", b: "risk" }, { a: "ml", b: "risk" }, { a: "flask", b: "risk" },
      { a: "plan", b: "risk" }, { a: "risk", b: "health" }, { a: "risk", b: "alert" },
      { a: "risk", b: "score" }, { a: "risk", b: "personal" }, { a: "patient", b: "health" },
      { a: "ml", b: "score" }, { a: "flask", b: "alert" }, { a: "plan", b: "personal" },
    ],
  },
];

// ─── Neural Network Overlay (per-project Obsidian-style graph) ──────────────────
function NeuralNetworkOverlay({ selected }: { selected: Project | null }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const texRef  = useRef<THREE.CanvasTexture | null>(null);
  const opacityRef = useRef(0);
  const prevIdRef  = useRef<number | null>(null);

  const canvas2d = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 512; c.height = 512;
    return c;
  }, []);

  const tex = useMemo(() => {
    const t = new THREE.CanvasTexture(canvas2d);
    texRef.current = t;
    return t;
  }, [canvas2d]);

  useFrame(({ clock }) => {
    if (!texRef.current) return;
    const t = clock.elapsedTime;
    const ctx = canvas2d.getContext("2d")!;
    const W = 512, H = 512;

    // Fade in/out
    const targetOpacity = selected ? 1.0 : 0.0;
    opacityRef.current += (targetOpacity - opacityRef.current) * 0.06;

    // Update mesh opacity
    if (meshRef.current) {
      (meshRef.current.material as THREE.MeshBasicMaterial).opacity = opacityRef.current * 0.85;
    }

    if (opacityRef.current < 0.02) {
      ctx.clearRect(0, 0, W, H);
      texRef.current.needsUpdate = true;
      return;
    }

    const graph = selected ? PROJECT_GRAPHS[selected.id] : PROJECT_GRAPHS[prevIdRef.current ?? 0];
    if (selected) prevIdRef.current = selected.id;
    const col = graph.color;
    const alpha = opacityRef.current;

    ctx.clearRect(0, 0, W, H);

    // Build node map
    const nodeMap: Record<string, GraphNode> = {};
    for (const n of graph.nodes) nodeMap[n.id] = n;

    // Draw edges
    for (const edge of graph.edges) {
      const na = nodeMap[edge.a], nb = nodeMap[edge.b];
      if (!na || !nb) continue;

      // Animated pulse along edge
      const edgePhase = (t * 0.6 + graph.nodes.findIndex(n => n.id === edge.a) * 0.3) % 1;
      const px = na.x + (nb.x - na.x) * edgePhase;
      const py = na.y + (nb.y - na.y) * edgePhase;

      // Edge line
      const edgeAlpha = (0.25 + 0.15 * Math.sin(t * 1.2 + graph.nodes.findIndex(n => n.id === edge.a))) * alpha;
      ctx.strokeStyle = `${col}${edgeAlpha})`;
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(na.x, na.y);
      ctx.lineTo(nb.x, nb.y);
      ctx.stroke();

      // Travelling pulse dot
      const pg = ctx.createRadialGradient(px, py, 0, px, py, 8);
      pg.addColorStop(0, `${col}${0.9 * alpha})`);
      pg.addColorStop(1, `${col}0)`);
      ctx.fillStyle = pg;
      ctx.beginPath();
      ctx.arc(px, py, 8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw nodes
    for (const node of graph.nodes) {
      const pulse = node.central
        ? 1.0 + 0.2 * Math.sin(t * 2.0)
        : 1.0 + 0.12 * Math.sin(t * 1.5 + node.x * 0.01);
      const r = node.size * pulse;

      // Outer glow
      const ng = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, r * 3.5);
      ng.addColorStop(0, `${col}${0.55 * alpha})`);
      ng.addColorStop(1, `${col}0)`);
      ctx.fillStyle = ng;
      ctx.beginPath();
      ctx.arc(node.x, node.y, r * 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Core dot
      ctx.fillStyle = `${col}${0.9 * alpha})`;
      ctx.beginPath();
      ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
      ctx.fill();

      // Label (small, monospace)
      if (alpha > 0.4) {
        ctx.font = `${node.central ? 9 : 7}px JetBrains Mono, monospace`;
        ctx.fillStyle = `${col}${Math.min(1, alpha * 1.5) * 0.85})`;
        ctx.textAlign = "center";
        ctx.fillText(node.label, node.x, node.y + r + 11);
      }
    }

    texRef.current.needsUpdate = true;
  });

  return (
    <mesh ref={meshRef} position={[0, 0.08, 0.31]} rotation={[0, 0, 0]}>
      <planeGeometry args={[0.58, 0.58]} />
      <meshBasicMaterial ref={(m) => { if (m) m.opacity = 0; }} map={tex} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
    </mesh>
  );
}

// ─── Camera Controller (zoom in/out on project select) ────────────────────────
function CameraController({ selected }: { selected: Project | null }) {
  const { camera } = useThree();
  const targetZ = useRef(1.25);
  const targetX = useRef(0);
  const targetY = useRef(0);

  useEffect(() => {
    if (selected) {
      const hp = PROJECT_HOTSPOTS[selected.id];
      targetX.current = hp[0] * 0.4;
      targetY.current = hp[1] * 0.3;
      targetZ.current = 0.75;  // zoom in
    } else {
      targetX.current = 0;
      targetY.current = 0;
      targetZ.current = 1.25;  // zoom out
    }
  }, [selected]);

  useFrame(() => {
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX.current, 0.06);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY.current, 0.06);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ.current, 0.06);
    camera.lookAt(0, 0.08, 0);
  });

  return null;
}

function BrainModel({ selected, onHotspotSelect }: { selected: Project | null; onHotspotSelect: (p: Project) => void }) {
  const gltf     = useLoader(GLTFLoader, "/manus-storage/BrainUVs_42a27899.glb");
  const groupRef = useRef<THREE.Group>(null);

  // Realistic flesh-tone brain shader
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
        float NdotV = max(dot(N, V), 0.0);

        // Key light — warm upper-left
        vec3 L1 = normalize(vec3(-1.5, 3.0, 2.5));
        float diff1 = max(dot(N, L1), 0.0);

        // Cool fill from right
        vec3 L2 = normalize(vec3(2.5, 1.0, 1.0));
        float diff2 = max(dot(N, L2), 0.0) * 0.35;

        // Subtle under-bounce
        vec3 L3 = normalize(vec3(0.0, -1.0, 0.5));
        float diff3 = max(dot(N, L3), 0.0) * 0.15;

        // Soft specular (skin-like, not metallic)
        vec3 H1 = normalize(L1 + V);
        float spec = pow(max(dot(N, H1), 0.0), 22.0) * 0.5;

        // Subsurface scattering hint — warm glow at edges
        float sss = pow(1.0 - NdotV, 2.5) * 0.4;

        // Flesh tone palette
        vec3 shadowCol = vec3(0.28, 0.14, 0.12);  // dark reddish-brown grooves
        vec3 baseCol   = vec3(0.72, 0.48, 0.40);  // warm pinkish-grey flesh
        vec3 litCol    = vec3(0.85, 0.65, 0.55);  // lit ridge tops
        vec3 specCol   = vec3(0.92, 0.80, 0.72);  // soft specular
        vec3 sssCol    = vec3(0.90, 0.40, 0.30);  // warm SSS rim

        float lit = clamp(diff1 * 1.1 + diff2 + diff3, 0.0, 1.2);
        vec3 base = mix(shadowCol, baseCol, smoothstep(0.0, 0.7, lit));
        base = mix(base, litCol, smoothstep(0.5, 1.1, lit));
        base = mix(base, specCol, smoothstep(0.4, 0.9, spec));

        // Cyan circuit glow tint — subtle overlay to blend with circuit texture
        float circuitGlow = 0.06 + 0.04 * sin(uTime * 1.2 + vWorldPos.x * 8.0 + vWorldPos.y * 6.0);
        vec3 circuitTint = vec3(0.0, 0.8, 1.0) * circuitGlow;

        // SSS warm rim
        vec3 sssRim = sssCol * sss;

        vec3 color = base + sssRim + circuitTint;
        gl_FragColor = vec4(color, uOpacity);
      }
    `,
    transparent: true,
    depthWrite: true,
    side: THREE.FrontSide,
  }), []);

  useEffect(() => {
    gltf.scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        (child as THREE.Mesh).material = mat;
      }
    });
  }, [gltf, mat]);

  const SPIN_SPEED = 0.25;
  const Y_OFFSET = Math.PI / 2;

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = Y_OFFSET + state.clock.elapsedTime * SPIN_SPEED;
    mat.uniforms.uTime.value = state.clock.elapsedTime;
    mat.uniforms.uOpacity.value = THREE.MathUtils.lerp(
      mat.uniforms.uOpacity.value,
      selected ? 0.75 : 1.0,
      0.05
    );
  });

  return (
    <>
      {/* Spinning brain group */}
      <group ref={groupRef}>
        <group rotation={[0, -Math.PI / 2, 0]} position={[0, 0.08, 0]} scale={[0.0018, 0.0018, 0.0018]}>
          <primitive object={gltf.scene} />
        </group>
        {/* Per-project neural network overlay rotates with brain */}
        <NeuralNetworkOverlay selected={selected} />
      </group>
      {/* Hotspot dots are OUTSIDE spinning group — fixed in world space */}
      {PROJECTS.map((proj, i) => (
        <HotspotDot
          key={proj.id}
          position={PROJECT_HOTSPOTS[i]}
          index={i}
          active={selected?.id === proj.id}
          onSelect={() => onHotspotSelect(proj)}
        />
      ))}
    </>
  );
}

// ─── Tech Background Canvas ─────────────────────────────────────────────────
function TechBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Neural network nodes
    const NODE_COUNT = 38;
    type Node = { x: number; y: number; vx: number; vy: number; r: number; pulse: number; phase: number };
    const nodes: Node[] = Array.from({ length: NODE_COUNT }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      r: 1.5 + Math.random() * 2,
      pulse: 0,
      phase: Math.random() * Math.PI * 2,
    }));

    // Data packets travelling along edges
    type Packet = { a: number; b: number; t: number; speed: number };
    const packets: Packet[] = [];
    for (let i = 0; i < 12; i++) {
      packets.push({ a: Math.floor(Math.random() * NODE_COUNT), b: Math.floor(Math.random() * NODE_COUNT), t: Math.random(), speed: 0.003 + Math.random() * 0.004 });
    }

    let raf = 0;
    let frame = 0;

    const draw = () => {
      const W = canvas.width;
      const H = canvas.height;
      frame++;

      // Clear canvas (transparent — inherits portfolio space background)
      ctx.clearRect(0, 0, W, H);

      // ── Dot grid ──────────────────────────────────────────────
      const GRID = 36;
      ctx.fillStyle = "rgba(255,255,255,0.015)";
      for (let gx = GRID / 2; gx < W; gx += GRID) {
        for (let gy = GRID / 2; gy < H; gy += GRID) {
          ctx.beginPath();
          ctx.arc(gx, gy, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // ── Radial glow behind centre ─────────────────────────────
      const cx = W * 0.5, cy = H * 0.5;
      const pulse = 0.85 + 0.15 * Math.sin(frame * 0.018);
      const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(W, H) * 0.52 * pulse);
      grd.addColorStop(0,   "rgba(0,180,220,0.10)");
      grd.addColorStop(0.4, "rgba(0,100,160,0.06)");
      grd.addColorStop(1,   "rgba(0,0,0,0)");
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, W, H);

      // ── Move nodes ────────────────────────────────────────────
      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > W) n.vx *= -1;
        if (n.y < 0 || n.y > H) n.vy *= -1;
        n.phase += 0.018;
      }

      // ── Draw edges between close nodes ────────────────────────
      const LINK_DIST = Math.min(W, H) * 0.28;
      for (let i = 0; i < NODE_COUNT; i++) {
        for (let j = i + 1; j < NODE_COUNT; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < LINK_DIST) {
            const alpha = (1 - dist / LINK_DIST) * 0.18;
            ctx.strokeStyle = `rgba(200,200,200,${alpha})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      // ── Data packets along edges ──────────────────────────────
      for (const pkt of packets) {
        pkt.t += pkt.speed;
        if (pkt.t >= 1) {
          pkt.t = 0;
          pkt.a = pkt.b;
          pkt.b = Math.floor(Math.random() * NODE_COUNT);
        }
        const na = nodes[pkt.a], nb = nodes[pkt.b];
        const px = na.x + (nb.x - na.x) * pkt.t;
        const py = na.y + (nb.y - na.y) * pkt.t;
        const pg = ctx.createRadialGradient(px, py, 0, px, py, 5);
        pg.addColorStop(0, "rgba(0,229,255,0.9)");
        pg.addColorStop(1, "rgba(0,229,255,0)");
        ctx.fillStyle = pg;
        ctx.beginPath();
        ctx.arc(px, py, 5, 0, Math.PI * 2);
        ctx.fill();
      }

      // ── Draw nodes ────────────────────────────────────────────
      for (const n of nodes) {
        const glow = 0.5 + 0.5 * Math.sin(n.phase);
        const ng = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 4);
        ng.addColorStop(0, `rgba(0,229,255,${0.7 * glow})`);
        ng.addColorStop(1, "rgba(0,229,255,0)");
        ctx.fillStyle = ng;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * 4, 0, Math.PI * 2);
        ctx.fill();
        // Core dot
        ctx.fillStyle = `rgba(0,229,255,${0.85 * glow})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute", inset: 0, width: "100%", height: "100%",
        zIndex: 0, pointerEvents: "none",
      }}
    />
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
        <meshBasicMaterial color="#000000" transparent opacity={0.85} side={THREE.DoubleSide} />
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
function BrainScene({ selected, onHotspotSelect }: { selected: Project | null; onHotspotSelect: (p: Project) => void }) {
  return (
    <>
      <ambientLight intensity={0.25} />
      <directionalLight position={[-2, 4, 3]} intensity={1.4} color="#fff5ee" />
      <directionalLight position={[3, 1, 1]}  intensity={0.5} color="#ffffff" />
      <pointLight position={[0, -0.4, 0]} intensity={2.0} color={TEAL_GLOW} distance={1.5} />

      <CameraController selected={selected} />
      <Suspense fallback={null}>
        <BrainModel selected={selected} onHotspotSelect={onHotspotSelect} />
      </Suspense>
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
      <div style={{ border: `1px solid rgba(255,255,255,0.15)`, borderRadius: 4, padding: "10px 12px", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
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
              background: active ? `rgba(255,255,255,0.08)` : "rgba(0,0,0,0.6)",
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
              <span style={{ fontSize: 10, fontWeight: 600, color: active ? TEAL : "#aaaaaa", fontFamily: "'Space Grotesk', sans-serif" }}>
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
      background: "linear-gradient(to top, rgba(0,0,0,0.95), transparent)",
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
        background: "rgba(0,0,0,0.88)",
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
          background: "transparent", border: `1px solid rgba(255,255,255,0.2)`,
          color: `rgba(170,170,170,0.6)`, borderRadius: 4, padding: "4px 8px",
          fontSize: 9, fontFamily: "JetBrains Mono, monospace", cursor: "pointer",
        }}>ESC</button>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        {project.stats.map(([val, key], i) => (
          <div key={i} style={{
            flex: 1, background: `rgba(255,255,255,0.04)`, border: `1px solid rgba(255,255,255,0.12)`,
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
            background: `rgba(255,255,255,0.06)`, border: `1px solid rgba(255,255,255,0.15)`,
            color: `rgba(200,200,200,0.8)`, fontFamily: "JetBrains Mono, monospace",
          }}>{t}</span>
        ))}
      </div>

      {/* GitHub link */}
      <a href={project.github} target="_blank" rel="noreferrer" style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        fontSize: 9, fontFamily: "JetBrains Mono, monospace",
        color: TEAL, textDecoration: "none",
        border: `1px solid rgba(255,255,255,0.25)`, borderRadius: 4, padding: "6px 12px",
        background: `rgba(255,255,255,0.05)`,
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
    <section
      id="projects"
      style={{
        minHeight: "100vh",
        padding: "6rem 8vw",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        background: "transparent",
        overflow: "hidden",
      }}
    >
      {/* Section label — matches portfolio style: dot + text */}
      <div style={{ marginBottom: "2rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
        <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#84cc16", flexShrink: 0, display: "inline-block" }} />
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.68rem", letterSpacing: "0.22em", textTransform: "uppercase", opacity: 0.55 }}>
          03 — Projects
        </span>
      </div>
      {/* 3D Canvas — transparent, floats on portfolio space background */}
      <Canvas
        camera={{ position: [0, 0, 1.25], fov: 45, near: 0.01, far: 100 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent", flex: 1, minHeight: "80vh" }}
      >
        <BrainScene selected={selected} onHotspotSelect={setSelected} />
      </Canvas>
      {/* Detail panel on project select */}
      <AnimatePresence>
        {selected && (
          <DetailPanel key={selected.id} project={selected} onClose={handleClose} />
        )}
      </AnimatePresence>
    </section>
  );
}
