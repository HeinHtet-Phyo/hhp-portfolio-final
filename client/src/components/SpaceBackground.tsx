// SpaceBackground — Static star field, no rotation
// 6000+ bright dots fill the entire screen.
// Each dot slowly drifts with its own organic motion (sine waves).
// Slow graceful shooting stars with glowing tails.
import { useEffect, useRef } from "react";
import { useTheme } from "../contexts/ThemeContext";

interface Star {
  x: number;
  y: number;
  r: number;
  opacity: number;
  // Drift params
  driftX: number;   // drift amplitude X
  driftY: number;   // drift amplitude Y
  freqX: number;    // drift frequency X
  freqY: number;    // drift frequency Y
  phaseX: number;
  phaseY: number;
  // Twinkle
  twinkleFreq: number;
  twinklePhase: number;
}

const LAYERS = [
  { count:  480, rMin: 0.25, rMax: 0.48, oMin: 0.92, oMax: 1.00, drift: 2.5 },
  { count:  300, rMin: 0.32, rMax: 0.60, oMin: 0.94, oMax: 1.00, drift: 4.0 },
  { count:  165, rMin: 0.42, rMax: 0.78, oMin: 0.95, oMax: 1.00, drift: 6.0 },
  { count:   85, rMin: 0.55, rMax: 0.95, oMin: 0.97, oMax: 1.00, drift: 8.5 },
  { count:   42, rMin: 0.70, rMax: 1.25, oMin: 0.98, oMax: 1.00, drift: 12.0 },
];

function buildStars(W: number, H: number): Star[] {
  const stars: Star[] = [];
  LAYERS.forEach((cfg) => {
    for (let i = 0; i < cfg.count; i++) {
      stars.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: cfg.rMin + Math.random() * (cfg.rMax - cfg.rMin),
        opacity: cfg.oMin + Math.random() * (cfg.oMax - cfg.oMin),
        driftX: (Math.random() * 0.6 + 0.4) * cfg.drift,
        driftY: (Math.random() * 0.6 + 0.4) * cfg.drift,
        freqX: 0.0003 + Math.random() * 0.0006,
        freqY: 0.0002 + Math.random() * 0.0005,
        phaseX: Math.random() * Math.PI * 2,
        phaseY: Math.random() * Math.PI * 2,
        twinkleFreq: 0.004 + Math.random() * 0.010,
        twinklePhase: Math.random() * Math.PI * 2,
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
      ctx.fillStyle = isDark ? "#000000" : "#f0f0f0";
      ctx.fillRect(0, 0, W, H);

      for (const s of stars) {
        const px = s.x + Math.sin(t * s.freqX + s.phaseX) * s.driftX;
        const py = s.y + Math.sin(t * s.freqY + s.phaseY) * s.driftY;

        const twinkle = 0.82 + Math.sin(t * s.twinkleFreq + s.twinklePhase) * 0.18;
        const alpha = Math.min(1, s.opacity * twinkle);

        ctx.beginPath();
        ctx.arc(px, py, s.r, 0, Math.PI * 2);
        ctx.fillStyle = isDark
          ? `rgba(255,255,255,${alpha})`
          : `rgba(5,5,10,${alpha})`;
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
