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
  logo?: string;
  badge?: string;
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
  // Which leg runs first on a "top"/"bottom" exit. "vertical" leaves the card
  // edge, runs to the pin's y, then goes horizontal along y=pinY. "horizontal"
  // runs across to the pin's x first, then drops vertically along x=pinX.
  // Ignored when exit is "right".
  bend?: "vertical" | "horizontal";
  // px offset applied to the MARKER. 0 everywhere: one campus is one dot, drawn
  // on the exact projected coordinate. The flight path also departs from this
  // offset, so changing it moves where the plane launches from.
  pinDx: number;
  pinDy: number;
  // px offset applied to this LEADER LINE'S ENDPOINT only — not to the marker,
  // not to the flight path. Both GUSTO cards target the same pin, so without a
  // separation their final legs lie on the identical rail and the shorter is
  // swallowed by the longer. -3 and +3 park them 6px apart: near enough to the
  // dot to read as one location, far enough to stay two visible lines.
  //
  // Deliberately SEPARATE from pinDx/pinDy. Fanning the pins themselves apart
  // is what previously split one campus into two apparent places; this moves
  // only where the strokes stop.
  endDx: number;
  endDy: number;
};

const EDUCATION: EduEntry[] = [
  {
    id: "gusto-foundation",
    institution: "GUSTO College Myanmar",
    monogram: "GC",
    logo: "/education/gusto_logo.jpeg",
    location: "Yangon, Myanmar",
    programme: "Foundation Diploma in IT",
    period: "Jul 2022 – Oct 2022",
    url: "https://www.facebook.com/GUSTOCollege/",
    coords: YANGON, side: "right", topPct: 0.62,
    exit: "top", exitFrac: 0.68, pinDx: 0, pinDy: 0, endDx: 0, endDy: 3,
  },
  {
    id: "gusto-hnd",
    institution: "GUSTO College Myanmar",
    monogram: "GC",
    logo: "/education/gusto_logo.jpeg",
    location: "Yangon, Myanmar",
    programme: "Higher National Diploma in Computing",
    period: "Nov 2022 – Nov 2024",
    url: "https://www.facebook.com/GUSTOCollege/",
    coords: YANGON, side: "right", topPct: 0.04,
    exit: "bottom", exitFrac: 0.45, pinDx: 0, pinDy: 0, endDx: 0, endDy: -3,
  },
  {
    id: "uwe-bristol",
    institution: "UWE Bristol",
    monogram: "UWE",
    logo: "/education/uwe_logo.png",
    badge: "First Class",
    location: "Bristol, UK",
    programme: "BSc Data Science & Artificial Intelligence",
    period: "Sep 2023 – Jun 2026",
    url: "https://www.uwe.ac.uk",
    coords: BRISTOL, side: "left", topPct: 0.45,
    exit: "right", exitFrac: 0.5, pinDx: 0, pinDy: 0, endDx: 0, endDy: 0,
  },
];

/** Identity of a map location. Two entries with the same key are one place. */
const coordKey = (c: [number, number]) => `${c[0]},${c[1]}`;

// One pin per unique coordinate, not one per entry. The two GUSTO College
// entries share the YANGON constant exactly, so rendering per-entry stacked two
// identical dots and two identical pulse haloes on the same point — the doubled
// glow read as a second, slightly-offset location. Each card still routes its
// own leader line to that shared point; only the marker is deduplicated.
// `index` is the ORIGINAL EDUCATION index, kept so the staggered fade-in delays
// are unchanged by the dedup.
const PINS = EDUCATION
  .map((entry, index) => ({ entry, index }))
  .filter(({ entry, index }) =>
    EDUCATION.findIndex((o) => coordKey(o.coords) === coordKey(entry.coords)) === index,
  );

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
      <span className="edu-bracket edu-bracket-tl" style={{ ...base, top: -1, left: -1, borderTop: `1px solid ${c}`, borderLeft: `1px solid ${c}` }} />
      <span className="edu-bracket edu-bracket-tr" style={{ ...base, top: -1, right: -1, borderTop: `1px solid ${c}`, borderRight: `1px solid ${c}` }} />
      <span className="edu-bracket edu-bracket-bl" style={{ ...base, bottom: -1, left: -1, borderBottom: `1px solid ${c}`, borderLeft: `1px solid ${c}` }} />
      <span className="edu-bracket edu-bracket-br" style={{ ...base, bottom: -1, right: -1, borderBottom: `1px solid ${c}`, borderRight: `1px solid ${c}` }} />
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
      className="edu-card"
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
        <div className="edu-monogram" style={{
          width: 40, height: 40,
          border: "1px solid rgba(255,255,255,0.2)",
          borderRadius: 4, background: "transparent",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 11, fontWeight: 600, color: "#ffffff", flexShrink: 0,
          overflow: "hidden",
        }}>
          {entry.logo ? (
            <img
              src={entry.logo}
              alt={`${entry.institution} logo`}
              style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: 4 }}
            />
          ) : (
            entry.monogram
          )}
        </div>
        <span style={{ fontSize: 13, color: "#6b7280", lineHeight: 1 }} aria-hidden>↗</span>
      </div>

      <div className="edu-location" style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase",
        color: "#8b929b", marginBottom: 6,
      }}>
        {entry.location}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <div className="edu-institution" style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 15, fontWeight: 500, color: "#ffffff",
          lineHeight: 1.3,
        }}>
          {entry.institution}
        </div>
        {entry.badge && (
          <span className="edu-badge" style={{
            display: "inline-flex",
            alignItems: "center",
            fontFamily: "'Inter', sans-serif",
            fontSize: "9px",
            padding: "0 0.25rem",
            color: "#FFD700",
            background: "transparent",
            border: "1px solid #FFD700",
            borderRadius: 0,
            lineHeight: 1.3,
            flexShrink: 0,
          }}>
            {entry.badge}
          </span>
        )}
      </div>

      <div className="edu-divider" style={{ borderTop: "1px solid rgba(255,255,255,0.1)", marginBottom: 12 }} />

      <div className="edu-programme" style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: "#9aa3ad", lineHeight: 1.45, marginBottom: 6 }}>
        {entry.programme}
      </div>
      <div className="edu-period" style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: "#6b7280" }}>
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

  // ONE projected screen point per unique map location, resolved here and read
  // by everything that draws to it — connector lines and pin markers alike.
  //
  // Both GUSTO College cards carry the same YANGON coordinate, so both now look
  // their endpoint up under the same key and receive the SAME object: identical
  // pixel by construction. Previously each connector called scene.project()
  // independently; those calls agreed numerically, but nothing in the code said
  // they had to, and any per-entry adjustment slipped in later would silently
  // split one campus into two destinations again.
  const pinPoints = useMemo(() => {
    const m = new Map<string, { x: number; y: number } | null>();
    if (!scene) return m;
    for (const e of EDUCATION) {
      const key = coordKey(e.coords);
      if (!m.has(key)) m.set(key, scene.project(e.coords));
    }
    return m;
  }, [scene]);

  // Verification that both GUSTO connectors terminate on one pixel. Logged from
  // an effect, not from render, so it fires once per layout instead of on every
  // re-render. Endpoint = pin + that entry's endDx/endDy, which is exactly the
  // final "L px py" of each path below.
  useEffect(() => {
    if (!pinPoints.size) return;
    const ends = EDUCATION
      .filter((e) => e.institution === "GUSTO College Myanmar")
      .map((e) => {
        const p = pinPoints.get(coordKey(e.coords));
        return { id: e.id, x: p ? p.x + e.endDx : NaN, y: p ? p.y + e.endDy : NaN };
      });
    ends.forEach((e, i) => {
      // eslint-disable-next-line no-console
      console.log(`Card ${i + 1} endpoint (${e.id}):`, e.x, e.y);
    });
    const marker = pinPoints.get(coordKey(YANGON));
    // eslint-disable-next-line no-console
    console.log(
      "Yangon marker:", marker?.x, marker?.y,
      "| endpoint gap:", ends.length === 2 ? Math.abs(ends[0].y - ends[1].y) : NaN, "px",
    );
  }, [pinPoints]);

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
              <path key={i} className="edu-map-dim" d={d} fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth={0.6} />
            ))}
            {scene.highlight.map((d, i) => (
              <path key={i} className="edu-map-highlight" d={d} fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.6)" strokeWidth={1} />
            ))}
          </g>

          {/* ── Leader lines: card edge → horizontal → vertical → pin ── */}
          {EDUCATION.map((entry, i) => {
            const pin = pinPoints.get(coordKey(entry.coords));
            if (!pin) return null;
            // Line endpoint, offset off the marker by endDx/endDy so two
            // connectors into one pin stay visually distinct. The marker below
            // is drawn from the unoffset point.
            const px = pin.x + entry.endDx;
            const py = pin.y + entry.endDy;

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
              d = entry.bend === "horizontal"
                // Across to the pin's x first, then straight down the pin's
                // column — approaches the dot perpendicular to the other card.
                ? `M ${x} ${edgeY} L ${px} ${edgeY} L ${px} ${py}`
                : `M ${x} ${edgeY} L ${x} ${py} L ${px} ${py}`;
            }

            return (
              <path
                key={entry.id}
                d={d}
                fill="none"
                className="edu-leader"
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
          {PINS.map(({ entry, index: i }) => {
            const pin = pinPoints.get(coordKey(entry.coords));
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

      {EDUCATION.map((entry) => {
        // UWE slides in from the left; both GUSTO cards slide in from the right,
        // staggered 0.2s / 0.4s apart (gusto-foundation first, gusto-hnd second).
        //
        // Driven directly off the `inView` prop rather than the global
        // .reveal-left/.reveal-right CSS classes: those classes only ever get
        // their .visible flag from a one-time document.querySelectorAll scan
        // at app mount (useReveal.ts). MapLayout unmounts/remounts whenever
        // isDesktop flips, so a resize from mobile back to desktop creates
        // fresh .reveal-left/.reveal-right nodes the scan never saw — they'd
        // sit at the class's default opacity:0 forever. inView is a live,
        // always-current per-section observer, so it doesn't have that gap.
        const delayStyle =
          entry.id === "gusto-foundation" ? { transitionDelay: "0.2s" }
          : entry.id === "gusto-hnd" ? { transitionDelay: "0.4s" }
          : undefined;
        return (
          <div
            key={entry.id}
            style={{
              position: "absolute",
              width: CARD_W,
              top: `${entry.topPct * 100}%`,
              ...(entry.side === "left" ? { left: 0 } : { right: 0 }),
              zIndex: 2,
              opacity: inView ? 1 : 0,
              transform: inView ? "translateX(0)" : `translateX(${entry.side === "left" ? "-40px" : "40px"})`,
              transition: "opacity 0.7s ease-out, transform 0.7s ease-out",
              ...delayStyle,
            }}
          >
            <EduCard
              entry={entry}
              inView={inView}
              delay={0}
              innerRef={(el) => { cardEls.current[entry.id] = el; }}
            />
          </div>
        );
      })}
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
        padding: "46px 8vw 6px",
        position: "relative",
        zIndex: 2,
        // Keeps the map's antimeridian geometry from adding to the page's
        // horizontal scroll area.
        overflowX: "hidden",
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(30px)",
        transition: "opacity 0.6s ease-out, transform 0.6s ease-out",
      }}
    >
      {/* Shared content box: header and map measure against the same edges. */}
      <div style={{ width: "100%", boxSizing: "border-box" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "5.25rem",
          opacity: inView ? 1 : 0, transform: inView ? "translateY(0)" : "translateY(16px)",
          transition: "opacity 0.6s ease, transform 0.6s ease",
        }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#84cc16", flexShrink: 0, display: "inline-block" }} />
          <span className="edu-section-label" style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.68rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#ffffff",
          }}>
            05 — Education
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

        /* ── Light mode ──────────────────────────────────────────────────────
           Every colour in this section is an inline style, and inline styles
           beat any selector, so these overrides need !important. Dark mode is
           the inline value and is untouched — these rules only apply under
           .light. */
        .light .edu-section-label { color: #000000 !important; font-weight: 600 !important; }

        .light .edu-card {
          background: rgba(0,0,0,0.08) !important;
          border: 1.5px solid rgba(0,0,0,0.3) !important;
        }
        /* Corner brackets.
           Tailwind's preflight applies "border: 0 solid" to EVERY element, so
           all four sides of these spans already have border-style: solid at
           width 0 — the inline style only sets a width on two of them. That is
           why a blanket "border-width: 2px" drew a complete 2px outline and the
           brackets rendered as filled black squares.
           The fix is per-side: zero all four widths here, then re-arm exactly
           the two sides each corner needs in the rules below. Those rules come
           second and carry equal specificity, so they win. */
        .light .edu-bracket {
          border-color: #000000 !important;
          border-width: 0 !important;
          background: transparent !important;
          background-color: transparent !important;
          width: 12px !important;
          height: 12px !important;
        }
        .light .edu-bracket-tl { border-top-width: 2px !important; border-left-width: 2px !important; }
        .light .edu-bracket-tr { border-top-width: 2px !important; border-right-width: 2px !important; }
        .light .edu-bracket-bl { border-bottom-width: 2px !important; border-left-width: 2px !important; }
        .light .edu-bracket-br { border-bottom-width: 2px !important; border-right-width: 2px !important; }
        .light .edu-monogram    { color: #000000 !important; font-weight: 700 !important; border-color: rgba(0,0,0,0.3) !important; }
        .light .edu-location    { color: #000000 !important; font-weight: 600 !important; }
        .light .edu-institution { color: #000000 !important; font-weight: 700 !important; font-size: 16px !important; }
        .light .edu-programme   { color: #111111 !important; font-weight: 500 !important; }
        .light .edu-period      { color: #333333 !important; font-weight: 500 !important; }
        /* Not in the brief, but a white rule is invisible on a light card. */
        .light .edu-divider     { border-top-color: rgba(0,0,0,0.12) !important; }

        /* Map: country outlines to mid grey; the two highlighted countries keep
           a darker stroke and an inked fill so they still read as highlighted.
           The SVG itself has no background — it stays transparent. */
        .light .edu-map-dim       { stroke: #999999 !important; }
        .light .edu-map-highlight { stroke: #555555 !important; fill: rgba(0,0,0,0.07) !important; }

        .light .edu-leader { stroke: rgba(0,0,0,0.5) !important; }
      `}</style>
    </section>
  );
}
