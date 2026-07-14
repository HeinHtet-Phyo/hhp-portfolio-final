/*
 * FooterSection — Motionfolio-inspired
 * Layout: thin bar — copyright text LEFT | social icon row RIGHT
 * Separated by a top border line
 */

import { useState } from "react";

function GitHubIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
    </svg>
  );
}
function LinkedInIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
      <rect x="2" y="9" width="4" height="12"/>
      <circle cx="4" cy="4" r="2"/>
    </svg>
  );
}
function MailIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2"/>
      <path d="M2 7l10 7 10-7"/>
    </svg>
  );
}

function FooterIconLink({ href, children, label }: { href: string; children: React.ReactNode; label: string }) {
  const [hov, setHov] = useState(false);
  return (
    <a
      href={href}
      target={href.startsWith("mailto") ? "_self" : "_blank"}
      rel="noopener noreferrer"
      aria-label={label}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: hov ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.45)",
        transition: "color 0.2s ease, transform 0.15s ease",
        transform: hov ? "translateY(-2px)" : "translateY(0)",
        textDecoration: "none",
      }}
    >
      {children}
    </a>
  );
}

export default function FooterSection() {
  return (
    <footer
      style={{
        position: "relative",
        zIndex: 1,
        borderTop: "1px solid rgba(255,255,255,0.1)",
        padding: "1.4rem 8vw",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1rem",
        flexWrap: "wrap",
      }}
      className="footer-section"
    >
      {/* Left — copyright */}
      <div style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "0.72rem",
        letterSpacing: "0.06em",
        opacity: 0.45,
        whiteSpace: "nowrap",
      }}>
        Copyright © 2026 | All rights reserved.
      </div>

      {/* Right — social icons */}
      <div style={{ display: "flex", alignItems: "center", gap: "1.4rem" }}>
        <FooterIconLink href="https://github.com/HeinHtet-Phyo" label="GitHub">
          <GitHubIcon />
        </FooterIconLink>
        <FooterIconLink href="https://linkedin.com/in/hein-htet-phyo" label="LinkedIn">
          <LinkedInIcon />
        </FooterIconLink>
        <FooterIconLink href="mailto:heinhtetphyo56@gmail.com" label="Email">
          <MailIcon />
        </FooterIconLink>
      </div>

      <style>{`
        .light .footer-section {
          border-top-color: rgba(0,0,0,0.1) !important;
        }
      `}</style>
    </footer>
  );
}
