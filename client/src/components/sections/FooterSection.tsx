// FooterSection — three-column bar: name (left), social icons (centre),
// copyright (right).

import { useState } from "react";

// ── Icons ─────────────────────────────────────────────────────────────────────
// 20px line-art, inheriting `currentColor` so the link controls the colour.
function GitHubIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M2 7l10 7 10-7" />
    </svg>
  );
}

const SOCIALS = [
  { label: "GitHub", href: "https://github.com/HeinHtet-Phyo", Icon: GitHubIcon },
  { label: "LinkedIn", href: "https://linkedin.com/in/hein-htet-phyo", Icon: LinkedInIcon },
  { label: "Email", href: "mailto:heinhtetphyo56@gmail.com", Icon: MailIcon },
];

function SocialLink({ href, label, children }: {
  href: string; label: string; children: React.ReactNode;
}) {
  const [active, setActive] = useState(false);
  const isMail = href.startsWith("mailto:");
  return (
    <a
      href={href}
      aria-label={label}
      // mailto: must stay in the same tab — a new tab would open and
      // immediately blank once the mail client takes over.
      target={isMail ? "_self" : "_blank"}
      rel={isMail ? undefined : "noopener noreferrer"}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      // Focus mirrors hover so keyboard users get the same affordance.
      onFocus={() => setActive(true)}
      onBlur={() => setActive(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        color: active ? "#ffffff" : "rgba(255,255,255,0.5)",
        transition: "color 0.2s ease",
        textDecoration: "none",
      }}
      className="footer-social-link"
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
        // Transparent rather than an opaque #020008 fill: the starfield is
        // painted behind the page, and a solid background would cover it. The
        // page is already this black, so it reads the same.
        background: "transparent",
        borderTop: "1px solid rgba(255,255,255,0.1)",
        // 8vw matches ContactSection above (and Hero/Education), so the footer's
        // content edges line up with the rest of the page rather than sitting on
        // their own margin.
        padding: "38px 8vw",
        // Floor, not a fixed height: the row is 28px + content + 28px, so this
        // only takes effect if the content is shorter than 24px. Keeps the bar
        // from collapsing while still growing when the columns stack on mobile.
        minHeight: "80px",
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        alignItems: "center",
        gap: "1rem",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "13px",
      }}
      className="footer-section"
    >
      {/* ── Left: name ── */}
      <div className="footer-name" style={{ justifySelf: "start", color: "#ffffff", fontWeight: 600 }}>
        Hein Htet Phyo
      </div>

      {/* ── Centre: social icons ── */}
      <nav
        aria-label="Social links"
        style={{ justifySelf: "center", display: "flex", alignItems: "center", gap: "24px" }}
      >
        {SOCIALS.map(({ label, href, Icon }) => (
          <SocialLink key={label} href={href} label={label}>
            <Icon />
          </SocialLink>
        ))}
      </nav>

      {/* ── Right: copyright ── */}
      <div className="footer-copyright" style={{
        justifySelf: "end",
        textAlign: "right",
        color: "rgba(255,255,255,0.4)",
        fontSize: "12px",
      }}>
        © 2026 Hein Htet Phyo. All rights reserved.
      </div>

      <style>{`
        .light .footer-section {
          border-top-color: rgba(0,0,0,0.1) !important;
        }
        /* Explicit classes, not positional selectors. "> div:last-child" never
           matched: the <style> element below is the footer's actual last child,
           so no div satisfies :last-child and the copyright kept its dark-mode
           colour in light mode. */
        .light .footer-name      { color: #000000 !important; }
        .light .footer-copyright { color: #000000 !important; }
        .light .footer-social-link { color: rgba(0,0,0,0.6) !important; }
        .light .footer-social-link:hover,
        .light .footer-social-link:focus-visible { color: #000000 !important; }

        /* Single row by design; below 720px three columns cannot fit at 13px,
           so they stack rather than overflow the viewport. */
        @media (max-width: 720px) {
          .footer-section {
            grid-template-columns: 1fr !important;
            justify-items: center !important;
            gap: 1rem !important;
            padding: 24px !important;
          }
          .footer-section > * {
            justify-self: center !important;
            text-align: center !important;
          }
        }
      `}</style>
    </footer>
  );
}
