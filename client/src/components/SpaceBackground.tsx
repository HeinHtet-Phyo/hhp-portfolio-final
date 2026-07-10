// SpaceBackground — Full-screen star field, whole canvas drifts together
// Stars fill the ENTIRE screen. The whole field slowly drifts as one unit
// using a global offset that moves in a slow circular path (3D feel).
// Each depth layer has a different drift multiplier = parallax depth.
// Shooting stars cross the full screen slowly with glowing tails.
import { useEffect, useRef } from "react";
import { useTheme } from "../contexts/ThemeContext";

interface Star {
  x: number;   // base x (0..W)
  y: number;   // base y (0..H)
  r: number;
  opacity: number;
  layer: number; // 0=far, 4=near
  twinkleFreq: number;
  twinklePhase: number;
}

// Layer drift multipliers: far barely moves, near moves more
const LAYER_DRIFT = [0.08, 0.18, 0.32, 0.52, 0.80];

const LAYER_CONFIGS = [
  { count: 350, rMin: 0.10, rMax: 0.28, oMin: 0.04, oMax: 0.18 },
  { count: 280, rMin: 0.18, rMax: 0.40, oMin: 0.10, oMax: 0.28 },
  { count: 200, rMin: 0.26, rMax: 0.55, oMin: 0.18, oMax: 0.42 },
  { count: 130, rMin: 0.36, rMax: 0.72, oMin: 0.28, oMax: 0.55 },
  { count:  80, rMin: 0.50, rMax: 0.95, oMin: 0.40, oMax: 0.68 },
];

function buildStars(W: number, H: number): Star[] {
  const stars: Star[] = [];
  LAYER_CONFIGS.forEach((cfg, li) => {
    for (let i = 0; i < cfg.count; i++) {
      stars.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: cfg.rMin + Math.random() * (cfg.rMax - cfg.rMin),
        opacity: cfg.oMin + Math.random() * (cfg.oMax - cfg.oMin),
        layer: li,
        twinkleFreq: 0.003 + Math.random() * 0.010,
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
  const speed = 3 + Math.random() * 4.5; // slow and graceful
  return {
    x: Math.random() * W * 0.8,
    y: Math.random() * H * 0.5,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    life: 0,
    maxLife: 60 + Math.random() * 80,
    len: 100 + Math.random() * 200,
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

    // Global drift: moves in a slow elliptical path
    // driftX and driftY are the current global offset
    const DRIFT_RADIUS_X = 35; // pixels the whole field drifts horizontally
    const DRIFT_RADIUS_Y = 22; // pixels the whole field drifts vertically
    const DRIFT_SPEED = 0.0004; // how fast the drift cycles

    const shoots: ShootingStar[] = [];
    shoots.push(spawnShoot(W, H));
    let nextShoot = 140;

    const draw = () => {
      t++;
      frame++;

      const isDark = theme === "dark";
      ctx.fillStyle = isDark ? "#000000" : "#eeeeee";
      ctx.fillRect(0, 0, W, H);

      // Global drift offset (slow elliptical path = 3D circular feel)
      const globalDX = Math.sin(t * DRIFT_SPEED) * DRIFT_RADIUS_X;
      const globalDY = Math.cos(t * DRIFT_SPEED * 0.7) * DRIFT_RADIUS_Y;

      // Draw stars
      for (const s of stars) {
        const mult = LAYER_DRIFT[s.layer];
        // Each layer moves a fraction of the global drift
        const ox = globalDX * mult;
        const oy = globalDY * mult;

        // Wrap around edges so no empty corners
        let px = ((s.x + ox) % (W + 4) + W + 4) % (W + 4) - 2;
        let py = ((s.y + oy) % (H + 4) + H + 4) % (H + 4) - 2;

        const twinkle = 0.78 + Math.sin(t * s.twinkleFreq + s.twinklePhase) * 0.22;
        const alpha = s.opacity * twinkle;

        ctx.beginPath();
        ctx.arc(px, py, s.r, 0, Math.PI * 2);
        ctx.fillStyle = isDark
          ? `rgba(255,255,255,${alpha})`
          : `rgba(8,8,8,${alpha * 0.6})`;
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
