// SpaceBackground — Dense rotating 3D star field
// The ENTIRE star field slowly rotates as one unit (circular 3D motion).
// Multiple layers rotate at different speeds = depth illusion.
// Stars are placed in a sphere projected onto screen — true 3D circular feel.
// Shooting stars are slow and graceful with long glowing tails.
import { useEffect, useRef } from "react";
import { useTheme } from "../contexts/ThemeContext";

interface Star {
  // 3D position on a sphere
  theta: number;  // azimuth angle
  phi: number;    // polar angle
  radius: number; // sphere radius (depth layer)
  r: number;      // dot size
  opacity: number;
  twinkleFreq: number;
  twinklePhase: number;
  layer: number;
}

// 5 depth layers — different rotation speeds and sizes
const LAYERS = [
  { count: 350, rotSpeed: 0.00006, rMin: 0.10, rMax: 0.30, oMin: 0.04, oMax: 0.18, radiusMin: 0.75, radiusMax: 1.0  },
  { count: 280, rotSpeed: 0.00010, rMin: 0.18, rMax: 0.42, oMin: 0.10, oMax: 0.28, radiusMin: 0.55, radiusMax: 0.75 },
  { count: 200, rotSpeed: 0.00016, rMin: 0.26, rMax: 0.58, oMin: 0.18, oMax: 0.42, radiusMin: 0.38, radiusMax: 0.55 },
  { count: 130, rotSpeed: 0.00024, rMin: 0.36, rMax: 0.76, oMin: 0.28, oMax: 0.55, radiusMin: 0.22, radiusMax: 0.38 },
  { count:  80, rotSpeed: 0.00036, rMin: 0.50, rMax: 1.00, oMin: 0.40, oMax: 0.68, radiusMin: 0.08, radiusMax: 0.22 },
];

function buildStars(): Star[] {
  const stars: Star[] = [];
  LAYERS.forEach((cfg, li) => {
    for (let i = 0; i < cfg.count; i++) {
      stars.push({
        theta: Math.random() * Math.PI * 2,
        phi: Math.acos(2 * Math.random() - 1), // uniform sphere distribution
        radius: cfg.radiusMin + Math.random() * (cfg.radiusMax - cfg.radiusMin),
        r: cfg.rMin + Math.random() * (cfg.rMax - cfg.rMin),
        opacity: cfg.oMin + Math.random() * (cfg.oMax - cfg.oMin),
        twinkleFreq: 0.003 + Math.random() * 0.010,
        twinklePhase: Math.random() * Math.PI * 2,
        layer: li,
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
  const angle = (12 + Math.random() * 30) * (Math.PI / 180);
  const speed = 3.5 + Math.random() * 5; // slower, more graceful
  return {
    x: Math.random() * W * 0.8,
    y: Math.random() * H * 0.5,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    life: 0,
    maxLife: 55 + Math.random() * 70, // longer life = slower feel
    len: 90 + Math.random() * 180,
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

    const stars = buildStars();
    let t = 0;
    let frame = 0;

    // Layer rotation offsets
    const layerAngles = LAYERS.map(() => Math.random() * Math.PI * 2);

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
      const scale = Math.min(W, H) * 0.65;

      // Advance each layer's rotation angle
      LAYERS.forEach((cfg, li) => {
        layerAngles[li] += cfg.rotSpeed;
      });

      // Draw stars — project 3D sphere coords to 2D screen
      for (const s of stars) {
        const cfg = LAYERS[s.layer];
        const rotAngle = layerAngles[s.layer];

        // Rotate theta by layer's current angle
        const rotTheta = s.theta + rotAngle;

        // 3D sphere → Cartesian
        const x3 = s.radius * Math.sin(s.phi) * Math.cos(rotTheta);
        const y3 = s.radius * Math.sin(s.phi) * Math.sin(rotTheta);
        const z3 = s.radius * Math.cos(s.phi);

        // Simple perspective projection (z goes into screen)
        // Tilt the sphere slightly so we see the rotation as circular
        const tiltAngle = 0.35; // ~20 degrees tilt
        const yt = y3 * Math.cos(tiltAngle) - z3 * Math.sin(tiltAngle);
        const zt = y3 * Math.sin(tiltAngle) + z3 * Math.cos(tiltAngle);

        const perspective = 1.8 / (1.8 + zt);
        const px = cx + x3 * scale * perspective;
        const py = cy + yt * scale * perspective * 0.55; // flatten Y a bit

        // Cull stars behind the viewer
        if (zt < -0.9) continue;

        // Depth-based opacity boost
        const depthAlpha = 0.4 + perspective * 0.6;
        const twinkle = 0.78 + Math.sin(t * s.twinkleFreq + s.twinklePhase) * 0.22;
        const alpha = s.opacity * twinkle * depthAlpha;
        const dotR = s.r * perspective;

        ctx.beginPath();
        ctx.arc(px, py, Math.max(0.1, dotR), 0, Math.PI * 2);
        ctx.fillStyle = isDark
          ? `rgba(255,255,255,${alpha})`
          : `rgba(8,8,8,${alpha * 0.6})`;
        ctx.fill();
      }

      // Shooting stars
      if (frame >= nextShoot) {
        shoots.push(spawnShoot(W, H));
        nextShoot = frame + 100 + Math.floor(Math.random() * 160);
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

        // Long gradient tail
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
          // Soft outer glow
          const glow = ctx.createRadialGradient(ss.x, ss.y, 0, ss.x, ss.y, ss.glowR * 4);
          glow.addColorStop(0,   `rgba(210,225,255,${alpha * 0.75})`);
          glow.addColorStop(0.5, `rgba(180,210,255,${alpha * 0.25})`);
          glow.addColorStop(1,   `rgba(150,190,255,0)`);
          ctx.beginPath();
          ctx.arc(ss.x, ss.y, ss.glowR * 4, 0, Math.PI * 2);
          ctx.fillStyle = glow;
          ctx.fill();
          // Bright core
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
