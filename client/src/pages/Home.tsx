// Dark Space Theme — Main Portfolio Page
// Assembles all sections with global effects
import PageLoader from "@/components/PageLoader";
import CustomCursor from "@/components/CustomCursor";
import ParticleBackground from "@/components/ParticleBackground";
import ShootingStars from "@/components/ShootingStars";
import ScrollProgress from "@/components/ScrollProgress";
import Header from "@/components/Header";
import HeroSection from "@/components/sections/HeroSection";
import AboutSection from "@/components/sections/AboutSection";
import ExperienceSection from "@/components/sections/ExperienceSection";
import EducationSection from "@/components/sections/EducationSection";
import ProjectsSection from "@/components/sections/ProjectsSection";
import SkillsSection from "@/components/sections/SkillsSection";
import ContactSection from "@/components/sections/ContactSection";

function TelemetryDivider({ label }: { label: string }) {
  return (
    <div className="telemetry-divider">
      <span>{label}</span>
    </div>
  );
}

export default function Home() {
  return (
    <>
      {/* Global Effects */}
      <PageLoader />
      <CustomCursor />
      <ParticleBackground />
      <ShootingStars />
      <ScrollProgress />

      {/* Layout */}
      <div style={{ position: "relative", zIndex: 1 }}>
        <Header />
        <main>
          <HeroSection />
          <AboutSection />
          <TelemetryDivider label="SYS.EXP — WORK RECORD" />
          <ExperienceSection />
          <TelemetryDivider label="SYS.EDU — ACADEMIC LOG" />
          <EducationSection />
          <TelemetryDivider label="SYS.PRJ — BUILD HISTORY" />
          <ProjectsSection />
          <TelemetryDivider label="SYS.SKL — TECHNICAL STACK" />
          <SkillsSection />
          <TelemetryDivider label="SYS.CTX — OPEN CHANNEL" />
          <ContactSection />
        </main>
      </div>
    </>
  );
}
