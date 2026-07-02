/*
 * ProjectsSection — HUD Brain Interface
 *
 * Brain: Spline embed (particle AI brain)
 * Panels: SYS.LOG (left), PROJECTS (right), bottom HUD bar
 * Background: deep dark teal/navy (#020d18) with subtle grid
 */

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback } from "react";

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
const BG         = "#020d18";

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

// ─── Scrolling Code Panel (left side) ─────────────────────────────────────────
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
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
        <div style={{ width: 6, height: 6, background: TEAL, borderRadius: "50%", boxShadow: `0 0 6px ${TEAL}` }} />
        <span style={{ fontSize: 9, color: TEAL, fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.15em" }}>
          SYS.LOG
        </span>
      </div>
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

// ─── Bottom HUD Data Bar ───────────────────────────────────────────────────────
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

      <p style={{ fontSize: 11, color: `${TEAL_DIM}aa`, fontFamily: "'Space Grotesk', sans-serif", lineHeight: 1.6, marginBottom: 12 }}>
        {project.desc}
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 14 }}>
        {project.tech.map((t) => (
          <span key={t} style={{
            fontSize: 8, padding: "3px 7px", borderRadius: 3,
            background: `${TEAL}10`, border: `1px solid ${TEAL}25`,
            color: `${TEAL}cc`, fontFamily: "JetBrains Mono, monospace",
          }}>{t}</span>
        ))}
      </div>

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

      {/* Spline Brain Embed — fills the full section behind all UI panels */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 1,
        pointerEvents: "none",
      }}>
        <iframe
          src="https://my.spline.design/particleaibrain-qTSH6ng45xCnedxYcL0Ov1Ri/"
          frameBorder="0"
          style={{
            width: "100%",
            height: "100%",
            border: "none",
            display: "block",
            pointerEvents: "auto",
          }}
          title="AI Brain"
          allow="autoplay"
        />
      </div>

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
