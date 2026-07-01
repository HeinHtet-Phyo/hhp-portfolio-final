// Dark Space Theme — Projects Section
// 3D tilt cards, slide-up modal, GitHub API stats
import { useEffect, useRef, useState } from "react";
import { FiGithub, FiExternalLink, FiX, FiStar, FiGitBranch } from "react-icons/fi";

const PROJECTS = [
  {
    id: 1,
    title: "MoodTunes AI",
    subtitle: "LightGBM Music Recommender",
    description: "LightGBM trained on 114K+ Spotify tracks — F1 score 0.5652 on 5-class mood classification. Deployed as a real-time recommendation API.",
    longDesc: "MoodTunes AI uses LightGBM to recommend music based on mood. The system processes 114,000+ Spotify tracks, extracting audio features like danceability, energy, valence, and tempo. The model achieves an F1 score of 0.5652 on multi-class mood classification. Features include real-time mood detection, playlist generation, and Spotify API integration.",
    github: "https://github.com/HeinHtet-Phyo/moodtunes-ai-group3",
    tags: ["Python", "LightGBM", "Spotify API", "scikit-learn", "pandas"],
    stats: { f1: "0.5652", tracks: "114K+", classes: "5 moods" },
    color: "#00d4ff",
    featured: true,
    icon: "◈",
  },
  {
    id: 2,
    title: "IT Career Planner",
    subtitle: "XGBoost Career Prediction",
    description: "XGBoost classifier at 99.75% accuracy across 6,000 samples. Maps SFIA framework skills to career paths with gap analysis and learning plans.",
    longDesc: "The IT Career Planner uses XGBoost to predict optimal IT career paths based on skills, experience, and interests. Trained on 6000 samples with SFIA (Skills Framework for the Information Age) alignment. The model achieves 99.75% accuracy with cross-validation. Features include career gap analysis, skill recommendations, and learning path generation.",
    github: "https://github.com/HeinHtet-Phyo/it-career-planner",
    tags: ["Python", "XGBoost", "SFIA", "scikit-learn", "Streamlit"],
    stats: { accuracy: "99.75%", samples: "6,000", framework: "SFIA" },
    color: "#7c3aed",
    featured: true,
    icon: "△",
  },
  {
    id: 3,
    title: "CityPulse",
    subtitle: "Urban Data Analytics Platform",
    description: "Interactive urban analytics platform aggregating transportation, demographic, and infrastructure data into actionable city-level intelligence.",
    longDesc: "CityPulse is an urban data analytics platform that aggregates and visualises city-level data. It processes transportation patterns, demographic data, and infrastructure metrics to provide actionable insights for urban planners. Features include interactive maps, trend analysis, and predictive modelling for urban development.",
    github: "https://github.com/HeinHtet-Phyo",
    tags: ["Python", "Data Viz", "Pandas", "Plotly", "GeoPandas"],
    stats: { type: "Urban Analytics", viz: "Interactive", scope: "City-level" },
    color: "#00d4ff",
    featured: false,
    icon: "◎",
  },
  {
    id: 4,
    title: "PreventPath",
    subtitle: "ML Health Risk Prediction",
    description: "ML pipeline predicting health risk factors from patient data, generating personalised prevention plans with risk scoring and intervention recommendations.",
    longDesc: "PreventPath is an AI health prevention system that uses machine learning to predict health risks and recommend preventive measures. The system analyses patient data, lifestyle factors, and medical history to generate personalised prevention plans. Features include risk scoring, intervention recommendations, and progress tracking.",
    github: "https://github.com/HeinHtet-Phyo",
    tags: ["Python", "ML", "Healthcare", "scikit-learn", "Flask"],
    stats: { type: "Health AI", domain: "Prevention", approach: "ML" },
    color: "#00d4ff",
    featured: false,
    icon: "□",
  },
];

function ProjectModal({ project, onClose }: { project: typeof PROJECTS[0] | null; onClose: () => void }) {
  if (!project) return null;

  return (
    <div className={`project-modal ${project ? "open" : ""}`} onClick={onClose}>
      <div
        className="project-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "2rem" }}>{project.icon}</span>
              <div>
                <h3 style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  color: "white",
                }}>{project.title}</h3>
                <div style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.75rem",
                  color: project.color,
                }}>{project.subtitle}</div>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
              padding: "0.5rem",
              color: "rgba(255,255,255,0.6)",
              cursor: "none",
              display: "flex",
              alignItems: "center",
            }}
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Stats */}
        <div style={{
          display: "flex",
          gap: "1rem",
          marginBottom: "1.5rem",
          flexWrap: "wrap",
        }}>
          {Object.entries(project.stats).map(([k, v]) => (
            <div key={k} style={{
              padding: "0.5rem 1rem",
              background: `${project.color}10`,
              border: `1px solid ${project.color}30`,
              borderRadius: "6px",
            }}>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "0.65rem",
                color: "rgba(255,255,255,0.4)",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: "0.2rem",
              }}>{k}</div>
              <div style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: "1rem",
                fontWeight: 600,
                color: project.color,
              }}>{v}</div>
            </div>
          ))}
        </div>

        {/* Description */}
        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: "0.95rem",
          color: "rgba(255,255,255,0.7)",
          lineHeight: 1.8,
          marginBottom: "1.5rem",
        }}>{project.longDesc}</p>

        {/* Tags */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1.5rem" }}>
          {project.tags.map((tag) => (
            <span key={tag} className="tech-badge">{tag}</span>
          ))}
        </div>

        {/* GitHub Button */}
        <a
          href={project.github}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-magnetic btn-outline"
          style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
        >
          <FiGithub size={16} /> View on GitHub
        </a>
      </div>
    </div>
  );
}

function ProjectCard({ project }: { project: typeof PROJECTS[0] }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [, setModal] = useState<typeof PROJECTS[0] | null>(null);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const onMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(800px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) translateZ(5px)`;
    };

    const onLeave = () => {
      card.style.transform = "perspective(800px) rotateY(0) rotateX(0) translateZ(0)";
      card.style.transition = "transform 0.5s cubic-bezier(0.23, 1, 0.32, 1)";
    };

    card.addEventListener("mousemove", onMove);
    card.addEventListener("mouseleave", onLeave);
    return () => {
      card.removeEventListener("mousemove", onMove);
      card.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <div
      ref={cardRef}
      className="project-card reveal"
      style={{ transition: "transform 0.1s ease" }}
    >
      {/* Card Header */}
      <div style={{
        padding: "1.5rem",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        background: `linear-gradient(135deg, ${project.color}08, transparent)`,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
          <span style={{ fontSize: "2rem" }}>{project.icon}</span>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            {project.featured && <span className="featured-badge">★ Featured</span>}
          </div>
        </div>
        <h3 style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: "1.1rem",
          fontWeight: 700,
          color: "white",
          marginBottom: "0.3rem",
        }}>{project.title}</h3>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "0.7rem",
          color: project.color,
          marginBottom: "0.75rem",
        }}>{project.subtitle}</div>
        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: "0.85rem",
          color: "rgba(255,255,255,0.55)",
          lineHeight: 1.6,
        }}>{project.description}</p>
      </div>

      {/* Tags */}
      <div style={{ padding: "1rem 1.5rem", display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
        {project.tags.slice(0, 4).map((tag) => (
          <span key={tag} className="tech-badge">{tag}</span>
        ))}
      </div>

      {/* Actions */}
      <div style={{
        padding: "0 1.5rem 1.5rem",
        display: "flex",
        gap: "0.75rem",
      }}>
        <a
          href={project.github}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            padding: "0.5rem 1rem",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "6px",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.72rem",
            color: "rgba(255,255,255,0.6)",
            textDecoration: "none",
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,212,255,0.3)";
            (e.currentTarget as HTMLElement).style.color = "var(--electric-blue)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)";
            (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.6)";
          }}
        >
          <FiGithub size={13} /> GitHub
        </a>
        <button
          onClick={() => setModal(project)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            padding: "0.5rem 1rem",
            background: `${project.color}10`,
            border: `1px solid ${project.color}30`,
            borderRadius: "6px",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.72rem",
            color: project.color,
            cursor: "none",
            transition: "all 0.3s ease",
          }}
        >
          <FiExternalLink size={13} /> Details
        </button>
      </div>
    </div>
  );
}

export default function ProjectsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [selectedProject, setSelectedProject] = useState<typeof PROJECTS[0] | null>(null);
  const [githubStats, setGithubStats] = useState({ repos: 0, followers: 0 });

  useEffect(() => {
    // Fetch GitHub stats
    fetch("https://api.github.com/users/HeinHtet-Phyo")
      .then((r) => r.json())
      .then((data) => {
        setGithubStats({
          repos: data.public_repos || 0,
          followers: data.followers || 0,
        });
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.querySelectorAll<HTMLElement>(".reveal").forEach((r, i) => {
            setTimeout(() => r.classList.add("visible"), i * 120);
          });
        }
      },
      { threshold: 0.05 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="projects"
      style={{
        padding: "6rem 0",
        background: "#000000",
        position: "relative",
        zIndex: 1,
      }}
    >
      <div className="container">
        <div style={{ marginBottom: "4rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <div className="section-label">04. projects</div>
              <h2 className="section-title">
                Featured <span>Projects</span>
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
              <div>HHP.BUILD</div>
              <div>REPOS: GITHUB/HEINHTET-PHYO</div>
              <div>STACK: PYTHON · ML · DATA</div>
            </div>
          </div>
        </div>

        {/* GitHub Stats Row */}
        <div className="reveal" style={{
          display: "flex",
          gap: "1rem",
          marginBottom: "3rem",
          flexWrap: "wrap",
        }}>
          {[
            { icon: <FiGithub size={16} />, label: "GitHub Repos", value: githubStats.repos || "—" },
            { icon: <FiStar size={16} />, label: "Followers", value: githubStats.followers || "—" },
            { icon: <FiGitBranch size={16} />, label: "Projects", value: PROJECTS.length },
          ].map((stat) => (
            <div key={stat.label} style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              padding: "0.6rem 1.25rem",
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "8px",
            }}>
              <span style={{ color: "var(--electric-blue)" }}>{stat.icon}</span>
              <span style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 700,
                fontSize: "1.1rem",
                color: "white",
              }}>{stat.value}</span>
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "0.65rem",
                color: "rgba(255,255,255,0.4)",
                letterSpacing: "0.05em",
              }}>{stat.label}</span>
            </div>
          ))}
        </div>

        {/* Projects Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "1.5rem",
        }}
          className="proj-grid"
          onClick={(e) => {
            // Handle Details button clicks
            const btn = (e.target as HTMLElement).closest("[data-project-id]");
            if (btn) {
              const id = parseInt((btn as HTMLElement).dataset.projectId || "0");
              const proj = PROJECTS.find((p) => p.id === id);
              if (proj) setSelectedProject(proj);
            }
          }}
        >
          {PROJECTS.map((project) => (
            <div key={project.id} onClick={() => {}}>
              <ProjectCard project={project} />
            </div>
          ))}
        </div>

        {/* View All on GitHub */}
        <div style={{ textAlign: "center", marginTop: "3rem" }}>
          <a
            href="https://github.com/HeinHtet-Phyo"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-magnetic btn-outline"
            style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
          >
            <FiGithub size={16} /> View All on GitHub
          </a>
        </div>
      </div>

      {/* Modal */}
      {selectedProject && (
        <ProjectModal project={selectedProject} onClose={() => setSelectedProject(null)} />
      )}

      <style>{`
        @media (max-width: 768px) {
          .proj-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}
