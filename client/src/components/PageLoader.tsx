// Dark Space Theme — Page Load Animation with HHP logo
import { useEffect, useState } from "react";

export default function PageLoader() {
  const [phase, setPhase] = useState<"visible" | "wipe" | "done">("visible");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("wipe"), 1400);
    const t2 = setTimeout(() => setPhase("done"), 2000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (phase === "done") return null;

  return (
    <div
      className="page-loader"
      style={{
        transition: "transform 0.6s cubic-bezier(0.77, 0, 0.175, 1)",
        transform: phase === "wipe" ? "translateY(-100%)" : "translateY(0)",
      }}
    >
      {/* Circuit board HHP logo */}
      <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg"
        style={{ marginBottom: "1rem" }}>
        {/* Traces */}
        <line x1="10" y1="20" x2="70" y2="20" stroke="#00d4ff" strokeWidth="1.5" opacity="0.4"/>
        <line x1="10" y1="60" x2="70" y2="60" stroke="#00d4ff" strokeWidth="1.5" opacity="0.4"/>
        <line x1="20" y1="10" x2="20" y2="70" stroke="#00d4ff" strokeWidth="1.5" opacity="0.4"/>
        <line x1="60" y1="10" x2="60" y2="70" stroke="#00d4ff" strokeWidth="1.5" opacity="0.4"/>
        <line x1="40" y1="10" x2="40" y2="70" stroke="#00d4ff" strokeWidth="1.5" opacity="0.3"/>
        {/* Nodes */}
        <circle cx="20" cy="20" r="4" fill="#00d4ff" className="circuit-node"/>
        <circle cx="60" cy="20" r="4" fill="#00d4ff" className="circuit-node"/>
        <circle cx="20" cy="60" r="4" fill="#00d4ff" className="circuit-node"/>
        <circle cx="60" cy="60" r="4" fill="#00d4ff" className="circuit-node"/>
        <circle cx="40" cy="40" r="5" fill="#00d4ff" className="circuit-node"/>
        <circle cx="40" cy="20" r="3" fill="#7c3aed" className="circuit-node"/>
        <circle cx="40" cy="60" r="3" fill="#7c3aed" className="circuit-node"/>
      </svg>
      <div className="loader-logo">HHP</div>
      <div style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "0.75rem",
        color: "rgba(255,255,255,0.4)",
        letterSpacing: "0.2em",
        marginTop: "0.5rem",
        animation: "pulse-green 1.5s ease-in-out infinite",
      }}>
        INITIALIZING...
      </div>
    </div>
  );
}
