// SpaceBackground — Subtle animated starfield (global, site-wide)
// Effects:
//   1. Ambient drift: dots gently float/oscillate on their own (slow, calm)
//   2. Cursor repel: nearby dots subtly push away from cursor + soft glow near cursor
//   3. Scroll parallax: each layer scrolls at a slightly different speed for depth
//   4. Shooting stars with glowing tails
//   5. Mobile-safe: cursor effects skipped on touch devices
import { useEffect, useRef } from "react";
import { useTheme } from "../contexts/ThemeContext";

interface Star {
  x: number; y: number;        // base position
  r: number;
  opacity: number;
  driftX: number; driftY: number;
  freqX: number; freqY: number;
  phaseX: number; phaseY: number;
  twinkleFreq: number; twinklePhase: number;
  layer: number;               // 0 = farthest, 4 = closest
}

const LAYERS = [
  { count: 1100, rMin: 0.15, rMax: 0.30, oMin: 0.75, oMax: 0.95, drift: 1.8 },
  { count:  700, rMin: 0.20, rMax: 0.42, oMin: 0.80, oMax: 0.98, drift: 2.8 },
  { count:  450, rMin: 0.28, rMax: 0.55, oMin: 0.85, oMax: 1.00, drift: 4.0 },
  { count:  250, rMin: 0.36, rMax: 0.70, oMin: 0.88, oMax: 1.00, drift: 5.5 },
  { count:  150, rMin: 0.48, rMax: 0.92, oMin: 0.92, oMax: 1.00, drift: 7.5 },
];

// Scroll parallax multiplier per layer (0 = no scroll shift, higher = more shift)
const SCROLL_PARALLAX = [0.02, 0.04, 0.07, 0.10, 0.14];

// Cursor repel radius and strength
const REPEL_RADIUS = 120;
const REPEL_STRENGTH = 18;

// Cursor glow radius
const GLOW_RADIUS = 180;

function buildStars(W: number, H: number): Star[] {
  const stars: Star[] = [];
  LAYERS.forEach((cfg, layerIdx) => {
    for (let i = 0; i < cfg.count; i++) {
      stars.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: cfg.rMin + Math.random() * (cfg.rMax - cfg.rMin),
        opacity: cfg.oMin + Math.random() * (cfg.oMax - cfg.oMin),
        driftX: (Math.random() * 0.6 + 0.4) * cfg.drift,
        driftY: (Math.random() * 0.6 + 0.4) * cfg.drift,
        freqX: 0.0002 + Math.random() * 0.0004,
        freqY: 0.00015 + Math.random() * 0.0003,
        phaseX: Math.random() * Math.PI * 2,
        phaseY: Math.random() * Math.PI * 2,
        twinkleFreq: 0.003 + Math.random() * 0.008,
        twinklePhase: Math.random() * Math.PI * 2,
        layer: layerIdx,
      });
    }
  });
  return stars;
}

interface ShootingStar {
  x: number; y: number;
  vx: number; vy: number;
  life: number; maxLife: number;
  len: number; glowR: number;
}

function spawnShoot(W: number, H: number): ShootingStar {
  const angle = (10 + Math.random() * 32) * (Math.PI / 180);
  const speed = 1.5 + Math.random() * 2.5;
  return {
    x: Math.random() * W * 0.8,
    y: Math.random() * H * 0.4,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    life: 0,
    maxLife: 90 + Math.random() * 120,
    len: 120 + Math.random() * 220,
    glowR: 1.8 + Math.random() * 2.5,
  };
}

export default function SpaceBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();
  // Smooth mouse position (0–1 normalised), raw pixel position for repel
  const mouseRef = useRef({ nx: -999, ny: -999, px: -999, py: -999, active: false });
  const scrollRef = useRef(0);
  const isTouchRef = useRef(false);

  // Track mouse (skip on touch devices)
  useEffect(() => {
    const onTouch = () => { isTouchRef.current = true; };
    const onMove = (e: MouseEvent) => {
      if (isTouchRef.current) return;
      mouseRef.current.nx = e.clientX / window.innerWidth;
      mouseRef.current.ny = e.clientY / window.innerHeight;
      mouseRef.current.px = e.clientX;
      mouseRef.current.py = e.clientY;
      mouseRef.current.active = true;
    };
    const onLeave = () => { mouseRef.current.active = false; };
    window.addEventListener("touchstart", onTouch, { passive: true, once: true });
    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseleave", onLeave, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  // Track scroll
  useEffect(() => {
    const onScroll = () => { scrollRef.current = window.scrollY; };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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

    let stars = buildStars(W, H);
    let t = 0;
    let frame = 0;

    const shoots: ShootingStar[] = [];
    shoots.push(spawnShoot(W, H));
    let nextShoot = 140;

    const draw = () => {
      t++;
      frame++;

      const isDark = theme === "dark";
      const scrollY = scrollRef.current;
      const m = mouseRef.current;

      ctx.fillStyle = isDark ? "#000000" : "#f0f0f0";
      ctx.fillRect(0, 0, W, H);

      // Soft cursor glow on background (desktop only)
      if (m.active && !isTouchRef.current) {
        const gx = m.nx * W;
        const gy = m.ny * H;
        const glow = ctx.createRadialGradient(gx, gy, 0, gx, gy, GLOW_RADIUS);
        if (isDark) {
          glow.addColorStop(0, "rgba(160,200,255,0.07)");
          glow.addColorStop(0.5, "rgba(120,170,255,0.03)");
          glow.addColorStop(1, "rgba(80,140,255,0)");
        } else {
          glow.addColorStop(0, "rgba(80,100,200,0.05)");
          glow.addColorStop(1, "rgba(80,100,200,0)");
        }
        ctx.beginPath();
        ctx.arc(gx, gy, GLOW_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();
      }

      // Draw stars
      for (const s of stars) {
        // Ambient drift (slow sine oscillation)
        let px = s.x + Math.sin(t * s.freqX + s.phaseX) * s.driftX;
        let py = s.y + Math.sin(t * s.freqY + s.phaseY) * s.driftY;

        // Scroll parallax — closer layers shift more
        py -= scrollY * SCROLL_PARALLAX[s.layer];

        // Cursor repel (desktop only)
        if (m.active && !isTouchRef.current) {
          const dx = px - m.px;
          const dy = py - m.py;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < REPEL_RADIUS && dist > 0) {
            const force = (1 - dist / REPEL_RADIUS) * REPEL_STRENGTH;
            px += (dx / dist) * force;
            py += (dy / dist) * force;
          }
        }

        const twinkle = 0.82 + Math.sin(t * s.twinkleFreq + s.twinklePhase) * 0.18;
        const alpha = Math.min(1, s.opacity * twinkle);

        ctx.beginPath();
        ctx.arc(px, py, s.r, 0, Math.PI * 2);
        ctx.fillStyle = isDark
          ? `rgba(255,255,255,${alpha})`
          : `rgba(15,15,20,${alpha})`;
        ctx.fill();
      }

      // Shooting stars
      if (frame >= nextShoot) {
        shoots.push(spawnShoot(W, H));
        nextShoot = frame + 100 + Math.floor(Math.random() * 150);
      }

      for (let i = shoots.length - 1; i >= 0; i--) {
        const ss = shoots[i];
        ss.life++;
        ss.x += ss.vx;
        ss.y += ss.vy;

        const p = ss.life / ss.maxLife;
        const alpha = p < 0.12 ? p / 0.12 : p > 0.65 ? 1 - (p - 0.65) / 0.35 : 1;

        const spd = Math.sqrt(ss.vx ** 2 + ss.vy ** 2);
        const nx = ss.vx / spd;
        const ny = ss.vy / spd;
        const tx = ss.x - nx * ss.len;
        const ty = ss.y - ny * ss.len;

        const g = ctx.createLinearGradient(tx, ty, ss.x, ss.y);
        if (isDark) {
          g.addColorStop(0,    `rgba(255,255,255,0)`);
          g.addColorStop(0.35, `rgba(210,225,255,${alpha * 0.20})`);
          g.addColorStop(0.75, `rgba(230,240,255,${alpha * 0.60})`);
          g.addColorStop(1,    `rgba(255,255,255,${alpha * 0.95})`);
        } else {
          g.addColorStop(0, `rgba(20,20,20,0)`);
          g.addColorStop(0.5, `rgba(20,20,20,${alpha * 0.15})`);
          g.addColorStop(1, `rgba(20,20,20,${alpha * 0.55})`);
        }
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(ss.x, ss.y);
        ctx.strokeStyle = g;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        if (isDark) {
          const glow = ctx.createRadialGradient(ss.x, ss.y, 0, ss.x, ss.y, ss.glowR * 4);
          glow.addColorStop(0,   `rgba(210,225,255,${alpha * 0.75})`);
          glow.addColorStop(0.5, `rgba(180,210,255,${alpha * 0.25})`);
          glow.addColorStop(1,   `rgba(150,190,255,0)`);
          ctx.beginPath();
          ctx.arc(ss.x, ss.y, ss.glowR * 4, 0, Math.PI * 2);
          ctx.fillStyle = glow;
          ctx.fill();
          ctx.beginPath();
          ctx.arc(ss.x, ss.y, ss.glowR * 0.55, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,255,255,${alpha})`;
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(ss.x, ss.y, 1.2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(20,20,20,${alpha * 0.7})`;
          ctx.fill();
        }

        if (ss.life >= ss.maxLife) shoots.splice(i, 1);
      }

      animId = requestAnimationFrame(draw);
    };

    draw();

    const onResize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W;
      canvas.height = H;
      stars = buildStars(W, H);
    };

    window.addEventListener("resize", onResize, { passive: true });
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
    };
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}
    />
  );
}
