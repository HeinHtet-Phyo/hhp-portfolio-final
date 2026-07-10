// Space Background — cursor-reactive star dots + shooting stars
// Pure canvas, GPU-composited, zero React re-renders per frame
import { useEffect, useRef } from "react";
import { useTheme } from "../contexts/ThemeContext";

interface Star {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  r: number;
  opacity: number;
  twinkleSpeed: number;
  twinkleOffset: number;
}

interface ShootingStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  length: number;
  opacity: number;
  life: number;
  maxLife: number;
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
    let mouseX = W / 2;
    let mouseY = H / 2;
    let time = 0;

    canvas.width = W;
    canvas.height = H;

    // Generate stars
    const STAR_COUNT = Math.floor((W * H) / 4000);
    const stars: Star[] = Array.from({ length: STAR_COUNT }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      baseX: 0,
      baseY: 0,
      r: Math.random() * 1.4 + 0.3,
      opacity: Math.random() * 0.6 + 0.2,
      twinkleSpeed: Math.random() * 0.02 + 0.005,
      twinkleOffset: Math.random() * Math.PI * 2,
    }));

    // Set base positions
    stars.forEach((s) => {
      s.baseX = s.x;
      s.baseY = s.y;
    });

    const shootingStars: ShootingStar[] = [];
    let nextShoot = 0;

    const spawnShootingStar = () => {
      const angle = (Math.random() * 40 + 20) * (Math.PI / 180);
      const speed = Math.random() * 8 + 6;
      const startX = Math.random() * W * 0.8;
      const startY = Math.random() * H * 0.4;
      shootingStars.push({
        x: startX,
        y: startY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        length: Math.random() * 100 + 60,
        opacity: 1,
        life: 0,
        maxLife: Math.random() * 60 + 40,
      });
    };

    const draw = () => {
      time++;

      // Background
      if (theme === "dark") {
        ctx.fillStyle = "#000000";
      } else {
        ctx.fillStyle = "#f8f8f8";
      }
      ctx.fillRect(0, 0, W, H);

      // Cursor influence — stars gently drift toward cursor
      const cx = mouseX;
      const cy = mouseY;
      const INFLUENCE_RADIUS = 180;
      const INFLUENCE_STRENGTH = 0.04;

      stars.forEach((s) => {
        const dx = cx - s.baseX;
        const dy = cy - s.baseY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < INFLUENCE_RADIUS) {
          const factor = (1 - dist / INFLUENCE_RADIUS) * INFLUENCE_STRENGTH;
          s.x = s.baseX + dx * factor;
          s.y = s.baseY + dy * factor;
        } else {
          // Drift back
          s.x += (s.baseX - s.x) * 0.05;
          s.y += (s.baseY - s.y) * 0.05;
        }

        // Twinkle
        const twinkle = Math.sin(time * s.twinkleSpeed + s.twinkleOffset) * 0.3 + 0.7;
        const alpha = s.opacity * twinkle;

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle =
          theme === "dark"
            ? `rgba(255,255,255,${alpha})`
            : `rgba(0,0,0,${alpha * 0.5})`;
        ctx.fill();
      });

      // Shooting stars
      if (time >= nextShoot) {
        spawnShootingStar();
        nextShoot = time + Math.floor(Math.random() * 180 + 90);
      }

      shootingStars.forEach((ss, i) => {
        ss.life++;
        ss.x += ss.vx;
        ss.y += ss.vy;
        const progress = ss.life / ss.maxLife;
        ss.opacity = progress < 0.2
          ? progress / 0.2
          : progress > 0.7
          ? 1 - (progress - 0.7) / 0.3
          : 1;

        const tailX = ss.x - ss.vx * (ss.length / Math.sqrt(ss.vx * ss.vx + ss.vy * ss.vy));
        const tailY = ss.y - ss.vy * (ss.length / Math.sqrt(ss.vx * ss.vx + ss.vy * ss.vy));

        const grad = ctx.createLinearGradient(tailX, tailY, ss.x, ss.y);
        if (theme === "dark") {
          grad.addColorStop(0, `rgba(255,255,255,0)`);
          grad.addColorStop(0.7, `rgba(255,255,255,${ss.opacity * 0.4})`);
          grad.addColorStop(1, `rgba(255,255,255,${ss.opacity})`);
        } else {
          grad.addColorStop(0, `rgba(80,80,80,0)`);
          grad.addColorStop(0.7, `rgba(80,80,80,${ss.opacity * 0.3})`);
          grad.addColorStop(1, `rgba(80,80,80,${ss.opacity * 0.7})`);
        }

        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(ss.x, ss.y);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Head glow
        ctx.beginPath();
        ctx.arc(ss.x, ss.y, 1.5, 0, Math.PI * 2);
        ctx.fillStyle =
          theme === "dark"
            ? `rgba(255,255,255,${ss.opacity})`
            : `rgba(80,80,80,${ss.opacity * 0.8})`;
        ctx.fill();
      });

      // Remove dead shooting stars
      for (let i = shootingStars.length - 1; i >= 0; i--) {
        if (shootingStars[i].life >= shootingStars[i].maxLife) {
          shootingStars.splice(i, 1);
        }
      }

      animId = requestAnimationFrame(draw);
    };

    draw();

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
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
      id="space-canvas"
      style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}
    />
  );
}
