// Space Background — tiny uniform star dots
// The entire star field slowly auto-drifts + parallax-shifts with cursor movement
// No glow, no bold dots — just clean small stars like a real night sky
import { useEffect, useRef } from "react";
import { useTheme } from "../contexts/ThemeContext";

interface Star {
  x: number;
  y: number;
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
    // Target mouse position (normalized -0.5 to 0.5)
    let targetMX = 0;
    let targetMY = 0;
    // Smoothed offset for parallax
    let offsetX = 0;
    let offsetY = 0;
    // Auto-drift angle
    let driftAngle = 0;
    let time = 0;

    canvas.width = W;
    canvas.height = H;

    // Dense small uniform dots — no size tiers, all tiny
    const STAR_COUNT = Math.floor((W * H) / 1200);
    const stars: Star[] = Array.from({ length: STAR_COUNT }, () => ({
      x: Math.random() * (W + 200) - 100,
      y: Math.random() * (H + 200) - 100,
      r: Math.random() * 0.7 + 0.2,          // tiny: 0.2–0.9px
      opacity: Math.random() * 0.55 + 0.15,  // subtle: 0.15–0.7
      twinkleSpeed: Math.random() * 0.018 + 0.003,
      twinkleOffset: Math.random() * Math.PI * 2,
    }));

    const shootingStars: ShootingStar[] = [];
    let nextShoot = 120;

    const spawnShootingStar = () => {
      const angle = (Math.random() * 30 + 10) * (Math.PI / 180);
      const speed = Math.random() * 9 + 7;
      shootingStars.push({
        x: Math.random() * W * 0.8,
        y: Math.random() * H * 0.4,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        length: Math.random() * 100 + 60,
        opacity: 1,
        life: 0,
        maxLife: Math.random() * 50 + 30,
      });
    };

    const draw = () => {
      time++;

      // Smooth lerp offset toward mouse target (parallax)
      // Max shift: 30px
      const maxShift = 30;
      const targetOX = targetMX * maxShift;
      const targetOY = targetMY * maxShift;
      offsetX += (targetOX - offsetX) * 0.04;
      offsetY += (targetOY - offsetY) * 0.04;

      // Auto-drift — very slow circular drift
      driftAngle += 0.0003;
      const driftX = Math.cos(driftAngle) * 0.15;
      const driftY = Math.sin(driftAngle * 0.7) * 0.1;

      // Background
      ctx.fillStyle = theme === "dark" ? "#000000" : "#f8f8f8";
      ctx.fillRect(0, 0, W, H);

      // Draw stars with combined parallax + drift offset
      stars.forEach((s) => {
        // Parallax depth — stars at different depths shift different amounts
        const depth = s.r / 0.9; // 0.2–1.0 range
        const px = ((s.x + offsetX * depth + driftX * time * depth) % (W + 200) + W + 200) % (W + 200) - 100;
        const py = ((s.y + offsetY * depth + driftY * time * depth) % (H + 200) + H + 200) % (H + 200) - 100;

        // Twinkle
        const twinkle = Math.sin(time * s.twinkleSpeed + s.twinkleOffset) * 0.25 + 0.75;
        const alpha = s.opacity * twinkle;

        ctx.beginPath();
        ctx.arc(px, py, s.r, 0, Math.PI * 2);
        ctx.fillStyle = theme === "dark"
          ? `rgba(255,255,255,${alpha})`
          : `rgba(20,20,20,${alpha * 0.5})`;
        ctx.fill();
      });

      // Shooting stars
      if (time >= nextShoot) {
        spawnShootingStar();
        nextShoot = time + Math.floor(Math.random() * 200 + 100);
      }

      shootingStars.forEach((ss) => {
        ss.life++;
        ss.x += ss.vx;
        ss.y += ss.vy;
        const progress = ss.life / ss.maxLife;
        ss.opacity = progress < 0.15
          ? progress / 0.15
          : progress > 0.7
          ? 1 - (progress - 0.7) / 0.3
          : 1;

        const spd = Math.sqrt(ss.vx * ss.vx + ss.vy * ss.vy);
        const tailX = ss.x - (ss.vx / spd) * ss.length;
        const tailY = ss.y - (ss.vy / spd) * ss.length;

        const grad = ctx.createLinearGradient(tailX, tailY, ss.x, ss.y);
        if (theme === "dark") {
          grad.addColorStop(0, `rgba(255,255,255,0)`);
          grad.addColorStop(0.7, `rgba(255,255,255,${ss.opacity * 0.45})`);
          grad.addColorStop(1, `rgba(255,255,255,${ss.opacity * 0.9})`);
        } else {
          grad.addColorStop(0, `rgba(50,50,50,0)`);
          grad.addColorStop(0.7, `rgba(50,50,50,${ss.opacity * 0.3})`);
          grad.addColorStop(1, `rgba(50,50,50,${ss.opacity * 0.65})`);
        }

        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(ss.x, ss.y);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Head dot
        ctx.beginPath();
        ctx.arc(ss.x, ss.y, 1.2, 0, Math.PI * 2);
        ctx.fillStyle = theme === "dark"
          ? `rgba(255,255,255,${ss.opacity})`
          : `rgba(50,50,50,${ss.opacity * 0.7})`;
        ctx.fill();
      });

      for (let i = shootingStars.length - 1; i >= 0; i--) {
        if (shootingStars[i].life >= shootingStars[i].maxLife) {
          shootingStars.splice(i, 1);
        }
      }

      animId = requestAnimationFrame(draw);
    };

    draw();

    const onMouseMove = (e: MouseEvent) => {
      // Normalize to -0.5 .. 0.5
      targetMX = (e.clientX / W - 0.5);
      targetMY = (e.clientY / H - 0.5);
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
