/*
 * ContactSection — Motionfolio-inspired, black & white theme
 *
 * Layout:
 *   Top bar: ● // INITIALIZE_CONTACT ─────────────────────
 *   Left (60%): Big "LET'S" + "CONNECT." headline + tagline
 *   Right (40%): SITEMAP column + NETWORKS column
 *   Bottom bar: SYS.STATUS: [ONLINE] | live clock | © copyright | >_
 */

import { useState, useEffect, useRef } from "react";

// ── Icons ─────────────────────────────────────────────────────────────────────
function EnvelopeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2"/>
      <path d="M2 7l10 7 10-7"/>
    </svg>
  );
}
function GitHubIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
    </svg>
  );
}
function LinkedInIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
      <rect x="2" y="9" width="4" height="12"/>
      <circle cx="4" cy="4" r="2"/>
    </svg>
  );
}
function ArrowIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 17L17 7M17 7H7M17 7v10"/>
    </svg>
  );
}

// ── Live Clock ────────────────────────────────────────────────────────────────
function LiveClock() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const fmt = () => {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, "0");
      const mm = String(now.getMinutes()).padStart(2, "0");
      const ss = String(now.getSeconds()).padStart(2, "0");
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone.replace("Europe/London", "GMT+1");
      setTime(`${hh}:${mm}:${ss} ${tz}`);
    };
    fmt();
    const id = setInterval(fmt, 1000);
    return () => clearInterval(id);
  }, []);
  return <span>{time}</span>;
}

// ── Network Button ────────────────────────────────────────────────────────────
function NetworkBtn({
  icon, label, sub, href,
}: { icon: React.ReactNode; label: string; sub?: string; href: string }) {
  const [hov, setHov] = useState(false);
  return (
    <a
      href={href}
      target={href.startsWith("mailto") ? "_self" : "_blank"}
      rel="noopener noreferrer"
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0.75rem 1rem",
        border: hov ? "1px solid rgba(255,255,255,0.35)" : "1px solid rgba(255,255,255,0.12)",
        background: hov ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.02)",
        borderRadius: "6px",
        textDecoration: "none",
        color: "inherit",
        transition: "border-color 0.2s, background 0.2s",
        cursor: "pointer",
        gap: "0.75rem",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
        <span style={{ opacity: 0.6, display: "flex" }}>{icon}</span>
        <div>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.72rem",
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.9)",
          }}>
            {label}
          </div>
          {sub && (
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.6rem",
              opacity: 0.4,
              marginTop: "1px",
            }}>
              {sub}
            </div>
          )}
        </div>
      </div>
      <span style={{ opacity: hov ? 0.8 : 0.3, transition: "opacity 0.2s", display: "flex" }}>
        <ArrowIcon />
      </span>
    </a>
  );
}

// ── Sitemap Link ──────────────────────────────────────────────────────────────
function SitemapLink({ label, href }: { label: string; href: string }) {
  const [hov, setHov] = useState(false);
  return (
    <a
      href={href}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.6rem",
        textDecoration: "none",
        color: hov ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.45)",
        transition: "color 0.2s",
        cursor: "pointer",
      }}
    >
      <span style={{
        width: "6px", height: "6px",
        background: hov ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.25)",
        borderRadius: "1px",
        flexShrink: 0,
        transition: "background 0.2s",
      }} />
      <span style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "0.72rem",
        fontWeight: 600,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
      }}>
        {label}
      </span>
    </a>
  );
}

// ── Main Section ──────────────────────────────────────────────────────────────
export default function ContactSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold: 0.08 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section
      id="contact"
      ref={sectionRef}
      style={{
        position: "relative",
        zIndex: 1,
        background: "transparent",
        borderTop: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      {/* ── Top label bar ── */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        padding: "1.4rem 8vw",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        opacity: inView ? 1 : 0,
        transition: "opacity 0.6s ease 0.1s",
      }}>
        <span style={{
          width: "8px", height: "8px", borderRadius: "50%",
          background: "#ffffff",
          boxShadow: "0 0 8px rgba(255,255,255,0.6)",
          flexShrink: 0,
        }} />
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "0.65rem",
          letterSpacing: "0.28em",
          textTransform: "uppercase",
          opacity: 0.5,
        }}>
          // INITIALIZE_CONTACT
        </span>
        <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.08)" }} />
      </div>

      {/* ── Main body ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr auto",
        gap: "4rem",
        padding: "5rem 8vw 4rem",
        alignItems: "start",
      }}
        className="contact-motionfolio-grid"
      >
        {/* Left — Big headline + tagline */}
        <div>
          <div
            style={{
              opacity: inView ? 1 : 0,
              transform: inView ? "translateY(0)" : "translateY(40px)",
              transition: "opacity 0.8s cubic-bezier(0.23,1,0.32,1) 0.2s, transform 0.8s cubic-bezier(0.23,1,0.32,1) 0.2s",
            }}
          >
            <div style={{
              fontFamily: "'Space Grotesk', 'JetBrains Mono', sans-serif",
              fontSize: "clamp(4rem, 9vw, 8rem)",
              fontWeight: 900,
              lineHeight: 0.92,
              letterSpacing: "-0.03em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.95)",
              marginBottom: "0.1em",
            }}>
              LET'S
            </div>
            <div style={{
              fontFamily: "'Space Grotesk', 'JetBrains Mono', sans-serif",
              fontSize: "clamp(4rem, 9vw, 8rem)",
              fontWeight: 900,
              lineHeight: 0.92,
              letterSpacing: "-0.03em",
              textTransform: "uppercase",
              fontStyle: "italic",
              color: "rgba(255,255,255,0.95)",
              marginBottom: "2.5rem",
            }}>
              CONNECT.
            </div>
          </div>

          <div
            style={{
              maxWidth: "480px",
              opacity: inView ? 1 : 0,
              transform: inView ? "translateY(0)" : "translateY(20px)",
              transition: "opacity 0.7s ease 0.45s, transform 0.7s cubic-bezier(0.23,1,0.32,1) 0.45s",
            }}
          >
            <p style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.85rem",
              lineHeight: 1.75,
              opacity: 0.5,
              margin: 0,
            }}>
              Feel free to reach out for collaborations, data science projects,
              or just to say hello. Always open to exploring new opportunities
              in AI, ML, and software engineering.
            </p>
          </div>
        </div>

        {/* Right — Sitemap + Networks */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "180px 240px",
          gap: "3rem",
          opacity: inView ? 1 : 0,
          transform: inView ? "translateY(0)" : "translateY(30px)",
          transition: "opacity 0.7s ease 0.35s, transform 0.7s cubic-bezier(0.23,1,0.32,1) 0.35s",
          paddingTop: "0.5rem",
        }}
          className="contact-motionfolio-right"
        >
          {/* Sitemap */}
          <div>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.6rem",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              opacity: 0.3,
              marginBottom: "1.5rem",
              borderLeft: "2px solid rgba(255,255,255,0.2)",
              paddingLeft: "0.6rem",
            }}>
              SITEMAP
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
              <SitemapLink label="About"    href="#about" />
              <SitemapLink label="Projects" href="#projects" />
              <SitemapLink label="Work"     href="#experience" />
              <SitemapLink label="Skills"   href="#skills" />
            </div>
          </div>

          {/* Networks */}
          <div>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.6rem",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              opacity: 0.3,
              marginBottom: "1.5rem",
              borderLeft: "2px solid rgba(255,255,255,0.2)",
              paddingLeft: "0.6rem",
            }}>
              NETWORKS
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
              <NetworkBtn
                icon={<EnvelopeIcon />}
                label="Email"
                sub="heinhtetphyo56@gmail.com"
                href="mailto:heinhtetphyo56@gmail.com"
              />
              <NetworkBtn
                icon={<GitHubIcon />}
                label="GitHub"
                sub="HeinHtet-Phyo"
                href="https://github.com/HeinHtet-Phyo"
              />
              <NetworkBtn
                icon={<LinkedInIcon />}
                label="LinkedIn"
                sub="hein-htet-phyo"
                href="https://linkedin.com/in/hein-htet-phyo"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom status bar ── */}
      <div style={{
        borderTop: "1px solid rgba(255,255,255,0.07)",
        padding: "0.9rem 8vw",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1rem",
        flexWrap: "wrap",
      }}>
        {/* SYS.STATUS */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.62rem",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            opacity: 0.4,
          }}>
            SYS.STATUS:
          </span>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.62rem",
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.9)",
            border: "1px solid rgba(255,255,255,0.35)",
            padding: "2px 8px",
            borderRadius: "3px",
          }}>
            ONLINE
          </span>
        </div>

        {/* Live clock */}
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "0.62rem",
          letterSpacing: "0.1em",
          opacity: 0.3,
        }}>
          <LiveClock />
        </div>

        {/* Copyright */}
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "0.62rem",
          letterSpacing: "0.1em",
          opacity: 0.3,
          textTransform: "uppercase",
        }}>
          © 2026 HEIN HTET PHYO. ALL RIGHTS RESERVED.
        </div>

        {/* Terminal prompt */}
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "0.75rem",
          opacity: 0.4,
          fontWeight: 700,
        }}>
          &gt;_
        </span>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .contact-motionfolio-grid {
            grid-template-columns: 1fr !important;
            gap: 3rem !important;
          }
          .contact-motionfolio-right {
            grid-template-columns: 1fr 1fr !important;
            gap: 2rem !important;
          }
        }
        @media (max-width: 560px) {
          .contact-motionfolio-right {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
