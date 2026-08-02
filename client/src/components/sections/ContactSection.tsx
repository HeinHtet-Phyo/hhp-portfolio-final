// ContactSection — matches the reference design
// Left: LET'S CONNECT heading + tagline
// Middle: SITEMAP links
// Right: NETWORKS buttons (Email, GitHub, LinkedIn, Discord)

import { useState, useEffect, useRef } from "react";

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

// ── Icons ─────────────────────────────────────────────────────────────────────
function EmailIcon() {
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
function DiscordIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.003.028.019.056.04.074a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
    </svg>
  );
}
function ArrowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 17L17 7M17 7H7M17 7v10"/>
    </svg>
  );
}

// ── Network Button ─────────────────────────────────────────────────────────────
function NetworkBtn({
  icon,
  label,
  sub,
  href,
  delay,
  inView,
}: {
  icon: React.ReactNode;
  label: string;
  sub?: string;
  href: string;
  delay: number;
  inView: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0.9rem 1.1rem",
        borderRadius: "6px",
        border: hovered ? "1px solid rgba(255,255,255,0.25)" : "1px solid rgba(255,255,255,0.1)",
        background: hovered ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.02)",
        textDecoration: "none",
        color: "inherit",
        transition: "border-color 0.25s, background 0.25s, opacity 0.6s ease, transform 0.6s cubic-bezier(0.23,1,0.32,1)",
        transitionDelay: `0s, 0s, ${delay}s, ${delay}s`,
        opacity: inView ? 1 : 0,
        transform: inView ? "translateX(0)" : "translateX(24px)",
        cursor: "pointer",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <span style={{ opacity: 0.7, display: "flex", flexShrink: 0 }}>{icon}</span>
        <div>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.78rem",
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}>
            {label}
          </div>
          {sub && (
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.58rem",
              opacity: 0.4,
              marginTop: "0.1rem",
            }}>
              {sub}
            </div>
          )}
        </div>
      </div>
      <span style={{
        opacity: hovered ? 1 : 0.3,
        transition: "opacity 0.25s, transform 0.25s",
        transform: hovered ? "translate(2px, -2px)" : "translate(0,0)",
        display: "flex",
      }}>
        <ArrowIcon />
      </span>
    </a>
  );
}

// ── Sitemap Link ───────────────────────────────────────────────────────────────
function SitemapLink({ label, href, delay, inView }: { label: string; href: string; delay: number; inView: boolean }) {
  const [hovered, setHovered] = useState(false);
  return (
    <a
      href={href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.6rem",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "0.78rem",
        fontWeight: 600,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        textDecoration: "none",
        color: hovered ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.45)",
        transition: "color 0.2s, opacity 0.6s ease, transform 0.6s cubic-bezier(0.23,1,0.32,1)",
        transitionDelay: `0s, ${delay}s, ${delay}s`,
        opacity: inView ? 1 : 0,
        transform: inView ? "translateX(0)" : "translateX(-16px)",
        cursor: "pointer",
      }}
    >
      <span style={{
        width: "6px",
        height: "6px",
        borderRadius: "1px",
        background: hovered ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.25)",
        flexShrink: 0,
        transition: "background 0.2s",
        display: "inline-block",
      }} />
      {label}
    </a>
  );
}

// ── Main Section ──────────────────────────────────────────────────────────────
export default function ContactSection() {
  const { ref, inView } = useInView(0.08);

  return (
    <section
      id="contact"
      ref={ref}
      style={{ padding: "6rem 8vw 7rem", position: "relative", zIndex: 1, borderTop: "1px solid rgba(255,255,255,0.08)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}
    >
      {/* Top label */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "0.6rem",
        marginBottom: "2.5rem",
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(12px)",
        transition: "opacity 0.6s ease, transform 0.6s ease",
      }}>
        <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#84cc16", display: "inline-block", boxShadow: "0 0 8px rgba(132,204,22,0.6)" }} />
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.68rem", letterSpacing: "0.22em", textTransform: "uppercase", opacity: 0.5 }}>
          05 — Contact
        </span>
      </div>

      {/* Three-column layout */}
      <div
        className="contact-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "1.4fr 0.7fr 0.85fr",
          gap: "3rem",
          alignItems: "start",
        }}
      >
        {/* ── LEFT: LET'S CONNECT ── */}
        <div>
          {/* Heading */}
          <div style={{
            opacity: inView ? 1 : 0,
            transform: inView ? "translateY(0)" : "translateY(24px)",
            transition: "opacity 0.7s ease 0.05s, transform 0.7s cubic-bezier(0.23,1,0.32,1) 0.05s",
          }}>
            <div style={{
              fontSize: "clamp(3.5rem, 7vw, 6rem)",
              fontWeight: 900,
              lineHeight: 0.95,
              letterSpacing: "-0.04em",
              marginBottom: "0.1em",
              color: "rgba(255,255,255,0.95)",
            }}>
              LET'S
            </div>
            <div style={{
              fontSize: "clamp(3.5rem, 7vw, 6rem)",
              fontWeight: 900,
              lineHeight: 0.95,
              letterSpacing: "-0.04em",
              fontStyle: "italic",
              color: "transparent",
              WebkitTextStroke: "2px rgba(255,255,255,0.85)",
              marginBottom: "1.5rem",
            }}>
              CONNECT.
            </div>
          </div>

          {/* Tagline */}
          <p style={{
            fontSize: "0.95rem",
            lineHeight: 1.7,
            color: "rgba(255,255,255,0.45)",
            maxWidth: "420px",
            margin: 0,
            opacity: inView ? 1 : 0,
            transform: inView ? "translateY(0)" : "translateY(16px)",
            transition: "opacity 0.7s ease 0.2s, transform 0.7s cubic-bezier(0.23,1,0.32,1) 0.2s",
          }}>
            Feel free to reach out for collaborations, software engineering discussions, or just to say hello. Always open to exploring new opportunities.
          </p>
        </div>

        {/* ── MIDDLE: SITEMAP ── */}
        <div>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.62rem",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            opacity: 0.35,
            marginBottom: "1.4rem",
            borderLeft: "2px solid rgba(255,255,255,0.2)",
            paddingLeft: "0.7rem",
            transition: "opacity 0.6s ease 0.1s",
          }}>
            Sitemap
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.6rem" }}>
            <SitemapLink label="About" href="#about" delay={0.15} inView={inView} />
            <SitemapLink label="Projects" href="#projects" delay={0.2} inView={inView} />
            <SitemapLink label="Experience" href="#experience" delay={0.25} inView={inView} />
            <SitemapLink label="Skills" href="#skills" delay={0.3} inView={inView} />
            <SitemapLink label="Certificates" href="#certificates" delay={0.35} inView={inView} />
          </div>
        </div>

        {/* ── RIGHT: NETWORKS ── */}
        <div>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.62rem",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            opacity: inView ? 0.35 : 0,
            marginBottom: "1.4rem",
            borderLeft: "2px solid rgba(255,255,255,0.2)",
            paddingLeft: "0.7rem",
            transition: "opacity 0.6s ease 0.1s",
          }}>
            Networks
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <NetworkBtn
              icon={<EmailIcon />}
              label="Email"
              href="mailto:heinhtetphyo56@gmail.com"
              delay={0.15}
              inView={inView}
            />
            <NetworkBtn
              icon={<GitHubIcon />}
              label="GitHub"
              href="https://github.com/HeinHtet-Phyo"
              delay={0.22}
              inView={inView}
            />
            <NetworkBtn
              icon={<LinkedInIcon />}
              label="LinkedIn"
              href="https://linkedin.com/in/hein-htet-phyo"
              delay={0.29}
              inView={inView}
            />
            <NetworkBtn
              icon={<DiscordIcon />}
              label="Discord"
              sub="@heinhtetphyo"
              href="https://discord.com"
              delay={0.36}
              inView={inView}
            />
          </div>
        </div>
      </div>



      <style>{`
        @media (max-width: 900px) {
          .contact-grid {
            grid-template-columns: 1fr 1fr !important;
            gap: 2.5rem !important;
          }
          .contact-grid > div:first-child {
            grid-column: 1 / -1;
          }
        }
        @media (max-width: 600px) {
          .contact-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
