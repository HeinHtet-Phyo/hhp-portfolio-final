// ContactSection — matches the reference design
// Left: LET'S CONNECT heading + tagline
// Middle: SITEMAP links
// Right: NETWORKS buttons (GitHub, LinkedIn, Instagram, Email)

import { useState, useEffect, useRef } from "react";
import { Instagram } from "lucide-react";

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
  minHeight,
}: {
  icon: React.ReactNode;
  label: string;
  sub?: string;
  href: string;
  delay: number;
  inView: boolean;
  minHeight?: string;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`ct-net-row${hovered ? " is-hover" : ""}`}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0.9rem 1.1rem",
        minHeight,
        borderRadius: "6px",
        border: "1px solid rgba(255,255,255,0.3)",
        background: hovered ? "rgba(255,255,255,0.06)" : "transparent",
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
        <span className="ct-icon" style={{ opacity: 0.7, display: "flex", flexShrink: 0 }}>{icon}</span>
        <div>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.78rem",
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }} className="ct-net-label">
            {label}
          </div>
          {sub && (
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.58rem",
              opacity: 0.4,
              marginTop: "0.1rem",
            }} className="ct-net-sub">
              {sub}
            </div>
          )}
        </div>
      </div>
      <span className="ct-arrow" style={{
        color: "rgba(255,255,255,0.8)",
        opacity: hovered ? 1 : 0.7,
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
      className={`ct-link${hovered ? " is-hover" : ""}`}
      style={{
        display: "inline-flex",
        alignSelf: "flex-start",
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
      <span className="ct-link-marker" style={{
        width: "6px",
        height: "6px",
        borderRadius: "1px",
        background: hovered ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.15)",
        flexShrink: 0,
        transition: "background 0.2s",
        display: "inline-block",
      }} />
      <span
        className="ct-link-text"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {label}
      </span>
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
      style={{
        padding: "56px 8vw 120px 8vw", position: "relative", zIndex: 1, borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}
    >
    <div className="reveal px-4 md:px-0">
      {/* Top label */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "0.6rem",
        marginBottom: "84px",
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(12px)",
        transition: "opacity 0.6s ease, transform 0.6s ease",
      }}>
        <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#84cc16", display: "inline-block", boxShadow: "0 0 8px rgba(132,204,22,0.6)" }} />
        <span className="ct-label" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.68rem", letterSpacing: "0.22em", textTransform: "uppercase", color: "#ffffff" }}>
          07 — Contact
        </span>
      </div>

      {/* Three-column layout */}
      <div
        className="contact-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "1.55fr 1.4fr",
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
            }} className="ct-heading">
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
            }} className="ct-outline">
              CONNECT.
            </div>
          </div>

          {/* Tagline */}
          <p className="ct-body" style={{
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

        {/* Wraps SITEMAP + NETWORKS so they can become a 2-col grid pair on
            mobile/tablet (see .contact-sitemap-networks in the style block)
            while staying `display:contents` on desktop — invisible to the box
            tree there, so the two divs below still land directly in
            .contact-grid's 1.4fr/0.7fr/0.85fr columns exactly as before. */}
        <div className="contact-sitemap-networks">
        {/* ── MIDDLE: SITEMAP ── */}
        <div className="ct-sitemap-column">
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
          }} className="ct-col-label">
            Sitemap
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.6rem" }}>
            <SitemapLink label="About" href="#about" delay={0.15} inView={inView} />
            <SitemapLink label="Projects" href="#projects" delay={0.2} inView={inView} />
            <SitemapLink label="Experience" href="#experience" delay={0.25} inView={inView} />
            <SitemapLink label="Education" href="#education" delay={0.3} inView={inView} />
            <SitemapLink label="Cert" href="#certificates" delay={0.35} inView={inView} />
          </div>
        </div>

        {/* ── RIGHT: NETWORKS ── */}
        <div className="ct-networks-column overflow-hidden">
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
          }} className="ct-col-label ct-networks-label">
            Networks
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <NetworkBtn
              icon={<GitHubIcon />}
              label="GitHub"
              href="https://github.com/HeinHtet-Phyo"
              delay={0.15}
              inView={inView}
            />
            <NetworkBtn
              icon={<LinkedInIcon />}
              label="LinkedIn"
              href="https://www.linkedin.com/in/hein-htet-phyo"
              delay={0.22}
              inView={inView}
            />
            <NetworkBtn
              icon={<Instagram size={20} />}
              label="Instagram"
              href="https://www.instagram.com/heinhtetphyo"
              delay={0.29}
              inView={inView}
            />
            <NetworkBtn
              icon={<EmailIcon />}
              label="Email"
              minHeight="58px"
              href="mailto:heinhtetphyo56@gmail.com"
              delay={0.36}
              inView={inView}
            />
          </div>
        </div>
        </div>
      </div>



      <style>{`
        /* ── Light mode ──────────────────────────────────────────────────────
           All colours here are inline styles, so overrides need !important.
           Several elements are also dimmed with opacity, which colour alone
           cannot undo — those reset opacity too. Dark mode is untouched. */
        .light .ct-label     { color: #000000 !important; opacity: 1 !important; }
        .light .ct-heading   { color: #000000 !important; }
        .light .ct-outline   { color: transparent !important; -webkit-text-stroke: 2px #000000 !important; }
        .light .ct-body      { color: #111111 !important; }
        .light .ct-col-label { color: rgba(0,0,0,0.5) !important; opacity: 1 !important; border-left-color: rgba(0,0,0,0.25) !important; }

        .light .ct-link          { color: rgba(0,0,0,0.45) !important; }
        .light .ct-link.is-hover { color: rgba(0,0,0,0.6) !important; }
        .light .ct-link-marker   { background: #888899 !important; }

        .light .ct-net-row {
          border-color: rgba(0, 0, 0, 0.25) !important;
          background: transparent !important;
        }
        .light .ct-net-label { color: #000000 !important; }
        .light .ct-net-sub   { color: rgba(0,0,0,0.4) !important; opacity: 1 !important; }
        .light .ct-icon      { color: #000000 !important; opacity: 1 !important; }
        .light .ct-arrow     { color: rgba(0,0,0,0.7) !important; }

        /* Theme-aware column bar, link underline, and network-card inversion. */
        .ct-networks-label { border-left-color: #ffffff !important; }
        .ct-net-row.is-hover {
          background: #ffffff !important;
          border-color: #ffffff !important;
          color: #000000 !important;
        }
        .ct-net-row.is-hover .ct-icon,
        .ct-net-row.is-hover .ct-net-label,
        .ct-net-row.is-hover .ct-net-sub,
        .ct-net-row.is-hover .ct-arrow {
          color: #000000 !important;
          opacity: 1 !important;
        }
        .ct-link-text {
          display: inline-block;
          border-bottom: 2px solid transparent;
          padding-bottom: 3px;
          transition: border-color 0.2s ease;
        }
        .ct-link.is-hover { color: #ffffff !important; }
        .ct-link.is-hover .ct-link-text { border-bottom-color: #ffffff; }
        .ct-link.is-hover .ct-link-marker { background: #ffffff !important; }
        .light .ct-networks-label { border-left-color: #000000 !important; }
        .light .ct-net-row.is-hover {
          background: #000000 !important;
          border-color: #000000 !important;
          color: #ffffff !important;
        }
        .light .ct-net-row.is-hover .ct-icon,
        .light .ct-net-row.is-hover .ct-net-label,
        .light .ct-net-row.is-hover .ct-net-sub,
        .light .ct-net-row.is-hover .ct-arrow {
          color: #ffffff !important;
          opacity: 1 !important;
        }
        .light .ct-link.is-hover { color: #000000 !important; }
        .light .ct-link.is-hover .ct-link-text { border-bottom-color: #000000; }
        .light .ct-link.is-hover .ct-link-marker { background: #000000 !important; }

        /* Below 1024px: invisible to the box tree, so .contact-grid sees the
           SITEMAP/NETWORKS divs directly and lays them out exactly as before. */
        .contact-sitemap-networks { display: contents; }
        @media (min-width: 1024px) {
          /* SITEMAP and NETWORKS sit close together as a narrow, centred pair
             instead of being pushed toward the page edges. */
          .contact-sitemap-networks {
            display: grid;
            grid-template-columns: auto 200px;
            gap: 4.5rem;
            max-width: 48rem;
            margin-left: auto;
            margin-right: 0;
          }
          .ct-sitemap-column { width: auto; }
          .ct-networks-column { width: 200px; max-width: 200px; }
          .ct-net-row { width: 100%; max-width: 200px; padding: 0.78rem 0.9rem !important; }
        }
        /* Tablet and below: single column overall; SITEMAP + NETWORKS become a
           real 2-col grid pair (grid-cols-2) below the full-width heading. */
        @media (max-width: 1023px) {
          .contact-grid {
            grid-template-columns: 1fr !important;
            gap: 2.5rem !important;
          }
          .contact-grid > div:first-child {
            grid-column: 1 / -1;
          }
          .contact-sitemap-networks {
            display: grid !important;
            grid-template-columns: 1fr 1.4fr !important;
            gap: 2rem !important;
            margin-top: 3rem !important;
          }
          .ct-net-row {
            width: 100% !important;
            box-sizing: border-box !important;
            min-height: 56px !important;
          }
          .ct-body {
            max-width: 500px !important;
          }
        }
        /* Mobile: heading shrinks further so it never risks overflowing at 320px. */
        @media (max-width: 767px) {
          .ct-heading, .ct-outline {
            font-size: clamp(2rem, 12vw, 3.5rem) !important;
          }
        }
      `}</style>
    </div>
    </section>
  );
}
