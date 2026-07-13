// Skills Section — marquee auto-scrolling rows + grouped toggle view
// Deep space theme: dark bg, cyan #00d4ff accents, JetBrains Mono font
// Toggle between marquee view and categorized grid view

import { useState, useEffect, useRef } from "react";

// ── Skill data ────────────────────────────────────────────────────────────────
const DEVICON = "https://cdn.jsdelivr.net/gh/devicons/devicon/icons";

const SKILLS: Record<string, { name: string; icon: string }[]> = {
  "Frontend": [
    { name: "React", icon: `${DEVICON}/react/react-original.svg` },
    { name: "TypeScript", icon: `${DEVICON}/typescript/typescript-original.svg` },
    { name: "JavaScript", icon: `${DEVICON}/javascript/javascript-original.svg` },
    { name: "Tailwind CSS", icon: `${DEVICON}/tailwindcss/tailwindcss-original.svg` },
    { name: "HTML5", icon: `${DEVICON}/html5/html5-original.svg` },
    { name: "CSS3", icon: `${DEVICON}/css3/css3-original.svg` },
    { name: "Vite", icon: `${DEVICON}/vitejs/vitejs-original.svg` },
    { name: "Next.js", icon: `${DEVICON}/nextjs/nextjs-original.svg` },
  ],
  "AI / ML": [
    { name: "Python", icon: `${DEVICON}/python/python-original.svg` },
    { name: "PyTorch", icon: `${DEVICON}/pytorch/pytorch-original.svg` },
    { name: "TensorFlow", icon: `${DEVICON}/tensorflow/tensorflow-original.svg` },
    { name: "scikit-learn", icon: `${DEVICON}/scikitlearn/scikitlearn-original.svg` },
    { name: "Pandas", icon: `${DEVICON}/pandas/pandas-original.svg` },
    { name: "NumPy", icon: `${DEVICON}/numpy/numpy-original.svg` },
    { name: "Jupyter", icon: `${DEVICON}/jupyter/jupyter-original.svg` },
    { name: "Matplotlib", icon: `${DEVICON}/matplotlib/matplotlib-original.svg` },
  ],
  "Backend": [
    { name: "Node.js", icon: `${DEVICON}/nodejs/nodejs-original.svg` },
    { name: "FastAPI", icon: `${DEVICON}/fastapi/fastapi-original.svg` },
    { name: "Flask", icon: `${DEVICON}/flask/flask-original.svg` },
    { name: "Java", icon: `${DEVICON}/java/java-original.svg` },
    { name: "Spring Boot", icon: `${DEVICON}/spring/spring-original.svg` },
    { name: "Express.js", icon: `${DEVICON}/express/express-original.svg` },
    { name: "GraphQL", icon: `${DEVICON}/graphql/graphql-plain.svg` },
  ],
  "Databases & Tools": [
    { name: "PostgreSQL", icon: `${DEVICON}/postgresql/postgresql-original.svg` },
    { name: "MySQL", icon: `${DEVICON}/mysql/mysql-original.svg` },
    { name: "MongoDB", icon: `${DEVICON}/mongodb/mongodb-original.svg` },
    { name: "Redis", icon: `${DEVICON}/redis/redis-original.svg` },
    { name: "Docker", icon: `${DEVICON}/docker/docker-original.svg` },
    { name: "Git", icon: `${DEVICON}/git/git-original.svg` },
    { name: "GitHub", icon: `${DEVICON}/github/github-original.svg` },
    { name: "AWS", icon: `${DEVICON}/amazonwebservices/amazonwebservices-plain-wordmark.svg` },
    { name: "Linux", icon: `${DEVICON}/linux/linux-original.svg` },
    { name: "Supabase", icon: `${DEVICON}/supabase/supabase-original.svg` },
    { name: "Maven", icon: `${DEVICON}/maven/maven-original.svg` },
    { name: "Vercel", icon: `${DEVICON}/vercel/vercel-original.svg` },
  ],
};

const ALL_SKILLS = Object.values(SKILLS).flat();

// Split into N rows for marquee
function chunkIntoRows<T>(items: T[], rows: number): T[][] {
  const result: T[][] = Array.from({ length: rows }, () => []);
  items.forEach((item, i) => result[i % rows].push(item));
  return result;
}

const MARQUEE_ROWS = chunkIntoRows(ALL_SKILLS, 4);

// ── Pill ──────────────────────────────────────────────────────────────────────
function Pill({ name, icon }: { name: string; icon: string }) {
  const [hovered, setHovered] = useState(false);
  const [imgError, setImgError] = useState(false);

  return (
    <span
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.5rem",
        padding: "0.45rem 1rem",
        borderRadius: "999px",
        border: hovered
          ? "1px solid rgba(0,212,255,0.5)"
          : "1px solid rgba(255,255,255,0.13)",
        background: hovered
          ? "rgba(0,212,255,0.06)"
          : "rgba(255,255,255,0.04)",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "0.78rem",
        fontWeight: 500,
        letterSpacing: "0.02em",
        whiteSpace: "nowrap",
        cursor: "default",
        transition: "border-color 0.2s ease, background 0.2s ease",
        userSelect: "none",
        flexShrink: 0,
      }}
    >
      {!imgError ? (
        <img
          src={icon}
          alt={name}
          width={16}
          height={16}
          style={{ objectFit: "contain", flexShrink: 0 }}
          onError={() => setImgError(true)}
        />
      ) : (
        <span style={{ fontSize: "0.85rem", flexShrink: 0 }}>◆</span>
      )}
      {name}
    </span>
  );
}

// ── Marquee row ───────────────────────────────────────────────────────────────
function MarqueeRow({
  items,
  direction = "left",
  speed = 40,
}: {
  items: { name: string; icon: string }[];
  direction?: "left" | "right";
  speed?: number;
}) {
  const [paused, setPaused] = useState(false);
  const doubled = [...items, ...items, ...items];

  return (
    <div
      style={{ overflow: "hidden", width: "100%", maskImage: "linear-gradient(90deg, transparent 0%, black 8%, black 92%, transparent 100%)" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        style={{
          display: "flex",
          gap: "0.6rem",
          width: "max-content",
          animation: `hhp-marquee-${direction} ${speed}s linear infinite`,
          animationPlayState: paused ? "paused" : "running",
          paddingBottom: "2px",
        }}
      >
        {doubled.map((skill, i) => (
          <Pill key={`${skill.name}-${i}`} name={skill.name} icon={skill.icon} />
        ))}
      </div>
    </div>
  );
}

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

// ── Main ──────────────────────────────────────────────────────────────────────
export default function SkillsSection() {
  const { ref: sectionRef, inView } = useInView(0.06);
  const [grouped, setGrouped] = useState(false);
  const [transitioning, setTransitioning] = useState(false);

  function toggleView() {
    setTransitioning(true);
    setTimeout(() => {
      setGrouped(g => !g);
      setTransitioning(false);
    }, 200);
  }

  return (
    <section
      id="skills"
      ref={sectionRef}
      style={{
        minHeight: "70vh",
        padding: "6rem 8vw",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        position: "relative",
        zIndex: 1,
      }}
    >
      <style>{`
        @keyframes hhp-marquee-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
        @keyframes hhp-marquee-right {
          0% { transform: translateX(-33.333%); }
          100% { transform: translateX(0); }
        }
      `}</style>

      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "2.5rem",
          opacity: inView ? 1 : 0,
          transform: inView ? "translateY(0)" : "translateY(16px)",
          transition: "opacity 0.6s ease, transform 0.6s ease",
        }}
      >
        {/* Section label */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#84cc16", flexShrink: 0, display: "inline-block" }} />
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.68rem", letterSpacing: "0.22em", textTransform: "uppercase", opacity: 0.55 }}>
            04 — Skills
          </span>
        </div>

        {/* Toggle */}
        <button
          onClick={toggleView}
          title={grouped ? "Marquee view" : "Grouped view"}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: "38px", height: "38px", borderRadius: "8px",
            border: "1px solid rgba(255,255,255,0.18)",
            background: "rgba(255,255,255,0.04)",
            cursor: "pointer", color: "inherit",
            transition: "border-color 0.2s, background 0.2s",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,212,255,0.5)"; (e.currentTarget as HTMLElement).style.background = "rgba(0,212,255,0.07)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.18)"; (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; }}
        >
          {grouped ? (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="3" width="14" height="1.5" rx="0.75" fill="currentColor" opacity="0.8"/>
              <rect x="1" y="7.25" width="14" height="1.5" rx="0.75" fill="currentColor" opacity="0.8"/>
              <rect x="1" y="11.5" width="14" height="1.5" rx="0.75" fill="currentColor" opacity="0.8"/>
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="1" width="6" height="6" rx="1" fill="currentColor" opacity="0.8"/>
              <rect x="9" y="1" width="6" height="6" rx="1" fill="currentColor" opacity="0.8"/>
              <rect x="1" y="9" width="6" height="6" rx="1" fill="currentColor" opacity="0.8"/>
              <rect x="9" y="9" width="6" height="6" rx="1" fill="currentColor" opacity="0.8"/>
            </svg>
          )}
        </button>
      </div>

      {/* Heading */}
      <h2
        style={{
          fontSize: "clamp(2.4rem, 4.5vw, 4rem)",
          fontWeight: 900,
          lineHeight: 1.05,
          letterSpacing: "-0.03em",
          margin: "0 0 2.5rem",
          opacity: inView ? 1 : 0,
          transform: inView ? "translateY(0)" : "translateY(20px)",
          transition: "opacity 0.7s ease 0.1s, transform 0.7s ease 0.1s",
        }}
      >
        Technologies
      </h2>

      {/* Content */}
      <div
        style={{
          opacity: transitioning ? 0 : inView ? 1 : 0,
          transform: transitioning ? "scale(0.98)" : "scale(1)",
          transition: "opacity 0.2s ease, transform 0.2s ease",
        }}
      >
        {!grouped ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
            <MarqueeRow items={MARQUEE_ROWS[0]} direction="left" speed={50} />
            <MarqueeRow items={MARQUEE_ROWS[1]} direction="right" speed={62} />
            <MarqueeRow items={MARQUEE_ROWS[2]} direction="left" speed={42} />
            <MarqueeRow items={MARQUEE_ROWS[3]} direction="right" speed={55} />
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
            {Object.entries(SKILLS).map(([category, skills]) => (
              <div key={category}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.62rem", letterSpacing: "0.2em", textTransform: "uppercase", opacity: 0.4, marginBottom: "0.9rem" }}>
                  {category}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.55rem" }}>
                  {skills.map(skill => <Pill key={skill.name} name={skill.name} icon={skill.icon} />)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
