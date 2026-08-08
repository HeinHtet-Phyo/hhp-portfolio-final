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
import { Suspense, useRef, useState, useEffect, useMemo, useCallback } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as BufferGeometryUtils from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { motion, AnimatePresence } from "framer-motion";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import gsap from "gsap";

// Force full page reload on HMR to prevent R3F reconciler crash
if (import.meta.hot) {
  import.meta.hot.accept(() => {
    import.meta.hot!.invalidate();
  });
}

// ─── Projects ─────────────────────────────────────────────────────────────────
// `name` is the archive display form (uppercase, underscores). `active` marks the four
// documented projects that the readout panel and PREV/NEXT cycle through — NEURAL_05 is
// listed in the node index but has no readout content yet, so it is inert. `preview` is a
// screenshot path for the readout's preview frame; null renders the NO_SIGNAL placeholder.
type Project = {
  id: number;
  name: string;
  desc: string;
  tech: string[];
  github: string;
  demo: string;
  preview: string | null;
  active: boolean;
};

const PROJECTS: Project[] = [
  {
    id: 0,
    name: "MOODTUNES_AI",
    desc: "LightGBM mood classifier trained on 114K+ Spotify tracks. Five-class output at F1 0.5652, served behind a real-time recommendation API.",
    tech: ["PYTHON", "LIGHTGBM", "SPOTIFY_API", "SCIKIT-LEARN", "PANDAS"],
    github: "https://github.com/HeinHtet-Phyo/moodtunes-ai-group3",
    demo: "#",
    preview: null,
    active: true,
  },
  {
    id: 1,
    name: "IT_CAREER_PLANNER",
    desc: "XGBoost classifier reaching 99.75% accuracy across 6,000 samples. Maps SFIA framework skills onto career paths and reports the gaps.",
    tech: ["PYTHON", "XGBOOST", "SFIA", "SCIKIT-LEARN", "STREAMLIT"],
    github: "https://github.com/HeinHtet-Phyo/it-career-planner",
    demo: "#",
    preview: null,
    active: true,
  },
  {
    id: 2,
    name: "CITYPULSE",
    desc: "Urban analytics platform aggregating transport, demographic and infrastructure feeds into a single city-level intelligence view.",
    tech: ["PYTHON", "PANDAS", "PLOTLY", "GEOPANDAS", "STREAMLIT"],
    github: "https://github.com/HeinHtet-Phyo",
    demo: "#",
    preview: null,
    active: true,
  },
  {
    id: 3,
    name: "PREVENTPATH",
    desc: "Health-risk prediction pipeline scoring patient records and generating personalised prevention plans from the resulting risk profile.",
    tech: ["PYTHON", "SCIKIT-LEARN", "FLASK", "HEALTHCARE_ML", "RISK_SCORING"],
    github: "https://github.com/HeinHtet-Phyo",
    demo: "#",
    preview: null,
    active: true,
  },
  {
    id: 4,
    name: "NEURAL_05",
    desc: "Details pending — write-up to follow.",
    tech: ["CLASSIFIED"],
    github: "#",
    demo: "#",
    preview: null,
    active: false,
  },
];

// The four navigable projects. Node index shows all five; only these cycle.
const ACTIVE_PROJECTS = PROJECTS.filter((p) => p.active);

// ─── Classified nodes (inert index rows) ──────────────────────────────────────
const CLASSIFIED_NODES = ["NEURAL_BLACKSITE", "PROJECT_OMEGA"];

// ─── Colours ──────────────────────────────────────────────────────────────────
const TEAL       = "#ffffff";
const TEAL_DIM   = "#aaaaaa";
const TEAL_GLOW  = "#e0e0e0";
const BG         = "transparent";

// ─── Brain Model (teal, horizontal side-profile) ──────────────────────────────
// Project node config — percentages from the mesh's ACTUAL bounding-box centre toward its
// half-extent on each axis (computed at runtime from the real loaded geometry, not guessed —
// see computeProjectPositions below). 0 = centre, +/-1 = the bbox face on that axis. Sign
// convention: +X = right, +Y = up, +Z = forward.
const PROJECT_NODES: { name: string; region: string; pct: [number, number, number] }[] = [
  { name: "MoodTunes AI",      region: "top inner surface",          pct: [ 0.00,  1.60,  0.10] },
  { name: "IT Career Planner", region: "front inner surface",        pct: [ 0.00,  0.75,  1.70] },
  { name: "CityPulse",         region: "back, lower",                pct: [ 0.00, -0.20, -1.80] },
  { name: "PreventPath",       region: "left, lower",                pct: [-1.40, -0.30,  0.05] },
  { name: "PROJECT_05",        region: "lower right inner surface",  pct: [ 1.40, -0.30,  0.15] },
];
// Populated at runtime by computeProjectPositions() once the brain GLB has actually loaded —
// starts as the raw percentage guess (harmless placeholder for the one frame before the real
// mesh bounding box is known) and is mutated in place, so every consumer that already reads
// this array by reference (GoldCircuit, the hotspot render loop, the camera controller) picks
// up the real, validated positions without needing to be threaded a prop.
const PROJECT_HOTSPOTS: [number, number, number][] = PROJECT_NODES.map((n) => [...n.pct]);

// The brain group spins continuously, so a node's WORLD position changes every frame. The
// camera controller is a sibling of BrainModel and has no other way to reach that transform,
// so BrainModel publishes the inner (BRAIN_TRANSFORM) group here on mount — same
// module-level-mutable pattern PROJECT_HOTSPOTS above already uses. Reading matrixWorld off
// this each frame is what keeps an interior camera locked to its region as the brain turns,
// rather than drifting off it the moment the tween lands.
const brainGroupRef: { current: THREE.Group | null } = { current: null };

// Brain idle rotation, shared so the camera controller can freeze it. BrainModel owns the
// integration and writes `angle` onto the group every frame; the controller only flips `paused`.
//
// It is paused for as long as a project is open. The camera aims at the node's LIVE world
// position sampled at the click, and that position is only meaningful while the brain holds
// still — left spinning, the node drifts a full turn every 42s and the camera would land on
// whatever happened to have rotated into its path. Freezing also makes the five views hold
// their distinctness: with the brain turning, a fixed camera sweeps through every brain-frame
// azimuth anyway, so azimuth stops separating the shots and only elevation survives.
const brainSpin = { angle: -Math.PI / 2, paused: false };
const BRAIN_SPIN_SPEED = 0.15;

// Reads the brain mesh's real bounding box, places each PROJECT_NODES entry as a percentage of
// its actual half-extent, then validates every position with a 6-direction raycast (a point
// counts as "inside" only if a ray fired from it in every one of +-X/+-Y/+-Z actually hits the
// mesh — a ray from truly outside the hull will miss in at least one outward direction). Any
// node that fails gets nudged 15% of the way toward the bbox centre and rechecked, up to 5
// times. Finally enforces a minimum pairwise separation of 35% of the mesh's longest axis,
// pushing any too-close pair apart along their connecting vector. Logs the real bbox and a
// PASS/FAIL line per node to the console.
function computeProjectPositions(meshes: THREE.Mesh[]): [number, number, number][] {
  const box = new THREE.Box3();
  meshes.forEach((m) => {
    if (!m.geometry.boundingBox) m.geometry.computeBoundingBox();
    box.union(m.geometry.boundingBox!);
  });
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const half = size.clone().multiplyScalar(0.5);
  const longestAxis = Math.max(size.x, size.y, size.z);

  // eslint-disable-next-line no-console
  console.log(
    `[ProjectNodes] real bbox min=(${box.min.x.toFixed(3)}, ${box.min.y.toFixed(3)}, ${box.min.z.toFixed(3)}) max=(${box.max.x.toFixed(3)}, ${box.max.y.toFixed(3)}, ${box.max.z.toFixed(3)})`
  );

  const raycaster = new THREE.Raycaster();
  raycaster.far = longestAxis * 1.5;
  const DIRS = [
    new THREE.Vector3(1, 0, 0), new THREE.Vector3(-1, 0, 0),
    new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, -1, 0),
    new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, -1),
  ];
  const isInside = (p: THREE.Vector3) => {
    let hits = 0;
    DIRS.forEach((d) => {
      raycaster.set(p, d);
      if (raycaster.intersectObjects(meshes, false).length > 0) hits++;
    });
    return hits === 6;
  };

  const positions = PROJECT_NODES.map((node) => {
    const p = new THREE.Vector3(
      center.x + node.pct[0] * half.x,
      center.y + node.pct[1] * half.y,
      center.z + node.pct[2] * half.z
    );
    let pass = isInside(p);
    let iterations = 0;
    while (!pass && iterations < 5) {
      p.lerp(center, 0.15);
      pass = isInside(p);
      iterations++;
    }
    // eslint-disable-next-line no-console
    console.log(`[ProjectNodes] ${node.name}: ${pass ? "PASS" : "FAIL"} at (${p.x.toFixed(3)}, ${p.y.toFixed(3)}, ${p.z.toFixed(3)}) after ${iterations} nudge(s)`);
    return p;
  });

  const minDist = 0.35 * longestAxis;
  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      const d = positions[i].distanceTo(positions[j]);
      if (d < minDist && d > 1e-6) {
        const push = (minDist - d) / 2;
        const dir = positions[j].clone().sub(positions[i]).normalize();
        positions[i].addScaledVector(dir, -push);
        positions[j].addScaledVector(dir, push);
      }
    }
  }

  return positions.map((p) => [p.x, p.y, p.z] as [number, number, number]);
}

// ─── Gold circuit connecting the 5 project nodes ─────────────────────────────
// Complete graph — every node connects straight through the interior to every other node
// (10 unique pairs from 5 nodes), the intentional cross-brain diagonals forming a spanning
// circuit. Thicker than the ambient network's 0.0025 threads, warm gold, so it reads as its
// own distinct layer against the white ambient web.
function GoldCircuit() {
  const geo = useMemo(() => {
    const pairs: [number, number][] = [
      [0, 1], [0, 2], [0, 3], [0, 4],
      [1, 2], [1, 3], [1, 4],
      [2, 3], [2, 4],
      [3, 4],
    ];
    const tubes = pairs.map(([a, b]) => {
      const A = new THREE.Vector3(...PROJECT_HOTSPOTS[a]);
      const B = new THREE.Vector3(...PROJECT_HOTSPOTS[b]);
      const curve = new THREE.LineCurve3(A, B);
      return new THREE.TubeGeometry(curve, 1, 0.007, 5, false);
    });
    const merged = BufferGeometryUtils.mergeGeometries(tubes, false) ?? new THREE.BufferGeometry();
    tubes.forEach((t) => t.dispose());
    return merged;
  }, []);

  return (
    <mesh geometry={geo} renderOrder={5}>
      <meshBasicMaterial
        color="#FFFFFF"
        transparent
        opacity={0.55}
        depthWrite={false}
        depthTest={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </mesh>
  );
}

// ─── Hotspot Dot (3D) ─────────────────────────────────────────────────────────
function HotspotDot({ position, index, active, interactive, onSelect, onHover }: {
  position: [number, number, number];
  index: number;
  active: boolean;
  interactive: boolean;
  onSelect: () => void;
  onHover: (name: string | null, x: number, y: number) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glow1Ref = useRef<THREE.Mesh>(null);
  const glow2Ref = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const s = active ? 1.6 : hovered ? 1.25 : (1.0 + 0.18 * Math.sin(t * 2.2 + index));
    if (meshRef.current) meshRef.current.scale.setScalar(s);
    if (glow1Ref.current) glow1Ref.current.scale.setScalar(s);
    if (glow2Ref.current) glow2Ref.current.scale.setScalar(s);
  });

  // Clear the cursor/tooltip if this dot unmounts or stops being interactive mid-hover,
  // otherwise a stale pointer cursor sticks to the page.
  useEffect(() => () => { document.body.style.cursor = "auto"; }, []);

  return (
    <group position={position}>
      {/* Dark contrast backing — the brain surface is pale/white, so a plain white dot
          can lose contrast wherever it lands on a bright fold; this dark halo sits just
          behind the bright core so the node pops regardless of what's behind it. */}
      <mesh renderOrder={9}>
        <sphereGeometry args={[0.034, 12, 12]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.45} depthTest={false} depthWrite={false} />
      </mesh>
      {/* Bright core — renderOrder + depthTest:false so it always draws on top of the
          brain surface, regardless of transparent-object sort order. ~33% smaller than the
          previous gold build, bright electric yellow-white (not warm amber), unmistakably the
          largest/brightest points in the scene. */}
      <mesh ref={meshRef} renderOrder={10} onClick={(e) => { e.stopPropagation(); onSelect(); }}>
        <sphereGeometry args={[0.027, 12, 12]} />
        <meshBasicMaterial color="#FFFFFF" depthTest={false} depthWrite={false} toneMapped={false} />
      </mesh>
      {/* Soft bloom — pure spheres only (never a flat disc/torus), so there is no
          ring/halo/Saturn-ring artifact from any viewing angle. Same bright yellow-white
          throughout (no amber falloff), toneMapped:false keeps them at full unclamped
          brightness so bloom has real energy to work with — these are the only nodes meant to
          bloom (the ambient network deliberately does not). */}
      <mesh ref={glow1Ref} renderOrder={10}>
        <sphereGeometry args={[0.054, 12, 12]} />
        <meshBasicMaterial color="#FFFFFF" transparent opacity={active ? 0.35 : 0.2} depthWrite={false} depthTest={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh ref={glow2Ref} renderOrder={10}>
        <sphereGeometry args={[0.092, 12, 12]} />
        <meshBasicMaterial color="#F5F5FF" transparent opacity={active ? 0.18 : 0.1} depthWrite={false} depthTest={false} blending={THREE.AdditiveBlending} />
      </mesh>
      {/* Invisible click target — larger hitbox for usability. Hover drives the cursor, the
          1.25x marker bump above, and the cursor-following tooltip rendered as a DOM overlay
          by the section (not a 3D label, so nothing points at or overlays the mesh). Inert
          nodes get none of it. */}
      <mesh
        onClick={(e) => { if (!interactive) return; e.stopPropagation(); onSelect(); }}
        onPointerOver={(e) => {
          if (!interactive) return;
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = "pointer";
          onHover(PROJECTS[index].name, e.nativeEvent.clientX, e.nativeEvent.clientY);
        }}
        onPointerMove={(e) => {
          if (!interactive) return;
          e.stopPropagation();
          onHover(PROJECTS[index].name, e.nativeEvent.clientX, e.nativeEvent.clientY);
        }}
        onPointerOut={(e) => {
          if (!interactive) return;
          e.stopPropagation();
          setHovered(false);
          document.body.style.cursor = "auto";
          onHover(null, 0, 0);
        }}
      >
        <sphereGeometry args={[0.057, 8, 8]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0} depthWrite={false} />
      </mesh>
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

    // PROJECT_GRAPHS only defines the four documented projects, while there are five brain
    // hotspots — fall back to the first graph rather than dereferencing undefined if a node
    // without its own graph is ever selected.
    const graph = (selected ? PROJECT_GRAPHS[selected.id] : PROJECT_GRAPHS[prevIdRef.current ?? 0]) ?? PROJECT_GRAPHS[0];
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
// Vertical centre of the rendered brain+pedestal group in world space, and the half-extents
// that must stay on screen around it. Measured off an actual wide render (bright-pixel
// bounds, converted back through the projection) rather than derived from the raw mesh
// bounds — the baked surface points are in the model's local space and the brain group
// applies its own transform on top, so the local numbers do not describe what the camera
// sees. Measured: X +/-0.286, Y -0.280..+0.325, i.e. centre +0.022 and half-height 0.303;
// the values below carry a little air on top of that, X extra because the brain spins and
// is longer front-to-back than side-to-side.
// Shared zoom state. The camera controller owns/tweens it, but the bloom pass and the
// holographic beam both need to read it every frame to fade themselves out as the camera
// goes inside — and they are siblings of the controller, not children, so a module-level
// mutable is the only handle they share (same pattern as PROJECT_HOTSPOTS above).
// depth 0 = default external shot, 1 = the zoomed shot on the active node's side of the brain.
// `engaged` is 1 from the moment a project is selected until the BACK tween has fully landed.
// It exists because `depth` alone can no longer answer "is a project open?": a project-to-project
// switch deliberately drives depth through 0 at the hand-off, and anything keyed to `depth === 0`
// would flicker back to its default-state look for those few frames mid-transition.
// az/el are the live orbital angle in the brain's frame; radiusFrac is the live orbit radius as
// a fraction of defaultDistance. az is deliberately UNBOUNDED — it accumulates rather than
// wrapping at +/-180, which is what lets a swing take the short way round (see shortestAz).
const camAnim = { depth: 0, engaged: 0, az: 0, el: 0, radiusFrac: 1 };

// Shortest signed rotation from `from` to `to`, in degrees, in (-180, 180]. Added to the live
// az rather than assigned, so a swing from +160 to -110 goes 90 degrees forward through 180
// instead of 270 degrees back through zero.
function shortestAz(from: number, to: number) {
  return from + (((to - from + 180) % 360 + 360) % 360 - 180);
}

// ── Transition timings ──
// Project-to-project is a single timeline in two legs: pull back out to the default distance,
// then dive into the next region. The hand-off between them happens exactly at depth 0, which is
// the one point where the camera's direction does not depend on which node is targeted (see the
// lerp in useFrame) — so the target can be swapped there with no discontinuity at all.
const SWITCH_S    = 1.8;   // project-to-project orbit, whole swing
const ZOOM_IN_S   = 1.4;   // first selection, straight from the default view
const BACK_S      = 1.3;   // BACK, all the way out to default
// Readout content cross-fade (140ms out + 140ms in) sits centred on the zoom-out leg's midpoint,
// so the text swaps at the top of the arc rather than at the instant of the click.
const CONTENT_FADE_S  = 0.14;
const CONTENT_DELAY_S = SWITCH_S / 2 - CONTENT_FADE_S;

const SCENE_CENTRE_Y = 0.02;
// Bounding-sphere radius of the whole group about that centre. A sphere (rather than the
// previous separate X/Y half-extents) is what makes the framing safe to ORBIT: its silhouette
// is the same from every direction, so a distance that fits it head-on also fits it from
// above, behind or the side. Measured extents were X +/-0.286 and Y -0.280..+0.325 about
// centre +0.022, i.e. 0.303; 0.31 carries a little air, and the brain's spin already sweeps
// its long front-to-back axis through X.
const SCENE_RADIUS = 0.31;

// Camera distances as multiples of the exact-fit distance for that sphere.
//
// These two cannot both be what the brief asked for. It wants the focused shot at 55-65% of
// the default distance AND the silhouette fully in frame with margin. The old default sat at
// ~1.09x exact-fit — the brain nearly filled the frame already — so 60% of it lands at 0.65x
// exact-fit, which clips badly. Honouring 60% strictly would force the default out to ~1.7x
// exact-fit, shrinking the default view by around a third. "Nothing clipped" is the hard
// constraint and the ratio is "roughly", so the default is pulled back modestly instead and
// the focused shot sits as close as it can while keeping real margin: a ratio of ~0.81.
const DEFAULT_MARGIN = 1.30;

// ── Click-to-zoom: dolly in on the node's side, brain stays centred ──
// lookAt is ALWAYS the brain centre — never the node. Pointing the lens at the node is what
// re-centres the node in frame and therefore slides the rest of the brain off to one side
// (the left-shift symptom), and it is also what put the lens close to a bright interior wall
// (the white blowout). Both are fixed by the same change: keep lookAt pinned to the centre and
// express "zoom into that region" purely as an ORBIT + DOLLY about that centre —
//
//   orbitDirection       = normalise(node LIVE world position - brainCentre), sampled on click
//   targetCameraPosition = brainCentre + orbitDirection * (defaultDistance * ZOOM_RADIUS_FACTOR)
//   targetLookAt         = brainCentre        (fixed, every state)
//
// The brain therefore projects to the centre of the viewport in BOTH states; only the approach
// angle and the distance change. Per-project differentiation comes from each node own position.
//
// MEASURED, offline, against the real GLB and this exact camera maths (1600x900, all five
// nodes, ten spin phases each). On-screen horizontal centre of the brain, viewport centre 800px:
//
//                     silhouette bbox mid   visible-area centroid
//   default              775..821px            781..821px
//   zoomed, per node     792..803px            792..803px
//
// The +/-25px band in the default state is the idle spin turning an asymmetric mesh, not a
// shift; it is present with no project selected at all. Selecting a project does not displace
// the brain horizontally — the zoomed figures are, if anything, tighter to centre than the
// default, because the camera direction is derived from the node and so co-rotates with the
// brain, freezing that wobble. Do not "fix" a left-shift here by panning the camera or by
// re-centring the canvas: nothing in this file moves the brain horizontally, and the earlier
// reports of a shift did not survive measurement.
// ─── Per-project camera angles — TUNE HERE ───────────────────────────────────
// (azimuth, elevation) in degrees, one entry per project, indexed by project id. Deriving the
// angle from the node's raw position instead was the old approach; it produced usable directions
// (min separation 53.3 degrees, measured) but gave no direct control, and the angles it picked
// were an accident of where the hotspots landed.
//
// WORLD-fixed, not brain-local. These were briefly anchored to the brain's own frame so that
// "front" always meant the frontal lobe whatever the spin phase — but anchoring to a frame that
// is itself rotating means the camera rotates with it, and the brain then sat perfectly still on
// screen for as long as a project was open. World-fixed is the deliberate trade: the camera
// parks and the idle spin stays visible while zoomed, at the cost of which anatomy faces the lens
// depending on when you click.
//
//   azimuth    0 = world +Z (the default camera's axis), +90 = +X, 180 = -Z, -90 = -X
//   elevation  0 = equator, +90 = directly overhead, -90 = directly below
//
// ── NO HARDCODED PER-PROJECT ANGLES ──
// az/el are DERIVED, at the instant of the click, from the node's live world position — see the
// selection effect in CameraController. Fixed angles were tried and do not work here: the brain
// turns, so a node that is at the front now is at the side twenty seconds later, and a fixed
// angle frames whichever region happened to rotate into it. Deriving from the live position
// makes the camera follow the node wherever it currently is, for all five, with nothing to tune.
//
// Camera elevation is clamped to this. The topmost node sits at elevation ~87 degrees, near
// enough to straight-up that the view direction is almost parallel to the camera's up vector,
// where roll becomes ill-conditioned and small azimuth changes swing the image round. 80 keeps
// the overhead shot steep while leaving the orientation well-behaved.
const ELEVATION_LIMIT = 80;

// ─── Orbit radius — TUNE HERE ────────────────────────────────────────────────
// Radius the camera parks at while a project is open, as a fraction of defaultDistance.
//
// Sized so the WHOLE brain stays in frame with real space around it, rather than filling or
// overflowing it. The frustum maths, with the bounding sphere SCENE_RADIUS = 0.31 and fov 45:
//
//   defaultDistance   = SCENE_RADIUS / sin(bindingHalfAngle) * DEFAULT_MARGIN
//   at radius f*dd:     sin(silhouetteHalfAngle) = SCENE_RADIUS / (f * dd)
//   frame fill         = tan(silhouetteHalfAngle) / tan(bindingHalfAngle)
//   margin             = 1 - fill,  measured against the frustum half-angle
//
// For any LANDSCAPE viewport the vertical axis binds (fov is fixed, so bindingHalfAngle is
// always 22.5 degrees) and the result is aspect-independent:
//
//   f = 0.72  ->  margin -8.2%   bounding sphere exceeds the frustum; brain cropped
//   f = 0.85  ->  margin 10.9%   <- current: whole brain in frame with space all round
//   f = 0.8865 -> margin 15.0%   threshold if a 15% margin is wanted
//   f = 0.90  ->  margin 16.4%
//
// At 0.85 the margin is positive on both axes, so the whole bounding sphere — and therefore the
// whole mesh, which sits inside it — is inside the frustum. Confirmed empirically below.
const ZOOM_RADIUS_FACTOR = 0.85;
// Midpoint of a project-to-project swing eases out to exactly the default distance, then settles
// back to ZOOM_RADIUS_FACTOR at the new angle: 0.85 -> 1.0 -> 0.85.
const MID_RADIUS_FRAC  = 1.0;
// Pedestal light cone fades toward this fraction of its default opacity while zoomed.
const CONE_INSIDE_FRAC = 0.30;
// Near plane stays at its default in both states now — the camera never enters the mesh
// (closest approach is ZOOM_RADIUS_FACTOR * defaultDistance, well outside SCENE_RADIUS), and a wide
// near/far ratio reintroduces the depth-precision sparkle noted on the Canvas.
const NEAR_OUTSIDE = 0.1;

// Exact-fit distance for a bounding sphere, times a margin. Uses sin (not tan): tan fits a
// flat plane at the centre's depth and under-shoots for a sphere, which bulges toward the
// camera. Whichever axis is tighter binds.
function orbitDistance(aspect: number, fov: number, margin: number) {
  const vHalf = (fov * Math.PI) / 360;
  const hHalf = Math.atan(Math.tan(vHalf) * Math.max(aspect, 0.01));
  return (SCENE_RADIUS / Math.min(Math.sin(vHalf), Math.sin(hHalf))) * margin;
}

// Reused scratch vectors — this runs every frame, so nothing here allocates.
const _centreV = new THREE.Vector3();
const _startV  = new THREE.Vector3();
const _lookV   = new THREE.Vector3();
const _toV     = new THREE.Vector3();
// Target orbital direction. MUST stay a distinct object from _dirV: the frame blends _dirV from
// the default direction toward this one, and if the two aliased, the blend would read its own
// half-written result and the camera would never leave the default view. That exact aliasing is
// what made all five projects render the identical shot.
const _viewV   = new THREE.Vector3();
const _dirV    = new THREE.Vector3();
// The default (unselected) viewing direction: straight on from +Z.
const _DEFAULT_DIR = new THREE.Vector3(0, 0, 1);

// (azimuth, elevation) -> a unit direction in WORLD space.
//
// Deliberately NOT rotated by the brain group's quaternion. Doing that pinned the angle to the
// anatomy, which meant the camera orbited in lockstep with the idle spin — the brain then held
// perfectly still on screen for as long as a project was open. The spin was always running; it
// simply could not be seen, because the observer was turning with it. Leaving the direction in
// world space parks the camera at a fixed point while the brain keeps turning underneath it, so
// the idle rotation reads exactly as it does in the default view.
//
// `out` must not alias any vector the caller is still reading.
function orbitDir(azDeg: number, elDeg: number, out: THREE.Vector3) {
  const az = THREE.MathUtils.degToRad(azDeg);
  const el = THREE.MathUtils.degToRad(elDeg);
  const ce = Math.cos(el);
  out.set(Math.sin(az) * ce, Math.sin(el), Math.cos(az) * ce);
  return out;
}

// A node's CURRENT world position: its local position under PROJECT_HOTSPOTS pushed through the
// brain group's live world matrix, so the brain's current rotation is included. Using the local
// position alone would ignore the spin entirely and aim the camera at where the node was at
// yaw 0. Indexed by project id, so a 5th active project needs no extra wiring.
function nodeWorld(index: number, out: THREE.Vector3) {
  const g = brainGroupRef.current;
  out.set(...PROJECT_HOTSPOTS[index]);
  if (g) out.applyMatrix4(g.matrixWorld);
  return out;
}

// World direction -> the (azimuth, elevation) the camera tweens in. Inverse of orbitDir, so a
// direction sampled off a node round-trips exactly. Elevation is clamped (see ELEVATION_LIMIT).
function dirToAngles(dir: THREE.Vector3) {
  const az = THREE.MathUtils.radToDeg(Math.atan2(dir.x, dir.z));
  const elRaw = THREE.MathUtils.radToDeg(Math.asin(THREE.MathUtils.clamp(dir.y, -1, 1)));
  return { az, el: THREE.MathUtils.clamp(elRaw, -ELEVATION_LIMIT, ELEVATION_LIMIT), elRaw };
}

function CameraController({ selected }: { selected: Project | null }) {
  const { camera, size } = useThree();
  const aspect = size.width / Math.max(size.height, 1);

  // Tweened on the shared module object so the bloom pass and beam can read `depth` — they
  // are siblings of this controller, not children (see the note above `camAnim`).
  const anim = camAnim;
  const loggedRef = useRef(false);
  // Which node's direction the camera is currently flying along. Only meaningful while depth > 0;
  // at depth 0 the direction is _DEFAULT_DIR no matter what this holds.
  const toId = useRef<number | null>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  // defaultDistance is read once, here, at mount — not recomputed on every frame or on
  // resize — so it can never be derived from a camera position that a previous zoom has
  // already moved, and can't drift across zoom cycles. The trade-off (stated explicitly) is
  // that framing no longer re-adapts if the window is resized after mount.
  const defaultDistanceRef = useRef<number | null>(null);
  if (defaultDistanceRef.current === null) {
    const fov0 = (camera as THREE.PerspectiveCamera).fov ?? 45;
    defaultDistanceRef.current = orbitDistance(aspect, fov0, DEFAULT_MARGIN);
  }

  useEffect(() => {
    const nextId = selected ? selected.id : null;
    // Kill the running timeline, not just its tweens: a timeline also carries the mid-transition
    // callback that swaps the target node, and an orphaned one would fire against a stale target
    // if the user clicks again mid-flight.
    tlRef.current?.kill();
    gsap.killTweensOf(anim);

    if (nextId === null) {
      // BACK — resume the idle rotation immediately, then ease all the way out to the default
      // view. `engaged` is only cleared once the camera has actually landed, so the light cone
      // stays hidden for the whole journey and reappears exactly at the default view.
      brainSpin.paused = false;
      tlRef.current = gsap.timeline()
        .to(anim, { depth: 0, radiusFrac: 1, duration: BACK_S, ease: "power2.inOut" })
        .add(() => { toId.current = null; anim.engaged = 0; });
      return;
    }

    anim.engaged = 1;
    // Freeze the brain BEFORE sampling. From here the node's world position is stationary, so
    // the target computed below stays valid for the whole tween instead of drifting out from
    // under it — Option A. The brain group's matrixWorld already holds the last rendered yaw,
    // which is the yaw it now holds, so the sample and the freeze agree.
    brainSpin.paused = true;

    // ── The node's LIVE world position, with the brain's current rotation applied ──
    nodeWorld(nextId, _toV);
    _centreV.set(0, SCENE_CENTRE_Y, 0);
    _dirV.copy(_toV).sub(_centreV);
    if (_dirV.lengthSq() < 1e-8) _dirV.copy(_DEFAULT_DIR);
    _dirV.normalize();
    const view = dirToAngles(_dirV);

    // Settled camera position, straight from that direction.
    _startV.copy(_centreV).addScaledVector(_dirV, defaultDistanceRef.current! * ZOOM_RADIUS_FACTOR);
    // eslint-disable-next-line no-console
    console.log(
      `[Brain camera] ${selected!.name} (id ${nextId})`,
      `\n    node world position = (${_toV.x.toFixed(4)}, ${_toV.y.toFixed(4)}, ${_toV.z.toFixed(4)})`,
      `\n    direction           = (${_dirV.x.toFixed(4)}, ${_dirV.y.toFixed(4)}, ${_dirV.z.toFixed(4)})`,
      `  azimuth=${view.az.toFixed(1)} elevation=${view.elRaw.toFixed(1)}${view.el !== view.elRaw ? ` (clamped to ${view.el})` : ""}`,
      `\n    camera position     = (${_startV.x.toFixed(4)}, ${_startV.y.toFixed(4)}, ${_startV.z.toFixed(4)})`,
      `  radius=${(defaultDistanceRef.current! * ZOOM_RADIUS_FACTOR).toFixed(4)}`,
      `\n    lookAt (brainCentre, fixed) = (${_centreV.x.toFixed(4)}, ${_centreV.y.toFixed(4)}, ${_centreV.z.toFixed(4)})`,
    );

    // Straight dive in. Taken from the default view, when re-selecting the node already framed,
    // or when catching a BACK mid-flight. Snapping az/el here is safe precisely when depth is at
    // or near 0, because the direction is then _DEFAULT_DIR regardless of what az/el hold.
    if (toId.current === null || toId.current === nextId || anim.depth <= 0.01) {
      toId.current = nextId;
      anim.az = shortestAz(anim.az, view.az);
      anim.el = view.el;
      tlRef.current = gsap.timeline()
        .to(anim, { depth: 1, radiusFrac: ZOOM_RADIUS_FACTOR, duration: ZOOM_IN_S, ease: "power2.inOut" });
      return;
    }

    // Project-to-project — ORBIT around the brain from the current angle to the next project's,
    // with the radius easing out to MID_RADIUS_FRAC at the halfway point and back in by the end.
    // depth stays pinned at 1 for the whole swing: the camera never returns to the default view,
    // it travels around the brain, so the beam stays hidden and the bloom holds its inside value.
    toId.current = nextId;
    tlRef.current = gsap.timeline()
      .to(anim, {
        az: shortestAz(anim.az, view.az), el: view.el, depth: 1,
        duration: SWITCH_S, ease: "power2.inOut",
      }, 0)
      .to(anim, { radiusFrac: MID_RADIUS_FRAC, duration: SWITCH_S / 2, ease: "power2.inOut" }, 0)
      .to(anim, { radiusFrac: ZOOM_RADIUS_FACTOR, duration: SWITCH_S / 2, ease: "power2.inOut" }, SWITCH_S / 2);
  }, [selected, anim]);

  useEffect(() => () => { tlRef.current?.kill(); gsap.killTweensOf(anim); }, [anim]);

  useFrame(() => {
    // Everything orbits this one pivot — the centre of the brain+pedestal group, which is
    // also what SCENE_RADIUS is measured about (the brain's bounding-box centre, not any
    // individual node). Using the brain mesh's own centre instead would put the pedestal
    // further from the pivot than the radius accounts for, and it would clip once the
    // camera swung below the equator.
    _centreV.set(0, SCENE_CENTRE_Y, 0);

    const { depth } = anim;
    const defaultDistance = defaultDistanceRef.current!;

    if (!loggedRef.current) {
      loggedRef.current = true;
      // eslint-disable-next-line no-console
      console.log(
        "[Brain camera] defaultDistance =", defaultDistance.toFixed(4),
        " zoomedDistance =", (defaultDistance * ZOOM_RADIUS_FACTOR).toFixed(4),
        " SCENE_RADIUS (bounding-sphere) =", SCENE_RADIUS,
      );
    }

    // Direction the camera sits along, measured from the pivot. Defaults to straight-on +Z and
    // eases toward the targeted node's own direction as `depth` goes 0 -> 1. Read live off the
    // brain's current transform each frame, so it tracks the continuous idle spin. This is the
    // whole of the per-node differentiation: nothing is hardcoded per project, so the top node
    // is approached from above, the back node from behind, and a 5th node works untouched.
    // Target direction for the live orbital angle. World-fixed, so the brain's idle spin runs
    // underneath it and stays visible while zoomed. Written into _viewV, NOT _dirV — see the
    // note on _viewV.
    orbitDir(anim.az, anim.el, _viewV);
    _dirV.copy(_DEFAULT_DIR).lerp(_viewV, depth);
    if (_dirV.lengthSq() < 1e-8) _dirV.copy(_DEFAULT_DIR);
    _dirV.normalize();

    // Pure dolly: only the distance along that direction changes with depth. No lateral
    // pan of any kind is applied — not a constant one, and nothing keyed to whether the
    // readout is open. Camera and target are both derived solely from `_centreV`, so the
    // pivot projects to the exact centre of the full-width canvas in EVERY state, and the
    // brain's centre X cannot move when a project opens or closes. The panels overlay the
    // canvas on higher z-indices instead of displacing the scene.
    // Radius comes straight off the tweened fraction — 1 at the default view, ZOOM_RADIUS_FACTOR
    // parked on a project, bulging to MID_RADIUS_FRAC halfway through a swing between two.
    const dist = defaultDistance * anim.radiusFrac;
    _startV.copy(_centreV).addScaledVector(_dirV, dist);
    _lookV.copy(_centreV);

    camera.position.copy(_startV);
    camera.lookAt(_lookV);

    if (camera.near !== NEAR_OUTSIDE) {
      camera.near = NEAR_OUTSIDE;
      (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
    }
  });

  return null;
}

// ─── Neural Network Dots + Lines (dense, glowing, rotates with brain) ────────
// 550 dots pre-sampled directly on the REAL mesh surface (not an ellipsoid
// approximation — that caused the "clustered in one region" bug). Generated by casting
// a ray from far outside the mesh (starting at the vertex centroid, offset outward
// along a sampled direction) back inward, keeping the FIRST hit. Casting from *inside*
// the brain instead mostly hit a nearby cortical fold wall a short distance away rather
// than the true outer hull — brains are highly non-convex, so "nearest hit from an
// interior point" is essentially random fold geometry, not the visible surface. Casting
// inward from outside guarantees every point lands on the actual visible hull, covering
// the whole front/top/back/side/underside. Bumped from 260 to 550 points (median
// nearest-neighbour spacing ~0.017 vs ~0.025 before) for a visibly denser "so many small
// dots" web. Baked once — regenerating means re-running the raycast against the GLB, not
// worth doing at runtime (~550 outside-in raycasts against the 95k-tri mesh take the
// better part of a second, which would block first paint if done on mount).
const NEURAL_SURFACE_POINTS: [number, number, number][] = [
  [0.14171, 0.17025, 0.1635], [-0.21801, 0.088, -0.03841], [-0.17559, 0.11394, 0.08363],
  [0.11857, 0.24605, 0.06167], [0.12614, 0.19735, 0.16044], [-0.0535, -0.09077, -0.10936],
  [0.12256, 0.19538, 0.16596], [0.11863, -0.02403, 0.08882], [0.03247, 0.23212, 0.22465],
  [-0.11721, 0.26787, -0.04911], [0.07918, 0.14459, -0.23151], [-0.12138, 0.19483, 0.18739],
  [-0.00897, 0.08109, 0.20799], [0.01272, 0.12475, -0.24724], [-0.03873, -0.09802, -0.04309],
  [0.13773, 0.20955, 0.11506], [0.07052, -0.0009, -0.24048], [0.21706, 0.09872, -0.00255],
  [0.06334, 0.29132, 0.06009], [0.16543, 0.18285, -0.16459], [-0.15474, 0.07829, 0.14934],
  [0.03864, 0.2561, -0.16163], [0.04569, 0.29193, -0.0705], [0.10843, 0.26466, 0.05408],
  [0.10699, 0.0233, 0.15342], [-0.12058, 0.08339, -0.22797], [0.16972, 0.16001, 0.10534],
  [-0.18326, 0.023, -0.03869], [0.00492, 0.21789, 0.16706], [0.14603, 0.21896, 0.07212],
  [0.10061, 0.18092, 0.20737], [0.09332, 0.06938, 0.17893], [-0.15563, 0.23, -0.02986],
  [-0.03303, 0.30593, -0.02823], [0.15995, 0.18804, -0.16762], [0.02862, -0.08605, -0.05424],
  [0.02056, 0.02053, -0.2572], [-0.00218, 0.109, 0.13616], [-0.12627, 0.26042, -0.05919],
  [-0.11344, 0.25246, 0.08827], [0.05666, 0.02342, -0.02071], [-0.09768, 0.08789, 0.24997],
  [-0.06892, 0.00792, 0.1459], [-0.02105, 0.29941, -0.09052], [0.15951, 0.09542, 0.15948],
  [-0.15023, 0.24262, -0.09689], [0.21547, 0.10809, -0.08783], [-0.21592, 0.11566, -0.0159],
  [0.02068, 0.0292, 0.10172], [-0.05404, -0.08839, -0.11709], [-0.05956, 0.26043, -0.14857],
  [-0.15001, 0.23967, -0.01456], [0.04658, -0.07327, -0.18503], [0.14909, 0.13601, -0.19884],
  [-0.09651, 0.09839, -0.24566], [-0.14064, 0.19429, 0.09932], [-0.10724, 0.26655, 0.05257],
  [0.11819, 0.03449, 0.1569], [-0.07688, 0.18293, 0.23408], [-0.0602, 0.27248, 0.14714],
  [0.11487, -0.00593, -0.20076], [-0.19996, 0.06753, -0.02832], [-0.16005, 0.23685, -0.04442],
  [-0.10535, 0.26711, 0.03492], [-0.06918, 0.01717, 0.14644], [-0.15808, 0.22194, -0.01358],
  [-0.00943, 0.22235, -0.20009], [-0.05921, 0.01975, -0.01243], [0.04179, 0.22192, 0.22429],
  [-0.18347, 0.02393, -0.03393], [0.14373, -0.0264, 0.04274], [-0.11238, -0.03443, 0.06539],
  [0.04808, -0.00603, -0.22491], [0.16074, -0.04753, -0.12033], [-0.18968, 0.1603, 0.05667],
  [0.14162, 0.05519, -0.19807], [-0.07916, 0.00944, 0.00685], [-0.11539, -0.08494, -0.10058],
  [-0.16707, 0.23097, -0.09636], [0.05839, -0.07814, -0.06404], [-0.197, 0.17803, -0.00399],
  [-0.15376, -0.01712, 0.0571], [0.11263, 0.03862, -0.23112], [0.0644, 0.1346, -0.25114],
  [-0.1759, 0.06224, 0.11911], [0.21468, 0.07838, -0.03578], [-0.02, 0.25396, 0.18815],
  [0.13692, 0.24977, -0.00971], [0.02574, 0.03003, 0.02035], [0.14301, 0.08995, 0.19087],
  [0.15245, 0.02044, -0.18468], [-0.01188, 0.04757, 0.02265], [-0.07429, 0.14167, -0.2378],
  [-0.07359, 0.13291, -0.23748], [0.04209, 0.02543, 0.00592], [0.18891, 0.14523, -0.14302],
  [0.13836, 0.06507, -0.20361], [0.05361, -0.08982, -0.09753], [-0.13326, 0.25166, -0.09439],
  [0.18155, 0.00344, -0.00531], [-0.18027, 0.15265, 0.08582], [0.00526, -0.05961, -0.14771],
  [0.11106, 0.25356, 0.02231], [0.03803, 0.28772, -0.11193], [0.19245, 0.13932, 0.06421],
  [-0.192, 0.15699, -0.11574], [-0.083, 0.01802, -0.01737], [-0.10941, 0.15315, -0.21309],
  [0.19206, 0.12385, -0.13852], [-0.08696, 0.28079, 0.05689], [-0.08377, 0.28824, -0.0293],
  [-0.17967, -0.00389, -0.04247], [-0.17466, -0.00703, 0.00071], [0.14989, 0.04281, -0.19472],
  [-0.17849, 0.17597, -0.14985], [-0.18852, 0.12771, -0.15115], [0.08457, -0.01312, 0.13601],
  [0.19475, 0.01912, 0.00229], [-0.16579, 0.06504, -0.18351], [-0.1355, 0.07548, 0.19366],
  [-0.21532, 0.10863, -0.07624], [-0.13337, 0.1307, 0.21344], [-0.07485, 0.01868, -0.0233],
  [-0.02008, -0.03026, 0.01273], [0.16953, 0.07893, -0.1806], [-0.1803, 0.01357, 0.05665],
  [0.1002, -0.08072, -0.07034], [0.13189, 0.15206, -0.20961], [0.17482, 0.10471, 0.06114],
  [-0.02859, 0.19331, 0.24629], [-0.12416, 0.18696, 0.1573], [-0.21737, 0.10995, -0.0111],
  [0.11993, 0.09255, 0.22958], [0.20211, 0.16406, -0.07409], [0.0467, 0.26304, 0.17222],
  [-0.20888, 0.13181, -0.09647], [0.03376, -0.05863, -0.04868], [0.10894, 0.14199, -0.22574],
  [-0.12076, -0.00072, -0.01668], [-0.19069, 0.0539, 0.06569], [0.18015, 0.21211, -0.0651],
  [0.10785, 0.27117, -0.02054], [-0.00983, 0.30506, -0.05642], [0.15104, 0.24228, -0.04091],
  [0.01445, 0.10985, -0.24915], [0.20417, 0.15141, -0.02687], [-0.10931, 0.13954, -0.22786],
  [-0.1668, -0.01121, 0.01436], [0.04208, -0.05198, -0.03319], [0.16971, -0.02609, -0.09519],
  [-0.01072, 0.04852, 0.02221], [-0.14241, 0.23495, 0.01005], [-0.00759, 0.30546, 0.05194],
  [0.14297, -0.04794, -0.14675], [-0.19046, 0.12568, -0.14215], [-0.06566, 0.27757, 0.12861],
  [0.15196, 0.04204, 0.1514], [-0.07664, 0.16851, -0.22876], [0.12246, 0.22196, 0.13588],
  [-0.00258, 0.06597, 0.06461], [-0.15711, 0.16509, 0.13471], [-0.14051, 0.15334, 0.19183],
  [0.11196, 0.24453, -0.12431], [0.18211, 0.0141, -0.01135], [0.1229, -0.06576, -0.04756],
  [0.05998, 0.0605, 0.18804], [0.08037, 0.15659, -0.23205], [0.16941, 0.17271, -0.16623],
  [-0.01647, 0.02511, 0.12562], [0.18663, 0.09213, -0.15936], [0.07249, 0.01941, -0.0247],
  [0.04641, 0.2244, -0.19146], [-0.00627, 0.13853, -0.20997], [0.13405, -0.06731, -0.13503],
  [-0.1052, 0.22201, -0.16794], [-0.01673, -0.06445, -0.13326], [0.01059, 0.30341, 0.01667],
  [0.12997, 0.17657, 0.1435], [0.09438, 0.25528, 0.11284], [0.20884, 0.13373, -0.09386],
  [0.06745, 0.15712, 0.25685], [0.18068, 0.1647, -0.15196], [0.17031, 0.08244, 0.11571],
  [-0.18807, 0.02436, 0.0445], [-0.1759, 0.00498, -0.11205], [0.06781, -0.02869, -0.03426],
  [0.15768, 0.1284, -0.19435], [0.16602, -0.01223, 0.0081], [-0.06732, 0.2893, -0.04671],
  [0.11942, 0.12111, -0.22043], [0.14386, 0.25324, -0.0698], [0.19968, 0.12916, -0.13063],
  [-0.06392, 0.22961, 0.20814], [0.16289, 0.19858, 0.06491], [0.07576, 0.16197, 0.24872],
  [0.12089, 0.00797, -0.21265], [0.04298, 0.2966, -0.00476], [0.14733, 0.21597, 0.07321],
  [-0.14591, 0.22458, 0.06055], [-0.14684, 0.1389, -0.18984], [-0.21569, 0.10683, -0.09003],
  [-0.01847, 0.00762, -0.25402], [-0.15799, 0.117, 0.00692], [-0.03917, 0.24044, -0.17098],
  [0.00638, 0.03628, 0.02047], [-0.09165, -0.07746, -0.07898], [0.13004, 0.24603, -0.10296],
  [-0.11, 0.01482, -0.22261], [-0.17915, 0.22034, -0.04899], [0.16068, -0.05848, -0.1019],
  [0.00094, 0.04496, 0.00304], [-0.12381, 0.13787, -0.22365], [-0.05888, -0.04857, -0.03549],
  [-0.01391, 0.05002, 0.0296], [-0.02142, 0.30729, 0.03907], [0.18938, 0.1593, 0.0578],
  [-0.01763, -0.04814, 0.00205], [0.15621, -0.01758, 0.03884], [0.0747, 0.04404, -0.24555],
  [-0.15927, 0.03726, -0.18183], [0.10904, 0.25234, 0.01934], [0.15172, 0.24733, -0.06345],
  [0.09207, 0.19317, -0.20152], [-0.12093, 0.25058, -0.02967], [0.17752, 0.21592, -0.1095],
  [-0.05814, -0.07723, -0.12819], [-0.03279, -0.02013, 0.01507], [0.15042, 0.07353, 0.13425],
  [0.19388, 0.03055, -0.05575], [-0.15944, 0.00964, 0.09952], [-0.15962, 0.23972, -0.05426],
  [0.07039, 0.25833, 0.15941], [0.03583, 0.22704, 0.22833], [-0.20285, 0.04642, -0.00353],
  [0.19295, 0.0459, 0.03426], [-0.10641, -0.08451, -0.12089], [0.10215, 0.27621, -0.02179],
  [-0.19419, 0.06123, 0.0528], [-0.16823, -0.06007, -0.1198], [0.14947, 0.01645, -0.1793],
  [-0.17615, 0.01323, -0.11935], [0.07702, -0.08075, -0.10367], [0.00832, 0.00179, -0.24896],
  [-0.10793, -0.08345, -0.14448], [-0.06218, 0.17153, -0.23232], [-0.08339, 0.28558, 0.04576],
  [0.04336, -0.04582, -0.02248], [-0.20067, 0.03816, 0.016], [0.12912, 0.0013, -0.19038],
  [-0.14323, 0.02685, -0.20237], [0.07655, 0.28863, 0.03401], [0.14722, 0.21678, 0.07254],
  [0.20304, 0.1518, -0.01399], [-0.18578, 0.02947, -0.11169], [0.00708, -0.11311, -0.05264],
  [-0.1165, 0.2612, 0.04039], [-0.04042, 0.28348, -0.12109], [-0.10282, 0.12065, 0.24901],
  [0.15754, 0.12192, 0.16529], [0.09658, 0.1006, 0.25416], [-0.15737, 0.03128, 0.13639],
  [-0.07759, 0.28058, 0.02148], [0.04765, 0.08252, -0.26322], [0.12574, -0.05135, -0.16513],
  [-0.16001, 0.10746, -0.17711], [-0.04421, 0.29527, 0.07712], [-0.13554, 0.149, -0.20972],
  [0.14137, 0.16474, 0.17989], [-0.04943, -0.02375, 0.00392], [-0.16314, -0.0114, 0.03183],
  [-0.13608, 0.17869, 0.17596], [-0.12325, 0.24294, 0.0105], [0.09825, 0.00727, 0.14811],
  [0.12911, -0.00143, 0.13839], [-0.02953, 0.19319, -0.21769], [-0.04846, 0.27953, -0.09133],
  [0.20138, 0.06394, -0.09001], [0.01398, 0.05147, 0.02823], [0.10196, 0.25408, 0.10851],
  [-0.17552, -0.0319, -0.13643], [0.07552, 0.18744, -0.21334], [0.20022, 0.03837, 0.0198],
  [-0.19463, 0.12762, -0.01775], [0.15683, -0.05777, -0.11252], [0.16608, 0.21387, 0.00996],
  [0.21913, 0.10515, -0.04166], [0.05698, -0.0231, -0.01069], [-0.16902, 0.19379, 0.05225],
  [-0.14201, 0.20936, 0.09126], [0.05634, 0.27637, 0.14263], [0.15653, -0.00708, -0.0611],
  [-0.18509, 0.11584, -0.17304], [0.0175, 0.02537, 0.07594], [-0.08853, 0.24885, 0.15159],
  [-0.10818, 0.11551, 0.24807], [0.1051, 0.24255, -0.13354], [0.14638, 0.07669, 0.1892],
  [-0.00302, 0.0767, -0.25635], [0.05684, -0.02446, -0.01119], [0.01333, 0.27921, -0.13091],
  [-0.10039, -0.07305, -0.17445], [0.20502, 0.15944, -0.03251], [-0.04938, 0.14304, -0.25443],
  [-0.15655, 0.20027, 0.07433], [-0.05593, 0.24774, -0.16057], [-0.19401, 0.13244, 0.01386],
  [0.02431, 0.30681, -0.05421], [-0.0437, -0.00062, 0.01462], [0.08095, 0.25113, -0.13532],
  [-0.08872, -0.05371, -0.19792], [0.19861, 0.16039, -0.11123], [-0.07537, -0.08769, -0.08405],
  [0.05086, 0.2421, -0.16791], [-0.17645, 0.22215, -0.09135], [0.07768, 0.0145, -0.01155],
  [-0.03209, -0.00594, -0.24546], [0.10282, -0.07689, -0.05898], [0.10651, 0.24443, -0.11492],
  [0.19206, 0.0532, -0.13267], [0.03968, -0.07772, -0.07384], [0.05383, 0.01348, 0.01513],
  [-0.04215, 0.03139, 0.1203], [-0.13091, 0.07196, -0.21135], [0.07209, -0.08139, -0.16635],
  [0.0547, -0.02846, -0.20755], [0.18922, 0.06428, 0.08433], [-0.05726, -0.06069, -0.06245],
  [0.11349, 0.08883, 0.08354], [0.03793, 0.29522, 0.03005], [0.1931, 0.12147, -0.14163],
  [-0.01604, 0.27207, -0.14585], [0.17768, 0.00824, 0.05027], [0.16882, 0.035, 0.1152],
  [-0.09685, 0.13042, -0.24145], [0.12701, 0.0087, 0.14362], [0.11443, -0.04102, -0.03892],
  [-0.1131, -0.01495, 0.09649], [0.14573, 0.10902, -0.21496], [-0.03824, -0.08235, -0.07119],
  [0.11328, -0.01121, 0.13126], [0.05304, 0.02395, -0.01387], [-0.18274, 0.11876, 0.07917],
  [-0.05377, 0.00861, -0.01845], [0.02157, 0.21176, 0.23827], [-0.18315, 0.19956, -0.00061],
  [-0.17476, 0.11, -0.17894], [-0.18423, 0.04518, 0.07624], [-0.10588, -0.00914, -0.20452],
  [-0.07064, 0.28524, 0.07596], [-0.07773, 0.11132, -0.24536], [-0.0827, 0.02273, -0.03093],
  [-0.00678, 0.00829, 0.05507], [-0.06645, -0.02322, 0.09419], [0.00618, 0.01138, -0.17114],
  [0.01851, 0.00606, -0.25358], [-0.18477, 0.05769, 0.09674], [0.00655, 0.30237, -0.02378],
  [-0.13173, 0.17186, 0.19441], [-0.15781, 0.17296, 0.12703], [0.01662, 0.29298, 0.11703],
  [-0.01012, 0.0475, 0.02134], [-0.02527, 0.29408, -0.01419], [-0.04826, 0.15546, 0.26869],
  [0.15727, 0.1177, 0.15918], [0.03315, -0.05736, -0.03113], [-0.15291, 0.07696, -0.19147],
  [-0.19838, 0.14371, -0.12299], [-0.13216, -0.07629, -0.06392], [0.16914, 0.03379, 0.11204],
  [0.1066, 0.17292, -0.20653], [-0.13785, 0.25144, -0.02014], [-0.1238, -0.03692, -0.03194],
  [-0.00189, 0.11738, -0.0954], [0.16757, 0.20856, -0.00999], [-0.1067, 0.21977, 0.18407],
  [0.20144, 0.08731, -0.131], [0.06044, 0.01523, -0.00007], [-0.19492, 0.19537, -0.03823],
  [-0.18384, 0.00684, -0.06086], [0.14634, -0.0547, -0.13823], [0.19894, 0.14481, -0.00085],
  [-0.02391, 0.02829, 0.01899], [0.11262, 0.24499, -0.11578], [-0.09808, 0.2771, -0.03583],
  [-0.01054, 0.21976, 0.22393], [0.21086, 0.10312, 0.01698], [0.0675, 0.21376, -0.19138],
  [-0.02254, -0.05836, -0.15069], [-0.17406, -0.04247, -0.13312], [0.18202, 0.11363, -0.1769],
  [0.16283, 0.21115, -0.00896], [0.0499, 0.28699, -0.07296], [0.01237, 0.16699, -0.22019],
  [0.08949, 0.25696, -0.12905], [0.12497, 0.05753, 0.14566], [0.16991, -0.00413, -0.05887],
  [-0.17537, 0.18839, -0.14321], [-0.07835, 0.23302, -0.15644], [-0.18918, 0.10611, -0.16546],
  [-0.02521, 0.29666, -0.09955], [-0.10407, 0.25605, 0.07756], [0.11271, -0.08056, -0.12933],
  [0.13443, 0.24907, -0.03805], [0.18616, 0.04829, 0.04408], [-0.13008, 0.17936, 0.18998],
  [-0.10516, -0.05276, -0.19281], [0.13933, -0.01331, 0.00202], [0.19834, 0.05373, -0.0051],
  [0.10853, 0.23037, -0.15601], [0.18266, 0.02612, -0.08086], [-0.14154, -0.01124, 0.08091],
  [0.00026, 0.0565, 0.06514], [0.04517, 0.29245, 0.06881], [0.02349, -0.07034, -0.03003],
  [0.08474, 0.28295, -0.07247], [0.19876, 0.05333, -0.12124], [-0.03419, 0.02845, 0.10497],
  [0.07583, 0.09101, 0.25616], [0.01191, 0.082, 0.24648], [-0.20439, 0.16588, -0.0329],
  [-0.17423, 0.18408, 0.05581], [-0.03194, -0.08478, -0.07699], [0.02304, 0.28045, 0.15802],
  [-0.18447, 0.17313, 0.04849], [-0.19878, 0.14665, -0.12073], [0.07557, -0.05948, -0.19331],
  [0.0036, 0.28554, 0.00161], [0.20102, 0.06291, -0.04982], [-0.1355, 0.01169, -0.2017],
  [0.07532, 0.25609, 0.14209], [0.20228, 0.08259, -0.12158], [0.08122, 0.06365, -0.25399],
  [0.15575, 0.1528, -0.18474], [-0.04697, -0.05624, -0.03498], [0.14991, 0.22059, 0.02291],
  [0.1146, 0.10856, 0.23267], [0.07638, 0.26599, -0.12695], [-0.02402, 0.04152, -0.27236],
  [0.03904, 0.2242, 0.22856], [0.17979, 0.02394, -0.10901], [-0.10785, 0.09385, -0.23953],
  [-0.16812, 0.20752, 0.01595], [-0.05532, 0.26892, -0.13808], [-0.16526, 0.21662, 0.00552],
  [-0.12146, 0.23216, 0.11529], [-0.00512, -0.04128, 0.00318], [0.11481, 0.21985, 0.16454],
  [-0.15838, 0.22317, -0.10912], [0.12595, 0.00267, -0.0074], [0.15266, -0.01646, 0.0057],
  [-0.19852, 0.18801, -0.04316], [-0.05264, 0.21414, 0.23012], [-0.21786, 0.10099, -0.00887],
  [0.00326, 0.03777, 0.0152], [0.02382, -0.00247, 0.01887], [-0.13, -0.02883, -0.18794],
  [-0.01203, -0.06644, -0.1262], [-0.07664, 0.0166, -0.24814], [-0.12503, 0.22428, 0.07975],
  [-0.06234, 0.28633, -0.05825], [-0.12845, 0.23533, 0.01616], [-0.06238, 0.24283, 0.19398],
  [-0.12116, 0.17854, 0.20498], [-0.01088, 0.30517, 0.06242], [0.08807, -0.07312, -0.17154],
  [0.20455, 0.1399, -0.10572], [-0.02563, 0.02409, 0.01914], [-0.07891, -0.03848, -0.20377],
  [-0.08524, 0.26419, 0.1069], [-0.18493, 0.08393, 0.08901], [0.02792, 0.02384, 0.01731],
  [-0.00742, 0.29659, 0.00978], [0.0461, -0.00119, -0.19066], [0.08852, -0.04982, -0.19289],
  [-0.00228, 0.05116, 0.06635], [0.16647, -0.03174, -0.11682], [-0.00104, 0.00373, -0.23968],
  [-0.07494, -0.05697, -0.19903], [0.19544, 0.04136, 0.03485], [-0.03024, 0.14426, -0.25274],
  [0.14501, 0.14548, 0.17557], [0.19336, 0.13475, 0.00646], [-0.08763, 0.22997, 0.17159],
  [-0.15552, 0.21845, 0.01899], [-0.02105, 0.2924, -0.11042], [0.1881, 0.07074, 0.08719],
  [-0.17, -0.00161, -0.07228], [-0.17802, 0.18732, -0.13977], [-0.13877, -0.06859, -0.05431],
  [0.17823, 0.04088, -0.15238], [-0.10265, 0.20276, -0.18474], [0.12338, 0.25187, 0.05191],
  [-0.13138, 0.20958, 0.12095], [-0.03786, -0.05428, -0.01281], [0.10585, 0.04167, -0.23459],
  [0.16266, 0.20606, -0.13479], [-0.21201, 0.08681, -0.00976], [-0.11437, 0.27059, -0.05095],
  [0.03998, 0.15427, -0.24364], [-0.00192, 0.18866, -0.02135], [-0.15296, 0.01781, 0.12998],
  [-0.0332, -0.07309, -0.12786], [0.06423, 0.27296, -0.12286], [0.18074, 0.20887, -0.11159],
  [0.12569, 0.24427, 0.00878], [-0.16474, 0.10599, 0.08263], [-0.18038, 0.10728, 0.06265],
  [-0.13071, 0.24403, 0.05885], [-0.10389, 0.00548, -0.03146], [-0.12573, -0.02491, 0.02834],
  [-0.08452, 0.21153, -0.17532], [0.02348, -0.05706, -0.18836], [0.04898, -0.0001, 0.12203],
  [-0.09556, -0.03474, -0.2022], [-0.17478, -0.04634, -0.12582], [0.19835, 0.05778, 0.03488],
  [0.20242, 0.06236, 0.03757], [0.19073, 0.06102, 0.07967], [-0.17645, 0.19642, -0.12041],
  [-0.00338, 0.15226, -0.08777], [-0.17384, 0.13543, 0.12729], [0.09647, 0.26707, -0.11018],
  [-0.00606, 0.27872, -0.1149], [0.15288, -0.00682, -0.06882], [0.2019, 0.04618, 0.00348],
  [-0.10007, 0.26961, -0.10102], [0.16767, 0.1071, 0.04032], [0.10641, 0.22718, -0.16127],
  [0.07046, -0.015, -0.01835], [-0.13166, 0.11915, -0.01129], [0.15676, 0.05024, -0.18951],
  [-0.14928, 0.2399, -0.01247], [0.05401, -0.08721, -0.10899], [0.01955, 0.11601, -0.25048],
  [0.01375, 0.03023, 0.21738], [0.20262, 0.03727, -0.00519], [-0.00472, 0.22479, -0.18224],
  [0.20265, 0.07086, -0.01203], [0.02611, 0.15702, -0.24251], [0.2029, 0.06117, -0.03015],
  [-0.17917, -0.00493, -0.02638], [-0.14362, 0.03051, -0.20262], [0.16607, 0.01037, 0.09531],
  [-0.05151, -0.03411, -0.00606], [0.20045, 0.08256, -0.10145], [-0.0268, 0.10861, -0.26468],
  [0.15311, 0.11976, 0.18027], [0.09584, -0.07561, -0.05606], [0.09842, -0.01425, 0.12892],
  [0.06535, 0.1051, 0.26531],
];
// True per-point outward surface normals from the same raycast (hit.face.normal, baked
// through BRAIN_TRANSFORM rotation — identity here, so just renormalized after scale).
// Used at runtime to push each dot outward by an amount proportional to its own rendered
// radius, so bigger dots always clear the surface regardless of local fold concavity —
// a "point minus approximate center" direction was tried first and was NOT reliable here
// since the brain surface is highly non-convex (sulci/gyri folds mean the vector from a
// point to the overall centroid often does not match the true local outward direction).
const NEURAL_SURFACE_NORMALS: [number, number, number][] = [
  [0.92917, 0.36599, -0.05187], [-0.97719, -0.21153, -0.01895], [-0.54526, -0.69108, 0.47445],
  [0.16287, 0.72077, 0.67377], [0.90669, 0.18146, 0.38077], [-0.08777, -0.96809, -0.23473],
  [0.852, -0.16496, 0.49688], [0.72365, -0.0504, 0.68832], [-0.00794, 0.69076, 0.72304],
  [-0.51698, 0.73293, 0.44221], [0.52831, -0.24447, -0.8131], [-0.79391, 0.522, 0.31181],
  [0.91815, 0.03938, 0.39427], [-0.70299, 0.01253, -0.71109], [-0.04655, -0.99804, 0.04179],
  [0.75367, 0.22514, 0.61749], [0.37264, -0.7169, -0.58923], [0.97442, 0.01738, 0.22405],
  [0.3945, 0.82194, 0.41083], [0.66255, 0.43843, -0.60729], [-0.90195, -0.41899, 0.10453],
  [0.3393, 0.62051, -0.707], [0.2979, 0.71361, -0.63405], [0.61622, 0.60623, 0.50275],
  [0.03559, -0.51181, 0.85836], [-0.58184, -0.31726, -0.74887], [0.67602, 0.06179, 0.73429],
  [-0.87194, 0.47616, -0.11397], [-0.98099, 0.05025, 0.18743], [0.78729, 0.45166, 0.41974],
  [0.20204, 0.46796, 0.86034], [-0.14941, -0.71661, 0.68128], [-0.24549, 0.6436, 0.72492],
  [-0.31698, 0.94703, 0.0515], [0.55015, 0.3953, -0.73558], [0.77967, -0.60993, 0.14177],
  [-0.49865, -0.54402, -0.67483], [0.16308, 0.27312, 0.94806], [-0.91081, 0.4118, -0.02906],
  [-0.66189, 0.70471, 0.25549], [-0.38348, -0.88425, -0.26655], [-0.34711, -0.56153, 0.75113],
  [0.58432, -0.17739, 0.7919], [-0.09283, 0.97295, -0.21156], [0.97145, -0.18061, 0.15383],
  [-0.56612, 0.77484, -0.28128], [0.98396, 0.17708, -0.02177], [-0.95222, 0.29477, -0.07991],
  [-0.04851, -0.97162, -0.23153], [-0.09127, -0.93856, -0.33282], [-0.27923, 0.74319, -0.60803],
  [-0.69307, 0.70995, 0.12501], [-0.27801, -0.71734, -0.63886], [0.67701, 0.69142, -0.25217],
  [-0.1794, 0.01761, -0.98362], [-0.91243, -0.30866, 0.26869], [-0.62704, 0.70191, 0.33785],
  [-0.0448, -0.15527, 0.98686], [-0.71347, -0.25452, 0.65282], [-0.44352, 0.80178, 0.40055],
  [0.44563, -0.79456, -0.41242], [-0.59911, -0.80003, 0.03193], [-0.57845, 0.77512, 0.25411],
  [-0.6865, 0.6973, -0.20613], [0.56089, 0.17703, 0.80874], [-0.9381, 0.03788, -0.34429],
  [0.80104, 0.44923, -0.39564], [0.37628, -0.88024, -0.28914], [0.92551, 0.04051, 0.37656],
  [-0.89748, 0.41835, -0.13966], [0.35771, -0.93372, 0.01456], [0.04026, -0.99519, -0.08929],
  [-0.7198, -0.61315, -0.32548], [0.8879, 0.36896, -0.27479], [-0.78089, 0.37312, 0.50099],
  [0.95339, 0.26244, -0.1489], [-0.19163, -0.96358, -0.18652], [-0.0334, -0.99943, 0.00478],
  [-0.5797, 0.76575, -0.27855], [0.79608, -0.22105, 0.56338], [-0.89221, 0.44435, 0.08066],
  [-0.57903, -0.79002, 0.20145], [0.33528, 0.03283, -0.94155], [0.60957, 0.23115, -0.75828],
  [-0.92324, 0.01077, 0.38407], [0.80279, -0.59435, -0.04767], [0.30355, 0.52628, 0.79429],
  [0.56056, 0.77078, 0.30276], [0.05271, -0.39477, 0.91726], [0.50628, 0.1905, 0.84106],
  [0.80337, -0.47626, -0.35745], [0.55731, -0.32582, 0.7637], [-0.81421, 0.02307, -0.58012],
  [-0.90152, -0.21699, -0.3744], [0.71294, -0.38902, 0.58342], [0.84756, 0.09226, -0.52262],
  [0.93671, 0.3278, -0.12298], [0.27387, -0.96141, 0.02621], [0.05155, 0.94034, -0.33632],
  [0.91449, 0.15868, 0.37219], [-0.95093, 0.30115, 0.07095], [0.04934, -0.94702, -0.31735],
  [0.28715, 0.72815, -0.62237], [0.5057, 0.81169, -0.29226], [0.89771, 0.14316, 0.41667],
  [-0.64611, 0.7212, 0.24983], [-0.37395, -0.86174, -0.34288], [-0.09144, 0.79783, -0.59591],
  [0.60123, -0.09003, -0.79399], [-0.51735, 0.8197, 0.24584], [-0.46372, 0.88333, -0.06848],
  [-0.68876, -0.72357, -0.04539], [-0.53389, -0.84141, 0.08361], [0.50075, 0.03226, -0.86499],
  [-0.82304, 0.33851, -0.4561], [-0.63088, 0.7515, -0.193], [-0.02903, -0.72358, 0.68963],
  [0.83243, -0.55342, 0.02804], [-0.74686, -0.17987, -0.6402], [-0.27551, -0.31531, 0.90811],
  [-0.99169, 0.11472, 0.05818], [-0.54058, 0.51462, 0.66554], [-0.03479, -0.95791, -0.28494],
  [-0.90575, 0.05074, 0.42077], [0.80711, 0.09238, -0.58312], [-0.85406, -0.51053, 0.0997],
  [-0.11321, -0.94417, 0.30941], [0.45087, 0.56838, -0.68823], [0.31884, -0.92843, 0.19067],
  [0.13617, 0.15418, 0.97861], [-0.72923, -0.48016, 0.48751], [-0.99122, 0.10769, -0.0767],
  [0.21142, -0.47937, 0.85177], [0.88661, -0.41845, -0.19702], [-0.16225, 0.59765, 0.78517],
  [-0.94619, 0.19687, -0.25686], [0.33229, -0.93558, 0.11945], [0.18143, 0.65508, -0.73345],
  [-0.00107, -0.99812, 0.06121], [-0.84467, -0.53366, -0.04176], [0.90276, -0.03696, 0.42855],
  [0.62483, 0.7667, 0.14751], [0.26198, 0.95741, -0.12138], [0.61076, 0.65069, 0.45119],
  [-0.68, 0.69473, -0.23441], [0.82034, -0.57007, -0.04541], [-0.31579, 0.66298, -0.67878],
  [-0.63812, -0.75326, 0.15937], [0.65792, -0.69159, 0.29808], [0.99548, -0.00936, 0.09448],
  [0.55731, -0.32582, 0.7637], [-0.56437, 0.71803, 0.40734], [0.24166, 0.96666, 0.08472],
  [0.73124, 0.44574, -0.51634], [-0.85901, 0.51088, 0.03325], [-0.46292, 0.83359, 0.30139],
  [0.53267, -0.26541, 0.80363], [-0.42896, 0.44603, -0.78552], [0.84624, 0.51136, 0.14964],
  [-0.12044, 0.11501, 0.98604], [-0.70969, 0.47513, 0.52018], [-0.85632, 0.27312, 0.43832],
  [-0.054, 0.99371, -0.09806], [0.93246, 0.02059, 0.36067], [0.32879, -0.77983, 0.53269],
  [0.55197, -0.83285, 0.04113], [0.41466, 0.3489, -0.84043], [0.76216, 0.32388, -0.56055],
  [-0.21659, -0.97625, -0.00391], [0.26073, -0.34181, -0.90288], [-0.22535, -0.94401, -0.24098],
  [0.66875, 0.01519, -0.74333], [0.802, 0.43944, -0.40458], [0.91152, 0.15075, -0.38262],
  [-0.16441, 0.75383, -0.63617], [-0.06506, -0.97752, -0.20057], [0.03787, 0.76666, -0.64094],
  [0.16236, 0.84203, 0.51441], [0.06982, 0.99407, 0.08332], [0.96347, 0.21785, -0.1558],
  [0.67883, 0.10228, 0.72714], [0.8895, 0.16089, -0.42768], [0.55037, 0.57615, 0.60427],
  [-0.8183, -0.35949, 0.4485], [-0.72517, -0.6001, -0.33764], [0.19961, -0.9795, -0.02701],
  [0.9252, 0.29275, -0.24146], [0.45663, -0.88965, -0.00265], [-0.42179, 0.81639, -0.39447],
  [-0.04462, -0.51196, -0.85785], [0.508, 0.85861, -0.06874], [0.83116, 0.39649, -0.38984],
  [-0.41791, 0.65014, 0.63456], [0.84773, 0.43519, 0.30326], [-0.40958, 0.48433, 0.77309],
  [0.49149, -0.53707, -0.68556], [-0.6419, 0.70533, 0.3008], [0.57575, 0.43242, 0.69392],
  [-0.8109, 0.57676, 0.09893], [-0.50197, 0.84978, -0.16091], [-0.98396, 0.17706, -0.02167],
  [0.13027, -0.27927, -0.95134], [-0.46998, 0.87044, 0.14648], [0.02311, 0.96871, -0.2471],
  [-0.29583, -0.22838, 0.92754], [-0.80212, -0.58759, -0.10651], [-0.07253, 0.75797, -0.64824],
  [-0.26967, -0.0487, -0.96172], [-0.86826, 0.49594, -0.01271], [0.8253, -0.45828, -0.32994],
  [-0.50791, -0.30857, 0.80424], [-0.48086, 0.30902, -0.82054], [-0.50129, -0.79627, 0.33862],
  [-0.12897, -0.98896, -0.07296], [0.13854, 0.96966, 0.20139], [0.78093, 0.37306, 0.50098],
  [0.26949, -0.60313, 0.75074], [0.72204, -0.68715, 0.08051], [-0.42659, -0.6321, -0.6469],
  [-0.86524, -0.21982, -0.4506], [0.32421, 0.82004, -0.47161], [0.70628, 0.7076, 0.02158],
  [0.32792, 0.61846, -0.71413], [-0.01708, 0.84339, -0.53703], [0.74923, 0.58806, -0.30469],
  [-0.29328, -0.33795, -0.8943], [-0.37741, -0.33055, 0.86504], [0.81929, -0.20742, -0.53454],
  [0.66819, -0.7222, -0.17873], [-0.58934, -0.19974, 0.78281], [-0.51302, 0.82615, 0.23299],
  [0.74818, 0.54508, 0.3783], [0.18948, 0.68596, 0.70254], [-0.97105, 0.18018, -0.15684],
  [0.79726, 0.484, 0.36072], [-0.68374, -0.50392, -0.52779], [0.64439, 0.74993, 0.14957],
  [-0.71057, -0.64531, -0.28047], [-0.86527, 0.40726, -0.29231], [0.56053, -0.79741, 0.22348],
  [-0.8633, -0.11931, -0.49039], [-0.19071, -0.97635, 0.10182], [-0.48829, -0.23557, -0.84029],
  [-0.1244, -0.98689, -0.10278], [-0.23788, 0.50069, -0.8323], [-0.59689, 0.80187, -0.02702],
  [0.69525, -0.4997, 0.51666], [-0.99356, -0.02178, 0.11119], [0.58295, -0.79541, 0.16579],
  [-0.76555, -0.21699, -0.60568], [0.46845, 0.83628, -0.28493], [0.74645, 0.48984, 0.4504],
  [0.94458, -0.18415, -0.27175], [-0.56864, -0.82253, -0.00998], [-0.22603, -0.51598, 0.82624],
  [-0.54703, 0.83239, -0.08881], [-0.51345, 0.82364, -0.24083], [-0.6061, 0.53829, 0.58557],
  [0.91662, -0.11165, 0.38385], [0.02275, -0.10497, 0.99422], [-0.71725, -0.57402, 0.39503],
  [-0.33372, 0.6196, -0.71044], [0.02427, 0.40978, -0.91186], [0.41276, 0.49328, -0.76571],
  [-0.02066, -0.52752, -0.84929], [-0.2632, 0.63602, -0.7254], [-0.44704, 0.50681, -0.73709],
  [0.87657, 0.37273, 0.30445], [-0.50648, -0.36223, 0.78247], [-0.69348, -0.70846, 0.131],
  [-0.76437, 0.59497, 0.2485], [-0.32595, 0.4587, 0.82665], [0.32133, -0.22469, 0.91992],
  [0.50663, -0.57934, 0.6385], [-0.21192, -0.16545, -0.96318], [-0.90116, 0.42018, 0.10663],
  [0.96896, 0.12936, -0.21065], [0.12422, -0.98381, -0.12915], [0.40466, 0.89789, 0.17337],
  [-0.896, -0.18267, -0.40474], [0.19062, 0.5751, -0.79556], [0.9828, -0.07574, 0.16844],
  [-0.14683, 0.9606, 0.236], [0.8253, -0.45828, -0.32994], [0.69224, 0.64585, 0.322],
  [0.9781, 0.20705, 0.02117], [0.87077, -0.06771, 0.487], [-0.84171, 0.50095, 0.20143],
  [-0.95721, 0.22982, -0.17586], [0.3783, 0.86177, 0.338], [0.09487, -0.99214, -0.08158],
  [-0.79584, 0.28223, -0.53571], [-0.00326, -0.11057, 0.99386], [-0.02201, 0.95356, 0.30038],
  [-0.58395, 0.36732, 0.72393], [-0.04862, 0.95542, -0.29123], [0.4847, -0.34965, 0.80176],
  [0.87621, 0.00201, -0.48192], [0.98178, -0.17705, 0.06898], [-0.09186, 0.90262, -0.42052],
  [-0.35466, -0.78569, -0.50685], [0.9997, 0.01708, 0.0174], [-0.33894, 0.59346, -0.73002],
  [-0.67862, 0.39877, 0.61681], [0.18268, 0.79687, -0.57586], [-0.71289, -0.69196, -0.11393],
  [0.13079, 0.97155, -0.19744], [-0.38775, 0.03403, 0.92114], [0.27817, 0.0842, -0.95683],
  [-0.23195, -0.17147, -0.9575], [0.67323, 0.20117, -0.71155], [-0.15555, -0.9869, -0.0428],
  [-0.04632, 0.91779, -0.39435], [-0.82761, 0.5613, 0.00047], [0.09251, -0.92498, -0.36858],
  [-0.33469, -0.81612, -0.4711], [0.6123, -0.75435, 0.23672], [0.60731, 0.34301, -0.71661],
  [0.67859, -0.40896, -0.61014], [-0.71714, -0.48158, 0.50378], [-0.60278, -0.74681, -0.28094],
  [-0.43824, -0.89187, 0.11185], [-0.63048, 0.69929, -0.33687], [0.21982, -0.86189, -0.45698],
  [0.42631, -0.81763, -0.38697], [0.95479, 0.003, 0.29726], [0.54194, -0.80111, 0.254],
  [0.85635, -0.51463, 0.04256], [-0.30654, 0.76599, -0.56506], [0.80282, 0.587, 0.10447],
  [0.46798, 0.74491, -0.47551], [0.81769, -0.57166, 0.06771], [0.93532, -0.2795, 0.2169],
  [-0.27576, 0.2063, -0.93883], [0.14879, -0.17082, 0.974], [0.39811, -0.60458, 0.68992],
  [-0.76484, -0.15334, 0.6257], [0.61971, -0.08577, -0.78013], [-0.66772, 0.08771, -0.73923],
  [0.08054, -0.91666, 0.39146], [-0.60194, -0.77233, -0.20292], [-0.70542, -0.54002, 0.45909],
  [-0.92363, 0.33562, -0.1851], [-0.41629, 0.53067, 0.7383], [-0.71225, 0.66826, 0.2148],
  [-0.21059, -0.56061, -0.80085], [-0.51468, -0.85737, -0.00525], [-0.45253, -0.79633, -0.40134],
  [-0.29184, 0.80417, -0.51782], [0.36199, -0.1902, -0.91257], [-0.5462, -0.78445, -0.29376],
  [-0.03388, 0.0895, 0.99541], [0.73794, -0.51562, 0.43541], [-0.74261, 0.26538, -0.6149],
  [-0.13026, -0.27928, -0.95133], [-0.9292, -0.04771, 0.36648], [-0.34035, 0.55126, -0.76176],
  [-0.82327, 0.41047, 0.3921], [-0.81926, 0.37193, 0.43643], [-0.2579, 0.90331, 0.34281],
  [0.55731, -0.32582, 0.7637], [0.28857, 0.68388, 0.6701], [-0.15133, 0.26932, 0.95109],
  [0.74216, -0.57484, 0.3446], [0.64195, -0.75637, 0.12572], [-0.03895, 0.42081, -0.90631],
  [-0.9452, 0.07597, -0.31754], [-0.92544, -0.37592, 0.04731], [0.98069, -0.19483, -0.01691],
  [0.85126, 0.16894, -0.49681], [-0.64794, 0.76086, -0.03554], [-0.45135, -0.4311, 0.78131],
  [0.78985, -0.05222, -0.61107], [0.26124, 0.67946, -0.68563], [-0.62099, 0.65721, 0.42714],
  [0.98988, 0.03633, -0.13721], [-0.366, -0.88698, -0.28162], [-0.78863, 0.54908, 0.27672],
  [-0.70838, -0.6953, -0.12148], [0.75856, -0.47907, -0.44167], [0.77579, -0.58631, -0.23324],
  [0.52127, -0.78358, -0.33806], [-0.02555, 0.99857, 0.04705], [-0.4814, 0.56885, -0.66683],
  [0.62889, 0.52811, 0.5706], [0.9338, 0.14461, 0.32728], [0.648, 0.48708, -0.58553],
  [-0.06149, -0.0935, -0.99372], [-0.09671, -0.98438, -0.14709], [0.5213, -0.33981, -0.7828],
  [0.1761, 0.84661, -0.50224], [0.37351, 0.52941, -0.76172], [-0.92281, 0.34353, -0.17436],
  [0.53737, 0.44691, -0.7152], [0.10902, -0.99077, 0.08053], [0.34277, -0.92058, -0.18717],
  [-0.76101, 0.45834, -0.45912], [-0.84214, 0.31892, -0.43484], [-0.8314, -0.18993, -0.5222],
  [-0.1104, 0.95145, -0.28732], [0.09382, 0.9396, -0.32916], [0.69622, -0.28243, -0.65994],
  [0.60137, 0.79062, 0.11519], [0.71395, 0.56801, 0.40944], [-0.80607, 0.43725, 0.39884],
  [-0.31205, -0.22896, -0.92206], [-0.29584, -0.7296, -0.61658], [0.7185, 0.67423, -0.1708],
  [0.19529, 0.8033, -0.56264], [0.99125, 0.08505, 0.10091], [-0.0847, -0.95036, -0.29941],
  [0.58391, -0.42945, 0.68892], [0.58675, 0.65108, 0.48148], [0.1943, -0.47821, 0.85648],
  [0.19192, 0.93234, -0.30644], [0.97995, -0.14627, -0.13531], [0.21456, -0.97531, -0.05232],
  [0.4929, -0.77736, 0.39085], [-0.65695, -0.6542, 0.37474], [-0.97775, 0.18418, 0.10043],
  [-0.82059, 0.47993, 0.31033], [-0.6073, 0.14038, -0.78197], [0.08664, 0.88121, 0.46473],
  [-0.8244, 0.54934, 0.13634], [-0.95072, 0.1366, -0.27835], [0.28333, -0.60378, -0.7451],
  [-0.37255, 0.5989, -0.70889], [0.76969, 0.53052, -0.35513], [-0.64107, -0.5293, -0.55575],
  [0.99456, 0.05755, -0.08684], [0.95614, 0.27825, 0.0915], [0.57888, -0.15639, -0.80027],
  [-0.24473, 0.39799, -0.88414], [-0.5374, -0.77214, 0.33913], [0.48625, 0.66074, 0.57182],
  [0.66445, 0.51728, 0.53938], [0.2831, 0.75603, -0.59015], [0.17553, -0.25956, -0.94964],
  [0.62517, 0.41796, 0.65915], [0.79953, 0.40408, -0.44439], [-0.6583, 0.03897, -0.75175],
  [-0.6602, 0.58454, 0.47165], [-0.25621, 0.83393, -0.4888], [-0.72234, 0.67026, 0.17024],
  [-0.59885, 0.79349, 0.10842], [-0.25308, -0.5953, 0.76261], [0.78503, 0.56177, 0.26103],
  [-0.81504, 0.40887, -0.41054], [0.4211, -0.87403, 0.24237], [0.06146, -0.90561, -0.41964],
  [-0.92161, 0.38222, 0.06738], [-0.35099, 0.73864, 0.57552], [-0.99826, -0.02631, 0.05269],
  [-0.72573, -0.66184, 0.18784], [0.42944, -0.02114, 0.90285], [-0.69978, -0.18625, -0.68965],
  [-0.00792, -0.97931, -0.20221], [-0.58582, -0.14714, -0.79697], [-0.84743, 0.14061, -0.51195],
  [-0.69849, 0.6255, -0.34766], [-0.01945, 0.66833, 0.74361], [-0.68046, 0.63847, 0.35962],
  [-0.66936, 0.36627, 0.64637], [0.06531, 0.9974, 0.03056], [0.34817, -0.74386, -0.57049],
  [0.93821, 0.08473, -0.33554], [0.02133, -0.56226, 0.82668], [-0.2835, -0.92615, 0.24875],
  [-0.9318, -0.04157, 0.36058], [-0.91124, 0.25865, 0.32052], [0.14102, -0.43692, 0.88838],
  [0.24294, 0.69691, -0.67476], [0.22676, 0.76615, -0.60132], [0.11173, -0.94847, -0.29652],
  [-0.19724, 0.68947, 0.69695], [0.95397, -0.081, -0.28875], [0.94419, -0.15449, -0.29093],
  [-0.15437, -0.59907, -0.78567], [0.90192, 0.21292, 0.37578], [0.4022, 0.65518, -0.63951],
  [0.97376, 0.10623, -0.20126], [0.66684, -0.68611, -0.29082], [0.36106, 0.93231, -0.02074],
  [-0.64197, 0.64434, 0.41557], [0.28959, 0.90597, -0.3088], [0.93811, 0.13418, 0.3193],
  [-0.53486, -0.81819, 0.21093], [-0.7523, 0.50391, -0.42441], [-0.95211, -0.15155, 0.26557],
  [0.84234, -0.26778, -0.46772], [-0.34655, 0.79573, -0.4967], [0.11406, 0.86729, 0.48456],
  [-0.49242, 0.0914, 0.86554], [-0.55299, -0.74132, 0.38034], [0.80209, 0.20332, -0.56153],
  [0.52639, 0.84586, -0.08619], [-0.89596, -0.39528, -0.20251], [-0.50273, 0.80098, 0.3251],
  [-0.62377, 0.70868, -0.32966], [0.25701, 0.96585, -0.03274], [-0.70346, -0.46824, 0.53468],
  [0.06783, -0.99466, -0.07775], [0.35352, 0.82193, -0.4466], [0.86899, 0.44946, -0.20699],
  [0.32598, 0.45865, 0.82666], [-0.47414, -0.8623, 0.17787], [-0.51376, -0.83619, 0.19194],
  [-0.36909, 0.73879, 0.56388], [0.50178, -0.8593, -0.0991], [0.18645, -0.90097, -0.39177],
  [-0.10743, 0.99411, 0.01422], [-0.15512, 0.60766, -0.7789], [-0.86519, -0.30499, 0.39804],
  [-0.29002, -0.36497, -0.8847], [-0.75785, 0.36409, -0.54139], [0.51326, -0.84556, 0.14695],
  [0.81074, -0.4791, 0.33638], [0.94797, -0.00959, 0.31821], [-0.74791, 0.64545, 0.155],
  [0.24677, 0.8364, -0.48942], [-0.98029, 0.09738, 0.17193], [0.5047, 0.74946, -0.42848],
  [0.89257, 0.40795, -0.19207], [0.10974, -0.99059, -0.08182], [0.95014, 0.278, 0.14123],
  [-0.44712, 0.80546, -0.38899], [0.48295, 0.86404, -0.14211], [0.16929, 0.79967, -0.57608],
  [0.16238, -0.83888, 0.51953], [-0.97923, -0.15424, 0.13157], [0.66854, -0.17057, -0.72385],
  [-0.69084, 0.69828, 0.18746], [-0.3932, -0.58785, -0.70699], [-0.49881, -0.28837, -0.81733],
  [0.00389, -0.93114, 0.36464], [0.98996, -0.11596, 0.08082], [0.90053, 0.38726, -0.19768],
  [0.4802, -0.84809, 0.22396], [-0.17272, -0.34767, -0.92157], [0.90101, 0.39393, 0.18164],
  [-0.67929, -0.73377, 0.01225], [-0.89622, 0.10836, -0.43017], [0.57149, -0.31511, 0.7577],
  [-0.70784, -0.43188, 0.55897], [0.29556, -0.76732, -0.56909], [0.47469, 0.67054, -0.57013],
  [0.95486, 0.21697, 0.20291], [-0.04918, -0.84261, 0.53627], [0.42077, -0.86564, 0.27132],
  [0.13962, 0.0257, 0.98987],
];
function seededRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// Farthest-point sampling: picks `count` indices out of `points` that are spread as evenly
// as possible — each new pick is whichever remaining point is farthest from every point
// already picked. This is what keeps the down-sampled set free of the clustering a purely
// random subset would have, so the triangulation below has no empty patches.
function farthestPointSample(points: THREE.Vector3[], count: number, seedIndex = 0): number[] {
  const n = points.length;
  const picked = [seedIndex];
  const bestDist = new Array(n).fill(Infinity);
  for (let i = 0; i < n; i++) bestDist[i] = points[i].distanceTo(points[seedIndex]);
  for (let s = 1; s < count; s++) {
    let bestI = -1, best = -Infinity;
    for (let i = 0; i < n; i++) {
      if (bestDist[i] > best) { best = bestDist[i]; bestI = i; }
    }
    picked.push(bestI);
    for (let i = 0; i < n; i++) {
      const d = points[i].distanceTo(points[bestI]);
      if (d < bestDist[i]) bestDist[i] = d;
    }
  }
  return picked;
}

// Builds the network by sampling directly from the REAL loaded brain mesh's vertex buffer
// (not the old pre-baked NEURAL_SURFACE_POINTS array) — every Nth vertex across all mesh
// parts, which guarantees every point sits exactly on the actual surface. Connects each
// sampled point to its nearest 5 (Euclidean distance, no cap) using a canonicalised Set for
// dedup — NOT a `j > i` skip: with true nearest-neighbour picks that isn't guaranteed
// symmetric (A's nearest-5 can include B without B's nearest-5 including A), so a raw `j > i`
// filter silently drops legitimate edges whenever the lower-index point wasn't the one that
// picked the connection. That silent edge loss is a likely contributor to the "disconnected
// fragments" look in earlier passes, so this keeps every genuinely-picked edge instead.
function buildMeshSampledNetwork(meshes: THREE.Mesh[]) {
  const rand = seededRandom(11);

  // Area-weighted random triangle sampling: pick a random triangle from the mesh (weighted by
  // its own area) then a random barycentric point within it — sampling the real, asymmetric
  // triangulation directly instead of a mathematically even set of directions (the old
  // Fibonacci-sphere-and-raycast method), so placement has no grid/mirror symmetry at all.
  meshes.forEach((m) => m.updateMatrixWorld(true));

  type Tri = { a: THREE.Vector3; b: THREE.Vector3; c: THREE.Vector3; na: THREE.Vector3; nb: THREE.Vector3; nc: THREE.Vector3; area: number };
  const triangles: Tri[] = [];
  let totalArea = 0;
  meshes.forEach((m) => {
    const geo = m.geometry;
    const posAttr = geo.attributes.position;
    const normAttr = geo.attributes.normal;
    const index = geo.index;
    const triCount = index ? index.count / 3 : posAttr.count / 3;
    const getIndex = (t: number, v: number) => (index ? index.getX(t * 3 + v) : t * 3 + v);
    for (let t = 0; t < triCount; t++) {
      const ia = getIndex(t, 0), ib = getIndex(t, 1), ic = getIndex(t, 2);
      const a = new THREE.Vector3().fromBufferAttribute(posAttr, ia);
      const b = new THREE.Vector3().fromBufferAttribute(posAttr, ib);
      const c = new THREE.Vector3().fromBufferAttribute(posAttr, ic);
      const na = normAttr ? new THREE.Vector3().fromBufferAttribute(normAttr, ia) : new THREE.Vector3(0, 1, 0);
      const nb = normAttr ? new THREE.Vector3().fromBufferAttribute(normAttr, ib) : new THREE.Vector3(0, 1, 0);
      const nc = normAttr ? new THREE.Vector3().fromBufferAttribute(normAttr, ic) : new THREE.Vector3(0, 1, 0);
      const area = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a)).length() * 0.5;
      if (area <= 0) continue;
      totalArea += area;
      triangles.push({ a, b, c, na, nb, nc, area });
    }
  });
  const cumulative = new Float64Array(triangles.length);
  let running = 0;
  triangles.forEach((tri, i) => { running += tri.area; cumulative[i] = running; });
  const pickTriangle = (): Tri => {
    const target = rand() * totalArea;
    let lo = 0, hi = triangles.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (cumulative[mid] < target) lo = mid + 1; else hi = mid;
    }
    return triangles[lo];
  };

  // TWO-LAYER distribution: the surface-wrapped network (dots + lines on the shell, as in the
  // previous design) PLUS interior nodes diffused evenly through the whole 3D volume, woven
  // together into one continuous network by the shared connection pass below.
  type P = { pos: THREE.Vector3; normal: THREE.Vector3 };

  const sampleSurface = () => {
    const tri = pickTriangle();
    const r1 = rand(), r2 = rand();
    const sq1 = Math.sqrt(r1);
    const u = 1 - sq1, v = r2 * sq1, w = 1 - u - v;
    const pos = new THREE.Vector3().addScaledVector(tri.a, u).addScaledVector(tri.b, v).addScaledVector(tri.c, w);
    const normal = new THREE.Vector3().addScaledVector(tri.na, u).addScaledVector(tri.nb, v).addScaledVector(tri.nc, w).normalize();
    return { pos, normal };
  };

  // Centroid of the surface (area-weighted sampling average ≈ mesh centroid).
  const centroid = new THREE.Vector3();
  {
    const CN = 1500;
    for (let i = 0; i < CN; i++) centroid.add(sampleSurface().pos);
    centroid.multiplyScalar(1 / CN);
  }

  // Layer 1 — surface network, restored exactly per the previous design: even Poisson spacing
  // across the shell, each point lifted slightly outward along its own normal.
  const N_SURF = 6000;
  const MIN_DIST_SURF = 0.12; // widened from 0.078 — ~55-60% fewer surface nodes, still evenly spread
  const surfacePts: P[] = [];
  for (let i = 0; i < N_SURF; i++) {
    const s = sampleSurface();
    const pos = s.pos.clone().addScaledVector(s.normal, 0.03);
    if (!surfacePts.some((f) => f.pos.distanceTo(pos) < MIN_DIST_SURF)) surfacePts.push({ pos, normal: s.normal });
  }

  // Layer 2 — interior volume, diffused EVENLY through the whole interior. The previous pass
  // clumped centrally because a uniform-random depth along each surface→centroid ray packs far
  // more candidates into the tiny volume near the centroid. Fix: distribute the radial fraction
  // s (measured from the centroid outward) as cbrt(random) — the exact volume-uniform law for a
  // star-shaped region — so density is flat everywhere from just beneath the shell to the core,
  // and lobe extremities (temporal, occipital, cerebellum interiors) fill via their own rays.
  // Scaled by 0.9 so nothing sits closer than ~10% below the surface (never pokes through).
  const N_INT = 5000;
  const MIN_DIST_INT = 0.17; // widened again — interior is a light scattering (~60-80), just depth hints
  const MAX_INTERIOR = 80;
  const interiorPts: P[] = [];
  for (let i = 0; i < N_INT && interiorPts.length < MAX_INTERIOR; i++) {
    const s = sampleSurface();
    const radial = 0.55 + rand() * 0.35; // outer shell band only (55%-90% of the way to the surface) — no deep-core dots anymore
    const pos = centroid.clone().lerp(s.pos, radial);
    if (interiorPts.some((f) => f.pos.distanceTo(pos) < MIN_DIST_INT)) continue;
    if (surfacePts.some((f) => f.pos.distanceTo(pos) < MIN_DIST_INT * 0.8)) continue;
    interiorPts.push({ pos, normal: s.normal });
  }

  const surfaceCount = surfacePts.length;
  const points = [...surfacePts.map((f) => f.pos), ...interiorPts.map((f) => f.pos)];
  const normals = [...surfacePts.map((f) => f.normal), ...interiorPts.map((f) => f.normal)];
  const isInterior = points.map((_, i) => i >= surfaceCount);

  const hotSet = new Set<number>();
  const hotCount = 10 + Math.floor(rand() * 6); // 10-15 hot nodes
  while (hotSet.size < hotCount) hotSet.add(Math.floor(rand() * points.length));

  // Adaptive max connection distance: derive the cutoff from each point's own actual nearest-
  // neighbour spacing, scaled up (×3.8) so the now much-sparser (~70) dots still reach enough
  // real neighbours despite the larger 0.15 minimum spacing.
  const nearestDists = points.map((p, i) => {
    let best = Infinity;
    points.forEach((q, j) => { if (i !== j) best = Math.min(best, p.distanceTo(q)); });
    return best;
  });
  const avgNearestDist = nearestDists.reduce((a, b) => a + b, 0) / (nearestDists.length || 1);
  // Absolute cap as a fraction of the brain's own bounding-box diagonal ("diameter") — the old
  // purely-adaptive multiplier (avgNearestDist * 3.8) had no ceiling tied to the brain's actual
  // size, which is what let connections reach all the way across the interior as long chords.
  // Capping to ~18% of the diagonal keeps every connection local to nearby neighbours only.
  const bboxMin = new THREE.Vector3(Infinity, Infinity, Infinity);
  const bboxMax = new THREE.Vector3(-Infinity, -Infinity, -Infinity);
  points.forEach((p) => { bboxMin.min(p); bboxMax.max(p); });
  const brainDiagonal = bboxMin.distanceTo(bboxMax);
  const MAX_DIST = Math.min(avgNearestDist * 3.4, brainDiagonal * 0.17); // loosened proportionally to the wider node spacing
  // Surface-to-surface pairs keep the normal-alignment filter from the previous surface design
  // (rejects connections across folds where the mesh curves back on itself). Any pair involving
  // an interior node skips it — interior links run through open volume in every direction, and
  // it's exactly those surface↔interior cross-links that weave the two layers into one network.
  const NORMAL_ALIGN_MIN = 0.2;
  const edgeSet = new Set<string>();
  const edges: { a: number; b: number; d: number }[] = [];
  const addEdge = (i: number, j: number, d: number) => {
    const key = i < j ? `${i}-${j}` : `${j}-${i}`;
    if (edgeSet.has(key)) return;
    edgeSet.add(key);
    edges.push({ a: i, b: j, d });
  };
  points.forEach((p, i) => {
    // Surface nodes carry the dominant web (5-7 links); interior nodes stay subtle with just
    // 3-4 short local links — the layer hierarchy is surface-first, interior as depth hints.
    const k = isInterior[i] ? 3 + Math.floor(rand() * 2) : 5 + Math.floor(rand() * 3);
    const candidates = points.map((q, j) => ({ j, d: i === j ? Infinity : p.distanceTo(q) }));
    candidates
      .filter((x) => {
        const involvesInterior = isInterior[i] || isInterior[x.j];
        const cap = involvesInterior ? MAX_DIST * 0.75 : MAX_DIST; // interior links kept short
        return x.d < cap && (involvesInterior || normals[i].dot(normals[x.j]) > NORMAL_ALIGN_MIN);
      })
      .sort((a, b) => a.d - b.d)
      .slice(0, k)
      .forEach(({ j, d }) => addEdge(i, j, d));
    // Occasional medium-length surface link past the local cap — length variety keeps the
    // surface web organic rather than a uniform mesh.
    if (!isInterior[i] && rand() < 0.15) {
      const medium = candidates.filter((x) => !isInterior[x.j] && x.d >= MAX_DIST && x.d < MAX_DIST * 1.7);
      if (medium.length > 0) {
        const pick = medium[Math.floor(rand() * medium.length)];
        addEdge(i, pick.j, pick.d);
      }
    }
  });

  // Repair pass: no node with fewer than 3 connections (avoids orphaned nodes floating without
  // links). Any node below the floor gets linked to its next-nearest neighbours out to a
  // relaxed distance cap until it reaches 3.
  const connectionCount = new Array(points.length).fill(0);
  edges.forEach(({ a, b }) => { connectionCount[a]++; connectionCount[b]++; });
  points.forEach((p, i) => {
    if (connectionCount[i] >= 3) return;
    const candidates = points
      .map((q, j) => ({ j, d: i === j ? Infinity : p.distanceTo(q) }))
      .filter((x) => x.d < MAX_DIST * 1.8)
      .sort((a, b) => a.d - b.d);
    for (const { j, d } of candidates) {
      if (connectionCount[i] >= 3) break;
      const key = i < j ? `${i}-${j}` : `${j}-${i}`;
      if (edgeSet.has(key)) continue;
      addEdge(i, j, d);
      connectionCount[i]++;
      connectionCount[j]++;
    }
  });

  const edgeDists = edges.map((e) => e.d).slice().sort((a, b) => a - b);
  const maxEdgeDist = edgeDists[edgeDists.length - 1] ?? 0;
  const isolatedCount = points.filter((_, i) => !edges.some((e) => e.a === i || e.b === i)).length;
  const inTarget = edges.length >= 400 && edges.length <= 900;

  // Natural size variation: ~60% medium, 25% small, 15% larger.
  const sizes = points.map(() => {
    const roll = rand();
    if (roll < 0.25) return 0.65 + rand() * 0.2;   // small
    if (roll < 0.85) return 1.0 + rand() * 0.2;    // medium
    return 1.4 + rand() * 0.35;                     // larger
  });

  // eslint-disable-next-line no-console
  console.log(
    `[NeuralDots] ${points.length} dots, ${edges.length} connections (target 400-900${inTarget ? ", OK" : ", OUT OF RANGE"}), max edge length ${maxEdgeDist.toFixed(4)} (limit ${MAX_DIST}), ${isolatedCount} isolated dot(s)`
  );

  // Each connection bulged slightly outward at its midpoint along the local surface normal
  // (average of the two endpoints' own raycast normals) — a straight line between two
  // surface-adjacent points can still dip inside the mesh partway along its length wherever
  // Dead-straight chords per the plexus reference — no midpoint arc/bulge. The midpoint is the
  // plain unlofted centre of A→B, so the quadratic bezier downstream degenerates into an exact
  // straight line. Straight chords slightly clipping through convex folds is fine and matches
  // the reference's faceted low-poly shell look, especially with the brain body now highly
  // transparent.
  const HOT_LINE_BOOST = 1.4;
  // Split into two layers: surface-only edges (the dominant visible web) and any edge touching
  // an interior node (the subtle depth layer, rendered much dimmer by the component).
  const surfaceLinePaths: { path: THREE.Vector3[]; brightness: number[] }[] = [];
  const interiorLinePaths: { path: THREE.Vector3[]; brightness: number[] }[] = [];
  edges.forEach(({ a, b, d }) => {
    const A = points[a], B = points[b];
    const straightMid = A.clone().add(B).multiplyScalar(0.5);
    const path = [A, straightMid, B];

    const t = maxEdgeDist > 0 ? d / maxEdgeDist : 0;
    const baseBrightness = 0.85 - t * 0.15;
    const aIsHot = hotSet.has(a);
    const bIsHot = hotSet.has(b);
    const pn = path.length;
    const brightness = path.map((_, i) => {
      if (!aIsHot && !bIsHot) return baseBrightness;
      if (aIsHot && bIsHot) return baseBrightness * HOT_LINE_BOOST;
      const f = aIsHot ? 1 - i / (pn - 1) : i / (pn - 1);
      return baseBrightness * (1 + (HOT_LINE_BOOST - 1) * f);
    });
    if (isInterior[a] || isInterior[b]) interiorLinePaths.push({ path, brightness });
    else surfaceLinePaths.push({ path, brightness });
  });

  return { points, normals, hotSet, surfaceLinePaths, interiorLinePaths, sizes, surfaceCount };
}

// Fine wireframe overlay traced directly from the real mesh triangulation — this is what
// gives the fold-following mesh texture in the reference (a dense hazy web that follows every
// gyrus/sulcus), which the hand-picked ~70-dot network can only approximate. Rendered thin,
// faint, and additive so 95k triangle-edges read as a soft haze rather than solid noise.
function WireframeBrain({ meshes }: { meshes: THREE.Mesh[] }) {
  const geo = useMemo(() => {
    const wires = meshes.map((m) => new THREE.WireframeGeometry(m.geometry));
    const merged = BufferGeometryUtils.mergeGeometries(wires, false) ?? new THREE.BufferGeometry();
    wires.forEach((w) => w.dispose());
    return merged;
  }, [meshes]);

  return (
    <lineSegments geometry={geo} renderOrder={1}>
      <lineBasicMaterial
        color="#ffffff"
        transparent
        opacity={0.035}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </lineSegments>
  );
}

function NeuralDots({ meshes }: { meshes: THREE.Mesh[] }) {
  const surfDotRef = useRef<THREE.InstancedMesh>(null);
  const surfHaloRef = useRef<THREE.InstancedMesh>(null);
  const intDotRef = useRef<THREE.InstancedMesh>(null);

  // Two merged TubeGeometries — surface web (dominant layer) and interior web (subtle depth
  // layer), rendered at very different opacities to enforce the visual hierarchy.
  const { points, sizes, surfaceCount, surfTubeGeo, intTubeGeo } = useMemo(() => {
    const { points, surfaceLinePaths, interiorLinePaths, sizes, surfaceCount } = buildMeshSampledNetwork(meshes);
    const buildTubes = (paths: { path: THREE.Vector3[] }[]) => {
      const tubes = paths.map(({ path }) => {
        const curve = new THREE.QuadraticBezierCurve3(path[0], path[1], path[2]);
        return new THREE.TubeGeometry(curve, 4, 0.0025, 4, false);
      });
      const merged = BufferGeometryUtils.mergeGeometries(tubes, false) ?? new THREE.BufferGeometry();
      tubes.forEach((t) => t.dispose());
      return merged;
    };
    return {
      points,
      sizes,
      surfaceCount,
      surfTubeGeo: buildTubes(surfaceLinePaths),
      intTubeGeo: buildTubes(interiorLinePaths),
    };
  }, [meshes]);

  const interiorCount = points.length - surfaceCount;

  useEffect(() => {
    const surf = surfDotRef.current;
    const halo = surfHaloRef.current;
    const int = intDotRef.current;
    if (!surf || !halo || !int) return;
    const dummy = new THREE.Object3D();
    for (let i = 0; i < surfaceCount; i++) {
      dummy.position.copy(points[i]);
      dummy.scale.setScalar(sizes[i] ?? 1);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      surf.setMatrixAt(i, dummy.matrix);
      halo.setMatrixAt(i, dummy.matrix);
    }
    for (let i = 0; i < interiorCount; i++) {
      const p = points[surfaceCount + i];
      dummy.position.copy(p);
      dummy.scale.setScalar(sizes[surfaceCount + i] ?? 1);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      int.setMatrixAt(i, dummy.matrix);
    }
    surf.instanceMatrix.needsUpdate = true;
    halo.instanceMatrix.needsUpdate = true;
    int.instanceMatrix.needsUpdate = true;
  }, [points, sizes, surfaceCount, interiorCount]);

  return (
    <group>
      {/* SURFACE layer — the dominant web. Normal depth testing: the depth-writing brain shell
          occludes the far side, so the network wraps a clearly readable brain form instead of
          both sides stacking into an unreadable ball of webbing. */}
      <mesh geometry={surfTubeGeo} renderOrder={2}>
        <meshBasicMaterial color="#e6fbff" transparent opacity={0.2} depthWrite={false} />
      </mesh>
      {/* Faint far-side hint of the surface web (draws only where hidden behind written depth). */}
      <mesh geometry={surfTubeGeo} renderOrder={3}>
        <meshBasicMaterial color="#e6fbff" transparent opacity={0.08} depthWrite={false} depthFunc={THREE.GreaterDepth} />
      </mesh>
      <instancedMesh ref={surfHaloRef} args={[undefined, undefined, surfaceCount]} renderOrder={2}>
        <sphereGeometry args={[0.008, 6, 6]} />
        <meshBasicMaterial color="#e6fbff" transparent opacity={0.15} depthWrite={false} depthTest />
      </instancedMesh>
      <instancedMesh ref={surfDotRef} args={[undefined, undefined, surfaceCount]} renderOrder={2}>
        <sphereGeometry args={[0.0058, 8, 8]} />
        <meshBasicMaterial color="#f2feff" transparent opacity={0.78} depthWrite={false} depthTest />
      </instancedMesh>

      {/* INTERIOR layer — subtle depth hints at ~40-50% of the surface layer's weight.
          depthTest OFF so it shows through the depth-writing shell (whose material is
          untouched), dim enough that it never competes with the surface web. */}
      <mesh geometry={intTubeGeo} renderOrder={4}>
        <meshBasicMaterial color="#e6fbff" transparent opacity={0.08} depthWrite={false} depthTest={false} />
      </mesh>
      <instancedMesh ref={intDotRef} args={[undefined, undefined, interiorCount]} renderOrder={4}>
        <sphereGeometry args={[0.005, 8, 8]} />
        <meshBasicMaterial color="#dff5fa" transparent opacity={0.35} depthWrite={false} depthTest={false} />
      </instancedMesh>
    </group>
  );
}

// ─── Fold-following network (traces real sulci/gyri via the mesh's own edge graph) ─────────
// Unlike buildMeshSampledNetwork (Fibonacci-sphere raycast + straight nearest-neighbour
// chords, which float above the surface as geodesic-ish lines), this walks the ACTUAL vertex
// adjacency graph baked into the GLB triangulation, so every rendered segment is a real mesh
// edge that lies exactly on a real fold. Vertices are scored by a curvature proxy — how far
// each vertex sits from the average position of its direct neighbours — which is large right
// at sulci grooves and gyri ridges and near-zero on smooth/flat surface. Sorting all edges by
// the stronger endpoint's score and keeping only the top slice yields a dense line network
// that specifically traces fold contours, rather than a uniform full wireframe (which reads as
// static noise) or an approximate dot-to-dot chord network (which cuts across folds).
function buildFoldNetwork(meshes: THREE.Mesh[]) {
  const rand = seededRandom(23);
  const positions: THREE.Vector3[] = [];
  const normals: THREE.Vector3[] = [];
  const adjacency: Map<number, Set<number>> = new Map();

  let vertexOffset = 0;
  meshes.forEach((mesh) => {
    const geo = mesh.geometry;
    const posAttr = geo.attributes.position;
    const normAttr = geo.attributes.normal;
    const count = posAttr.count;
    for (let i = 0; i < count; i++) {
      positions.push(new THREE.Vector3().fromBufferAttribute(posAttr, i));
      normals.push(normAttr ? new THREE.Vector3().fromBufferAttribute(normAttr, i) : new THREE.Vector3(0, 1, 0));
    }
    const addEdge = (a: number, b: number) => {
      if (!adjacency.has(a)) adjacency.set(a, new Set());
      if (!adjacency.has(b)) adjacency.set(b, new Set());
      adjacency.get(a)!.add(b);
      adjacency.get(b)!.add(a);
    };
    const index = geo.index;
    if (index) {
      const arr = index.array;
      for (let t = 0; t < arr.length; t += 3) {
        const i0 = arr[t] + vertexOffset, i1 = arr[t + 1] + vertexOffset, i2 = arr[t + 2] + vertexOffset;
        addEdge(i0, i1); addEdge(i1, i2); addEdge(i2, i0);
      }
    } else {
      for (let t = 0; t < count; t += 3) {
        const i0 = t + vertexOffset, i1 = t + 1 + vertexOffset, i2 = t + 2 + vertexOffset;
        addEdge(i0, i1); addEdge(i1, i2); addEdge(i2, i0);
      }
    }
    vertexOffset += count;
  });

  // Curvature proxy: distance of each vertex from the centroid of its direct neighbours.
  const curvature = new Float32Array(positions.length);
  adjacency.forEach((neighbors, i) => {
    if (neighbors.size === 0) return;
    const mean = new THREE.Vector3();
    neighbors.forEach((j) => mean.add(positions[j]));
    mean.divideScalar(neighbors.size);
    curvature[i] = positions[i].distanceTo(mean);
  });

  // Score every unique mesh edge by its more-curved endpoint, then keep the highest-scoring
  // slice — this is what selects fold ridge/groove lines out of the full triangulation
  // instead of drawing the whole mesh wireframe.
  const edgeList: { a: number; b: number; score: number }[] = [];
  const seen = new Set<number>();
  adjacency.forEach((neighbors, i) => {
    neighbors.forEach((j) => {
      const key = i < j ? i * positions.length + j : j * positions.length + i;
      if (seen.has(key)) return;
      seen.add(key);
      edgeList.push({ a: i, b: j, score: Math.max(curvature[i], curvature[j]) });
    });
  });
  edgeList.sort((a, b) => b.score - a.score);
  const EDGE_BUDGET = 14000; // dense enough to read as a fine mesh, capped for draw performance
  const selected = edgeList.slice(0, Math.min(EDGE_BUDGET, edgeList.length));

  // Push every line vertex out along its own surface normal a hair, so hairline segments that
  // sit exactly on the mesh don't z-fight/clip against the opaque brain material underneath.
  // Raised from 0.006: at that distance the lines sat inside the depth-buffer's resolvable
  // step at this camera range, so each frame the rasteriser could decide either way about
  // which was in front — the flicker. 0.022 puts them unambiguously clear of the surface
  // while staying far too small to read as floating.
  const OFFSET = 0.022;
  const linePositions = new Float32Array(selected.length * 6);
  selected.forEach(({ a, b }, i) => {
    const pa = positions[a].clone().addScaledVector(normals[a], OFFSET);
    const pb = positions[b].clone().addScaledVector(normals[b], OFFSET);
    linePositions[i * 6] = pa.x; linePositions[i * 6 + 1] = pa.y; linePositions[i * 6 + 2] = pa.z;
    linePositions[i * 6 + 3] = pb.x; linePositions[i * 6 + 4] = pb.y; linePositions[i * 6 + 5] = pb.z;
  });

  // Brainstem trailing lines — a handful of thin strands continuing down from the lowest
  // (brainstem-region) vertices, each fading toward its tip via a separate lower-opacity pass,
  // matching the reference's glowing lines trailing off into empty space below the brain.
  let minY = Infinity;
  positions.forEach((p) => { if (p.y < minY) minY = p.y; });
  const brainstemSources = positions
    .map((p, i) => ({ i, p }))
    .filter(({ p }) => p.y < minY + 0.07)
    .sort(() => rand() - 0.5)
    .slice(0, 10);
  const trailSegments: number[] = [];
  brainstemSources.forEach(({ i, p }) => {
    let prev = p.clone().addScaledVector(normals[i], OFFSET);
    for (let s = 0; s < 3; s++) {
      const next = prev.clone().add(new THREE.Vector3((rand() - 0.5) * 0.02, -(0.03 + rand() * 0.025), (rand() - 0.5) * 0.02));
      trailSegments.push(prev.x, prev.y, prev.z, next.x, next.y, next.z);
      prev = next;
    }
  });
  const trailPositions = new Float32Array(trailSegments);

  // eslint-disable-next-line no-console
  console.log(
    `[FoldNetwork] ${positions.length} verts, ${edgeList.length} candidate edges, ${selected.length} fold-lines drawn, ${brainstemSources.length} brainstem trails`
  );

  return { linePositions, trailPositions };
}

function FoldNetworkOverlay({ meshes }: { meshes: THREE.Mesh[] }) {
  const { linePositions, trailPositions } = useMemo(() => buildFoldNetwork(meshes), [meshes]);

  const lineGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));
    return g;
  }, [linePositions]);

  const trailGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(trailPositions, 3));
    return g;
  }, [trailPositions]);

  return (
    <group>
      {/* Thin hairline segments (not tubes) — LineBasicMaterial's ~1px screen-space width traces
          the real fold ridges/grooves directly, no dot/node markers anywhere — pure line +
          surface glow per the ethereal x-ray/bioluminescence reference. */}
      {/* opacity 0.85 -> 0.52. With additive blending a pixel's bloom-eligible luminance is
          ~color x opacity, so at 0.85 these 1px hairlines sat just ABOVE the bloom threshold.
          A 1px line inevitably shimmers sub-pixel as the brain turns (MSAA barely touches line
          primitives), and sitting on the threshold turned that subtle aliasing into a hard
          per-frame flip in and out of bloom — the "bling". At 0.52 they are unambiguously
          below the cut, so they still read clearly but can never trigger the flicker. */}
      {/* opacity 0.85 -> 0.52. With additive blending a pixel's bloom-eligible luminance is
          ~color x opacity, so at 0.85 these 1px hairlines sat just ABOVE the bloom threshold.
          A 1px line inevitably shimmers sub-pixel as the brain turns (MSAA barely touches line
          primitives), and sitting on the threshold turned that subtle aliasing into a hard
          per-frame flip in and out of bloom — the "bling". At 0.52 they are unambiguously
          below the cut, so they still read clearly but can never trigger the flicker. */}
      <lineSegments geometry={lineGeo} renderOrder={2}>
        <lineBasicMaterial color="#ffffff" transparent opacity={0.52} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </lineSegments>
      <lineSegments geometry={trailGeo} renderOrder={2}>
        <lineBasicMaterial color="#ffffff" transparent opacity={0.35} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </lineSegments>
    </group>
  );
}

function BrainModel({ selected, onHotspotSelect, onHotspotHover }: {
  selected: Project | null;
  onHotspotSelect: (p: Project) => void;
  onHotspotHover: (name: string | null, x: number, y: number) => void;
}) {
  // Welded copy of the particle brain scan: the original export had zero shared vertices
  // (285,966 verts for 95,322 tris, fully non-indexed), so computeVertexNormals() could
  // only ever produce flat per-triangle normals — there was no vertex-sharing to average
  // across, which is what read as "rough/bumpy". Welding collapsed it to 50,769 shared
  // vertices (~5.6 tris/vertex), confirming this is a genuine continuous surface that was
  // just exported without an index buffer — now smooth normals average properly across it.
  const brainGltf = useLoader(GLTFLoader, "/models/particle_ai_brain12_smooth.glb");
  const groupRef = useRef<THREE.Group>(null);

  // Fully solid/opaque — this also structurally fixes the patchy-hole issue: with
  // transparent:false and normal depth writing, any gap in this mesh's ~6,268 open edges
  // just shows through to whatever's actually behind it (far side of the mesh / empty
  // space) with correct depth occlusion, instead of exposing the inner neural-web wireframe
  // through a jarring see-through gap.
  // Glossier and slightly more translucent than before, specifically so the real anatomical
  // fold detail (gyri/sulci) reads through the surface via specular highlight/shadow contrast
  // on each ridge — the reference's glassy look comes from that contrast, not from the base
  // colour alone. Roughness dropped hard (0.4 → 0.12) for sharper, brighter specular
  // highlights that trace the fold ridges, and opacity eased down a touch so the surface
  // reads as layered glass rather than a flat opaque navy shell.
  // Opacity raised hard (0.8 → 0.94) — at 0.8 the brain read as too "clear"/see-through, with
  // its own shape barely visible against the dark background behind it. Still transparent
  // enough to keep a bit of the glassy look, but now solid enough that the brain itself is
  // clearly readable as a shape, not just a faint outline behind the glowing network.
  // Pushed to fully solid — opacity 0.94 with very low roughness (0.12) still read as "clear"
  // because the glossy specular highlights made it look glassy/see-through even though it
  // was mostly opaque. Opacity all the way to 1 and roughness raised so it reads as a solid
  // matte-ish material instead of glass, while keeping enough sheen (still fairly low
  // roughness relative to the old 0.45) for the fold ridges to still catch highlights.
  // Lightened from a near-black navy to an actual visible white-and-blue blend, plus a soft
  // matching emissive so it reads as glowing rather than flat — safe to add emissive back now
  // that the material is fully opaque (the earlier "orange/brown interior" bug traced back to
  // the transparent+backface interaction, not the emissive itself).
  // Bright glowing cyan/turquoise per the holographic reference — visible, not washed out
  // (opacity kept high at 0.92, not fully transparent) but with a strong matching emissive so
  // it actually glows rather than just being a flat bright colour.
  // Reference is a pure hologram/wireframe look — essentially no solid shaded surface at all,
  // just glowing contour lines and dots with the background showing straight through. Getting
  // close to that (our mesh is a dense real scan, not a stylized low-poly model, so a literal
  // per-triangle wireframe of it would render as solid static noise, not clean lines) means
  // making the shell itself almost fully invisible — just enough for a faint volumetric tint
  // and depth occlusion for the network behind it — and letting the existing dot/line network
  // carry all the visible "structure", the same way it does in the reference.
  // Pale icy blue-white per the reference — unlike the earlier dark-navy or bright-cyan
  // attempts, this one is light and mostly opaque, with the fold shape read through real
  // specular shading (glossy roughness) rather than through a wireframe or heavy transparency.
  // Bright glowing cyan hologram look per the reference — a saturated cyan base with a
  // strong matching emissive so the whole brain reads as a glowing energy projection, glossy
  // enough (low roughness) that the fold ridges catch bright highlights against darker
  // recessed grooves, the way the reference's fresnel-lit surface detail reads.
  // Paler/more washed-out cyan than the previous attempt — the reference's surface is fairly
  // pale and only reads as strongly bright right at the silhouette edges (a fresnel effect),
  // fading to a more muted blue toward the centre, rather than being uniformly saturated
  // bright cyan across the whole surface. The rim pass below is what supplies that edge glow.
  // Pure black-and-white/grayscale per the reference — no blue tint anywhere, a pale
  // near-white body with a soft white (not coloured) self-glow.
  // This reference has NO visible solid surface at all — pure glowing line/dot art on black.
  // Dropping the shell to near-invisible so only the dot/line network (and the faint
  // silhouette rim) carry the whole visual, the same way the reference conveys the brain's
  // shape purely through its wireframe rather than any shaded surface. Kept just barely
  // present (not opacity 0) so it still correctly occludes the far side of the network.
  // Fresh, fully opaque MeshStandardMaterial — no map, no vertexColors, applied uniformly to
  // every mesh below (never the GLB's own baked material). The patchiness wasn't a texture or
  // baked vertex-colour issue (this material never had either) — it was transparency-blending
  // artifacts: at low opacity, three.js doesn't depth-sort individual overlapping triangles
  // within one transparent mesh, so folded/overlapping geometry blended inconsistently into
  // visible light/dark patches. Fully opaque (no transparent/opacity) renders through the
  // normal z-buffer instead of alpha blending, which removes that entirely — every triangle
  // is either drawn or fully occluded, never partially blended, so the surface reads as one
  // flat uniform tone.
  // Subtly translucent glass/charcoal — MeshPhysicalMaterial's transmission gives real
  // see-through depth at a low value (0.2, not full glass) so it reads as frosted material
  // rather than flat matte plastic, while staying a single flat dark charcoal tone (no
  // map/vertexColors, so the earlier patchiness can't come back). Lower roughness + a touch of
  // clearcoat than the old flat MeshStandardMaterial so the big folds still catch soft
  // dimensional highlights under the raking light, without going glossy/noisy over every small
  // ridge.
  const brainMat = useMemo(() => {
    // Opaque dark shell with subtle lighting to show brain folds.
    // Fully opaque = blocks all far-side lines = consistent color at all angles.
    // MeshStandardMaterial responds to scene lights so brain folds are visible.
    const mat = new THREE.MeshStandardMaterial({
      color: "#303030",
      roughness: 0.42,
      metalness: 0.0,
      transparent: false,
      side: THREE.FrontSide,
      depthWrite: true,
    });
    mat.vertexColors = false;
    mat.map = null;
    return mat;
  }, []);

  // Backface-outline rim technique: a slightly enlarged copy of the same geometry,
  // rendered BackSide-only, so only the sliver right at the silhouette edge shows (the
  // front-facing part of the enlarged shell is hidden behind the real front shell). This
  // is purely geometric — unlike the fresnel-shader rim above, it doesn't depend on the
  // mesh's (imperfect, seam-heavy) normals at all, so it can't reproduce the "crack" bug.
  // Kept as a clean fallback outline underneath the new per-pixel fresnel glow.
  const rimMat = useMemo(() => new THREE.MeshBasicMaterial({
    color: "#ffffff",
    transparent: true,
    opacity: 0.35,
    side: THREE.BackSide,
    depthWrite: false,
    toneMapped: false, // full brightness so bloom picks up the silhouette as a soft halo
  }), []);

  // Collect brain meshes. This asset nests its mesh several levels deep with baked
  // parent scale/translate (e.g. a 400x node under a 0.01x node) — bake each mesh's full
  // world matrix into its geometry. The loaded file (particle_ai_brain12_smooth.glb) was
  // already pre-welded offline via `gltf-transform weld` (285,966 non-indexed verts down
  // to 50,769 shared ones) — a runtime re-merge attempt here (dropping UVs, mergeVertices
  // at a small tolerance) actually made faceting worse under this material's specular
  // highlights, so this stays on the already-verified-good pre-welded geometry.
  const brainMeshes = useMemo(() => {
    brainGltf.scene.updateMatrixWorld(true);
    const meshes: THREE.Mesh[] = [];
    brainGltf.scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const geo = mesh.geometry.clone();
        geo.applyMatrix4(mesh.matrixWorld);
        geo.computeVertexNormals();
        meshes.push(new THREE.Mesh(geo));
      }
    });
    return meshes;
  }, [brainGltf]);

  // Runs once brainMeshes is real (the actual loaded/baked geometry, not a guess) and mutates
  // the shared PROJECT_HOTSPOTS array in place BEFORE this component's own JSX renders below —
  // useMemo executes synchronously during render, ahead of the GoldCircuit/HotspotDot children
  // in the return statement, so they see the real validated positions on the very first frame,
  // not one render behind.
  useMemo(() => {
    computeProjectPositions(brainMeshes).forEach((pos, i) => {
      PROJECT_HOTSPOTS[i][0] = pos[0];
      PROJECT_HOTSPOTS[i][1] = pos[1];
      PROJECT_HOTSPOTS[i][2] = pos[2];
    });
  }, [brainMeshes]);

  // Idle rotation. INTEGRATED from delta rather than derived from clock.elapsedTime, because the
  // camera controller freezes it while a project is open (see brainSpin). Reading absolute
  // elapsed time would keep the clock running through the pause and snap the brain forward the
  // moment it resumed; accumulating means a pause simply holds the angle where it stands.
  // delta is clamped so a backgrounded tab returning after several seconds doesn't jump.
  useFrame((_, delta) => {
    if (!groupRef.current) return;
    if (!brainSpin.paused) brainSpin.angle += Math.min(delta, 0.1) * BRAIN_SPIN_SPEED;
    groupRef.current.rotation.y = brainSpin.angle;
  });

  // New model is already ~unit scale (bbox radius ~1.1-1.4) and centred near the origin.
  // Scaled up from the initial 0.12 (which rendered noticeably smaller on screen than the
  // old brain) to 0.20 so it fills roughly the same screen space; position recomputed for
  // the new scale so the bbox centre still lands at the camera's look-at target.
  const BRAIN_TRANSFORM = {
    rotation: [0, 0, 0] as [number, number, number],
    position: [0.002, 0.095, -0.047] as [number, number, number],
    scale: [0.20, 0.20, 0.20] as [number, number, number],
  };

  return (
    <>
      {/* Spinning brain group */}
      <group ref={groupRef}>
        {/* Fully solid matte surface, real anatomical folds, no facets/wireframe */}
        <group {...BRAIN_TRANSFORM} ref={(g) => { brainGroupRef.current = g; }}>
          {brainMeshes.map((mesh, i) => (
            <mesh key={`solid-${i}`} geometry={mesh.geometry} material={brainMat} renderOrder={0} />
          ))}
          {/* Subtle cyan silhouette rim — geometric backface-outline technique, immune to
              the mesh's seam-normal issues that broke the earlier fresnel-shader version */}
          {brainMeshes.map((mesh, i) => (
            <mesh key={`rim-${i}`} geometry={mesh.geometry} material={rimMat} scale={[1.02, 1.02, 1.02]} />
          ))}
          {/* Neural dots + lines — rendered here (inside BRAIN_TRANSFORM, not as a sibling of
              it) because it now samples straight from these meshes' own RAW vertex buffers
              (see buildMeshSampledNetwork) instead of a separately pre-scaled baked array, so
              it needs to share this exact same coordinate space/scale to land on the surface
              correctly. Added on top of the existing brain material + fresnel rim, neither of
              which is modified here. */}
          <NeuralDots meshes={brainMeshes} />
          {/* Gold circuit linking all 5 project nodes through the interior. */}
          <GoldCircuit />
          {/* The 5 project markers — gold glowing focal points scattered across the brain's
              interior regions (see PROJECT_NODES config). */}
          {PROJECT_HOTSPOTS.map((pos, i) => (
            <HotspotDot
              key={PROJECTS[i].id}
              position={pos}
              index={i}
              active={selected?.id === PROJECTS[i].id}
              interactive={PROJECTS[i].active}
              onSelect={() => onHotspotSelect(PROJECTS[i])}
              onHover={onHotspotHover}
            />
          ))}
        </group>
      </group>
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
            ctx.strokeStyle = `rgba(0,200,240,${alpha})`;
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

// ─── Holographic Pedestal ───────────────────────────────────────────────────────
// A smooth-sided glossy BLACK sci-fi podium: one continuous tapered cylinder wall (no panels,
// seams, grooves or dots), a bevelled top rim, a dark glassy top plate, and neon white glow
// strips as the only bright detail on the body — plus concentric rings, a luminous dome and
// light rays fanning up into the brain.
//
// Three scene-specific constraints the numbers below encode:
//
// 1. SCALE. Every literal size in the design brief (radius 2.4, ray height 3.2, centre at
//    Y -2.4) is written for a scene where the brain is roughly unit-scale. This scene's brain
//    is a ~0.25-unit-wide object near the origin (BRAIN_TRANSFORM scales the GLB by 0.20), so
//    every radius/height multiplies the brief's number by S, and the podium sits at the
//    dialled-in gap under the brainstem rather than -2.4. Proportions are as spec'd.
//
// 2. LIGHT INTENSITY vs SCALE. Point-light intensity is candela and falls off with decay 2, so
//    values written for lights a few units away would be far too hot at this scene's fractional
//    distances. They're scaled by S² to land at the same illumination, which is why they read
//    as small numbers rather than the brief's 2.8 / 2.0.
//
// 3. NO ENVIRONMENT MAP — which here is a FEATURE, not a bug. At metalness 0.9 nearly the whole
//    surface response is reflection of the surroundings, and this scene has no environment map,
//    so the body resolves to near-black with only sharp specular highlights from the two point
//    lights. That is exactly the intended look. Note this is the same physics that made the
//    earlier LIGHT-grey podiums render black by accident — there the fix was a low white
//    emissive floor standing in for ambient environment light; here no such floor is wanted,
//    because black is the goal. The two lights are load-bearing: remove them and this becomes a
//    featureless black silhouette.
//
// Scene ambientLight is deliberately left alone. It is global and un-maskable, so lowering it
// to darken this podium would also darken the brain.
// ─── World-Space Holographic Projection Beam ─────────────────────────────────
function HolographicBeam() {
  const BEAM_BASE_Y = -0.224;
  const BEAM_H      = 0.23;
  const BEAM_CY     = BEAM_BASE_Y + BEAM_H / 2;
  const BEAM_R      = 0.088;

  // Refs for animation
  const groupRef    = useRef<THREE.Group>(null);
  const mat0Ref     = useRef<THREE.MeshBasicMaterial>(null);
  const mat1Ref     = useRef<THREE.MeshBasicMaterial>(null);
  const mat2Ref     = useRef<THREE.MeshBasicMaterial>(null);
  const mat3Ref     = useRef<THREE.MeshBasicMaterial>(null);
  const discMatRef  = useRef<THREE.MeshBasicMaterial>(null);
  const particleMatRef = useRef<THREE.PointsMaterial>(null);
  const particlesRef = useRef<THREE.Points>(null);

  // Hash helper
  const hash = (n: number) => ((Math.sin(n * 12.9898 + 0.5) * 43758.5453) % 1 + 1) % 1;

  const loggedBefore = useRef(false);
  const loggedDuring = useRef(false);

  // Animation: flickering + slow rotation
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    // Slow rotation — kept running even while hidden below, so it doesn't jump on return.
    if (groupRef.current) groupRef.current.rotation.y = t * 0.20;

    // Gentle pulse
    const pulse = 1.0 + 0.12 * Math.sin(t * 2.1);
    // Fade the cone toward CONE_INSIDE_FRAC (not fully to 0) as the camera travels inside the
    // brain — full strength restored on the way back out; the default-state look is untouched
    // (fade is exactly 1 at depth 0).
    const fade = 1 - (1 - CONE_INSIDE_FRAC) * camAnim.depth;
    if (mat0Ref.current)    mat0Ref.current.opacity    = 0.08 * pulse * fade;
    if (discMatRef.current) discMatRef.current.opacity = 0.220 * pulse * fade;
    if (particleMatRef.current) particleMatRef.current.opacity = 0.7 * fade;

    // Hard safeguard (section 4): while ANY project is selected, the whole beam is hidden
    // outright rather than relying on opacity alone — this holds regardless of camera angle,
    // so the cone can never appear in frame during zoom no matter where the interior camera
    // ends up. Restored the instant the BACK tween lands.
    //
    // Keyed to `engaged`, not to `depth <= 0.001`: a project-to-project switch drives depth
    // through exactly 0 at the hand-off between its zoom-out and zoom-in legs, and the depth
    // test alone would flash the whole beam back on for those frames mid-transition.
    if (groupRef.current) groupRef.current.visible = camAnim.engaged === 0 && camAnim.depth <= 0.001;

    // Verification logging (section 3/6).
    if (!loggedBefore.current && camAnim.depth < 0.01) {
      loggedBefore.current = true;
      // eslint-disable-next-line no-console
      console.log(
        "[LightCone] opacity BEFORE zoom (depth=0): disc =", discMatRef.current?.opacity.toFixed(4),
        " visible =", groupRef.current?.visible,
      );
    }
    if (!loggedDuring.current && camAnim.depth > 0.99) {
      loggedDuring.current = true;
      // eslint-disable-next-line no-console
      console.log(
        "[LightCone] opacity DURING zoom (depth=1): disc =", discMatRef.current?.opacity.toFixed(4),
        " visible =", groupRef.current?.visible,
        " (visible must be false per the hard safeguard, regardless of the opacity fade)",
      );
    }

    // Animate rising particles: move each particle upward, reset when it exits top
    if (particlesRef.current) {
      const pos = particlesRef.current.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        let y = pos.getY(i);
        const speed = 0.002 + hash(i * 3.7) * 0.002;
        y += speed * 0.016;
        // Glitch: rare random teleport
        const glitchRand = ((Math.sin(i * 127.1 + t * 311.7) * 43758.5453) % 1 + 1) % 1;
        if (glitchRand < 0.01) {
          const glitchAngle = hash(i + t * 7.3) * Math.PI * 2;
          const glitchR = hash(i * 5.1 + t * 0.3) * 0.1;
          const glitchY = BEAM_BASE_Y + hash(i * 2.9 + t * 0.7) * BEAM_H;
          pos.setXYZ(i, Math.cos(glitchAngle) * glitchR, glitchY, Math.sin(glitchAngle) * glitchR);
        } else if (y > BEAM_BASE_Y + BEAM_H + 0.02) {
          const angle = hash(i + t * 0.1) * Math.PI * 2;
          const r = hash(i * 2.1 + t * 0.05) * 0.088;
          pos.setXYZ(i, Math.cos(angle) * r, BEAM_BASE_Y, Math.sin(angle) * r);
        } else {
          pos.setY(i, y);
        }
      }
      pos.needsUpdate = true;
    }
  });

  // Beam texture (same as lighting1)
  const beamTex = useMemo(() => {
    const W = 512, H = 256;
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const ctx = c.getContext('2d')!;
    const NUM_SHAFTS = 5;
    const shHash = (n: number) => ((Math.sin(n * 12.9898 + 0.5) * 43758.5453) % 1 + 1) % 1;
    for (let i = 0; i < NUM_SHAFTS; i++) {
      const cx = ((i + 0.5) / NUM_SHAFTS) * W;
      const w  = W / NUM_SHAFTS * (0.30 + shHash(i + 10) * 0.14);
      const bright = 0.7 + shHash(i + 20) * 0.3;
      for (let y = 0; y < H; y++) {
        const vFrac  = y / H;
        const vAlpha = Math.pow(vFrac, 0.5) * bright;
        const hg = ctx.createLinearGradient(cx - w, y, cx + w, y);
        hg.addColorStop(0,   `rgba(255,255,255,0)`);
        hg.addColorStop(0.3, `rgba(255,255,255,${(vAlpha * 0.5).toFixed(3)})`);
        hg.addColorStop(0.5, `rgba(255,255,255,${vAlpha.toFixed(3)})`);
        hg.addColorStop(0.7, `rgba(255,255,255,${(vAlpha * 0.5).toFixed(3)})`);
        hg.addColorStop(1,   `rgba(255,255,255,0)`);
        ctx.fillStyle = hg;
        ctx.fillRect(cx - w, y, w * 2, 1);
      }
    }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    return tex;
  }, []);

  // Radial glow disc texture
  const radialTex = useMemo(() => {
    const S = 256;
    const c = document.createElement('canvas');
    c.width = S; c.height = S;
    const ctx = c.getContext('2d')!;
    const g = ctx.createRadialGradient(S/2, S/2, 0, S/2, S/2, S/2);
    g.addColorStop(0.0,  'rgba(255,255,255,1)');
    g.addColorStop(0.25, 'rgba(255,255,255,0.7)');
    g.addColorStop(0.6,  'rgba(255,255,255,0.15)');
    g.addColorStop(1.0,  'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, S, S);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);

  // Rising particles geometry — 40 small glowing dots
  const particleGeo = useMemo(() => {
    const NUM = 100;
    const positions = new Float32Array(NUM * 3);
    for (let i = 0; i < NUM; i++) {
      const angle = hash(i * 1.7) * Math.PI * 2;
      const heightFrac = hash(i * 3.1);
      const rAtHeight = 0.088 + heightFrac * (0.1 - 0.088);  // cone radius at this height
      const r = hash(i * 2.3) * rAtHeight;
      positions[i * 3 + 0] = Math.cos(angle) * r;
      positions[i * 3 + 1] = BEAM_BASE_Y + heightFrac * BEAM_H;
      positions[i * 3 + 2] = Math.sin(angle) * r;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  // Circular sprite texture for round particles
  const circTex = useMemo(() => {
    const S = 64;
    const c = document.createElement('canvas');
    c.width = S; c.height = S;
    const ctx = c.getContext('2d')!;
    const g = ctx.createRadialGradient(S/2, S/2, 0, S/2, S/2, S/2);
    g.addColorStop(0,    'rgba(255,255,255,1)');
    g.addColorStop(0.4,  'rgba(255,255,255,0.8)');
    g.addColorStop(0.7,  'rgba(255,255,255,0.3)');
    g.addColorStop(1,    'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, S, S);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);

  return (
    <group>
      {/* Rotating beam group — 5 segments, base 0.09 top 0.12, height 0.2 */}
      <group ref={groupRef}>
        <mesh position={[0, BEAM_BASE_Y + 0.2 / 2, 0]} renderOrder={2}>
          <cylinderGeometry args={[0.12, 0.09, 0.2, 128, 1, true]} />
          <meshBasicMaterial ref={mat0Ref} map={beamTex} color="#ffffff" transparent opacity={0.0005}
            blending={THREE.AdditiveBlending} depthWrite={false} depthTest={false}
            side={THREE.DoubleSide} toneMapped={false} />
        </mesh>
      </group>

      {/* Rising particles — outside rotating group so they move independently */}
      <points ref={particlesRef} geometry={particleGeo} renderOrder={4}>
        <pointsMaterial
          ref={particleMatRef}
          color="#ffffff"
          size={0.008}
          map={circTex}
          transparent
          opacity={0.7}
          alphaTest={0.01}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          sizeAttenuation
          toneMapped={false}
        />
      </points>

      {/* Glow disc at base */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, BEAM_BASE_Y + 0.0005, 0]} renderOrder={2}>
        <circleGeometry args={[0.093, 64]} />
        <meshBasicMaterial ref={discMatRef} map={radialTex} color="#ffffff" transparent opacity={0.35}
          blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
}

function HolographicPedestal() {
  // Master size knob — every radius, height, light position and light intensity below is
  // (design value × S). The brief's literals assume a unit-scale scene; this scene's brain is a
  // ~0.25-unit object near the origin (BRAIN_TRANSFORM scales the GLB by 0.20), so S brings
  // them into range and the platform sits at the dialled-in gap under the brainstem.
  const S = 0.0590;
  const groundY = -0.26;

  const { gl } = useThree();
  const spinRef = useRef<THREE.Group>(null);
  const accentRefs = useRef<THREE.MeshStandardMaterial[]>([]);
  const ACCENT_BASE = [2.5, 1.2, 4];

  // ── PROFILE ── design units, ground at 0. Low and wide: 0.76 tall against a 5.4 span.
  // One clean step: no stacked foot rings. The panel band sits directly on the ground, so
  // nothing overhangs below it.
  const PANEL_H = 0.46, PANEL_CY = PANEL_H / 2;           // panel band, from y=0
  const BAND_TOP = PANEL_H;
  const MID_Y = PANEL_CY;                                 // vertical centre of the panel faces
  const TRACE_R = 2.52;                                   // just proud of the panel faces
  const TRACE_JOG = 0.05;                                 // how far the trace steps at a seam
  const TRACE_ARC = 0.78;                                 // fraction of a panel the level run covers
  const LIP_H = 0.14, LIP_TOP = BAND_TOP + LIP_H;         // stepped raised lip
  const DECK_H = 0.08;
  const DECK_TOP = LIP_TOP - 0.06;                        // top surface, recessed below the lip
  const PANELS = 16, STEP = (Math.PI * 2) / PANELS;

  // ── ENVIRONMENT ──
  // Built locally rather than with drei's <Environment preset="night" />. The purpose is right —
  // at metalness 0.8 most of the surface response is environment reflection, so without one the
  // body renders as a flat black silhouette and the rim highlights the reference depends on
  // never appear. But the component is wrong twice here: presets are fetched from a CDN at
  // runtime (so the metal silently goes black if that fails), and <Environment> assigns
  // scene.environment, which is GLOBAL and would relight the brain's MeshPhysicalMaterial.
  // This is a gradient with a bright horizon band, PMREM-filtered so roughness blurs it
  // correctly, attached per material via `envMap`. No network, brain untouched.
  const envMap = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 256; c.height = 128;
    const ctx = c.getContext("2d")!;
    const g = ctx.createLinearGradient(0, 0, 0, c.height);
    g.addColorStop(0.0, "#020304");
    g.addColorStop(0.455, "#1c1f25");
    g.addColorStop(0.487, "#ffffff");  // narrow bright band — the crisp edge streak on black
    g.addColorStop(0.515, "#16191e");
    g.addColorStop(1.0, "#010203");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, c.width, c.height);
    const tex = new THREE.CanvasTexture(c);
    tex.mapping = THREE.EquirectangularReflectionMapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    const pmrem = new THREE.PMREMGenerator(gl);
    const rt = pmrem.fromEquirectangular(tex);
    tex.dispose(); pmrem.dispose();
    return rt.texture;
  }, [gl]);

  const floorTex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const ctx = c.getContext("2d")!;
    const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0.0, "rgba(255,255,255,1)");
    g.addColorStop(0.35, "rgba(255,255,255,0.4)");
    g.addColorStop(0.7, "rgba(255,255,255,0.1)");
    g.addColorStop(1.0, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);

  // Radius/height the ring-interior glow disc is anchored to — matches the existing top ring
  // exactly, and sits just above its standing wall.
  const RING_R = 1.9 * 0.9;
  const RING_TOP = DECK_TOP + 0.012 + 0.06;
  // The dome's outer radius matches RING_R * 0.92 — the exact radius the interior-glow disc
  // above already uses for "just inside the ring", so the dome now fills the same lit circle
  // that glow was already painted onto, right up to the ring, instead of a much smaller
  // hardcoded 0.55 that left a visible gap of bare deck between the dome and the ring.
  const DOME_R = RING_R * 0.92;

  // ══ SHORT CENTRE BURST ══
  // Deliberately kept to CORE_H = 0.3 design units. The pedestal-to-brain gap at this scale is
  // ~0.079 world units; 0.3 design units × S works out to ~0.018 world units, i.e. about 22% of
  // that gap — comfortably inside the "20-25%, must not approach the brain" requirement, with
  // roughly three-quarters of the gap left as open dark space above it.
  //
  const CORE_H = 0.3; // design units — the low surface burst; the tall beam below is separate

  // ══ STREAKY LIGHT BEAM ══
  // BEAM_H reaches most of the way to the brain without touching it. The gap from the beam's
  // base (RING_TOP) to the brain's underside is ~1.38 design units at this scale, so 1.15
  // covers ~83% of it and stops just short.
  const BEAM_H = 1.15;

  // Streak texture. This is what turns the cones from one flat soft gradient into visible
  // individual light strands: vertical stripes across U (which wraps the circumference) give
  // the strands, and a vertical ramp across V gives the bright-at-base / wispy-at-top falloff —
  // one texture doing both jobs, so no extra geometry is needed per strand.
  // On CylinderGeometry, UV.y is 0 at the BOTTOM and 1 at the top; CanvasTexture defaults to
  // flipY=true, so the canvas's BOTTOM row is what lands at the cylinder's base. Hence the
  // gradient is authored bright-at-canvas-bottom.
  const beamStreakTex = useMemo(() => {
    const W = 512, H = 256;
    const c = document.createElement("canvas");
    c.width = W; c.height = H;
    const ctx = c.getContext("2d")!;

    // vertical falloff: brightest near the base, fading to nothing toward the top
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0.0, "rgba(255,255,255,0)");     // cylinder TOP
    g.addColorStop(0.45, "rgba(255,255,255,0.45)");
    g.addColorStop(0.85, "rgba(255,255,255,1)");
    g.addColorStop(1.0, "rgba(255,255,255,0.9)");   // cylinder BASE
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // mask it down to stripes — deterministic hash rather than Math.random() so the strand
    // pattern is stable across re-renders instead of reshuffling
    ctx.globalCompositeOperation = "destination-in";
    const hash = (n: number) => ((Math.sin(n * 12.9898) * 43758.5453) % 1 + 1) % 1;
    for (let i = 0; i < 30; i++) {
      const x = hash(i + 1) * W;
      const w = 2 + hash(i + 40) * 12;          // varied strand thickness
      const a = 0.35 + hash(i + 80) * 0.65;     // varied strand brightness
      // soft-edged stripe: opaque centre falling to transparent at both edges, so each strand
      // has feathered sides rather than a hard-cut bar
      const sg = ctx.createLinearGradient(x - w, 0, x + w, 0);
      sg.addColorStop(0, "rgba(255,255,255,0)");
      sg.addColorStop(0.5, `rgba(255,255,255,${a})`);
      sg.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = sg;
      ctx.fillRect(x - w, 0, w * 2, H);
    }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    return tex;
  }, []);


  useFrame(({ clock }) => {
    if (spinRef.current) spinRef.current.rotation.y += 0.001;
    const pulse = 0.5 + 0.5 * Math.sin(clock.elapsedTime * 1.3);
    accentRefs.current.forEach((m, i) => { if (m) m.emissiveIntensity = ACCENT_BASE[i] - 0.3 + 0.5 * pulse; });
  });

  // metalness/roughness vary per part: the deck is deliberately rougher and less metallic so it
  // reads as textured concrete-metal against the polished lip.
  // envMapIntensity 1.0 -> 0.3, and the emissive floor cut to a token amount. These, not the
  // base colour, are what made the body read grey: at full intensity a metal surface shows the
  // environment's mid-tones no matter how dark its albedo, and a white self-lit floor adds a
  // constant lift on top. Only the top rim keeps a strong reflection (passed explicitly) so the
  // silhouette still catches its highlight.
  const metal = (color: string, metalness = 0.8, roughness = 0.4, e = 0.006, envI = 0.3) => (
    <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} emissive="#ffffff" emissiveIntensity={e} envMap={envMap} envMapIntensity={envI} />
  );

  return (
    <group position={[0, groundY, 0]}>
      {/* Key from above-front plus a weaker fill. Intensity is candela with decay 2, so the
          brief's 2.2 / 1 are scaled by S² for this scene's fractional distances — the raw
          values would be hundreds of times too hot at these ranges. The key is what strikes the
          bright rim highlight along the lip. */}
      <pointLight position={[2.5 * S, 1.8 * S, 3 * S]} color="#ffffff" intensity={3.2 * S * S} distance={12 * S} decay={2} />
      <pointLight position={[-3 * S, 0.5 * S, -2 * S]} color="#ffffff" intensity={2.0 * S * S} distance={12 * S} decay={2} />

      {/* ── FLOOR ── very subtle contact pool. A flat CircleGeometry has constant alpha to its
          rim and reads as a grey disc outline; a gradient texture fades out with no edge. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.003, 0]}>
        <planeGeometry args={[5 * S, 5 * S]} />
        <meshBasicMaterial map={floorTex} color="#ffffff" transparent opacity={0.07} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.0025, 0]}>
        <planeGeometry args={[3.5 * S, 3.5 * S]} />
        <meshBasicMaterial map={floorTex} color="#ffffff" transparent opacity={0.13} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>

      <group ref={spinRef}>
        {/* ══ INNER DRUM ══ the core the panels clad. Deliberately near-black: what shows in the
            gaps between panels IS this surface, which is what makes those gaps read as deep
            recessed grooves rather than pale slots. */}
        <mesh position={[0, PANEL_CY * S, 0]}>
          <cylinderGeometry args={[2.28 * S, 2.28 * S, PANEL_H * S, 128]} />
          {metal("#000000", 0.65, 0.4, 0.006)}
        </mesh>

        {/* ══ 16 CHUNKY BEVELLED PANELS ══
            Each panel lives in a group turned to its angle, then a child group pushes out along
            +X and tilts. Inside that child the axes are local and identical for every panel —
            X radial-out, Y up, Z tangential — so ONE rotation.z leans all sixteen outward the
            same way. Writing it as rotation={[0.08, -a, 0]} instead would tilt every panel
            about the same WORLD X and splay them inconsistently around the ring.
            Three layers per panel: a chamfer border, the raised face proud of it, and a dark
            groove beside it — all sharing PANEL_H, so nothing can overhang the band. */}
        {Array.from({ length: PANELS }, (_, i) => {
          const a = i * STEP;
          return (
            <group key={i} rotation={[0, -a, 0]}>
              <group position={[2.35 * S, PANEL_CY * S, 0]} rotation={[0, 0, -0.08]}>
                {/* chamfered border plate */}
                <mesh>
                  <boxGeometry args={[0.28 * S, PANEL_H * S, 0.95 * S]} />
                  {metal("#0a0a0c", 0.75, 0.25, 0.006, 0.4)}
                </mesh>
                {/* raised face, proud of the border */}
                <mesh position={[0.05 * S, 0, 0]}>
                  <boxGeometry args={[0.2 * S, PANEL_H * 0.78 * S, 0.78 * S]} />
                  {metal("#0a0a0c", 0.75, 0.25, 0.006, 0.4)}
                </mesh>
              </group>
              {/* recessed vertical groove, half a step round */}
              <group rotation={[0, -STEP / 2, 0]}>
                <mesh position={[2.3 * S, PANEL_CY * S, 0]}>
                  <boxGeometry args={[0.2 * S, PANEL_H * S, 0.1 * S]} />
                  {metal("#000000", 0.6, 0.45, 0.004)}
                </mesh>
              </group>
            </group>
          );
        })}

        {/* ══ STEPPED RAISED LIP ══ with a lighter rim torus to catch the key light. */}
        <mesh position={[0, (BAND_TOP + LIP_H / 2) * S, 0]}>
          <cylinderGeometry args={[2.05 * S, 2.15 * S, LIP_H * S, 128]} />
          {metal("#0a0a0c", 0.75, 0.25, 0.006, 0.4)}
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, LIP_TOP * S, 0]}>
          <torusGeometry args={[2.05 * S, 0.05 * S, 20, 192]} />
          {metal("#333333", 0.85, 0.18, 0.04, 1.1)}
        </mesh>
        {/* true emissive rim line on the same edge — visible from every angle, unlike the
            reflective torus above which only catches a highlight when a light lines up with it */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, (LIP_TOP + 0.001) * S, 0]}>
          <torusGeometry args={[2.05 * S, 0.014 * S, 12, 192]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={2} metalness={0} roughness={1} transparent opacity={0.85} toneMapped={false} />
        </mesh>

        {/* ══ FLAT RECESSED TOP DECK ══ rougher and less metallic than the lip, so it reads as
            textured concrete-metal rather than polished steel. */}
        <mesh position={[0, (DECK_TOP - DECK_H / 2) * S, 0]}>
          <cylinderGeometry args={[1.9 * S, 1.9 * S, DECK_H * S, 128]} />
          {metal("#141416", 0.6, 0.45, 0.02)}
        </mesh>
        {/* thin dark inset ring separating the deck from the lip */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, DECK_TOP * S, 0]}>
          <torusGeometry args={[1.93 * S, 0.025 * S, 12, 192]} />
          {metal("#000000", 0.65, 0.4, 0.006)}
        </mesh>

        {/* ══ TOP RIM GLOW — bright neon spec ══ tube 0.035, emissiveIntensity 4, bloom tube
            0.15 / opacity 0.18, for a punchier read than the mid-body circuit line.
            A flat torus alone lies in a HORIZONTAL plane, and this scene's camera sits close
            to level, so it is seen almost edge-on and only ever shows a thin sliver no matter
            how bright its material is — that is why a standing wall (open-ended cylinder) is
            still needed at the same radius: it has genuine vertical-facing surface area, so it
            actually catches the camera instead of just adding brightness that can't be seen.
            The flat torus sits on top as the crisp top edge of that wall. */}
        <mesh position={[0, (DECK_TOP + 0.012 + 0.03) * S, 0]}>
          <cylinderGeometry args={[1.9 * 0.9 * S, 1.9 * 0.9 * S, 0.06 * S, 128, 1, true]} />
          <meshStandardMaterial ref={(m) => { if (m) accentRefs.current[2] = m; }} color="#ffffff" emissive="#ffffff" emissiveIntensity={4} metalness={0} roughness={1} transparent opacity={0.95} side={THREE.DoubleSide} toneMapped={false} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, (DECK_TOP + 0.012) * S, 0]}>
          <torusGeometry args={[1.9 * 0.9 * S, 0.035 * S, 12, 256]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={4} metalness={0} roughness={1} transparent opacity={0.95} toneMapped={false} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, (DECK_TOP + 0.012) * S, 0]} renderOrder={1}>
          <torusGeometry args={[1.9 * 0.9 * S, 0.15 * S, 12, 192]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.18} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
        </mesh>

        {/* ══ CIRCUIT TRACE ══ level runs across each panel, joined by short DIAGONAL ramps
            at the seams — the stepped look from the reference. Alternating panels sit above and
            below the band's centre line.

            Two bits of geometry care:
            • Aligning an arc with a panel needs a conversion between conventions. A panel placed
              by a group rotated -a lands at (cos a, 0, sin a), but a flat torus arc starting at
              `start` puts its angle psi at (cos psi, 0, -sin psi). Matching gives psi = -a, so an
              arc centred on panel i needs start = -a - arc/2. Without it the trace would sit
              rotated off the panels and the ramps would land mid-panel instead of on the seams.
            • The ramp is a box whose long axis (+Z, tangential here) is tilted toward +Y by
              rotation.x, so it spans the seam gap and the height change at once — a genuine
              diagonal rather than a vertical step. */}
        {Array.from({ length: PANELS }, (_, i) => {
          const a = i * STEP;
          const arc = STEP * TRACE_ARC;
          const up = i % 2 === 0;
          const y = MID_Y + (up ? TRACE_JOG : -TRACE_JOG);
          // seam gap measured as real arc length, so the ramp's slope is correct at any radius
          const gap = STEP * (1 - TRACE_ARC) * TRACE_R;
          const rampLen = Math.hypot(gap, TRACE_JOG * 2);
          const rampTilt = Math.atan2(TRACE_JOG * 2, gap) * (up ? 1 : -1);
          return (
            <group key={i}>
              {/* level run across the panel face */}
              <mesh rotation={[-Math.PI / 2, 0, -a - arc / 2]} position={[0, y * S, 0]}>
                <torusGeometry args={[TRACE_R * S, 0.02 * S, 10, 28, arc]} />
                <meshStandardMaterial
                  ref={(m) => { if (m && i === 0) accentRefs.current[0] = m; }}
                  color="#ffffff" emissive="#ffffff" emissiveIntensity={2.5} metalness={0} roughness={1} transparent opacity={0.9} toneMapped={false}
                />
              </mesh>
              <mesh rotation={[-Math.PI / 2, 0, -a - arc / 2]} position={[0, y * S, 0]} renderOrder={1}>
                <torusGeometry args={[TRACE_R * S, 0.07 * S, 10, 24, arc]} />
                <meshBasicMaterial color="#ffffff" transparent opacity={0.12} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
              </mesh>
              {/* diagonal ramp bridging this run to the next level */}
              <group rotation={[0, -(a + STEP / 2), 0]}>
                <mesh position={[TRACE_R * S, MID_Y * S, 0]} rotation={[rampTilt, 0, 0]}>
                  <boxGeometry args={[0.02 * S, 0.02 * S, rampLen * S]} />
                  <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={2.5} metalness={0} roughness={1} transparent opacity={0.9} toneMapped={false} />
                </mesh>
              </group>
            </group>
          );
        })}

        {/* faint line where the body meets the ground */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03 * S, 0]}>
          <torusGeometry args={[2.46 * S, 0.018 * S, 10, 192]} />
          <meshStandardMaterial ref={(m) => { if (m) accentRefs.current[1] = m; }} color="#ffffff" emissive="#ffffff" emissiveIntensity={2} metalness={0} roughness={1} transparent opacity={0.85} toneMapped={false} />
        </mesh>

        {/* ══ PANEL SEAM RIM LINES ══ a thin bright line at each of the 16 seams, tracing the
            side edge of every panel — combined with the bottom and lip rings above, this closes
            the silhouette outline the whole way round: bottom ring, 16 verticals, top ring. Sits
            proud of the existing dark groove at the same seam so it reads as the groove's own
            edge catching light, not a separate stripe. */}
        {Array.from({ length: PANELS }, (_, i) => {
          const a = i * STEP;
          return (
            <group key={i} rotation={[0, -(a + STEP / 2), 0]}>
              <mesh position={[2.31 * S, PANEL_CY * S, 0]}>
                <boxGeometry args={[0.012 * S, PANEL_H * 0.92 * S, 0.02 * S]} />
                <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={2} metalness={0} roughness={1} transparent opacity={0.7} toneMapped={false} />
              </mesh>
            </group>
          );
        })}
      </group>

      {/* ══ RING INTERIOR GLOW ══ two stacked discs filling the area the neon ring encloses, so
          the ring's own interior reads as a glowing pool rather than the ring being a bare
          outline. Sized well inside RING_R so neither disc touches the ring wall. Outside the
          spin group: radially symmetric, so rotating it would be wasted work. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, (RING_TOP + 0.002) * S, 0]} renderOrder={2}>
        <circleGeometry args={[RING_R * 0.92 * S, 64]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.4} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, (RING_TOP + 0.004) * S, 0]} renderOrder={2}>
        <circleGeometry args={[RING_R * 0.6 * S, 56]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.6} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>

      {/* ══ SHORT CENTRE BURST ══ a bright compact glow that sits low and fades to nothing well
          short of the brain — see the CORE_H comment above for the exact math. Outside the spin
          group: radially symmetric (the wisps are a scatter, not a rotating pattern), so
          spinning it would be wasted work. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, (RING_TOP + 0.006) * S, 0]} renderOrder={2}>
        <circleGeometry args={[0.5 * S, 48]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.7} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, (RING_TOP + 0.005) * S, 0]} renderOrder={2}>
        <circleGeometry args={[0.9 * S, 48]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.35} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>

      {/* ══ STREAKY BEAM ══ four nested cones, each carrying the streak texture so the beam
          reads as individual light strands rather than one solid soft gradient. Radii step
          outward with falling opacity — bright core at the centre, thin wispy edges.
          Kept CONTAINED: each cone's top radius is only ~1.5x its base, so the beam stays
          narrow rather than flaring wide.
          Each layer is rotated a different amount on Y so their strand patterns don't align —
          overlapping offset stripes read as many distinct rays, whereas identical rotations
          would just stack into one thicker set of bars.
          depthWrite/depthTest stay false, and blending stays additive, so this cannot
          reintroduce the dark-oval veil. */}
      {([[0.45, 0.70, 0.20, 0.0], [0.70, 1.00, 0.13, 0.9], [0.95, 1.30, 0.085, 1.9], [1.20, 1.60, 0.05, 2.7]] as [number, number, number, number][]).map(
        ([rBot, rTop, op, rot], i) => (
          <mesh
            key={i}
            position={[0, RING_TOP * S + (BEAM_H * S) / 2, 0]}
            rotation={[0, rot, 0]}
            renderOrder={1}
          >
            <cylinderGeometry args={[rTop * S, rBot * S, BEAM_H * S, 48, 1, true]} />
            <meshBasicMaterial
              map={beamStreakTex} color="#ffffff" transparent opacity={op} blending={THREE.AdditiveBlending}
              depthWrite={false} depthTest={false} side={THREE.DoubleSide} toneMapped={false}
            />
          </mesh>
        )
      )}

      {/* ══ GLOWING DOME ══ a half-sphere sitting inside the existing centre ring, flat side
          down. SphereGeometry's theta is measured from the +Y pole, so thetaStart=0 with
          thetaLength=PI/2 sweeps only the UPPER hemisphere — the geometry's own equatorial cut
          plane sits at its local y=0, which is why no Y offset is needed beyond RING_TOP: the
          flat side lands exactly on the deck surface and the dome bulges up from there.
          Sized to DOME_R = RING_R * 0.92, matching the interior-glow disc's own radius, so
          the dome's base fills the lit circle right up to the ring — no bare deck visible
          between the dome's edge and the ring. Segment counts raised (48/32 etc.) since the
          dome is now more than twice its previous size and the facets would otherwise show. */}
      <mesh position={[0, RING_TOP * S, 0]} scale={[1, 0.125, 1]} renderOrder={2}>
        <sphereGeometry args={[DOME_R * S, 48, 20, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color="#ffffff" emissive="#ffffff" emissiveIntensity={1.5} transparent opacity={0.55}
          metalness={0.1} roughness={0.2} envMap={envMap} envMapIntensity={0.4}
          side={THREE.DoubleSide} toneMapped={false}
        />
      </mesh>
      {/* brighter inner dome, additive so it reads as light glowing through the outer shell
          rather than a second solid layer */}
      <mesh position={[0, RING_TOP * S + 0.002 * S, 0]} scale={[1, 0.125, 1]} renderOrder={2}>
        <sphereGeometry args={[DOME_R * 0.73 * S, 40, 18, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.35} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      {/* bright core glow flat at the dome's base — also visually plugs the open equatorial cut
          the two hemispheres above leave, so nothing hollow is visible looking up into them */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, RING_TOP * S + 0.001 * S, 0]} renderOrder={2}>
        <circleGeometry args={[DOME_R * 0.45 * S, 40]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.7} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      {/* soft outer halo, larger and very faint, for bloom around the dome */}
      <mesh position={[0, RING_TOP * S - 0.001 * S, 0]} scale={[1, 0.125, 1]} renderOrder={1}>
        <sphereGeometry args={[DOME_R * 1.1 * S, 40, 18, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.15} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
    </group>
  );
}

// ─── Scene ────────────────────────────────────────────────────────────────────
// Default bloom strength, and the share of it kept while fully inside the brain (40%, per the
// explicit "genuinely drops to 40% of default" requirement). Restored to full on the way out.
const BLOOM_INTENSITY = 0.3;
const BLOOM_INSIDE_FRAC = 0.4;

// The actual bug this round: @react-three/postprocessing's <Bloom> ref resolves to the real
// `BloomEffect` instance from the `postprocessing` library (confirmed by reading its wrapEffect
// source and the BloomEffect class directly, in node_modules) — but that class does NOT expose
// `intensity` as a settable instance property. It's stored as a shader uniform, created once in
// the constructor: `uniforms: new Map([["intensity", new Uniform(intensity)]])`, with no
// intensity getter/setter anywhere on the class. `b.intensity = x` was therefore silently
// creating a dead, never-read own-property on the effect instance every frame — a genuine no-op
// that explains why zooming visibly changed nothing. The shader reads `uniforms.get("intensity")
// .value`, so that's what has to be written instead.
type BloomEffectRef = { uniforms: Map<string, { value: number }> };

// Has to be a child of the Canvas to use useFrame, and is rendered as a sibling of the
// EffectComposer.
function BloomZoomFade({ bloomRef }: { bloomRef: React.RefObject<BloomEffectRef | null> }) {
  const loggedBefore = useRef(false);
  const loggedDuring = useRef(false);
  useFrame(() => {
    const b = bloomRef.current;
    if (!b) return;
    const uniform = b.uniforms.get("intensity");
    if (!uniform) return;
    const target = BLOOM_INTENSITY * (1 - (1 - BLOOM_INSIDE_FRAC) * camAnim.depth);
    uniform.value = target;

    // Verification logging (section 2/6): "before" is the resting default-state value, logged
    // once; "during" is logged once depth first reaches fully zoomed, so the two numbers in the
    // console are directly comparable proof the uniform is actually changing.
    if (!loggedBefore.current && camAnim.depth < 0.01) {
      loggedBefore.current = true;
      // eslint-disable-next-line no-console
      console.log("[Bloom] intensity BEFORE zoom (depth=0) =", uniform.value.toFixed(4));
    }
    if (!loggedDuring.current && camAnim.depth > 0.99) {
      loggedDuring.current = true;
      // eslint-disable-next-line no-console
      console.log(
        "[Bloom] intensity DURING zoom (depth=1) =", uniform.value.toFixed(4),
        ` (expected ${(BLOOM_INTENSITY * BLOOM_INSIDE_FRAC).toFixed(4)} = BLOOM_INTENSITY * ${BLOOM_INSIDE_FRAC})`,
      );
    }
  });
  return null;
}

function BrainScene({ selected, onHotspotSelect, onHotspotHover }: {
  selected: Project | null;
  onHotspotSelect: (p: Project) => void;
  onHotspotHover: (name: string | null, x: number, y: number) => void;
}) {
  const bloomRef = useRef<BloomEffectRef | null>(null);
  return (
    <>
      {/* These were tuned back when every material in the scene was unlit (MeshBasicMaterial
          / custom ShaderMaterial) so intensity never actually mattered. Now that the brain
          uses a real MeshPhysicalMaterial, the old 2.0/2.5 intensities blew its clearcoat
          highlights out to solid white — toned down to reasonable PBR levels. */}
      <ambientLight intensity={0.35} />
      <directionalLight position={[-2, 4, 3]} intensity={0.7} color="#ffffff" />
      <directionalLight position={[3, 1, 1]}  intensity={0.4} color="#e0e8ff" />
      {/* Raking light, low and to the side rather than from above — this is what actually
          reveals the anatomical fold detail (gyri/sulci) as bright specular highlight along
          each ridge with real shadow in each groove, now that the brain material is glossy
          enough (roughness 0.12) to catch it. A light from straight above/front (the two
          directionalLights above) mostly grazes the folds evenly and washes the shape out
          flat. */}
      <directionalLight position={[1.5, 0.2, 2.5]} intensity={0.3} color="#ffffff" />
      {/* Soft blue ambient glow for the dark-navy brain material — kept at a wide falloff
          distance and modest intensity so it doesn't blow out the nearest geometry into a
          hotspot the way the earlier white-brain point light did. */}
      {/* Point light removed — was causing bright centre */}

      <CameraController selected={selected} />
      <Suspense fallback={null}>
        <BrainModel selected={selected} onHotspotSelect={onHotspotSelect} onHotspotHover={onHotspotHover} />
      </Suspense>
      <HolographicPedestal />
      <HolographicBeam />

      {/* Bloom — threshold raised 0.7 -> 0.8 to kill the rotation shimmer. The ambient line
          network is thousands of 1px primitives; those alias sub-pixel as the brain turns no
          matter what, and any of them sitting NEAR the threshold converts that unavoidable
          aliasing into a visible per-frame bloom flip. Pulling the cut up to 0.8 (together
          with dropping the fold lines to 0.52) leaves the whole ambient network safely on one
          side of the line, so it never flickers, while the project nodes — unlit pure white
          at full opacity, luminance ~1.0 — still clear the bar and glow exactly as before.
          luminanceSmoothing is deliberately left HIGH at 0.6: it widens the soft ramp around
          the cut, and lowering it would sharpen the threshold into the hard on/off edge that
          causes this class of flicker in the first place.
          mipmapBlur removed: it's a documented pmndrs/postprocessing bug where the mip-based
          blur doesn't carry the alpha channel correctly across the transparent/opaque
          boundary, which shows up as soft black scalloped halos around bloomed geometry on
          a transparent canvas (invisible against this site's normal dark background, but
          obvious the moment anything lighter sits behind it — e.g. light mode). The default
          (non-mipmap) blur handles alpha correctly and doesn't have this artifact. */}
      <BloomZoomFade bloomRef={bloomRef} />
      <EffectComposer>
        {/* Tuned after confirming (by disabling bloom entirely) that the dark oval around the
            pedestal was this pass veiling the DOM starfield: bloom raises canvas alpha with
            near-black RGB across its falloff, and the browser composites
            result = canvasRGB + pageRGB x (1 - canvasAlpha), so a wide faint halo dims the
            stars behind it.
            The two levers that shrink that veil are THRESHOLD (excludes the mid-grey falloff
            that was spreading alpha over a wide area, rather than the bright cores we actually
            want glowing) and RADIUS (keeps what does bloom tight to its source). Intensity is
            reduced more modestly, since it scales the glow the brain needs rather than the
            area the veil covers.
            NOTE ON mipmapBlur: enabled here as requested, but the previous comment at this
            location recorded it being deliberately REMOVED for causing this exact symptom —
            "the mip-based blur doesn't carry the alpha channel correctly across the
            transparent/opaque boundary ... soft black scalloped halos around bloomed geometry
            on a transparent canvas". If the veil returns, this flag is the first thing to turn
            back off. */}
        <Bloom
          // Callback ref, deliberately not a ref object. React 19 passes `ref` through as an
          // ordinary prop, and EffectComposer memoises on a JSON.stringify of its children's
          // props — a ref object whose .current is the mounted effect carries the Three
          // parent/children cycle straight into that stringify and throws "Converting
          // circular structure to JSON". JSON.stringify omits function-valued props, so a
          // callback ref is invisible to it.
          ref={(e: unknown) => { bloomRef.current = (e as BloomEffectRef | null); }}
          mipmapBlur
          luminanceThreshold={0.9}
          luminanceSmoothing={0.3}
          intensity={BLOOM_INTENSITY}
          radius={0.4}
          blendFunction={BlendFunction.SCREEN}
        />
      </EffectComposer>
    </>
  );
}

// ─── Terminal archive UI tokens ───────────────────────────────────────────────
const INK         = "#ffffff";
const INK_BRIGHT  = "#c8cfd6";
const INK_MID     = "#8b929b";
const INK_DIM     = "#5a6472";
const INK_LOCKED  = "#3f4754";
const ROW_IDLE    = "#6b7280";
const VOID        = "#020008";
const MONO        = "'JetBrains Mono', monospace";

const PANEL_BORDER = "rgba(255,255,255,0.18)";
const PANEL_BG     = "rgba(255,255,255,0.012)";
const BRACKET_COL  = "rgba(255,255,255,0.45)";
const RULE_STRONG  = "rgba(255,255,255,0.14)";
const RULE_SOFT    = "rgba(255,255,255,0.1)";

const PANEL_GAP = 12;
const LEFT_W    = 260;
// Readout width as a share of the viewport. Its left edge lands at
// 100vw - READOUT_RIGHT_GAP - READOUT_VW, which stays right of the viewport centre at any
// realistic width — so the centred brain, and the selected node (which projects to the exact
// screen centre at full zoom), stay unobscured.
const READOUT_VW = 35;
// Gap between the panel's right edge and the viewport edge. Deliberately NOT the hero's 8vw
// gutter used elsewhere in this section: 8vw resolves to ~121px on a 1512px viewport, which
// left a wide dead band down the right-hand side. A small fixed 24px hugs the edge instead.
const READOUT_RIGHT_GAP = 24;
const SHEET_VH   = 72;   // mobile bottom sheet
// The site navbar is 83px tall, full width, z-index 100 — above this section.
const NAV_CLEARANCE = 96;
// Horizontal page gutter. Matches the hero section's `padding: "80px 8vw 0"` exactly, so the
// left panel's left edge and the readout's right edge line up with the hero's content edges
// at every width (8vw is inherently responsive; the hero has no separate padding breakpoint,
// only a grid-column change at 768px, which does not affect its gutter).
const EDGE_PAD      = "8vw";
// Readout internal padding — generous, so content breathes in the full-height panel.
const READOUT_PAD_X = 48;
const READOUT_PAD_Y = 40;
// Top edge of the readout column, measured from the section's top. Separate from
// NAV_CLEARANCE (which the mobile chip row uses) so this can be tuned on its own. The navbar
// is fixed, 83px tall and z-index 100 — above this section — and NAV_CLEARANCE's 96 left only
// a 13px gap, so the [ BACK ] button and the progress bar under it read as tucked behind the
// bar. 136 cleared the navbar by ~53px.
//
// Now at 83 — flush with the navbar's bottom edge (the bar is 0..~83px: 1.25rem padding +
// ~40px logo pill + 1.25rem). Flush, not overlapping: the panel's top border sits exactly where
// the bar ends. This is the FULL extent of the available slack, not a tuning preference.
//
// Chosen to align the panel's top with the brain's top. MEASURED against the real GLB and this
// camera maths, brain topmost point on screen (navbar 0..83px):
//
//   viewport     default zoom      zoomed (panel open)
//   1440x800     116..125px        11..32px   (behind navbar)
//   1600x900     131..140px        13..36px   (behind navbar)
//   1920x1080    157..169px        15..44px   (behind navbar)
//
// The panel only exists while zoomed, and in that state the brain's crown is BEHIND the navbar
// at every viewport tested — so the alignment target is the highest point still visible below
// the bar, which is the bar's own bottom edge. Hence 83. Aligning instead to the default-zoom
// figure (131) was considered and rejected: it would push the panel DOWN 43px and make it
// shorter, and the default view never coexists with this panel on screen anyway.
//
// The panel is `top: READOUT_TOP; bottom: 0` inside a 100vh `overflow: hidden` section, so its
// height is exactly `100vh - READOUT_TOP`: the bottom edge is already flush with the section
// floor and a negative `bottom` would only clip the border and corner brackets. Every pixel of
// height therefore has to come off the top, and the navbar caps that. At a 900px viewport this
// is an 817px column — 91% of the viewport.
//
// MEASURED, zoomed state, 1600x900, all five nodes:
//   brain mesh spans     y 13..714px
//   pedestal spans       y 311..925px
//   scene top..bottom    y 13..925px
//   this panel           y 83..900px
// So the panel runs BELOW the brain mesh's bottom and level with the pedestal, which is itself
// clipped by the section floor. Nothing further is available at the bottom without changing the
// section's height or its overflow.
const READOUT_TOP = 83;
// Extra top padding inside the panel, above the standard vertical padding.
const READOUT_PAD_TOP = 48;
const NARROW_QUERY  = "(max-width: 1023px)";
const SLIDE_MS      = 320;

function useNarrowLayout() {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia(NARROW_QUERY);
    const onChange = () => setNarrow(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);
  return narrow;
}

// ─── Corner bracket accent ────────────────────────────────────────────────────
function CornerBracket({ pos, arm, inset = 6, color = BRACKET_COL }: {
  pos: "tl" | "tr" | "bl" | "br"; arm: number; inset?: number; color?: string;
}) {
  const isLeft = pos === "tl" || pos === "bl";
  const isTop  = pos === "tl" || pos === "tr";
  const box: React.CSSProperties = {
    position: "absolute", width: arm, height: arm, pointerEvents: "none", zIndex: 2,
    ...(isLeft ? { left: inset } : { right: inset }),
    ...(isTop  ? { top: inset }  : { bottom: inset }),
  };
  const h: React.CSSProperties = {
    position: "absolute", background: color, height: 1, width: arm,
    ...(isTop ? { top: 0 } : { bottom: 0 }),
  };
  const v: React.CSSProperties = {
    position: "absolute", background: color, width: 1, height: arm,
    ...(isLeft ? { left: 0 } : { right: 0 }),
    ...(isTop  ? { top: 0 }  : { bottom: 0 }),
  };
  return <div style={box}><div style={h} /><div style={v} /></div>;
}

function Panel({ arm, style, children }: {
  arm: number; style?: React.CSSProperties; children: React.ReactNode;
}) {
  return (
    <div style={{
      position: "relative", boxSizing: "border-box",
      border: `1px solid ${PANEL_BORDER}`, borderRadius: 4, background: PANEL_BG,
      ...style,
    }}>
      <CornerBracket pos="tl" arm={arm} />
      <CornerBracket pos="tr" arm={arm} />
      <CornerBracket pos="bl" arm={arm} />
      <CornerBracket pos="br" arm={arm} />
      {children}
    </div>
  );
}

function RuledLabel({ text, style }: { text: string; style?: React.CSSProperties }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, ...style }}>
      <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.16em", color: INK_DIM, whiteSpace: "nowrap" }}>
        {text}
      </span>
      <span style={{ flex: 1, height: 1, background: RULE_STRONG }} />
    </div>
  );
}

function FieldLabel({ text }: { text: string }) {
  return (
    <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.16em", color: INK_DIM, display: "block" }}>
      {text}
    </span>
  );
}

// ─── Node index rows ──────────────────────────────────────────────────────────
function NodeRow({ name, active, onSelect }: { name: string; active: boolean; onSelect?: () => void }) {
  const [hover, setHover] = useState(false);
  const inert = !onSelect;
  const lit = hover && !inert;
  return (
    <div
      onClick={onSelect}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ height: 30, display: "flex", alignItems: "center", gap: 14, cursor: inert ? "default" : "pointer" }}
    >
      <span style={{
        width: 11, height: 11, flexShrink: 0, boxSizing: "border-box",
        background: active ? INK : "transparent",
        border: active ? "none" : `1px solid ${lit ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.3)"}`,
        transition: "border-color 0.15s ease",
      }} />
      <span style={{
        fontFamily: MONO, fontSize: 11, letterSpacing: "0.1em",
        color: active ? INK : lit ? INK_BRIGHT : ROW_IDLE,
        transition: "color 0.15s ease",
      }}>
        {name}
      </span>
    </div>
  );
}

function LockedRow({ name }: { name: string }) {
  return (
    <div style={{ height: 30, display: "flex", alignItems: "center", gap: 14, cursor: "default" }}>
      {/* Padlock drawn into the same 11px slot the checkboxes occupy, so both lists keep the
          same left rhythm: a shackle arc sitting on a solid body block. */}
      <span style={{ width: 11, height: 11, flexShrink: 0, position: "relative", display: "block" }}>
        <span style={{
          position: "absolute", left: 2.5, top: 0, width: 6, height: 5, boxSizing: "border-box",
          border: `1px solid ${INK_LOCKED}`, borderBottom: "none",
          borderTopLeftRadius: 3, borderTopRightRadius: 3,
        }} />
        <span style={{ position: "absolute", left: 0, bottom: 0, width: 11, height: 6, background: INK_LOCKED }} />
      </span>
      <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.1em", color: INK_LOCKED }}>{name}</span>
    </div>
  );
}

// ─── Left panel — node index ──────────────────────────────────────────────────
function NodeIndexPanel({ selectedId, onSelect, arm, style }: {
  selectedId: number | null; onSelect: (id: number) => void; arm: number; style?: React.CSSProperties;
}) {
  return (
    <Panel arm={arm} style={{ padding: "20px 18px 28px", display: "flex", flexDirection: "column", ...style }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.1em", color: INK }}>
          SYS_03 // NEURAL_ARCHIVE
        </span>
        <span style={{ width: 7, height: 7, background: INK, flexShrink: 0 }} />
      </div>
      <div style={{ height: 1, background: RULE_STRONG, marginTop: 14 }} />

      <RuledLabel text={`ACTIVE NODES [${ACTIVE_PROJECTS.length}/${PROJECTS.length}]`} style={{ marginTop: 20 }} />
      <div style={{ marginTop: 4 }}>
        {PROJECTS.map((p) => (
          <NodeRow
            key={p.id}
            name={p.name}
            active={p.id === selectedId}
            onSelect={p.active ? () => onSelect(p.id) : undefined}
          />
        ))}
      </div>

      <RuledLabel text={`CLASSIFIED NODES [${CLASSIFIED_NODES.length}]`} style={{ marginTop: 22 }} />
      <div style={{ marginTop: 4 }}>
        {CLASSIFIED_NODES.map((n) => <LockedRow key={n} name={n} />)}
      </div>
    </Panel>
  );
}

// ─── Mobile node chips (horizontal scroller above the brain) ──────────────────
function NodeChipRow({ selectedId, onSelect }: { selectedId: number | null; onSelect: (id: number) => void }) {
  return (
    <div style={{
      display: "flex", gap: 8, overflowX: "auto", padding: "0 16px 2px",
      WebkitOverflowScrolling: "touch", scrollbarWidth: "none",
    }}>
      {PROJECTS.filter((p) => p.active).map((p) => {
        const on = p.id === selectedId;
        return (
          <button
            key={p.id}
            onClick={() => onSelect(p.id)}
            style={{
              flexShrink: 0, cursor: "pointer",
              background: on ? INK : "transparent",
              color: on ? VOID : ROW_IDLE,
              border: `1px solid ${on ? INK : "rgba(255,255,255,0.22)"}`,
              borderRadius: 3, padding: "8px 14px",
              fontFamily: MONO, fontSize: 10, letterSpacing: "0.12em", whiteSpace: "nowrap",
            }}
          >
            {p.name}
          </button>
        );
      })}
      {CLASSIFIED_NODES.map((n) => (
        <span key={n} style={{
          flexShrink: 0, border: "1px solid rgba(255,255,255,0.1)", borderRadius: 3,
          padding: "8px 14px", fontFamily: MONO, fontSize: 10, letterSpacing: "0.12em",
          color: INK_LOCKED, whiteSpace: "nowrap",
        }}>
          {n}
        </span>
      ))}
    </div>
  );
}

// ─── Readout pieces ───────────────────────────────────────────────────────────
const PROGRESS_SEGMENTS = 34;

function SegmentedProgress({ pct }: { pct: number }) {
  const filled = Math.round((pct / 100) * PROGRESS_SEGMENTS);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{
        flex: 1, minWidth: 0, height: 18, boxSizing: "border-box",
        border: "1px solid rgba(255,255,255,0.25)", borderRadius: 2,
        display: "flex", alignItems: "center", gap: 2, padding: "0 3px",
      }}>
        {/* Segments flex to fill the track — at a fixed 3px they only reach part-way across
            the panel, so a "full" bar would never actually look full. */}
        {Array.from({ length: PROGRESS_SEGMENTS }).map((_, i) => (
          <span key={i} style={{
            flex: "1 1 0", minWidth: 0, height: 10,
            background: i < filled ? INK : "rgba(255,255,255,0.1)",
          }} />
        ))}
      </div>
      <span style={{ fontFamily: MONO, fontSize: 10, color: INK_MID, whiteSpace: "nowrap" }}>{pct}%</span>
    </div>
  );
}

// Shrinks the title so a long name never wraps. 0.62em is JetBrains Mono's advance width
// plus the 0.02em tracking.
function titleSize(name: string, max: number, avail: number) {
  return Math.max(14, Math.min(max, Math.floor(avail / (name.length * 0.62))));
}

function PreviewFrame({ src, arm, maxHeight }: { src: string | null; arm: number; maxHeight: number }) {
  return (
    // Height-driven rather than width-driven, so capping the height shrinks the block while
    // aspect-ratio keeps it at 16:9 (a width-driven box would just get squashed instead).
    <div style={{
      position: "relative", height: maxHeight, width: "auto", maxWidth: "100%",
      marginInline: "auto", aspectRatio: "16 / 9",
      border: `1px solid ${PANEL_BORDER}`, borderRadius: 3, overflow: "hidden",
      background: "rgba(255,255,255,0.04)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      {src
        ? <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        : <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.2em", color: INK_LOCKED }}>NO_SIGNAL</span>}
      <CornerBracket pos="tl" arm={arm} inset={4} />
      <CornerBracket pos="tr" arm={arm} inset={4} />
      <CornerBracket pos="bl" arm={arm} inset={4} />
      <CornerBracket pos="br" arm={arm} inset={4} />
    </div>
  );
}

// Shared bracket-button treatment. `compact` is the smaller BACK variant.
function BracketButton({ href, label, onClick, compact }: {
  href?: string; label: string; onClick?: () => void; compact?: boolean;
}) {
  const [hover, setHover] = useState(false);
  const style: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    boxSizing: "border-box", cursor: "pointer",
    height: compact ? 34 : 52,
    width: compact ? "fit-content" : "100%",
    padding: compact ? "0 16px" : undefined,
    border: "1px solid rgba(255,255,255,0.3)", borderRadius: 3,
    background: hover ? INK : "transparent",
    color: hover ? VOID : INK,
    fontFamily: MONO, fontSize: compact ? 10 : 12, letterSpacing: "0.14em",
    textDecoration: "none", transition: "background 0.15s ease, color 0.15s ease",
  };
  const handlers = {
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
  };
  return href
    ? <a href={href} target="_blank" rel="noreferrer" style={style} {...handlers}>{label}</a>
    : <button onClick={onClick} style={style} {...handlers}>{label}</button>;
}

function NavLink({ label, onClick }: { label: string; onClick: () => void }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: "transparent", border: "none", padding: 0, cursor: "pointer",
        fontFamily: MONO, fontSize: 11, letterSpacing: "0.14em",
        color: hover ? INK : INK_MID, transition: "color 0.15s ease",
      }}
    >
      {label}
    </button>
  );
}

// ─── Right panel — project readout ────────────────────────────────────────────
function ReadoutPanel({ project, position, total, onPrev, onNext, onBack, arm, narrow }: {
  project: Project; position: number; total: number;
  onPrev: () => void; onNext: () => void; onBack: () => void;
  arm: number; narrow: boolean;
}) {
  const pct = Math.round(((position + 1) / total) * 100);
  const padX = narrow ? 24 : READOUT_PAD_X;
  const padY = narrow ? 24 : READOUT_PAD_Y;
  const padTop = narrow ? 24 : READOUT_PAD_TOP;
  // Width the title has to fit inside: the panel minus its border and horizontal padding. The
  // desktop panel is READOUT_VW of the viewport, so this is resolved from the live viewport
  // width.
  const [avail, setAvail] = useState(360);
  useEffect(() => {
    const measure = () => {
      const w = narrow ? window.innerWidth : (window.innerWidth * READOUT_VW) / 100;
      setAvail(Math.max(160, w - padX * 2 - 2));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [narrow, padX]);

  return (
    <motion.div
      initial={narrow ? { y: 40, opacity: 0 } : { x: 40, opacity: 0 }}
      animate={narrow ? { y: 0, opacity: 1 } : { x: 0, opacity: 1 }}
      exit={narrow ? { y: 40, opacity: 0 } : { x: 40, opacity: 0 }}
      transition={{ duration: SLIDE_MS / 1000, ease: "easeOut" }}
      style={{
        position: "absolute", zIndex: 20,
        ...(narrow
          ? { left: 0, right: 0, bottom: 0, height: `${SHEET_VH}vh` }
          // Full-height column rather than a vertically-centred block. The top stops at
          // READOUT_TOP rather than 0: the site navbar is fixed, full width and z-index 100,
          // so it sits ABOVE this section — a panel starting at 0 would have its top border
          // and both top corner brackets hidden behind the navbar, and the [ BACK ] button
          // with it. Flush to the section's bottom edge.
          : { top: READOUT_TOP, bottom: 0, right: READOUT_RIGHT_GAP, width: `${READOUT_VW}vw` }),
      }}
    >
      <Panel
        arm={arm}
        style={{
          height: "100%", width: "100%",
          padding: `${padTop}px ${padX}px ${padY}px`,
          display: "flex", flexDirection: "column", overflow: "hidden",
          background: "rgba(2,0,8,0.72)", backdropFilter: "blur(6px)",
        }}
      >
        <div style={{ marginBottom: 24, flexShrink: 0 }}>
          <BracketButton label="[ BACK ]" onClick={onBack} compact />
        </div>

        {/* Content cross-fades on its own (140ms out, 140ms in) while the camera keeps
            travelling, so the text swaps mid-sweep rather than at the start of it. The exit is
            held back by CONTENT_DELAY_S so the pair straddles the zoom-out leg's midpoint — the
            top of the arc, where the camera is furthest out — instead of firing on the click.
            mode="wait" means the incoming copy mounts only once the outgoing one has gone, so
            these run strictly in sequence. A first selection has nothing to exit and so fades
            straight in, undelayed. */}
        <AnimatePresence mode="wait">
          <motion.div
            key={project.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: CONTENT_FADE_S } }}
            exit={{ opacity: 0, transition: { duration: CONTENT_FADE_S, delay: CONTENT_DELAY_S } }}
            className="readout-body"
            style={{ flex: 1, minHeight: 0, overflowY: "auto" }}
          >
            <SegmentedProgress pct={pct} />

            <h3 style={{
              margin: "20px 0 0", fontFamily: MONO, fontWeight: 700,
              fontSize: titleSize(project.name, narrow ? 26 : 44, avail),
              color: INK, letterSpacing: "0.02em", lineHeight: 1.1, whiteSpace: "nowrap",
            }}>
              {project.name}
            </h3>

            <div style={{ marginTop: 22 }}>
              <FieldLabel text="PREVIEW //" />
              <div style={{ marginTop: 10 }}>
                <PreviewFrame src={project.preview} arm={narrow ? 8 : 12} maxHeight={narrow ? 170 : 150} />
              </div>
            </div>

            <div style={{ marginTop: 22 }}>
              <FieldLabel text="DESCRIPTION:" />
              <p style={{ margin: "10px 0 0", fontFamily: MONO, fontSize: 12, color: INK_MID, lineHeight: 1.75 }}>
                {project.desc}
              </p>
            </div>

            <div style={{ marginTop: 22 }}>
              <FieldLabel text="TECH_STACK:" />
              <p style={{ margin: "10px 0 0", fontFamily: MONO, fontSize: 11, color: INK_MID, lineHeight: 1.75 }}>
                {project.tech.join(", ")}
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 22 }}>
              <BracketButton href={project.demo} label="[ LAUNCH DEMO ]" />
              <BracketButton href={project.github} label="[ VIEW SOURCE ]" />
            </div>
          </motion.div>
        </AnimatePresence>

        <div style={{ paddingTop: 20, flexShrink: 0 }}>
          <div style={{ height: 1, background: RULE_SOFT }} />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
            <NavLink label="‹ PREV" onClick={onPrev} />
            <NavLink label="NEXT ›" onClick={onNext} />
          </div>
        </div>
      </Panel>
    </motion.div>
  );
}

// ─── Cursor-following node tooltip ────────────────────────────────────────────
function NodeTooltip({ name, x, y }: { name: string; x: number; y: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.12 }}
      style={{
        position: "fixed", left: x + 16, top: y + 16, zIndex: 60, pointerEvents: "none",
        background: "transparent", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 2,
        padding: "6px 12px",
        fontFamily: MONO, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase",
        color: INK, whiteSpace: "nowrap",
      }}
    >
      <CornerBracket pos="tl" arm={8} inset={-1} color="rgba(255,255,255,0.5)" />
      <CornerBracket pos="br" arm={8} inset={-1} color="rgba(255,255,255,0.5)" />
      {name}
    </motion.div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function ProjectsSection() {
  const narrow = useNarrowLayout();
  // null = default state: no readout panel, camera at the external shot.
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [tip, setTip] = useState<{ name: string; x: number; y: number } | null>(null);

  const project = selectedId === null ? null : PROJECTS[selectedId];
  const position = selectedId === null ? -1 : ACTIVE_PROJECTS.findIndex((p) => p.id === selectedId);

  const step = useCallback((delta: number) => {
    setSelectedId((cur) => {
      if (cur === null) return cur;
      const i = ACTIVE_PROJECTS.findIndex((p) => p.id === cur);
      if (i < 0) return cur;
      const n = ACTIVE_PROJECTS.length;
      return ACTIVE_PROJECTS[(i + delta + n) % n].id;
    });
  }, []);
  const prev = useCallback(() => step(-1), [step]);
  const next = useCallback(() => step(1), [step]);
  const back = useCallback(() => { setSelectedId(null); setTip(null); }, []);

  const handleHotspot = useCallback((p: Project) => setSelectedId(p.id), []);
  const handleHover = useCallback((name: string | null, x: number, y: number) => {
    setTip(name ? { name, x, y } : null);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") back();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prev, next, back]);

  const arm = narrow ? 12 : 18;
  const open = project !== null;

  return (
    <section id="projects" style={{
      // Transparent, not the palette's #020008, so the page starfield still reads through
      // the near-transparent panels and behind the free-floating brain.
      background: BG, position: "relative",
      height: "100vh", overflow: "hidden",
    }}>
      {/* The readout body scrolls when its content exceeds the shortened panel, but the
          scrollbar itself stays hidden — a visible one cuts across the panel border and its
          corner brackets. Needs a real stylesheet rule: ::-webkit-scrollbar cannot be
          expressed in an inline style object. */}
      <style>{`
        .readout-body { scrollbar-width: none; -ms-overflow-style: none; }
        .readout-body::-webkit-scrollbar { display: none; }
      `}</style>

      {/* Brain — no frame, no border, no brackets: it floats directly on the starfield.
          Both panels overlay this layer rather than displacing it. */}
      <div style={{
        position: "absolute",
        top: 0,
        // Full-width layer sitting BEHIND both panels, spanning the whole viewport, so the
        // brain is centred on the VIEWPORT rather than on the gap beside the floating left
        // panel. Deliberately not resized when the readout opens: resizing would re-centre
        // the brain on a moving box and slide it horizontally. The camera applies no lateral
        // pan either, so the brain's centre holds the same screen position in both states —
        // selecting a project only changes the approach angle and the dolly distance.
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1,
      }}>
        <Canvas
          // near is driven per-frame by CameraController: 0.1 outside, 0.004 once the camera
          // is inside the brain, where the default would slice through the surrounding mesh.
          camera={{ position: [0, 0, 1.25], fov: 45, near: 0.1, far: 20 }}
          gl={{ antialias: true, alpha: true, logarithmicDepthBuffer: true }}
          style={{ background: "transparent", position: "absolute", inset: 0 }}
        >
          <BrainScene selected={project} onHotspotSelect={handleHotspot} onHotspotHover={handleHover} />
        </Canvas>
      </div>

      {/* Left: node index — desktop column, vertically centred and only as tall as its
          content; mobile a horizontal chip scroller above the brain. */}
      {narrow ? (
        <div style={{ position: "absolute", top: NAV_CLEARANCE, left: 0, right: 0, zIndex: 10 }}>
          <NodeChipRow selectedId={selectedId} onSelect={setSelectedId} />
        </div>
      ) : (
        <div style={{
          position: "absolute", left: EDGE_PAD, top: "50%", transform: "translateY(-50%)",
          width: LEFT_W, zIndex: 10,
        }}>
          <NodeIndexPanel selectedId={selectedId} onSelect={setSelectedId} arm={arm} />
        </div>
      )}

      {/* Right: readout — absent entirely until a project is selected */}
      <AnimatePresence>
        {project && (
          <ReadoutPanel
            key="readout"
            project={project}
            position={position}
            total={ACTIVE_PROJECTS.length}
            onPrev={prev} onNext={next} onBack={back}
            arm={arm} narrow={narrow}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {tip && <NodeTooltip key="tip" name={tip.name} x={tip.x} y={tip.y} />}
      </AnimatePresence>
    </section>
  );
}
