// Neural Network Portfolio — Main Home Page
// Single-page layout with all sections assembled
import { useEffect, useRef, useState } from "react";
import Header from "@/components/Header";
import CustomCursor from "@/components/CustomCursor";
import HeroSection from "@/components/sections/HeroSection";
import AboutSection from "@/components/sections/AboutSection";
import ExperienceSection from "@/components/sections/ExperienceSection";
import EducationSection from "@/components/sections/EducationSection";
import ProjectsSection from "@/components/sections/ProjectsSection";
import SkillsSection from "@/components/sections/SkillsSection";
import ContactSection from "@/components/sections/ContactSection";

// ── Page Loader ──
function PageLoader({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 600);
    const t2 = setTimeout(() => setPhase(2), 1400);
    const t3 = setTimeout(() => { setPhase(3); onDone(); }, 2000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 99999,
      background: "#000",
      display: "flex", alignItems: "center", justifyContent: "center",
      flexDirection: "column", gap: "1.5rem",
      opacity: phase === 3 ? 0 : 1,
      pointerEvents: phase === 3 ? "none" : "all",
      transition: "opacity 0.5s ease",
    }}>
      {/* HHP Logo */}
      <div style={{
        opacity: phase >= 1 ? 1 : 0,
        transform: phase >= 1 ? "scale(1)" : "scale(0.7)",
        transition: "all 0.6s cubic-bezier(0.23,1,0.32,1)",
      }}>
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
          <rect x="1" y="1" width="62" height="62" rx="8" stroke="rgba(0,212,255,0.3)" fill="rgba(0,212,255,0.04)" />
          <line x1="10" y1="32" x2="22" y2="32" stroke="#00d4ff" strokeWidth="1.5" opacity="0.6" />
          <line x1="42" y1="32" x2="54" y2="32" stroke="#00d4ff" strokeWidth="1.5" opacity="0.6" />
          <line x1="32" y1="10" x2="32" y2="22" stroke="#00d4ff" strokeWidth="1.5" opacity="0.6" />
          <line x1="32" y1="42" x2="32" y2="54" stroke="#00d4ff" strokeWidth="1.5" opacity="0.6" />
          <circle cx="10" cy="32" r="2.5" fill="#00d4ff" opacity="0.7" />
          <circle cx="54" cy="32" r="2.5" fill="#00d4ff" opacity="0.7" />
          <circle cx="32" cy="10" r="2.5" fill="#00d4ff" opacity="0.7" />
          <circle cx="32" cy="54" r="2.5" fill="#00d4ff" opacity="0.7" />
          <circle cx="32" cy="32" r="5" fill="none" stroke="#00d4ff" strokeWidth="1.5" opacity="0.8" />
          <circle cx="32" cy="32" r="2" fill="#00d4ff" />
          <text x="32" y="36" textAnchor="middle" fill="#00d4ff" fontSize="10" fontWeight="800" fontFamily="'JetBrains Mono',monospace">HHP</text>
        </svg>
      </div>

      {/* Loading bar */}
      <div style={{
        width: "160px", height: "1px",
        background: "rgba(255,255,255,0.06)",
        overflow: "hidden",
        opacity: phase >= 1 ? 1 : 0,
        transition: "opacity 0.4s ease 0.3s",
      }}>
        <div style={{
          height: "100%",
          background: "linear-gradient(to right, #00d4ff, #7c3aed)",
          width: phase >= 2 ? "100%" : "30%",
          transition: "width 0.8s cubic-bezier(0.23,1,0.32,1)",
        }} />
      </div>

      <div style={{
        fontFamily: "'JetBrains Mono',monospace",
        fontSize: "0.6rem",
        color: "rgba(0,212,255,0.4)",
        letterSpacing: "0.25em",
        opacity: phase >= 1 ? 1 : 0,
        transition: "opacity 0.4s ease 0.4s",
      }}>
        {phase < 2 ? "INITIALISING..." : "NEURAL.AI READY"}
      </div>
    </div>
  );
}

// ── Scroll Progress Bar ──
function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(total > 0 ? (window.scrollY / total) * 100 : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, zIndex: 9998,
      height: "2px",
      width: `${progress}%`,
      background: "linear-gradient(to right, #00d4ff, #7c3aed)",
      transition: "width 0.1s linear",
    }} />
  );
}

// ── Particle Network Background ──
function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let W = window.innerWidth;
    let H = window.innerHeight;
    canvas.width = W;
    canvas.height = H;

    const PARTICLE_COUNT = 60;
    const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.5 + 0.5,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = W;
        if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H;
        if (p.y > H) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,0.25)";
        ctx.fill();
      });

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(0,212,255,${0.06 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      animId = requestAnimationFrame(draw);
    };

    draw();

    const onResize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W;
      canvas.height = H;
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed", inset: 0, zIndex: 0,
        pointerEvents: "none",
        opacity: 0.6,
      }}
    />
  );
}

// ── Main Page ──
export default function Home() {
  const [loaded, setLoaded] = useState(false);

  return (
    <div style={{ background: "#000", minHeight: "100vh", position: "relative" }}>
      {/* Page loader */}
      {!loaded && <PageLoader onDone={() => setLoaded(true)} />}

      {/* Global effects */}
      <CustomCursor />
      <ScrollProgress />
      <ParticleBackground />

      {/* Header */}
      <Header />

      {/* Sections */}
      <main style={{ position: "relative", zIndex: 1 }}>
        <HeroSection />
        <AboutSection />
        <ExperienceSection />
        <EducationSection />
        <ProjectsSection />
        <SkillsSection />
        <ContactSection />
      </main>
    </div>
  );
}
