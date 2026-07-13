// EducationSection — triangular connected layout
// B&W deep space theme, JetBrains Mono, scroll-triggered animations
// Foundation (bottom-left) → HND (bottom-right) → UWE Bristol (top/apex)

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

function EduCard({
  badge, institution, degree, period, location, inView, delay, apex,
}: {
  badge: string; institution: string; degree: string; period: string;
  location: string; inView: boolean; delay: number; apex?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.025)",
        border: hovered ? "1px solid rgba(255,255,255,0.28)" : "1px solid rgba(255,255,255,0.1)",
        borderRadius: "12px",
        padding: apex ? "1.8rem 2rem" : "1.5rem 1.7rem",
        maxWidth: apex ? "340px" : "300px",
        width: "100%",
        boxShadow: hovered ? "0 0 24px rgba(255,255,255,0.06)" : "none",
        transition: "border-color 0.25s, background 0.25s, box-shadow 0.25s, opacity 0.75s cubic-bezier(0.23,1,0.32,1), transform 0.75s cubic-bezier(0.23,1,0.32,1)",
        transitionDelay: `0s, 0s, 0s, ${delay}s, ${delay}s`,
        opacity: inView ? 1 : 0,
        transform: inView ? "scale(1) translateY(0)" : "scale(0.92) translateY(20px)",
        position: "relative",
        zIndex: 2,
      }}
    >
      <div style={{
        display: "inline-block",
        padding: "0.25rem 0.65rem",
        border: "1px solid rgba(255,255,255,0.25)",
        borderRadius: "999px",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "0.58rem",
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        opacity: 0.7,
        marginBottom: "0.9rem",
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
}

export default function EducationSection() {
  const { ref, inView } = useInView(0.1);

  return (
    <section id="education" ref={ref} style={{ padding: "6rem 8vw", position: "relative", zIndex: 1 }}>
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

      {/* Triangle layout */}
      <div style={{ position: "relative", maxWidth: "820px", margin: "0 auto" }} className="edu-triangle-wrap">

        {/* SVG connecting lines — drawn behind cards */}
        <svg
          viewBox="0 0 820 380"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 1, overflow: "visible" }}
          preserveAspectRatio="none"
          className="edu-svg-lines"
        >
          <defs>
            <filter id="edu-glow">
              <feGaussianBlur stdDeviation="2.5" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>
          {/* Bottom line: BL → BR */}
          <line x1="18%" y1="88%" x2="82%" y2="88%"
            stroke="rgba(255,255,255,0.15)" strokeWidth="1.2" strokeDasharray="7 5"
            style={{ opacity: inView ? 1 : 0, transition: "opacity 0.7s ease 0.35s" }}
          />
          {/* Left diagonal: BL → Apex */}
          <line x1="18%" y1="88%" x2="50%" y2="6%"
            stroke="rgba(255,255,255,0.15)" strokeWidth="1.2" strokeDasharray="7 5"
            style={{ opacity: inView ? 1 : 0, transition: "opacity 0.7s ease 0.5s" }}
          />
          {/* Right diagonal: BR → Apex */}
          <line x1="82%" y1="88%" x2="50%" y2="6%"
            stroke="rgba(255,255,255,0.15)" strokeWidth="1.2" strokeDasharray="7 5"
            style={{ opacity: inView ? 1 : 0, transition: "opacity 0.7s ease 0.65s" }}
          />
          {/* Vertex dots */}
          {[
            { cx: "18%", cy: "88%", d: "0.45s" },
            { cx: "82%", cy: "88%", d: "0.6s" },
            { cx: "50%", cy: "6%", d: "0.9s" },
          ].map(({ cx, cy, d }) => (
            <g key={cx + cy}>
              <circle cx={cx} cy={cy} r="5" fill="rgba(255,255,255,0.75)" filter="url(#edu-glow)"
                style={{ opacity: inView ? 1 : 0, transition: `opacity 0.5s ease ${d}` }}
              />
              <circle cx={cx} cy={cy} r="11" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1"
                style={{ opacity: inView ? 1 : 0, transition: `opacity 0.5s ease ${d}` }}
              />
            </g>
          ))}
        </svg>

        {/* Apex — UWE Bristol */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "2.5rem", position: "relative", zIndex: 2 }}>
          <EduCard
            badge="First Class Honours"
            institution="UWE Bristol"
            degree="BSc Data Science & Artificial Intelligence"
            period="Sep 2023 – Jun 2026"
            location="Bristol, UK"
            inView={inView}
            delay={0.6}
            apex
          />
        </div>

        {/* Bottom row */}
        <div style={{ display: "flex", justifyContent: "space-between", gap: "2rem", position: "relative", zIndex: 2 }} className="edu-bottom-row">
          <EduCard
            badge="All Distinctions"
            institution="GUSTO College Myanmar"
            degree="Foundation Diploma in IT"
            period="Jul 2022 – Oct 2022"
            location="Yangon, Myanmar"
            inView={inView}
            delay={0.1}
          />
          <EduCard
            badge="HND Level 4–5"
            institution="GUSTO College Myanmar"
            degree="Higher National Diploma in Computing"
            period="Nov 2022 – Nov 2024"
            location="Yangon, Myanmar"
            inView={inView}
            delay={0.3}
          />
        </div>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .edu-bottom-row { flex-direction: column !important; align-items: center !important; }
          .edu-svg-lines { display: none !important; }
        }
        .light .edu-triangle-wrap [style*="rgba(255,255,255,0.025)"] {
          background: rgba(0,0,0,0.03) !important;
        }
      `}</style>
    </section>
  );
}
