// ContactSection — strict black-and-white theme
// Two-column: left = info cards, right = contact form
// JetBrains Mono font, deep space background, no color accents

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
function EnvelopeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2"/>
      <path d="M2 7l10 7 10-7"/>
    </svg>
  );
}
function PinIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
      <circle cx="12" cy="9" r="2.5"/>
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
function PhoneIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.18 6.18l1.97-1.97a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  );
}

// ── Info Card ─────────────────────────────────────────────────────────────────
function InfoCard({
  icon,
  label,
  value,
  href,
  delay,
  inView,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
  delay: number;
  inView: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  const inner = (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="contact-info-card"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "1rem",
        padding: "1.1rem 1.4rem",
        borderRadius: "10px",
        border: hovered ? "1px solid rgba(255,255,255,0.3)" : "1px solid rgba(255,255,255,0.1)",
        background: hovered ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.025)",
        boxShadow: hovered ? "0 0 18px rgba(255,255,255,0.07)" : "none",
        transition: "border-color 0.25s ease, background 0.25s ease, box-shadow 0.25s ease, opacity 0.65s cubic-bezier(0.23,1,0.32,1), transform 0.65s cubic-bezier(0.23,1,0.32,1)",
        transitionDelay: `0s, 0s, 0s, ${delay}s, ${delay}s`,
        cursor: href ? "pointer" : "default",
        textDecoration: "none",
        color: "inherit",
        opacity: inView ? 1 : 0,
        transform: inView ? "translateX(0)" : "translateX(-32px)",
      }}
    >
      <span style={{ opacity: 0.6, flexShrink: 0, display: "flex" }}>{icon}</span>
      <div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.6rem", letterSpacing: "0.18em", textTransform: "uppercase", opacity: 0.38, marginBottom: "0.2rem" }}>
          {label}
        </div>
        <div style={{ fontSize: "0.9rem", fontWeight: 500, opacity: 0.85 }}>
          {value}
        </div>
      </div>
    </div>
  );

  if (href) {
    return (
      <a
        href={href}
        target={href.startsWith("http") ? "_blank" : "_self"}
        rel="noopener noreferrer"
        style={{ textDecoration: "none", color: "inherit", display: "block" }}
      >
        {inner}
      </a>
    );
  }
  return inner;
}

// ── Contact Form ──────────────────────────────────────────────────────────────
function ContactForm({ inView }: { inView: boolean }) {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required.";
    if (!form.email.trim()) e.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email.";
    if (!form.message.trim()) e.message = "Message is required.";
    return e;
  };

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setSubmitting(true);
    setTimeout(() => { setSubmitting(false); setSubmitted(true); }, 1200);
  };

  const inputStyle = (field: string): React.CSSProperties => ({
    width: "100%",
    background: "rgba(255,255,255,0.04)",
    border: errors[field] ? "1px solid rgba(255,80,80,0.55)" : "1px solid rgba(255,255,255,0.12)",
    borderRadius: "8px",
    padding: "0.75rem 1rem",
    color: "inherit",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "0.85rem",
    outline: "none",
    transition: "border-color 0.2s ease, box-shadow 0.2s ease",
    boxSizing: "border-box",
  });

  return (
    <div
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateX(0)" : "translateX(32px)",
        transition: "opacity 0.7s ease 0.25s, transform 0.7s cubic-bezier(0.23,1,0.32,1) 0.25s",
      }}
    >
      <div style={{ marginBottom: "1.6rem" }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.68rem", letterSpacing: "0.22em", textTransform: "uppercase", opacity: 0.38, marginBottom: "0.4rem" }}>
          Reach Out to Me
        </div>
        <div style={{ fontSize: "1.6rem", fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.2 }}>
          Let's Build Something
        </div>
      </div>

      {submitted ? (
        <div style={{
          padding: "2.5rem",
          borderRadius: "10px",
          border: "1px solid rgba(255,255,255,0.15)",
          background: "rgba(255,255,255,0.04)",
          textAlign: "center",
        }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>✓</div>
          <div style={{ fontWeight: 600, marginBottom: "0.4rem" }}>Message sent!</div>
          <div style={{ opacity: 0.5, fontSize: "0.85rem", fontFamily: "'JetBrains Mono', monospace" }}>I'll get back to you soon.</div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <input
              type="text"
              placeholder="Your Name"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              style={inputStyle("name")}
              className="contact-input"
            />
            {errors.name && <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.7rem", color: "rgba(255,100,100,0.85)", marginTop: "0.3rem" }}>{errors.name}</div>}
          </div>
          <div>
            <input
              type="email"
              placeholder="Your Email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              style={inputStyle("email")}
              className="contact-input"
            />
            {errors.email && <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.7rem", color: "rgba(255,100,100,0.85)", marginTop: "0.3rem" }}>{errors.email}</div>}
          </div>
          <div>
            <textarea
              placeholder="Your Message"
              value={form.message}
              onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              rows={5}
              style={{ ...inputStyle("message"), resize: "vertical", minHeight: "130px" }}
              className="contact-input"
            />
            {errors.message && <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.7rem", color: "rgba(255,100,100,0.85)", marginTop: "0.3rem" }}>{errors.message}</div>}
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="contact-submit"
            style={{
              padding: "0.85rem 2rem",
              borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.55)",
              background: submitting ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.92)",
              color: submitting ? "rgba(255,255,255,0.5)" : "#000",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.8rem",
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              cursor: submitting ? "not-allowed" : "pointer",
              transition: "background 0.2s ease, color 0.2s ease, transform 0.15s ease",
              alignSelf: "flex-start",
            }}
          >
            {submitting ? "Sending…" : "Send Message →"}
          </button>
        </form>
      )}

      <style>{`
        .contact-input:focus {
          border-color: rgba(255,255,255,0.4) !important;
          box-shadow: 0 0 0 3px rgba(255,255,255,0.06) !important;
          outline: none !important;
        }
        .contact-submit:hover:not(:disabled) {
          background: rgba(255,255,255,1) !important;
          transform: translateY(-1px);
        }
        .contact-submit:active:not(:disabled) {
          transform: scale(0.97) translateY(0);
        }
        .light .contact-input {
          background: rgba(0,0,0,0.04) !important;
          border-color: rgba(0,0,0,0.15) !important;
          color: rgba(0,0,0,0.85) !important;
        }
        .light .contact-input::placeholder {
          color: rgba(0,0,0,0.35) !important;
        }
        .light .contact-input:focus {
          border-color: rgba(0,0,0,0.4) !important;
          box-shadow: 0 0 0 3px rgba(0,0,0,0.06) !important;
        }
        .light .contact-info-card {
          border-color: rgba(0,0,0,0.1) !important;
          background: rgba(0,0,0,0.03) !important;
        }
        .light .contact-info-card:hover {
          border-color: rgba(0,0,0,0.25) !important;
          background: rgba(0,0,0,0.06) !important;
          box-shadow: 0 0 18px rgba(0,0,0,0.06) !important;
        }
        .light .contact-submit {
          border-color: rgba(0,0,0,0.55) !important;
          background: rgba(0,0,0,0.88) !important;
          color: #fff !important;
        }
        .light .contact-submit:hover:not(:disabled) {
          background: rgba(0,0,0,1) !important;
        }
      `}</style>
    </div>
  );
}

// ── Main Section ──────────────────────────────────────────────────────────────
export default function ContactSection() {
  const { ref, inView } = useInView(0.08);

  return (
    <section
      id="contact"
      ref={ref}
      style={{ padding: "6rem 8vw 5rem", position: "relative", zIndex: 1 }}
    >
      {/* Section label */}
      <div style={{
        display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "3.5rem",
        opacity: inView ? 1 : 0, transform: inView ? "translateY(0)" : "translateY(16px)",
        transition: "opacity 0.6s ease, transform 0.6s ease",
      }}>
        <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#84cc16", flexShrink: 0, display: "inline-block" }} />
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.68rem", letterSpacing: "0.22em", textTransform: "uppercase", opacity: 0.55 }}>
          05 — Contact
        </span>
      </div>

      {/* Two-column layout */}
      <div
        className="contact-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1.4fr",
          gap: "4rem",
          alignItems: "start",
        }}
      >
        {/* Left — Info cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{
            marginBottom: "1.2rem",
            opacity: inView ? 1 : 0,
            transform: inView ? "translateX(0)" : "translateX(-32px)",
            transition: "opacity 0.65s ease 0.05s, transform 0.65s cubic-bezier(0.23,1,0.32,1) 0.05s",
          }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.68rem", letterSpacing: "0.22em", textTransform: "uppercase", opacity: 0.38, marginBottom: "0.4rem" }}>
              Contact Info
            </div>
            <div style={{ fontSize: "1.6rem", fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.2 }}>
              Get in Touch
            </div>
          </div>

          <InfoCard icon={<EnvelopeIcon />} label="Email" value="heinhtetphyo56@gmail.com" href="mailto:heinhtetphyo56@gmail.com" delay={0.1} inView={inView} />
          <InfoCard icon={<PinIcon />} label="Location" value="London, UK" delay={0.18} inView={inView} />
          <InfoCard icon={<GitHubIcon />} label="GitHub" value="github.com/HeinHtet-Phyo" href="https://github.com/HeinHtet-Phyo" delay={0.26} inView={inView} />
          <InfoCard icon={<PhoneIcon />} label="Phone" value="+44 7436 163764" href="tel:+447436163764" delay={0.34} inView={inView} />
        </div>

        {/* Right — Form */}
        <ContactForm inView={inView} />
      </div>

      <style>{`
        @media (max-width: 768px) {
          .contact-grid {
            grid-template-columns: 1fr !important;
            gap: 2.5rem !important;
          }
        }
      `}</style>
    </section>
  );
}
