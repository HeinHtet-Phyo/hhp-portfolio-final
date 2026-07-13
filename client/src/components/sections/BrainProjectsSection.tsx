// BrainProjectsSection — Holographic glowing brain with Fresnel rim shader
// B&W/silver hologram style: translucent mesh + rim glow + inner glow + wireframe
// Layout: [SYS.LOG terminal] | [Holographic brain] | [PROJECTS list]
// Inspired by bytezpro/threejs-brain-animation — monochrome hologram version

import { useRef, useState, useEffect, useCallback, Suspense, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";

import holoVertexShader from "../../shaders/holo.vertex.glsl";
import holoFragmentShader from "../../shaders/holo.fragment.glsl";
import holoInnerFragmentShader from "../../shaders/holo-inner.fragment.glsl";

// ─── Project data ─────────────────────────────────────────────────────────────
const PROJECTS = [
  {
    id: "moodtunes",
    title: "MoodTunes AI",
    subtitle: "ML · Music Recommender",
    description:
      "LightGBM-powered music recommendation engine that classifies songs by emotional mood using audio features. Trained on 10,000+ tracks with 89% accuracy.",
    stats: [
      { value: "89%", label: "Accuracy" },
      { value: "10K+", label: "Tracks" },
      { value: "LightGBM", label: "Model" },
    ],
    tags: ["Python", "LightGBM", "scikit-learn", "Pandas", "Flask", "React"],
    github: "https://github.com/HeinHtet-Phyo/moodtunes-ai-group3",
    nodePos: new THREE.Vector3(0.38, 0.30, 0.12),
  },
  {
    id: "itcareer",
    title: "IT Career Planner",
    subtitle: "XGBoost · Career AI",
    description:
      "XGBoost classifier that predicts optimal IT career paths based on skills, interests, and market demand. Personalised roadmaps with skill gap analysis.",
    stats: [
      { value: "XGBoost", label: "Model" },
      { value: "15+", label: "Roles" },
      { value: "92%", label: "Accuracy" },
    ],
    tags: ["Python", "XGBoost", "Pandas", "NumPy", "React", "FastAPI"],
    github: "https://github.com/HeinHtet-Phyo/it-career-planner",
    nodePos: new THREE.Vector3(-0.38, 0.32, 0.08),
  },
  {
    id: "citypulse",
    title: "CityPulse",
    subtitle: "Urban Data Analytics",
    description:
      "Real-time urban data analytics dashboard built at Google × CopilotKit Hackathon in London. Visualises city metrics including transport, air quality, and population density.",
    stats: [
      { value: "Real-time", label: "Data" },
      { value: "Hackathon", label: "Built" },
      { value: "London", label: "City" },
    ],
    tags: ["TypeScript", "React", "Next.js", "CopilotKit", "Google Maps API"],
    github: "https://github.com/HeinHtet-Phyo/citypulse-app",
    nodePos: new THREE.Vector3(0.55, -0.08, 0.18),
  },
  {
    id: "preventpath",
    title: "PreventPath",
    subtitle: "Health AI · Prevention",
    description:
      "AI-powered preventive healthcare navigator that won 2nd & 3rd place at VibeHack London 2026. Helps users navigate NHS preventive care pathways.",
    stats: [
      { value: "2nd & 3rd", label: "VibeHack" },
      { value: "NHS", label: "Integrated" },
      { value: "London", label: "2026" },
    ],
    tags: ["Python", "React", "FastAPI", "OpenAI", "NHS API", "PostgreSQL"],
    github: "https://github.com/HeinHtet-Phyo/preventpath-healthcare-app",
    nodePos: new THREE.Vector3(0.12, -0.44, -0.08),
  },
];

type Project = (typeof PROJECTS)[0];

// ─── Holographic brain with Fresnel shader ─────────────────────────────────────
function HoloBrain({
  selectedId,
  onSelectNode,
}: {
  selectedId: string | null;
  onSelectNode: (id: string) => void;
}) {
  const gltf = useGLTF("/manus-storage/brain_79ab9919.glb");
  const groupRef = useRef<THREE.Group>(null);
  const outerMatRef = useRef<THREE.ShaderMaterial | null>(null);
  const innerMatRef = useRef<THREE.ShaderMaterial | null>(null);
  const wireMatRef = useRef<THREE.MeshBasicMaterial | null>(null);
  const { camera, raycaster, pointer, gl } = useThree();
  const nodeRefs = useRef<THREE.Mesh[]>([]);
  const nodeRingRefs = useRef<THREE.Mesh[]>([]);
  const hoverNodeRef = useRef<number>(-1);
  const autoRotateRef = useRef(true);
  const pulseRef = useRef(0);

  // Set initial rotation to show side profile (left side of brain)
  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y = -Math.PI * 0.35; // show left side profile
    }
  }, []);

  const brainGeo = useMemo(() => {
    const mesh = gltf.scene.children[0] as THREE.Mesh;
    if (!mesh?.geometry) return null;
    // Compute vertex normals for smooth shading
    const geo = mesh.geometry.clone();
    geo.computeVertexNormals();
    return geo;
  }, [gltf]);

  // Holographic outer material (Fresnel rim glow)
  const outerMat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: holoVertexShader,
    fragmentShader: holoFragmentShader,
    uniforms: {
      uColor:       { value: new THREE.Color(0.82, 0.88, 0.96) },
      uRimColor:    { value: new THREE.Color(0.92, 0.96, 1.0) },
      uRimPower:    { value: 2.2 },
      uRimStrength: { value: 3.8 },
      uOpacity:     { value: 0.18 },
      uGlowPulse:   { value: 0.0 },
      uLightDir:    { value: new THREE.Vector3(1.5, 2.5, 1.5).normalize() },
    },
    transparent: true,
    side: THREE.FrontSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }), []); // additive blending gives the glowing hologram look

  // Inner glow (back-side)
  const innerMat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: holoVertexShader,
    fragmentShader: holoInnerFragmentShader,
    uniforms: {
      uColor:     { value: new THREE.Color(0.9, 0.95, 1.0) },
      uGlowPulse: { value: 0.0 },
    },
    transparent: true,
    side: THREE.BackSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }), []);

  // Wireframe overlay
  const wireMat = useMemo(() => new THREE.MeshBasicMaterial({
    color: new THREE.Color(0.9, 0.95, 1.0),
    wireframe: true,
    transparent: true,
    opacity: 0.055,
  }), []);

  // Node materials
  const nodeDotMat = useMemo(() => new THREE.MeshBasicMaterial({ color: "#ffffff" }), []);
  const nodeRingMat = useMemo(() => new THREE.MeshBasicMaterial({
    color: "#ffffff",
    transparent: true,
    opacity: 0.4,
    side: THREE.DoubleSide,
  }), []);

  outerMatRef.current = outerMat;
  innerMatRef.current = innerMat;
  wireMatRef.current = wireMat;

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // Slow auto-rotation
    if (autoRotateRef.current && !selectedId) {
      groupRef.current.rotation.y += delta * 0.32;
    }

    // Pulse animation
    pulseRef.current = (Math.sin(state.clock.elapsedTime * 1.4) + 1) * 0.5;
    if (outerMat.uniforms.uGlowPulse) outerMat.uniforms.uGlowPulse.value = pulseRef.current;
    if (innerMat.uniforms.uGlowPulse) innerMat.uniforms.uGlowPulse.value = pulseRef.current;

    // Pulse node rings
    nodeRingRefs.current.forEach((ring, i) => {
      if (!ring) return;
      const t = state.clock.elapsedTime + i * 1.1;
      const pulse = 0.2 + Math.sin(t * 2.0) * 0.15;
      (ring.material as THREE.MeshBasicMaterial).opacity = pulse;
      const s = 1 + Math.sin(t * 2.0) * 0.1;
      ring.scale.setScalar(s);
      ring.lookAt(camera.position);
    });

    // Raycasting for node hover
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(nodeRefs.current.filter(Boolean));
    const newHover = hits.length > 0 ? nodeRefs.current.indexOf(hits[0].object as THREE.Mesh) : -1;
    if (newHover !== hoverNodeRef.current) {
      hoverNodeRef.current = newHover;
      gl.domElement.style.cursor = newHover >= 0 ? "pointer" : "default";
    }

    // Scale hovered/selected nodes
    nodeRefs.current.forEach((nm, i) => {
      if (!nm) return;
      const isHover = i === hoverNodeRef.current;
      const isSelected = selectedId === PROJECTS[i].id;
      const target = isHover || isSelected ? 2.0 : 1.0;
      nm.scale.lerp(new THREE.Vector3(target, target, target), 0.12);
    });
  });

  const handleClick = useCallback(() => {
    if (hoverNodeRef.current >= 0) {
      onSelectNode(PROJECTS[hoverNodeRef.current].id);
    }
  }, [onSelectNode]);

  useEffect(() => {
    const canvas = gl.domElement;
    canvas.addEventListener("click", handleClick);
    return () => canvas.removeEventListener("click", handleClick);
  }, [gl, handleClick]);

  // Camera zoom on selection
  useEffect(() => {
    if (selectedId) {
      autoRotateRef.current = false;
      gsap.to(camera.position, { x: 0.1, y: 0.1, z: 2.0, duration: 0.9, ease: "power3.inOut" });
    } else {
      autoRotateRef.current = true;
      gsap.to(camera.position, { x: 0, y: 0.05, z: 2.6, duration: 0.9, ease: "power3.inOut" });
    }
  }, [selectedId, camera]);

  if (!brainGeo) return null;

  return (
    <group ref={groupRef}>
      {/* Inner glow shell — back-side, slightly larger */}
      <mesh geometry={brainGeo} material={innerMat} scale={1.02} />
      {/* Outer holographic mesh — front-side with Fresnel */}
      <mesh geometry={brainGeo} material={outerMat} />
      {/* Wireframe overlay */}
      <mesh geometry={brainGeo} material={wireMat} scale={1.001} />

      {/* Project node dots */}
      {PROJECTS.map((proj, i) => (
        <group key={proj.id} position={proj.nodePos}>
          {/* Invisible hit sphere */}
          <mesh ref={(el) => { if (el) nodeRefs.current[i] = el; }} visible={false}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshBasicMaterial />
          </mesh>
          {/* Visible dot */}
          <mesh material={nodeDotMat}>
            <sphereGeometry args={[0.013, 16, 16]} />
          </mesh>
          {/* Glow ring */}
          <mesh ref={(el) => { if (el) nodeRingRefs.current[i] = el; }} material={nodeRingMat}>
            <ringGeometry args={[0.02, 0.032, 32]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ─── Stars ─────────────────────────────────────────────────────────────────────
function Stars() {
  const geoRef = useRef<THREE.BufferGeometry>(null);
  useEffect(() => {
    if (!geoRef.current) return;
    const count = 2800;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * 28;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 28;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 28;
    }
    geoRef.current.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  }, []);
  return (
    <points>
      <bufferGeometry ref={geoRef} />
      <pointsMaterial color="#ffffff" size={0.022} transparent opacity={0.55} sizeAttenuation />
    </points>
  );
}

// ─── SYS.LOG terminal panel ────────────────────────────────────────────────────
function SysLogPanel({ selectedProject }: { selectedProject: Project | null }) {
  const [tick, setTick] = useState(0);
  const [ping, setPing] = useState(12);
  useEffect(() => {
    const iv = setInterval(() => {
      setTick((t) => t + 1);
      setPing(Math.floor(Math.random() * 8) + 9);
    }, 1800);
    return () => clearInterval(iv);
  }, []);

  const lines = selectedProject
    ? [
        `> ${selectedProject.id.toUpperCase()} — ACTIVE`,
        `status: ONLINE`,
        `ping: ${ping}ms`,
        `uptime: 99.9%`,
        `hhp.portfolio v2.0`,
        `location: London, UK`,
        `available: TRUE`,
        `NEURAL_NET.init()`,
        `loading ${selectedProject.id}...`,
      ]
    : [
        `> NEURAL_SCAN — IDLE`,
        `status: ONLINE`,
        `ping: ${ping}ms`,
        `uptime: 99.9%`,
        `hhp.portfolio v2.0`,
        `location: London, UK`,
        `available: TRUE`,
        `NEURAL_NET.init()`,
        `scanning brain...${tick % 3 === 0 ? "█" : ""}`,
      ];

  return (
    <div style={{
      position: "absolute",
      left: "2.5vw",
      top: "50%",
      transform: "translateY(-50%)",
      zIndex: 10,
      width: "min(190px, 16vw)",
    }}>
      <div style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "clamp(8px, 0.62vw, 10px)",
        letterSpacing: "0.12em",
        color: "rgba(255,255,255,0.45)",
        marginBottom: "0.4rem",
        textTransform: "uppercase",
      }}>
        ■ SYS.LOG
      </div>
      <div style={{
        background: "rgba(0,0,0,0.72)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "5px",
        padding: "0.7rem 0.8rem",
        backdropFilter: "blur(10px)",
      }}>
        {lines.map((line, i) => (
          <div key={i} style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "clamp(7px, 0.58vw, 9.5px)",
            color: i === 0 ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.35)",
            lineHeight: 1.85,
            letterSpacing: "0.04em",
          }}>
            {line}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Projects list panel ───────────────────────────────────────────────────────
function ProjectsPanel({
  selectedId,
  onSelect,
}: {
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div style={{
      position: "absolute",
      right: "2.5vw",
      top: "50%",
      transform: "translateY(-50%)",
      zIndex: 10,
      width: "min(230px, 20vw)",
    }}>
      <div style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "clamp(8px, 0.62vw, 10px)",
        letterSpacing: "0.18em",
        color: "rgba(255,255,255,0.45)",
        marginBottom: "0.5rem",
        textTransform: "uppercase",
      }}>
        ■ PROJECTS [{PROJECTS.length}]
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
        {PROJECTS.map((p) => {
          const isSel = selectedId === p.id;
          return (
            <button
              key={p.id}
              onClick={() => onSelect(p.id)}
              style={{
                background: isSel ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.6)",
                border: `1px solid ${isSel ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.1)"}`,
                borderRadius: "5px",
                padding: "0.5rem 0.7rem",
                cursor: "pointer",
                textAlign: "left",
                backdropFilter: "blur(8px)",
                transition: "all 0.16s ease",
                width: "100%",
              }}
              onMouseEnter={(e) => {
                if (!isSel) {
                  (e.currentTarget).style.borderColor = "rgba(255,255,255,0.26)";
                  (e.currentTarget).style.background = "rgba(255,255,255,0.05)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isSel) {
                  (e.currentTarget).style.borderColor = "rgba(255,255,255,0.1)";
                  (e.currentTarget).style.background = "rgba(0,0,0,0.6)";
                }
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "2px" }}>
                <span style={{
                  width: 5, height: 5, borderRadius: "50%",
                  background: isSel ? "#ffffff" : "rgba(255,255,255,0.35)",
                  flexShrink: 0, display: "inline-block",
                  transition: "background 0.16s",
                  boxShadow: isSel ? "0 0 6px rgba(255,255,255,0.8)" : "none",
                }} />
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 700,
                  fontSize: "clamp(8px, 0.68vw, 11px)",
                  color: isSel ? "#ffffff" : "rgba(255,255,255,0.72)",
                  letterSpacing: "0.04em",
                  transition: "color 0.16s",
                }}>
                  {p.title}
                </span>
              </div>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "clamp(7px, 0.56vw, 9px)",
                color: "rgba(255,255,255,0.28)",
                letterSpacing: "0.06em",
                paddingLeft: "0.85rem",
              }}>
                {p.subtitle}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Project detail modal ──────────────────────────────────────────────────────
function ProjectModal({
  project,
  idx,
  onClose,
  onPrev,
  onNext,
}: {
  project: Project;
  idx: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
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
    <div style={{
      position: "absolute",
      inset: 0,
      zIndex: 50,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      pointerEvents: "none",
    }}>
      <div style={{ position: "absolute", inset: 0, pointerEvents: "auto" }} onClick={onClose} />
      <div style={{
        position: "relative",
        width: "min(400px, 88vw)",
        background: "rgba(4,4,6,0.97)",
        border: "1px solid rgba(255,255,255,0.18)",
        borderRadius: "12px",
        overflow: "hidden",
        pointerEvents: "auto",
        animation: "modalIn 0.28s cubic-bezier(0.23,1,0.32,1)",
        backdropFilter: "blur(24px)",
        boxShadow: "0 0 60px rgba(255,255,255,0.04)",
      }}>
        <style>{`
          @keyframes modalIn {
            from { opacity: 0; transform: scale(0.95) translateY(12px); }
            to   { opacity: 1; transform: scale(1) translateY(0); }
          }
        `}</style>
        <div style={{ padding: "1.25rem 1.25rem 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.6rem" }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.6rem", letterSpacing: "0.2em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>
              ● {String(idx + 1).padStart(2, "0")} / {PROJECTS.length}
            </span>
            <button onClick={onClose} style={{ background: "none", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "4px", color: "rgba(255,255,255,0.4)", cursor: "pointer", padding: "3px 7px", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.6rem", letterSpacing: "0.1em" }}>ESC</button>
          </div>
          <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "1.35rem", color: "#ffffff", margin: "0 0 0.2rem", lineHeight: 1.2 }}>{project.title}</h3>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.68rem", color: "rgba(255,255,255,0.35)", margin: "0 0 0.9rem", letterSpacing: "0.06em" }}>{project.subtitle}</p>
        </div>
        <div style={{ height: "1px", background: "rgba(255,255,255,0.06)", margin: "0 1.25rem" }} />
        <div style={{ padding: "0.9rem 1.25rem" }}>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.72rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.75, margin: "0 0 1rem" }}>{project.description}</p>
          <div style={{ display: "flex", gap: "0.4rem", marginBottom: "1rem" }}>
            {project.stats.map((s) => (
              <div key={s.label} style={{ flex: 1, padding: "0.5rem", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: "6px", textAlign: "center" }}>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "0.8rem", color: "#ffffff" }}>{s.value}</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.58rem", color: "rgba(255,255,255,0.28)", marginTop: "2px", textTransform: "uppercase", letterSpacing: "0.1em" }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{ marginBottom: "1rem" }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.58rem", color: "rgba(255,255,255,0.22)", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "0.4rem" }}>Stack</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
              {project.tags.map((tag) => (
                <span key={tag} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.62rem", color: "rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "3px", padding: "2px 7px" }}>{tag}</span>
              ))}
            </div>
          </div>
          <a href={project.github} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", width: "100%", padding: "0.65rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.16)", borderRadius: "6px", color: "#ffffff", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.65rem", letterSpacing: "0.15em", textTransform: "uppercase", textDecoration: "none", transition: "background 0.18s, border-color 0.18s" }}
            onMouseEnter={(e) => { (e.currentTarget).style.background = "rgba(255,255,255,0.1)"; (e.currentTarget).style.borderColor = "rgba(255,255,255,0.32)"; }}
            onMouseLeave={(e) => { (e.currentTarget).style.background = "rgba(255,255,255,0.05)"; (e.currentTarget).style.borderColor = "rgba(255,255,255,0.16)"; }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" /></svg>
            View on GitHub
          </a>
        </div>
        <div style={{ display: "flex", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          {[
            { label: "← PREV", action: onPrev, disabled: idx === 0 },
            { label: "NEXT →", action: onNext, disabled: idx === PROJECTS.length - 1 },
          ].map(({ label, action, disabled }) => (
            <button key={label} onClick={action} disabled={disabled} style={{ flex: 1, padding: "0.65rem", background: "none", border: "none", borderRight: label.startsWith("←") ? "1px solid rgba(255,255,255,0.06)" : "none", color: disabled ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.38)", cursor: disabled ? "not-allowed" : "pointer", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.62rem", letterSpacing: "0.15em", textTransform: "uppercase" }}>{label}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Cockpit arc decoration ────────────────────────────────────────────────────
function CockpitArc() {
  return (
    <div style={{ position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)", zIndex: 5, width: "min(800px, 95vw)", pointerEvents: "none" }}>
      <svg viewBox="0 0 800 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", display: "block" }}>
        <path d="M10 100 Q400 -30 790 100" stroke="rgba(255,255,255,0.1)" strokeWidth="1" fill="none" />
        <path d="M50 100 Q400 0 750 100" stroke="rgba(255,255,255,0.06)" strokeWidth="1" fill="none" />
        <circle cx="400" cy="94" r="4" fill="rgba(255,255,255,0.3)" />
        <circle cx="400" cy="94" r="9" stroke="rgba(255,255,255,0.1)" strokeWidth="1" fill="none" />
        {[0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9].map((t) => {
          const x = 10 + t * 780;
          const y = 100 - Math.sin(Math.PI * t) * 130;
          return <line key={t} x1={x} y1={y} x2={x} y2={y - 5} stroke="rgba(255,255,255,0.12)" strokeWidth="1" transform={`rotate(${(t - 0.5) * 25}, ${x}, ${y})`} />;
        })}
      </svg>
    </div>
  );
}

// ─── Dark backdrop panel behind brain ─────────────────────────────────────────
function BrainBackdrop() {
  return (
    <div style={{
      position: "absolute",
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -50%)",
      width: "min(520px, 55vw)",
      height: "min(480px, 72vh)",
      background: "radial-gradient(ellipse at center, rgba(20,22,28,0.85) 0%, rgba(4,5,8,0.6) 60%, transparent 100%)",
      borderRadius: "8px",
      zIndex: 1,
      pointerEvents: "none",
    }} />
  );
}

// ─── Main exported component ──────────────────────────────────────────────────
export default function BrainProjectsSection() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const project = selectedId ? PROJECTS.find((p) => p.id === selectedId) ?? null : null;
  const idx = project ? PROJECTS.findIndex((p) => p.id === selectedId) : -1;

  const prev = useCallback(() => { if (idx > 0) setSelectedId(PROJECTS[idx - 1].id); }, [idx]);
  const next = useCallback(() => { if (idx < PROJECTS.length - 1) setSelectedId(PROJECTS[idx + 1].id); }, [idx]);
  const handleSelect = useCallback((id: string) => {
    setSelectedId((prev) => (prev === id ? null : id));
  }, []);

  return (
    <section
      id="projects"
      style={{
        position: "relative",
        height: "100vh",
        minHeight: 600,
        background: "#000000",
        overflow: "hidden",
      }}
    >
      {/* Section label */}
      <div style={{
        position: "absolute",
        top: "1.5rem",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 10,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "0.65rem",
        letterSpacing: "0.25em",
        textTransform: "uppercase",
        color: "rgba(255,255,255,0.3)",
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        whiteSpace: "nowrap",
      }}>
        <span style={{ color: "#4ade80", fontSize: "0.45rem" }}>●</span>
        02 — PROJECTS
        <span style={{ color: "#4ade80", fontSize: "0.45rem" }}>●</span>
      </div>

      <SysLogPanel selectedProject={project} />
      <ProjectsPanel selectedId={selectedId} onSelect={handleSelect} />
      <BrainBackdrop />
      <CockpitArc />

      {/* Hint text */}
      <div style={{
        position: "absolute",
        bottom: "2.5rem",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 10,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "0.58rem",
        color: "rgba(255,255,255,0.18)",
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        textAlign: "center",
        opacity: selectedId ? 0 : 1,
        transition: "opacity 0.3s",
        pointerEvents: "none",
        whiteSpace: "nowrap",
      }}>
        Hover brain nodes · Click to explore
      </div>

      {/* Three.js Canvas */}
      <Canvas
        camera={{ position: [0.4, 0.1, 2.4], fov: 42, near: 0.1, far: 100 }}
        style={{ position: "absolute", inset: 0, zIndex: 2 }}
        gl={{ alpha: true, antialias: true }}
      >
        {/* Minimal ambient — let the shader do the work */}
        <ambientLight intensity={0.0} />
        <Stars />
        <Suspense fallback={null}>
          <HoloBrain selectedId={selectedId} onSelectNode={handleSelect} />
        </Suspense>
      </Canvas>

      {/* Project modal */}
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
