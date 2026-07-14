// FooterSection — strict black-and-white theme
// Social icons row, HEIN wordmark, copyright, Made with London
// Monochrome outline icons, soft white glow on hover

import { useState } from "react";

// ── Social Icons ──────────────────────────────────────────────────────────────
function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
    </svg>
  );
}
function LinkedInIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
      <rect x="2" y="9" width="4" height="12"/>
      <circle cx="4" cy="4" r="2"/>
    </svg>
  );
}
function InstagramIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
    </svg>
  );
}
function GitHubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
    </svg>
  );
}
function MailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2"/>
      <path d="M2 7l10 7 10-7"/>
    </svg>
  );
}

function SocialBtn({ href, children, label }: { href: string; children: React.ReactNode; label: string }) {
  const [hovered, setHovered] = useState(false);
  return (
    <a
      href={href}
      target={href.startsWith("mailto") ? "_self" : "_blank"}
      rel="noopener noreferrer"
      aria-label={label}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: "40px",
        height: "40px",
        borderRadius: "50%",
        border: hovered ? "1px solid rgba(255,255,255,0.45)" : "1px solid rgba(255,255,255,0.15)",
        background: hovered ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: hovered ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.5)",
        boxShadow: hovered ? "0 0 14px rgba(255,255,255,0.1)" : "none",
        transition: "border-color 0.22s ease, background 0.22s ease, color 0.22s ease, box-shadow 0.22s ease, transform 0.15s ease",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        textDecoration: "none",
        flexShrink: 0,
      }}
      className="footer-social-btn"
    >
      {children}
    </a>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────
export default function FooterSection() {
  return (
    <footer
      style={{
        position: "relative",
        zIndex: 1,
        borderTop: "1px solid rgba(255,255,255,0.07)",
        padding: "2.5rem 8vw",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "1.5rem",
      }}
      className="footer-section"
    >
      {/* Social icons row */}
      <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
        <SocialBtn href="https://facebook.com/" label="Facebook">
          <FacebookIcon />
        </SocialBtn>
        <SocialBtn href="https://linkedin.com/in/hein-htet-phyo" label="LinkedIn">
          <LinkedInIcon />
        </SocialBtn>
        <SocialBtn href="https://instagram.com/" label="Instagram">
          <InstagramIcon />
        </SocialBtn>
        <SocialBtn href="https://github.com/HeinHtet-Phyo" label="GitHub">
          <GitHubIcon />
        </SocialBtn>
        <SocialBtn href="mailto:heinhtetphyo56@gmail.com" label="Email">
          <MailIcon />
        </SocialBtn>
      </div>

      {/* Wordmark */}
      <div style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "1.1rem",
        fontWeight: 700,
        letterSpacing: "0.35em",
        textTransform: "uppercase",
        opacity: 0.18,
      }}>
        HEIN
      </div>

      {/* Copyright */}
      <div style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "0.68rem",
        letterSpacing: "0.06em",
        opacity: 0.35,
        textAlign: "center",
      }}>
        © 2026 Hein Htet Phyo. All rights reserved.
      </div>

      {/* Made with */}
      <div style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "0.65rem",
        opacity: 0.25,
        display: "flex",
        alignItems: "center",
        gap: "0.35rem",
        letterSpacing: "0.04em",
      }}>
        Made with
        <span style={{ opacity: 0.7, fontSize: "0.75rem" }}>♥</span>
        in London, UK
      </div>

      <style>{`
        .light .footer-section {
          border-top-color: rgba(0,0,0,0.08) !important;
        }
        .light .footer-social-btn {
          border-color: rgba(0,0,0,0.15) !important;
          background: rgba(0,0,0,0.03) !important;
          color: rgba(0,0,0,0.45) !important;
        }
        .light .footer-social-btn:hover {
          border-color: rgba(0,0,0,0.35) !important;
          background: rgba(0,0,0,0.07) !important;
          color: rgba(0,0,0,0.85) !important;
          box-shadow: 0 0 14px rgba(0,0,0,0.07) !important;
        }
      `}</style>
    </footer>
  );
}
