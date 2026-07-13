// EducationSection — triangular connected layout
// Lines: two diagonals only (no horizontal), each touching the top-center of a bottom card
// and the bottom-center of the apex card. Dots sit at those connection points.
// Gold badge only for "FIRST CLASS HONOURS" — all title text stays white.

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
      {/* Badge — gold only for apex */}
      <div style={{
        display: "inline-block",
        padding: "0.25rem 0.65rem",
        border: gold ? "1px solid rgba(212,175,55,0.6)" : "1px solid rgba(255,255,255,0.25)",
        borderRadius: "999px",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "0.58rem",
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        // ONLY the badge text is gold — title stays white (inherited)
        color: gold ? "rgba(212,175,55,0.95)" : "inherit",
        background: gold ? "rgba(212,175,55,0.08)" : "transparent",
        opacity: gold ? 1 : 0.7,
        marginBottom: "0.9rem",
        boxShadow: gold ? "0 0 10px rgba(212,175,55,0.15)" : "none",
      }}>{badge}</div>

      {/* Institution title — always white */}
      <div style={{
        fontWeight: 700,
        fontSize: apex ? "1.05rem" : "0.95rem",
        letterSpacing: "-0.01em",
        marginBottom: "0.3rem",
        lineHeight: 1.3,
        color: "inherit", // white in dark, dark in light — never gold
      }}>
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

  const wrapRef = useRef<HTMLDivElement>(null);
  const apexRef = useRef<HTMLDivElement | null>(null);
  const blRef = useRef<HTMLDivElement | null>(null);
  const brRef = useRef<HTMLDivElement | null>(null);

  // SVG geometry: two diagonals only
  // apexDot = bottom-center of apex card
  // blDot   = top-center of bottom-left card
  // brDot   = top-center of bottom-right card
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

    // Apex dot: bottom-center of apex card (in wrapper-local coords)
    const apexX = aRect.left - wRect.left + aRect.width / 2;
    const apexY = aRect.bottom - wRect.top; // exactly at card bottom edge

    // BL dot: top-center of bottom-left card
    const blX = blRect.left - wRect.left + blRect.width / 2;
    const blY = blRect.top - wRect.top; // exactly at card top edge

    // BR dot: top-center of bottom-right card
    const brX = brRect.left - wRect.left + brRect.width / 2;
    const brY = brRect.top - wRect.top;

    setGeo({ svgW, svgH, apexX, apexY, blX, blY, brX, brY });
  }, []);

  useEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (wrapRef.current) ro.observe(wrapRef.current);
    window.addEventListener("resize", measure);
    return () => { ro.disconnect(); window.removeEventListener("resize", measure); };
  }, [measure]);

  // Re-measure after cards animate in (they shift position during animation)
  useEffect(() => {
    if (inView) {
      const t1 = setTimeout(measure, 400);
      const t2 = setTimeout(measure, 900);
      return () => { clearTimeout(t1); clearTimeout(t2); };
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

      {/* Triangle layout wrapper — equilateral proportions: bottom gap ≈ vertical height */}
      <div
        ref={wrapRef}
        style={{ position: "relative", maxWidth: "760px", margin: "0 auto", paddingBottom: "1rem" }}
        className="edu-triangle-wrap"
      >
        {/* SVG overlay — z-index 1, behind cards (z-index 2) */}
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
              zIndex: 1, // behind cards
              overflow: "visible",
            }}
          >
            <defs>
              <filter id="edu-glow-w" x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur stdDeviation="2.5" result="blur"/>
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
              <filter id="edu-glow-g" x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur stdDeviation="2.5" result="blur"/>
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </defs>

            {/* Left diagonal: apexDot → blDot */}
            <line
              x1={geo.apexX} y1={geo.apexY}
              x2={geo.blX} y2={geo.blY}
              stroke="rgba(255,255,255,0.22)" strokeWidth="1.2" strokeDasharray="7 5"
              style={{ opacity: inView ? 1 : 0, transition: "opacity 0.7s ease 0.5s" }}
            />
            {/* Right diagonal: apexDot → brDot */}
            <line
              x1={geo.apexX} y1={geo.apexY}
              x2={geo.brX} y2={geo.brY}
              stroke="rgba(255,255,255,0.22)" strokeWidth="1.2" strokeDasharray="7 5"
              style={{ opacity: inView ? 1 : 0, transition: "opacity 0.7s ease 0.65s" }}
            />

            {/* Apex dot — gold, at bottom-center of apex card */}
            <circle cx={geo.apexX} cy={geo.apexY} r="5" fill="rgba(212,175,55,0.9)" filter="url(#edu-glow-g)"
              style={{ opacity: inView ? 1 : 0, transition: "opacity 0.5s ease 0.9s" }}
            />
            <circle cx={geo.apexX} cy={geo.apexY} r="11" fill="none" stroke="rgba(212,175,55,0.2)" strokeWidth="1"
              style={{ opacity: inView ? 1 : 0, transition: "opacity 0.5s ease 0.9s" }}
            />

            {/* BL dot — white, at top-center of left card */}
            <circle cx={geo.blX} cy={geo.blY} r="4.5" fill="rgba(255,255,255,0.75)" filter="url(#edu-glow-w)"
              style={{ opacity: inView ? 1 : 0, transition: "opacity 0.5s ease 0.45s" }}
            />
            <circle cx={geo.blX} cy={geo.blY} r="10" fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="1"
              style={{ opacity: inView ? 1 : 0, transition: "opacity 0.5s ease 0.45s" }}
            />

            {/* BR dot — white, at top-center of right card */}
            <circle cx={geo.brX} cy={geo.brY} r="4.5" fill="rgba(255,255,255,0.75)" filter="url(#edu-glow-w)"
              style={{ opacity: inView ? 1 : 0, transition: "opacity 0.5s ease 0.6s" }}
            />
            <circle cx={geo.brX} cy={geo.brY} r="10" fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="1"
              style={{ opacity: inView ? 1 : 0, transition: "opacity 0.5s ease 0.6s" }}
            />
          </svg>
        )}

        {/* Apex row — UWE Bristol */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "5rem", position: "relative", zIndex: 2 }}>
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

        {/* Bottom row — cards centered with fixed gap to form equilateral triangle */}
        <div
          style={{ display: "flex", justifyContent: "center", gap: "3.5rem", position: "relative", zIndex: 2 }}
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
