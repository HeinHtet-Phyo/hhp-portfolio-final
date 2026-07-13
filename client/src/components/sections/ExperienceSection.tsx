// Dark Space Theme — Experience Section
// Terminal CLI design with traffic light dots, skill progress bars
import { useEffect, useRef } from "react";

const EXPERIENCES = [
  {
    company: "KBZ Pay",
    role: "Software Engineer Intern",
    period: "Sep 2024 – Feb 2025",
    file: "kbzpay.sh",
    color: "#00d4ff",
    lines: [
      { type: "prompt", text: "cat role.txt" },
      { type: "output", text: "Software Engineer Intern @ KBZ Pay" },
      { type: "prompt", text: "cat achievements.txt" },
      { type: "highlight", text: "✓ Built QR payment system for 5M+ users" },
      { type: "highlight", text: "✓ Optimised API response time by 80%" },
      { type: "highlight", text: "✓ Integrated MPT Ooredoo payment gateway" },
      { type: "highlight", text: "✓ Delivered features in Agile sprints" },
      { type: "prompt", text: "cat stack.txt" },
      { type: "output", text: "Java · Spring Boot · REST API · MySQL · Git · Agile" },
    ],
    skills: [
      { name: "Java", level: 80 },
      { name: "API Development", level: 85 },
      { name: "MySQL", level: 80 },
    ],
  },
  {
    company: "City Mart Holding (CMHL)",
    role: "Data Analyst Intern",
    period: "Apr 2025 – Jun 2025",
    file: "citymart.sh",
    color: "#7c3aed",
    lines: [
      { type: "prompt", text: "cat role.txt" },
      { type: "output", text: "Data Analyst Intern @ City Mart Holding CMHL" },
      { type: "prompt", text: "cat achievements.txt" },
      { type: "highlight", text: "✓ Built Power BI dashboards, cut reporting time 40%" },
      { type: "highlight", text: "✓ SAP HANA data extraction across 200+ branches" },
      { type: "highlight", text: "✓ SQL analysis for business intelligence" },
      { type: "prompt", text: "cat stack.txt" },
      { type: "output", text: "Power BI · SAP HANA · SQL · Excel · Python · pandas" },
    ],
    skills: [
      { name: "Power BI", level: 85 },
      { name: "SQL", level: 85 },
      { name: "Data Analysis", level: 90 },
    ],
  },
  {
    company: "McDonald's Bristol",
    role: "Customer Service Representative",
    period: "Oct 2025 – May 2026",
    file: "mcdonalds.sh",
    color: "#febc2e",
    lines: [
      { type: "prompt", text: "cat role.txt" },
      { type: "output", text: "Customer Service Representative @ McDonald's Bristol" },
      { type: "prompt", text: "cat achievements.txt" },
      { type: "highlight", text: "✓ High-volume customer service in fast-paced environment" },
      { type: "highlight", text: "✓ Team collaboration and communication skills" },
      { type: "highlight", text: "✓ Maintained quality standards under pressure" },
    ],
    skills: [
      { name: "Communication", level: 90 },
      { name: "Teamwork", level: 85 },
    ],
  },
  {
    company: "GUSTO College",
    role: "IT Support",
    period: "Apr 2024 – Jun 2024",
    file: "gusto-it.sh",
    color: "#28c840",
    lines: [
      { type: "prompt", text: "cat role.txt" },
      { type: "output", text: "IT Support @ GUSTO College Myanmar" },
      { type: "prompt", text: "cat achievements.txt" },
      { type: "highlight", text: "✓ Supported 500+ students and staff" },
      { type: "highlight", text: "✓ 100% issue resolution rate" },
      { type: "highlight", text: "✓ Network and hardware troubleshooting" },
    ],
    skills: [
      { name: "IT Support", level: 90 },
      { name: "Networking", level: 70 },
    ],
  },
];

function TerminalWindow({ exp }: { exp: typeof EXPERIENCES[0] }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.querySelectorAll<HTMLElement>(".skill-bar-fill").forEach((bar) => {
            bar.style.width = (bar.dataset.width || "0") + "%";
          });
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="terminal-window reveal" style={{ height: "100%" }}>
      <div className="terminal-header">
        <div className="terminal-dot dot-red" />
        <div className="terminal-dot dot-yellow" />
        <div className="terminal-dot dot-green" />
        <span className="terminal-title">{exp.file}</span>
        <span style={{
          marginLeft: "auto",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "0.65rem",
          color: exp.color,
          opacity: 0.8,
        }}>{exp.period}</span>
      </div>
      <div className="terminal-body">
        <div style={{ marginBottom: "0.75rem" }}>
          <span style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 600,
            fontSize: "0.95rem",
            color: exp.color,
          }}>{exp.company}</span>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.75rem",
            color: "rgba(255,255,255,0.4)",
            marginLeft: "0.75rem",
          }}>{exp.role}</span>
        </div>

        {exp.lines.map((line, i) => (
          <div key={i} style={{ marginBottom: "0.15rem" }}>
            {line.type === "prompt" && (
              <div>
                <span className="terminal-prompt">$ </span>
                <span className="terminal-cmd">{line.text}</span>
              </div>
            )}
            {line.type === "output" && (
              <div className="terminal-output">{line.text}</div>
            )}
            {line.type === "highlight" && (
              <div className="terminal-highlight" style={{ paddingLeft: "1rem" }}>{line.text}</div>
            )}
          </div>
        ))}

        {/* Skill bars */}
        <div style={{ marginTop: "1rem", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "1rem" }}>
          {exp.skills.map((skill) => (
            <div key={skill.name} style={{ marginBottom: "0.6rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.65rem",
                  color: "rgba(255,255,255,0.5)",
                }}>{skill.name}</span>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.65rem",
                  color: exp.color,
                }}>{skill.level}%</span>
              </div>
              <div className="skill-bar-track">
                <div
                  className="skill-bar-fill"
                  data-width={skill.level}
                  style={{
                    background: `linear-gradient(90deg, ${exp.color}, ${exp.color}88)`,
                    boxShadow: `0 0 8px ${exp.color}44`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ExperienceSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.querySelectorAll<HTMLElement>(".reveal").forEach((r, i) => {
            setTimeout(() => r.classList.add("visible"), i * 150);
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
      ref={sectionRef}
      id="experience"
      style={{
        padding: "6rem 0",
        background: "#000000",
        position: "relative",
        zIndex: 1,
      }}
    >
      <div className="container">
        <div style={{ marginBottom: "4rem" }}>
          <div className="section-label">02. experience</div>
          <h2 className="section-title">
            Work <span>Experience</span>
          </h2>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "1.5rem",
        }}
          className="exp-grid"
        >
          {EXPERIENCES.map((exp) => (
            <TerminalWindow key={exp.company} exp={exp} />
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .exp-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}
