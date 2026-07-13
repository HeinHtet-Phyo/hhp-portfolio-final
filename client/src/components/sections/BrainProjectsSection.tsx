// BrainProjectsSection — Three.js 3D brain with particle field, 4 project nodes, click modal
// Design: dark B&W deep space, procedural brain mesh, white particle scatter, glowing node dots
import { Suspense, useRef, useState, useCallback, useEffect, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Stars, Html, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

// ─── Project data ─────────────────────────────────────────────────────────────
const PROJECTS = [
  {
    id: "moodtunes",
    title: "MoodTunes AI",
    subtitle: "AI Music Mood Classifier & Recommender",
    description:
      "LightGBM-powered music recommendation engine that classifies songs by emotional mood using audio features. Trained on 10,000+ tracks with 89% accuracy, deployed as an interactive web app.",
    stats: [{ value: "89%", label: "Accuracy" }, { value: "10K+", label: "Tracks" }, { value: "LightGBM", label: "Model" }],
    tags: ["Python", "LightGBM", "scikit-learn", "Pandas", "Flask", "React"],
    github: "https://github.com/HeinHtet-Phyo/moodtunes-ai-group3",
    color: "#ffffff",
    // position on brain surface (spherical coords mapped to brain shape)
    nodePos: new THREE.Vector3(0.6, 0.9, 1.1),
  },
  {
    id: "itcareer",
    title: "IT Career Planner",
    subtitle: "AI-Powered Career Path Advisor",
    description:
      "XGBoost classifier that predicts optimal IT career paths based on skills, interests, and market demand. Provides personalised roadmaps with skill gap analysis and learning resources.",
    stats: [{ value: "XGBoost", label: "Model" }, { value: "15+", label: "Roles" }, { value: "92%", label: "Accuracy" }],
    tags: ["Python", "XGBoost", "Pandas", "NumPy", "React", "FastAPI"],
    github: "https://github.com/HeinHtet-Phyo/it-career-planner",
    color: "#ffffff",
    nodePos: new THREE.Vector3(-0.8, 0.5, 1.0),
  },
  {
    id: "citypulse",
    title: "CityPulse",
    subtitle: "Urban Data Analytics Platform",
    description:
      "Real-time urban data analytics dashboard built at the Google × CopilotKit Generative UI & A2A Hackathon in London. Visualises city metrics including transport, air quality, and population density.",
    stats: [{ value: "Real-time", label: "Data" }, { value: "Hackathon", label: "Winner" }, { value: "London", label: "City" }],
    tags: ["TypeScript", "React", "Next.js", "CopilotKit", "Google Maps API", "Tailwind"],
    github: "https://github.com/HeinHtet-Phyo/citypulse-app",
    color: "#ffffff",
    nodePos: new THREE.Vector3(0.2, -0.3, 1.3),
  },
  {
    id: "preventpath",
    title: "PreventPath",
    subtitle: "NHS Preventive Care Navigator",
    description:
      "AI-powered preventive healthcare navigator that won 2nd & 3rd place at VibeHack London 2026. Helps users navigate NHS preventive care pathways with personalised health risk assessments.",
    stats: [{ value: "2nd & 3rd", label: "VibeHack" }, { value: "NHS", label: "Integrated" }, { value: "London", label: "2026" }],
    tags: ["Python", "React", "FastAPI", "OpenAI", "NHS API", "PostgreSQL"],
    github: "https://github.com/HeinHtet-Phyo/preventpath-healthcare-app",
    color: "#ffffff",
    nodePos: new THREE.Vector3(-0.5, -0.7, 0.9),
  },
];

// ─── Brain mesh (procedural lobed sphere with gyri displacement) ──────────────
function BrainMesh({ selectedId, onSelect }: { selectedId: string | null; onSelect: (id: string) => void }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);

  // Build brain geometry: displaced sphere with lobe bumps
  const brainGeo = useMemo(() => {
    const geo = new THREE.SphereGeometry(2.2, 128, 96);
    const pos = geo.attributes.position;
    const noise = (x: number, y: number, z: number, freq: number, amp: number) => {
      // Simple pseudo-noise using sin/cos combinations
      return amp * (
        Math.sin(x * freq + 1.3) * Math.cos(y * freq * 0.8 + 0.7) * Math.sin(z * freq * 1.1 + 2.1) +
        Math.sin(x * freq * 1.7 + 0.5) * Math.cos(y * freq * 1.3 + 1.9) * Math.cos(z * freq * 0.9 + 0.3) * 0.5
      );
    };
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      const len = Math.sqrt(x * x + y * y + z * z);
      const nx = x / len, ny = y / len, nz = z / len;

      // Gyri/sulci folds — multiple frequencies
      let disp = 0;
      disp += noise(nx, ny, nz, 3.5, 0.18);
      disp += noise(nx, ny, nz, 6.0, 0.09);
      disp += noise(nx, ny, nz, 11.0, 0.045);
      disp += noise(nx, ny, nz, 18.0, 0.022);

      // Flatten bottom (brainstem area)
      if (ny < -0.6) disp *= 0.4 + (ny + 0.6) * 0.5;
      // Slightly flatten left side (sagittal fissure hint)
      if (Math.abs(nx) < 0.08) disp -= 0.06;

      const r = len + disp;
      pos.setXYZ(i, nx * r, ny * r, nz * r);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  // Slow auto-rotation
  useFrame((_, delta) => {
    if (groupRef.current && !selectedId) {
      groupRef.current.rotation.y += delta * 0.12;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Main brain mesh — dark with subtle rim lighting */}
      <mesh ref={meshRef} geometry={brainGeo} castShadow>
        <meshStandardMaterial
          color="#111111"
          roughness={0.85}
          metalness={0.05}
          envMapIntensity={0.3}
        />
      </mesh>
      {/* Subtle wireframe overlay for tech feel */}
      <mesh geometry={brainGeo}>
        <meshBasicMaterial
          color="#ffffff"
          wireframe
          transparent
          opacity={0.025}
        />
      </mesh>
      {/* Project node dots */}
      {PROJECTS.map((p) => (
        <ProjectNode
          key={p.id}
          project={p}
          isSelected={selectedId === p.id}
          onSelect={onSelect}
        />
      ))}
    </group>
  );
}

// ─── Project node dot ─────────────────────────────────────────────────────────
function ProjectNode({
  project,
  isSelected,
  onSelect,
}: {
  project: typeof PROJECTS[0];
  isSelected: boolean;
  onSelect: (id: string) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      const t = state.clock.elapsedTime;
      const pulse = 1 + Math.sin(t * 2.5 + project.nodePos.x * 3) * 0.18;
      meshRef.current.scale.setScalar(isSelected ? 1.8 : hovered ? 1.5 : pulse);
    }
  });

  return (
    <group position={project.nodePos}>
      {/* Glow sphere */}
      <mesh>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.08} />
      </mesh>
      {/* Core dot */}
      <mesh
        ref={meshRef}
        onPointerEnter={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = "pointer"; }}
        onPointerLeave={() => { setHovered(false); document.body.style.cursor = "default"; }}
        onClick={(e) => { e.stopPropagation(); onSelect(project.id); }}
      >
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshBasicMaterial color={isSelected ? "#ffffff" : hovered ? "#ffffff" : "#cccccc"} />
      </mesh>
      {/* Label on hover */}
      {(hovered || isSelected) && (
        <Html distanceFactor={8} center>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "10px",
            color: "white",
            background: "rgba(0,0,0,0.85)",
            border: "1px solid rgba(255,255,255,0.3)",
            padding: "4px 8px",
            borderRadius: "4px",
            whiteSpace: "nowrap",
            pointerEvents: "none",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}>
            {project.title}
          </div>
        </Html>
      )}
    </group>
  );
}

// ─── Neural connection lines between nodes ────────────────────────────────────
function NeuralLines() {
  const linesRef = useRef<THREE.LineSegments>(null);

  const geometry = useMemo(() => {
    const positions: number[] = [];
    // Connect each node to every other node
    for (let i = 0; i < PROJECTS.length; i++) {
      for (let j = i + 1; j < PROJECTS.length; j++) {
        const a = PROJECTS[i].nodePos;
        const b = PROJECTS[j].nodePos;
        positions.push(a.x, a.y, a.z, b.x, b.y, b.z);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    return geo;
  }, []);

  useFrame((state) => {
    if (linesRef.current) {
      const mat = linesRef.current.material as THREE.LineBasicMaterial;
      mat.opacity = 0.12 + Math.sin(state.clock.elapsedTime * 0.8) * 0.06;
    }
  });

  return (
    <lineSegments ref={linesRef} geometry={geometry}>
      <lineBasicMaterial color="#ffffff" transparent opacity={0.12} />
    </lineSegments>
  );
}

// ─── Floating particle scatter ────────────────────────────────────────────────
function BrainParticles() {
  const ref = useRef<THREE.Points>(null);

  const { positions, speeds } = useMemo(() => {
    const count = 300;
    const pos = new Float32Array(count * 3);
    const spd = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 2.5 + Math.random() * 2.5;
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
      spd[i] = 0.2 + Math.random() * 0.6;
    }
    return { positions: pos, speeds: spd };
  }, []);

  useFrame((state) => {
    if (ref.current) {
      const pos = ref.current.geometry.attributes.position.array as Float32Array;
      const t = state.clock.elapsedTime;
      for (let i = 0; i < pos.length / 3; i++) {
        pos[i * 3 + 1] += Math.sin(t * speeds[i] + i) * 0.0008;
        pos[i * 3] += Math.cos(t * speeds[i] * 0.7 + i * 0.3) * 0.0005;
      }
      ref.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#ffffff" size={0.025} transparent opacity={0.6} sizeAttenuation />
    </points>
  );
}

// ─── Scene lighting ───────────────────────────────────────────────────────────
function SceneLights() {
  return (
    <>
      <ambientLight intensity={0.15} />
      {/* Rim light from top-right — creates the dramatic B&W look */}
      <directionalLight position={[4, 6, 2]} intensity={1.2} color="#ffffff" />
      {/* Subtle fill from left */}
      <directionalLight position={[-3, 0, -2]} intensity={0.25} color="#aaaaaa" />
      {/* Bottom shadow fill */}
      <directionalLight position={[0, -4, 1]} intensity={0.1} color="#555555" />
    </>
  );
}

// ─── Camera controller — zoom to selected node ───────────────────────────────
function CameraController({ selectedId }: { selectedId: string | null }) {
  const { camera } = useThree();
  const targetPos = useRef(new THREE.Vector3(0, 3.8, 9));
  const targetLook = useRef(new THREE.Vector3(0, 0, 0));

  useEffect(() => {
    if (selectedId) {
      const project = PROJECTS.find(p => p.id === selectedId);
      if (project) {
        // Zoom toward the node
        const n = project.nodePos.clone().normalize();
        targetPos.current.set(n.x * 5, n.y * 5 + 1, n.z * 5 + 5);
        targetLook.current.copy(project.nodePos);
      }
    } else {
      targetPos.current.set(0, 3.8, 9);
      targetLook.current.set(0, 0, 0);
    }
  }, [selectedId]);

  useFrame((_, delta) => {
    camera.position.lerp(targetPos.current, delta * 2.5);
    const currentLook = new THREE.Vector3();
    camera.getWorldDirection(currentLook);
    const desiredDir = targetLook.current.clone().sub(camera.position).normalize();
    const lerpedDir = currentLook.lerp(desiredDir, delta * 2.5);
    camera.lookAt(camera.position.clone().add(lerpedDir));
  });

  return null;
}

// ─── Project detail modal ─────────────────────────────────────────────────────
function ProjectModal({ project, onClose, onPrev, onNext, idx }: {
  project: typeof PROJECTS[0];
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  idx: number;
}) {
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onNext();
      if (e.key === "ArrowLeft") onPrev();
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose, onPrev, onNext]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        padding: "2rem",
        pointerEvents: "none",
      }}
    >
      {/* Backdrop click */}
      <div
        style={{ position: "fixed", inset: 0, pointerEvents: "auto" }}
        onClick={onClose}
      />
      {/* Panel */}
      <div
        style={{
          position: "relative",
          width: "min(420px, 90vw)",
          background: "rgba(8,8,10,0.96)",
          border: "1px solid rgba(255,255,255,0.15)",
          borderRadius: "16px",
          overflow: "hidden",
          pointerEvents: "auto",
          animation: "slideInRight 0.3s cubic-bezier(0.23,1,0.32,1)",
          backdropFilter: "blur(20px)",
        }}
      >
        <style>{`
          @keyframes slideInRight {
            from { opacity: 0; transform: translateX(40px) scale(0.97); }
            to   { opacity: 1; transform: translateX(0) scale(1); }
          }
        `}</style>

        {/* Header */}
        <div style={{ padding: "1.5rem 1.5rem 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.65rem",
              letterSpacing: "0.2em",
              color: "rgba(255,255,255,0.35)",
              textTransform: "uppercase",
            }}>
              ● {String(idx + 1).padStart(2, "0")} — PROJECT
            </div>
            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: "6px",
                color: "rgba(255,255,255,0.5)",
                cursor: "pointer",
                padding: "4px 8px",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "0.65rem",
                letterSpacing: "0.1em",
              }}
            >
              ESC
            </button>
          </div>
          <h3 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 700,
            fontSize: "1.5rem",
            color: "#ffffff",
            margin: "0 0 0.25rem",
            lineHeight: 1.2,
          }}>
            {project.title}
          </h3>
          <p style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.7rem",
            color: "rgba(255,255,255,0.4)",
            margin: "0 0 1rem",
            letterSpacing: "0.05em",
          }}>
            {project.subtitle}
          </p>
        </div>

        {/* Divider */}
        <div style={{ height: "1px", background: "rgba(255,255,255,0.07)", margin: "0 1.5rem" }} />

        {/* Body */}
        <div style={{ padding: "1rem 1.5rem" }}>
          <p style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.75rem",
            color: "rgba(255,255,255,0.55)",
            lineHeight: 1.7,
            margin: "0 0 1.25rem",
          }}>
            {project.description}
          </p>

          {/* Stats */}
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem" }}>
            {project.stats.map(s => (
              <div key={s.label} style={{
                flex: 1,
                padding: "0.6rem 0.5rem",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
                textAlign: "center",
              }}>
                <div style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  color: "#ffffff",
                  lineHeight: 1,
                }}>
                  {s.value}
                </div>
                <div style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.6rem",
                  color: "rgba(255,255,255,0.3)",
                  marginTop: "4px",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          {/* Tech stack */}
          <div style={{ marginBottom: "1.25rem" }}>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.6rem",
              color: "rgba(255,255,255,0.25)",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              marginBottom: "0.5rem",
            }}>
              Tech Stack
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
              {project.tags.map(tag => (
                <span key={tag} style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.65rem",
                  color: "rgba(255,255,255,0.55)",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: "4px",
                  padding: "3px 8px",
                  letterSpacing: "0.05em",
                }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* GitHub button */}
          <a
            href={project.github}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              width: "100%",
              padding: "0.75rem",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.18)",
              borderRadius: "8px",
              color: "#ffffff",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.7rem",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              textDecoration: "none",
              cursor: "pointer",
              transition: "background 0.2s, border-color 0.2s",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.12)";
              (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(255,255,255,0.35)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.06)";
              (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(255,255,255,0.18)";
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
            View on GitHub
          </a>
        </div>

        {/* Prev / Next */}
        <div style={{
          display: "flex",
          borderTop: "1px solid rgba(255,255,255,0.07)",
        }}>
          <button
            onClick={onPrev}
            disabled={idx === 0}
            style={{
              flex: 1,
              padding: "0.75rem",
              background: "none",
              border: "none",
              borderRight: "1px solid rgba(255,255,255,0.07)",
              color: idx === 0 ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.4)",
              cursor: idx === 0 ? "not-allowed" : "pointer",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.65rem",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.4rem",
            }}
          >
            ← PREV
          </button>
          <button
            onClick={onNext}
            disabled={idx === PROJECTS.length - 1}
            style={{
              flex: 1,
              padding: "0.75rem",
              background: "none",
              border: "none",
              color: idx === PROJECTS.length - 1 ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.4)",
              cursor: idx === PROJECTS.length - 1 ? "not-allowed" : "pointer",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.65rem",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.4rem",
            }}
          >
            NEXT →
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Left panel — project list ────────────────────────────────────────────────
function LeftPanel({ selectedId, onSelect }: { selectedId: string | null; onSelect: (id: string | null) => void }) {
  return (
    <div style={{
      position: "absolute",
      left: "5vw",
      top: "50%",
      transform: "translateY(-50%)",
      zIndex: 10,
      display: "flex",
      flexDirection: "column",
      gap: "0.75rem",
    }}>
      {PROJECTS.map((p, i) => (
        <button
          key={p.id}
          onClick={() => onSelect(selectedId === p.id ? null : p.id)}
          style={{
            background: selectedId === p.id ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.6)",
            border: `1px solid ${selectedId === p.id ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.12)"}`,
            borderRadius: "8px",
            padding: "0.6rem 1rem",
            cursor: "pointer",
            textAlign: "left",
            backdropFilter: "blur(10px)",
            transition: "all 0.2s ease",
            minWidth: "160px",
          }}
          onMouseEnter={e => {
            if (selectedId !== p.id) {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.3)";
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)";
            }
          }}
          onMouseLeave={e => {
            if (selectedId !== p.id) {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.12)";
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,0,0,0.6)";
            }
          }}
        >
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.6rem",
            color: "rgba(255,255,255,0.3)",
            letterSpacing: "0.15em",
            marginBottom: "2px",
          }}>
            {String(i + 1).padStart(2, "0")}
          </div>
          <div style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 600,
            fontSize: "0.8rem",
            color: selectedId === p.id ? "#ffffff" : "rgba(255,255,255,0.7)",
            letterSpacing: "0.02em",
          }}>
            {p.title}
          </div>
        </button>
      ))}
    </div>
  );
}

// ─── Section label ────────────────────────────────────────────────────────────
function SectionLabel() {
  return (
    <div style={{
      position: "absolute",
      top: "2rem",
      left: "8vw",
      zIndex: 10,
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: "0.7rem",
      letterSpacing: "0.2em",
      textTransform: "uppercase",
      color: "rgba(255,255,255,0.5)",
    }}>
      <span style={{ color: "#4ade80", fontSize: "0.5rem" }}>●</span>
      02 — PROJECTS
    </div>
  );
}

// ─── Hint text ────────────────────────────────────────────────────────────────
function HintText({ selectedId }: { selectedId: string | null }) {
  return (
    <div style={{
      position: "absolute",
      bottom: "2rem",
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 10,
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: "0.65rem",
      color: "rgba(255,255,255,0.25)",
      letterSpacing: "0.15em",
      textTransform: "uppercase",
      textAlign: "center",
      transition: "opacity 0.3s",
      opacity: selectedId ? 0 : 1,
      pointerEvents: "none",
    }}>
      Click a node or select from the list
    </div>
  );
}

// ─── Main exported component ──────────────────────────────────────────────────
export default function BrainProjectsSection() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const project = selectedId ? PROJECTS.find(p => p.id === selectedId) ?? null : null;
  const idx = project ? PROJECTS.findIndex(p => p.id === selectedId) : -1;

  const prev = useCallback(() => {
    if (idx > 0) setSelectedId(PROJECTS[idx - 1].id);
  }, [idx]);

  const next = useCallback(() => {
    if (idx < PROJECTS.length - 1) setSelectedId(PROJECTS[idx + 1].id);
  }, [idx]);

  return (
    <section
      id="projects"
      style={{
        position: "relative",
        height: "100vh",
        minHeight: 640,
        background: "transparent",
        zIndex: 2,
      }}
    >
      <SectionLabel />
      <LeftPanel selectedId={selectedId} onSelect={(id) => setSelectedId(id)} />
      <HintText selectedId={selectedId} />

      {/* Three.js Canvas */}
      <div style={{ position: "absolute", inset: 0 }}>
        <Canvas
          camera={{ position: [0, 3.8, 9], fov: 52 }}
          gl={{ antialias: true, alpha: true }}
          style={{ background: "transparent" }}
        >
          <SceneLights />
          <Stars radius={80} depth={50} count={2000} factor={4} saturation={0} fade speed={0.3} />
          <BrainMesh selectedId={selectedId} onSelect={setSelectedId} />
          <NeuralLines />
          <BrainParticles />
          <CameraController selectedId={selectedId} />
        </Canvas>
      </div>

      {/* Project detail modal */}
      {project && (
        <ProjectModal
          project={project}
          idx={idx}
          onClose={() => setSelectedId(null)}
          onPrev={prev}
          onNext={next}
        />
      )}
    </section>
  );
}
