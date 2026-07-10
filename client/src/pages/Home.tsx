// Home — Main page wiring all sections together
import { lazy, Suspense } from "react";
import SpaceBackground from "../components/SpaceBackground";
import CustomCursor from "../components/CustomCursor";
import Navbar from "../components/Navbar";
import HeroSection from "../components/sections/HeroSection";

// Placeholder sections — will be built section by section
function PlaceholderSection({ id, label }: { id: string; label: string }) {
  return (
    <section
      id={id}
      style={{
        minHeight: "60vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        zIndex: 2,
        borderTop: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <div style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "0.75rem",
        textTransform: "uppercase",
        letterSpacing: "0.2em",
        color: "rgba(255,255,255,0.2)",
      }}>
        // {label} — coming soon
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <div style={{ background: "var(--background)", minHeight: "100vh", position: "relative" }}>
      {/* Fixed space background canvas */}
      <SpaceBackground />

      {/* Custom cursor */}
      <CustomCursor />

      {/* Navigation */}
      <Navbar />

      {/* Sections */}
      <main style={{ position: "relative", zIndex: 2 }}>
        <HeroSection />
        <PlaceholderSection id="about" label="About Me" />
        <PlaceholderSection id="projects" label="Projects" />
        <PlaceholderSection id="experience" label="Work Experience" />
        <PlaceholderSection id="skills" label="Skills" />
        <PlaceholderSection id="contact" label="Contact" />
      </main>
    </div>
  );
}
