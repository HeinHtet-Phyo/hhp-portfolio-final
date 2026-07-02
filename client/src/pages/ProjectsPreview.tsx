// Neural Network Architecture Diagram — Projects Section
// Looks exactly like a real NN diagram: Input → Hidden1 → Hidden2 → Output
// Project nodes are in the hidden layers, fully connected, animated signal pulses
import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ── Project data ──
const PROJECTS = [
  {
    id: "p1",
    title: "MoodTunes AI",
    subtitle: "ML · Music Recommender",
    desc: "LightGBM trained on 114K+ Spotify tracks. F1 score 0.5652 on 5-class mood classification with real-time recommendation API.",
    tech: ["Python", "LightGBM", "Spotify API", "scikit-learn", "pandas"],
    stats: [["0.5652", "F1 Score"], ["114K+", "Tracks"], ["5", "Moods"]] as [string,string][],
    color: "#00d4ff",
    layer: 1, // hidden layer 1
    index: 0,
    github: "https://github.com/HeinHtet-Phyo/moodtunes-ai-group3",
  },
  {
    id: "p2",
    title: "IT Career Planner",
    subtitle: "XGBoost · Career AI",
    desc: "XGBoost classifier at 99.75% accuracy across 6,000 samples. Maps SFIA framework skills to career paths with gap analysis.",
    tech: ["Python", "XGBoost", "SFIA", "scikit-learn", "Streamlit"],
    stats: [["99.75%", "Accuracy"], ["6,000", "Samples"], ["SFIA", "Framework"]] as [string,string][],
    color: "#a855f7",
    layer: 1,
    index: 1,
    github: "https://github.com/HeinHtet-Phyo/it-career-planner",
  },
  {
    id: "p3",
    title: "CityPulse",
    subtitle: "Urban Data Analytics",
    desc: "Interactive urban analytics platform aggregating transportation, demographic, and infrastructure data into city-level intelligence.",
    tech: ["Python", "Pandas", "Plotly", "GeoPandas", "Streamlit"],
    stats: [["City", "Scale"], ["Real-time", "Data"], ["Interactive", "Maps"]] as [string,string][],
    color: "#10b981",
    layer: 2,
    index: 0,
    github: "https://github.com/HeinHtet-Phyo",
  },
  {
    id: "p4",
    title: "PreventPath",
    subtitle: "Health AI · Prevention",
    desc: "ML pipeline predicting health risk factors from patient data, generating personalised prevention plans with risk scoring.",
    tech: ["Python", "scikit-learn", "Flask", "Healthcare ML", "Risk Scoring"],
    stats: [["AI", "Powered"], ["Personal", "Plans"], ["Risk", "Scoring"]] as [string,string][],
    color: "#f59e0b",
    layer: 2,
    index: 1,
    github: "https://github.com/HeinHtet-Phyo",
  },
];

type Project = typeof PROJECTS[0];

// Node layout config
// Layers: 0=Input(3 nodes), 1=Hidden1(2 projects), 2=Hidden2(2 projects), 3=Output(2 nodes)
const LAYER_COUNT = 4;
const LAYER_NODES = [3, 2, 2, 2]; // nodes per layer
const NODE_RADIUS = 22;
const PROJECT_RADIUS = 28;

interface NodePos { x: number; y: number; layer: number; index: number; isProject: boolean; projectId?: string; }

function computeLayout(W: number, H: number): NodePos[] {
  const nodes: NodePos[] = [];
  const padX = W * 0.1;
  const usableW = W - padX * 2;
  const layerSpacing = usableW / (LAYER_COUNT - 1);

  for (let l = 0; l < LAYER_COUNT; l++) {
    const count = LAYER_NODES[l];
    const x = padX + l * layerSpacing;
    for (let i = 0; i < count; i++) {
      const spacing = H / (count + 1);
      const y = spacing * (i + 1);
      const isProject = (l === 1 || l === 2);
      let projectId: string | undefined;
      if (l === 1) projectId = ["p1", "p2"][i];
      if (l === 2) projectId = ["p3", "p4"][i];
      nodes.push({ x, y, layer: l, index: i, isProject, projectId });
    }
  }
  return nodes;
}

// ── Animated pulse along a connection ──
interface Pulse { fromX: number; fromY: number; toX: number; toY: number; t: number; color: string; speed: number; }

// ── Main Canvas ──
function NNCanvas({
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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const pulses = useRef<Pulse[]>([]);
  const pulseTimer = useRef(0);
  const nodesRef = useRef<NodePos[]>([]);
  const selectedRef = useRef<Project | null>(null);
  const hoveredRef = useRef<string | null>(null);

  selectedRef.current = selected;
  hoveredRef.current = hovered;

  const getProjectColor = (projectId?: string) => {
    if (!projectId) return "#1a6a8a";
    const p = PROJECTS.find(p => p.id === projectId);
    return p?.color ?? "#1a6a8a";
  };

  const getProject = (projectId?: string) => projectId ? PROJECTS.find(p => p.id === projectId) : undefined;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      nodesRef.current = computeLayout(canvas.width, canvas.height);
    };
    resize();
    window.addEventListener("resize", resize);

    let lastTime = 0;

    const draw = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;
      pulseTimer.current += dt;

      const W = canvas.width;
      const H = canvas.height;
      const nodes = nodesRef.current;
      const sel = selectedRef.current;
      const hov = hoveredRef.current;

      ctx.clearRect(0, 0, W, H);

      // Background
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, W, H);

      // Subtle dot grid
      ctx.fillStyle = "rgba(0,212,255,0.04)";
      for (let gx = 0; gx < W; gx += 40) {
        for (let gy = 0; gy < H; gy += 40) {
          ctx.beginPath();
          ctx.arc(gx, gy, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // ── Draw connections ──
      for (let l = 0; l < LAYER_COUNT - 1; l++) {
        const fromNodes = nodes.filter(n => n.layer === l);
        const toNodes = nodes.filter(n => n.layer === l + 1);
        fromNodes.forEach(fn => {
          toNodes.forEach(tn => {
            const fromProj = getProject(fn.projectId);
            const toProj = getProject(tn.projectId);
            const isFromActive = fn.projectId && (sel?.id === fn.projectId || hov === fn.projectId);
            const isToActive = tn.projectId && (sel?.id === tn.projectId || hov === tn.projectId);
            const isActive = isFromActive || isToActive;
            const isDimmed = sel && !isFromActive && !isToActive;

            const color = fromProj?.color ?? toProj?.color ?? "#4a9aba";
            const alpha = isDimmed ? 0.05 : isActive ? 0.75 : 0.32;

            // Draw bezier connection
            const mx = (fn.x + tn.x) / 2;
            ctx.beginPath();
            ctx.moveTo(fn.x, fn.y);
            ctx.bezierCurveTo(mx, fn.y, mx, tn.y, tn.x, tn.y);

            if (isActive) {
              const grad = ctx.createLinearGradient(fn.x, fn.y, tn.x, tn.y);
              grad.addColorStop(0, `${color}cc`);
              grad.addColorStop(0.5, `${color}ff`);
              grad.addColorStop(1, `${color}88`);
              ctx.strokeStyle = grad;
              ctx.lineWidth = 2;
            } else {
              ctx.strokeStyle = `rgba(80,160,210,${alpha})`;
              ctx.lineWidth = 1;
            }
            ctx.stroke();
          });
        });
      }

      // ── Spawn pulses ──
      if (pulseTimer.current > 0.8) {
        pulseTimer.current = 0;
        // Pick a random connection
        const l = Math.floor(Math.random() * (LAYER_COUNT - 1));
        const fromNodes = nodes.filter(n => n.layer === l);
        const toNodes = nodes.filter(n => n.layer === l + 1);
        if (fromNodes.length && toNodes.length) {
          const fn = fromNodes[Math.floor(Math.random() * fromNodes.length)];
          const tn = toNodes[Math.floor(Math.random() * toNodes.length)];
          const color = getProjectColor(fn.projectId) ?? getProjectColor(tn.projectId) ?? "#00d4ff";
          pulses.current.push({ fromX: fn.x, fromY: fn.y, toX: tn.x, toY: tn.y, t: 0, color, speed: 0.4 + Math.random() * 0.3 });
        }
      }

      // ── Draw & update pulses ──
      pulses.current = pulses.current.filter(p => p.t < 1);
      pulses.current.forEach(pulse => {
        pulse.t += dt * pulse.speed;
        const t = pulse.t;
        // Bezier position
        const mx = (pulse.fromX + pulse.toX) / 2;
        const bx = (1-t)*(1-t)*pulse.fromX + 2*(1-t)*t*mx + t*t*pulse.toX;
        const by = (1-t)*(1-t)*pulse.fromY + 2*(1-t)*t*pulse.fromY + t*t*pulse.toY;
        // Fade in/out
        const fade = t < 0.1 ? t/0.1 : t > 0.9 ? (1-t)/0.1 : 1;
        const grd = ctx.createRadialGradient(bx, by, 0, bx, by, 7);
        grd.addColorStop(0, `${pulse.color}${Math.round(fade * 255).toString(16).padStart(2,'0')}`);
        grd.addColorStop(1, `${pulse.color}00`);
        ctx.beginPath();
        ctx.arc(bx, by, 7, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();
        // Bright core
        ctx.beginPath();
        ctx.arc(bx, by, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${fade * 0.9})`;
        ctx.fill();
      });

      // ── Draw nodes ──
      nodes.forEach(node => {
        const isProj = node.isProject;
        const proj = getProject(node.projectId);
        const isSel = sel?.id === node.projectId;
        const isHov = hov === node.projectId;
        const isDimmed = sel && isProj && !isSel;
        const r = isProj ? PROJECT_RADIUS : NODE_RADIUS;
        const color = proj?.color ?? "#1a6a8a";
        const alpha = isDimmed ? 0.15 : 1;
        const pulse = isSel ? 1 + Math.sin(time * 0.004) * 0.12 : isHov ? 1.15 : 1;
        const nr = r * pulse;

        // Outer glow — always show for project nodes
        if (isProj) {
          const glowR = isSel ? nr * 3.5 : isHov ? nr * 2.8 : nr * 2;
          const glow = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, glowR);
          glow.addColorStop(0, `${color}${isDimmed ? '08' : isSel ? '50' : '28'}`);
          glow.addColorStop(1, `${color}00`);
          ctx.beginPath();
          ctx.arc(node.x, node.y, glowR, 0, Math.PI * 2);
          ctx.fillStyle = glow;
          ctx.fill();
        }

        // Ring
        ctx.beginPath();
        ctx.arc(node.x, node.y, nr + 5, 0, Math.PI * 2);
        ctx.strokeStyle = isDimmed ? `${color}10` : isSel ? `${color}cc` : isHov ? `${color}99` : `${color}55`;
        ctx.lineWidth = isSel ? 1.5 : 1;
        ctx.stroke();

        // Main circle
        const grad = ctx.createRadialGradient(node.x - nr*0.3, node.y - nr*0.3, 0, node.x, node.y, nr);
        if (isProj) {
          grad.addColorStop(0, `${color}f5`);
          grad.addColorStop(0.45, `${color}b0`);
          grad.addColorStop(1, `${color}${isDimmed ? '15' : '35'}`);
        } else {
          grad.addColorStop(0, `rgba(60,160,220,${alpha * 0.9})`);
          grad.addColorStop(1, `rgba(20,70,120,${alpha * 0.5})`);
        }
        ctx.beginPath();
        ctx.arc(node.x, node.y, nr, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        // Inner bright core
        const core = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, nr * 0.5);
        core.addColorStop(0, `rgba(255,255,255,${isDimmed ? 0.1 : isSel ? 0.95 : 0.75})`);
        core.addColorStop(1, `rgba(255,255,255,0)`);
        ctx.beginPath();
        ctx.arc(node.x, node.y, nr * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = core;
        ctx.fill();

        // Label for non-project nodes
        if (!isProj) {
          ctx.font = `bold 9px 'JetBrains Mono', monospace`;
          ctx.fillStyle = `rgba(100,180,220,${alpha * 0.7})`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(`i${node.index + 1}`, node.x, node.y);
        }
      });

      // Layer labels at bottom
      const labelY = canvas.height - 18;
      const labels = ["INPUT", "HIDDEN 1", "HIDDEN 2", "OUTPUT"];
      ctx.font = "9px 'JetBrains Mono', monospace";
      ctx.fillStyle = "rgba(255,255,255,0.12)";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (let l = 0; l < LAYER_COUNT; l++) {
        const layerNodes = nodes.filter(n => n.layer === l);
        if (layerNodes.length) {
          const avgX = layerNodes.reduce((s, n) => s + n.x, 0) / layerNodes.length;
          ctx.fillText(labels[l], avgX, labelY);
        }
      }

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []); // stable — uses refs

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
    const my = (e.clientY - rect.top) * (canvas.height / rect.height);

    let hit: Project | null = null;
    for (const node of nodesRef.current) {
      if (!node.isProject || !node.projectId) continue;
      const dx = mx - node.x;
      const dy = my - node.y;
      if (Math.sqrt(dx*dx + dy*dy) < PROJECT_RADIUS + 10) {
        hit = PROJECTS.find(p => p.id === node.projectId) ?? null;
        break;
      }
    }
    onSelect(hit?.id === selectedRef.current?.id ? null : hit);
  }, [onSelect]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
    const my = (e.clientY - rect.top) * (canvas.height / rect.height);

    let hovId: string | null = null;
    for (const node of nodesRef.current) {
      if (!node.isProject || !node.projectId) continue;
      const dx = mx - node.x;
      const dy = my - node.y;
      if (Math.sqrt(dx*dx + dy*dy) < PROJECT_RADIUS + 10) {
        hovId = node.projectId;
        break;
      }
    }
    onHover(hovId);
    canvas.style.cursor = hovId ? "pointer" : "default";
  }, [onHover]);

  return (
    <canvas
      ref={canvasRef}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => onHover(null)}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
    />
  );
}

// ── Detail Panel ──
function DetailPanel({ project, onClose }: { project: Project; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 50, scale: 0.97 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 50, scale: 0.97 }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
      style={{
        position: "fixed",
        top: "50%",
        right: "2rem",
        transform: "translateY(-50%)",
        width: "300px",
        background: "rgba(2,6,20,0.92)",
        backdropFilter: "blur(32px)",
        WebkitBackdropFilter: "blur(32px)",
        border: `1px solid ${project.color}30`,
        borderRadius: "12px",
        padding: "1.5rem",
        zIndex: 100,
        boxShadow: `0 0 60px ${project.color}18, 0 24px 60px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.04)`,
      }}
    >
      {/* Corner brackets */}
      {([[0,0],[0,1],[1,0],[1,1]] as [number,number][]).map(([r,c], i) => (
        <div key={i} style={{
          position: "absolute",
          top: r === 0 ? "7px" : "auto", bottom: r === 1 ? "7px" : "auto",
          left: c === 0 ? "7px" : "auto", right: c === 1 ? "7px" : "auto",
          width: "13px", height: "13px",
          borderTop: r === 0 ? `1.5px solid ${project.color}50` : "none",
          borderBottom: r === 1 ? `1.5px solid ${project.color}50` : "none",
          borderLeft: c === 0 ? `1.5px solid ${project.color}50` : "none",
          borderRight: c === 1 ? `1.5px solid ${project.color}50` : "none",
        }} />
      ))}
      <div style={{ position: "absolute", top: 0, left: "25%", right: "25%", height: "1px", background: `linear-gradient(to right, transparent, ${project.color}60, transparent)` }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
        <div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.52rem", color: project.color, letterSpacing: "0.2em", marginBottom: "0.3rem" }}>◈ {project.subtitle}</div>
          <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: "1.15rem", color: "#fff", margin: 0 }}>{project.title}</h3>
        </div>
        <button onClick={onClose} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.35)", width: "26px", height: "26px", borderRadius: "6px", cursor: "pointer", fontSize: "0.7rem", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>✕</button>
      </div>

      <div style={{ height: "1px", background: `linear-gradient(to right, ${project.color}28, transparent)`, marginBottom: "0.9rem" }} />
      <p style={{ fontFamily: "'Inter',sans-serif", fontSize: "0.75rem", color: "rgba(255,255,255,0.42)", lineHeight: 1.75, marginBottom: "1rem" }}>{project.desc}</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "0.35rem", marginBottom: "1rem" }}>
        {project.stats.map(([v, l]) => (
          <div key={l} style={{ border: `1px solid ${project.color}18`, background: `${project.color}08`, padding: "0.5rem 0.2rem", textAlign: "center", borderRadius: "6px" }}>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: "0.8rem", color: project.color }}>{v}</div>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.45rem", color: "rgba(255,255,255,0.18)", letterSpacing: "0.08em", textTransform: "uppercase", marginTop: "2px" }}>{l}</div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: "1.1rem" }}>
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.5rem", color: "rgba(255,255,255,0.15)", letterSpacing: "0.2em", marginBottom: "0.4rem" }}>TECH STACK</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem" }}>
          {project.tech.map(t => (
            <span key={t} style={{ border: `1px solid ${project.color}25`, color: project.color, padding: "0.18rem 0.45rem", fontSize: "0.58rem", fontFamily: "'JetBrains Mono',monospace", borderRadius: "4px", background: `${project.color}08` }}>{t}</span>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: "0.5rem" }}>
        <a href={project.github} target="_blank" rel="noopener noreferrer" style={{ flex: 1, background: `${project.color}20`, color: project.color, border: `1px solid ${project.color}40`, padding: "0.55rem", fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: "0.68rem", letterSpacing: "0.06em", borderRadius: "6px", textDecoration: "none", textAlign: "center", display: "block" }}>GitHub →</a>
        <button style={{ flex: 1, background: "transparent", color: "rgba(255,255,255,0.22)", border: "1px solid rgba(255,255,255,0.07)", padding: "0.55rem", fontFamily: "'JetBrains Mono',monospace", fontSize: "0.68rem", borderRadius: "6px", cursor: "pointer" }}>Live Demo</button>
      </div>
      <div style={{ textAlign: "center", marginTop: "0.85rem", fontFamily: "'JetBrains Mono',monospace", fontSize: "0.46rem", color: "rgba(255,255,255,0.1)", letterSpacing: "0.12em" }}>CLICK NODE OR PRESS ESC TO CLOSE</div>
    </motion.div>
  );
}

// ── Floating HTML labels over project nodes ──
function NodeLabels({ selected, hovered, onSelect, onHover }: {
  selected: Project | null;
  hovered: string | null;
  onSelect: (p: Project | null) => void;
  onHover: (id: string | null) => void;
}) {
  const [dims, setDims] = useState({ w: window.innerWidth, h: window.innerHeight });

  useEffect(() => {
    const handler = () => setDims({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  const nodes = computeLayout(dims.w, dims.h);

  return (
    <>
      {PROJECTS.map(p => {
        const node = nodes.find(n => n.projectId === p.id);
        if (!node) return null;
        const isSel = selected?.id === p.id;
        const isHov = hovered === p.id;
        const isDimmed = selected && !isSel;

        return (
          <div
            key={p.id}
            onClick={() => onSelect(isSel ? null : p)}
            onMouseEnter={() => onHover(p.id)}
            onMouseLeave={() => onHover(null)}
            style={{
              position: "absolute",
              left: node.x,
              top: node.y + PROJECT_RADIUS + 10,
              transform: "translateX(-50%)",
              textAlign: "center",
              pointerEvents: "all",
              cursor: "pointer",
              opacity: isDimmed ? 0.12 : 1,
              transition: "opacity 0.3s ease",
              zIndex: 10,
              userSelect: "none",
            }}
          >
            <div style={{
              fontFamily: "'Space Grotesk',sans-serif",
              fontWeight: 700,
              fontSize: isSel || isHov ? "0.78rem" : "0.68rem",
              color: isSel || isHov ? p.color : "rgba(255,255,255,0.6)",
              whiteSpace: "nowrap",
              transition: "all 0.2s ease",
              textShadow: isSel ? `0 0 14px ${p.color}` : "none",
            }}>{p.title}</div>
            <div style={{
              fontFamily: "'JetBrains Mono',monospace",
              fontSize: "0.5rem",
              color: isSel ? p.color : "rgba(255,255,255,0.22)",
              letterSpacing: "0.08em",
              marginTop: "2px",
              transition: "all 0.2s ease",
            }}>{p.subtitle}</div>
          </div>
        );
      })}
    </>
  );
}

// ── Main page ──
export default function ProjectsPreview() {
  const [selected, setSelected] = useState<Project | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setSelected(null); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#000", position: "relative", overflow: "hidden" }}>
      {/* Section header */}
      <div style={{ position: "absolute", top: "1.5rem", left: "50%", transform: "translateX(-50%)", zIndex: 20, textAlign: "center", pointerEvents: "none" }}>
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.55rem", color: "rgba(0,212,255,0.4)", letterSpacing: "0.25em" }}>SYS.05 · PROJECT MATRIX</div>
        <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: "1.6rem", color: "#fff", letterSpacing: "-0.03em", marginTop: "0.2rem" }}>Projects</div>
      </div>

      {/* Canvas */}
      <NNCanvas selected={selected} hovered={hovered} onSelect={setSelected} onHover={setHovered} />

      {/* HTML labels */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 5 }}>
        <NodeLabels selected={selected} hovered={hovered} onSelect={setSelected} onHover={setHovered} />
      </div>

      {/* Detail panel */}
      <AnimatePresence>
        {selected && <DetailPanel project={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>

      {/* Bottom hint */}
      <AnimatePresence>
        {!selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "absolute", bottom: "2.5rem", left: "50%", transform: "translateX(-50%)", zIndex: 20, pointerEvents: "none", textAlign: "center" }}>
            <div style={{ color: "rgba(255,255,255,0.15)", fontSize: "0.58rem", fontFamily: "'JetBrains Mono',monospace", letterSpacing: "0.2em" }}>CLICK ANY PROJECT NODE TO EXPLORE</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
