// SpaceBackground — 3D Parallax Tilt Star Field
// Hundreds of stars spread across the canvas at multiple depth layers.
// Each layer has its own parallax multiplier — deeper layers barely move,
// near layers shift significantly when the mouse moves.
// The whole field also slowly auto-rotates/drifts on its own.
// Result: feels like you're floating in 3D space, looking at stars at different depths.
import { useEffect, useRef } from "react";
import { useTheme } from "../contexts/ThemeContext";

// 5 depth layers: each has count, size, opacity, and how much it shifts with mouse
const LAYERS = [
  { count: 180, rMin: 0.2, rMax: 0.5,  oMin: 0.08, oMax: 0.22, parallax: 8  },  // very far
  { count: 140, rMin: 0.3, rMax: 0.65, oMin: 0.15, oMax: 0.38, parallax: 18 },  // far
  { count: 100, rMin: 0.4, rMax: 0.80, oMin: 0.25, oMax: 0.55, parallax: 32 },  // mid
  { count:  70, rMin: 0.5, rMax: 1.00, oMin: 0.35, oMax: 0.70, parallax: 52 },  // near
  { count:  40, rMin: 0.7, rMax: 1.30, oMin: 0.50, oMax: 0.85, parallax: 80 },  // very near
];

interface Star {
  bx: number;  // base x (0..1 normalized)
  by: number;  // base y (0..1 normalized)
  r: number;
  opacity: number;
  parallax: number;
  twinkleSpeed: number;
  twinklePhase: number;
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

    // Mouse: normalized -1..1 from center
    let tMX = 0, tMY = 0;
    let sMX = 0, sMY = 0;

    // Build stars
    const stars: Star[] = [];
    for (const layer of LAYERS) {
      for (let i = 0; i < layer.count; i++) {
        stars.push({
          bx: Math.random(),
          by: Math.random(),
          r: layer.rMin + Math.random() * (layer.rMax - layer.rMin),
          opacity: layer.oMin + Math.random() * (layer.oMax - layer.oMin),
          parallax: layer.parallax,
          twinkleSpeed: 0.005 + Math.random() * 0.015,
          twinklePhase: Math.random() * Math.PI * 2,
        });
      }
    }

    // Shooting stars
    interface Shoot { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; len: number; }
    const shoots: Shoot[] = [];
    let frame = 0;
    let nextShoot = 200;

    const spawnShoot = () => {
      const angle = (15 + Math.random() * 30) * (Math.PI / 180);
      const speed = 6 + Math.random() * 8;
      shoots.push({
        x: Math.random() * W * 0.7,
        y: Math.random() * H * 0.4,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: 35 + Math.random() * 40,
        len: 50 + Math.random() * 100,
      });
    };

    const draw = () => {
      frame++;

      // Smooth mouse
      sMX += (tMX - sMX) * 0.04;
      sMY += (tMY - sMY) * 0.04;

      // Slow auto-drift (sinusoidal, very gentle)
      const autoDX = Math.sin(frame * 0.0007) * 0.12;
      const autoDY = Math.cos(frame * 0.0005) * 0.08;
      const totalMX = sMX + autoDX;
      const totalMY = sMY + autoDY;

      const isDark = theme === "dark";
      ctx.fillStyle = isDark ? "#000000" : "#f2f2f2";
      ctx.fillRect(0, 0, W, H);

      // Draw stars
      for (const s of stars) {
        // Base position in pixels
        const basePX = s.bx * W;
        const basePY = s.by * H;

        // Parallax offset: near stars shift more
        const offsetX = totalMX * s.parallax;
        const offsetY = totalMY * s.parallax;

        // Final position with wrapping so stars fill the canvas edge-to-edge
        const px = ((basePX + offsetX) % (W + 60) + W + 60) % (W + 60) - 30;
        const py = ((basePY + offsetY) % (H + 60) + H + 60) % (H + 60) - 30;

        // Twinkle
        const twinkle = 0.75 + Math.sin(frame * s.twinkleSpeed + s.twinklePhase) * 0.25;
        const alpha = s.opacity * twinkle;

        ctx.beginPath();
        ctx.arc(px, py, s.r, 0, Math.PI * 2);
        ctx.fillStyle = isDark
          ? `rgba(255,255,255,${alpha})`
          : `rgba(10,10,10,${alpha * 0.5})`;
        ctx.fill();
      }

      // Shooting stars
      if (frame >= nextShoot) {
        spawnShoot();
        nextShoot = frame + 150 + Math.floor(Math.random() * 250);
      }
      for (let i = shoots.length - 1; i >= 0; i--) {
        const ss = shoots[i];
        ss.life++;
        ss.x += ss.vx;
        ss.y += ss.vy;
        const p = ss.life / ss.maxLife;
        const alpha = p < 0.2 ? p / 0.2 : p > 0.6 ? 1 - (p - 0.6) / 0.4 : 1;
        const spd = Math.sqrt(ss.vx ** 2 + ss.vy ** 2);
        const tx = ss.x - (ss.vx / spd) * ss.len;
        const ty = ss.y - (ss.vy / spd) * ss.len;
        const g = ctx.createLinearGradient(tx, ty, ss.x, ss.y);
        if (isDark) {
          g.addColorStop(0, `rgba(255,255,255,0)`);
          g.addColorStop(0.5, `rgba(255,255,255,${alpha * 0.35})`);
          g.addColorStop(1, `rgba(255,255,255,${alpha * 0.85})`);
        } else {
          g.addColorStop(0, `rgba(20,20,20,0)`);
          g.addColorStop(0.5, `rgba(20,20,20,${alpha * 0.2})`);
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

    const onMouseMove = (e: MouseEvent) => {
      tMX = (e.clientX / W - 0.5) * 2;
      tMY = (e.clientY / H - 0.5) * 2;
    };

    const onResize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W;
      canvas.height = H;
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
