// Glassmorphism Detail Panel Preview
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const PROJECTS = [
  {
    id: 1,
    title: "MoodTunes AI",
    subtitle: "ML · Music Recommender",
    desc: "LightGBM trained on 114K+ Spotify tracks. F1 score 0.5652 on 5-class mood classification with real-time recommendation API.",
    tech: ["Python", "LightGBM", "Spotify API", "scikit-learn", "pandas"],
    stats: [["0.5652", "F1 Score"], ["114K+", "Tracks"], ["5", "Mood Classes"]],
    color: "#00d4ff",
    github: "https://github.com/HeinHtet-Phyo/moodtunes-ai-group3",
  },
  {
    id: 2,
    title: "IT Career Planner",
    subtitle: "XGBoost · Career AI",
    desc: "XGBoost classifier at 99.75% accuracy across 6,000 samples. Maps SFIA framework skills to career paths with gap analysis.",
    tech: ["Python", "XGBoost", "SFIA", "scikit-learn", "Streamlit"],
    stats: [["99.75%", "Accuracy"], ["6,000", "Samples"], ["SFIA", "Framework"]],
    color: "#7c3aed",
    github: "https://github.com/HeinHtet-Phyo/it-career-planner",
  },
  {
    id: 3,
    title: "CityPulse",
    subtitle: "Urban Data Analytics",
    desc: "Interactive urban analytics platform aggregating transportation, demographic, and infrastructure data into city-level intelligence.",
    tech: ["Python", "Pandas", "Plotly", "GeoPandas", "Streamlit"],
    stats: [["City", "Scale"], ["Real-time", "Data"], ["Interactive", "Maps"]],
    color: "#10b981",
    github: "https://github.com/HeinHtet-Phyo",
  },
];

type Project = typeof PROJECTS[0];

function DetailPanel({ project, onClose }: { project: Project; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 60, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 320, damping: 30 }}
      style={{
        position: "fixed",
        top: "50%",
        right: "2.5rem",
        transform: "translateY(-50%)",
        width: "320px",
        background: "rgba(2, 6, 20, 0.75)",
        backdropFilter: "blur(32px)",
        WebkitBackdropFilter: "blur(32px)",
        border: `1px solid ${project.color}30`,
        borderRadius: "14px",
        padding: "1.75rem",
        zIndex: 100,
        boxShadow: `0 0 60px ${project.color}15, 0 30px 80px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.05)`,
      }}
    >
      {/* Corner brackets — HUD decoration */}
      {([[0,0],[0,1],[1,0],[1,1]] as [number,number][]).map(([r,c], i) => (
        <div key={i} style={{
          position: "absolute",
          top: r === 0 ? "8px" : "auto", bottom: r === 1 ? "8px" : "auto",
          left: c === 0 ? "8px" : "auto", right: c === 1 ? "8px" : "auto",
          width: "14px", height: "14px",
          borderTop: r === 0 ? `1.5px solid ${project.color}50` : "none",
          borderBottom: r === 1 ? `1.5px solid ${project.color}50` : "none",
          borderLeft: c === 0 ? `1.5px solid ${project.color}50` : "none",
          borderRight: c === 1 ? `1.5px solid ${project.color}50` : "none",
        }} />
      ))}

      {/* Subtle top glow line */}
      <div style={{
        position: "absolute", top: 0, left: "20%", right: "20%", height: "1px",
        background: `linear-gradient(to right, transparent, ${project.color}60, transparent)`,
        borderRadius: "999px",
      }} />

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.1rem" }}>
        <div>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.55rem",
            color: project.color,
            letterSpacing: "0.22em",
            marginBottom: "0.35rem",
            opacity: 0.85,
          }}>
            ◈ {project.subtitle}
          </div>
          <h3 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 800,
            fontSize: "1.25rem",
            color: "#ffffff",
            margin: 0,
            letterSpacing: "-0.025em",
          }}>
            {project.title}
          </h3>
        </div>
        <button
          onClick={onClose}
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "rgba(255,255,255,0.3)",
            width: "28px", height: "28px",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "0.75rem",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
            transition: "all 0.15s ease",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.08)";
            (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.7)";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)";
            (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.3)";
          }}
        >
          ✕
        </button>
      </div>

      {/* Divider */}
      <div style={{
        height: "1px",
        background: `linear-gradient(to right, ${project.color}30, transparent)`,
        marginBottom: "1rem",
      }} />

      {/* Description */}
      <p style={{
        fontFamily: "'Inter', sans-serif",
        fontSize: "0.78rem",
        color: "rgba(255,255,255,0.45)",
        lineHeight: 1.75,
        marginBottom: "1.1rem",
      }}>
        {project.desc}
      </p>

      {/* Stats grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "0.4rem",
        marginBottom: "1.1rem",
      }}>
        {project.stats.map(([val, label]) => (
          <div key={label} style={{
            border: `1px solid ${project.color}18`,
            background: `${project.color}06`,
            padding: "0.55rem 0.3rem",
            textAlign: "center",
            borderRadius: "6px",
          }}>
            <div style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 800,
              fontSize: "0.85rem",
              color: project.color,
              letterSpacing: "-0.01em",
            }}>{val}</div>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.48rem",
              color: "rgba(255,255,255,0.2)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginTop: "3px",
            }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Tech stack */}
      <div style={{ marginBottom: "1.25rem" }}>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "0.52rem",
          color: "rgba(255,255,255,0.18)",
          letterSpacing: "0.2em",
          marginBottom: "0.5rem",
        }}>TECH STACK</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
          {project.tech.map(t => (
            <span key={t} style={{
              border: `1px solid ${project.color}25`,
              color: project.color,
              padding: "0.2rem 0.5rem",
              fontSize: "0.6rem",
              fontFamily: "'JetBrains Mono', monospace",
              borderRadius: "4px",
              background: `${project.color}08`,
              opacity: 0.9,
            }}>{t}</span>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: "0.6rem" }}>
        <a
          href={project.github}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            flex: 1,
            background: `${project.color}18`,
            color: project.color,
            border: `1px solid ${project.color}40`,
            padding: "0.6rem",
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 700,
            fontSize: "0.7rem",
            letterSpacing: "0.06em",
            borderRadius: "6px",
            textDecoration: "none",
            textAlign: "center",
            display: "block",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLAnchorElement).style.background = `${project.color}30`;
            (e.currentTarget as HTMLAnchorElement).style.boxShadow = `0 0 20px ${project.color}25`;
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLAnchorElement).style.background = `${project.color}18`;
            (e.currentTarget as HTMLAnchorElement).style.boxShadow = "none";
          }}
        >
          GitHub →
        </a>
        <button style={{
          flex: 1,
          background: "transparent",
          color: "rgba(255,255,255,0.22)",
          border: "1px solid rgba(255,255,255,0.08)",
          padding: "0.6rem",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "0.7rem",
          letterSpacing: "0.06em",
          borderRadius: "6px",
          cursor: "pointer",
        }}>
          Live Demo
        </button>
      </div>

      {/* ESC hint */}
      <div style={{
        textAlign: "center",
        marginTop: "1rem",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "0.5rem",
        color: "rgba(255,255,255,0.1)",
        letterSpacing: "0.15em",
      }}>
        PRESS ESC OR CLICK SPACE TO CLOSE
      </div>
    </motion.div>
  );
}

export default function PanelPreview() {
  const [selected, setSelected] = useState<Project | null>(PROJECTS[0]);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#000",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      overflow: "hidden",
      fontFamily: "'Inter', sans-serif",
    }}>
      {/* Subtle background grid */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "radial-gradient(circle, rgba(0,212,255,0.04) 1px, transparent 1px)",
        backgroundSize: "36px 36px",
      }} />

      {/* Glow blob */}
      {selected && (
        <div style={{
          position: "absolute",
          top: "50%", right: "400px",
          transform: "translateY(-50%)",
          width: "300px", height: "300px",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${selected.color}12, transparent 70%)`,
          pointerEvents: "none",
          transition: "background 0.5s ease",
        }} />
      )}

      {/* Left — project selector buttons */}
      <div style={{
        position: "relative", zIndex: 10,
        display: "flex", flexDirection: "column", gap: "0.75rem",
        marginRight: "auto", marginLeft: "6rem",
      }}>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "0.55rem",
          color: "rgba(255,255,255,0.2)",
          letterSpacing: "0.25em",
          marginBottom: "0.5rem",
        }}>
          ← CLICK A PROJECT TO SEE THE PANEL
        </div>
        {PROJECTS.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelected(selected?.id === p.id ? null : p)}
            style={{
              background: selected?.id === p.id ? `${p.color}12` : "transparent",
              border: `1px solid ${selected?.id === p.id ? p.color + "40" : "rgba(255,255,255,0.06)"}`,
              color: selected?.id === p.id ? p.color : "rgba(255,255,255,0.35)",
              padding: "0.65rem 1.2rem",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.72rem",
              letterSpacing: "0.08em",
              borderRadius: "7px",
              cursor: "pointer",
              display: "flex", alignItems: "center", gap: "0.6rem",
              transition: "all 0.2s ease",
              textAlign: "left",
            }}
          >
            <div style={{
              width: "6px", height: "6px", borderRadius: "50%",
              background: p.color,
              boxShadow: selected?.id === p.id ? `0 0 8px ${p.color}` : "none",
              flexShrink: 0,
            }} />
            {p.title}
          </button>
        ))}
      </div>

      {/* Detail panel */}
      <AnimatePresence mode="wait">
        {selected && (
          <DetailPanel
            key={selected.id}
            project={selected}
            onClose={() => setSelected(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
