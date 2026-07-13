// Experience Section — vertical center timeline, alternating left/right cards
// Scroll-triggered reveal per card, cyan/purple accent, JetBrains Mono
// Real work experience data preserved

import { useState, useEffect, useRef } from "react";

// ── Data ──────────────────────────────────────────────────────────────────────
const EXPERIENCES = [
  {
    company: "KBZ Pay",
    role: "Software Engineer Intern",
    period: "Sep 2024 – Feb 2025",
    type: "work",
    color: "#00d4ff",
    bullets: [
      "Built QR payment system serving 5M+ users.",
      "Optimised API response time by 80% through query refactoring.",
      "Integrated MPT Ooredoo payment gateway end-to-end.",
      "Delivered features in Agile sprints with cross-functional teams.",
    ],
    stack: "Java · Spring Boot · REST API · MySQL · Git · Agile",
  },
  {
    company: "City Mart Holding (CMHL)",
    role: "Data Analyst Intern",
    period: "Apr 2025 – Jun 2025",
    type: "work",
    color: "#7c3aed",
    bullets: [
      "Built Power BI dashboards, cutting reporting time by 40%.",
      "Extracted and transformed data from SAP HANA across 200+ branches.",
      "Wrote SQL queries for business intelligence and trend analysis.",
    ],
    stack: "Power BI · SAP HANA · SQL · Excel · Python · pandas",
  },
  {
    company: "McDonald's Bristol",
    role: "Customer Service Representative",
    period: "Oct 2025 – May 2026",
    type: "work",
    color: "#febc2e",
    bullets: [
      "High-volume customer service in a fast-paced environment.",
      "Collaborated with team to maintain quality and speed standards.",
      "Developed strong communication and time-management skills.",
    ],
    stack: "Communication · Teamwork · Customer Service",
  },
  {
    company: "GUSTO College Myanmar",
    role: "IT Support",
    period: "Apr 2024 – Jun 2024",
    type: "work",
    color: "#28c840",
    bullets: [
      "Supported 500+ students and staff with technical issues.",
      "Achieved 100% issue resolution rate across all tickets.",
      "Handled network and hardware troubleshooting independently.",
    ],
    stack: "IT Support · Networking · Hardware · Troubleshooting",
  },
];

// ── useInView ─────────────────────────────────────────────────────────────────
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

// ── Node icon ─────────────────────────────────────────────────────────────────
function NodeIcon({ color }: { color: string }) {
  return (
    <div
      style={{
        width: "44px",
        height: "44px",
        borderRadius: "50%",
        background: "rgba(8,8,18,0.98)",
        border: `2px solid ${color}66`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        boxShadow: `0 0 20px ${color}22`,
        zIndex: 3,
        position: "relative",
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.85">
        <rect x="2" y="7" width="20" height="14" rx="2"/>
        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
      </svg>
    </div>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────
function TimelineCard({
  exp,
  side,
  delay,
}: {
  exp: typeof EXPERIENCES[0];
  side: "left" | "right";
  delay: number;
}) {
  const { ref, inView } = useInView(0.15);
  const [hovered, setHovered] = useState(false);

  return (
    <div
      ref={ref}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView
          ? "translateX(0)"
          : side === "left"
          ? "translateX(-48px)"
          : "translateX(48px)",
        transition: `opacity 0.75s ease ${delay}s, transform 0.75s cubic-bezier(0.23,1,0.32,1) ${delay}s`,
        background: hovered ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.025)",
        border: hovered ? `1px solid ${exp.color}44` : "1px solid rgba(255,255,255,0.08)",
        borderRadius: "10px",
        padding: "1.6rem 1.8rem",
        maxWidth: "420px",
        width: "100%",
        transition2: "border-color 0.2s ease, background 0.2s ease",
        cursor: "default",
      } as React.CSSProperties}
    >
      {/* Role */}
      <div style={{ fontSize: "1.05rem", fontWeight: 700, letterSpacing: "-0.01em", marginBottom: "0.25rem" }}>
        {exp.role}
      </div>
      {/* Company */}
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.78rem", color: exp.color, marginBottom: "0.25rem", letterSpacing: "0.03em" }}>
        {exp.company}
      </div>
      {/* Period */}
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.66rem", opacity: 0.38, letterSpacing: "0.08em", marginBottom: "1.1rem" }}>
        {exp.period}
      </div>
      {/* Bullets */}
      <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "0.45rem", marginBottom: "1rem" }}>
        {exp.bullets.map((b, i) => (
          <li key={i} style={{ display: "flex", gap: "0.6rem", fontSize: "0.87rem", lineHeight: 1.65, opacity: 0.72 }}>
            <span style={{ marginTop: "0.5em", width: "5px", height: "5px", borderRadius: "50%", background: "rgba(255,255,255,0.3)", flexShrink: 0 }} />
            {b}
          </li>
        ))}
      </ul>
      {/* Stack */}
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.65rem", opacity: 0.35, letterSpacing: "0.06em", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "0.75rem" }}>
        {exp.stack}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ExperienceSection() {
  const { ref: sectionRef, inView } = useInView(0.04);

  return (
    <section
      id="work"
      ref={sectionRef}
      style={{ padding: "6rem 8vw", position: "relative", zIndex: 1 }}
    >
      {/* Section label */}
      <div style={{
        display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "3rem",
        opacity: inView ? 1 : 0, transform: inView ? "translateY(0)" : "translateY(16px)",
        transition: "opacity 0.6s ease, transform 0.6s ease",
      }}>
        <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#84cc16", flexShrink: 0, display: "inline-block" }} />
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.68rem", letterSpacing: "0.22em", textTransform: "uppercase", opacity: 0.55 }}>
          03 — Experience
        </span>
      </div>

      {/* Heading */}
      <h2 style={{
        fontSize: "clamp(2.4rem, 4.5vw, 4rem)", fontWeight: 900, lineHeight: 1.05,
        letterSpacing: "-0.03em", margin: "0 0 4.5rem",
        opacity: inView ? 1 : 0, transform: inView ? "translateY(0)" : "translateY(20px)",
        transition: "opacity 0.7s ease 0.1s, transform 0.7s ease 0.1s",
      }}>
        Work Experience
      </h2>

      {/* Timeline */}
      <div style={{ position: "relative" }} className="exp-timeline">
        {/* Center line */}
        <div style={{
          position: "absolute",
          left: "50%",
          top: 0,
          bottom: 0,
          width: "2px",
          transform: "translateX(-50%)",
          background: "linear-gradient(180deg, rgba(0,212,255,0.5) 0%, rgba(124,58,237,0.5) 50%, rgba(254,188,46,0.4) 80%, rgba(40,200,64,0.4) 100%)",
          zIndex: 1,
        }} />

        {EXPERIENCES.map((exp, i) => {
          const side = i % 2 === 0 ? "left" : "right";
          return (
            <div
              key={i}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 60px 1fr",
                alignItems: "center",
                gap: "0 1.5rem",
                marginBottom: i < EXPERIENCES.length - 1 ? "4rem" : 0,
                position: "relative",
                zIndex: 2,
              }}
            >
              {/* Left slot */}
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                {side === "left" ? (
                  <TimelineCard exp={exp} side="left" delay={i * 0.08} />
                ) : <div />}
              </div>

              {/* Center node */}
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                <NodeIcon color={exp.color} />
              </div>

              {/* Right slot */}
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                {side === "right" ? (
                  <TimelineCard exp={exp} side="right" delay={i * 0.08} />
                ) : <div />}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile: single column */}
      <style>{`
        @media (max-width: 768px) {
          .exp-timeline > div {
            grid-template-columns: 40px 1fr !important;
            gap: 0 1rem !important;
          }
          .exp-timeline > div > div:first-child {
            display: none !important;
          }
          .exp-timeline > div > div:last-child {
            display: flex !important;
            justify-content: flex-start !important;
          }
          .exp-timeline > div > div:nth-child(2) {
            justify-content: flex-start !important;
          }
        }
      `}</style>
    </section>
  );
}
