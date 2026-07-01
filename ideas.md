# Portfolio HHP — Design Philosophy

## Three Approaches Considered

### 1. Dark Space Tech (p=0.07)
Deep black cosmos meets Silicon Valley precision. Electric blue accents, particle effects, 3D neural networks, terminal UIs.

### 2. Brutalist Neon (p=0.02)
Raw, bold, asymmetric. Harsh neon on black, oversized type, intentional roughness.

### 3. Holographic Minimal (p=0.01)
Ultra-minimal white with iridescent rainbow shimmer accents, thin lines, generous whitespace.

---

## ✅ CHOSEN: Dark Space Tech

**Design Movement:** NASA Mission Control × Silicon Valley Startup

**Core Principles:**
1. Black-dominant canvas with electric blue (#00d4ff) as the singular accent
2. Information density balanced with breathing room — data-rich but never cluttered
3. Every interaction has a physical feel — magnetic, responsive, alive
4. Code/terminal aesthetics signal technical depth

**Color Philosophy:**
- Background: #000000 pure black — infinite depth, zero distraction
- Cards: #0a0a0a — barely-there elevation
- Accent: #00d4ff electric blue — the single source of energy
- Secondary: #7c3aed purple — used sparingly for education/holographic effects
- Text: #ffffff — maximum contrast on black
- Muted: rgba(255,255,255,0.5) — for secondary information

**Layout Paradigm:**
- Single-page scroll with section-based background tint shifts
- Asymmetric two-column layouts for hero/about
- Terminal window metaphor for experience
- 2×2 bento grid for projects

**Signature Elements:**
1. Particle network canvas — floating white dots connected by thin lines (global background)
2. Electric blue glow — box-shadow and text-shadow on key elements
3. JetBrains Mono for all code/badge/terminal text

**Interaction Philosophy:**
- Magnetic buttons that follow cursor
- 3D tilt on project cards
- Custom cursor: outer ring + inner blue dot with lerp lag
- Scroll-triggered reveals with stagger

**Animation:**
- Page load: black screen with HHP logo, then upward wipe
- Hero name: split character fly-in from different directions
- Stats: count-up on load
- About text: word-by-word reveal on scroll
- Skill bars: fill animation on scroll intersection
- Section entries: fade + translateY with stagger

**Typography System:**
- Headings: Space Grotesk 700 — bold, geometric, modern
- Body: Inter 400/500 — clean, readable
- Code/badges: JetBrains Mono 400/500 — technical authenticity

**Brand Essence:**
Data-driven creator for UK tech recruiters who want proof over promises. Precise. Ambitious. Real.

**Brand Voice:**
Headlines are direct and confident. CTAs are action-oriented. No fluff.
Example: "Building the future with data." / "Let's build something remarkable."

**Wordmark & Logo:**
HHP circuit board SVG — traces and nodes in electric blue, nodes pulse with CSS animation.

**Signature Brand Color:** #00d4ff Electric Blue

---

## Style Decisions

- Section background shifts create depth without full-page reloads
- Terminal windows use traffic-light dots (red/yellow/green) for authenticity
- Holographic shimmer on education cards uses CSS gradient animation
- Contact section is split-screen: black left / electric blue right
- Footer is embedded inside contact section
