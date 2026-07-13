// Dark Space Theme — Education Section
// Holographic shimmer cards with 3D tilt, certificate carousel
import { useEffect, useRef } from "react";

const EDUCATION = [
  {
    degree: "BSc (Hons) Data Science and Artificial Intelligence",
    institution: "UWE Bristol",
    period: "Sep 2025 – Jun 2026",
    grade: "First Class Honours",
    icon: "◈",
    color: "#00d4ff",
    tags: ["Data Science", "AI", "Machine Learning", "Python"],
  },
  {
    degree: "Higher National Diploma BTEC Level 4-5 in Computing",
    institution: "GUSTO College Myanmar",
    period: "Nov 2022 – Nov 2024",
    grade: "HND Level 5",
    icon: "⬡",
    color: "#7c3aed",
    tags: ["Computing", "Software Engineering", "Networking"],
  },
  {
    degree: "International Foundation Diploma in Computing",
    institution: "GUSTO College Myanmar",
    period: "Jul 2022 – Oct 2022",
    grade: "Distinctions in all modules",
    icon: "◆",
    color: "#00d4ff",
    tags: ["Foundation", "Computing", "Distinctions"],
  },
];

const CERTIFICATES = [
  { title: "IOT Challenge Winner", org: "GUSTO College", date: "Jan 2024", icon: "◈" },
  { title: "Innovation Hackathon FixIt App", org: "GUSTO College", date: "Mar 2025", icon: "△" },
  { title: "Data Analysis & Machine Learning", org: "Ace of Data", date: "Dec 2025", icon: "□" },
  { title: "Regen Asia Summit", org: "National University of Singapore", date: "Jul 2025", icon: "◎" },
  { title: "Introduction to Python", org: "Technortal", date: "May 2025", icon: "◆" },
  { title: "Introduction to Java", org: "Technortal", date: "Aug 2025", icon: "▷" },
  { title: "IT Challenge Participant", org: "GUSTO College", date: "Jun 2023", icon: "▫" },
];

function HoloCard({ edu, index }: { edu: typeof EDUCATION[0]; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const onMouseMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(800px) rotateY(${x * 15}deg) rotateX(${-y * 15}deg) translateZ(10px)`;
    };

    const onMouseLeave = () => {
      card.style.transform = "perspective(800px) rotateY(0) rotateX(0) translateZ(0)";
      card.style.transition = "transform 0.5s cubic-bezier(0.23, 1, 0.32, 1)";
    };

    card.addEventListener("mousemove", onMouseMove);
    card.addEventListener("mouseleave", onMouseLeave);
    return () => {
      card.removeEventListener("mousemove", onMouseMove);
      card.removeEventListener("mouseleave", onMouseLeave);
    };
  }, []);

  return (
    <div
      ref={cardRef}
      className="holo-card reveal"
      style={{
        padding: "2rem",
        animationDelay: `${index * 0.15}s`,
        transition: "transform 0.1s ease",
      }}
    >
      {/* Icon + Grade */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
        <span style={{ fontSize: "2.5rem" }}>{edu.icon}</span>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "0.65rem",
          color: edu.color,
          background: `${edu.color}15`,
          border: `1px solid ${edu.color}30`,
          padding: "0.25rem 0.6rem",
          borderRadius: "4px",
          letterSpacing: "0.05em",
        }}>{edu.grade}</span>
      </div>

      {/* Degree */}
      <h3 style={{
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: "1rem",
        fontWeight: 600,
        color: "white",
        marginBottom: "0.5rem",
        lineHeight: 1.4,
      }}>{edu.degree}</h3>

      {/* Institution */}
      <div style={{
        fontFamily: "'Inter', sans-serif",
        fontSize: "0.85rem",
        color: edu.color,
        marginBottom: "0.4rem",
        fontWeight: 500,
      }}>{edu.institution}</div>

      {/* Period */}
      <div style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "0.7rem",
        color: "rgba(255,255,255,0.4)",
        marginBottom: "1.25rem",
      }}>{edu.period}</div>

      {/* Tags */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
        {edu.tags.map((tag) => (
          <span key={tag} style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.62rem",
            color: "rgba(255,255,255,0.5)",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            padding: "0.15rem 0.5rem",
            borderRadius: "3px",
          }}>{tag}</span>
        ))}
      </div>

      {/* Shimmer overlay */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: `radial-gradient(circle at 50% 50%, ${edu.color}08, transparent 70%)`,
        pointerEvents: "none",
        borderRadius: "12px",
      }} />
    </div>
  );
}

export default function EducationSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

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
      id="education"
      style={{
        padding: "6rem 0",
        background: "rgba(8, 2, 20, 0.95)",
        position: "relative",
        zIndex: 1,
      }}
    >
      <div className="container">
        <div style={{ marginBottom: "4rem" }}>
          <div className="section-label">03. education</div>
          <h2 className="section-title">
            Academic <span>Background</span>
          </h2>
        </div>

        {/* Education Cards */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "1.5rem",
          marginBottom: "5rem",
        }}
          className="edu-grid"
        >
          {EDUCATION.map((edu, i) => (
            <HoloCard key={edu.institution + edu.degree} edu={edu} index={i} />
          ))}
        </div>

        {/* Certificates */}
        <div>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.7rem",
            color: "rgba(255,255,255,0.4)",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            marginBottom: "1.5rem",
          }}>Certificates &amp; Achievements</div>

          <div
            ref={carouselRef}
            style={{
              display: "flex",
              gap: "1rem",
              overflowX: "auto",
              paddingBottom: "1rem",
              scrollbarWidth: "thin",
              scrollbarColor: "rgba(0,212,255,0.3) transparent",
            }}
          >
            {CERTIFICATES.map((cert) => (
              <div key={cert.title} className="cert-card reveal">
                <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>{cert.icon}</div>
                <div style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  color: "white",
                  marginBottom: "0.4rem",
                  lineHeight: 1.3,
                }}>{cert.title}</div>
                <div style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "0.75rem",
                  color: "var(--electric-blue)",
                  marginBottom: "0.3rem",
                }}>{cert.org}</div>
                <div style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.65rem",
                  color: "rgba(255,255,255,0.35)",
                }}>{cert.date}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .edu-grid { grid-template-columns: 1fr !important; }
        }
        @media (min-width: 640px) and (max-width: 900px) {
          .edu-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </section>
  );
}
