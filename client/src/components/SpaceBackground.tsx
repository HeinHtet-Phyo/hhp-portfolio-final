// SpaceBackground — Animated starfield
// Features:
//   1. Stars slowly rotate around the centre of the canvas (self-rotating galaxy)
//   2. Cursor creates a glowing ripple/aura on the background
//   3. Scroll accelerates the star flow temporarily
//   4. Cursor parallax: closer layers shift more than distant ones
//   5. Twinkle + shooting stars
import { useEffect, useRef } from "react";
import { useTheme } from "../contexts/ThemeContext";

interface Star {
  x: number; y: number;        // base position (relative to canvas centre)
  r: number;
  opacity: number;
  driftX: number; driftY: number;
  freqX: number; freqY: number;
  phaseX: number; phaseY: number;
  twinkleFreq: number; twinklePhase: number;
  layer: number;               // 0 = farthest, 4 = closest
}

const LAYERS = [
  { count: 1100, rMin: 0.15, rMax: 0.30, oMin: 0.75, oMax: 0.95, drift: 2.5 },
  { count:  700, rMin: 0.20, rMax: 0.42, oMin: 0.80, oMax: 0.98, drift: 4.0 },
  { count:  450, rMin: 0.28, rMax: 0.55, oMin: 0.85, oMax: 1.00, drift: 6.0 },
  { count:  250, rMin: 0.36, rMax: 0.70, oMin: 0.88, oMax: 1.00, drift: 8.5 },
  { count:  150, rMin: 0.48, rMax: 0.92, oMin: 0.92, oMax: 1.00, drift: 12.0 },
];

// Parallax shift per layer (px) when cursor is at edge
const PARALLAX = [4, 8, 14, 20, 28];

function buildStars(W: number, H: number): Star[] {
  const stars: Star[] = [];
  LAYERS.forEach((cfg, layerIdx) => {
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
        layer: layerIdx,
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

interface Ripple {
  x: number; y: number;
  r: number; maxR: number;
  alpha: number; life: number;
}

export default function SpaceBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();
  const mouseRef = useRef({ x: 0.5, y: 0.5, tx: 0.5, ty: 0.5, px: 0, py: 0 });
  const scrollRef = useRef({ boost: 0 }); // extra flow speed from scroll

  // Track mouse
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouseRef.current.tx = e.clientX / window.innerWidth;
      mouseRef.current.ty = e.clientY / window.innerHeight;
      mouseRef.current.px = e.clientX;
      mouseRef.current.py = e.clientY;
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  // Track scroll
  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const delta = Math.abs(window.scrollY - lastY);
      lastY = window.scrollY;
      scrollRef.current.boost = Math.min(scrollRef.current.boost + delta * 0.15, 8);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
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

    // Rotation angle (radians) — very slow self-rotation
    let rotAngle = 0;
    const ROT_SPEED = 0.00008; // radians per frame

    // Global flow direction
    const flowSpeed = 0.06;
    const flowVX = Math.cos(Math.PI * 0.15) * flowSpeed;
    const flowVY = Math.sin(Math.PI * 0.15) * flowSpeed;

    const shoots: ShootingStar[] = [];
    shoots.push(spawnShoot(W, H));
    let nextShoot = 140;

    // Ripple pool — cursor click/move creates ripples on background
    const ripples: Ripple[] = [];
    let lastRippleFrame = 0;

    const draw = () => {
      t++;
      frame++;

      // Smooth mouse lerp
      const m = mouseRef.current;
      m.x += (m.tx - m.x) * 0.05;
      m.y += (m.ty - m.y) * 0.05;
      const mx = m.x - 0.5; // -0.5 to 0.5
      const my = m.y - 0.5;

      // Scroll boost decay
      const sc = scrollRef.current;
      sc.boost *= 0.92;
      const totalFlowVX = flowVX * (1 + sc.boost);
      const totalFlowVY = flowVY * (1 + sc.boost);

      // Advance rotation
      rotAngle += ROT_SPEED;
      const cosR = Math.cos(rotAngle);
      const sinR = Math.sin(rotAngle);
      const cx = W / 2;
      const cy = H / 2;

      // Spawn cursor ripple every ~40 frames
      if (frame - lastRippleFrame > 40) {
        ripples.push({ x: m.px, y: m.py, r: 0, maxR: 80 + Math.random() * 60, alpha: 0.35, life: 0 });
        lastRippleFrame = frame;
      }

      const isDark = theme === "dark";
      ctx.fillStyle = isDark ? "#000000" : "#f0f0f0";
      ctx.fillRect(0, 0, W, H);

      // Draw cursor ripples (behind stars)
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rp = ripples[i];
        rp.r += (rp.maxR - rp.r) * 0.04;
        rp.life++;
        rp.alpha *= 0.96;
        if (rp.alpha < 0.005) { ripples.splice(i, 1); continue; }

        const grad = ctx.createRadialGradient(rp.x, rp.y, 0, rp.x, rp.y, rp.r);
        if (isDark) {
          grad.addColorStop(0, `rgba(180,220,255,${rp.alpha * 0.6})`);
          grad.addColorStop(0.4, `rgba(120,180,255,${rp.alpha * 0.25})`);
          grad.addColorStop(1, `rgba(80,140,255,0)`);
        } else {
          grad.addColorStop(0, `rgba(80,100,200,${rp.alpha * 0.3})`);
          grad.addColorStop(1, `rgba(80,100,200,0)`);
        }
        ctx.beginPath();
        ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      }

      // Apply global flow + rotation to star base positions
      for (const s of stars) {
        s.x += totalFlowVX;
        s.y += totalFlowVY;
        if (s.x > W + 2) s.x -= W + 4;
        if (s.x < -2) s.x += W + 4;
        if (s.y > H + 2) s.y -= H + 4;
        if (s.y < -2) s.y += H + 4;
      }

      // Draw stars with rotation + parallax
      for (const s of stars) {
        const pStrength = PARALLAX[s.layer];
        // Drift oscillation
        const driftedX = s.x + Math.sin(t * s.freqX + s.phaseX) * s.driftX;
        const driftedY = s.y + Math.sin(t * s.freqY + s.phaseY) * s.driftY;

        // Rotate around canvas centre
        const dx = driftedX - cx;
        const dy = driftedY - cy;
        const rx = dx * cosR - dy * sinR + cx;
        const ry = dx * sinR + dy * cosR + cy;

        // Cursor parallax offset
        const px = rx + mx * pStrength;
        const py = ry + my * pStrength;

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
