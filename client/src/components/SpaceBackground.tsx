// SpaceBackground — 3D Floating Star Field
// Stars drift organically using sine-based noise offsets on X and Y independently.
// Each star has a unique phase and frequency so motion looks random, not circular.
// 5 depth layers: far stars barely move, near stars drift more — true 3D depth.
// More stars, tiny dots, clean space feel.
import { useEffect, useRef } from "react";
import { useTheme } from "../contexts/ThemeContext";

interface Star {
  bx: number;      // base x (pixels)
  by: number;      // base y (pixels)
  r: number;       // radius
  opacity: number;
  // Independent X and Y oscillation params (different freq/phase = non-circular)
  freqX: number;
  freqY: number;
  phaseX: number;
  phaseY: number;
  ampX: number;    // amplitude in pixels
  ampY: number;
  twinkleFreq: number;
  twinklePhase: number;
}

const LAYER_CONFIGS = [
  { count: 220, rMin: 0.12, rMax: 0.35, oMin: 0.06, oMax: 0.18, ampScale: 4  },
  { count: 180, rMin: 0.22, rMax: 0.50, oMin: 0.12, oMax: 0.30, ampScale: 9  },
  { count: 130, rMin: 0.32, rMax: 0.68, oMin: 0.20, oMax: 0.45, ampScale: 16 },
  { count:  90, rMin: 0.45, rMax: 0.88, oMin: 0.30, oMax: 0.58, ampScale: 26 },
  { count:  55, rMin: 0.60, rMax: 1.15, oMin: 0.42, oMax: 0.72, ampScale: 40 },
];

function buildStars(W: number, H: number): Star[] {
  const stars: Star[] = [];
  for (const cfg of LAYER_CONFIGS) {
    for (let i = 0; i < cfg.count; i++) {
      // Use very different frequencies for X and Y so motion is never circular
      const baseFreq = 0.0003 + Math.random() * 0.0008;
      stars.push({
        bx: Math.random() * W,
        by: Math.random() * H,
        r: cfg.rMin + Math.random() * (cfg.rMax - cfg.rMin),
        opacity: cfg.oMin + Math.random() * (cfg.oMax - cfg.oMin),
        freqX: baseFreq * (0.6 + Math.random() * 0.8),
        freqY: baseFreq * (0.6 + Math.random() * 0.8) * (Math.random() > 0.5 ? 1.3 : 0.7),
        phaseX: Math.random() * Math.PI * 2,
        phaseY: Math.random() * Math.PI * 2,
        ampX: cfg.ampScale * (0.5 + Math.random()),
        ampY: cfg.ampScale * (0.5 + Math.random()) * (0.6 + Math.random() * 0.8),
        twinkleFreq: 0.004 + Math.random() * 0.012,
        twinklePhase: Math.random() * Math.PI * 2,
      });
    }
  }
  return stars;
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
    let t = 0; // time counter

    // Shooting stars
    interface Shoot { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; len: number; }
    const shoots: Shoot[] = [];
    let nextShoot = 200;
    let frame = 0;

    const spawnShoot = () => {
      const angle = (10 + Math.random() * 35) * (Math.PI / 180);
      const speed = 7 + Math.random() * 9;
      shoots.push({
        x: Math.random() * W * 0.75,
        y: Math.random() * H * 0.45,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: 30 + Math.random() * 45,
        len: 55 + Math.random() * 100,
      });
    };

    const draw = () => {
      t++;
      frame++;

      const isDark = theme === "dark";
      ctx.fillStyle = isDark ? "#000000" : "#f0f0f0";
      ctx.fillRect(0, 0, W, H);

      for (const s of stars) {
        // Organic 3D float: X and Y use independent sine waves with different freq/phase
        // This creates figure-8, elliptical, and irregular paths — never a circle
        const dx = Math.sin(t * s.freqX + s.phaseX) * s.ampX;
        const dy = Math.sin(t * s.freqY + s.phaseY) * s.ampY;

        let px = s.bx + dx;
        let py = s.by + dy;

        // Wrap
        px = ((px % (W + 4)) + W + 4) % (W + 4) - 2;
        py = ((py % (H + 4)) + H + 4) % (H + 4) - 2;

        // Twinkle
        const twinkle = 0.78 + Math.sin(t * s.twinkleFreq + s.twinklePhase) * 0.22;
        const alpha = s.opacity * twinkle;

        ctx.beginPath();
        ctx.arc(px, py, s.r, 0, Math.PI * 2);
        ctx.fillStyle = isDark
          ? `rgba(255,255,255,${alpha})`
          : `rgba(10,10,10,${alpha * 0.55})`;
        ctx.fill();
      }

      // Shooting stars
      if (frame >= nextShoot) {
        spawnShoot();
        nextShoot = frame + 160 + Math.floor(Math.random() * 220);
      }
      for (let i = shoots.length - 1; i >= 0; i--) {
        const ss = shoots[i];
        ss.life++;
        ss.x += ss.vx;
        ss.y += ss.vy;
        const p = ss.life / ss.maxLife;
        const alpha = p < 0.2 ? p / 0.2 : p > 0.65 ? 1 - (p - 0.65) / 0.35 : 1;
        const spd = Math.sqrt(ss.vx ** 2 + ss.vy ** 2);
        const tx = ss.x - (ss.vx / spd) * ss.len;
        const ty = ss.y - (ss.vy / spd) * ss.len;
        const g = ctx.createLinearGradient(tx, ty, ss.x, ss.y);
        if (isDark) {
          g.addColorStop(0, `rgba(255,255,255,0)`);
          g.addColorStop(0.5, `rgba(255,255,255,${alpha * 0.3})`);
          g.addColorStop(1, `rgba(255,255,255,${alpha * 0.85})`);
        } else {
          g.addColorStop(0, `rgba(20,20,20,0)`);
          g.addColorStop(0.5, `rgba(20,20,20,${alpha * 0.18})`);
          g.addColorStop(1, `rgba(20,20,20,${alpha * 0.55})`);
        }
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(ss.x, ss.y);
        ctx.strokeStyle = g;
        ctx.lineWidth = 1.0;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(ss.x, ss.y, 0.9, 0, Math.PI * 2);
        ctx.fillStyle = isDark ? `rgba(255,255,255,${alpha})` : `rgba(20,20,20,${alpha * 0.6})`;
        ctx.fill();
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
