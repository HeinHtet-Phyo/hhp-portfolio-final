// Hero Section — Split layout: left text + right terminal code window
// Inspired by reference: left has name/title/bio/buttons/socials
// Right has a macOS-style terminal window showing developer info as JS object
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, Mail, Github, Linkedin, Twitter } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";

// ── Typing Role ──
const ROLES = ["Data Scientist", "AI Engineer", "ML Engineer", "Software Engineer"];

function TypingRole({ isDark }: { isDark: boolean }) {
  const [roleIdx, setRoleIdx] = useState(0);
  const [text, setText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const role = ROLES[roleIdx];
    let t: ReturnType<typeof setTimeout>;
    if (!deleting && text.length < role.length) {
      t = setTimeout(() => setText(role.slice(0, text.length + 1)), 80);
    } else if (!deleting && text.length === role.length) {
      t = setTimeout(() => setDeleting(true), 2200);
    } else if (deleting && text.length > 0) {
      t = setTimeout(() => setText(text.slice(0, -1)), 40);
    } else {
      setDeleting(false);
      setRoleIdx((i) => (i + 1) % ROLES.length);
    }
    return () => clearTimeout(t);
  }, [text, deleting, roleIdx]);

  return (
    <span style={{ color: isDark ? "rgba(255,255,255,0.9)" : "#0a0a0a" }}>
      {text}<span className="typing-cursor" style={{ color: isDark ? "rgba(255,255,255,0.9)" : "#0a0a0a" }} />
    </span>
  );
}

// ── Terminal Code Window ──
function TerminalWindow({ isDark, revealed, animated }: { isDark: boolean; revealed: boolean; animated: boolean }) {
  const [visibleLines, setVisibleLines] = useState(0);

  // Each line: array of {text, color} spans for syntax highlighting
  const lines: { spans: { text: string; color: string }[] }[] = [
    { spans: [
      { text: "developer", color: isDark ? "rgba(255,255,255,0.90)" : "rgba(10,10,10,0.92)" },
      { text: " = {", color: isDark ? "rgba(255,255,255,0.60)" : "rgba(10,10,10,0.65)" },
    ]},
    { spans: [
      { text: "    ", color: isDark ? "rgba(255,255,255,0.90)" : "rgba(10,10,10,0.92)" },
      { text: '"name"', color: isDark ? "rgba(255,255,255,0.90)" : "rgba(10,10,10,0.92)" },
      { text: ": ", color: isDark ? "rgba(255,255,255,0.60)" : "rgba(10,10,10,0.65)" },
      { text: '"Hein Htet Phyo"', color: isDark ? "#4ade80" : "#22c55e" },
      { text: ",", color: isDark ? "rgba(255,255,255,0.40)" : "rgba(10,10,10,0.55)" },
    ]},
    { spans: [
      { text: "    ", color: isDark ? "rgba(255,255,255,0.90)" : "rgba(10,10,10,0.92)" },
      { text: '"location"', color: isDark ? "rgba(255,255,255,0.90)" : "rgba(10,10,10,0.92)" },
      { text: ": ", color: isDark ? "rgba(255,255,255,0.60)" : "rgba(10,10,10,0.65)" },
      { text: '"London, UK"', color: isDark ? "#4ade80" : "#22c55e" },
      { text: ",", color: isDark ? "rgba(255,255,255,0.40)" : "rgba(10,10,10,0.55)" },
    ]},
    { spans: [
      { text: "    ", color: isDark ? "rgba(255,255,255,0.90)" : "rgba(10,10,10,0.92)" },
      { text: '"degree"', color: isDark ? "rgba(255,255,255,0.90)" : "rgba(10,10,10,0.92)" },
      { text: ": ", color: isDark ? "rgba(255,255,255,0.60)" : "rgba(10,10,10,0.65)" },
      { text: '"BSc Data Science & AI"', color: isDark ? "#4ade80" : "#22c55e" },
      { text: ",", color: isDark ? "rgba(255,255,255,0.40)" : "rgba(10,10,10,0.55)" },
    ]},
    { spans: [
      { text: "    ", color: isDark ? "rgba(255,255,255,0.90)" : "rgba(10,10,10,0.92)" },
      { text: '"university"', color: isDark ? "rgba(255,255,255,0.90)" : "rgba(10,10,10,0.92)" },
      { text: ": ", color: isDark ? "rgba(255,255,255,0.60)" : "rgba(10,10,10,0.65)" },
      { text: '"UWE Bristol"', color: isDark ? "#4ade80" : "#22c55e" },
      { text: ",", color: isDark ? "rgba(255,255,255,0.40)" : "rgba(10,10,10,0.55)" },
    ]},
    { spans: [
      { text: "    ", color: isDark ? "rgba(255,255,255,0.90)" : "rgba(10,10,10,0.92)" },
      { text: '"open_to"', color: isDark ? "rgba(255,255,255,0.90)" : "rgba(10,10,10,0.92)" },
      { text: ": [", color: isDark ? "rgba(255,255,255,0.60)" : "rgba(10,10,10,0.65)" },
    ]},
    { spans: [
      { text: "        ", color: isDark ? "rgba(255,255,255,0.90)" : "rgba(10,10,10,0.92)" },
      { text: '"AI Engineer"', color: isDark ? "#4ade80" : "#22c55e" },
      { text: ",", color: isDark ? "rgba(255,255,255,0.40)" : "rgba(10,10,10,0.55)" },
    ]},
    { spans: [
      { text: "        ", color: isDark ? "rgba(255,255,255,0.90)" : "rgba(10,10,10,0.92)" },
      { text: '"Data Scientist"', color: isDark ? "#4ade80" : "#22c55e" },
      { text: ",", color: isDark ? "rgba(255,255,255,0.40)" : "rgba(10,10,10,0.55)" },
    ]},
    { spans: [
      { text: "        ", color: isDark ? "rgba(255,255,255,0.90)" : "rgba(10,10,10,0.92)" },
      { text: '"ML Engineer"', color: isDark ? "#4ade80" : "#22c55e" },
      { text: ",", color: isDark ? "rgba(255,255,255,0.40)" : "rgba(10,10,10,0.55)" },
    ]},
    { spans: [
      { text: "    ", color: isDark ? "rgba(255,255,255,0.90)" : "rgba(10,10,10,0.92)" },
      { text: "],", color: isDark ? "rgba(255,255,255,0.60)" : "rgba(10,10,10,0.65)" },
    ]},
    { spans: [
      { text: "    ", color: isDark ? "rgba(255,255,255,0.90)" : "rgba(10,10,10,0.92)" },
      { text: '"seeking"', color: isDark ? "rgba(255,255,255,0.90)" : "rgba(10,10,10,0.92)" },
      { text: ": ", color: isDark ? "rgba(255,255,255,0.60)" : "rgba(10,10,10,0.65)" },
      { text: '"Full-time roles in AI & Data"', color: isDark ? "#4ade80" : "#22c55e" },
      { text: ",", color: isDark ? "rgba(255,255,255,0.40)" : "rgba(10,10,10,0.55)" },
    ]},
    { spans: [
      { text: "    ", color: isDark ? "rgba(255,255,255,0.90)" : "rgba(10,10,10,0.92)" },
      { text: '"focus"', color: isDark ? "rgba(255,255,255,0.90)" : "rgba(10,10,10,0.92)" },
      { text: ": ", color: isDark ? "rgba(255,255,255,0.60)" : "rgba(10,10,10,0.65)" },
      { text: '"Machine Learning & AI, Software Development"', color: isDark ? "#4ade80" : "#22c55e" },
      { text: ",", color: isDark ? "rgba(255,255,255,0.40)" : "rgba(10,10,10,0.55)" },
    ]},
    { spans: [
      { text: "    ", color: isDark ? "rgba(255,255,255,0.90)" : "rgba(10,10,10,0.92)" },
      { text: '"status"', color: isDark ? "rgba(255,255,255,0.90)" : "rgba(10,10,10,0.92)" },
      { text: ": ", color: isDark ? "rgba(255,255,255,0.60)" : "rgba(10,10,10,0.65)" },
      { text: '"Open to work 🚀"', color: isDark ? "#4ade80" : "#22c55e" },
      { text: ",", color: isDark ? "rgba(255,255,255,0.40)" : "rgba(10,10,10,0.55)" },
    ]},
    { spans: [
      { text: "}", color: isDark ? "rgba(255,255,255,0.60)" : "rgba(10,10,10,0.65)" },
    ]},
  ];

  // Reveal the code lines one by one, starting 400ms after the right panel itself
  // fades in (animated === true, ~2200ms from load), 150ms apart, until all lines
  // are shown.
  useEffect(() => {
    if (!animated) return;
    let interval: ReturnType<typeof setInterval> | undefined;
    const start = setTimeout(() => {
      interval = setInterval(() => {
        setVisibleLines((n) => {
          if (n >= lines.length - 1) {
            if (interval) clearInterval(interval);
            return lines.length;
          }
          return n + 1;
        });
      }, 150);
    }, 400);
    return () => { clearTimeout(start); if (interval) clearInterval(interval); };
  }, [animated, lines.length]);

  return (
    <motion.div
      className="hero-terminal-card"
      initial={{ opacity: 0, x: 40, y: 20 }}
      animate={revealed ? { opacity: 1, x: 0, y: 0 } : {}}
      transition={{ duration: 0.9, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
      style={{
        background: isDark ? "rgba(5,5,10,0.88)" : "rgba(232,234,238,0.98)",
        border: isDark ? "1px solid rgba(255,255,255,0.10)" : "1px solid rgba(0,0,0,0.10)",
        borderRadius: "12px",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        boxShadow: isDark
          ? "0 0 0 1px rgba(255,255,255,0.05), 0 30px 80px rgba(0,0,0,0.7), 0 0 60px rgba(255,255,255,0.02) inset"
          : "0 0 0 1px rgba(0,0,0,0.06), 0 20px 60px rgba(0,0,0,0.12)",
        overflow: "hidden",
        width: "100%",
        maxWidth: 560,
        position: "relative" as const,
      }}
    >
      {/* Title bar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 16px",
        borderBottom: isDark ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(0,0,0,0.07)",
        background: isDark ? "rgba(255,255,255,0.025)" : "rgba(0,0,0,0.03)",
      }}>
        <div style={{ display: "flex", gap: 7 }}>
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ff5f57" }} />
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#febc2e" }} />
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#28c840" }} />
        </div>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "0.7rem", color: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)",
          letterSpacing: "0.05em",
        }}>portfolio.py</span>
        <div style={{ width: 52 }} />
      </div>

      {/* Code content */}
      <div className="hero-terminal-code" style={{
        padding: "22px 28px 26px",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "clamp(0.65rem, 1.15vw, 0.77rem)",
        lineHeight: 1.7,
      }}>
        {lines.map((line, i) => (
          <div key={i} style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", opacity: i < visibleLines ? 1 : 0, transition: 'opacity 0.2s ease' }}>
            <span style={{ color: isDark ? "rgba(255,255,255,0.18)" : "rgba(10,10,10,0.35)", marginRight: 16, userSelect: "none", fontSize: "0.65rem" }}>
              {String(i + 1).padStart(2, "0")}
            </span>
            {line.spans.map((span, j) => (
              <span key={j} style={{ color: span.color }}>{span.text}</span>
            ))}
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ── Main Hero ──
export default function HeroSection() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [revealed, setRevealed] = useState(false);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 200);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 1800);
    return () => clearTimeout(timer);
  }, []);

  const fadeUp = (delay: number) => ({
    initial: { opacity: 0, y: 24 },
    animate: revealed ? { opacity: 1, y: 0 } : {},
    transition: { duration: 0.75, delay, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  });

  return (
    <section
      id="hero"
      style={{
        position: "relative", zIndex: 2,
        minHeight: "100vh",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "80px 8vw 0",
      }}
    >
      <div style={{
        width: "100%",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "clamp(2rem, 5vw, 6rem)",
        alignItems: "center",
      }}
      className="hero-grid"
      >
        {/* ── LEFT: Text ── */}
        <div
          className={`hero-left ${animated ? 'hero-left-visible' : 'hero-left-hidden'}`}
          style={{ display: "flex", flexDirection: "column", gap: "1.25rem", overflow: "visible", minWidth: 0 }}>

          {/* Available badge */}
          <motion.div {...fadeUp(0.1)} style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
            <div className="hero-available-pill" style={{
              display: "inline-flex", alignItems: "center", gap: "0.5rem",
              padding: "0.35rem 0.9rem",
              border: `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)"}`,
              borderRadius: 999,
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.7rem", letterSpacing: "0.08em",
              color: isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.55)",
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 6px #22c55e", display: "inline-block" }} />
              Available for opportunities
            </div>
          </motion.div>

          {/* Name */}
          <div>
            <motion.div className="hero-name-line" {...fadeUp(0.2)} style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: "clamp(3.75rem, 8.5vw, 7.5rem)",
              fontWeight: 900, lineHeight: 0.92,
              letterSpacing: "-0.03em",
              color: isDark ? "white" : "#0a0a0a",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
            }}>
              Hein Htet
            </motion.div>
            <motion.div className="hero-name-line" {...fadeUp(0.28)} style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: "clamp(3.75rem, 8.5vw, 7.5rem)",
              fontWeight: 900, lineHeight: 0.92,
              letterSpacing: "-0.03em",
              WebkitTextStroke: isDark ? "2px white" : "2px #0a0a0a",
              color: "transparent",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
            }}>
              Phyo
            </motion.div>
          </div>

          {/* Typing role */}
          <motion.p className="hero-subtitle" {...fadeUp(0.36)} style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "clamp(1rem, 2.2vw, 1.25rem)",
            fontWeight: 600,
            color: isDark ? "rgba(255,255,255,0.85)" : "#1e293b",
            overflow: "visible",
            whiteSpace: "nowrap",
            display: "block",
            minWidth: 0,
          }}>
            <TypingRole isDark={isDark} />
          </motion.p>

          {/* Bio */}
          <motion.p className="hero-bio-text" {...fadeUp(0.44)} style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: "clamp(0.95rem, 1.75vw, 1.1rem)",
            lineHeight: 1.8, fontWeight: 300,
            color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.55)",
            maxWidth: 520,
          }}>
            BSc Data Science & AI — UWE Bristol. Specialising in machine learning,
            deep learning, and building intelligent systems that solve real problems.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div className="hero-cta-row" {...fadeUp(0.52)} style={{ display: "flex", gap: "0.875rem", flexWrap: "wrap" }}>
            <motion.button
              className="hero-cta-btn"
              onClick={() => document.getElementById("projects")?.scrollIntoView({ behavior: "smooth" })}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              style={{
                display: "flex", alignItems: "center", gap: "0.5rem",
                padding: "0.75rem 1.5rem",
                background: isDark ? "white" : "#0a0a0a",
                color: isDark ? "black" : "white", border: "none",
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: "0.95rem", fontWeight: 700,
                letterSpacing: "0.04em", cursor: "pointer",
                borderRadius: "6px",
              }}
            >
              View Projects <ArrowUpRight size={15} />
            </motion.button>

            <motion.a
              className="hero-cta-btn"
              href="mailto:heinhtetphyo@email.com"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              style={{
                display: "flex", alignItems: "center", gap: "0.5rem",
                padding: "0.75rem 1.5rem",
                background: "transparent",
                color: isDark ? "rgba(255,255,255,0.8)" : "#1e293b",
                border: `1px solid ${isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)"}`,
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: "0.95rem", fontWeight: 600,
                letterSpacing: "0.04em", cursor: "pointer",
                borderRadius: "6px", textDecoration: "none",
              }}
            >
              Let's Talk <Mail size={15} />
            </motion.a>
          </motion.div>

          {/* Social Links */}
          <motion.div className="hero-social-row" {...fadeUp(0.60)} style={{ display: "flex", gap: "0.75rem", marginTop: "0.25rem" }}>
            {[
              { icon: Github, href: "https://github.com/heinhtetphyo", label: "GitHub" },
              { icon: Linkedin, href: "https://linkedin.com/in/heinhtetphyo", label: "LinkedIn" },
              { icon: Twitter, href: "https://twitter.com/heinhtetphyo", label: "Twitter" },
              { icon: Mail, href: "mailto:heinhtetphyo@email.com", label: "Email" },
            ].map(({ icon: Icon, href, label }) => (
              <motion.a
                key={label}
                className="hero-social-icon"
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.95 }}
                title={label}
                style={{
                  width: 40, height: 40, borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  border: `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)"}`,
                  background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
                  color: isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.55)",
                  textDecoration: "none", transition: "all 0.2s",
                }}
              >
                <Icon size={16} />
              </motion.a>
            ))}
          </motion.div>
        </div>

        {/* ── RIGHT: Terminal Window ── */}
        <div
          className={`hero-terminal ${animated ? 'hero-right-visible' : 'hero-right-hidden'}`}
          style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", transitionDelay: animated ? '0.4s' : '0s' }}
        >
          <TerminalWindow isDark={isDark} revealed={revealed} animated={animated} />
        </div>
      </div>

      {/* Responsive styles */}
      <style>{`
        /* Laptop (1024-1279px): slightly smaller heading, keep the two-column grid */
        @media (max-width: 1279px) and (min-width: 1024px) {
          .hero-name-line {
            font-size: clamp(3.5rem, 7.5vw, 6.25rem) !important;
          }
        }
        /* Tablet and below: stack into a single column */
        @media (max-width: 1023px) {
          .hero-grid {
            grid-template-columns: 1fr !important;
          }
        }
        /* Tablet and below: centre everything (text, pill, buttons, socials, terminal) —
           a single text-align + flex justify-content pass on the containers, rather than
           centring each element individually. */
        @media (max-width: 1023px) {
          .hero-left {
            text-align: center;
            align-items: center;
          }
          .hero-cta-row,
          .hero-social-row {
            justify-content: center !important;
          }
          .hero-terminal {
            justify-content: center !important;
          }
        }
        /* Tablet (768-1023px): terminal stays visible, big centred heading */
        @media (max-width: 1023px) and (min-width: 768px) {
          .hero-name-line {
            font-size: clamp(5rem, 12vw, 9rem) !important;
          }
          .hero-subtitle {
            font-size: 1.5rem !important;
          }
          .hero-bio-text {
            max-width: 600px !important;
            margin-left: auto !important;
            margin-right: auto !important;
          }
          .hero-cta-row {
            gap: 1rem !important;
          }
          .hero-terminal-card {
            width: 100% !important;
            max-width: 680px !important;
            margin-left: auto !important;
            margin-right: auto !important;
            margin-top: 3rem !important;
          }
          .hero-terminal-code {
            font-size: 0.95rem !important;
            padding: 2rem !important;
          }
        }
        /* Mobile (<768px): terminal stays visible, full width, centred, readable text, side-by-side CTAs */
        @media (max-width: 767px) {
          .hero-name-line {
            font-size: clamp(3.5rem, 14vw, 6rem) !important;
          }
          .hero-bio-text {
            font-size: 0.9rem !important;
            padding-left: 1.5rem;
            padding-right: 1.5rem;
            max-width: none !important;
          }
          .hero-cta-row {
            gap: 0.75rem !important;
          }
          .hero-social-row {
            gap: 0.5rem !important;
          }
          .hero-social-icon {
            width: 34px !important;
            height: 34px !important;
          }
          .hero-available-pill {
            width: 100% !important;
            justify-content: center !important;
            box-sizing: border-box;
          }
          .hero-terminal-card {
            width: 100% !important;
            max-width: 100% !important;
            margin-left: 1rem !important;
            margin-right: 1rem !important;
            margin-top: 2.5rem !important;
            box-sizing: border-box !important;
          }
          .hero-terminal-code {
            font-size: 0.75rem !important;
            padding: 1.5rem !important;
          }
        }
      `}</style>
    </section>
  );
}
