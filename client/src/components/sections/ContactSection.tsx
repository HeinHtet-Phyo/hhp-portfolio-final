// Dark Space Theme — Contact Section
// Split screen: black left / electric blue right, contact form, footer
import { useState } from "react";
import { FiMail, FiPhone, FiMapPin, FiGithub, FiLinkedin, FiSend, FiHeart } from "react-icons/fi";

const CONTACT_INFO = [
  {
    icon: <FiMail size={18} />,
    label: "Email",
    value: "heinhtetphyo56@gmail.com",
    href: "mailto:heinhtetphyo56@gmail.com",
  },
  {
    icon: <FiPhone size={18} />,
    label: "Phone",
    value: "+44 7436 163764",
    href: "tel:+447436163764",
  },
  {
    icon: <FiMapPin size={18} />,
    label: "Location",
    value: "London, UK",
    href: "#",
  },
  {
    icon: <FiGithub size={18} />,
    label: "GitHub",
    value: "github.com/HeinHtet-Phyo",
    href: "https://github.com/HeinHtet-Phyo",
  },
  {
    icon: <FiLinkedin size={18} />,
    label: "LinkedIn",
    value: "linkedin.com/in/hein-htet-phyo",
    href: "https://linkedin.com/in/hein-htet-phyo",
  },
];

export default function ContactSection() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate form submission
    setSent(true);
    setTimeout(() => setSent(false), 3000);
    setForm({ name: "", email: "", subject: "", message: "" });
  };

  return (
    <section
      id="contact"
      style={{
        position: "relative",
        zIndex: 1,
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Split Screen */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        flex: 1,
      }}
        className="contact-grid"
      >
        {/* Left — Black */}
        <div style={{
          background: "#000000",
          padding: "6rem 4rem",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
          className="contact-left"
        >
          <div className="section-label">06. contact</div>
          <h2 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: "clamp(2rem, 4vw, 3rem)",
            fontWeight: 700,
            color: "white",
            lineHeight: 1.1,
            marginBottom: "1rem",
          }}>
            Available for<br />
            <span style={{ color: "var(--electric-blue)" }}>Graduate</span><br />
            Roles — Now.
          </h2>

          <p style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "0.95rem",
            color: "rgba(255,255,255,0.55)",
            lineHeight: 1.7,
            marginBottom: "2.5rem",
            maxWidth: "380px",
          }}>
            Actively seeking Data Scientist and Data Analyst positions in the UK.
            99.75% ML accuracy, 5M+ user payment systems, Power BI dashboards cutting reporting time by 40%.
            Let's talk about what I can build for your team.
          </p>

          {/* Open to Work Badge */}
          <div className="otw-badge" style={{ marginBottom: "2rem", alignSelf: "flex-start" }}>
            <div className="status-dot" />
            Open to Work — Graduate Roles
          </div>

          {/* Contact Info Cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {CONTACT_INFO.map((item) => (
              <a
                key={item.label}
                href={item.href}
                target={item.href.startsWith("http") ? "_blank" : undefined}
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  padding: "0.75rem 1rem",
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "8px",
                  textDecoration: "none",
                  transition: "all 0.3s ease",
                  color: "inherit",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,212,255,0.3)";
                  (e.currentTarget as HTMLElement).style.background = "rgba(0,212,255,0.04)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.06)";
                  (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)";
                }}
              >
                <div style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "8px",
                  background: "rgba(0,212,255,0.1)",
                  border: "1px solid rgba(0,212,255,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--electric-blue)",
                  flexShrink: 0,
                }}>
                  {item.icon}
                </div>
                <div>
                  <div style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "0.6rem",
                    color: "rgba(255,255,255,0.35)",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    marginBottom: "0.1rem",
                  }}>{item.label}</div>
                  <div style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "0.82rem",
                    color: "rgba(255,255,255,0.75)",
                  }}>{item.value}</div>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Right — Electric Blue */}
        <div style={{
          background: "linear-gradient(135deg, #0088bb, #00d4ff)",
          padding: "6rem 4rem",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
          className="contact-right"
        >
          <h3 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: "1.5rem",
            fontWeight: 700,
            color: "#000",
            marginBottom: "0.5rem",
          }}>Send a Message</h3>
          <p style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "0.85rem",
            color: "rgba(0,0,0,0.6)",
            marginBottom: "2rem",
          }}>I'll get back to you within 24 hours.</p>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <label style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.65rem",
                  color: "rgba(0,0,0,0.6)",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  display: "block",
                  marginBottom: "0.4rem",
                }}>Name</label>
                <input
                  type="text"
                  placeholder="Your name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  style={{
                    width: "100%",
                    background: "rgba(0,0,0,0.1)",
                    border: "1px solid rgba(0,0,0,0.15)",
                    borderRadius: "6px",
                    padding: "0.7rem 1rem",
                    color: "#000",
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "0.9rem",
                    outline: "none",
                  }}
                />
              </div>
              <div>
                <label style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.65rem",
                  color: "rgba(0,0,0,0.6)",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  display: "block",
                  marginBottom: "0.4rem",
                }}>Email</label>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  style={{
                    width: "100%",
                    background: "rgba(0,0,0,0.1)",
                    border: "1px solid rgba(0,0,0,0.15)",
                    borderRadius: "6px",
                    padding: "0.7rem 1rem",
                    color: "#000",
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "0.9rem",
                    outline: "none",
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "0.65rem",
                color: "rgba(0,0,0,0.6)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                display: "block",
                marginBottom: "0.4rem",
              }}>Subject</label>
              <input
                type="text"
                placeholder="Job opportunity / Collaboration"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                required
                style={{
                  width: "100%",
                  background: "rgba(0,0,0,0.1)",
                  border: "1px solid rgba(0,0,0,0.15)",
                  borderRadius: "6px",
                  padding: "0.7rem 1rem",
                  color: "#000",
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "0.9rem",
                  outline: "none",
                }}
              />
            </div>

            <div>
              <label style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "0.65rem",
                color: "rgba(0,0,0,0.6)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                display: "block",
                marginBottom: "0.4rem",
              }}>Message</label>
              <textarea
                placeholder="Tell me about the opportunity..."
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                required
                rows={5}
                style={{
                  width: "100%",
                  background: "rgba(0,0,0,0.1)",
                  border: "1px solid rgba(0,0,0,0.15)",
                  borderRadius: "6px",
                  padding: "0.7rem 1rem",
                  color: "#000",
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "0.9rem",
                  outline: "none",
                  resize: "vertical",
                }}
              />
            </div>

            <button
              type="submit"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                padding: "0.85rem 2rem",
                background: "#000",
                color: "var(--electric-blue)",
                border: "none",
                borderRadius: "6px",
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 600,
                fontSize: "0.9rem",
                cursor: "none",
                transition: "all 0.3s ease",
                letterSpacing: "0.05em",
              }}
            >
              {sent ? "✓ Message Sent!" : <><FiSend size={16} /> Send Message</>}
            </button>
          </form>
        </div>
      </div>

      {/* Footer */}
      <footer style={{
        background: "#000000",
        borderTop: "1px solid rgba(255,255,255,0.05)",
        padding: "2rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "1rem",
      }}>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "0.72rem",
          color: "rgba(255,255,255,0.35)",
        }}>
          © 2026 Hein Htet Phyo. All rights reserved.
        </div>

        <div style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: "0.78rem",
          color: "rgba(255,255,255,0.35)",
          display: "flex",
          alignItems: "center",
          gap: "0.4rem",
        }}>
          Made with <FiHeart size={12} style={{ color: "#ff6b6b" }} /> in London, UK
        </div>

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <a href="https://github.com/HeinHtet-Phyo" target="_blank" rel="noopener noreferrer" className="social-icon" style={{ width: "32px", height: "32px" }}>
            <FiGithub size={14} />
          </a>
          <a href="https://linkedin.com/in/hein-htet-phyo" target="_blank" rel="noopener noreferrer" className="social-icon" style={{ width: "32px", height: "32px" }}>
            <FiLinkedin size={14} />
          </a>
          <a href="mailto:heinhtetphyo56@gmail.com" className="social-icon" style={{ width: "32px", height: "32px" }}>
            <FiMail size={14} />
          </a>
        </div>
      </footer>

      <style>{`
        @media (max-width: 768px) {
          .contact-grid { grid-template-columns: 1fr !important; }
          .contact-left, .contact-right { padding: 3rem 1.5rem !important; }
        }
      `}</style>
    </section>
  );
}
