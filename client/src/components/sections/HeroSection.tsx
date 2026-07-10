// Hero Section — Motionfolio-inspired layout for Hein Htet Phyo
// Massive centered name with outline second line, typing role, CTA buttons, orbiting decorations
import { useEffect, useRef, useState, memo } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, Download, Code2, Database, Cpu, BrainCircuit } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";

// ── Location & Time Badge ──
const londonFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/London",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

function LocationTimeBadge() {
  const timeRef = useRef<HTMLSpanElement>(null);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  useEffect(() => {
    const update = () => {
      if (timeRef.current) timeRef.current.textContent = londonFormatter.format(new Date());
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      gap: "1.25rem", fontFamily: "'JetBrains Mono', monospace",
      fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.15em",
      color: isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.4)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span style={{
          width: 6, height: 6, borderRadius: "50%", background: "#22c55e",
          boxShadow: "0 0 6px #22c55e", display: "inline-block",
        }} />
        <span style={{ fontWeight: 700, color: isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.65)" }}>
          London, UK
        </span>
      </div>
      <div style={{ width: 1, height: 12, background: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)" }} />
      <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
        <span>LOCAL:</span>
        <span ref={timeRef} style={{ fontWeight: 700, color: isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.65)" }} />
      </div>
    </div>
  );
}

// ── Orbiting Decoration ──
const OrbitingDecoration = memo(function OrbitingDecoration({
  icon: Icon, delay, style, revealed
}: { icon: React.FC<{ size?: number; style?: React.CSSProperties }>; delay: number; style: React.CSSProperties; revealed: boolean }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.9 }}
      animate={revealed ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 12, scale: 0.9 }}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: "absolute", width: 44, height: 44, borderRadius: "50%",
        border: `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)"}`,
        background: isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.7)",
        backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: isDark ? "0 8px 24px rgba(0,0,0,0.3)" : "0 8px 24px rgba(0,0,0,0.06)",
        animation: revealed ? `hero-float 5.8s ${delay + 0.35}s ease-in-out infinite` : "none",
        willChange: "transform", ...style,
      }}
    >
      <Icon size={17} style={{ color: isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.55)" }} />
    </motion.div>
  );
});

// ── Typing Role ──
const ROLES = ["Data Scientist", "AI Engineer", "ML Developer", "Data Analyst"];

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
    <span style={{ color: isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.55)" }}>
      {text}<span className="typing-cursor" />
    </span>
  );
}

// ── Main Hero ──
export default function HeroSection() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <section id="hero" className="hero-section" style={{ position: "relative", zIndex: 2 }}>
      <motion.div
        initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
        animate={revealed ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        style={{
          width: "100%", maxWidth: 1100, padding: "0 1.5rem",
          display: "flex", flexDirection: "column", alignItems: "center",
          textAlign: "center", gap: "1.25rem",
        }}
      >
        {/* Location & Time */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={revealed ? { opacity: 1 } : {}}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          <LocationTimeBadge />
        </motion.div>

        {/* Name — massive typography */}
        <div style={{ position: "relative", width: "100%", marginBottom: "0.25rem" }}>
          <OrbitingDecoration icon={Code2} delay={0.15} revealed={revealed} style={{ left: "2%", top: "10%" }} />
          <OrbitingDecoration icon={Database} delay={0.45} revealed={revealed} style={{ left: "8%", bottom: "10%" }} />
          <OrbitingDecoration icon={Cpu} delay={0.28} revealed={revealed} style={{ right: "2%", top: "10%" }} />
          <OrbitingDecoration icon={BrainCircuit} delay={0.58} revealed={revealed} style={{ right: "8%", bottom: "10%" }} />

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.05em" }}>
            {["HEIN", "HTET", "PHYO"].map((word, wi) => (
              <motion.div
                key={wi}
                initial={{ opacity: 0, y: 28 }}
                animate={revealed ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.75, delay: 0.15 + wi * 0.1, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: "clamp(4rem, 14vw, 9.5rem)",
                  fontWeight: 900, lineHeight: 0.9, letterSpacing: "-0.03em",
                  textTransform: "uppercase",
                  ...(wi === 1
                    ? { WebkitTextStroke: isDark ? "2px white" : "2px #0a0a0a", color: "transparent" }
                    : { color: isDark ? "white" : "#0a0a0a" }),
                }}
              >
                {word}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Subtitle */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={revealed ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.45, duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: "clamp(1.1rem, 3.5vw, 1.75rem)", fontWeight: 600,
            color: isDark ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.8)",
            letterSpacing: "-0.01em", display: "flex", alignItems: "center",
            gap: "0.5rem", flexWrap: "wrap", justifyContent: "center",
          }}
        >
          <span>Architecting</span>
          <span style={{
            background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
            border: `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)"}`,
            borderRadius: "0.375rem", padding: "0.1em 0.5em",
          }}>Intelligent</span>
          <span>Systems</span>
          <span style={{ color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.4)", fontWeight: 900 }}>.</span>
        </motion.div>

        {/* Typing role */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={revealed ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.52, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.875rem",
            letterSpacing: "0.05em", color: isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.4)" }}
        >
          &gt; <TypingRole isDark={isDark} />
        </motion.p>

        {/* Bio */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={revealed ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.58, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: "clamp(0.875rem, 1.8vw, 1rem)", fontWeight: 300,
            lineHeight: 1.75, color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)",
            maxWidth: 520,
          }}
        >
          BSc Data Science & AI — UWE Bristol. Specialising in machine learning,
          deep learning, and building intelligent systems that solve real problems.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={revealed ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.65, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          style={{ display: "flex", flexWrap: "wrap", gap: "0.875rem", justifyContent: "center", marginTop: "0.5rem" }}
        >
          <motion.button
            onClick={() => document.getElementById("projects")?.scrollIntoView({ behavior: "smooth" })}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            style={{
              display: "flex", alignItems: "center", gap: "0.5rem",
              padding: "0.75rem 1.5rem",
              background: isDark ? "white" : "#0a0a0a",
              color: isDark ? "black" : "white",
              border: "none", fontFamily: "'Space Grotesk', sans-serif",
              fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase",
              letterSpacing: "0.1em", cursor: "none",
            }}
          >
            View Projects <ArrowUpRight size={15} />
          </motion.button>

          <motion.a
            href="/cv.pdf" download
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            style={{
              display: "flex", alignItems: "center", gap: "0.5rem",
              padding: "0.75rem 1.5rem", background: "transparent",
              color: isDark ? "white" : "#0a0a0a",
              border: `2px solid ${isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.2)"}`,
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase",
              letterSpacing: "0.1em", cursor: "none", textDecoration: "none",
            }}
          >
            Download CV <Download size={15} />
          </motion.a>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={revealed ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.75, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          style={{
            display: "flex", flexWrap: "wrap", gap: "2rem", justifyContent: "center",
            marginTop: "1rem", paddingTop: "1.5rem",
            borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)"}`,
            width: "100%", maxWidth: 520,
          }}
        >
          {[
            { value: "99.75%", label: "ML Accuracy" },
            { value: "80%", label: "API Optimised" },
            { value: "40%", label: "Report Time Cut" },
            { value: "1st", label: "Class Honours" },
          ].map((stat, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: "clamp(1.25rem, 3vw, 1.75rem)", fontWeight: 900,
                color: isDark ? "white" : "#0a0a0a", letterSpacing: "-0.02em",
              }}>{stat.value}</div>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: "0.65rem",
                textTransform: "uppercase", letterSpacing: "0.12em",
                color: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)", marginTop: "0.2rem",
              }}>{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={revealed ? { opacity: 1 } : {}}
        transition={{ delay: 1.2, duration: 0.8 }}
        style={{
          position: "absolute", bottom: "2rem", left: "50%", transform: "translateX(-50%)",
          display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem",
        }}
      >
        <span style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: "0.6rem",
          textTransform: "uppercase", letterSpacing: "0.2em",
          color: isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.25)",
        }}>Scroll</span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          style={{
            width: 1, height: 32,
            background: isDark
              ? "linear-gradient(to bottom, rgba(255,255,255,0.3), transparent)"
              : "linear-gradient(to bottom, rgba(0,0,0,0.25), transparent)",
          }}
        />
      </motion.div>
    </section>
  );
}
