// About Section — Motionfolio-inspired layout
// Grayscale photo → full color on hover, corner brackets, name tag
// Status/location cards below photo, bio + skill tags on right
// Black & white only (no green accents in this section)
import { useState, useEffect, useRef } from "react";

const SKILL_TAGS = [
  "MACHINE LEARNING",
  "DATA SCIENCE",
  "AI ENGINEERING",
  "FULL-STACK DEV",
  "DEEP LEARNING",
  "DATA ENGINEERING",
];

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

export default function AboutSection() {
  const { ref: sectionRef, inView } = useInView(0.06);
  const [photoHovered, setPhotoHovered] = useState(false);

  return (
    <section
      id="about"
      ref={sectionRef}
      style={{
        minHeight: "100vh",
        padding: "8rem 8vw",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        position: "relative",
        zIndex: 1,
      }}
    >
      {/* Section label */}
      <div
        style={{
          opacity: inView ? 1 : 0,
          transform: inView ? "translateY(0)" : "translateY(16px)",
          transition: "opacity 0.6s ease, transform 0.6s ease",
          marginBottom: "3rem",
        }}
      >
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.70rem",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            opacity: 0.4,
          }}
        >
          01 / About
        </span>
      </div>

      {/* Main layout — left photo col, right bio col */}
      <div
        className="about-main-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1.2fr",
          gap: "5vw",
          alignItems: "start",
        }}
      >
        {/* ── LEFT COLUMN ── */}
        <div
          style={{
            opacity: inView ? 1 : 0,
            transform: inView ? "translateX(0)" : "translateX(-40px)",
            transition: "opacity 0.8s ease 0.1s, transform 0.8s ease 0.1s",
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
          }}
        >
          {/* Photo with corner brackets */}
          <div
            style={{ position: "relative", cursor: "pointer" }}
            onMouseEnter={() => setPhotoHovered(true)}
            onMouseLeave={() => setPhotoHovered(false)}
          >
            {/* Corner brackets */}
            {[
              { top: "10px", left: "10px", borderTop: "2px solid currentColor", borderLeft: "2px solid currentColor" },
              { top: "10px", right: "10px", borderTop: "2px solid currentColor", borderRight: "2px solid currentColor" },
              { bottom: "10px", left: "10px", borderBottom: "2px solid currentColor", borderLeft: "2px solid currentColor" },
              { bottom: "10px", right: "10px", borderBottom: "2px solid currentColor", borderRight: "2px solid currentColor" },
            ].map((style, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  width: "22px",
                  height: "22px",
                  zIndex: 3,
                  opacity: 0.6,
                  ...style,
                }}
              />
            ))}

            {/* Photo */}
            <div
              style={{
                overflow: "hidden",
                borderRadius: "6px",
                aspectRatio: "4/5",
                maxHeight: "560px",
                position: "relative",
              }}
            >
              <img
                src="/manus-storage/hein-photo_e7519650.jpg"
                alt="Hein Htet Phyo"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: "center 15%",
                  display: "block",
                  filter: photoHovered ? "grayscale(0%)" : "grayscale(100%)",
                  transition: "filter 0.6s ease",
                }}
              />
              {/* Bottom gradient */}
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: "45%",
                  background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)",
                  pointerEvents: "none",
                }}
              />
              {/* Name tag */}
              <div
                style={{
                  position: "absolute",
                  bottom: "1.2rem",
                  left: "1.2rem",
                  zIndex: 2,
                }}
              >
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "0.58rem",
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.5)",
                    marginBottom: "0.25rem",
                  }}
                >
                  NAME
                </div>
                <div
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: 700,
                    color: "#fff",
                    letterSpacing: "-0.01em",
                  }}
                >
                  Hein Htet Phyo
                </div>
              </div>
            </div>
          </div>

          {/* Status + Location cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
            {[
              {
                label: "STATUS",
                content: (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#22c55e", display: "inline-block", flexShrink: 0 }} />
                    <span style={{ fontSize: "0.88rem", fontWeight: 600 }}>Available</span>
                  </div>
                ),
              },
              {
                label: "LOCATION",
                content: (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <span style={{ fontSize: "0.85rem" }}>📍</span>
                    <span style={{ fontSize: "0.88rem", fontWeight: 600 }}>London, UK</span>
                  </div>
                ),
              },
            ].map((card, i) => (
              <div
                key={i}
                style={{
                  padding: "0.9rem 1rem",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: "6px",
                  background: "rgba(255,255,255,0.03)",
                  opacity: inView ? 1 : 0,
                  transform: inView ? "translateY(0)" : "translateY(8px)",
                  transition: `opacity 0.5s ease ${0.4 + i * 0.1}s, transform 0.5s ease ${0.4 + i * 0.1}s`,
                }}
              >
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "0.58rem",
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    opacity: 0.4,
                    marginBottom: "0.45rem",
                  }}
                >
                  {card.label}
                </div>
                {card.content}
              </div>
            ))}
          </div>

          {/* Three keyword blocks */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.6rem" }}>
            {[
              { bold: "BUILD", sub: "HANDS-ON\nAPPROACH" },
              { bold: "AI+DATA", sub: "CORE\nFOCUS" },
              { bold: "OPEN", sub: "TO\nCOLLAB" },
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  padding: "0.85rem 0.8rem",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: "6px",
                  background: "rgba(255,255,255,0.03)",
                  textAlign: "center",
                  opacity: inView ? 1 : 0,
                  transform: inView ? "translateY(0)" : "translateY(8px)",
                  transition: `opacity 0.5s ease ${0.55 + i * 0.08}s, transform 0.5s ease ${0.55 + i * 0.08}s`,
                }}
              >
                <div
                  style={{
                    fontSize: "1rem",
                    fontWeight: 900,
                    letterSpacing: "-0.02em",
                    lineHeight: 1,
                    marginBottom: "0.35rem",
                  }}
                >
                  {item.bold}
                </div>
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "0.55rem",
                    letterSpacing: "0.1em",
                    opacity: 0.4,
                    lineHeight: 1.5,
                    whiteSpace: "pre",
                  }}
                >
                  {item.sub}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "2.2rem",
            opacity: inView ? 1 : 0,
            transform: inView ? "translateX(0)" : "translateX(40px)",
            transition: "opacity 0.8s ease 0.25s, transform 0.8s ease 0.25s",
            paddingTop: "0.5rem",
          }}
        >
          {/* Big heading */}
          <div>
            <h2
              style={{
                fontSize: "clamp(2.8rem, 5vw, 4.8rem)",
                fontWeight: 900,
                lineHeight: 1.05,
                letterSpacing: "-0.03em",
                margin: 0,
              }}
            >
              Data Scientist
            </h2>
            <h3
              style={{
                fontSize: "clamp(1.6rem, 3vw, 2.8rem)",
                fontWeight: 700,
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
                margin: "0.2rem 0 0",
                opacity: 0.55,
              }}
            >
              with ML & AI Engineering
            </h3>
          </div>

          {/* Specialty tags row */}
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              flexWrap: "wrap",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.65rem",
              letterSpacing: "0.12em",
              opacity: 0.45,
            }}
          >
            {["MACHINE LEARNING", "AI SYSTEMS", "FULL-STACK DEV"].map((t, i) => (
              <span key={i}>
                {t}{i < 2 ? " · " : ""}
              </span>
            ))}
          </div>

          {/* Bio */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <p style={{ fontSize: "1.05rem", lineHeight: 1.78, opacity: 0.85, margin: 0 }}>
              I'm <strong>Hein Htet Phyo</strong>, a Data Science & AI student at UWE Bristol
              with a genuine passion for building intelligent systems that solve real problems.
              I thrive at the intersection of machine learning, software engineering, and data.
            </p>
            <p style={{ fontSize: "1.05rem", lineHeight: 1.78, opacity: 0.6, margin: 0 }}>
              Whether it's training deep learning models, building full-stack applications,
              or diving into data pipelines — I love turning complex ideas into clean,
              working solutions. Currently based in London and actively seeking full-time
              roles in AI, Data Science, and Software Engineering.
            </p>
          </div>

          {/* Core focus skill tags */}
          <div>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "0.62rem",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                opacity: 0.4,
                marginBottom: "0.9rem",
              }}
            >
              Core Focus & Skills
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {SKILL_TAGS.map((tag, i) => (
                <span
                  key={i}
                  style={{
                    padding: "0.45rem 0.9rem",
                    border: "1px solid rgba(255,255,255,0.2)",
                    borderRadius: "3px",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    opacity: inView ? 1 : 0,
                    transform: inView ? "translateY(0)" : "translateY(8px)",
                    transition: `opacity 0.4s ease ${0.6 + i * 0.06}s, transform 0.4s ease ${0.6 + i * 0.06}s`,
                    cursor: "default",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Download CV */}
          <div>
            <a
              href="#"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.6rem",
                padding: "0.85rem 2rem",
                border: "1px solid rgba(255,255,255,0.25)",
                borderRadius: "3px",
                fontSize: "0.82rem",
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: "0.08em",
                textDecoration: "none",
                color: "inherit",
                transition: "border-color 0.2s ease, background 0.2s ease",
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLAnchorElement;
                el.style.borderColor = "rgba(255,255,255,0.7)";
                el.style.background = "rgba(255,255,255,0.06)";
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLAnchorElement;
                el.style.borderColor = "rgba(255,255,255,0.25)";
                el.style.background = "transparent";
              }}
            >
              <span>↓</span>
              <span>Download CV</span>
            </a>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .about-main-grid {
            grid-template-columns: 1fr !important;
            gap: 3rem !important;
          }
        }
      `}</style>
    </section>
  );
}
