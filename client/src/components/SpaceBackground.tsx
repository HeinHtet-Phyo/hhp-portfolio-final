// SpaceBackground — True 3D X-axis rotation
// Stars are placed in 3D space (x, y, z).
// The whole field rotates around the X axis — like a wheel rolling toward you.
// Stars come from the top, pass through the center, disappear behind.
// Perspective projection makes near stars appear bigger/brighter.
// 6000+ dots, very bright, slow graceful shooting stars.
import { useEffect, useRef } from "react";
import { useTheme } from "../contexts/ThemeContext";

interface Star {
  x: number;  // 3D x
  y: number;  // 3D y
  z: number;  // 3D z (depth)
  r: number;
  opacity: number;
  twinkleFreq: number;
  twinklePhase: number;
}

// 5 depth layers — different rotation speeds for parallax
const LAYERS = [
  { count: 2500, rotSpeed: 0.00012, rMin: 0.15, rMax: 0.32, oMin: 0.35, oMax: 0.65, spread: 1.0 },
  { count: 1600, rotSpeed: 0.00020, rMin: 0.20, rMax: 0.44, oMin: 0.50, oMax: 0.75, spread: 0.8 },
  { count: 1000, rotSpeed: 0.00030, rMin: 0.28, rMax: 0.58, oMin: 0.60, oMax: 0.85, spread: 0.6 },
  { count:  600, rotSpeed: 0.00042, rMin: 0.38, rMax: 0.74, oMin: 0.65, oMax: 0.90, spread: 0.4 },
  { count:  350, rotSpeed: 0.00058, rMin: 0.50, rMax: 1.00, oMin: 0.70, oMax: 0.95, spread: 0.25 },
];

interface Star3D {
  x: number; y: number; z: number;
  r: number; opacity: number;
  twinkleFreq: number; twinklePhase: number;
  layer: number;
  rotAngle: number; // current rotation angle around X axis
  rotRadius: number; // distance from X axis (sqrt(y²+z²))
  initAngle: number; // initial angle in YZ plane
}

function buildStars(W: number, H: number): Star3D[] {
  const stars: Star3D[] = [];
  const maxSpread = Math.max(W, H) * 0.7;

  LAYERS.forEach((cfg, li) => {
    for (let i = 0; i < cfg.count; i++) {
      // Random X position across full width
      const x = (Math.random() - 0.5) * maxSpread * 2;
      // Random position in YZ plane (defines circle of rotation)
      const initAngle = Math.random() * Math.PI * 2;
      const rotRadius = Math.sqrt(Math.random()) * maxSpread * cfg.spread;
      const y = Math.cos(initAngle) * rotRadius;
      const z = Math.sin(initAngle) * rotRadius;

      stars.push({
        x, y, z,
        r: cfg.rMin + Math.random() * (cfg.rMax - cfg.rMin),
        opacity: cfg.oMin + Math.random() * (cfg.oMax - cfg.oMin),
        twinkleFreq: 0.003 + Math.random() * 0.010,
        twinklePhase: Math.random() * Math.PI * 2,
        layer: li,
        rotAngle: initAngle,
        rotRadius,
        initAngle,
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
    y: Math.random() * H * 0.5,
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

    const FOV = 600; // perspective field of view

    const draw = () => {
      t++;
      frame++;

      const isDark = theme === "dark";
      ctx.fillStyle = isDark ? "#000000" : "#eeeeee";
      ctx.fillRect(0, 0, W, H);

      const cx = W / 2;
      const cy = H / 2;

      // Rotate each star around X axis
      for (const s of stars) {
        const cfg = LAYERS[s.layer];
        s.rotAngle += cfg.rotSpeed;

        // New Y and Z from rotation around X axis
        const newY = Math.cos(s.rotAngle) * s.rotRadius;
        const newZ = Math.sin(s.rotAngle) * s.rotRadius;

        // Perspective projection
        const depth = FOV + newZ;
        if (depth <= 0) continue;
        const scale = FOV / depth;

        const px = cx + s.x * scale;
        const py = cy + newY * scale;

        // Depth-based alpha: stars in front (newZ < 0) are brighter
        const depthAlpha = 0.4 + (1 - (newZ + W * 0.7) / (W * 1.4)) * 0.6;
        const twinkle = 0.78 + Math.sin(t * s.twinkleFreq + s.twinklePhase) * 0.22;
        const alpha = Math.min(1, s.opacity * twinkle * depthAlpha);
        const dotR = Math.max(0.1, s.r * scale);

        ctx.beginPath();
        ctx.arc(px, py, dotR, 0, Math.PI * 2);
        ctx.fillStyle = isDark
          ? `rgba(255,255,255,${alpha})`
          : `rgba(8,8,8,${alpha * 0.65})`;
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
