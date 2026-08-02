// EducationSection — W/V zigzag shape
// UWE Bristol (top-left) → GUSTO Foundation (bottom-centre) → GUSTO HND (top-right)
// Connected by a V-shaped dashed line

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

const EduCard = ({
  badge, institution, degree, period, location, inView, delay, gold, cardRef,
}: {
  badge: string; institution: string; degree: string; period: string;
  location: string; inView: boolean; delay: number; gold?: boolean;
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
        padding: "1.5rem 1.7rem",
        width: "100%",
        maxWidth: "280px",
        minHeight: "200px",
        boxShadow: hovered
          ? gold ? "0 0 28px rgba(212,175,55,0.12)" : "0 0 24px rgba(255,255,255,0.06)"
          : "none",
        transition: "border-color 0.25s, background 0.25s, box-shadow 0.25s, opacity 0.75s cubic-bezier(0.23,1,0.32,1), transform 0.75s cubic-bezier(0.23,1,0.32,1)",
        transitionDelay: `0s, 0s, 0s, ${delay}s, ${delay}s`,
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(20px)",
        position: "relative",
        zIndex: 2,
      }}
    >
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
        marginBottom: "0.85rem",
        boxShadow: gold ? "0 0 10px rgba(212,175,55,0.15)" : "none",
      }}>{badge}</div>

      <div style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: "0.3rem", lineHeight: 1.3 }}>
        {institution}
      </div>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.76rem", opacity: 0.55, marginBottom: "0.7rem", lineHeight: 1.5 }}>
        {degree}
      </div>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", opacity: 0.32, display: "flex", flexDirection: "column", gap: "0.2rem" }}>
        <span>{period}</span>
        <span>{location}</span>
      </div>
    </div>
  );
};

export default function EducationSection() {
  const { ref: sectionRef, inView } = useInView(0.1);

  const wrapRef = useRef<HTMLDivElement>(null);
  const tlRef = useRef<HTMLDivElement | null>(null); // top-left (UWE)
  const bcRef = useRef<HTMLDivElement | null>(null); // bottom-centre (GUSTO Foundation)
  const trRef = useRef<HTMLDivElement | null>(null); // top-right (GUSTO HND)

  const [geo, setGeo] = useState<{
    svgW: number; svgH: number;
    tlX: number; tlY: number;
    bcX: number; bcY: number;
    trX: number; trY: number;
  } | null>(null);

  const measure = useCallback(() => {
    const wrap = wrapRef.current;
    const tl = tlRef.current;
    const bc = bcRef.current;
    const tr = trRef.current;
    if (!wrap || !tl || !bc || !tr) return;

    const wRect = wrap.getBoundingClientRect();
    const tlRect = tl.getBoundingClientRect();
    const bcRect = bc.getBoundingClientRect();
    const trRect = tr.getBoundingClientRect();

    const svgW = wRect.width;
    const svgH = wRect.height;

    // TL: bottom-right corner of top-left card + 30px gap below
    const tlX = tlRect.right - wRect.left - 10;
    const tlY = tlRect.bottom - wRect.top + 30;

    // BC: top-centre of bottom-centre card - 30px gap above
    const bcX = bcRect.left - wRect.left + bcRect.width / 2;
    const bcY = bcRect.top - wRect.top - 30;

    // TR: bottom-left corner of top-right card + 30px gap below
    const trX = trRect.left - wRect.left + 10;
    const trY = trRect.bottom - wRect.top + 30;

    setGeo({ svgW, svgH, tlX, tlY, bcX, bcY, trX, trY });
  }, []);

  useEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (wrapRef.current) ro.observe(wrapRef.current);
    window.addEventListener("resize", measure);
    return () => { ro.disconnect(); window.removeEventListener("resize", measure); };
  }, [measure]);

  useEffect(() => {
    if (inView) {
      const t1 = setTimeout(measure, 400);
      const t2 = setTimeout(measure, 900);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [inView, measure]);

  return (
    <section id="education" ref={sectionRef} style={{ padding: "6rem 8vw", position: "relative", zIndex: 1 }}>
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

      <div ref={wrapRef} style={{ position: "relative", maxWidth: "860px", margin: "0 auto", minHeight: "420px" }}>

        {/* SVG V-shape lines */}
        {geo && (
          <svg
            viewBox={`0 0 ${geo.svgW} ${geo.svgH}`}
            width={geo.svgW}
            height={geo.svgH}
            style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none", zIndex: 1, overflow: "visible" }}
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

            {/* Left leg: TL → BC */}
            <line x1={geo.tlX} y1={geo.tlY} x2={geo.bcX} y2={geo.bcY}
              stroke="rgba(255,255,255,0.25)" strokeWidth="1.2" strokeDasharray="7 5"
              style={{ opacity: inView ? 1 : 0, transition: "opacity 0.7s ease 0.5s" }} />

            {/* Right leg: BC → TR */}
            <line x1={geo.bcX} y1={geo.bcY} x2={geo.trX} y2={geo.trY}
              stroke="rgba(255,255,255,0.25)" strokeWidth="1.2" strokeDasharray="7 5"
              style={{ opacity: inView ? 1 : 0, transition: "opacity 0.7s ease 0.65s" }} />

            {/* TL dot — gold */}
            <circle cx={geo.tlX} cy={geo.tlY} r="5" fill="rgba(212,175,55,0.9)" filter="url(#edu-glow-g)"
              style={{ opacity: inView ? 1 : 0, transition: "opacity 0.5s ease 0.4s" }} />
            <circle cx={geo.tlX} cy={geo.tlY} r="11" fill="none" stroke="rgba(212,175,55,0.2)" strokeWidth="1"
              style={{ opacity: inView ? 1 : 0, transition: "opacity 0.5s ease 0.4s" }} />

            {/* BC dot — white */}
            <circle cx={geo.bcX} cy={geo.bcY} r="4.5" fill="rgba(255,255,255,0.75)" filter="url(#edu-glow-w)"
              style={{ opacity: inView ? 1 : 0, transition: "opacity 0.5s ease 0.75s" }} />
            <circle cx={geo.bcX} cy={geo.bcY} r="10" fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="1"
              style={{ opacity: inView ? 1 : 0, transition: "opacity 0.5s ease 0.75s" }} />

            {/* TR dot — white */}
            <circle cx={geo.trX} cy={geo.trY} r="4.5" fill="rgba(255,255,255,0.75)" filter="url(#edu-glow-w)"
              style={{ opacity: inView ? 1 : 0, transition: "opacity 0.5s ease 0.9s" }} />
            <circle cx={geo.trX} cy={geo.trY} r="10" fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="1"
              style={{ opacity: inView ? 1 : 0, transition: "opacity 0.5s ease 0.9s" }} />
          </svg>
        )}

        {/* Top row: UWE (left) + GUSTO HND (right) */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "10rem", position: "relative", zIndex: 2 }}>
          <EduCard
            badge="First Class Honours"
            institution="UWE Bristol"
            degree="BSc Data Science & Artificial Intelligence"
            period="Sep 2023 – Jun 2026"
            location="Bristol, UK"
            inView={inView}
            delay={0.1}
            gold
            cardRef={tlRef}
          />
          <EduCard
            badge="HND Level 4–5"
            institution="GUSTO College Myanmar"
            degree="Higher National Diploma in Computing"
            period="Nov 2022 – Nov 2024"
            location="Yangon, Myanmar"
            inView={inView}
            delay={0.3}
            cardRef={trRef}
          />
        </div>

        {/* Bottom centre: GUSTO Foundation */}
        <div style={{ display: "flex", justifyContent: "center", position: "relative", zIndex: 2 }}>
          <EduCard
            badge="All Distinctions"
            institution="GUSTO College Myanmar"
            degree="Foundation Diploma in IT"
            period="Jul 2022 – Oct 2022"
            location="Yangon, Myanmar"
            inView={inView}
            delay={0.5}
            cardRef={bcRef}
          />
        </div>
      </div>

      <style>{`
        @media (max-width: 640px) {
          #education > div > div { flex-direction: column !important; }
        }
      `}</style>
    </section>
  );
}
