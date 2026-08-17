// ExperienceSection — matches motionfolio ProfessionalExperience design
// Two-column: left = heading + stats, right = expandable timeline cards
// Dark theme with green accents, JetBrains Mono, user's real content

import { useState, useEffect, useRef } from "react";

// ── Data ──────────────────────────────────────────────────────────────────────
const EXPERIENCES = [
  {
    company: "City Mart Holding (CMHL)",
    logo: "/work/cmhl.png",
    role: "Data Analyst Intern",
    period: "Apr 2025 – Jun 2025",
    isActive: false,
    impact: "Built Power BI dashboards cutting reporting time by 40% across 200+ branches.",
    stack: ["Power BI", "SAP HANA", "SQL", "Excel", "Python", "pandas"],
    description: [
      "Extracted and cleaned daily sales data from SAP HANA across 200+ branches.",
      "Built Power BI dashboards visualising sales performance and branch comparisons.",
      "Wrote SQL queries to analyse weekly and monthly sales trends for senior management.",
    ],
  },
  {
    company: "KBZ Pay",
    logo: "/work/kbz.png",
    role: "Software Engineer Intern",
    period: "Sep 2024 – Feb 2025",
    isActive: false,
    impact: "Built QR payment system serving 5M+ users and optimised API response time by 80%.",
    stack: ["Java", "Spring Boot", "REST API", "MySQL", "Git", "Agile"],
    description: [
      "Built QR code payment flow serving 5M+ users across Myanmar.",
      "Reduced transaction API response time from 5 seconds to 1 second through optimisation.",
      "Integrated MPT and Ooredoo telecom APIs for mobile top-up feature end-to-end.",
    ],
  },
  {
    company: "GUSTO College Myanmar",
    logo: "/work/gusto.jpeg",
    role: "IT Support",
    period: "Apr 2024 – Jun 2024",
    isActive: false,
    impact: "Supported 500+ students and staff with 100% issue resolution rate.",
    stack: ["IT Support", "Networking", "Hardware", "Troubleshooting"],
    description: [
      "Resolved hardware and software issues for 500+ students and staff with 100% resolution rate.",
      "Provided in-person and remote technical support to non-technical users.",
      "Maintained computer hardware and supported smooth day-to-day IT operations.",
    ],
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
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

// ── Icons ─────────────────────────────────────────────────────────────────────
function CalendarIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  );
}
function BuildingIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="1"/>
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
      <line x1="12" y1="12" x2="12" y2="12"/>
      <line x1="8" y1="12" x2="8" y2="12"/>
      <line x1="16" y1="12" x2="16" y2="12"/>
    </svg>
  );
}
function GearIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, delay, inView }: { label: string; value: string; delay: number; inView: boolean }) {
  return (
    <div className="exp-stat" style={{
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: "6px",
      padding: "0.9rem 1rem",
      opacity: inView ? 1 : 0,
      transform: inView ? "translateY(0)" : "translateY(16px)",
      transition: `opacity 0.6s ease ${delay}s, transform 0.6s cubic-bezier(0.23,1,0.32,1) ${delay}s`,
    }}>
      <div className="exp-dim" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.58rem", letterSpacing: "0.18em", textTransform: "uppercase", opacity: 0.4, marginBottom: "0.4rem" }}>
        {label}
      </div>
      <div className="exp-num" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "1.4rem", fontWeight: 700, letterSpacing: "-0.02em" }}>
        {value}
      </div>
    </div>
  );
}

// ── Experience Card ───────────────────────────────────────────────────────────
function ExperienceCard({ exp, index, isOpen, onToggle }: { exp: typeof EXPERIENCES[0]; index: number; isOpen: boolean; onToggle: () => void }) {
  const { ref, inView } = useInView(0.1);
  const expanded = isOpen;

  return (
    <article
      ref={ref}
      style={{
        position: "relative",
        opacity: inView ? 1 : 0,
        transform: inView ? "translateX(0)" : "translateX(32px)",
        transition: `opacity 0.65s ease ${index * 0.1}s, transform 0.65s cubic-bezier(0.23,1,0.32,1) ${index * 0.1}s`,
      }}
    >
      {/* Timeline line — full height of THIS card only. Visual continuity
          across cards comes from simple stacking (motionfolio's actual
          pattern), not a shared measurement system. */}
      <div style={{
        position: "absolute",
        left: "15px",
        top: 0,
        height: "100%",
        width: "1px",
        background: "rgba(255,255,255,0.08)",
      }} className="exp-line" />

      {/* Timeline circle */}
      <div style={{
        position: "absolute",
        left: "10px",
        top: "2rem",
        width: "11px",
        height: "11px",
        borderRadius: "50%",
        border: expanded ? "1px solid #ffffff" : "1px solid rgba(255,255,255,0.25)",
        background: expanded ? "#ffffff" : "#020008",
        transition: "border-color 0.25s, background 0.25s",
      }} className={`exp-dot${expanded ? " exp-dot-active" : ""}`} />

      {/* Content, indented to clear the line + circle on the left */}
      <div style={{ paddingLeft: "2rem" }}>
      {/* Card button */}
      <button
        onClick={onToggle}
        style={{
          width: "100%",
          textAlign: "left",
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "6px",
          padding: "1.5rem 1.75rem",
          cursor: "pointer",
          color: "inherit",
          fontFamily: "inherit",
          transition: "border-color 0.25s, background 0.25s, box-shadow 0.25s",
        }}
        className="exp-card-btn"
        onMouseEnter={e => {
          const lit = document.documentElement.classList.contains("light");
          (e.currentTarget as HTMLButtonElement).style.borderColor = lit ? "rgba(0,0,0,0.3)" : "rgba(255,255,255,0.2)";
          (e.currentTarget as HTMLButtonElement).style.boxShadow = lit ? "0 8px 24px rgba(0,0,0,0.1)" : "0 8px 24px rgba(0,0,0,0.3)";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.08)";
          (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Date + Active badge */}
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
              <span className="exp-chip" style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "0.65rem",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.45)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "2px",
                padding: "0.2rem 0.55rem",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
              }}>
                <CalendarIcon />
                {exp.period}
              </span>
              {exp.isActive && (
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.6rem",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  background: "#84cc16",
                  color: "#000",
                  borderRadius: "2px",
                  padding: "0.2rem 0.55rem",
                  fontWeight: 700,
                }}>
                  Active Now
                </span>
              )}
            </div>

            {/* Role */}
            <h3 className="exp-role" style={{
              fontSize: "clamp(1.3rem, 2.5vw, 1.9rem)",
              fontWeight: 900,
              letterSpacing: "-0.02em",
              lineHeight: 0.95,
              textTransform: "uppercase",
              marginBottom: "0.5rem",
              color: "rgba(255,255,255,0.92)",
            }}>
              {exp.role}
            </h3>

            {/* Company */}
            <p className="exp-dim" style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.68rem",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.4)",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "1rem",
            }}>
              {exp.logo && (
                <img
                  src={exp.logo}
                  alt={`${exp.company} logo`}
                  style={{ width: "1rem", height: "1rem", objectFit: "contain", borderRadius: "0", overflow: "hidden", flexShrink: 0 }}
                />
              )}
              {exp.company}
            </p>

            {/* Impact */}
            <p className="exp-dim" style={{
              fontSize: "0.9rem",
              lineHeight: 1.65,
              color: "rgba(255,255,255,0.55)",
              fontWeight: 300,
              maxWidth: "600px",
            }}>
              {exp.impact}
            </p>
          </div>

          {/* Plus/X button */}
          <div style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            border: expanded ? "1px solid rgba(255,255,255,0.8)" : "1px solid rgba(255,255,255,0.2)",
            background: expanded ? "rgba(255,255,255,0.9)" : "transparent",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            transition: "border-color 0.25s, background 0.25s, transform 0.25s",
            transform: expanded ? "rotate(45deg)" : "rotate(0deg)",
            color: expanded ? "#000" : "rgba(255,255,255,0.6)",
          }} className={`exp-toggle${expanded ? " is-open" : ""}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </div>
        </div>
      </button>

      {/* Expanded content */}
      <div style={{
        overflow: "hidden",
        maxHeight: expanded ? "500px" : "0",
        opacity: expanded ? 1 : 0,
        transition: "max-height 0.45s cubic-bezier(0.22,1,0.36,1), opacity 0.22s ease",
      }}>
        <div className="exp-panel" style={{
          marginTop: "0.5rem",
          borderRadius: "6px",
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(255,255,255,0.025)",
          padding: "1.25rem 1.75rem",
        }}>
          {/* Description bullets */}
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "0.7rem", marginBottom: "1.2rem" }}>
            {exp.description.map((point, i) => (
              <li key={i} className="exp-bullet" style={{ display: "flex", alignItems: "flex-start", gap: "0.65rem", fontSize: "0.9rem", lineHeight: 1.65, color: "rgba(255,255,255,0.55)", fontWeight: 300 }}>
                <span className="exp-bullet-dot" style={{ marginTop: "0.55em", width: "6px", height: "6px", borderRadius: "50%", background: "rgba(255,255,255,0.25)", flexShrink: 0 }} />
                {point}
              </li>
            ))}
          </ul>
          {/* Stack tags */}
          <div className="exp-rule" style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: "1rem", display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
            {exp.stack.map((item) => (
              <span key={item} className="exp-chip" style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "0.6rem",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.55)",
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.04)",
                borderRadius: "2px",
                padding: "0.2rem 0.55rem",
              }}>
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
      </div>
      </article>
  );
}

// ── Main Section ──────────────────────────────────────────────────────────────
export default function ExperienceSection() {
  const { ref, inView } = useInView(0.04);
  const activeCount = EXPERIENCES.filter(e => e.isActive).length;
  const sinceYear = Math.min(...EXPERIENCES.map(e => {
    const m = e.period.match(/\b20\d{2}\b/);
    return m ? Number(m[0]) : 9999;
  }));
  const orgCount = new Set(EXPERIENCES.map(e => e.company)).size;
  // Lifted out of each card so it can be reset externally if ever needed.
  // Accordion semantics: only one card expanded at a time (matches
  // motionfolio's expandedIndex pattern).
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section
      id="work"
      ref={ref}
      style={{
        padding: "96px 8vw 46px", marginTop: "-65px", position: "relative", zIndex: 1,
      }}
    >
    <div className="reveal">
      {/* Section label */}
      <div style={{
        display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "4.75rem",
        opacity: inView ? 1 : 0, transform: inView ? "translateY(0)" : "translateY(16px)",
        transition: "opacity 0.6s ease, transform 0.6s ease",
      }}>
        <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#84cc16", flexShrink: 0, display: "inline-block", boxShadow: "0 0 8px rgba(132,204,22,0.6)" }} />
        <span className="exp-label" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.68rem", letterSpacing: "0.22em", textTransform: "uppercase", color: "#ffffff" }}>
          04 — Work Experience
        </span>
      </div>

      {/* Two-column layout */}
      <div className="exp-layout" style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: "5rem", alignItems: "start" }}>

        {/* ── LEFT: Heading + Stats ── */}
        <div style={{ position: "sticky", top: "6rem" }}>
          {/* Heading */}
          <div style={{
            opacity: inView ? 1 : 0,
            transform: inView ? "translateY(0)" : "translateY(24px)",
            transition: "opacity 0.7s ease 0.05s, transform 0.7s cubic-bezier(0.23,1,0.32,1) 0.05s",
          }}>
            <h2 className="exp-heading" style={{
              fontSize: "clamp(2rem, 3.5vw, 2.8rem)",
              fontWeight: 900,
              letterSpacing: "-0.03em",
              lineHeight: 1,
              textTransform: "uppercase",
              marginBottom: "1.2rem",
            }}>
              Professional<br />Experience
            </h2>
            <p className="exp-dim" style={{
              fontSize: "0.88rem",
              lineHeight: 1.7,
              color: "rgba(255,255,255,0.45)",
              marginBottom: "2rem",
              fontWeight: 300,
            }}>
              Selected roles across software engineering, data analytics, and IT support. Each step builds stronger delivery habits, technical depth, and professional clarity.
            </p>
          </div>

          {/* Stats grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem", marginBottom: "2rem" }}>
            <StatCard label="Total Roles" value={String(EXPERIENCES.length).padStart(2, "0")} delay={0.15} inView={inView} />
            <StatCard label="Active Now" value={String(activeCount).padStart(2, "0")} delay={0.2} inView={inView} />
            <StatCard label="Since" value={String(sinceYear)} delay={0.25} inView={inView} />
            <StatCard label="Organizations" value={String(orgCount).padStart(2, "0")} delay={0.3} inView={inView} />
          </div>

          {/* Career timeline label */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.6rem",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            opacity: inView ? 0.4 : 0,
            transition: "opacity 0.6s ease 0.35s",
          }}>
            <GearIcon />
            Career Timeline — Expand Each Role
          </div>
        </div>

        {/* ── RIGHT: Timeline cards ── matches motionfolio's actual structure:
            no separate timeline column. Each card owns its own line+circle
            (see ExperienceCard) and cards simply stack — that's what creates
            the continuous-looking timeline. */}
        <div style={{ position: "relative" }}>
          <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {EXPERIENCES.map((exp, i) => (
              <ExperienceCard
                key={i}
                exp={exp}
                index={i}
                isOpen={openIndex === i}
                onToggle={() => setOpenIndex(openIndex === i ? null : i)}
              />
            ))}
          </div>

          {/* End of timeline */}
          <div style={{
            marginTop: "0.5rem",
            paddingLeft: "36px",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.62rem",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            opacity: 0.3,
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }} className="exp-dim">
            End of Timeline
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M7 17L17 7M17 7H7M17 7v10"/>
            </svg>
          </div>
        </div>
      </div>

      <style>{`
        /* Tablet and below: single column layout. */
        @media (max-width: 1023px) {
          .exp-layout {
            grid-template-columns: 1fr !important;
            gap: 3rem !important;
          }
          .exp-layout > div:first-child {
            position: static !important;
          }
        }
        /* Mobile: smaller cards, 44px minimum tap target on the expand toggle. */
        @media (max-width: 767px) {
          .exp-card-btn {
            padding: 1.1rem 1.25rem !important;
          }
          .exp-role {
            font-size: 0.95rem !important;
          }
          .exp-toggle {
            width: 44px !important;
            height: 44px !important;
          }
        }
        .exp-card-btn:focus {
          outline: none;
          border-color: rgba(255,255,255,0.3) !important;
        }

        /* ── Light mode ──────────────────────────────────────────────────────
           Every colour here is an inline style, so overrides need !important.
           Dark mode keeps the inline value and is untouched. */
        .light .exp-label   { color: #000000 !important; opacity: 1 !important; }
        .light .exp-heading { color: #000000 !important; }
        .light .exp-num     { color: #000000 !important; }
        .light .exp-dim     { color: rgba(0,0,0,0.5) !important; opacity: 1 !important; }
        .light .exp-stat    { border-color: rgba(0,0,0,0.15) !important; }

        .light .exp-role    { color: #000000 !important; font-weight: 600 !important; }
        .light .exp-dot            { background: #ffffff !important; border-color: rgba(0,0,0,0.4) !important; }
        .light .exp-dot-active     { background: #000000 !important; border-color: #000000 !important; }
        .light .exp-line    { background: rgba(0,0,0,0.2) !important; }

        .light .exp-card-btn {
          background: rgba(255,255,255,0.5) !important;
          border-color: rgba(0,0,0,0.15) !important;
        }
        .light .exp-card-btn:focus { border-color: rgba(0,0,0,0.4) !important; }

        .light .exp-panel {
          background: rgba(255,255,255,0.7) !important;
          border-color: rgba(0,0,0,0.15) !important;
        }
        .light .exp-bullet     { color: #111111 !important; }
        .light .exp-bullet-dot { background: rgba(0,0,0,0.4) !important; }
        .light .exp-rule       { border-top-color: rgba(0,0,0,0.12) !important; }
        .light .exp-chip {
          color: rgba(0,0,0,0.6) !important;
          border-color: rgba(0,0,0,0.15) !important;
          background: rgba(0,0,0,0.04) !important;
        }

        /* Toggle: closed is an outline, open inverts to a filled disc. */
        .light .exp-toggle {
          color: #000000 !important;
          border-color: rgba(0,0,0,0.15) !important;
          background: rgba(0,0,0,0.08) !important;
        }
        .light .exp-toggle.is-open {
          background: #000000 !important;
          border-color: #000000 !important;
          color: #ffffff !important;
        }
      `}</style>
    </div>
    </section>
  );
}
