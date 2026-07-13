// BrainProjectsSection — Interactive procedural brain canvas
// B&W deep space theme: dark brain silhouette, particle field, 4 neural node dots (one per project)
// Click node → zoom-in animation → project detail modal

import { useEffect, useRef, useState, useCallback } from "react";

// ── Project data ──────────────────────────────────────────────────────────────
const PROJECTS = [
  {
    id: "p1",
    title: "MoodTunes AI",
    subtitle: "ML · Music Recommender",
    desc: "LightGBM trained on 114K+ Spotify tracks. F1 score 0.5652 on 5-class mood classification with real-time recommendation API.",
    tech: ["Python", "LightGBM", "Spotify API", "scikit-learn", "pandas"],
    stats: [["0.5652", "F1 Score"], ["114K+", "Tracks"], ["5", "Moods"]] as [string, string][],
    github: "https://github.com/HeinHtet-Phyo/moodtunes-ai-group3",
    // Position on brain (normalized 0-1): top-left lobe area
    nx: 0.35, ny: 0.28,
  },
  {
    id: "p2",
    title: "IT Career Planner",
    subtitle: "XGBoost · Career AI",
    desc: "XGBoost classifier at 99.75% accuracy across 6,000 samples. Maps SFIA framework skills to career paths with gap analysis.",
    tech: ["Python", "XGBoost", "SFIA", "scikit-learn", "Streamlit"],
    stats: [["99.75%", "Accuracy"], ["6,000", "Samples"], ["SFIA", "Framework"]] as [string, string][],
    github: "https://github.com/HeinHtet-Phyo/it-career-planner",
    // top-right lobe
    nx: 0.62, ny: 0.22,
  },
  {
    id: "p3",
    title: "CityPulse",
    subtitle: "Urban Data Analytics",
    desc: "Interactive urban analytics platform aggregating transportation, demographic, and infrastructure data into city-level intelligence.",
    tech: ["Python", "Pandas", "Plotly", "GeoPandas", "Streamlit"],
    stats: [["City", "Scale"], ["Real-time", "Data"], ["Interactive", "Maps"]] as [string, string][],
    github: "https://github.com/HeinHtet-Phyo",
    // mid-left
    nx: 0.28, ny: 0.52,
  },
  {
    id: "p4",
    title: "PreventPath",
    subtitle: "Health AI · Prevention",
    desc: "ML pipeline predicting health risk factors from patient data, generating personalised prevention plans with risk scoring.",
    tech: ["Python", "scikit-learn", "Flask", "Healthcare ML", "Risk Scoring"],
    stats: [["AI", "Powered"], ["Personal", "Plans"], ["Risk", "Scoring"]] as [string, string][],
    github: "https://github.com/HeinHtet-Phyo",
    // mid-right
    nx: 0.60, ny: 0.55,
  },
];

type Project = typeof PROJECTS[0];

// ── Brain shape: a set of bezier curves forming a side-profile brain silhouette ──
// We draw it as a filled dark shape with lighter stroke to mimic the reference image
function drawBrain(ctx: CanvasRenderingContext2D, cx: number, cy: number, scale: number) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);

  // Outer silhouette — left lateral view
  // Coordinates are relative to center, brain is ~320x260 at scale=1
  const S = 1;
  ctx.beginPath();

  // Start at brainstem bottom
  ctx.moveTo(20 * S, 120 * S);
  // Brainstem up
  ctx.bezierCurveTo(25 * S, 100 * S, 30 * S, 85 * S, 20 * S, 70 * S);
  // Cerebellum back
  ctx.bezierCurveTo(10 * S, 55 * S, -30 * S, 50 * S, -60 * S, 60 * S);
  ctx.bezierCurveTo(-90 * S, 70 * S, -110 * S, 80 * S, -120 * S, 70 * S);
  // Occipital lobe (back of brain)
  ctx.bezierCurveTo(-140 * S, 55 * S, -150 * S, 30 * S, -145 * S, 0 * S);
  // Parietal lobe (top-back)
  ctx.bezierCurveTo(-140 * S, -35 * S, -120 * S, -65 * S, -90 * S, -85 * S);
  // Frontal lobe (top)
  ctx.bezierCurveTo(-60 * S, -105 * S, -20 * S, -120 * S, 20 * S, -118 * S);
  // Prefrontal (front-top)
  ctx.bezierCurveTo(55 * S, -115 * S, 90 * S, -100 * S, 115 * S, -75 * S);
  // Temporal lobe (front-bottom)
  ctx.bezierCurveTo(135 * S, -50 * S, 145 * S, -15 * S, 140 * S, 20 * S);
  ctx.bezierCurveTo(135 * S, 50 * S, 120 * S, 75 * S, 95 * S, 90 * S);
  // Bottom temporal
  ctx.bezierCurveTo(75 * S, 100 * S, 55 * S, 110 * S, 40 * S, 115 * S);
  // Back to brainstem
  ctx.bezierCurveTo(35 * S, 120 * S, 28 * S, 122 * S, 20 * S, 120 * S);
  ctx.closePath();

  // Dark filled brain body
  const bodyGrad = ctx.createRadialGradient(-20 * S, -20 * S, 0, 0, 0, 200 * S);
  bodyGrad.addColorStop(0, "rgba(55,55,55,0.95)");
  bodyGrad.addColorStop(0.5, "rgba(28,28,28,0.97)");
  bodyGrad.addColorStop(1, "rgba(8,8,8,0.99)");
  ctx.fillStyle = bodyGrad;
  ctx.fill();

  // Outer glow stroke
  ctx.strokeStyle = "rgba(255,255,255,0.18)";
  ctx.lineWidth = 1.5 * S;
  ctx.stroke();

  // ── Gyri (brain folds) — lighter curved lines on the surface ──
  const gyri = [
    // Frontal gyri
    { pts: [[-80, -90], [-50, -105], [-10, -108], [30, -100]], w: 1.2, a: 0.22 },
    { pts: [[-100, -60], [-70, -80], [-35, -90], [5, -88], [40, -80]], w: 1.0, a: 0.18 },
    { pts: [[-110, -25], [-80, -45], [-45, -60], [-5, -65], [35, -58], [70, -45]], w: 0.9, a: 0.16 },
    // Parietal/temporal
    { pts: [[-130, 10], [-100, -5], [-65, -15], [-25, -18], [15, -12], [55, -5]], w: 0.9, a: 0.15 },
    { pts: [[-140, 40], [-110, 25], [-75, 15], [-35, 10], [5, 12], [45, 18], [80, 20]], w: 0.8, a: 0.14 },
    { pts: [[-135, 65], [-105, 52], [-70, 42], [-30, 38], [10, 40], [50, 45], [85, 50]], w: 0.8, a: 0.13 },
    // Occipital
    { pts: [[-145, 5], [-138, -20], [-128, -48]], w: 1.0, a: 0.17 },
    { pts: [[-140, 30], [-135, 5], [-130, -20], [-118, -50]], w: 0.8, a: 0.14 },
    // Temporal
    { pts: [[95, -55], [110, -25], [120, 10], [115, 40], [100, 65], [80, 82]], w: 0.9, a: 0.16 },
    { pts: [[70, -70], [90, -40], [100, -5], [95, 30], [80, 55], [60, 72]], w: 0.8, a: 0.14 },
    // Central sulcus
    { pts: [[-15, -95], [10, -80], [30, -60], [45, -35], [50, -5]], w: 1.1, a: 0.20 },
    { pts: [[-40, -85], [-20, -70], [0, -50], [15, -25], [20, 5]], w: 0.9, a: 0.16 },
  ];

  gyri.forEach(g => {
    if (g.pts.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(g.pts[0][0] * S, g.pts[0][1] * S);
    for (let i = 1; i < g.pts.length - 1; i++) {
      const mx = ((g.pts[i][0] + g.pts[i + 1][0]) / 2) * S;
      const my = ((g.pts[i][1] + g.pts[i + 1][1]) / 2) * S;
      ctx.quadraticCurveTo(g.pts[i][0] * S, g.pts[i][1] * S, mx, my);
    }
    const last = g.pts[g.pts.length - 1];
    ctx.lineTo(last[0] * S, last[1] * S);
    ctx.strokeStyle = `rgba(255,255,255,${g.a})`;
    ctx.lineWidth = g.w * S;
    ctx.stroke();
  });

  ctx.restore();
}

// ── Particle ──────────────────────────────────────────────────────────────────
interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  size: number; alpha: number;
  life: number; maxLife: number;
}

function makeParticle(W: number, H: number): Particle {
  const cx = W * 0.5, cy = H * 0.5;
  const angle = Math.random() * Math.PI * 2;
  const dist = 80 + Math.random() * 220;
  return {
    x: cx + Math.cos(angle) * dist,
    y: cy + Math.sin(angle) * dist * 0.75,
    vx: (Math.random() - 0.5) * 0.3,
    vy: (Math.random() - 0.5) * 0.3,
    size: 0.5 + Math.random() * 1.5,
    alpha: 0.3 + Math.random() * 0.7,
    life: Math.random(),
    maxLife: 3 + Math.random() * 5,
  };
}

// ── Main Canvas ───────────────────────────────────────────────────────────────
interface NodeInfo { x: number; y: number; project: Project; }

function BrainCanvas({
  onNodeClick,
  onNodeHover,
  hoveredId,
}: {
  onNodeClick: (p: Project, screenX: number, screenY: number) => void;
  onNodeHover: (id: string | null) => void;
  hoveredId: string | null;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const nodesRef = useRef<NodeInfo[]>([]);
  const hoveredRef = useRef<string | null>(null);
  const timeRef = useRef(0);

  hoveredRef.current = hoveredId;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;

      // Place project nodes on brain surface
      nodesRef.current = PROJECTS.map(p => ({
        x: W * p.nx,
        y: H * p.ny,
        project: p,
      }));

      // Init particles
      particlesRef.current = Array.from({ length: 180 }, () => makeParticle(W, H));
    };

    resize();
    window.addEventListener("resize", resize);

    let lastTime = performance.now();

    const draw = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      timeRef.current += dt;

      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;
      const hov = hoveredRef.current;

      ctx.clearRect(0, 0, W, H);

      // ── Brain ──
      const brainCX = W * 0.5;
      const brainCY = H * 0.5;
      const brainScale = Math.min(W, H) / 300;
      drawBrain(ctx, brainCX, brainCY, brainScale);

      // ── Neural connection lines between nodes ──
      const nodes = nodesRef.current;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const isHovA = hov === a.project.id;
          const isHovB = hov === b.project.id;
          const active = isHovA || isHovB;
          const alpha = active ? 0.45 : 0.12;
          const pulse = 0.5 + 0.5 * Math.sin(timeRef.current * 1.5 + i * 0.7 + j * 1.1);
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          // Slight curve
          const mx = (a.x + b.x) / 2 + (Math.sin(i + j) * 20);
          const my = (a.y + b.y) / 2 + (Math.cos(i * j) * 15);
          ctx.quadraticCurveTo(mx, my, b.x, b.y);
          ctx.strokeStyle = `rgba(255,255,255,${alpha * (active ? 1 : pulse)})`;
          ctx.lineWidth = active ? 1.2 : 0.6;
          ctx.setLineDash(active ? [] : [4, 6]);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      // ── Particles ──
      particlesRef.current.forEach((p, idx) => {
        p.life += dt;
        if (p.life > p.maxLife) {
          particlesRef.current[idx] = makeParticle(W, H);
          return;
        }
        p.x += p.vx;
        p.y += p.vy;
        const lifeRatio = p.life / p.maxLife;
        const fade = lifeRatio < 0.1 ? lifeRatio / 0.1 : lifeRatio > 0.85 ? (1 - lifeRatio) / 0.15 : 1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${p.alpha * fade * 0.7})`;
        ctx.fill();
      });

      // ── Node dots ──
      nodes.forEach(node => {
        const isHov = hov === node.project.id;
        const t = timeRef.current;
        const pulse = 1 + Math.sin(t * 2 + node.project.id.charCodeAt(1)) * 0.08;
        const r = (isHov ? 10 : 7) * pulse;

        // Outer glow ring
        const glowR = r * (isHov ? 4.5 : 3.5);
        const glow = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, glowR);
        glow.addColorStop(0, `rgba(255,255,255,${isHov ? 0.35 : 0.18})`);
        glow.addColorStop(0.4, `rgba(255,255,255,${isHov ? 0.12 : 0.06})`);
        glow.addColorStop(1, "rgba(255,255,255,0)");
        ctx.beginPath();
        ctx.arc(node.x, node.y, glowR, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();

        // Outer ring
        ctx.beginPath();
        ctx.arc(node.x, node.y, r + 4, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255,255,255,${isHov ? 0.6 : 0.25})`;
        ctx.lineWidth = isHov ? 1.5 : 1;
        ctx.stroke();

        // Main dot
        const dotGrad = ctx.createRadialGradient(node.x - r * 0.3, node.y - r * 0.3, 0, node.x, node.y, r);
        dotGrad.addColorStop(0, "rgba(255,255,255,0.98)");
        dotGrad.addColorStop(0.5, "rgba(220,220,220,0.9)");
        dotGrad.addColorStop(1, "rgba(160,160,160,0.5)");
        ctx.beginPath();
        ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
        ctx.fillStyle = dotGrad;
        ctx.fill();

        // Project label (visible on hover)
        if (isHov) {
          ctx.font = "bold 11px 'JetBrains Mono', monospace";
          ctx.fillStyle = "rgba(255,255,255,0.9)";
          ctx.textAlign = "center";
          ctx.textBaseline = "bottom";
          ctx.fillText(node.project.title, node.x, node.y - r - 8);
          ctx.font = "9px 'JetBrains Mono', monospace";
          ctx.fillStyle = "rgba(255,255,255,0.5)";
          ctx.fillText(node.project.subtitle, node.x, node.y - r - 20);
        }
      });

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    for (const node of nodesRef.current) {
      const dx = mx - node.x, dy = my - node.y;
      if (Math.sqrt(dx * dx + dy * dy) < 20) {
        onNodeClick(node.project, e.clientX, e.clientY);
        return;
      }
    }
  }, [onNodeClick]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    let found: string | null = null;
    for (const node of nodesRef.current) {
      const dx = mx - node.x, dy = my - node.y;
      if (Math.sqrt(dx * dx + dy * dy) < 20) { found = node.project.id; break; }
    }
    onNodeHover(found);
    canvas.style.cursor = found ? "pointer" : "default";
  }, [onNodeHover]);

  return (
    <canvas
      ref={canvasRef}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => onNodeHover(null)}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
    />
  );
}

// ── Project Modal ─────────────────────────────────────────────────────────────
function ProjectModal({ project, onClose }: { project: Project; onClose: () => void }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(8px)",
        animation: "fadeInBg 0.3s ease",
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: "rgba(12,12,12,0.97)",
          border: "1px solid rgba(255,255,255,0.15)",
          borderRadius: "16px",
          padding: "2.5rem",
          maxWidth: "520px",
          width: "90vw",
          position: "relative",
          boxShadow: "0 0 60px rgba(255,255,255,0.06), 0 20px 60px rgba(0,0,0,0.8)",
          animation: "slideUpModal 0.35s cubic-bezier(0.23,1,0.32,1)",
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "1.2rem",
            right: "1.2rem",
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "50%",
            width: "32px",
            height: "32px",
            color: "rgba(255,255,255,0.6)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1rem",
            transition: "background 0.2s, color 0.2s",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.12)";
            (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.9)";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)";
            (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.6)";
          }}
        >
          ×
        </button>

        {/* Neural dot accent */}
        <div style={{
          width: "10px", height: "10px", borderRadius: "50%",
          background: "rgba(255,255,255,0.9)",
          boxShadow: "0 0 12px rgba(255,255,255,0.6)",
          marginBottom: "1.2rem",
        }} />

        {/* Title */}
        <h3 style={{
          fontSize: "1.5rem",
          fontWeight: 800,
          letterSpacing: "-0.03em",
          marginBottom: "0.3rem",
          lineHeight: 1.2,
        }}>
          {project.title}
        </h3>
        <p style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "0.7rem",
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          opacity: 0.4,
          marginBottom: "1.4rem",
        }}>
          {project.subtitle}
        </p>

        {/* Description */}
        <p style={{
          fontSize: "0.9rem",
          lineHeight: 1.65,
          opacity: 0.75,
          marginBottom: "1.6rem",
        }}>
          {project.desc}
        </p>

        {/* Stats */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "0.8rem",
          marginBottom: "1.6rem",
        }}>
          {project.stats.map(([val, label]) => (
            <div key={label} style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "8px",
              padding: "0.7rem 0.5rem",
              textAlign: "center",
            }}>
              <div style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: "0.2rem" }}>{val}</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.6rem", opacity: 0.4, textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Tech stack */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem", marginBottom: "1.8rem" }}>
          {project.tech.map(t => (
            <span key={t} style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.65rem",
              padding: "0.25rem 0.65rem",
              border: "1px solid rgba(255,255,255,0.18)",
              borderRadius: "999px",
              opacity: 0.7,
              letterSpacing: "0.05em",
            }}>
              {t}
            </span>
          ))}
        </div>

        {/* GitHub link */}
        <a
          href={project.github}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.72rem",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            padding: "0.65rem 1.2rem",
            border: "1px solid rgba(255,255,255,0.3)",
            borderRadius: "8px",
            color: "rgba(255,255,255,0.85)",
            textDecoration: "none",
            transition: "background 0.2s, border-color 0.2s",
            background: "rgba(255,255,255,0.04)",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.1)";
            (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(255,255,255,0.6)";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.04)";
            (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(255,255,255,0.3)";
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
          </svg>
          View on GitHub
        </a>
      </div>

      <style>{`
        @keyframes fadeInBg { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUpModal { from { opacity: 0; transform: translateY(24px) scale(0.97) } to { opacity: 1; transform: translateY(0) scale(1) } }
      `}</style>
    </div>
  );
}

// ── Zoom overlay ──────────────────────────────────────────────────────────────
function ZoomOverlay({ active }: { active: boolean }) {
  return (
    <div style={{
      position: "absolute",
      inset: 0,
      background: "radial-gradient(circle at 50% 40%, rgba(255,255,255,0.08) 0%, transparent 60%)",
      opacity: active ? 1 : 0,
      transition: "opacity 0.4s ease",
      pointerEvents: "none",
      zIndex: 3,
    }} />
  );
}

// ── Main Section ──────────────────────────────────────────────────────────────
export default function BrainProjectsSection() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [zooming, setZooming] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const handleNodeClick = useCallback((project: Project) => {
    setZooming(true);
    setTimeout(() => {
      setSelectedProject(project);
      setZooming(false);
    }, 350);
  }, []);

  return (
    <section
      id="projects"
      ref={sectionRef}
      style={{ padding: "6rem 8vw", position: "relative", zIndex: 1 }}
    >
      {/* Section label */}
      <div style={{
        display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "3rem",
        opacity: inView ? 1 : 0, transform: inView ? "translateY(0)" : "translateY(16px)",
        transition: "opacity 0.6s ease, transform 0.6s ease",
      }}>
        <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#84cc16", flexShrink: 0, display: "inline-block" }} />
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.68rem", letterSpacing: "0.22em", textTransform: "uppercase", opacity: 0.55 }}>
          03 — Projects
        </span>
      </div>

      {/* Subtitle */}
      <div style={{
        marginBottom: "2.5rem",
        opacity: inView ? 1 : 0,
        transition: "opacity 0.6s ease 0.15s",
      }}>
        <p style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "0.7rem",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          opacity: 0.35,
        }}>
          Click a node to explore a project
        </p>
      </div>

      {/* Brain canvas container */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "520px",
          borderRadius: "16px",
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.07)",
          background: "rgba(0,0,0,0.6)",
          opacity: inView ? 1 : 0,
          transform: inView ? "scale(1)" : "scale(0.97)",
          transition: "opacity 0.8s ease 0.2s, transform 0.8s cubic-bezier(0.23,1,0.32,1) 0.2s",
        }}
        className="brain-canvas-wrap"
      >
        <BrainCanvas
          onNodeClick={handleNodeClick}
          onNodeHover={setHoveredId}
          hoveredId={hoveredId}
        />
        <ZoomOverlay active={zooming} />

        {/* Hint labels for each node */}
        {PROJECTS.map((p) => (
          <div
            key={p.id}
            style={{
              position: "absolute",
              left: `calc(${p.nx * 100}% + 18px)`,
              top: `calc(${p.ny * 100}% - 8px)`,
              pointerEvents: "none",
              opacity: hoveredId === p.id ? 0 : 0.55,
              transition: "opacity 0.2s",
            }}
          >
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.6rem",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.7)",
              whiteSpace: "nowrap",
              background: "rgba(0,0,0,0.5)",
              padding: "0.15rem 0.4rem",
              borderRadius: "4px",
            }}>
              {p.title}
            </span>
          </div>
        ))}
      </div>

      {/* Project modal */}
      {selectedProject && (
        <ProjectModal
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
        />
      )}

      <style>{`
        .light .brain-canvas-wrap {
          border-color: rgba(0,0,0,0.1) !important;
          background: rgba(0,0,0,0.85) !important;
        }
      `}</style>
    </section>
  );
}
