// Navbar — Motionfolio-inspired
// HEIN logo (left), center nav pill, theme toggle + Let's Talk (right)
// Adapts text/bg for dark/light sections
import { useState, useEffect, useRef, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ArrowUpRight, Sun, Moon } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";

const NAV_ITEMS = [
  { label: "About", href: "#about" },
  { label: "Projects", href: "#projects" },
  { label: "Work", href: "#experience" },
  { label: "Skills", href: "#skills" },
  { label: "Contact", href: "#contact" },
];

function scrollToSection(href: string) {
  const id = href.replace("#", "");
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

const Navbar = memo(function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const prevOverflow = useRef("");

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setScrolled(window.scrollY > 50);

        // Active section detection
        const sections = NAV_ITEMS.map((n) => n.href.replace("#", ""));
        for (let i = sections.length - 1; i >= 0; i--) {
          const el = document.getElementById(sections[i]);
          if (el && el.getBoundingClientRect().top <= 120) {
            setActiveSection(sections[i]);
            break;
          }
        }
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (menuOpen) {
      prevOverflow.current = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = prevOverflow.current;
    }
    return () => {
      document.body.style.overflow = prevOverflow.current;
    };
  }, [menuOpen]);

  const isDark = theme === "dark";

  // Logo styles
  const logoBase = `navbar-logo ${scrolled ? "scrolled" : ""}`;

  return (
    <>
      <nav className="navbar">
        {/* ── Logo ── */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <a
            href="#"
            className={logoBase}
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            <span className="navbar-logo-text">HEIN</span>
          </a>
        </motion.div>

        {/* ── Center Nav Pill (desktop) ── */}
        <div className="navbar-center hidden lg:flex">
          {NAV_ITEMS.map((item, i) => {
            const sectionId = item.href.replace("#", "");
            const isActive = activeSection === sectionId;
            return (
              <button
                key={item.href}
                className={`nav-item ${isActive ? "active" : ""}`}
                onClick={() => scrollToSection(item.href)}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {(isActive || hoveredIndex === i) && (
                  <motion.span
                    layoutId="navbar-pill"
                    className="nav-item-pill"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                <span style={{ position: "relative", zIndex: 1 }}>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── Right Side ── */}
        <div className="navbar-right">
          {/* Theme toggle */}
          <button
            className="theme-toggle hidden md:flex"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {isDark ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          {/* Let's Talk */}
          <motion.a
            href="#contact"
            className="lets-talk-btn hidden md:flex"
            onClick={(e) => { e.preventDefault(); scrollToSection("#contact"); }}
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <span>Let's Talk</span>
            <div className="lets-talk-icon">
              <ArrowUpRight size={13} strokeWidth={2.5} />
            </div>
          </motion.a>

          {/* Mobile hamburger */}
          <button
            className="hamburger-btn lg:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            {menuOpen ? <X size={18} strokeWidth={2} /> : <Menu size={18} strokeWidth={2} />}
          </button>
        </div>
      </nav>

      {/* ── Mobile Menu Overlay ── */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 90,
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              background: isDark ? "rgba(0,0,0,0.88)" : "rgba(248,248,248,0.94)",
              display: "flex",
              flexDirection: "column",
              padding: "6rem 1.5rem 2rem",
            }}
          >
            {/* Nav items */}
            <div style={{ flex: 1 }}>
              {NAV_ITEMS.map((item, i) => (
                <motion.button
                  key={item.href}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.28, delay: 0.04 + i * 0.04, ease: [0.16, 1, 0.3, 1] }}
                  onClick={() => { scrollToSection(item.href); setMenuOpen(false); }}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "1rem 0",
                    borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"}`,
                    background: "none",
                    cursor: "none",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <span style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "0.65rem",
                      fontWeight: 700,
                      letterSpacing: "0.14em",
                      color: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.3)",
                    }}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span style={{
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontSize: "2rem",
                      fontWeight: 900,
                      textTransform: "uppercase",
                      letterSpacing: "-0.02em",
                      color: isDark ? "white" : "#0a0a0a",
                      lineHeight: 1,
                    }}>
                      {item.label}
                    </span>
                  </div>
                  <div style={{
                    width: "2rem",
                    height: "2rem",
                    borderRadius: "50%",
                    border: `1px solid ${isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)"}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.4)",
                  }}>
                    <ArrowUpRight size={14} />
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Bottom row */}
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
              <button
                onClick={toggleTheme}
                className="theme-toggle"
                style={{ flex: "0 0 auto" }}
              >
                {isDark ? <Sun size={15} /> : <Moon size={15} />}
              </button>
              <button
                onClick={() => { scrollToSection("#contact"); setMenuOpen(false); }}
                className="lets-talk-btn"
                style={{ flex: 1, justifyContent: "center" }}
              >
                <span>Let's Talk</span>
                <div className="lets-talk-icon">
                  <ArrowUpRight size={13} strokeWidth={2.5} />
                </div>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
});

export default Navbar;
