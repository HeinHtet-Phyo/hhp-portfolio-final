// CertificateGallery — horizontal drag-scroll certificate cards
// B&W deep space theme, JetBrains Mono, right-edge fade hint
// 5 certificates with relevant icons

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
    title: "IOT Challenge Winner",
    org: "GUSTO College",
    date: "Jan 2024",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="6"/>
        <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
      </svg>
    ),
  },
  {
    title: "Innovation Hackathon – FixIt App",
    org: "GUSTO College",
    date: "Mar 2025",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
        <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
        <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/>
        <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
      </svg>
    ),
  },
  {
    title: "Data Analysis & Machine Learning",
    org: "Ace of Data",
    date: "Dec 2025",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/>
        <line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/>
        <path d="M3 20h18"/>
      </svg>
    ),
  },
  {
    title: "Regen Asia Summit",
    org: "NUS Singapore",
    date: "Jul 2025",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="2" y1="12" x2="22" y2="12"/>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      </svg>
    ),
  },
  {
    title: "Introduction to Python",
    org: "Technortal",
    date: "May 2025",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6"/>
        <polyline points="8 6 2 12 8 18"/>
      </svg>
    ),
  },
];

// ── Certificate Card ──────────────────────────────────────────────────────────
function CertCard({ cert, index, inView }: { cert: typeof CERTS[0]; index: number; inView: boolean }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        flexShrink: 0,
        width: "220px",
        padding: "1.6rem 1.5rem",
        borderRadius: "12px",
        border: hovered ? "1px solid rgba(255,255,255,0.28)" : "1px solid rgba(255,255,255,0.1)",
        background: hovered ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.025)",
        boxShadow: hovered ? "0 0 22px rgba(255,255,255,0.06)" : "none",
        transition: "border-color 0.25s, background 0.25s, box-shadow 0.25s, opacity 0.65s cubic-bezier(0.23,1,0.32,1), transform 0.65s cubic-bezier(0.23,1,0.32,1)",
        transitionDelay: `0s, 0s, 0s, ${index * 0.08}s, ${index * 0.08}s`,
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(24px)",
        cursor: "default",
        userSelect: "none",
      }}
      className="cert-card"
    >
      {/* Icon */}
      <div style={{
        width: "52px",
        height: "52px",
        borderRadius: "10px",
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(255,255,255,0.04)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: "1.1rem",
        color: "rgba(255,255,255,0.65)",
      }}>
        {cert.icon}
      </div>

      {/* Title */}
      <div style={{
        fontWeight: 700,
        fontSize: "0.9rem",
        lineHeight: 1.35,
        marginBottom: "0.45rem",
        letterSpacing: "-0.01em",
      }}>
        {cert.title}
      </div>

      {/* Org */}
      <div style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "0.72rem",
        opacity: 0.5,
        marginBottom: "0.5rem",
        lineHeight: 1.4,
      }}>
        {cert.org}
      </div>

      {/* Date */}
      <div style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "0.62rem",
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        opacity: 0.3,
      }}>
        {cert.date}
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
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return; // native horizontal scroll
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
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{ width: "32px", height: "1px", background: "rgba(255,255,255,0.25)" }} />
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.65rem",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            opacity: 0.45,
          }}>
            Certificate Gallery · Scroll →
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
          border-color: rgba(0,0,0,0.22) !important;
          background: rgba(0,0,0,0.06) !important;
          box-shadow: 0 0 22px rgba(0,0,0,0.05) !important;
        }
        .light .cert-card [style*="rgba(255,255,255,0.65)"] {
          color: rgba(0,0,0,0.55) !important;
        }
        .light .cert-fade-hint {
          background: linear-gradient(to left, var(--background, #f8f8f8) 0%, transparent 100%) !important;
        }
      `}</style>
    </section>
  );
}
