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
function TerminalWindow({ isDark, revealed }: { isDark: boolean; revealed: boolean }) {
  const [linesDone, setLinesDone] = useState(0);

  // Each line: array of {text, color} spans for syntax highlighting
  const lines: { spans: { text: string; color: string }[] }[] = [
    { spans: [
      { text: "developer", color: "rgba(255,255,255,0.90)" },
      { text: " = {", color: "rgba(255,255,255,0.60)" },
    ]},
    { spans: [
      { text: "    ", color: "rgba(255,255,255,0.90)" },
      { text: '"name"', color: "rgba(255,255,255,0.90)" },
      { text: ": ", color: "rgba(255,255,255,0.60)" },
      { text: '"Hein Htet Phyo"', color: "#4ade80" },
      { text: ",", color: "rgba(255,255,255,0.40)" },
    ]},
    { spans: [
      { text: "    ", color: "rgba(255,255,255,0.90)" },
      { text: '"location"', color: "rgba(255,255,255,0.90)" },
      { text: ": ", color: "rgba(255,255,255,0.60)" },
      { text: '"London, UK"', color: "#4ade80" },
      { text: ",", color: "rgba(255,255,255,0.40)" },
    ]},
    { spans: [
      { text: "    ", color: "rgba(255,255,255,0.90)" },
      { text: '"degree"', color: "rgba(255,255,255,0.90)" },
      { text: ": ", color: "rgba(255,255,255,0.60)" },
      { text: '"BSc Data Science & AI"', color: "#4ade80" },
      { text: ",", color: "rgba(255,255,255,0.40)" },
    ]},
    { spans: [
      { text: "    ", color: "rgba(255,255,255,0.90)" },
      { text: '"university"', color: "rgba(255,255,255,0.90)" },
      { text: ": ", color: "rgba(255,255,255,0.60)" },
      { text: '"UWE Bristol"', color: "#4ade80" },
      { text: ",", color: "rgba(255,255,255,0.40)" },
    ]},
    { spans: [
      { text: "    ", color: "rgba(255,255,255,0.90)" },
      { text: '"open_to"', color: "rgba(255,255,255,0.90)" },
      { text: ": [", color: "rgba(255,255,255,0.60)" },
    ]},
    { spans: [
      { text: "        ", color: "rgba(255,255,255,0.90)" },
      { text: '"AI Engineer"', color: "#4ade80" },
      { text: ",", color: "rgba(255,255,255,0.40)" },
    ]},
    { spans: [
      { text: "        ", color: "rgba(255,255,255,0.90)" },
      { text: '"Data Scientist"', color: "#4ade80" },
      { text: ",", color: "rgba(255,255,255,0.40)" },
    ]},
    { spans: [
      { text: "        ", color: "rgba(255,255,255,0.90)" },
      { text: '"ML Engineer"', color: "#4ade80" },
      { text: ",", color: "rgba(255,255,255,0.40)" },
    ]},
    { spans: [
      { text: "    ", color: "rgba(255,255,255,0.90)" },
      { text: "],", color: "rgba(255,255,255,0.60)" },
    ]},
    { spans: [
      { text: "    ", color: "rgba(255,255,255,0.90)" },
      { text: '"seeking"', color: "rgba(255,255,255,0.90)" },
      { text: ": ", color: "rgba(255,255,255,0.60)" },
      { text: '"Full-time roles in AI & Data"', color: "#4ade80" },
      { text: ",", color: "rgba(255,255,255,0.40)" },
    ]},
    { spans: [
      { text: "    ", color: "rgba(255,255,255,0.90)" },
      { text: '"status"', color: "rgba(255,255,255,0.90)" },
      { text: ": ", color: "rgba(255,255,255,0.60)" },
      { text: '"Open to work 🚀"', color: "#4ade80" },
      { text: ",", color: "rgba(255,255,255,0.40)" },
    ]},
    { spans: [
      { text: "}", color: "rgba(255,255,255,0.60)" },
    ]},
  ];

  useEffect(() => {
    if (!revealed) return;
    if (linesDone >= lines.length) return;
    const t = setTimeout(() => setLinesDone((n) => n + 1), 90);
    return () => clearTimeout(t);
  }, [revealed, linesDone, lines.length]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 40, y: 20 }}
      animate={revealed ? { opacity: 1, x: 0, y: 0 } : {}}
      transition={{ duration: 0.9, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
      style={{
        background: "rgba(5,5,10,0.88)",
        border: "1px solid rgba(255,255,255,0.10)",
        borderRadius: "12px",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        boxShadow: "0 0 0 1px rgba(255,255,255,0.05), 0 30px 80px rgba(0,0,0,0.7), 0 0 60px rgba(255,255,255,0.02) inset",
        overflow: "hidden",
        width: "100%",
        maxWidth: 540,
        position: "relative" as const,
      }}
    >
      {/* Title bar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 16px",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        background: "rgba(255,255,255,0.025)",
      }}>
        <div style={{ display: "flex", gap: 7 }}>
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ff5f57" }} />
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#febc2e" }} />
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#28c840" }} />
        </div>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "0.7rem", color: "rgba(255,255,255,0.35)",
          letterSpacing: "0.05em",
        }}>portfolio.py</span>
        <div style={{ width: 52 }} />
      </div>

      {/* Code content */}
      <div style={{
        padding: "24px 32px 28px",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "clamp(0.55rem, 0.95vw, 0.62rem)",
        lineHeight: 1.6,
      }}>
        {lines.slice(0, linesDone).map((line, i) => (
          <div key={i} style={{ whiteSpace: "pre" }}>
            <span style={{ color: "rgba(255,255,255,0.18)", marginRight: 16, userSelect: "none", fontSize: "0.65rem" }}>
              {String(i + 1).padStart(2, "0")}
            </span>
            {line.spans.map((span, j) => (
              <span key={j} style={{ color: span.color }}>{span.text}</span>
            ))}
          </div>
        ))}
        {linesDone < lines.length && (
          <div style={{ color: "rgba(255,255,255,0.5)", whiteSpace: "pre" }}>
            <span style={{ color: "rgba(255,255,255,0.18)", marginRight: 16, userSelect: "none", fontSize: "0.65rem" }}>
              {String(linesDone + 1).padStart(2, "0")}
            </span>
            <span className="typing-cursor" style={{ color: "#60a5fa" }} />
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Main Hero ──
export default function HeroSection() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 200);
    return () => clearTimeout(t);
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
        display: "flex", alignItems: "center",
        padding: "0 clamp(1.5rem, 6vw, 5rem)",
      }}
    >
      <div style={{
        width: "100%", maxWidth: 1200, margin: "0 auto",
        display: "grid",
        gridTemplateColumns: "1fr 1.2fr",
        gap: "clamp(2rem, 5vw, 4rem)",
        alignItems: "center",
      }}
      className="hero-grid"
      >
        {/* ── LEFT: Text ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

          {/* Available badge */}
          <motion.div {...fadeUp(0.1)} style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
            <div style={{
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
            <motion.div {...fadeUp(0.2)} style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: "clamp(2.8rem, 7vw, 5.5rem)",
              fontWeight: 900, lineHeight: 0.95,
              letterSpacing: "-0.03em",
              color: isDark ? "white" : "#0a0a0a",
              textTransform: "uppercase",
            }}>
              Hein Htet
            </motion.div>
            <motion.div {...fadeUp(0.28)} style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: "clamp(2.8rem, 7vw, 5.5rem)",
              fontWeight: 900, lineHeight: 0.95,
              letterSpacing: "-0.03em",
              WebkitTextStroke: isDark ? "2px white" : "2px #0a0a0a",
              color: "transparent",
              textTransform: "uppercase",
            }}>
              Phyo
            </motion.div>
          </div>

          {/* Typing role */}
          <motion.p {...fadeUp(0.36)} style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "clamp(0.9rem, 2vw, 1.1rem)",
            fontWeight: 600,
            color: isDark ? "rgba(255,255,255,0.85)" : "#1e293b",
          }}>
            <TypingRole isDark={isDark} />
          </motion.p>

          {/* Bio */}
          <motion.p {...fadeUp(0.44)} style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: "clamp(0.875rem, 1.6vw, 1rem)",
            lineHeight: 1.8, fontWeight: 300,
            color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.55)",
            maxWidth: 440,
          }}>
            BSc Data Science & AI — UWE Bristol. Specialising in machine learning,
            deep learning, and building intelligent systems that solve real problems.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div {...fadeUp(0.52)} style={{ display: "flex", gap: "0.875rem", flexWrap: "wrap" }}>
            <motion.button
              onClick={() => document.getElementById("projects")?.scrollIntoView({ behavior: "smooth" })}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              style={{
                display: "flex", alignItems: "center", gap: "0.5rem",
                padding: "0.75rem 1.5rem",
                background: isDark ? "white" : "#0a0a0a",
                color: isDark ? "black" : "white", border: "none",
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: "0.85rem", fontWeight: 700,
                letterSpacing: "0.04em", cursor: "pointer",
                borderRadius: "6px",
              }}
            >
              View Projects <ArrowUpRight size={15} />
            </motion.button>

            <motion.a
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
                fontSize: "0.85rem", fontWeight: 600,
                letterSpacing: "0.04em", cursor: "pointer",
                borderRadius: "6px", textDecoration: "none",
              }}
            >
              Let's Talk <Mail size={15} />
            </motion.a>
          </motion.div>

          {/* Social Links */}
          <motion.div {...fadeUp(0.60)} style={{ display: "flex", gap: "0.75rem", marginTop: "0.25rem" }}>
            {[
              { icon: Github, href: "https://github.com/heinhtetphyo", label: "GitHub" },
              { icon: Linkedin, href: "https://linkedin.com/in/heinhtetphyo", label: "LinkedIn" },
              { icon: Twitter, href: "https://twitter.com/heinhtetphyo", label: "Twitter" },
              { icon: Mail, href: "mailto:heinhtetphyo@email.com", label: "Email" },
            ].map(({ icon: Icon, href, label }) => (
              <motion.a
                key={label}
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
        <div style={{ display: "flex", justifyContent: "flex-start", alignItems: "center" }}>
          <TerminalWindow isDark={isDark} revealed={revealed} />
        </div>
      </div>

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 768px) {
          .hero-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
