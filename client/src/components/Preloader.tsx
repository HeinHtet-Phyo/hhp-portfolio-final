// Preloader — exact port of motionfolio Preloader.jsx
// ASCII art box, cycling words, slide-up exit, scanline, dark grid

import { useEffect, useState } from "react";

const words = ["INITIALIZING", "LOADING ASSETS", "COMPILING", "READY"];

export default function Preloader({ onDone }: { onDone: () => void }) {
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
        const diff = Math.random() * 8;
        return Math.min(prev + diff, 100);
      });
    }, 120);

    // Tick for ASCII glitch/animation
    const tickTimer = setInterval(() => setTick((t) => t + 1), 60);

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
    }, 550);
    return () => clearTimeout(timeout);
  }, [index]);

  useEffect(() => {
    // Complete trigger
    if (progress === 100) {
      const timeout = setTimeout(() => {
        setIsExiting(true);
        setTimeout(onDone, 800);
      }, 800);
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
        background: "#000",
        color: "rgba(255,255,255,0.85)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "clamp(1rem, 2.5vw, 2.5rem)",
        fontFamily: "'JetBrains Mono', 'Courier New', monospace",
        overflow: "hidden",
        transform: isExiting ? "translateY(-100%)" : "translateY(0)",
        transition: "transform 800ms cubic-bezier(0.76, 0, 0.24, 1)",
        willChange: "transform",
      }}
    >
      {/* Top Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", textTransform: "uppercase", fontSize: "clamp(0.6rem, 1.5vw, 0.875rem)", letterSpacing: "0.15em", opacity: 0.5 }}>
        <span>HHP Portfolio</span>
        <span>©2025</span>
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
            color: "rgba(255,255,255,0.85)",
            margin: 0,
            animation: "preloaderFadeIn 0.3s ease forwards",
          }}
        >
          &gt; {words[index]}_
        </p>

        {/* ASCII art box */}
        <pre
          style={{
            color: "rgba(255,255,255,0.85)",
            fontFamily: "'JetBrains Mono', 'Courier New', monospace",
            fontSize: "clamp(0.5rem, 1.2vw, 0.875rem)",
            lineHeight: 1.1,
            whiteSpace: "pre",
            textAlign: "center",
            userSelect: "none",
            overflow: "hidden",
            filter: "drop-shadow(0 0 8px rgba(255,255,255,0.3))",
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
        backgroundImage: "linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)",
        backgroundSize: "40px 40px",
      }} />

      {/* Scanline Effect */}
      <div style={{
        position: "absolute",
        inset: 0,
        zIndex: 10,
        pointerEvents: "none",
        background: "linear-gradient(transparent 50%, rgba(0,0,0,0.1) 50%)",
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
