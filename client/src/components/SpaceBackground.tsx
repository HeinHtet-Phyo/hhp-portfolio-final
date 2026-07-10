// Space Background — True 3D parallax star field
// Stars exist at multiple Z-depth layers. Mouse movement shifts each layer
// by a different amount, creating genuine 3D depth illusion.
// Lots of tiny dots, no glow, clean night-sky look.
import { useEffect, useRef } from "react";
import { useTheme } from "../contexts/ThemeContext";

const LAYERS = [
  // { count per 1000px², size range, opacity range, parallax factor, drift speed }
  { density: 0.0008, rMin: 0.15, rMax: 0.45, oMin: 0.12, oMax: 0.35, parallax: 0.012, drift: 0.06 }, // far
  { density: 0.0006, rMin: 0.35, rMax: 0.70, oMin: 0.25, oMax: 0.55, parallax: 0.030, drift: 0.10 }, // mid-far
  { density: 0.0004, rMin: 0.55, rMax: 0.95, oMin: 0.40, oMax: 0.75, parallax: 0.060, drift: 0.16 }, // mid
  { density: 0.0002, rMin: 0.80, rMax: 1.30, oMin: 0.55, oMax: 0.90, parallax: 0.110, drift: 0.24 }, // near
];

interface Star {
  x: number;
  y: number;
  r: number;
  opacity: number;
  twinkleSpeed: number;
  twinkleOffset: number;
  layer: number;
  parallax: number;
  drift: number;
}

interface ShootingStar {
  x: number; y: number;
  vx: number; vy: number;
  length: number;
  opacity: number;
  life: number; maxLife: number;
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

    // Smoothed mouse offset (pixels from center)
    let rawMX = 0, rawMY = 0;
    let smoothMX = 0, smoothMY = 0;

    // Auto-drift accumulator
    let driftT = 0;

    canvas.width = W;
    canvas.height = H;

    const buildStars = () => {
      const stars: Star[] = [];
      const area = W * H;
      LAYERS.forEach((l, li) => {
        const count = Math.floor(area * l.density);
        for (let i = 0; i < count; i++) {
          stars.push({
            x: Math.random() * W,
            y: Math.random() * H,
            r: l.rMin + Math.random() * (l.rMax - l.rMin),
            opacity: l.oMin + Math.random() * (l.oMax - l.oMin),
            twinkleSpeed: 0.004 + Math.random() * 0.012,
            twinkleOffset: Math.random() * Math.PI * 2,
            layer: li,
            parallax: l.parallax,
            drift: l.drift,
          });
        }
      });
      return stars;
    };

    let stars = buildStars();
    const shootingStars: ShootingStar[] = [];
    let frame = 0;
    let nextShoot = 140;

    const spawnShoot = () => {
      const angle = (10 + Math.random() * 35) * (Math.PI / 180);
      const speed = 8 + Math.random() * 10;
      shootingStars.push({
        x: Math.random() * W * 0.8,
        y: Math.random() * H * 0.45,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        length: 60 + Math.random() * 110,
        opacity: 1, life: 0,
        maxLife: 30 + Math.random() * 45,
      });
    };

    const draw = () => {
      frame++;
      driftT += 0.0004;

      // Smooth mouse tracking — slow lerp for cinematic feel
      smoothMX += (rawMX - smoothMX) * 0.05;
      smoothMY += (rawMY - smoothMY) * 0.05;

      // Background
      ctx.fillStyle = theme === "dark" ? "#000000" : "#f6f6f6";
      ctx.fillRect(0, 0, W, H);

      // Draw each star with its layer's parallax offset + slow auto-drift
      stars.forEach((s) => {
        // Parallax: closer layers shift more
        const maxShift = 55; // max px shift for nearest layer (parallax=0.11)
        const px = smoothMX * (s.parallax / 0.11) * maxShift;
        const py = smoothMY * (s.parallax / 0.11) * maxShift;

        // Auto-drift: each layer drifts at slightly different speed/direction
        const driftX = Math.cos(driftT * s.drift * 8 + s.layer * 1.2) * s.drift * 18;
        const driftY = Math.sin(driftT * s.drift * 5 + s.layer * 0.9) * s.drift * 10;

        // Final position with wrapping
        let sx = ((s.x + px + driftX) % (W + 60) + W + 60) % (W + 60) - 30;
        let sy = ((s.y + py + driftY) % (H + 60) + H + 60) % (H + 60) - 30;

        // Twinkle
        const twinkle = 0.7 + Math.sin(frame * s.twinkleSpeed + s.twinkleOffset) * 0.3;
        const alpha = s.opacity * twinkle;

        ctx.beginPath();
        ctx.arc(sx, sy, s.r, 0, Math.PI * 2);
        ctx.fillStyle = theme === "dark"
          ? `rgba(255,255,255,${alpha})`
          : `rgba(15,15,15,${alpha * 0.45})`;
        ctx.fill();
      });

      // Shooting stars
      if (frame >= nextShoot) {
        spawnShoot();
        nextShoot = frame + 120 + Math.floor(Math.random() * 200);
      }

      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const ss = shootingStars[i];
        ss.life++;
        ss.x += ss.vx;
        ss.y += ss.vy;
        const p = ss.life / ss.maxLife;
        ss.opacity = p < 0.15 ? p / 0.15 : p > 0.65 ? 1 - (p - 0.65) / 0.35 : 1;

        const spd = Math.sqrt(ss.vx * ss.vx + ss.vy * ss.vy);
        const tx = ss.x - (ss.vx / spd) * ss.length;
        const ty = ss.y - (ss.vy / spd) * ss.length;

        const g = ctx.createLinearGradient(tx, ty, ss.x, ss.y);
        if (theme === "dark") {
          g.addColorStop(0, `rgba(255,255,255,0)`);
          g.addColorStop(0.6, `rgba(255,255,255,${ss.opacity * 0.4})`);
          g.addColorStop(1, `rgba(255,255,255,${ss.opacity * 0.9})`);
        } else {
          g.addColorStop(0, `rgba(40,40,40,0)`);
          g.addColorStop(0.6, `rgba(40,40,40,${ss.opacity * 0.25})`);
          g.addColorStop(1, `rgba(40,40,40,${ss.opacity * 0.6})`);
        }
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(ss.x, ss.y);
        ctx.strokeStyle = g;
        ctx.lineWidth = 1.1;
        ctx.stroke();

        // Head
        ctx.beginPath();
        ctx.arc(ss.x, ss.y, 1.0, 0, Math.PI * 2);
        ctx.fillStyle = theme === "dark"
          ? `rgba(255,255,255,${ss.opacity})`
          : `rgba(40,40,40,${ss.opacity * 0.65})`;
        ctx.fill();

        if (ss.life >= ss.maxLife) shootingStars.splice(i, 1);
      }

      animId = requestAnimationFrame(draw);
    };

    draw();

    const onMouseMove = (e: MouseEvent) => {
      // Normalize: -1 to +1 from center
      rawMX = (e.clientX / W - 0.5) * 2;
      rawMY = (e.clientY / H - 0.5) * 2;
    };

    const onResize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W;
      canvas.height = H;
      stars = buildStars();
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("mousemove", onMouseMove);
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
