// BrainProjectsSection — Holographic B&W brain with neural network nodes
// Style: minimal tech, black & white, translucent Fresnel mesh
// Features: 4 project nodes on brain surface, white connecting lines (neural net),
//           click-to-zoom into node, project detail popup

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

// Neural network connections between nodes (pairs of indices)
const CONNECTIONS = [[0, 1], [0, 2], [1, 3], [2, 3], [0, 3], [1, 2]];

// ─── Neural network lines between nodes ───────────────────────────────────────
function NeuralLines({ selectedId }: { selectedId: string | null }) {
  const linesRef = useRef<THREE.LineSegments | null>(null);
  const timeRef = useRef(0);

  const geometry = useMemo(() => {
    const positions: number[] = [];
    CONNECTIONS.forEach(([a, b]) => {
      const pa = PROJECTS[a].nodePos;
      const pb = PROJECTS[b].nodePos;
      positions.push(pa.x, pa.y, pa.z, pb.x, pb.y, pb.z);
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    return geo;
  }, []);

  const material = useMemo(() => new THREE.LineBasicMaterial({
    color: "#ffffff",
    transparent: true,
    opacity: 0.15,
  }), []);

  useFrame((state) => {
    if (!linesRef.current) return;
    timeRef.current = state.clock.elapsedTime;
    const mat = linesRef.current.material as THREE.LineBasicMaterial;
    const base = selectedId ? 0.25 : 0.12;
    mat.opacity = base + Math.sin(state.clock.elapsedTime * 1.8) * 0.06;
  });

  return <lineSegments ref={linesRef} geometry={geometry} material={material} />;
}

// ─── Holographic brain with Fresnel shader ─────────────────────────────────────
function HoloBrain({
  selectedId,
  onSelectNode,
  onZoomComplete,
}: {
  selectedId: string | null;
  onSelectNode: (id: string) => void;
  onZoomComplete: () => void;
}) {
  const gltf = useGLTF("/manus-storage/brain_79ab9919.glb");
  const groupRef = useRef<THREE.Group>(null);
  const { camera, raycaster, pointer, gl } = useThree();
  const nodeRefs = useRef<THREE.Mesh[]>([]);
  const nodeRingRefs = useRef<THREE.Mesh[]>([]);
  const hoverNodeRef = useRef<number>(-1);
  const autoRotateRef = useRef(true);
  const zoomingRef = useRef(false);

  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y = -Math.PI * 0.35;
    }
  }, []);

  const brainGeo = useMemo(() => {
    const mesh = gltf.scene.children[0] as THREE.Mesh;
    if (!mesh?.geometry) return null;
    const geo = mesh.geometry.clone();
    geo.computeVertexNormals();
    return geo;
  }, [gltf]);

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
  }), []);

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

  const wireMat = useMemo(() => new THREE.MeshBasicMaterial({
    color: new THREE.Color(0.9, 0.95, 1.0),
    wireframe: true,
    transparent: true,
    opacity: 0.045,
  }), []);

  const nodeDotMat = useMemo(() => new THREE.MeshBasicMaterial({ color: "#ffffff" }), []);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    if (autoRotateRef.current && !selectedId) {
      groupRef.current.rotation.y += delta * 0.28;
    }

    const pulse = (Math.sin(state.clock.elapsedTime * 1.4) + 1) * 0.5;
    if (outerMat.uniforms.uGlowPulse) outerMat.uniforms.uGlowPulse.value = pulse;
    if (innerMat.uniforms.uGlowPulse) innerMat.uniforms.uGlowPulse.value = pulse;

    nodeRingRefs.current.forEach((ring, i) => {
      if (!ring) return;
      const t = state.clock.elapsedTime + i * 1.1;
      const isSelected = selectedId === PROJECTS[i].id;
      const baseOp = isSelected ? 0.55 : 0.22;
      (ring.material as THREE.MeshBasicMaterial).opacity = baseOp + Math.sin(t * 2.2) * 0.14;
      const s = isSelected ? 1.5 + Math.sin(t * 2.0) * 0.12 : 1 + Math.sin(t * 2.0) * 0.1;
      ring.scale.setScalar(s);
      ring.lookAt(camera.position);
    });

    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(nodeRefs.current.filter(Boolean));
    const newHover = hits.length > 0 ? nodeRefs.current.indexOf(hits[0].object as THREE.Mesh) : -1;
    if (newHover !== hoverNodeRef.current) {
      hoverNodeRef.current = newHover;
      gl.domElement.style.cursor = newHover >= 0 ? "pointer" : "default";
    }

    nodeRefs.current.forEach((nm, i) => {
      if (!nm) return;
      const isHover = i === hoverNodeRef.current;
      const isSelected = selectedId === PROJECTS[i].id;
      const target = isHover || isSelected ? 2.2 : 1.0;
      nm.scale.lerp(new THREE.Vector3(target, target, target), 0.14);
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

  useEffect(() => {
    if (selectedId && !zoomingRef.current) {
      autoRotateRef.current = false;
      zoomingRef.current = true;

      const proj = PROJECTS.find((p) => p.id === selectedId);
      if (proj && groupRef.current) {
        const nodeWorld = proj.nodePos.clone().applyEuler(groupRef.current.rotation);
        const camTarget = nodeWorld.clone().multiplyScalar(0.5).add(new THREE.Vector3(0, 0, 1.5));

        gsap.to(camera.position, {
          x: camTarget.x,
          y: camTarget.y + 0.05,
          z: 1.6,
          duration: 1.1,
          ease: "power3.inOut",
          onComplete: () => {
            zoomingRef.current = false;
            onZoomComplete();
          },
        });
      }
    } else if (!selectedId) {
      zoomingRef.current = false;
      autoRotateRef.current = true;
      gsap.to(camera.position, { x: 0, y: 0.05, z: 2.6, duration: 1.0, ease: "power3.inOut" });
    }
  }, [selectedId, camera, onZoomComplete]);

  if (!brainGeo) return null;

  return (
    <group ref={groupRef}>
      <mesh geometry={brainGeo} material={innerMat} scale={1.02} />
      <mesh geometry={brainGeo} material={outerMat} />
      <mesh geometry={brainGeo} material={wireMat} scale={1.001} />
      <NeuralLines selectedId={selectedId} />
      {PROJECTS.map((proj, i) => (
        <group key={proj.id} position={proj.nodePos}>
          <mesh ref={(el) => { if (el) nodeRefs.current[i] = el; }} visible={false}>
            <sphereGeometry args={[0.055, 8, 8]} />
            <meshBasicMaterial />
          </mesh>
          <mesh material={nodeDotMat}>
            <sphereGeometry args={[0.016, 16, 16]} />
          </mesh>
          <mesh
            ref={(el) => { if (el) nodeRingRefs.current[i] = el; }}
            material={new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.3, side: THREE.DoubleSide })}
          >
            <ringGeometry args={[0.024, 0.038, 32]} />
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
    const count = 2200;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * 24;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 24;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 24;
    }
    geoRef.current.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  }, []);
  return (
    <points>
      <bufferGeometry ref={geoRef} />
      <pointsMaterial color="#ffffff" size={0.018} transparent opacity={0.4} sizeAttenuation />
    </points>
  );
}

// ─── Project detail popup ──────────────────────────────────────────────────────
function ProjectPopup({
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
  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 30,
        width: "min(460px, 88vw)",
        background: "rgba(4, 5, 8, 0.97)",
        border: "1px solid rgba(255,255,255,0.13)",
        borderRadius: "3px",
        padding: "1.8rem 2rem",
        fontFamily: "'JetBrains Mono', monospace",
        animation: "popupIn 0.38s cubic-bezier(0.23, 1, 0.32, 1) both",
        backdropFilter: "blur(16px)",
        boxShadow: "0 0 80px rgba(255,255,255,0.03), 0 0 0 1px rgba(255,255,255,0.05)",
      }}
    >
      <style>{`
        @keyframes popupIn {
          from { opacity: 0; transform: translate(-50%, -47%) scale(0.95); }
          to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
      `}</style>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.2rem" }}>
        <div>
          <div style={{ fontSize: "0.55rem", letterSpacing: "0.22em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: "0.3rem" }}>
            NODE_{String(idx + 1).padStart(2, "0")} · ACTIVE
          </div>
          <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700, color: "#ffffff", letterSpacing: "0.02em" }}>
            {project.title}
          </h3>
          <div style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.38)", marginTop: "0.18rem", letterSpacing: "0.1em" }}>
            {project.subtitle}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "1px solid rgba(255,255,255,0.13)",
            color: "rgba(255,255,255,0.45)",
            cursor: "pointer",
            width: 26,
            height: 26,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "0.8rem",
            borderRadius: "2px",
            flexShrink: 0,
          }}
        >
          ✕
        </button>
      </div>

      <div style={{ height: "1px", background: "rgba(255,255,255,0.07)", marginBottom: "1.1rem" }} />

      <p style={{ margin: "0 0 1.2rem", fontSize: "0.76rem", lineHeight: 1.75, color: "rgba(255,255,255,0.55)", letterSpacing: "0.01em" }}>
        {project.description}
      </p>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.65rem", marginBottom: "1.2rem" }}>
        {project.stats.map((s) => (
          <div key={s.label} style={{ textAlign: "center", padding: "0.55rem 0.3rem", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "2px" }}>
            <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#ffffff", marginBottom: "0.18rem" }}>{s.value}</div>
            <div style={{ fontSize: "0.52rem", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.15em" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tags */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginBottom: "1.4rem" }}>
        {project.tags.map((tag) => (
          <span key={tag} style={{
            fontSize: "0.55rem",
            padding: "0.18rem 0.5rem",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "2px",
            color: "rgba(255,255,255,0.45)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}>
            {tag}
          </span>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: "0.7rem", alignItems: "center" }}>
        <a
          href={project.github}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.4rem",
            padding: "0.58rem 1rem",
            background: "#ffffff",
            color: "#000000",
            textDecoration: "none",
            fontSize: "0.62rem",
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            borderRadius: "2px",
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
          </svg>
          View on GitHub
        </a>
        <div style={{ display: "flex", gap: "0.35rem" }}>
          <button
            onClick={onPrev}
            disabled={idx === 0}
            style={{
              background: "none",
              border: "1px solid rgba(255,255,255,0.1)",
              color: idx === 0 ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.55)",
              cursor: idx === 0 ? "not-allowed" : "pointer",
              width: 30,
              height: 30,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.8rem",
              borderRadius: "2px",
            }}
          >←</button>
          <button
            onClick={onNext}
            disabled={idx === PROJECTS.length - 1}
            style={{
              background: "none",
              border: "1px solid rgba(255,255,255,0.1)",
              color: idx === PROJECTS.length - 1 ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.55)",
              cursor: idx === PROJECTS.length - 1 ? "not-allowed" : "pointer",
              width: 30,
              height: 30,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.8rem",
              borderRadius: "2px",
            }}
          >→</button>
        </div>
      </div>

      {/* Dot pagination */}
      <div style={{ marginTop: "1rem", display: "flex", gap: "0.35rem", justifyContent: "center" }}>
        {PROJECTS.map((_, i) => (
          <div key={i} style={{
            width: i === idx ? 16 : 5,
            height: 5,
            borderRadius: 3,
            background: i === idx ? "#ffffff" : "rgba(255,255,255,0.18)",
            transition: "width 0.3s ease, background 0.3s ease",
          }} />
        ))}
      </div>
    </div>
  );
}

// ─── Projects list panel (right side) ──────────────────────────────────────────
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
      width: "min(200px, 17vw)",
    }}>
      <div style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "clamp(8px, 0.62vw, 10px)",
        letterSpacing: "0.2em",
        color: "rgba(255,255,255,0.38)",
        marginBottom: "0.65rem",
        textTransform: "uppercase",
        display: "flex",
        alignItems: "center",
        gap: "0.4rem",
      }}>
        <span style={{ color: "rgba(255,255,255,0.6)" }}>●</span>
        PROJECTS [{PROJECTS.length}]
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.38rem" }}>
        {PROJECTS.map((proj, i) => {
          const isSel = selectedId === proj.id;
          return (
            <button
              key={proj.id}
              onClick={() => onSelect(proj.id)}
              style={{
                background: isSel ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.55)",
                border: `1px solid ${isSel ? "rgba(255,255,255,0.28)" : "rgba(255,255,255,0.07)"}`,
                borderRadius: "3px",
                padding: "0.52rem 0.65rem",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                gap: "0.45rem",
              }}
            >
              <span style={{
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: isSel ? "#ffffff" : "rgba(255,255,255,0.28)",
                flexShrink: 0,
                boxShadow: isSel ? "0 0 6px rgba(255,255,255,0.5)" : "none",
                transition: "all 0.2s",
              }} />
              <div>
                <div style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "clamp(8px, 0.65vw, 10px)",
                  fontWeight: 600,
                  color: isSel ? "#ffffff" : "rgba(255,255,255,0.65)",
                  letterSpacing: "0.04em",
                  marginBottom: "0.08rem",
                }}>
                  {proj.title}
                </div>
                <div style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "clamp(7px, 0.55vw, 9px)",
                  color: "rgba(255,255,255,0.28)",
                  letterSpacing: "0.06em",
                }}>
                  {proj.subtitle}
                </div>
              </div>
              <span style={{
                marginLeft: "auto",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "0.48rem",
                color: "rgba(255,255,255,0.18)",
                letterSpacing: "0.1em",
              }}>
                {String(i + 1).padStart(2, "0")}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Cockpit arc ───────────────────────────────────────────────────────────────
function CockpitArc() {
  return (
    <div style={{ position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)", zIndex: 5, width: "min(700px, 90vw)", pointerEvents: "none" }}>
      <svg viewBox="0 0 700 80" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", display: "block" }}>
        <path d="M10 80 Q350 -20 690 80" stroke="rgba(255,255,255,0.07)" strokeWidth="1" fill="none" />
        <circle cx="350" cy="76" r="3" fill="rgba(255,255,255,0.18)" />
        <circle cx="350" cy="76" r="7" stroke="rgba(255,255,255,0.06)" strokeWidth="1" fill="none" />
        {[0.15, 0.3, 0.5, 0.7, 0.85].map((t) => {
          const x = 10 + t * 680;
          const y = 80 - Math.sin(Math.PI * t) * 100;
          return <line key={t} x1={x} y1={y} x2={x} y2={y - 4} stroke="rgba(255,255,255,0.09)" strokeWidth="1" />;
        })}
      </svg>
    </div>
  );
}

// ─── Main exported component ──────────────────────────────────────────────────
export default function BrainProjectsSection() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showPopup, setShowPopup] = useState(false);

  const project = selectedId ? PROJECTS.find((p) => p.id === selectedId) ?? null : null;
  const idx = project ? PROJECTS.findIndex((p) => p.id === selectedId) : -1;

  const prev = useCallback(() => {
    if (idx > 0) { setShowPopup(false); setSelectedId(PROJECTS[idx - 1].id); }
  }, [idx]);

  const next = useCallback(() => {
    if (idx < PROJECTS.length - 1) { setShowPopup(false); setSelectedId(PROJECTS[idx + 1].id); }
  }, [idx]);

  const handleSelect = useCallback((id: string) => {
    setShowPopup(false);
    setSelectedId((prev) => (prev === id ? null : id));
  }, []);

  const handleClose = useCallback(() => {
    setShowPopup(false);
    setSelectedId(null);
  }, []);

  const handleZoomComplete = useCallback(() => {
    setShowPopup(true);
  }, []);

  // Also show popup after delay when selected from panel
  useEffect(() => {
    if (selectedId) {
      const t = setTimeout(() => setShowPopup(true), 1200);
      return () => clearTimeout(t);
    } else {
      setShowPopup(false);
    }
  }, [selectedId]);

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
        fontSize: "0.6rem",
        letterSpacing: "0.25em",
        textTransform: "uppercase",
        color: "rgba(255,255,255,0.25)",
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        whiteSpace: "nowrap",
      }}>
        <span style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.38rem" }}>●</span>
        02 — PROJECTS
        <span style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.38rem" }}>●</span>
      </div>

      <ProjectsPanel selectedId={selectedId} onSelect={handleSelect} />
      <CockpitArc />

      {/* Hint */}
      <div style={{
        position: "absolute",
        bottom: "2.8rem",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 10,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "0.53rem",
        color: "rgba(255,255,255,0.13)",
        letterSpacing: "0.2em",
        textTransform: "uppercase",
        textAlign: "center",
        opacity: selectedId ? 0 : 1,
        transition: "opacity 0.4s",
        pointerEvents: "none",
        whiteSpace: "nowrap",
      }}>
        Click a node · Explore projects
      </div>

      {/* Three.js Canvas */}
      <Canvas
        camera={{ position: [0, 0.05, 2.6], fov: 42, near: 0.1, far: 100 }}
        style={{ position: "absolute", inset: 0, zIndex: 2 }}
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={0.0} />
        <Stars />
        <Suspense fallback={null}>
          <HoloBrain
            selectedId={selectedId}
            onSelectNode={handleSelect}
            onZoomComplete={handleZoomComplete}
          />
        </Suspense>
      </Canvas>

      {/* Project popup */}
      {showPopup && project && (
        <ProjectPopup
          project={project}
          idx={idx}
          onClose={handleClose}
          onPrev={prev}
          onNext={next}
        />
      )}
    </section>
  );
}
