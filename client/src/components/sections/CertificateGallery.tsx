// CertificateGallery — horizontal drag-scroll certificate cards
// Colored gradient image areas, emoji icons, cyan glow on hover/focus

import { useState, useEffect, useRef } from "react";

function useInView(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

// ── Certificate data ──────────────────────────────────────────────────────────
const CERTS = [
  {
    emoji: "🥇",
    title: "IOT Challenge Winner",
    org: "GUSTO College",
    date: "Jan 2024",
    gradient: "linear-gradient(135deg, rgba(180,130,30,0.45) 0%, rgba(90,55,5,0.25) 100%)",
    accentColor: "rgba(212,175,55,0.7)",
    glowColor: "rgba(180,130,30,0.3)",
  },
  {
    emoji: "🚀",
    title: "Innovation Hackathon — FixIt App",
    org: "GUSTO College",
    date: "Mar 2025",
    gradient: "linear-gradient(135deg, rgba(34,120,80,0.45) 0%, rgba(10,55,30,0.25) 100%)",
    accentColor: "rgba(52,211,153,0.7)",
    glowColor: "rgba(34,180,80,0.25)",
  },
  {
    emoji: "📊",
    title: "Data Analysis & Machine Learning",
    org: "Ace of Data",
    date: "Dec 2025",
    gradient: "linear-gradient(135deg, rgba(20,120,140,0.45) 0%, rgba(8,55,75,0.25) 100%)",
    accentColor: "rgba(34,211,238,0.7)",
    glowColor: "rgba(20,180,200,0.25)",
  },
  {
    emoji: "🌍",
    title: "Regen Asia Summit",
    org: "NUS Singapore",
    date: "Jul 2025",
    gradient: "linear-gradient(135deg, rgba(100,50,160,0.45) 0%, rgba(45,15,95,0.25) 100%)",
    accentColor: "rgba(167,139,250,0.7)",
    glowColor: "rgba(140,80,220,0.25)",
  },
  {
    emoji: "🐍",
    title: "Introduction to Python",
    org: "Technortal",
    date: "May 2025",
    gradient: "linear-gradient(135deg, rgba(50,60,160,0.45) 0%, rgba(18,25,95,0.25) 100%)",
    accentColor: "rgba(129,140,248,0.7)",
    glowColor: "rgba(80,100,220,0.25)",
  },
];

// ── Certificate Card ──────────────────────────────────────────────────────────
function CertCard({ cert, index, inView }: { cert: typeof CERTS[0]; index: number; inView: boolean }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      tabIndex={0}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      style={{
        flexShrink: 0,
        width: "220px",
        borderRadius: "14px",
        overflow: "hidden",
        border: hovered
          ? "1px solid rgba(34,211,238,0.55)"
          : "1px solid rgba(255,255,255,0.1)",
        background: "rgba(255,255,255,0.025)",
        boxShadow: hovered
          ? "0 0 30px rgba(34,211,238,0.18), 0 0 10px rgba(34,211,238,0.1)"
          : "none",
        transform: hovered ? "scale(1.07)" : "scale(1)",
        transition: "transform 0.3s cubic-bezier(0.23,1,0.32,1), border-color 0.3s, box-shadow 0.3s, opacity 0.65s cubic-bezier(0.23,1,0.32,1)",
        transitionDelay: `0s, 0s, 0s, ${index * 0.08}s`,
        opacity: inView ? 1 : 0,
        cursor: "pointer",
        userSelect: "none",
        outline: "none",
      }}
      className="cert-card"
    >
      {/* Gradient image area with emoji */}
      <div style={{
        height: "130px",
        background: cert.gradient,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "3.2rem",
        position: "relative",
        borderBottom: `1px solid ${hovered ? "rgba(34,211,238,0.2)" : "rgba(255,255,255,0.06)"}`,
        transition: "border-color 0.3s",
      }}>
        {/* Radial glow behind emoji */}
        <div style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at 50% 60%, ${cert.glowColor} 0%, transparent 65%)`,
          pointerEvents: "none",
        }} />
        <span style={{ position: "relative", zIndex: 1, filter: "drop-shadow(0 2px 10px rgba(0,0,0,0.5))" }}>
          {cert.emoji}
        </span>
      </div>

      {/* Text area */}
      <div style={{ padding: "1rem 1.1rem 1.1rem" }}>
        {/* Title */}
        <div style={{
          fontWeight: 700,
          fontSize: "0.85rem",
          lineHeight: 1.35,
          marginBottom: "0.45rem",
          letterSpacing: "-0.01em",
        }}>
          {cert.title}
        </div>

        {/* Org */}
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "0.68rem",
          opacity: 0.45,
          marginBottom: "0.6rem",
          lineHeight: 1.4,
        }}>
          {cert.org}
        </div>

        {/* Date badge */}
        <div style={{
          display: "inline-block",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "0.55rem",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          padding: "0.2rem 0.55rem",
          border: `1px solid ${cert.accentColor}`,
          borderRadius: "999px",
          color: cert.accentColor,
          background: "rgba(255,255,255,0.03)",
        }}>
          {cert.date}
        </div>
      </div>
    </div>
  );
}

// ── Main Section ──────────────────────────────────────────────────────────────
export default function CertificateGallery() {
  const { ref, inView } = useInView(0.1);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Drag-to-scroll
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const onMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    startX.current = e.pageX - (scrollRef.current?.offsetLeft ?? 0);
    scrollLeft.current = scrollRef.current?.scrollLeft ?? 0;
    if (scrollRef.current) scrollRef.current.style.cursor = "grabbing";
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - (scrollRef.current.offsetLeft ?? 0);
    const walk = (x - startX.current) * 1.2;
    scrollRef.current.scrollLeft = scrollLeft.current - walk;
  };
  const stopDrag = () => {
    isDragging.current = false;
    if (scrollRef.current) scrollRef.current.style.cursor = "grab";
  };

  // Wheel → horizontal scroll
  const onWheel = (e: React.WheelEvent) => {
    if (!scrollRef.current) return;
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    e.preventDefault();
    scrollRef.current.scrollLeft += e.deltaY * 0.8;
  };

  return (
    <section
      id="certificates"
      ref={ref}
      style={{ padding: "4rem 0 5rem", position: "relative", zIndex: 1 }}
    >
      {/* Section header */}
      <div style={{
        padding: "0 8vw",
        marginBottom: "2rem",
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(16px)",
        transition: "opacity 0.6s ease, transform 0.6s ease",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#84cc16", flexShrink: 0, display: "inline-block" }} />
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.68rem",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              opacity: 0.55,
            }}>
              Certificate Gallery
            </span>
          </div>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.6rem",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            opacity: 0.3,
            paddingRight: "8vw",
          }}>
            Scroll →
          </span>
        </div>
      </div>

      {/* Scroll container with fade hint */}
      <div style={{ position: "relative" }}>
        <div
          ref={scrollRef}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={stopDrag}
          onMouseLeave={stopDrag}
          onWheel={onWheel}
          style={{
            display: "flex",
            gap: "1.1rem",
            overflowX: "auto",
            paddingLeft: "8vw",
            paddingRight: "8vw",
            paddingBottom: "1rem",
            scrollbarWidth: "none",
            cursor: "grab",
            scrollBehavior: "smooth",
          }}
          className="cert-scroll"
        >
          {CERTS.map((cert, i) => (
            <CertCard key={cert.title} cert={cert} index={i} inView={inView} />
          ))}
          {/* Spacer so last card doesn't sit flush */}
          <div style={{ flexShrink: 0, width: "2vw" }} />
        </div>

        {/* Right fade hint */}
        <div style={{
          position: "absolute",
          right: 0,
          top: 0,
          bottom: "1rem",
          width: "80px",
          background: "linear-gradient(to left, var(--background, #000) 0%, transparent 100%)",
          pointerEvents: "none",
          zIndex: 2,
        }} className="cert-fade-hint" />
      </div>

      <style>{`
        .cert-scroll::-webkit-scrollbar { display: none; }
        .light .cert-card {
          border-color: rgba(0,0,0,0.1) !important;
          background: rgba(0,0,0,0.03) !important;
        }
        .light .cert-card:hover {
          border-color: rgba(34,211,238,0.45) !important;
        }
        .light .cert-fade-hint {
          background: linear-gradient(to left, var(--background, #f8f8f8) 0%, transparent 100%) !important;
        }
      `}</style>
    </section>
  );
}
