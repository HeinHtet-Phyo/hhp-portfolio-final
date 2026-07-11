// About Section — Motionfolio-inspired layout
// Large photo left with offset border, bio + quick facts right
// Scroll-triggered fade-in, no achievements section
import { useEffect, useRef, useState } from "react";

const QUICK_FACTS = [
  { label: "Based in", value: "London, UK" },
  { label: "University", value: "UWE Bristol" },
  { label: "Degree", value: "BSc Data Science & AI" },
  { label: "Status", value: "Open to work 🚀" },
];

function useInView(threshold = 0.12) {
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
  const { ref: sectionRef, inView } = useInView(0.08);

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
          transform: inView ? "translateY(0)" : "translateY(20px)",
          transition: "opacity 0.6s ease, transform 0.6s ease",
          marginBottom: "3.5rem",
        }}
      >
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.72rem",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "#4ade80",
            opacity: 0.85,
          }}
        >
          01 / About
        </span>
      </div>

      {/* Main two-column layout */}
      <div
        className="about-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1.15fr",
          gap: "6vw",
          alignItems: "start",
        }}
      >
        {/* LEFT — Photo */}
        <div
          style={{
            opacity: inView ? 1 : 0,
            transform: inView ? "translateX(0)" : "translateX(-50px)",
            transition: "opacity 0.9s ease 0.1s, transform 0.9s ease 0.1s",
            position: "relative",
          }}
        >
          {/* Decorative offset border */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              border: "1px solid rgba(74,222,128,0.3)",
              borderRadius: "3px",
              transform: "translate(14px, 14px)",
              zIndex: 0,
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "relative",
              zIndex: 1,
              overflow: "hidden",
              borderRadius: "3px",
              aspectRatio: "3/4",
              maxHeight: "600px",
            }}
          >
            <img
              src="/manus-storage/hein-photo_e7519650.jpg"
              alt="Hein Htet Phyo at Tower Bridge, London"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "center 15%",
                display: "block",
              }}
            />
            {/* Bottom gradient */}
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: "40%",
                background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)",
              }}
            />
            {/* Location tag */}
            <div
              style={{
                position: "absolute",
                bottom: "1.4rem",
                left: "1.4rem",
                display: "flex",
                alignItems: "center",
                gap: "0.45rem",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "0.70rem",
                color: "rgba(255,255,255,0.88)",
                letterSpacing: "0.04em",
              }}
            >
              <span>📍</span>
              Tower Bridge, London
            </div>
          </div>
        </div>

        {/* RIGHT — Bio + Facts */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "2.5rem",
            opacity: inView ? 1 : 0,
            transform: inView ? "translateX(0)" : "translateX(50px)",
            transition: "opacity 0.9s ease 0.25s, transform 0.9s ease 0.25s",
          }}
        >
          {/* Heading */}
          <div>
            <h2
              style={{
                fontSize: "clamp(3rem, 5.5vw, 5rem)",
                fontWeight: 900,
                lineHeight: 1.0,
                letterSpacing: "-0.03em",
                margin: 0,
                fontFamily: "'Space Grotesk', sans-serif",
              }}
            >
              <span style={{ display: "block" }}>Who I</span>
              <span
                style={{
                  display: "block",
                  WebkitTextStroke: "2px currentColor",
                  color: "transparent",
                }}
              >
                Am.
              </span>
            </h2>
          </div>

          {/* Bio */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
            <p
              style={{
                fontSize: "1.05rem",
                lineHeight: 1.78,
                opacity: 0.88,
                margin: 0,
                fontWeight: 400,
              }}
            >
              I'm <strong>Hein Htet Phyo</strong>, a Data Science & AI student at UWE Bristol
              with a genuine passion for building intelligent systems that solve real problems.
              I thrive at the intersection of machine learning, software engineering, and data.
            </p>
            <p
              style={{
                fontSize: "1.05rem",
                lineHeight: 1.78,
                opacity: 0.65,
                margin: 0,
                fontWeight: 400,
              }}
            >
              Whether it's training deep learning models, building full-stack applications,
              or diving into data pipelines — I love turning complex ideas into clean,
              working solutions. Currently based in London and actively seeking full-time
              roles in AI, Data Science, and Software Engineering.
            </p>
          </div>

          {/* Quick facts grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0",
              borderTop: "1px solid rgba(255,255,255,0.1)",
              borderLeft: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            {QUICK_FACTS.map((fact, i) => (
              <div
                key={i}
                style={{
                  padding: "1.1rem 1.3rem",
                  borderRight: "1px solid rgba(255,255,255,0.1)",
                  borderBottom: "1px solid rgba(255,255,255,0.1)",
                  opacity: inView ? 1 : 0,
                  transform: inView ? "translateY(0)" : "translateY(12px)",
                  transition: `opacity 0.5s ease ${0.45 + i * 0.08}s, transform 0.5s ease ${0.45 + i * 0.08}s`,
                }}
              >
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "0.62rem",
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    opacity: 0.4,
                    marginBottom: "0.35rem",
                  }}
                >
                  {fact.label}
                </div>
                <div
                  style={{
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {fact.value}
                </div>
              </div>
            ))}
          </div>

          {/* Download CV */}
          <div
            style={{
              opacity: inView ? 1 : 0,
              transform: inView ? "translateY(0)" : "translateY(10px)",
              transition: "opacity 0.5s ease 0.8s, transform 0.5s ease 0.8s",
            }}
          >
            <a
              href="#"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.6rem",
                padding: "0.85rem 2rem",
                border: "1px solid rgba(255,255,255,0.22)",
                borderRadius: "2px",
                fontSize: "0.82rem",
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: "0.08em",
                textDecoration: "none",
                color: "inherit",
                transition: "border-color 0.2s ease, background 0.2s ease",
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLAnchorElement;
                el.style.borderColor = "#4ade80";
                el.style.background = "rgba(74,222,128,0.07)";
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLAnchorElement;
                el.style.borderColor = "rgba(255,255,255,0.22)";
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
          .about-grid {
            grid-template-columns: 1fr !important;
            gap: 3rem !important;
          }
        }
      `}</style>
    </section>
  );
}
