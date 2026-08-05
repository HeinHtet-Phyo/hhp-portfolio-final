// EducationSection — flight-map layout on the site's global starfield.
//
// Desktop: a real vector world map (world-atlas TopoJSON via d3-geo), with
// location cards leader-lined to their map pins and an animated great-circle
// flight path (Yangon → Bristol) flown by a plane icon.
// Mobile (<1024px): plain vertical stack, map and flight path hidden.
//
// Everything is drawn in *pixel space* — the SVG viewBox matches the measured
// container box at the default uniform preserveAspectRatio — so circles stay
// circular and 1px strokes stay 1px.

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { geoNaturalEarth1, geoPath, geoInterpolate } from "d3-geo";
import { loadCountries, type CountryFeature, GBR, MMR, BRISTOL, YANGON } from "../../lib/worldAtlas";

function useInView(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== "undefined" ? window.innerWidth >= 1024 : true
  );
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return isDesktop;
}

// ─── Data ────────────────────────────────────────────────────────────────
// Placeholder-editable education history, earliest first.

type EduEntry = {
  id: string;
  institution: string;
  monogram: string;
  location: string;
  programme: string;
  period: string;
  url: string;
  coords: [number, number];
  side: "left" | "right"; // which edge the card sits against
  topPct: number;         // card top, as a fraction of the container height
  // Leader line: which card edge it leaves from, and where along that edge.
  // "right" exits horizontally then bends vertically to the pin; "top"/"bottom"
  // exit vertically then bend horizontally. One right-angle bend either way.
  exit: "right" | "top" | "bottom";
  exitFrac: number;
  // px offset applied to the pin, to separate the two co-located Yangon pins.
  // Offset vertically, not horizontally, so their leader lines' horizontal
  // segments don't land on the same y and overlap.
  pinDx: number;
  pinDy: number;
};

const EDUCATION: EduEntry[] = [
  {
    id: "gusto-foundation",
    institution: "GUSTO College Myanmar",
    monogram: "GC",
    location: "Yangon, Myanmar",
    programme: "Foundation Diploma in IT",
    period: "Jul 2022 – Oct 2022",
    url: "https://gustocollege.com",
    coords: YANGON, side: "right", topPct: 0.62,
    exit: "top", exitFrac: 0.68, pinDx: 0, pinDy: 7,
  },
  {
    id: "gusto-hnd",
    institution: "GUSTO College Myanmar",
    monogram: "GC",
    location: "Yangon, Myanmar",
    programme: "Higher National Diploma in Computing",
    period: "Nov 2022 – Nov 2024",
    url: "https://gustocollege.com",
    coords: YANGON, side: "right", topPct: 0.04,
    exit: "bottom", exitFrac: 0.45, pinDx: 0, pinDy: -7,
  },
  {
    id: "uwe-bristol",
    institution: "UWE Bristol",
    monogram: "UWE",
    location: "Bristol, UK",
    programme: "BSc Data Science & Artificial Intelligence",
    period: "Sep 2023 – Jun 2026",
    url: "https://www.uwe.ac.uk",
    coords: BRISTOL, side: "left", topPct: 0.45,
    exit: "right", exitFrac: 0.5, pinDx: 0, pinDy: 0,
  },
];

const CARD_W = 240;
const CARD_PAD = 16;
const CARD_H_FALLBACK = 178; // used only until the real card height is measured
const MIN_H = 600;           // container floor, so the card columns always have room

/** Line-art aeroplane silhouette, nose pointing +x, ~14px long. */
function PlaneGlyph() {
  return (
    <path
      d="M 7 0 L 1 -1 L -1 -5 L -3 -5 L -2.5 -1 L -5 -0.8 L -6 -2.6 L -6.9 -2.6 L -6.4 0 L -6.9 2.6 L -6 2.6 L -5 0.8 L -2.5 1 L -3 5 L -1 5 L 1 1 Z"
      fill="#ffffff"
    />
  );
}

// ─── Card ────────────────────────────────────────────────────────────────

function CornerBrackets() {
  const c = "rgba(255,255,255,0.35)";
  const base: React.CSSProperties = { position: "absolute", width: 10, height: 10, pointerEvents: "none" };
  return (
    <>
      <span style={{ ...base, top: -1, left: -1, borderTop: `1px solid ${c}`, borderLeft: `1px solid ${c}` }} />
      <span style={{ ...base, top: -1, right: -1, borderTop: `1px solid ${c}`, borderRight: `1px solid ${c}` }} />
      <span style={{ ...base, bottom: -1, left: -1, borderBottom: `1px solid ${c}`, borderLeft: `1px solid ${c}` }} />
      <span style={{ ...base, bottom: -1, right: -1, borderBottom: `1px solid ${c}`, borderRight: `1px solid ${c}` }} />
    </>
  );
}

function EduCard({
  entry, inView, delay, style, innerRef,
}: {
  entry: EduEntry; inView: boolean; delay: number; style?: React.CSSProperties;
  innerRef?: (el: HTMLAnchorElement | null) => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <a
      ref={innerRef}
      href={entry.url}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "block",
        position: "relative",
        boxSizing: "border-box",
        maxWidth: CARD_W,
        textDecoration: "none",
        color: "inherit",
        border: `1px solid rgba(255,255,255,${hovered ? 0.3 : 0.16})`,
        borderRadius: 6,
        background: hovered ? "rgba(255,255,255,0.045)" : "rgba(255,255,255,0.02)",
        padding: CARD_PAD,
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(20px)",
        transition:
          "opacity 0.2s ease, transform 0.2s ease, border-color 0.25s ease, background 0.25s ease",
        transitionDelay: `${delay}s, ${delay}s, 0s, 0s`,
        ...style,
      }}
    >
      <CornerBrackets />

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{
          width: 40, height: 40,
          border: "1px solid rgba(255,255,255,0.2)",
          borderRadius: 4, background: "transparent",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 11, fontWeight: 600, color: "#ffffff", flexShrink: 0,
        }}>
          {entry.monogram}
        </div>
        <span style={{ fontSize: 13, color: "#6b7280", lineHeight: 1 }} aria-hidden>↗</span>
      </div>

      <div style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase",
        color: "#8b929b", marginBottom: 6,
      }}>
        {entry.location}
      </div>

      <div style={{
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: 15, fontWeight: 500, color: "#ffffff",
        lineHeight: 1.3, marginBottom: 12,
      }}>
        {entry.institution}
      </div>

      <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", marginBottom: 12 }} />

      <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: "#9aa3ad", lineHeight: 1.45, marginBottom: 6 }}>
        {entry.programme}
      </div>
      <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: "#6b7280" }}>
        {entry.period}
      </div>
    </a>
  );
}

// ─── Desktop map layout ─────────────────────────────────────────────────

function MapLayout({ inView }: { inView: boolean }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const planeRef = useRef<SVGGElement | null>(null);
  // Only the width is measured. The height is derived from the map's own
  // aspect ratio below, so observing it would just feed itself.
  const [width, setWidth] = useState(0);
  const [countries, setCountries] = useState<CountryFeature[] | null>(null);

  // Real card heights, so leader lines attach to actual card edges rather than
  // a guessed constant (card text wraps differently at different widths).
  const cardEls = useRef<Record<string, HTMLAnchorElement | null>>({});
  const [cardH, setCardH] = useState<Record<string, number>>({});

  useEffect(() => { loadCountries().then(setCountries); }, []);

  useLayoutEffect(() => {
    const ro = new ResizeObserver(() => {
      setCardH((prev) => {
        let changed = false;
        const next = { ...prev };
        for (const [id, el] of Object.entries(cardEls.current)) {
          if (!el) continue;
          const h = el.getBoundingClientRect().height;
          if (Math.abs((prev[id] ?? 0) - h) > 0.5) { next[id] = h; changed = true; }
        }
        return changed ? next : prev;
      });
    });
    for (const el of Object.values(cardEls.current)) if (el) ro.observe(el);
    return () => ro.disconnect();
  }, [width]);

  const measure = useCallback(() => {
    const el = wrapRef.current;
    if (!el) return;
    const w = el.getBoundingClientRect().width;
    setWidth((prev) => (Math.abs(prev - w) < 0.5 ? prev : w));
  }, []);

  useLayoutEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (wrapRef.current) ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, [measure]);

  // Projection + all projected geometry. Memoised on size/data only, so this
  // never recomputes on hover or on the animation frames.
  const scene = useMemo(() => {
    if (!countries || width <= 0) return null;

    const land = { type: "FeatureCollection" as const, features: countries };

    // Fit the land to the full content width — the section carries the Hero's
    // 8vw horizontal padding, so this container's width *is* the hero content
    // width, and the map's edges line up with the hero's margins.
    const projection = geoNaturalEarth1().fitWidth(width, land as never);
    let path = geoPath(projection);
    const bounds = path.bounds(land as never);
    const mapH = bounds[1][1] - bounds[0][1];

    // Container grows with the map so the map is never cropped, but never
    // shrinks below the height the card columns need.
    const height = Math.max(MIN_H, mapH + 100);

    // Horizontal centring can't use the raw projection bounds: Fiji and Russia
    // straddle the antimeridian, so each renders at BOTH x=0 and x=width and
    // pins the bbox to the full ±180° frame regardless of where the visible
    // landmass actually sits. Measure the bbox of the non-straddling features
    // instead and centre that — otherwise the map sits ~16px off-centre.
    let landMinX = Infinity;
    let landMaxX = -Infinity;
    for (const f of countries) {
      const b = path.bounds(f);
      if (b[1][0] - b[0][0] > width * 0.8) continue; // antimeridian straddler
      landMinX = Math.min(landMinX, b[0][0]);
      landMaxX = Math.max(landMaxX, b[1][0]);
    }
    const centreDx = Number.isFinite(landMinX) ? width / 2 - (landMinX + landMaxX) / 2 : 0;

    // A small additional nudge left, on top of the bbox centring above: at the
    // rendered size the two highlighted countries (UK left, Myanmar right)
    // read visually off-centre even with the outer bbox perfectly balanced,
    // because Myanmar's landmass is bulkier than the UK's. Purely a translate
    // adjustment — projection scale/rotation from fitWidth above is untouched.
    const nudgeDx = -width * 0.035;
    const dx = centreDx + nudgeDx;

    // Shift the projection itself, so pins and the flight path come out of
    // projection() already in container space — one coordinate system.
    const [tx, ty] = projection.translate();
    projection.translate([tx + dx, ty + (height - mapH) / 2 - bounds[0][1]]);
    path = geoPath(projection);

    const dim: string[] = [];
    const highlight: string[] = [];
    for (const f of countries) {
      const d = path(f);
      if (!d) continue;
      (String(f.id) === GBR || String(f.id) === MMR ? highlight : dim).push(d);
    }

    const project = (c: [number, number]) => {
      const p = projection(c);
      return p ? { x: p[0], y: p[1] } : null;
    };

    // Great-circle Yangon → Bristol, sampled and projected.
    const interp = geoInterpolate(YANGON, BRISTOL);
    const N = 160;
    const pts: { x: number; y: number }[] = [];
    for (let i = 0; i <= N; i++) {
      const p = projection(interp(i / N));
      if (p) pts.push({ x: p[0], y: p[1] });
    }
    // Start at the offset HND pin the flight departs from.
    const hnd = EDUCATION.find((e) => e.id === "gusto-hnd")!;
    if (pts.length) pts[0] = { x: pts[0].x + hnd.pinDx, y: pts[0].y + hnd.pinDy };

    const flightD = pts.map((p, i) => `${i ? "L" : "M"} ${p.x} ${p.y}`).join(" ");

    // Cumulative arc length, for travelling the path at a constant rate.
    const cum = [0];
    for (let i = 1; i < pts.length; i++) {
      cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
    }

    return { height, project, dim, highlight, pts, cum, flightD };
  }, [width, countries]);

  // Plane loops the projected great circle continuously for as long as the
  // section is mounted: fly Myanmar → UK over ~2s eased, pause ~0.4s at the
  // UK pin, snap instantly back to the Myanmar pin, repeat. Not gated by
  // scroll position — it isn't tied to `inView` at all, just to `scene`
  // being ready, so it keeps cycling regardless of whether the section is
  // currently in the viewport.
  useEffect(() => {
    if (!scene) return;
    const g = planeRef.current;
    if (!g) return;

    const { pts, cum } = scene;
    const total = cum[cum.length - 1];
    const FLY = 2000, PAUSE = 400;
    const CYCLE = FLY + PAUSE;
    const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

    // Position + tangent at a fraction of total arc length.
    const at = (u: number) => {
      const target = u * total;
      let i = 1;
      while (i < cum.length - 1 && cum[i] < target) i++;
      const seg = cum[i] - cum[i - 1] || 1;
      const f = (target - cum[i - 1]) / seg;
      const a = pts[i - 1], b = pts[i];
      // tangent taken from the neighbouring samples, so rotation follows the
      // *projected* curve rather than the geographic bearing
      const t0 = pts[Math.max(0, i - 2)], t1 = pts[Math.min(pts.length - 1, i + 1)];
      return {
        x: a.x + (b.x - a.x) * f,
        y: a.y + (b.y - a.y) * f,
        angle: (Math.atan2(t1.y - t0.y, t1.x - t0.x) * 180) / Math.PI,
      };
    };

    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = (now - start) % CYCLE; // wraps every cycle — the "snap reset"
      const t = Math.min(1, elapsed / FLY);   // holds at 1 (resting at the UK pin) during the pause
      const { x, y, angle } = at(easeInOut(t));
      g.setAttribute("transform", `translate(${x} ${y}) rotate(${angle})`);
      g.style.opacity = "1";
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [scene]);

  const height = scene?.height ?? MIN_H;

  return (
    <div ref={wrapRef} style={{ position: "relative", width: "100%", height }}>
      {scene && (
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width={width}
          height={height}
          style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 1, overflow: "hidden" }}
        >
          <defs>
            <radialGradient id="edu-pin-glow">
              <stop offset="0%" stopColor="rgba(255,255,255,0.15)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </radialGradient>
          </defs>

          {/* ── Map: decorative, behind everything ── */}
          <g>
            {scene.dim.map((d, i) => (
              <path key={i} d={d} fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth={0.6} />
            ))}
            {scene.highlight.map((d, i) => (
              <path key={i} d={d} fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.6)" strokeWidth={1} />
            ))}
          </g>

          {/* ── Leader lines: card edge → horizontal → vertical → pin ── */}
          {EDUCATION.map((entry, i) => {
            const pin = scene.project(entry.coords);
            if (!pin) return null;
            const px = pin.x + entry.pinDx;
            const py = pin.y + entry.pinDy;

            const top = entry.topPct * height;
            const left = entry.side === "left" ? 0 : width - CARD_W;
            const h = cardH[entry.id] ?? CARD_H_FALLBACK;

            // One right-angle bend, routed off whichever edge keeps the first
            // segment long enough to read as a leader line.
            let d: string;
            if (entry.exit === "right") {
              const y = top + h * entry.exitFrac;
              d = `M ${left + CARD_W} ${y} L ${px} ${y} L ${px} ${py}`;
            } else {
              const x = left + CARD_W * entry.exitFrac;
              const edgeY = entry.exit === "bottom" ? top + h : top;
              d = `M ${x} ${edgeY} L ${x} ${py} L ${px} ${py}`;
            }

            return (
              <path
                key={entry.id}
                d={d}
                fill="none"
                stroke="rgba(255,255,255,0.28)"
                strokeWidth={1}
                style={{ opacity: inView ? 1 : 0, transition: `opacity 0.6s ease ${0.12 * i + 0.2}s` }}
              />
            );
          })}

          {/* ── Flight path: always fully visible; only the plane animates ── */}
          <path
            d={scene.flightD}
            fill="none"
            stroke="rgba(255,255,255,0.35)" strokeWidth={1}
            strokeDasharray="6 6"
          />

          {/* ── Pins ── */}
          {EDUCATION.map((entry, i) => {
            const pin = scene.project(entry.coords);
            if (!pin) return null;
            const px = pin.x + entry.pinDx;
            const py = pin.y + entry.pinDy;
            return (
              <g key={entry.id} style={{ opacity: inView ? 1 : 0, transition: `opacity 0.5s ease ${0.12 * i + 0.1}s` }}>
                <circle
                  className="edu-pin-pulse"
                  cx={px} cy={py} r={20}
                  fill="url(#edu-pin-glow)"
                  style={{ animationDelay: `${i * 0.4}s` }}
                />
                <circle cx={px} cy={py} r={3} fill="#ffffff" />
              </g>
            );
          })}

          {/* ── Plane ── */}
          <g ref={planeRef} style={{ opacity: 0 }}>
            <PlaneGlyph />
          </g>
        </svg>
      )}

      {EDUCATION.map((entry, i) => (
        <EduCard
          key={entry.id}
          entry={entry}
          inView={inView}
          delay={0.12 * i}
          innerRef={(el) => { cardEls.current[entry.id] = el; }}
          style={{
            position: "absolute",
            width: CARD_W,
            top: `${entry.topPct * 100}%`,
            ...(entry.side === "left" ? { left: 0 } : { right: 0 }),
            zIndex: 2,
          }}
        />
      ))}
    </div>
  );
}

// ─── Mobile stacked layout ──────────────────────────────────────────────

function StackLayout({ inView }: { inView: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "stretch" }}>
      {EDUCATION.map((entry, i) => (
        <div key={entry.id}>
          <EduCard entry={entry} inView={inView} delay={0.12 * i} style={{ width: "100%", maxWidth: "none" }} />
          {i < EDUCATION.length - 1 && (
            <div style={{ position: "relative", height: 48, display: "flex", justifyContent: "center" }}>
              <div style={{ width: 0, height: "100%", borderLeft: "1px dashed rgba(255,255,255,0.25)" }} />
              <svg
                width={16} height={16} viewBox="-8 -8 16 16"
                style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%) rotate(90deg)" }}
              >
                <PlaneGlyph />
              </svg>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Section ─────────────────────────────────────────────────────────────

export default function EducationSection() {
  const { ref: sectionRef, inView } = useInView(0.1);
  const isDesktop = useIsDesktop();

  return (
    <section
      id="education"
      ref={sectionRef}
      style={{
        // Matches HeroSection's horizontal padding (80px 8vw 0) so the two
        // sections share identical left/right content margins. Hero sets no
        // max-width — its inner grid is width:100% — so neither does this.
        padding: "6rem 8vw",
        position: "relative",
        zIndex: 2,
        // Keeps the map's antimeridian geometry from adding to the page's
        // horizontal scroll area.
        overflowX: "hidden",
      }}
    >
      {/* Shared content box: header and map measure against the same edges. */}
      <div style={{ width: "100%", boxSizing: "border-box" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "4rem",
          opacity: inView ? 1 : 0, transform: inView ? "translateY(0)" : "translateY(16px)",
          transition: "opacity 0.6s ease, transform 0.6s ease",
        }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#84cc16", flexShrink: 0, display: "inline-block" }} />
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase", color: "#ffffff",
          }}>
            02 — Education
          </span>
        </div>

        {isDesktop ? <MapLayout inView={inView} /> : <StackLayout inView={inView} />}
      </div>

      <style>{`
        @keyframes eduPinPulse {
          0%, 100% { transform: scale(1); }
          50%      { transform: scale(1.4); }
        }
        .edu-pin-pulse {
          transform-box: fill-box;
          transform-origin: center;
          animation: eduPinPulse 2.5s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .edu-pin-pulse { animation: none; }
        }
      `}</style>
    </section>
  );
}
