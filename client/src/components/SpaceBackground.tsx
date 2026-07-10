// SpaceBackground — Dense 3D star field with dramatic shooting stars
// 1200+ stars across 5 depth layers, each drifting with organic sine-noise.
// Far layers barely move, near layers drift noticeably — strong 3D depth.
// Shooting stars: frequent, bright, with glowing head and long gradient tail.
import { useEffect, useRef } from "react";
import { useTheme } from "../contexts/ThemeContext";

interface Star {
  bx: number; by: number;
  r: number; opacity: number;
  freqX: number; freqY: number;
  phaseX: number; phaseY: number;
  ampX: number; ampY: number;
  twinkleFreq: number; twinklePhase: number;
}

// More stars, stronger amplitude differences between layers for clear 3D
const LAYER_CONFIGS = [
  { count: 320, rMin: 0.10, rMax: 0.28, oMin: 0.05, oMax: 0.16, ampScale: 2  }, // very far — barely moves
  { count: 260, rMin: 0.18, rMax: 0.42, oMin: 0.10, oMax: 0.28, ampScale: 7  }, // far
  { count: 200, rMin: 0.28, rMax: 0.58, oMin: 0.18, oMax: 0.42, ampScale: 16 }, // mid
  { count: 130, rMin: 0.40, rMax: 0.80, oMin: 0.28, oMax: 0.56, ampScale: 30 }, // near
  { count:  80, rMin: 0.55, rMax: 1.10, oMin: 0.40, oMax: 0.70, ampScale: 50 }, // very near — moves a lot
];

function buildStars(W: number, H: number): Star[] {
  const stars: Star[] = [];
  for (const cfg of LAYER_CONFIGS) {
    for (let i = 0; i < cfg.count; i++) {
      const baseFreq = 0.00025 + Math.random() * 0.0006;
      // X and Y use very different multipliers so path is never circular
      const ratioX = 0.5 + Math.random() * 1.0;
      const ratioY = 0.5 + Math.random() * 1.0;
      stars.push({
        bx: Math.random() * W,
        by: Math.random() * H,
        r: cfg.rMin + Math.random() * (cfg.rMax - cfg.rMin),
        opacity: cfg.oMin + Math.random() * (cfg.oMax - cfg.oMin),
        freqX: baseFreq * ratioX,
        freqY: baseFreq * ratioY * (Math.random() > 0.5 ? 1.4 : 0.6),
        phaseX: Math.random() * Math.PI * 2,
        phaseY: Math.random() * Math.PI * 2,
        ampX: cfg.ampScale * (0.6 + Math.random() * 0.8),
        ampY: cfg.ampScale * (0.6 + Math.random() * 0.8) * (0.5 + Math.random()),
        twinkleFreq: 0.003 + Math.random() * 0.010,
        twinklePhase: Math.random() * Math.PI * 2,
      });
    }
  }
  return stars;
}

interface ShootingStar {
  x: number; y: number;
  vx: number; vy: number;
  life: number; maxLife: number;
  len: number;
  glowR: number; // head glow radius
}

function spawnShoot(W: number, H: number): ShootingStar {
  const angle = (8 + Math.random() * 40) * (Math.PI / 180);
  const speed = 9 + Math.random() * 14;
  return {
    x: Math.random() * W * 0.8,
    y: Math.random() * H * 0.5,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    life: 0,
    maxLife: 28 + Math.random() * 42,
    len: 80 + Math.random() * 160,
    glowR: 1.5 + Math.random() * 2.5,
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
    // Start with 2 shooting stars already in progress
    shoots.push(spawnShoot(W, H));
    shoots.push({ ...spawnShoot(W, H), life: 10 });
    let nextShoot = 80;

    const draw = () => {
      t++;
      frame++;

      const isDark = theme === "dark";
      ctx.fillStyle = isDark ? "#000000" : "#eeeeee";
      ctx.fillRect(0, 0, W, H);

      // ── Stars ──
      for (const s of stars) {
        const dx = Math.sin(t * s.freqX + s.phaseX) * s.ampX;
        const dy = Math.sin(t * s.freqY + s.phaseY) * s.ampY;
        let px = ((s.bx + dx) % (W + 4) + W + 4) % (W + 4) - 2;
        let py = ((s.by + dy) % (H + 4) + H + 4) % (H + 4) - 2;

        const twinkle = 0.75 + Math.sin(t * s.twinkleFreq + s.twinklePhase) * 0.25;
        const alpha = s.opacity * twinkle;

        ctx.beginPath();
        ctx.arc(px, py, s.r, 0, Math.PI * 2);
        ctx.fillStyle = isDark
          ? `rgba(255,255,255,${alpha})`
          : `rgba(8,8,8,${alpha * 0.6})`;
        ctx.fill();
      }

      // ── Shooting Stars ──
      if (frame >= nextShoot) {
        shoots.push(spawnShoot(W, H));
        nextShoot = frame + 60 + Math.floor(Math.random() * 120); // more frequent
      }

      for (let i = shoots.length - 1; i >= 0; i--) {
        const ss = shoots[i];
        ss.life++;
        ss.x += ss.vx;
        ss.y += ss.vy;

        const p = ss.life / ss.maxLife;
        // Fade in fast, hold, fade out
        const alpha = p < 0.15 ? p / 0.15 : p > 0.6 ? 1 - (p - 0.6) / 0.4 : 1;

        const spd = Math.sqrt(ss.vx ** 2 + ss.vy ** 2);
        const nx = ss.vx / spd;
        const ny = ss.vy / spd;
        const tx = ss.x - nx * ss.len;
        const ty = ss.y - ny * ss.len;

        // Gradient tail
        const g = ctx.createLinearGradient(tx, ty, ss.x, ss.y);
        if (isDark) {
          g.addColorStop(0,   `rgba(255,255,255,0)`);
          g.addColorStop(0.4, `rgba(200,220,255,${alpha * 0.25})`);
          g.addColorStop(0.8, `rgba(220,235,255,${alpha * 0.65})`);
          g.addColorStop(1,   `rgba(255,255,255,${alpha * 0.95})`);
        } else {
          g.addColorStop(0,   `rgba(30,30,30,0)`);
          g.addColorStop(0.4, `rgba(30,30,30,${alpha * 0.15})`);
          g.addColorStop(1,   `rgba(30,30,30,${alpha * 0.6})`);
        }
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(ss.x, ss.y);
        ctx.strokeStyle = g;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Glowing head
        if (isDark) {
          // Outer glow
          const glow = ctx.createRadialGradient(ss.x, ss.y, 0, ss.x, ss.y, ss.glowR * 3);
          glow.addColorStop(0, `rgba(200,220,255,${alpha * 0.8})`);
          glow.addColorStop(0.4, `rgba(180,210,255,${alpha * 0.3})`);
          glow.addColorStop(1, `rgba(150,190,255,0)`);
          ctx.beginPath();
          ctx.arc(ss.x, ss.y, ss.glowR * 3, 0, Math.PI * 2);
          ctx.fillStyle = glow;
          ctx.fill();
          // Bright core
          ctx.beginPath();
          ctx.arc(ss.x, ss.y, ss.glowR * 0.6, 0, Math.PI * 2);
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
