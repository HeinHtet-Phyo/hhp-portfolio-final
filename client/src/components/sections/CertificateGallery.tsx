// CertificateGallery — matches the screenshot exactly
// Flat cards, colored gradient image area, cyan tab at top, emoji, colored date

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
    // Dark brown/gold gradient like screenshot card 1
    gradient: "linear-gradient(160deg, #2a1a00 0%, #1a1000 60%, #0d0800 100%)",
    tabColor: "#22d3ee",
          dateColor: "rgba(255,255,255,0.75)",
    glowColor: "rgba(245,158,11,0.25)",
    borderHover: "rgba(245,158,11,0.45)",
  },
  {
    emoji: "🚀",
    title: "Innovation Hackathon — FixIt App",
    org: "GUSTO College",
    date: "Mar 2025",
    // Dark green gradient like screenshot card 2
    gradient: "linear-gradient(160deg, #0a2010 0%, #051408 60%, #020a04 100%)",
    tabColor: "#22d3ee",
          dateColor: "rgba(255,255,255,0.75)",
    glowColor: "rgba(52,211,153,0.25)",
    borderHover: "rgba(52,211,153,0.45)",
  },
  {
    emoji: "📊",
    title: "Data Analysis & Machine Learning",
    org: "Ace of Data",
    date: "Dec 2025",
    // Dark teal gradient like screenshot card 3
    gradient: "linear-gradient(160deg, #051820 0%, #030e14 60%, #010608 100%)",
    tabColor: "#22d3ee",
          dateColor: "rgba(255,255,255,0.75)",
    glowColor: "rgba(34,211,238,0.25)",
    borderHover: "rgba(34,211,238,0.45)",
  },
  {
    emoji: "🌍",
    title: "Regen Asia Summit",
    org: "NUS Singapore",
    date: "Jul 2025",
    // Dark purple gradient like screenshot card 4
    gradient: "linear-gradient(160deg, #180a28 0%, #0e0518 60%, #060208 100%)",
    tabColor: "#22d3ee",
          dateColor: "rgba(255,255,255,0.75)",
    glowColor: "rgba(167,139,250,0.25)",
    borderHover: "rgba(167,139,250,0.45)",
  },
  {
    emoji: "🐍",
    title: "Introduction to Python",
    org: "Technortal",
    date: "May 2025",
    // Dark blue/indigo gradient like screenshot card 5
    gradient: "linear-gradient(160deg, #080a20 0%, #050614 60%, #020308 100%)",
    tabColor: "#22d3ee",
          dateColor: "rgba(255,255,255,0.75)",
    glowColor: "rgba(129,140,248,0.25)",
    borderHover: "rgba(129,140,248,0.45)",
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
        width: "195px",
        height: "230px",
        borderRadius: "14px",
        overflow: "hidden",
        border: hovered
          ? `1px solid ${cert.borderHover}`
          : "1px solid rgba(255,255,255,0.08)",
        background: "rgba(12,12,18,0.95)",
        boxShadow: hovered
          ? `0 0 28px ${cert.glowColor}, 0 8px 32px rgba(0,0,0,0.5)`
          : "0 4px 20px rgba(0,0,0,0.4)",
        // All cards same tilt angle: even=-5deg, odd=+5deg
        transform: hovered
          ? `rotate(0deg) scale(1.05)`
          : `rotate(${index % 2 === 0 ? -2 : 2}deg)`,
        transition: "transform 0.35s cubic-bezier(0.23,1,0.32,1), border-color 0.3s ease, box-shadow 0.3s ease, opacity 0.65s cubic-bezier(0.23,1,0.32,1)",
        transitionDelay: `0s, 0s, 0s, ${index * 0.09}s`,
        zIndex: hovered ? 10 : 1,
        opacity: inView ? 1 : 0,
        cursor: "pointer",
        userSelect: "none",
        outline: "none",
      }}
    >
      {/* ── Image / gradient area ── */}
      <div style={{
        height: "138px",
        background: cert.gradient,
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        {/* Cyan tab at very top center — exactly like screenshot */}
        <div style={{
          position: "absolute",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "48px",
          height: "6px",
          borderRadius: "0 0 4px 4px",
          background: "rgba(255,255,255,0.7)",
          opacity: 0.85,
        }} />

        {/* Emoji icon */}
        <span style={{
          fontSize: "3.4rem",
          lineHeight: 1,
          position: "relative",
          zIndex: 1,
          filter: "drop-shadow(0 2px 12px rgba(0,0,0,0.6))",
        }}>
          {cert.emoji}
        </span>
      </div>

      {/* ── Text area ── */}
      <div style={{           padding: "0.6rem 0.9rem 0.7rem" }}>
        {/* Title */}
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontWeight: 700,
          fontSize: "0.7rem",
          lineHeight: 1.3,
          marginBottom: "0.2rem",
          letterSpacing: "-0.01em",
          color: "rgba(255,255,255,0.92)",
        }}>
          {cert.title}
        </div>

        {/* Org */}
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "0.56rem",
          color: "rgba(255,255,255,0.35)",
          marginBottom: "0.3rem",
          lineHeight: 1.4,
        }}>
          {cert.org}
        </div>

        {/* Date — cyan colored like screenshot */}
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "0.64rem",
          fontWeight: 600,
          color: cert.dateColor,
          letterSpacing: "0.02em",
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
            <span style={{
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              background: "#84cc16",
              flexShrink: 0,
              display: "inline-block",
              boxShadow: "0 0 8px rgba(132,204,22,0.6)",
            }} />
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

      {/* Scroll container */}
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
            gap: "0.8rem",
            overflowX: "auto",
            overflowY: "visible",
            paddingLeft: "8vw",
            paddingRight: "8vw",
            paddingBottom: "2rem",
            paddingTop: "1.5rem",
            scrollbarWidth: "none",
            cursor: "grab",
            scrollBehavior: "smooth",
            alignItems: "center",
          }}
          className="cert-scroll"
        >
          {CERTS.map((cert, i) => (
            <CertCard key={cert.title} cert={cert} index={i} inView={inView} />
          ))}
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
        .light .cert-fade-hint {
          background: linear-gradient(to left, var(--background, #f8f8f8) 0%, transparent 100%) !important;
        }
      `}</style>
    </section>
  );
}
