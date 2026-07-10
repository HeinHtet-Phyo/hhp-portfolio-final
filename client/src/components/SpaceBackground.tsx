// SpaceBackground — 2000+ dots, whole field rotates together in 3D circular motion
// Stars fill the ENTIRE screen. The whole canvas rotates as one unit around
// a tilted axis — giving a true 3D circular spinning galaxy feel.
// Each depth layer rotates at a slightly different speed for parallax depth.
import { useEffect, useRef } from "react";
import { useTheme } from "../contexts/ThemeContext";

interface Star {
  // Position stored as angle + distance from center (polar)
  // so rotation is just angle += speed
  cx: number;   // center offset x from canvas center
  cy: number;   // center offset y from canvas center
  r: number;
  opacity: number;
  layer: number;
  twinkleFreq: number;
  twinklePhase: number;
}

// Layer configs: more dots, each layer rotates at different speed
const LAYERS = [
  { count: 600, rotSpeed: 0.00005, rMin: 0.10, rMax: 0.26, oMin: 0.04, oMax: 0.17 },
  { count: 480, rotSpeed: 0.00009, rMin: 0.16, rMax: 0.38, oMin: 0.09, oMax: 0.27 },
  { count: 340, rotSpeed: 0.00015, rMin: 0.24, rMax: 0.52, oMin: 0.17, oMax: 0.40 },
  { count: 220, rotSpeed: 0.00023, rMin: 0.34, rMax: 0.70, oMin: 0.27, oMax: 0.54 },
  { count: 130, rotSpeed: 0.00034, rMin: 0.48, rMax: 0.92, oMin: 0.38, oMax: 0.66 },
];

function buildStars(W: number, H: number): Star[] {
  const stars: Star[] = [];
  // Spread radius: use diagonal so corners are filled
  const maxR = Math.sqrt(W * W + H * H) * 0.52;

  LAYERS.forEach((cfg, li) => {
    for (let i = 0; i < cfg.count; i++) {
      // Uniform random distribution across full screen area
      const dist = Math.sqrt(Math.random()) * maxR;
      const angle = Math.random() * Math.PI * 2;
      stars.push({
        cx: Math.cos(angle) * dist,
        cy: Math.sin(angle) * dist,
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

    // Per-layer rotation offsets
    const layerAngles = LAYERS.map(() => Math.random() * Math.PI * 2);

    // 3D tilt: the rotation axis is tilted so it looks 3D not flat
    // We apply a slight Y-axis tilt when projecting
    const TILT = 0.28; // radians (~16 degrees) — makes it look 3D

    const shoots: ShootingStar[] = [];
    shoots.push(spawnShoot(W, H));
    let nextShoot = 140;

    const draw = () => {
      t++;
      frame++;

      const isDark = theme === "dark";
      ctx.fillStyle = isDark ? "#000000" : "#eeeeee";
      ctx.fillRect(0, 0, W, H);

      const cx = W / 2;
      const cy = H / 2;

      // Advance each layer's rotation
      LAYERS.forEach((cfg, li) => {
        layerAngles[li] += cfg.rotSpeed;
      });

      // Draw stars
      for (const s of stars) {
        const cfg = LAYERS[s.layer];
        const rot = layerAngles[s.layer];

        // Rotate the star's position by the layer angle
        const cosR = Math.cos(rot);
        const sinR = Math.sin(rot);
        const rx = s.cx * cosR - s.cy * sinR;
        const ry = s.cx * sinR + s.cy * cosR;

        // Apply 3D tilt: compress Y axis slightly to simulate perspective tilt
        const px = cx + rx;
        const py = cy + ry * Math.cos(TILT);

        // Depth cue from Y position after tilt
        const depthFactor = 0.7 + (py / H) * 0.3;

        const twinkle = 0.78 + Math.sin(t * s.twinkleFreq + s.twinklePhase) * 0.22;
        const alpha = s.opacity * twinkle * depthFactor;

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
