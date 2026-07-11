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
  { count: 1100, rMin: 0.15, rMax: 0.30, oMin: 0.75, oMax: 0.95, drift: 2.5 },
  { count:  700, rMin: 0.20, rMax: 0.42, oMin: 0.80, oMax: 0.98, drift: 4.0 },
  { count:  450, rMin: 0.28, rMax: 0.55, oMin: 0.85, oMax: 1.00, drift: 6.0 },
  { count:  250, rMin: 0.36, rMax: 0.70, oMin: 0.88, oMax: 1.00, drift: 8.5 },
  { count:  150, rMin: 0.48, rMax: 0.92, oMin: 0.92, oMax: 1.00, drift: 12.0 },
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
  const mouseRef = useRef({ x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouseRef.current.tx = e.clientX / window.innerWidth;
      mouseRef.current.ty = e.clientY / window.innerHeight;
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
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

    // Global drift: slow flow direction
    const flowAngle = Math.PI * 0.15; // gentle diagonal
    const flowSpeed = 0.08; // pixels per frame
    const flowVX = Math.cos(flowAngle) * flowSpeed;
    const flowVY = Math.sin(flowAngle) * flowSpeed;

    const shoots: ShootingStar[] = [];
    shoots.push(spawnShoot(W, H));
    let nextShoot = 140;

    // Parallax strengths per layer (index 0 = smallest/farthest, 4 = largest/closest)
    const PARALLAX = [4, 8, 14, 20, 28]; // max pixel offset per layer
    let layerIdx = 0;

    const draw = () => {
      t++;
      frame++;

      // Smooth mouse lerp
      const m = mouseRef.current;
      m.x += (m.tx - m.x) * 0.05;
      m.y += (m.ty - m.y) * 0.05;
      // offset from center: -0.5 to 0.5
      const mx = m.x - 0.5;
      const my = m.y - 0.5;

      const isDark = theme === "dark";
      ctx.fillStyle = isDark ? "#000000" : "#f0f0f0";
      ctx.fillRect(0, 0, W, H);

      // Apply global flow — wrap stars around edges
      for (const s of stars) {
        s.x += flowVX;
        s.y += flowVY;
        if (s.x > W + 2) s.x -= W + 4;
        if (s.x < -2) s.x += W + 4;
        if (s.y > H + 2) s.y -= H + 4;
        if (s.y < -2) s.y += H + 4;
      }

      layerIdx = 0;
      let layerCount = 0;
      for (const s of stars) {
        // Determine which layer this star belongs to (layers are added in order)
        if (layerCount >= LAYERS[layerIdx].count) { layerIdx++; layerCount = 0; }
        layerCount++;
        const pStrength = PARALLAX[Math.min(layerIdx, PARALLAX.length - 1)];
        const px = s.x + Math.sin(t * s.freqX + s.phaseX) * s.driftX + mx * pStrength;
        const py = s.y + Math.sin(t * s.freqY + s.phaseY) * s.driftY + my * pStrength;

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
