// Dark Space Theme — Glassmorphism sticky header with HHP circuit logo
import { useEffect, useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { FiGithub, FiSun, FiMoon, FiMenu, FiX } from "react-icons/fi";

const NAV_LINKS = [
  { label: "about", href: "#about" },
  { label: "experience", href: "#experience" },
  { label: "education", href: "#education" },
  { label: "projects", href: "#projects" },
  { label: "skills", href: "#skills" },
  { label: "contact", href: "#contact" },
];

export default function Header() {
  const { theme, toggleTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 50);

      // Active section detection
      const sections = NAV_LINKS.map((l) => l.href.replace("#", ""));
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i]);
        if (el && el.getBoundingClientRect().top <= 120) {
          setActiveSection(sections[i]);
          break;
        }
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleNav = (href: string) => {
    setMobileOpen(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header
      className="header-nav"
      style={{
        background: scrolled
          ? theme === "dark"
            ? "rgba(0,0,0,0.85)"
            : "rgba(255,255,255,0.9)"
          : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "none",
        boxShadow: scrolled ? "0 4px 30px rgba(0,0,0,0.3)" : "none",
      }}
    >
      <div className="container">
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "70px",
        }}>
          {/* HHP Circuit Logo */}
          <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            style={{ display: "flex", alignItems: "center", gap: "0.75rem", textDecoration: "none" }}>
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
              <line x1="4" y1="9" x2="32" y2="9" stroke="#00d4ff" strokeWidth="1.2" opacity="0.5"/>
              <line x1="4" y1="27" x2="32" y2="27" stroke="#00d4ff" strokeWidth="1.2" opacity="0.5"/>
              <line x1="9" y1="4" x2="9" y2="32" stroke="#00d4ff" strokeWidth="1.2" opacity="0.5"/>
              <line x1="27" y1="4" x2="27" y2="32" stroke="#00d4ff" strokeWidth="1.2" opacity="0.5"/>
              <line x1="18" y1="4" x2="18" y2="32" stroke="#00d4ff" strokeWidth="1.2" opacity="0.3"/>
              <circle cx="9" cy="9" r="2.5" fill="#00d4ff" className="circuit-node"/>
              <circle cx="27" cy="9" r="2.5" fill="#00d4ff" className="circuit-node"/>
              <circle cx="9" cy="27" r="2.5" fill="#00d4ff" className="circuit-node"/>
              <circle cx="27" cy="27" r="2.5" fill="#00d4ff" className="circuit-node"/>
              <circle cx="18" cy="18" r="3.5" fill="#00d4ff" className="circuit-node"/>
              <circle cx="18" cy="9" r="2" fill="#7c3aed" className="circuit-node"/>
              <circle cx="18" cy="27" r="2" fill="#7c3aed" className="circuit-node"/>
            </svg>
            <span style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              fontSize: "1.1rem",
              color: theme === "dark" ? "white" : "#0a0a0a",
              letterSpacing: "0.05em",
            }}>
              HHP
            </span>
          </a>

          {/* Desktop Nav */}
          <nav style={{ display: "flex", gap: "2rem", alignItems: "center" }}
            className="hidden md:flex">
            {NAV_LINKS.map((link) => (
              <button
                key={link.href}
                onClick={() => handleNav(link.href)}
                className={`nav-link ${activeSection === link.href.replace("#", "") ? "active" : ""}`}
                style={{ background: "none", border: "none", padding: "0.25rem 0" }}
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Right Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <a
              href="https://github.com/HeinHtet-Phyo"
              target="_blank"
              rel="noopener noreferrer"
              className="social-icon"
              style={{ width: "34px", height: "34px" }}
            >
              <FiGithub size={16} />
            </a>

            <button
              onClick={toggleTheme}
              className="social-icon"
              style={{ width: "34px", height: "34px", background: "none", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              {theme === "dark" ? <FiSun size={15} /> : <FiMoon size={15} />}
            </button>

            <a
              href="mailto:heinhtetphyo56@gmail.com"
              className="hire-me-btn hidden md:inline-flex"
            >
              Hire Me
            </a>

            {/* Mobile hamburger */}
            <button
              className="social-icon md:hidden"
              style={{ width: "34px", height: "34px", background: "none", border: "1px solid rgba(255,255,255,0.1)" }}
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <FiX size={16} /> : <FiMenu size={16} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div style={{
          background: theme === "dark" ? "rgba(0,0,0,0.95)" : "rgba(255,255,255,0.97)",
          backdropFilter: "blur(20px)",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          padding: "1.5rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.25rem",
        }}>
          {NAV_LINKS.map((link) => (
            <button
              key={link.href}
              onClick={() => handleNav(link.href)}
              className={`nav-link ${activeSection === link.href.replace("#", "") ? "active" : ""}`}
              style={{ background: "none", border: "none", textAlign: "left", fontSize: "1rem" }}
            >
              {link.label}
            </button>
          ))}
          <a href="mailto:heinhtetphyo56@gmail.com" className="hire-me-btn" style={{ alignSelf: "flex-start" }}>
            Hire Me
          </a>
        </div>
      )}
    </header>
  );
}
