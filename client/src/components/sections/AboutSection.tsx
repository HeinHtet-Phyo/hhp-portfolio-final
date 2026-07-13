// Dark Space Theme — About Section
// Word-by-word text reveal, horizontal timeline, grayscale-to-color photo
import { useEffect, useRef } from "react";
import { FiDownload } from "react-icons/fi";

const TIMELINE = [
  { year: "2019", label: "Started coding" },
  { year: "2022", label: "Foundation Diploma" },
  { year: "2022", label: "HND Computing" },
  { year: "2024", label: "IT Support" },
  { year: "2025", label: "KBZ Pay Intern" },
  { year: "2025", label: "City Mart Intern" },
  { year: "2025", label: "UWE Bristol" },
  { year: "2026", label: "Now" },
];

const ABOUT_TEXT = "I'm a 21-year-old Data Scientist and AI Engineer from Myanmar, currently based in London, UK. I'm pursuing my BSc in Data Science and Artificial Intelligence at UWE Bristol, on track for First Class Honours. I'm passionate about building intelligent systems that solve real-world problems — from music recommendation engines to payment infrastructure serving millions of users.";

function WordReveal({ text }: { text: string }) {
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const spans = el.querySelectorAll<HTMLSpanElement>("span");
          spans.forEach((span, i) => {
            setTimeout(() => {
              span.style.opacity = "1";
              span.style.transform = "translateY(0)";
            }, i * 30);
          });
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <p ref={ref} style={{
      fontFamily: "'Inter', sans-serif",
      fontSize: "1rem",
      lineHeight: 1.8,
      color: "rgba(255,255,255,0.7)",
      marginBottom: "1.5rem",
    }}>
      {text.split(" ").map((word, i) => (
        <span key={i} style={{
          display: "inline-block",
          marginRight: "0.3em",
          opacity: 0,
          transform: "translateY(10px)",
          transition: "opacity 0.4s ease, transform 0.4s ease",
        }}>
          {word}
        </span>
      ))}
    </p>
  );
}

export default function AboutSection() {
  const photoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = photoRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.filter = "grayscale(0%)";
        } else {
          el.style.filter = "grayscale(80%)";
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="about"
      style={{
        padding: "6rem 0",
        background: "rgba(5, 8, 20, 0.95)",
        position: "relative",
        zIndex: 1,
      }}
    >
      <div className="container">
        {/* Section Header */}
        <div style={{ marginBottom: "4rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <div className="section-label">01. about me</div>
              <h2 className="section-title">
                Who I <span>Am</span>
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
              <div>HHP.PROFILE</div>
              <div>LOC: 51.5074°N, 0.1278°W</div>
              <div>STATUS: OPEN</div>
            </div>
          </div>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1.5fr",
          gap: "5rem",
          alignItems: "center",
        }}
          className="about-grid"
        >
          {/* Photo */}
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div
              ref={photoRef}
              style={{
                width: "280px",
                height: "340px",
                borderRadius: "12px",
                overflow: "hidden",
                border: "1px solid rgba(0,212,255,0.2)",
                filter: "grayscale(80%)",
                transition: "filter 0.8s ease",
                position: "relative",
              }}
            >
              <img
                src="/manus-storage/profile-placeholder_ecf77c3b.png"
                alt="Hein Htet Phyo"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onError={(e) => {
                  const t = e.target as HTMLImageElement;
                  t.style.display = "none";
                  const ph = document.createElement("div");
                  ph.className = "profile-placeholder";
                  ph.style.cssText = "border-radius:0;height:100%;font-size:5rem;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:0.5rem";
                  ph.innerHTML = '<span>HHP</span><span style="font-family:JetBrains Mono,monospace;font-size:0.7rem;color:rgba(0,212,255,0.5);letter-spacing:0.1em">DATA SCIENTIST</span>';
                  t.parentElement!.appendChild(ph);
                }}
              />
              {/* Corner accents */}
              <div style={{
                position: "absolute",
                top: "8px",
                left: "8px",
                width: "20px",
                height: "20px",
                borderTop: "2px solid var(--electric-blue)",
                borderLeft: "2px solid var(--electric-blue)",
              }} />
              <div style={{
                position: "absolute",
                bottom: "8px",
                right: "8px",
                width: "20px",
                height: "20px",
                borderBottom: "2px solid var(--electric-blue)",
                borderRight: "2px solid var(--electric-blue)",
              }} />
            </div>
          </div>

          {/* Text */}
          <div>
            <WordReveal text={ABOUT_TEXT} />

            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1rem",
              marginBottom: "2rem",
            }}>
              {[
                { label: "Name", value: "Hein Htet Phyo" },
                { label: "Age", value: "21 years" },
                { label: "Location", value: "London, UK" },
                { label: "Nationality", value: "Myanmar" },
                { label: "Email", value: "heinhtetphyo56@gmail.com" },
                { label: "Status", value: "Open to Work" },
              ].map((item) => (
                <div key={item.label} style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.2rem",
                }}>
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "0.65rem",
                    color: "var(--electric-blue)",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                  }}>{item.label}</span>
                  <span style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "0.9rem",
                    color: "rgba(255,255,255,0.8)",
                  }}>{item.value}</span>
                </div>
              ))}
            </div>

            <button className="btn-magnetic btn-primary" style={{ marginBottom: "0" }}>
              <FiDownload size={16} /> Download Resume
            </button>
          </div>
        </div>

        {/* Horizontal Timeline */}
        <div style={{ marginTop: "5rem" }}>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.7rem",
            color: "rgba(255,255,255,0.4)",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            marginBottom: "1.5rem",
          }}>Journey</div>
          <div className="htimeline" style={{ overflowX: "auto", paddingBottom: "1rem" }}>
            {TIMELINE.map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                  <div style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "0.65rem",
                    color: "var(--electric-blue)",
                    marginBottom: "0.5rem",
                    whiteSpace: "nowrap",
                  }}>{item.year}</div>
                  <div className="htimeline-dot" />
                  <div style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "0.7rem",
                    color: "rgba(255,255,255,0.5)",
                    marginTop: "0.5rem",
                    whiteSpace: "nowrap",
                    textAlign: "center",
                    maxWidth: "80px",
                  }}>{item.label}</div>
                </div>
                {i < TIMELINE.length - 1 && (
                  <div className="htimeline-line" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .about-grid { grid-template-columns: 1fr !important; gap: 2rem !important; }
        }
      `}</style>
    </section>
  );
}
