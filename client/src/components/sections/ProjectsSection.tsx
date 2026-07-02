/**
 * ProjectsSection — Particle AI Brain (matching Spline reference)
 *
 * Visual approach:
 * - Solid dark brain mesh with visible gyri/sulci folds (procedural displacement)
 * - White particle halo surrounding the brain (densest at surface, scattering outward)
 * - Vertical midline highlight (longitudinal fissure)
 * - Auto-rotates, drag to spin, scroll to zoom
 * - 4 coloured project nodes on brain surface
 *
 * Interaction:
 * - Click a node → camera zooms INTO that brain region
 * - Neural network connections appear INSIDE the brain at that location
 * - Detail panel slides in from right
 * - ESC / click background to return
 */

import { Canvas, useFrame, useThree } from "@react-three/fiber";
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
    hex: new THREE.Color("#00d4ff"),
    pos: [-0.55, 0.38, 0.72] as [number, number, number],
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
    hex: new THREE.Color("#c084fc"),
    pos: [0.55, 0.38, 0.68] as [number, number, number],
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
    hex: new THREE.Color("#34d399"),
    pos: [-0.48, -0.28, 0.80] as [number, number, number],
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
    hex: new THREE.Color("#fbbf24"),
    pos: [0.48, -0.28, 0.78] as [number, number, number],
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

// ─── Brain Mesh ───────────────────────────────────────────────────────────────
// Procedurally displaced sphere to look like a brain with gyri/sulci
function createBrainGeometry(): THREE.BufferGeometry {
  // Start with a high-res sphere
  const geo = new THREE.SphereGeometry(1.0, 128, 96);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const arr = pos.array as Float32Array;

  for (let i = 0; i < pos.count; i++) {
    const x = arr[i * 3 + 0];
    const y = arr[i * 3 + 1];
    const z = arr[i * 3 + 2];

    // Normalize to get direction
    const len = Math.sqrt(x * x + y * y + z * z);
    const nx = x / len, ny = y / len, nz = z / len;

    // Multi-octave gyri noise - deeper and more pronounced
    const g1 = Math.sin(nx * 8.5 + ny * 7.2) * Math.cos(nz * 9.1 + nx * 6.8) * 0.12;
    const g2 = Math.sin(ny * 13.4 + nz * 11.8) * Math.cos(nx * 12.3 + ny * 10.1) * 0.075;
    const g3 = Math.sin(nz * 18.2 + nx * 16.5) * Math.cos(ny * 17.3 + nz * 15.9) * 0.045;
    const g4 = Math.sin(nx * 24.1 + nz * 22.7) * Math.cos(ny * 23.4 + nx * 21.2) * 0.025;
    // Sulci (deeper grooves)
    const s1 = Math.abs(Math.sin(nx * 6.2 + ny * 5.8)) * -0.065;
    const s2 = Math.abs(Math.sin(ny * 9.4 + nz * 8.6)) * -0.040;

    // Brain shape: wider at top, narrower at bottom, elongated front-back
    const shapeX = 0.88 + Math.abs(ny) * 0.04;
    const shapeY = 0.78 + (ny > 0 ? 0.12 : -0.05);
    const shapeZ = 0.92;

    // Cerebellum bump at back-bottom
    const cerebellum = ny < -0.3 && nz < -0.1
      ? 0.06 * Math.exp(-((ny + 0.55) ** 2 + (nz + 0.4) ** 2) * 8)
      : 0;

    // Longitudinal fissure (midline groove)
    const fissure = Math.abs(nx) < 0.08 ? -0.06 * (1 - Math.abs(nx) / 0.08) : 0;

    const r = 1.0 + g1 + g2 + g3 + g4 + s1 + s2 + cerebellum + fissure;

    arr[i * 3 + 0] = nx * r * shapeX;
    arr[i * 3 + 1] = ny * r * shapeY;
    arr[i * 3 + 2] = nz * r * shapeZ;
  }

  geo.computeVertexNormals();
  return geo;
}

// ─── Particle Halo Generator ──────────────────────────────────────────────────
// Particles form a halo/cloud around the brain — densest at surface, scatter outward
function generateHaloParticles(count: number) {
  const rng = makeRng(27182);
  const positions = new Float32Array(count * 3);
  const phases    = new Float32Array(count);
  const sizes     = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    // Random direction on sphere
    const u = rng(), v = rng();
    const theta = 2 * Math.PI * u;
    const phi   = Math.acos(2 * v - 1);
    const nx = Math.sin(phi) * Math.cos(theta);
    const ny = Math.sin(phi) * Math.sin(theta);
    const nz = Math.cos(phi);

    // Brain shape factors
    const shapeX = 0.88 + Math.abs(ny) * 0.04;
    const shapeY = 0.78 + (ny > 0 ? 0.12 : -0.05);
    const shapeZ = 0.92;

    // Distance from brain surface: exponential falloff (most particles near surface)
    const surfaceR = 1.0;
    const scatter = rng();
    // 70% within 0-0.25 of surface, 30% scattered further out
    const dist = scatter < 0.7
      ? surfaceR + rng() * 0.25
      : surfaceR + 0.25 + rng() * 0.55;

    positions[i * 3 + 0] = nx * dist * shapeX;
    positions[i * 3 + 1] = ny * dist * shapeY;
    positions[i * 3 + 2] = nz * dist * shapeZ;
    phases[i] = rng() * Math.PI * 2;
    // Particles closer to surface are slightly larger
    sizes[i] = dist < 1.15 ? 0.008 + rng() * 0.006 : 0.004 + rng() * 0.004;
  }

  return { positions, phases, sizes };
}

// ─── Brain Mesh Component ─────────────────────────────────────────────────────
function BrainMeshObj({
  selected,
  groupRef,
}: {
  selected: Project | null;
  groupRef: React.RefObject<THREE.Group | null>;
}) {
  const HALO_COUNT = 22000;
  const meshRef   = useRef<THREE.Mesh>(null);
  const pointsRef = useRef<THREE.Points>(null);

  const brainGeo = useMemo(() => createBrainGeometry(), []);

  const brainMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#1a1a1e",
        emissive: "#000000",
        emissiveIntensity: 0.0,
        roughness: 0.85,
        metalness: 0.02,
      }),
    []
  );

  const { positions: haloBase, phases, sizes } = useMemo(
    () => generateHaloParticles(HALO_COUNT),
    []
  );
  const animPos = useMemo(() => new Float32Array(haloBase), [haloBase]);

  const haloGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(animPos, 3));
    // White/light grey colours
    const colors = new Float32Array(HALO_COUNT * 3);
    const rngC = makeRng(99991);
    for (let i = 0; i < HALO_COUNT; i++) {
      const brightness = 0.55 + rngC() * 0.45;
      colors[i * 3 + 0] = brightness * 0.92;
      colors[i * 3 + 1] = brightness * 0.95;
      colors[i * 3 + 2] = brightness; // pure white/grey
    }
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return geo;
  }, [animPos]);

  const haloMat = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: 0.008,
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

    // Auto-rotate
    if (!selected) groupRef.current.rotation.y += 0.0022;

    const t = state.clock.elapsedTime;
    const posAttr = haloGeo.attributes.position as THREE.BufferAttribute;
    const posArr  = posAttr.array as Float32Array;

    // Breathing animation — particles gently drift outward and back
    for (let i = 0; i < HALO_COUNT; i++) {
      const ph = phases[i];
      const breathe = 1.0 + 0.022 * Math.sin(t * 0.55 + ph);
      posArr[i * 3 + 0] = haloBase[i * 3 + 0] * breathe;
      posArr[i * 3 + 1] = haloBase[i * 3 + 1] * breathe;
      posArr[i * 3 + 2] = haloBase[i * 3 + 2] * breathe;
    }
    posAttr.needsUpdate = true;

    // Fade brain opacity when zoomed in
    brainMat.opacity = THREE.MathUtils.lerp(
      brainMat.opacity ?? 1.0,
      selected ? 0.45 : 1.0,
      0.04
    );
    haloMat.opacity = THREE.MathUtils.lerp(
      haloMat.opacity,
      selected ? 0.55 : 0.88,
      0.04
    );
  });

  return (
    <group ref={groupRef}>
      {/* Solid brain mesh */}
      <mesh ref={meshRef} geometry={brainGeo} material={brainMat} />

      {/* Midline highlight — vertical line along longitudinal fissure */}
      <mesh>
        <cylinderGeometry args={[0.005, 0.005, 1.6, 8]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.18} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      {/* Particle halo */}
      <points ref={pointsRef} geometry={haloGeo} material={haloMat} />
    </group>
  );
}

// ─── Neural Network Inside Brain ──────────────────────────────────────────────
function BrainNeuralNetwork({ project, visible }: { project: Project | null; visible: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const fadeRef  = useRef(0);

  const { lines, nodes, lineMat, nodeMats } = useMemo(() => {
    if (!project) return { lines: null, nodes: null, lineMat: null, nodeMats: [] };
    const rng = makeRng(project.id * 7919 + 42);
    const N   = 90;
    const base  = new THREE.Color(project.color);
    const white = new THREE.Color("#ffffff");
    const palette = [base, base.clone().lerp(white, 0.4), white.clone().multiplyScalar(0.9), base.clone().lerp(new THREE.Color("#00d4ff"), 0.35)];

    // Nodes clustered around the project region
    const [px, py, pz] = project.pos;
    const nodePos: THREE.Vector3[] = [];
    for (let i = 0; i < N; i++) {
      const theta = rng() * Math.PI * 2;
      const phi   = Math.acos(2 * rng() - 1);
      const r     = 0.05 + rng() * 0.52;
      nodePos.push(new THREE.Vector3(
        px + r * Math.sin(phi) * Math.cos(theta),
        py + r * Math.sin(phi) * Math.sin(theta),
        pz + r * Math.cos(phi)
      ));
    }

    // Lines
    const posArr: number[] = [], colArr: number[] = [];
    for (let i = 0; i < N; i++) {
      for (let j = i + 1; j < N; j++) {
        if (nodePos[i].distanceTo(nodePos[j]) < 0.45 && rng() > 0.30) {
          posArr.push(nodePos[i].x, nodePos[i].y, nodePos[i].z, nodePos[j].x, nodePos[j].y, nodePos[j].z);
          const c = palette[Math.floor(rng() * palette.length)];
          colArr.push(c.r, c.g, c.b, c.r, c.g, c.b);
        }
      }
    }
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(posArr), 3));
    lineGeo.setAttribute("color",    new THREE.BufferAttribute(new Float32Array(colArr), 3));
    const lineMat = new THREE.LineBasicMaterial({
      vertexColors: true, transparent: true, opacity: 0,
      depthWrite: false, blending: THREE.AdditiveBlending,
    });
    const lines = new THREE.LineSegments(lineGeo, lineMat);

    // Node spheres
    const sphereGeo = new THREE.SphereGeometry(0.016, 8, 8);
    const nodeMats: THREE.MeshBasicMaterial[] = [];
    const nodeGroup = new THREE.Group();
    nodePos.forEach((p) => {
      const c = palette[Math.floor(rng() * palette.length)].clone();
      const mat = new THREE.MeshBasicMaterial({
        color: c, transparent: true, opacity: 0,
        blending: THREE.AdditiveBlending, depthWrite: false,
      });
      nodeMats.push(mat);
      const mesh = new THREE.Mesh(sphereGeo, mat);
      mesh.position.copy(p);
      nodeGroup.add(mesh);
    });

    return { lines, nodes: nodeGroup, lineMat, nodeMats };
  }, [project]);

  useFrame((_, delta) => {
    if (!groupRef.current || !lineMat) return;
    const target = visible ? 1.0 : 0.0;
    fadeRef.current = THREE.MathUtils.lerp(fadeRef.current, target, delta * 2.5);
    lineMat.opacity = fadeRef.current * 0.9;
    nodeMats.forEach(m => { m.opacity = fadeRef.current * 0.95; });
    if (visible) groupRef.current.rotation.y += delta * 0.10;
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
      ? 1.6 + 0.22 * Math.sin(t * 3.2)
      : hovered
      ? 1.35 + 0.10 * Math.sin(t * 4.0)
      : 1.0 + 0.08 * Math.sin(t * 1.7 + project.id * 1.4);

    coreRef.current.scale.setScalar(pulse);
    glowRef.current.scale.setScalar(pulse * 2.4);

    const coreMat = coreRef.current.material as THREE.MeshStandardMaterial;
    coreMat.emissiveIntensity = selected ? 10 : hovered ? 7 : 4;
    coreMat.opacity = THREE.MathUtils.lerp(coreMat.opacity, anySelected && !selected ? 0.08 : 1.0, 0.07);

    const glowMat = glowRef.current.material as THREE.MeshBasicMaterial;
    glowMat.opacity = THREE.MathUtils.lerp(
      glowMat.opacity,
      anySelected && !selected ? 0.01 : selected ? 0.70 : hovered ? 0.45 : 0.28,
      0.07
    );
  });

  return (
    <group position={project.pos}>
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.28} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh
        ref={coreRef}
        onClick={(e) => { e.stopPropagation(); onSelect(); }}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = "pointer"; }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = "default"; }}
      >
        <sphereGeometry args={[0.024, 16, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={4} roughness={0.05} metalness={0.9} transparent opacity={1} />
      </mesh>
    </group>
  );
}

// ─── Camera Controller ────────────────────────────────────────────────────────
function CameraController({ selected, controlsRef }: { selected: Project | null; controlsRef: React.RefObject<any> }) {
  const targetPos  = useRef(new THREE.Vector3(0, 0, 4.5));
  const targetLook = useRef(new THREE.Vector3(0, 0, 0));

  useEffect(() => {
    if (selected) {
      const [px, py, pz] = selected.pos;
      // Zoom into the brain region — camera moves close to the node
      const dir = new THREE.Vector3(px, py, pz).normalize();
      const dist = 1.6;
      targetPos.current.set(
        dir.x * dist + px * 0.2,
        dir.y * dist + py * 0.2,
        dir.z * dist + pz * 0.2
      );
      targetLook.current.set(px * 0.6, py * 0.6, pz * 0.6);
      if (controlsRef.current) controlsRef.current.enabled = false;
    } else {
      targetPos.current.set(0, 0, 4.5);
      targetLook.current.set(0, 0, 0);
      if (controlsRef.current) controlsRef.current.enabled = true;
    }
  }, [selected, controlsRef]);

  useFrame(({ camera }, delta) => {
    camera.position.lerp(targetPos.current, delta * 2.2);
    if (controlsRef.current) controlsRef.current.target.lerp(targetLook.current, delta * 2.2);
  });

  return null;
}

// ─── Scene ────────────────────────────────────────────────────────────────────
function BrainScene({ selected, onSelect, controlsRef }: {
  selected: Project | null;
  onSelect: (p: Project | null) => void;
  controlsRef: React.RefObject<any>;
}) {
  const brainGroupRef = useRef<THREE.Group>(null);

  return (
    <>
      <ambientLight intensity={0.08} />
      <directionalLight position={[3, 5, 4]}    intensity={8.5} color="#f0f4ff" />
      <directionalLight position={[-3, 2, 2]}   intensity={3.0} color="#aabbdd" />
      <directionalLight position={[0, -4, 2]}   intensity={1.5} color="#778899" />
      <directionalLight position={[0, 1, -4]}   intensity={0.8} color="#556677" />
      <pointLight position={[2, 3, 3]}  intensity={5.0} color="#ffffff" distance={8} />
      <pointLight position={[-2, 2, 2]} intensity={2.5} color="#99aabb" distance={6} />

      <Stars radius={120} depth={60} count={4000} factor={3} fade speed={0.25} />

      {/* Brain mesh + particle halo */}
      <BrainMeshObj selected={selected} groupRef={brainGroupRef} />

      {/* Neural network — appears inside brain on click */}
      <BrainNeuralNetwork project={selected} visible={!!selected} />

      {/* Project nodes — in world space (don't rotate with brain) */}
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
        minDistance={1.5}
        maxDistance={9}
        dampingFactor={0.07}
        enableDamping
        autoRotate={false}
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
        background: "rgba(0,0,0,0.90)",
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
            GitHub →
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
        camera={{ position: [0, 0, 4.5], fov: 52 }}
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
