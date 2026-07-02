// Dark Space Theme — Hero Section
// Split-char name animation, typing roles, count-up stats, magnetic buttons, 3D neural network
import { useEffect, useRef, useState } from "react";
import { FiGithub, FiLinkedin, FiMail, FiArrowRight, FiDownload } from "react-icons/fi";
import RobotViewer from "../RobotViewer";

const ROLES = ["Data Scientist", "AI Engineer", "ML Developer", "Data Analyst"];
const NAME = "Hein Htet Phyo";

const STATS = [
  { value: 114, suffix: "K+", label: "Spotify Tracks" },
  { value: 80, suffix: "%", label: "API Optimised" },
  { value: 40, suffix: "%", label: "Report Time Cut" },
  { value: 99.75, suffix: "%", label: "ML Accuracy" },
];

// Random fly-in directions for each character
const getCharStyle = (i: number) => {
  const directions = [
    { "--tx": "-80px", "--ty": "-60px", "--tr": "-20deg" },
    { "--tx": "60px", "--ty": "-80px", "--tr": "15deg" },
    { "--tx": "-50px", "--ty": "70px", "--tr": "-10deg" },
    { "--tx": "90px", "--ty": "40px", "--tr": "25deg" },
    { "--tx": "-70px", "--ty": "-30px", "--tr": "-15deg" },
    { "--tx": "50px", "--ty": "-70px", "--tr": "20deg" },
    { "--tx": "-90px", "--ty": "50px", "--tr": "-25deg" },
    { "--tx": "70px", "--ty": "80px", "--tr": "10deg" },
    { "--tx": "-40px", "--ty": "-90px", "--tr": "-20deg" },
    { "--tx": "80px", "--ty": "-40px", "--tr": "30deg" },
    { "--tx": "-60px", "--ty": "60px", "--tr": "-12deg" },
    { "--tx": "40px", "--ty": "90px", "--tr": "18deg" },
    { "--tx": "-80px", "--ty": "30px", "--tr": "-22deg" },
    { "--tx": "60px", "--ty": "-60px", "--tr": "14deg" },
  ];
  return directions[i % directions.length];
};

function SplitCharName({ name }: { name: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 600);
    return () => clearTimeout(t);
  }, []);

  return (
    <h1 style={{
      fontFamily: "'Space Grotesk', sans-serif",
      fontSize: "clamp(2.5rem, 6vw, 4.5rem)",
      fontWeight: 700,
      lineHeight: 1.1,
      color: "white",
      marginBottom: "0.5rem",
      letterSpacing: "-0.02em",
      whiteSpace: "nowrap",
    }}>
      {name.split(" ").map((word, wi) => (
        <span key={wi} style={{ display: "inline-block", marginRight: "0.3em" }}>
          {word.split("").map((char, ci) => {
            const idx = wi * 10 + ci;
            return (
              <span
                key={ci}
                className="split-char"
                style={{
                  ...(getCharStyle(idx) as React.CSSProperties),
                  animationDelay: visible ? `${idx * 0.04}s` : "999s",
                  animationPlayState: visible ? "running" : "paused",
                }}
              >
                {char}
              </span>
            );
          })}
        </span>
      ))}
    </h1>
  );
}

function TypingRole() {
  const [roleIdx, setRoleIdx] = useState(0);
  const [text, setText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const role = ROLES[roleIdx];
    let timeout: ReturnType<typeof setTimeout>;

    if (!deleting && text.length < role.length) {
      timeout = setTimeout(() => setText(role.slice(0, text.length + 1)), 80);
    } else if (!deleting && text.length === role.length) {
      timeout = setTimeout(() => setDeleting(true), 2000);
    } else if (deleting && text.length > 0) {
      timeout = setTimeout(() => setText(text.slice(0, -1)), 40);
    } else if (deleting && text.length === 0) {
      setDeleting(false);
      setRoleIdx((i) => (i + 1) % ROLES.length);
    }

    return () => clearTimeout(timeout);
  }, [text, deleting, roleIdx]);

  return (
    <div style={{
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: "clamp(1rem, 2.5vw, 1.4rem)",
      color: "var(--electric-blue)",
      marginBottom: "1rem",
      minHeight: "2rem",
    }}>
      <span>{text}</span>
      <span style={{
        display: "inline-block",
        width: "2px",
        height: "1.2em",
        background: "var(--electric-blue)",
        marginLeft: "2px",
        verticalAlign: "middle",
        animation: "blink 1s step-end infinite",
      }} />
      <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }`}</style>
    </div>
  );
}

function CountUpStat({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const [count, setCount] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const duration = 2000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [value]);

  return (
    <div className="stat-item">
      <div className="stat-number glow-blue">
        {count}{suffix}
      </div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

export default function HeroSection() {
  const btnRef1 = useRef<HTMLButtonElement>(null);
  const btnRef2 = useRef<HTMLButtonElement>(null);

  // Magnetic button effect
  const makeMagnetic = (ref: React.RefObject<HTMLButtonElement | null>) => {
    const el = ref.current;
    if (!el) return;

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      const dist = Math.sqrt(x * x + y * y);
      const maxDist = 80;
      if (dist < maxDist) {
        const factor = (1 - dist / maxDist) * 0.4;
        el.style.transform = `translate(${x * factor}px, ${y * factor}px)`;
      }
    };

    const onLeave = () => {
      el.style.transform = "translate(0, 0)";
      el.style.transition = "transform 0.4s cubic-bezier(0.23, 1, 0.32, 1)";
    };

    window.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  };

  useEffect(() => {
    const c1 = makeMagnetic(btnRef1);
    const c2 = makeMagnetic(btnRef2);
    return () => { c1?.(); c2?.(); };
  }, []);

  return (
    <section
      id="hero"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        background: "#000000",
        backgroundImage: "url('/manus-storage/hero-bg_46db4527.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        position: "relative",
        zIndex: 1,
        paddingTop: "80px",
      }}
    >
      <div className="container" style={{ width: "100%" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "4rem",
          alignItems: "center",
        }}
          className="hero-grid"
        >
          {/* Left Column */}
          <div>
            {/* Status Pill */}
            <div style={{ marginBottom: "1.5rem" }}>
              <div className="status-pill">
                <div className="status-dot" />
                Available for Work · London, UK
              </div>
            </div>

            {/* Name */}
            <SplitCharName name={NAME} />

            {/* Typing Role */}
            <TypingRole />

            {/* Credential */}
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.78rem",
              color: "rgba(255,255,255,0.5)",
              marginBottom: "1.25rem",
              letterSpacing: "0.03em",
            }}>
              <span style={{ color: "var(--electric-blue)" }}>✦</span> First Class Honours · BSc Data Science &amp; AI · UWE Bristol
            </div>

            {/* Description */}
            <p style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "1rem",
              color: "rgba(255,255,255,0.6)",
              lineHeight: 1.7,
              marginBottom: "2rem",
              maxWidth: "480px",
            }}>
              99.75% ML accuracy. 114K+ Spotify tracks processed. 5M+ payment users served.
              I build data systems that deliver measurable impact at scale.
            </p>

            {/* Stats */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "1rem",
              marginBottom: "2rem",
              padding: "1.25rem",
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.05)",
              borderRadius: "8px",
            }}>
              {STATS.map((s) => (
                <CountUpStat key={s.label} {...s} />
              ))}
            </div>

            {/* Social Icons */}
            <div style={{ display: "flex", gap: "0.75rem", marginBottom: "2rem" }}>
              <a href="https://github.com/HeinHtet-Phyo" target="_blank" rel="noopener noreferrer" className="social-icon">
                <FiGithub size={18} />
              </a>
              <a href="https://linkedin.com/in/hein-htet-phyo" target="_blank" rel="noopener noreferrer" className="social-icon">
                <FiLinkedin size={18} />
              </a>
              <a href="mailto:heinhtetphyo56@gmail.com" className="social-icon">
                <FiMail size={18} />
              </a>
            </div>

            {/* CTA Buttons */}
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              <button
                ref={btnRef1}
                className="btn-magnetic btn-primary"
                onClick={() => document.getElementById("projects")?.scrollIntoView({ behavior: "smooth" })}
              >
                View Projects <FiArrowRight size={16} />
              </button>
              <button
                ref={btnRef2}
                className="btn-magnetic btn-outline"
                onClick={() => {
                  // Download CV placeholder
                  const link = document.createElement("a");
                  link.href = "#";
                  link.download = "HeinHtetPhyo_CV.pdf";
                  link.click();
                }}
              >
                <FiDownload size={16} /> Download CV
              </button>
            </div>
          </div>

          {/* Right Column */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2rem" }}>
            {/* 3D Robot */}
            <div style={{
              width: "100%",
              borderRadius: "12px",
              border: "1px solid rgba(0,212,255,0.12)",
              overflow: "hidden",
              background: "rgba(0,5,15,0.6)",
              boxShadow: "0 0 40px rgba(0,180,255,0.08), inset 0 0 60px rgba(0,100,180,0.04)",
            }}>
              <RobotViewer />
            </div>

            {/* Profile Photo Placeholder */}
            <div style={{ position: "relative", width: "180px", height: "180px" }}>
              {/* Spinning gradient ring */}
              <svg
                className="photo-ring"
                style={{ position: "absolute", inset: "-8px", width: "calc(100% + 16px)", height: "calc(100% + 16px)" }}
                viewBox="0 0 196 196"
              >
                <defs>
                  <linearGradient id="ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#00d4ff" />
                    <stop offset="50%" stopColor="#7c3aed" />
                    <stop offset="100%" stopColor="#00d4ff" />
                  </linearGradient>
                </defs>
                <circle cx="98" cy="98" r="94" fill="none" stroke="url(#ring-grad)" strokeWidth="2" strokeDasharray="60 20" />
              </svg>
              {/* Photo */}
              <div style={{
                width: "180px",
                height: "180px",
                borderRadius: "50%",
                overflow: "hidden",
                border: "3px solid rgba(0,212,255,0.3)",
              }}>
                <img
                  src="/manus-storage/profile-placeholder_ecf77c3b.png"
                  alt="Hein Htet Phyo"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                    (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="profile-placeholder" style="border-radius:50%;font-size:3rem;width:100%;height:100%;display:flex;align-items:center;justify-content:center;">HHP</div>';
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div style={{
        position: "absolute",
        bottom: "2rem",
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "0.5rem",
        opacity: 0.4,
      }}>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "0.65rem",
          color: "white",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
        }}>scroll</div>
        <div style={{
          width: "1px",
          height: "40px",
          background: "linear-gradient(to bottom, rgba(0,212,255,0.8), transparent)",
          animation: "scroll-line 2s ease-in-out infinite",
        }} />
        <style>{`
          @keyframes scroll-line {
            0% { transform: scaleY(0); transform-origin: top; }
            50% { transform: scaleY(1); transform-origin: top; }
            51% { transform: scaleY(1); transform-origin: bottom; }
            100% { transform: scaleY(0); transform-origin: bottom; }
          }
          @media (max-width: 768px) {
            .hero-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </div>
    </section>
  );
}
