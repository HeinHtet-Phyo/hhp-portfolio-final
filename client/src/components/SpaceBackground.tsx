// SpaceBackground — Self-animating 3D floating star field
// Every star has its own velocity (vx, vy) and drifts continuously.
// Stars are in 5 depth layers — deeper ones move slower, nearer ones faster.
// This creates a natural 3D parallax depth effect purely from self-motion.
// Mouse adds a subtle extra tilt on top.
import { useEffect, useRef } from "react";
import { useTheme } from "../contexts/ThemeContext";

interface Star {
  x: number;   // current x in pixels
  y: number;   // current y in pixels
  vx: number;  // velocity x (pixels/frame)
  vy: number;  // velocity y (pixels/frame)
  r: number;   // radius
  opacity: number;
  twinkleSpeed: number;
  twinklePhase: number;
  layer: number; // 0=far, 4=near
}

// Layer configs: speed multiplier, size, opacity
const LAYER_CONFIGS = [
  { count: 160, speedMult: 0.08, rMin: 0.15, rMax: 0.40, oMin: 0.08, oMax: 0.20 }, // very far
  { count: 130, speedMult: 0.16, rMin: 0.25, rMax: 0.55, oMin: 0.14, oMax: 0.32 }, // far
  { count: 100, speedMult: 0.28, rMin: 0.35, rMax: 0.72, oMin: 0.22, oMax: 0.48 }, // mid
  { count:  70, speedMult: 0.45, rMin: 0.50, rMax: 0.90, oMin: 0.32, oMax: 0.62 }, // near
  { count:  40, speedMult: 0.70, rMin: 0.65, rMax: 1.20, oMin: 0.45, oMax: 0.78 }, // very near
];

function buildStars(W: number, H: number): Star[] {
  const stars: Star[] = [];
  LAYER_CONFIGS.forEach((cfg, li) => {
    for (let i = 0; i < cfg.count; i++) {
      // Random direction
      const angle = Math.random() * Math.PI * 2;
      const speed = cfg.speedMult * (0.5 + Math.random() * 0.5);
      stars.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r: cfg.rMin + Math.random() * (cfg.rMax - cfg.rMin),
        opacity: cfg.oMin + Math.random() * (cfg.oMax - cfg.oMin),
        twinkleSpeed: 0.004 + Math.random() * 0.012,
        twinklePhase: Math.random() * Math.PI * 2,
        layer: li,
      });
    }
  });
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
    let frame = 0;

    // Shooting stars
    interface Shoot { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; len: number; }
    const shoots: Shoot[] = [];
    let nextShoot = 180;

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
      frame++;

      const isDark = theme === "dark";
      ctx.fillStyle = isDark ? "#000000" : "#f0f0f0";
      ctx.fillRect(0, 0, W, H);

      for (const s of stars) {
        // Move star
        s.x += s.vx;
        s.y += s.vy;

        // Wrap around edges seamlessly
        if (s.x < -2) s.x = W + 2;
        else if (s.x > W + 2) s.x = -2;
        if (s.y < -2) s.y = H + 2;
        else if (s.y > H + 2) s.y = -2;

        // Twinkle
        const twinkle = 0.78 + Math.sin(frame * s.twinkleSpeed + s.twinklePhase) * 0.22;
        const alpha = s.opacity * twinkle;

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
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
