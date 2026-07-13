// EducationSection — triangular connected layout
// Uses DOM measurement (getBoundingClientRect) to position SVG lines/dots
// accurately based on actual rendered card positions.
// Gold badge for First Class Honours, B&W for others.

import { useState, useEffect, useRef, useCallback } from "react";

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

// ── Card ──────────────────────────────────────────────────────────────────────
const EduCard = ({
  badge, institution, degree, period, location, inView, delay, apex, gold, cardRef,
}: {
  badge: string; institution: string; degree: string; period: string;
  location: string; inView: boolean; delay: number; apex?: boolean; gold?: boolean;
  cardRef?: React.RefObject<HTMLDivElement | null>;
}) => {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      ref={cardRef}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.025)",
        border: hovered
          ? gold ? "1px solid rgba(212,175,55,0.55)" : "1px solid rgba(255,255,255,0.28)"
          : gold ? "1px solid rgba(212,175,55,0.3)" : "1px solid rgba(255,255,255,0.1)",
        borderRadius: "12px",
        padding: apex ? "1.8rem 2rem" : "1.5rem 1.7rem",
        maxWidth: apex ? "340px" : "300px",
        width: "100%",
        boxShadow: hovered
          ? gold ? "0 0 28px rgba(212,175,55,0.12)" : "0 0 24px rgba(255,255,255,0.06)"
          : "none",
        transition: "border-color 0.25s, background 0.25s, box-shadow 0.25s, opacity 0.75s cubic-bezier(0.23,1,0.32,1), transform 0.75s cubic-bezier(0.23,1,0.32,1)",
        transitionDelay: `0s, 0s, 0s, ${delay}s, ${delay}s`,
        opacity: inView ? 1 : 0,
        transform: inView ? "scale(1) translateY(0)" : "scale(0.92) translateY(20px)",
        position: "relative",
        zIndex: 2,
      }}
    >
      {/* Badge */}
      <div style={{
        display: "inline-block",
        padding: "0.25rem 0.65rem",
        border: gold ? "1px solid rgba(212,175,55,0.6)" : "1px solid rgba(255,255,255,0.25)",
        borderRadius: "999px",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "0.58rem",
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: gold ? "rgba(212,175,55,0.95)" : "inherit",
        background: gold ? "rgba(212,175,55,0.08)" : "transparent",
        opacity: gold ? 1 : 0.7,
        marginBottom: "0.9rem",
        boxShadow: gold ? "0 0 10px rgba(212,175,55,0.15)" : "none",
      }}>{badge}</div>

      <div style={{ fontWeight: 700, fontSize: apex ? "1.05rem" : "0.95rem", letterSpacing: "-0.01em", marginBottom: "0.3rem", lineHeight: 1.3 }}>
        {institution}
      </div>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.78rem", opacity: 0.55, marginBottom: "0.75rem", lineHeight: 1.5 }}>
        {degree}
      </div>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.62rem", letterSpacing: "0.1em", textTransform: "uppercase", opacity: 0.32, display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <span>{period}</span><span>·</span><span>{location}</span>
      </div>
    </div>
  );
};

// ── Main section ──────────────────────────────────────────────────────────────
export default function EducationSection() {
  const { ref: sectionRef, inView } = useInView(0.1);

  // Refs for the three cards and the SVG wrapper
  const wrapRef = useRef<HTMLDivElement>(null);
  const apexRef = useRef<HTMLDivElement | null>(null);
  const blRef = useRef<HTMLDivElement | null>(null);
  const brRef = useRef<HTMLDivElement | null>(null);

  // SVG geometry state — computed from DOM measurements
  const [geo, setGeo] = useState<{
    svgW: number; svgH: number;
    apexX: number; apexY: number;
    blX: number; blY: number;
    brX: number; brY: number;
  } | null>(null);

  const measure = useCallback(() => {
    const wrap = wrapRef.current;
    const apex = apexRef.current;
    const bl = blRef.current;
    const br = brRef.current;
    if (!wrap || !apex || !bl || !br) return;

    const wRect = wrap.getBoundingClientRect();
    const aRect = apex.getBoundingClientRect();
    const blRect = bl.getBoundingClientRect();
    const brRect = br.getBoundingClientRect();

    const svgW = wRect.width;
    const svgH = wRect.height;

    // Apex dot: bottom-center of apex card, in SVG local coords
    const apexX = aRect.left - wRect.left + aRect.width / 2;
    const apexY = aRect.bottom - wRect.top + 20; // 20px below card bottom

    // BL dot: right-center of left card (pointing toward apex)
    const blX = blRect.left - wRect.left - 20; // 20px left of card left edge
    const blY = blRect.top - wRect.top + blRect.height / 2;

    // BR dot: left-center of right card
    const brX = brRect.right - wRect.left + 20; // 20px right of card right edge
    const brY = brRect.top - wRect.top + brRect.height / 2;

    setGeo({ svgW, svgH, apexX, apexY, blX, blY, brX, brY });
  }, []);

  // Measure on mount, on resize, and whenever inView changes (cards may animate in)
  useEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (wrapRef.current) ro.observe(wrapRef.current);
    window.addEventListener("resize", measure);
    return () => { ro.disconnect(); window.removeEventListener("resize", measure); };
  }, [measure]);

  // Re-measure after cards animate in
  useEffect(() => {
    if (inView) {
      const t = setTimeout(measure, 800);
      return () => clearTimeout(t);
    }
  }, [inView, measure]);

  return (
    <section id="education" ref={sectionRef} style={{ padding: "6rem 8vw", position: "relative", zIndex: 1 }}>
      {/* Section label */}
      <div style={{
        display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "4rem",
        opacity: inView ? 1 : 0, transform: inView ? "translateY(0)" : "translateY(16px)",
        transition: "opacity 0.6s ease, transform 0.6s ease",
      }}>
        <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#84cc16", flexShrink: 0, display: "inline-block" }} />
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.68rem", letterSpacing: "0.22em", textTransform: "uppercase", opacity: 0.55 }}>
          02 — Education
        </span>
      </div>

      {/* Triangle layout wrapper */}
      <div
        ref={wrapRef}
        style={{
          position: "relative",
          maxWidth: "820px",
          margin: "0 auto",
          paddingBottom: "2rem",
        }}
        className="edu-triangle-wrap"
      >
        {/* SVG overlay — drawn on top of cards but pointer-events none */}
        {geo && (
          <svg
            viewBox={`0 0 ${geo.svgW} ${geo.svgH}`}
            width={geo.svgW}
            height={geo.svgH}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              pointerEvents: "none",
              zIndex: 3,
              overflow: "visible",
            }}
          >
            <defs>
              <filter id="edu-glow-w" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="blur"/>
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
              <filter id="edu-glow-g" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="blur"/>
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </defs>

            {/* Lines — connect dots only */}
            {/* Bottom: BL → BR */}
            <line
              x1={geo.blX} y1={geo.blY}
              x2={geo.brX} y2={geo.brY}
              stroke="rgba(255,255,255,0.2)" strokeWidth="1.2" strokeDasharray="7 5"
              style={{ opacity: inView ? 1 : 0, transition: "opacity 0.7s ease 0.35s" }}
            />
            {/* Left diagonal: BL → Apex */}
            <line
              x1={geo.blX} y1={geo.blY}
              x2={geo.apexX} y2={geo.apexY}
              stroke="rgba(255,255,255,0.2)" strokeWidth="1.2" strokeDasharray="7 5"
              style={{ opacity: inView ? 1 : 0, transition: "opacity 0.7s ease 0.5s" }}
            />
            {/* Right diagonal: BR → Apex */}
            <line
              x1={geo.brX} y1={geo.brY}
              x2={geo.apexX} y2={geo.apexY}
              stroke="rgba(255,255,255,0.2)" strokeWidth="1.2" strokeDasharray="7 5"
              style={{ opacity: inView ? 1 : 0, transition: "opacity 0.7s ease 0.65s" }}
            />

            {/* Apex dot — gold */}
            <circle cx={geo.apexX} cy={geo.apexY} r="6" fill="rgba(212,175,55,0.9)" filter="url(#edu-glow-g)"
              style={{ opacity: inView ? 1 : 0, transition: "opacity 0.5s ease 0.9s" }}
            />
            <circle cx={geo.apexX} cy={geo.apexY} r="13" fill="none" stroke="rgba(212,175,55,0.22)" strokeWidth="1"
              style={{ opacity: inView ? 1 : 0, transition: "opacity 0.5s ease 0.9s" }}
            />

            {/* BL dot — white */}
            <circle cx={geo.blX} cy={geo.blY} r="5" fill="rgba(255,255,255,0.75)" filter="url(#edu-glow-w)"
              style={{ opacity: inView ? 1 : 0, transition: "opacity 0.5s ease 0.45s" }}
            />
            <circle cx={geo.blX} cy={geo.blY} r="11" fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="1"
              style={{ opacity: inView ? 1 : 0, transition: "opacity 0.5s ease 0.45s" }}
            />

            {/* BR dot — white */}
            <circle cx={geo.brX} cy={geo.brY} r="5" fill="rgba(255,255,255,0.75)" filter="url(#edu-glow-w)"
              style={{ opacity: inView ? 1 : 0, transition: "opacity 0.5s ease 0.6s" }}
            />
            <circle cx={geo.brX} cy={geo.brY} r="11" fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="1"
              style={{ opacity: inView ? 1 : 0, transition: "opacity 0.5s ease 0.6s" }}
            />
          </svg>
        )}

        {/* Apex row — UWE Bristol */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "3.5rem", position: "relative", zIndex: 2 }}>
          <EduCard
            badge="First Class Honours"
            institution="UWE Bristol"
            degree="BSc Data Science & Artificial Intelligence"
            period="Sep 2023 – Jun 2026"
            location="Bristol, UK"
            inView={inView}
            delay={0.6}
            apex
            gold
            cardRef={apexRef}
          />
        </div>

        {/* Bottom row */}
        <div
          style={{ display: "flex", justifyContent: "space-between", gap: "2rem", position: "relative", zIndex: 2 }}
          className="edu-bottom-row"
        >
          <EduCard
            badge="All Distinctions"
            institution="GUSTO College Myanmar"
            degree="Foundation Diploma in IT"
            period="Jul 2022 – Oct 2022"
            location="Yangon, Myanmar"
            inView={inView}
            delay={0.1}
            cardRef={blRef}
          />
          <EduCard
            badge="HND Level 4–5"
            institution="GUSTO College Myanmar"
            degree="Higher National Diploma in Computing"
            period="Nov 2022 – Nov 2024"
            location="Yangon, Myanmar"
            inView={inView}
            delay={0.3}
            cardRef={brRef}
          />
        </div>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .edu-bottom-row { flex-direction: column !important; align-items: center !important; }
          .edu-triangle-wrap svg { display: none !important; }
        }
        .light .edu-triangle-wrap [style*="rgba(255,255,255,0.025)"] {
          background: rgba(0,0,0,0.03) !important;
        }
        .light .edu-triangle-wrap [style*="rgba(255,255,255,0.1)"] {
          border-color: rgba(0,0,0,0.12) !important;
        }
      `}</style>
    </section>
  );
}
