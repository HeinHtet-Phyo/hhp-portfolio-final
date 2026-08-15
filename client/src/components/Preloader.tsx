// Preloader — exact port of motionfolio Preloader.jsx
// ASCII art box, cycling words, slide-up exit, scanline, dark grid

import { useEffect, useState } from "react";

const words = ["INITIALIZING", "LOADING ASSETS", "COMPILING", "READY"];

// Theme palettes. Dark is exactly what was hardcoded before; light is its
// inverse. Nothing else about the preloader changes with theme.
const PALETTES = {
  dark: {
    bg: "#000",
    ink: "rgba(255,255,255,0.85)",
    grid: "#333",
    scanline: "rgba(0,0,0,0.1)",
    glow: "rgba(255,255,255,0.3)",
  },
  light: {
    bg: "#fff",
    ink: "rgba(0,0,0,0.85)",
    grid: "#ccc",
    scanline: "rgba(0,0,0,0.05)",
    glow: "rgba(0,0,0,0.15)",
  },
} as const;

// Resolved BEFORE the first paint, not in an effect — an effect would render one
// frame of dark and then repaint, which is exactly the flash to avoid.
//
// Reads the same two places ThemeContext owns: the class it stamps on <html>,
// then the "hhp-theme" localStorage key it persists to. The class is checked
// first because it is what the provider has already applied this session;
// localStorage covers the case where the preloader mounts before the provider's
// effect has run. Defaults to dark, matching ThemeContext's own default.
function readTheme(): "dark" | "light" {
  if (typeof document !== "undefined" && document.documentElement.classList.contains("light")) return "light";
  try {
    if (typeof localStorage !== "undefined" && localStorage.getItem("hhp-theme") === "light") return "light";
  } catch {
    /* storage can throw in private mode — fall through to the default */
  }
  return "dark";
}

export default function Preloader({ onDone }: { onDone: () => void }) {
  // Lazy initialiser: runs once, during the first render, before paint.
  const [theme] = useState<"dark" | "light">(readTheme);
  const t = PALETTES[theme];

  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [tick, setTick] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Progress counter animation
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        // Fixed 2.5% per 30ms tick: 40 ticks = ~1200ms to fill, plus the 200ms
        // hold at 100% and the 700ms slide-up. A fixed step (rather than the
        // original Math.random() * 8) also makes the duration repeatable.
        const diff = 2.5;
        return Math.min(prev + diff, 100);
      });
    }, 30);

    // Tick for ASCII glitch/animation
    const tickTimer = setInterval(() => setTick((t) => t + 1), 15);

    return () => {
      clearInterval(timer);
      clearInterval(tickTimer);
    };
  }, []);

  useEffect(() => {
    // Text cycle animation
    if (index === words.length - 1) return;
    const timeout = setTimeout(() => {
      setIndex((prev) => prev + 1);
    }, 138);
    return () => clearTimeout(timeout);
  }, [index]);

  useEffect(() => {
    // Complete trigger
    if (progress === 100) {
      const timeout = setTimeout(() => {
        setIsExiting(true);
        setTimeout(onDone, 700);
      }, 200);
      return () => clearTimeout(timeout);
    }
  }, [progress, onDone]);

  // Build ASCII art
  const buildAscii = () => {
    const width = typeof window !== "undefined" && window.innerWidth < 768 ? 20 : 40;
    const filled = Math.floor((progress / 100) * width);
    const fillChars = ["░", "▒", "▓", "█"];
    let ascii = "";

    ascii += "╔" + "═".repeat(width) + "╗\n";
    for (let r = 0; r < 5; r++) {
      let row = "║";
      for (let c = 0; c < width; c++) {
        if (c < filled) {
          if (c === filled - 1 && progress < 100) {
            row += fillChars[tick % 4];
          } else {
            row += "█";
          }
        } else {
          row += tick % 2 === 0 && Math.random() > 0.9 ? "." : " ";
        }
      }
      row += "║\n";
      ascii += row;
    }
    ascii += "╚" + "═".repeat(width) + "╝\n";

    ascii += `\n>> SYS.MEM.${progress === 100 ? "READY" : "ALLOCATING"} [${Math.round(progress).toString().padStart(3, "0")}%]`;
    if (progress === 100) {
      ascii += ` [OK]\n>> BOOT SEQUENCE COMPLETE.`;
    } else {
      ascii += ` [${fillChars[tick % 4]}]\n>> 0x${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, "0").toUpperCase()} ...`;
    }

    return ascii;
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: t.bg,
        color: t.ink,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "clamp(1rem, 2.5vw, 2.5rem)",
        fontFamily: "'JetBrains Mono', 'Courier New', monospace",
        overflow: "hidden",
        transform: isExiting ? "translateY(-100%)" : "translateY(0)",
        transition: "transform 700ms cubic-bezier(0.76, 0, 0.24, 1)",
        willChange: "transform",
      }}
    >
      {/* Top Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", textTransform: "uppercase", fontSize: "clamp(0.6rem, 1.5vw, 0.875rem)", letterSpacing: "0.15em", opacity: 0.5 }}>
        <span>HHP Portfolio</span>
        <span>©2026</span>
      </div>

      {/* Center Content */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1.5rem", width: "100%" }}>
        {/* Cycling word */}
        <p
          key={index}
          style={{
            fontSize: "clamp(1rem, 3vw, 1.875rem)",
            fontWeight: 700,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: t.ink,
            margin: 0,
            animation: "preloaderFadeIn 0.3s ease forwards",
          }}
        >
          &gt; {words[index]}_
        </p>

        {/* ASCII art box */}
        <pre
          style={{
            color: t.ink,
            fontFamily: "'JetBrains Mono', 'Courier New', monospace",
            fontSize: "clamp(0.5rem, 1.2vw, 0.875rem)",
            lineHeight: 1.1,
            whiteSpace: "pre",
            textAlign: "center",
            userSelect: "none",
            overflow: "hidden",
            filter: `drop-shadow(0 0 8px ${t.glow})`,
            margin: 0,
          }}
        >
          {buildAscii()}
        </pre>
      </div>

      {/* Bottom Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", textTransform: "uppercase", fontSize: "clamp(0.6rem, 1.5vw, 0.875rem)", letterSpacing: "0.15em", opacity: 0.5, width: "100%" }}>
        <span>System Status: {progress === 100 ? "ONLINE" : "BOOTING"}</span>
      </div>

      {/* Background Grid */}
      <div style={{
        position: "absolute",
        inset: 0,
        zIndex: -1,
        opacity: 0.2,
        pointerEvents: "none",
        backgroundImage: `linear-gradient(${t.grid} 1px, transparent 1px), linear-gradient(90deg, ${t.grid} 1px, transparent 1px)`,
        backgroundSize: "40px 40px",
      }} />

      {/* Scanline Effect */}
      <div style={{
        position: "absolute",
        inset: 0,
        zIndex: 10,
        pointerEvents: "none",
        background: `linear-gradient(transparent 50%, ${t.scanline} 50%)`,
        backgroundSize: "100% 4px",
      }} />

      <style>{`
        @keyframes preloaderFadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
