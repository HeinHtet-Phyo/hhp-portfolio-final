// Dark Space Theme — Skills Section
// Real devicon logos, skill progress bars, infinite marquee
import { useEffect, useRef } from "react";

const DEVICON_BASE = "https://cdn.jsdelivr.net/gh/devicons/devicon/icons";

const SKILL_GROUPS = [
  {
    label: "Programming",
    color: "#00d4ff",
    skills: [
      { name: "Python", icon: `${DEVICON_BASE}/python/python-original.svg`, level: 90 },
      { name: "SQL", icon: `${DEVICON_BASE}/mysql/mysql-original.svg`, level: 85 },
      { name: "Java", icon: `${DEVICON_BASE}/java/java-original.svg`, level: 70 },
      { name: "JavaScript", icon: `${DEVICON_BASE}/javascript/javascript-original.svg`, level: 65 },
      { name: "HTML/CSS", icon: `${DEVICON_BASE}/html5/html5-original.svg`, level: 70 },
    ],
  },
  {
    label: "ML & Data",
    color: "#7c3aed",
    skills: [
      { name: "Machine Learning", icon: `${DEVICON_BASE}/python/python-original.svg`, level: 85 },
      { name: "Data Analysis", icon: `${DEVICON_BASE}/pandas/pandas-original.svg`, level: 90 },
      { name: "Deep Learning", icon: `${DEVICON_BASE}/tensorflow/tensorflow-original.svg`, level: 70 },
      { name: "NLP", icon: `${DEVICON_BASE}/python/python-original.svg`, level: 65 },
      { name: "Feature Eng.", icon: `${DEVICON_BASE}/numpy/numpy-original.svg`, level: 80 },
    ],
  },
  {
    label: "Tools & Frameworks",
    color: "#00ff64",
    skills: [
      { name: "pandas", icon: `${DEVICON_BASE}/pandas/pandas-original.svg`, level: 90 },
      { name: "scikit-learn", icon: `${DEVICON_BASE}/python/python-original.svg`, level: 85 },
      { name: "TensorFlow", icon: `${DEVICON_BASE}/tensorflow/tensorflow-original.svg`, level: 70 },
      { name: "Power BI", icon: `${DEVICON_BASE}/microsoftsqlserver/microsoftsqlserver-plain.svg`, level: 85 },
      { name: "Tableau", icon: `${DEVICON_BASE}/python/python-original.svg`, level: 75 },
    ],
  },
  {
    label: "Cloud & Dev",
    color: "#febc2e",
    skills: [
      { name: "Git/GitHub", icon: `${DEVICON_BASE}/git/git-original.svg`, level: 80 },
      { name: "MySQL", icon: `${DEVICON_BASE}/mysql/mysql-original.svg`, level: 80 },
      { name: "MongoDB", icon: `${DEVICON_BASE}/mongodb/mongodb-original.svg`, level: 65 },
      { name: "AWS", icon: `${DEVICON_BASE}/amazonwebservices/amazonwebservices-plain-wordmark.svg`, level: 60 },
      { name: "Agile", icon: `${DEVICON_BASE}/jira/jira-original.svg`, level: 75 },
    ],
  },
];

const ALL_TECH = [
  { name: "Python", icon: `${DEVICON_BASE}/python/python-original.svg` },
  { name: "SQL", icon: `${DEVICON_BASE}/mysql/mysql-original.svg` },
  { name: "Java", icon: `${DEVICON_BASE}/java/java-original.svg` },
  { name: "JavaScript", icon: `${DEVICON_BASE}/javascript/javascript-original.svg` },
  { name: "TensorFlow", icon: `${DEVICON_BASE}/tensorflow/tensorflow-original.svg` },
  { name: "pandas", icon: `${DEVICON_BASE}/pandas/pandas-original.svg` },
  { name: "Git", icon: `${DEVICON_BASE}/git/git-original.svg` },
  { name: "MongoDB", icon: `${DEVICON_BASE}/mongodb/mongodb-original.svg` },
  { name: "MySQL", icon: `${DEVICON_BASE}/mysql/mysql-original.svg` },
  { name: "React", icon: `${DEVICON_BASE}/react/react-original.svg` },
  { name: "NumPy", icon: `${DEVICON_BASE}/numpy/numpy-original.svg` },
  { name: "Docker", icon: `${DEVICON_BASE}/docker/docker-original.svg` },
  { name: "Linux", icon: `${DEVICON_BASE}/linux/linux-original.svg` },
  { name: "VS Code", icon: `${DEVICON_BASE}/vscode/vscode-original.svg` },
];

export default function SkillsSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.querySelectorAll<HTMLElement>(".skill-bar-fill").forEach((bar) => {
            bar.style.width = (bar.dataset.width || "0") + "%";
          });
          el.querySelectorAll<HTMLElement>(".reveal").forEach((r, i) => {
            setTimeout(() => r.classList.add("visible"), i * 80);
          });
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="skills"
      style={{
        padding: "6rem 0",
        background: "rgba(3, 5, 15, 0.95)",
        position: "relative",
        zIndex: 1,
      }}
    >
      <div ref={sectionRef}>
        <div className="container">
          <div style={{ marginBottom: "4rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <div className="section-label">05. skills</div>
                <h2 className="section-title">
                  Technical <span>Arsenal</span>
                </h2>
              </div>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "0.6rem",
                color: "rgba(0,212,255,0.25)",
                letterSpacing: "0.15em",
                textAlign: "right",
                lineHeight: 1.8,
              }}>
                <div>HHP.STACK</div>
                <div>LANG: 4 — FRAMEWORKS: 8+</div>
                <div>PROFICIENCY: HIGH</div>
              </div>
            </div>
          </div>

          {/* Skill Groups */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "2rem",
            marginBottom: "4rem",
          }}
            className="skills-grid"
          >
            {SKILL_GROUPS.map((group) => (
              <div key={group.label} className="reveal" style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.05)",
                borderRadius: "12px",
                padding: "1.75rem",
              }}>
                <div style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  color: group.color,
                  marginBottom: "1.5rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}>
                  <div style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: group.color,
                    boxShadow: `0 0 8px ${group.color}`,
                  }} />
                  {group.label}
                </div>

                {group.skills.map((skill) => (
                  <div key={skill.name} style={{ marginBottom: "1.1rem" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <img
                          src={skill.icon}
                          alt={skill.name}
                          style={{ width: "16px", height: "16px", objectFit: "contain" }}
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                        <span style={{
                          fontFamily: "'Inter', sans-serif",
                          fontSize: "0.82rem",
                          color: "rgba(255,255,255,0.75)",
                        }}>{skill.name}</span>
                      </div>
                      <span style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: "0.65rem",
                        color: group.color,
                      }}>{skill.level}%</span>
                    </div>
                    <div className="skill-bar-track">
                      <div
                        className="skill-bar-fill"
                        data-width={skill.level}
                        style={{
                          background: `linear-gradient(90deg, ${group.color}, ${group.color}88)`,
                          boxShadow: `0 0 8px ${group.color}44`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Infinite Marquee */}
        <div className="marquee-container" style={{ marginBottom: "0" }}>
          <div style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: "100px",
            background: "linear-gradient(90deg, rgba(3,5,15,1), transparent)",
            zIndex: 2,
            pointerEvents: "none",
          }} />
          <div style={{
            position: "absolute",
            right: 0,
            top: 0,
            bottom: 0,
            width: "100px",
            background: "linear-gradient(270deg, rgba(3,5,15,1), transparent)",
            zIndex: 2,
            pointerEvents: "none",
          }} />
          <div className="marquee-track" style={{ padding: "1rem 0" }}>
            {[...ALL_TECH, ...ALL_TECH].map((tech, i) => (
              <div key={i} style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.5rem 1rem",
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.05)",
                borderRadius: "6px",
                flexShrink: 0,
              }}>
                <img
                  src={tech.icon}
                  alt={tech.name}
                  style={{ width: "20px", height: "20px", objectFit: "contain" }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.72rem",
                  color: "rgba(255,255,255,0.5)",
                  whiteSpace: "nowrap",
                }}>{tech.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tech Logo Grid */}
        <div className="container" style={{ marginTop: "3rem" }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: "0.75rem",
          }}
            className="tech-logo-grid"
          >
            {ALL_TECH.map((tech) => (
              <div key={tech.name} className="tech-logo-item reveal">
                <img
                  src={tech.icon}
                  alt={tech.name}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
                <span className="tech-logo-name">{tech.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .skills-grid { grid-template-columns: 1fr !important; }
          .tech-logo-grid { grid-template-columns: repeat(4, 1fr) !important; }
        }
      `}</style>
    </section>
  );
}
