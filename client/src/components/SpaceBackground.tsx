// Space Background — cursor-reactive star dots + shooting stars
// Dense, bold stars with strong cursor push/pull effect
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
  vx: number;
  vy: number;
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

    // Dense stars — more count, larger sizes
    const STAR_COUNT = Math.floor((W * H) / 1800);
    const stars: Star[] = Array.from({ length: STAR_COUNT }, () => {
      const tier = Math.random();
      // 3 tiers: small dim, medium, large bright
      const r = tier < 0.55
        ? Math.random() * 0.8 + 0.4   // small: 0.4–1.2
        : tier < 0.85
        ? Math.random() * 1.2 + 1.0   // medium: 1.0–2.2
        : Math.random() * 1.8 + 1.8;  // large: 1.8–3.6
      const opacity = tier < 0.55
        ? Math.random() * 0.4 + 0.3
        : tier < 0.85
        ? Math.random() * 0.4 + 0.5
        : Math.random() * 0.3 + 0.7;
      const bx = Math.random() * W;
      const by = Math.random() * H;
      return {
        x: bx, y: by, baseX: bx, baseY: by,
        r, opacity,
        twinkleSpeed: Math.random() * 0.025 + 0.005,
        twinkleOffset: Math.random() * Math.PI * 2,
        vx: 0, vy: 0,
      };
    });

    const shootingStars: ShootingStar[] = [];
    let nextShoot = 60;

    const spawnShootingStar = () => {
      const angle = (Math.random() * 35 + 15) * (Math.PI / 180);
      const speed = Math.random() * 10 + 8;
      shootingStars.push({
        x: Math.random() * W * 0.75,
        y: Math.random() * H * 0.45,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        length: Math.random() * 120 + 80,
        opacity: 1,
        life: 0,
        maxLife: Math.random() * 55 + 35,
      });
    };

    const INFLUENCE_RADIUS = 220;
    const PUSH_STRENGTH = 18; // pixels of max displacement

    const draw = () => {
      time++;

      ctx.fillStyle = theme === "dark" ? "#000000" : "#f5f5f5";
      ctx.fillRect(0, 0, W, H);

      // Stars
      stars.forEach((s) => {
        const dx = mouseX - s.baseX;
        const dy = mouseY - s.baseY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Push stars away from cursor (repel)
        let targetX = s.baseX;
        let targetY = s.baseY;
        if (dist < INFLUENCE_RADIUS && dist > 0) {
          const factor = (1 - dist / INFLUENCE_RADIUS);
          // Repel direction (away from cursor)
          targetX = s.baseX - (dx / dist) * factor * PUSH_STRENGTH;
          targetY = s.baseY - (dy / dist) * factor * PUSH_STRENGTH;
        }

        // Smooth lerp toward target
        s.x += (targetX - s.x) * 0.08;
        s.y += (targetY - s.y) * 0.08;

        // Twinkle
        const twinkle = Math.sin(time * s.twinkleSpeed + s.twinkleOffset) * 0.35 + 0.65;
        const alpha = s.opacity * twinkle;

        // Draw star with glow for larger ones
        if (s.r > 1.8) {
          // Glow
          const grd = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 3);
          if (theme === "dark") {
            grd.addColorStop(0, `rgba(255,255,255,${alpha * 0.6})`);
            grd.addColorStop(1, `rgba(255,255,255,0)`);
          } else {
            grd.addColorStop(0, `rgba(0,0,0,${alpha * 0.3})`);
            grd.addColorStop(1, `rgba(0,0,0,0)`);
          }
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r * 3, 0, Math.PI * 2);
          ctx.fillStyle = grd;
          ctx.fill();
        }

        // Core dot
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = theme === "dark"
          ? `rgba(255,255,255,${alpha})`
          : `rgba(30,30,30,${alpha * 0.6})`;
        ctx.fill();
      });

      // Shooting stars
      if (time >= nextShoot) {
        spawnShootingStar();
        nextShoot = time + Math.floor(Math.random() * 160 + 80);
      }

      shootingStars.forEach((ss) => {
        ss.life++;
        ss.x += ss.vx;
        ss.y += ss.vy;
        const progress = ss.life / ss.maxLife;
        ss.opacity = progress < 0.15
          ? progress / 0.15
          : progress > 0.65
          ? 1 - (progress - 0.65) / 0.35
          : 1;

        const spd = Math.sqrt(ss.vx * ss.vx + ss.vy * ss.vy);
        const tailX = ss.x - (ss.vx / spd) * ss.length;
        const tailY = ss.y - (ss.vy / spd) * ss.length;

        const grad = ctx.createLinearGradient(tailX, tailY, ss.x, ss.y);
        if (theme === "dark") {
          grad.addColorStop(0, `rgba(255,255,255,0)`);
          grad.addColorStop(0.6, `rgba(255,255,255,${ss.opacity * 0.5})`);
          grad.addColorStop(1, `rgba(255,255,255,${ss.opacity})`);
        } else {
          grad.addColorStop(0, `rgba(60,60,60,0)`);
          grad.addColorStop(0.6, `rgba(60,60,60,${ss.opacity * 0.35})`);
          grad.addColorStop(1, `rgba(60,60,60,${ss.opacity * 0.75})`);
        }

        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(ss.x, ss.y);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.8;
        ctx.stroke();

        // Head glow
        const headGrd = ctx.createRadialGradient(ss.x, ss.y, 0, ss.x, ss.y, 4);
        if (theme === "dark") {
          headGrd.addColorStop(0, `rgba(255,255,255,${ss.opacity})`);
          headGrd.addColorStop(1, `rgba(255,255,255,0)`);
        } else {
          headGrd.addColorStop(0, `rgba(60,60,60,${ss.opacity * 0.8})`);
          headGrd.addColorStop(1, `rgba(60,60,60,0)`);
        }
        ctx.beginPath();
        ctx.arc(ss.x, ss.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = headGrd;
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
      style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}
    />
  );
}
