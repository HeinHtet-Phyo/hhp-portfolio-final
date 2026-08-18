// CertificateGallery — matches the screenshot exactly
// Flat cards, colored gradient image area, cyan tab at top, certificate photo
// placeholder, colored date

import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

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

// ── Certificate data ──────────────────────────────────────────────────────────
const CERTS = [
  {
    image: "/certificates/UWE_First_Class.jpg",
    title: "BSc(Hons) Data Science & AI — First Class Honours",
    org: "UWE, Bristol",
    date: "Jun 2026",
    link: "https://drive.google.com/file/d/1LO6nVwcHJjP2jTCpdU1q3Ca8sTusnFQE/view?usp=sharing",
    gradient: "linear-gradient(160deg, #14161c 0%, #0c0e12 60%, #06070a 100%)",
    tabColor: "#22d3ee",
    dateColor: "rgba(255,255,255,0.75)",
    glowColor: "rgba(148,163,184,0.25)",
    borderHover: "rgba(226,232,240,0.5)",
  },
  {
    image: "/certificates/hnd-transcript.jpg",
    title: "HND in Computing — Distinction",
    org: "GUSTO College",
    date: "Oct 2024",
    link: "https://drive.google.com/file/d/1eULcy32g5-RackmlxJjio13CJ-9f1HiT/view?usp=sharing",
    gradient: "linear-gradient(160deg, #14161c 0%, #0c0e12 60%, #06070a 100%)",
    tabColor: "#22d3ee",
    dateColor: "rgba(255,255,255,0.75)",
    glowColor: "rgba(148,163,184,0.25)",
    borderHover: "rgba(226,232,240,0.5)",
  },
  {
    image: "/certificates/Data_Anlaysis___Machine_Learning.jpeg",
    title: "Data Analysis & Machine Learning",
    org: "Ace of Data",
    date: "Mar 2026",
    link: "https://drive.google.com/file/d/1zcjNAbrZgmqS1U3VorT9p0T5z06AbbKt/view?usp=sharing",
    gradient: "linear-gradient(160deg, #14161c 0%, #0c0e12 60%, #06070a 100%)",
    tabColor: "#22d3ee",
    dateColor: "rgba(255,255,255,0.75)",
    glowColor: "rgba(34,211,238,0.25)",
    borderHover: "rgba(226,232,240,0.5)",
  },
  {
    image: "/certificates/Introduction_to_Programming_Using_Python.jpeg",
    title: "Introduction to Programming Using Python",
    org: "Technortal",
    date: "May 2025",
    link: "https://drive.google.com/file/d/1A_xik2ylkbtUj6sEwbvjzQ0aSMTNV8Iy/view?usp=sharing",
    gradient: "linear-gradient(160deg, #14161c 0%, #0c0e12 60%, #06070a 100%)",
    tabColor: "#22d3ee",
    dateColor: "rgba(255,255,255,0.75)",
    glowColor: "rgba(129,140,248,0.25)",
    borderHover: "rgba(226,232,240,0.5)",
  },
  {
    image: "/certificates/Introduction_to_Programming_Using_Java.jpeg",
    title: "Introduction to Programming Using Java",
    org: "Technortal",
    date: "2025",
    link: "https://drive.google.com/file/d/1v2UV60HL7O5r8G12jTIeddVzn_3Eqjz_/view?usp=sharing",
    gradient: "linear-gradient(160deg, #14161c 0%, #0c0e12 60%, #06070a 100%)",
    tabColor: "#22d3ee",
    dateColor: "rgba(255,255,255,0.75)",
    glowColor: "rgba(148,163,184,0.25)",
    borderHover: "rgba(226,232,240,0.5)",
  },
  {
    image: "/certificates/Regen_Asia_Summit_2025.jpeg",
    title: "Regen Asia Summit 2025",
    org: "NUS, Singapore",
    date: "Jul 2025",
    link: "https://drive.google.com/file/d/1hLlRdwt_oNvih6r8jKHMmEWGTZa3RiyT/view?usp=sharing",
    gradient: "linear-gradient(160deg, #14161c 0%, #0c0e12 60%, #06070a 100%)",
    tabColor: "#22d3ee",
    dateColor: "rgba(255,255,255,0.75)",
    glowColor: "rgba(167,139,250,0.25)",
    borderHover: "rgba(226,232,240,0.5)",
  },
  {
    image: "/certificates/IOT_Challenge_Winner.jpeg",
    title: "IOT Challenge Winner",
    org: "GUSTO College",
    date: "Jan 2024",
    link: "https://drive.google.com/file/d/19O31m9z_sGuEFgVxLfJeDZUIuROBT228/view?usp=sharing",
    gradient: "linear-gradient(160deg, #14161c 0%, #0c0e12 60%, #06070a 100%)",
    tabColor: "#22d3ee",
    dateColor: "rgba(255,255,255,0.75)",
    glowColor: "rgba(245,158,11,0.25)",
    borderHover: "rgba(226,232,240,0.5)",
  },
  {
    image: "/certificates/IT_Challenge.jpeg",
    title: "IT Challenge",
    org: "GUSTO College",
    date: "2025",
    link: "https://drive.google.com/file/d/1CnGv2U9MjH2m7WCogPE4b5HXIPgMa6-0/view?usp=sharing",
    gradient: "linear-gradient(160deg, #14161c 0%, #0c0e12 60%, #06070a 100%)",
    tabColor: "#22d3ee",
    dateColor: "rgba(255,255,255,0.75)",
    glowColor: "rgba(52,211,153,0.25)",
    borderHover: "rgba(226,232,240,0.5)",
  },
];

// Shared arrow-button box. Vertically centred on the card strip, which sits
// 1.5rem below the container top and 2rem above its bottom — 50% of the box
// lands on the cards themselves.
const ARROW_STYLE: React.CSSProperties = {
  position: "absolute",
  top: "50%",
  transform: "translateY(-50%)",
  // 50, not 3. A hovered card takes zIndex 10, and because the scroll
  // container is position:static with no z-index it never opens a stacking
  // context — so those cards compete directly with these buttons and a hovered
  // one painted straight over the arrow. 50 clears it with room to spare.
  zIndex: 50,
  // Explicit, so no inherited pointer-events:none from a future wrapper can
  // silently make these unclickable.
  pointerEvents: "auto",
  width: "44px",
  height: "44px",
  borderRadius: "50%",
  background: "rgba(255,255,255,0.1)",
  border: "1px solid rgba(255,255,255,0.2)",
  color: "inherit",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  padding: 0,
  opacity: 0.75,
  transition: "opacity 0.2s ease, background 0.2s ease",
};

// L-shaped corner brackets, one set per card.
//
// Each span sets borders INLINE on exactly the two sides it needs. That matters:
// Tailwind's preflight applies "border: 0 solid" to every element, so all four
// sides already carry a solid style at width 0 — a blanket border-width would
// arm all four and draw a filled square instead of an L. Light mode overrides
// border-color only, never the widths, so the L survives the theme switch.
function CertCornerBrackets() {
  const c = "rgba(255,255,255,0.5)";
  const base: React.CSSProperties = {
    position: "absolute", width: 10, height: 10,
    background: "transparent", pointerEvents: "none", zIndex: 4,
  };
  return (
    <>
      <span className="cert-bracket" style={{ ...base, top: -1, left: -1, borderTop: `1px solid ${c}`, borderLeft: `1px solid ${c}` }} />
      <span className="cert-bracket" style={{ ...base, top: -1, right: -1, borderTop: `1px solid ${c}`, borderRight: `1px solid ${c}` }} />
      <span className="cert-bracket" style={{ ...base, bottom: -1, left: -1, borderBottom: `1px solid ${c}`, borderLeft: `1px solid ${c}` }} />
      <span className="cert-bracket" style={{ ...base, bottom: -1, right: -1, borderBottom: `1px solid ${c}`, borderRight: `1px solid ${c}` }} />
    </>
  );
}

// ── Certificate Card ──────────────────────────────────────────────────────────
function CertCard({ cert, index, inView }: { cert: typeof CERTS[0]; index: number; inView: boolean }) {
  const [hovered, setHovered] = useState(false);

  return (
    <a
      href={cert.link}
      target="_blank"
      rel="noopener noreferrer"
      tabIndex={0}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      className="cert-card"
      style={{
        position: "relative",
        flexShrink: 0,
        width: "195px",
        height: "230px",
        borderRadius: 0,
        // visible, not hidden: the corner brackets sit at -1px and would be
        // clipped away by an overflow context. Nothing needs clipping now that
        // the corners are square — the photo frame does its own clipping.
        overflow: "visible",
        border: hovered
          ? `1px solid ${cert.borderHover}`
          : "1px solid rgba(255,255,255,0.1)",
        background: "rgba(0,0,0,0.4)",
        // All cards same tilt angle: even=-5deg, odd=+5deg
        transform: hovered
          ? `rotate(0deg) scale(1.05)`
          : `rotate(${index % 2 === 0 ? -2 : 2}deg)`,
        transition: "transform 0.35s cubic-bezier(0.23,1,0.32,1), border-color 0.3s ease, opacity 0.65s cubic-bezier(0.23,1,0.32,1)",
        transitionDelay: `0s, 0s, ${index * 0.09}s`,
        zIndex: hovered ? 10 : 1,
        opacity: inView ? 1 : 0,
        cursor: "pointer",
        userSelect: "none",
        outline: "none",
        textDecoration: "none",
        color: "inherit",
        display: "block",
      }}
    >
      <CertCornerBrackets />

      {/* ── Image / gradient area ── */}
      <div className="cert-media" style={{
        height: "138px",
        background: cert.gradient,
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        // Inset for the placeholder frame below. Padding only — the area's own
        // 138px height and the card's 195x230 box are unchanged.
        padding: "8px",
        boxSizing: "border-box",
      }}>
        {/* Certificate photo placeholder — replaces the emoji. Fills the image
            area rather than taking a fixed 140px height, so the card keeps its
            exact dimensions; the 5%-white fill is translucent, so each card's
            gradient still reads through an empty frame. */}
        <div className="cert-frame" style={{
          width: "100%",
          height: "100%",
          background: "rgba(255,255,255,0.05)",
          border: "1px dashed rgba(255,255,255,0.2)",
          borderRadius: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          position: "relative",
          zIndex: 1,
        }}>
          {cert.image ? (
            <img
              src={cert.image}
              alt={cert.title}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <span className="cert-noimg" style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.55rem",
              letterSpacing: "0.08em",
              color: "rgba(255,255,255,0.35)",
            }}>
              [ NO IMAGE ]
            </span>
          )}
        </div>
      </div>

      {/* ── Text area ── */}
      <div className="cert-text" style={{ background: "transparent", padding: "0.6rem 0.9rem 0.7rem" }}>
        {/* Title */}
        <div className="cert-title" style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontWeight: 500,
          fontSize: "0.7rem",
          lineHeight: 1.3,
          marginBottom: "0.2rem",
          letterSpacing: "-0.01em",
          color: "#ffffff",
        }}>
          {cert.title}
        </div>

        {/* Org */}
        <div className="cert-org" style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "11px",
          color: "rgba(255,255,255,0.5)",
          marginBottom: "0.3rem",
          lineHeight: 1.4,
        }}>
          {cert.org}
        </div>

        {/* Date — cyan colored like screenshot */}
        <div className="cert-date" style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "11px",
          fontWeight: 500,
          color: "#ffffff",
          letterSpacing: "0.02em",
        }}>
          {cert.date}
        </div>
      </div>
    </a>
  );
}

// ── Main Section ──────────────────────────────────────────────────────────────
export default function CertificateGallery() {
  const { ref, inView } = useInView(0.1);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  // Where the smooth wheel scroll is heading. Kept separate from the live
  // scrollLeft so consecutive wheel ticks accumulate instead of each one
  // restarting from a position the previous smooth scroll has not reached yet.
  const targetLeft = useRef(0);

  const onMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    startX.current = e.pageX - (scrollRef.current?.offsetLeft ?? 0);
    scrollLeft.current = scrollRef.current?.scrollLeft ?? 0;
    if (scrollRef.current) scrollRef.current.style.cursor = "grabbing";
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - (scrollRef.current.offsetLeft ?? 0);
    const walk = (x - startX.current) * 1.2;
    scrollRef.current.scrollLeft = scrollLeft.current - walk;
    // Dragging moves the container out from under the wheel target; resync so
    // the next wheel tick continues from where the drag left off.
    targetLeft.current = scrollRef.current.scrollLeft;
  };
  const stopDrag = () => {
    isDragging.current = false;
    if (scrollRef.current) scrollRef.current.style.cursor = "grab";
  };

  // Arrow-button reach: how far one click moves the strip. Card width plus the
  // flex gap (0.8rem = 12.8px), so a click lands the next card in the same
  // position the current one occupies.
  const CARD_STEP = 195 + 12.8;

  // Which arrows to show. Recomputed on scroll and on resize — scrollWidth and
  // clientWidth both change with the viewport, so a resize can move the strip
  // from "scrollable" to "fits entirely" and both arrows must disappear.
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const update = () => {
      const max = el.scrollWidth - el.clientWidth;
      setCanLeft(el.scrollLeft > 1);
      setCanRight(max > 1 && el.scrollLeft < max - 1);
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, []);

  const nudge = (dir: -1 | 1) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left: el.scrollLeft + dir * CARD_STEP, behavior: "smooth" });
  };

  return (
    <section
      id="certificates"
      ref={ref}
      className="cert-section"
      style={{
        padding: "46px 8vw 16px", position: "relative", zIndex: 1, overflowX: "hidden",
      }}
    >
    <div className="reveal">
      {/* Section header */}
      <div className="cert-header" style={{
        marginBottom: "42px",
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(16px)",
        transition: "opacity 0.6s ease, transform 0.6s ease",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <span style={{
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              background: "#84cc16",
              flexShrink: 0,
              display: "inline-block",
              boxShadow: "0 0 8px rgba(132,204,22,0.6)",
            }} />
            <span className="cert-section-label" style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.68rem",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "#ffffff",
            }}>
              06 — Certificates
            </span>
          </div>
        </div>
      </div>

      {/* Scroll container */}
      <div style={{ position: "relative" }}>
        <div
          ref={scrollRef}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={stopDrag}
          onMouseLeave={stopDrag}
          style={{
            display: "flex",
            gap: "0.8rem",
            overflowX: "auto",
            overflowY: "visible",
            // 12px, not a large edge inset like 8vw: cert-section's own 8vw
            // padding already aligns the first card with the heading above.
            // This just gives the corner brackets' -1px overshoot visible
            // breathing room inside the scrollable area — without it,
            // overflowX:auto clips anything left of x:0.
            paddingLeft: "12px",
            paddingRight: "12px",
            paddingBottom: "2rem",
            paddingTop: "1.5rem",
            scrollbarWidth: "none",
            cursor: "grab",
            scrollBehavior: "smooth",
            alignItems: "center",
          }}
          className="cert-scroll"
        >
          {CERTS.map((cert, i) => (
            <CertCard key={cert.title} cert={cert} index={i} inView={inView} />
          ))}
          <div style={{ flexShrink: 0, width: "2vw" }} />
        </div>

        {/* ── Arrow navigation ── sits above the fade hints (z 3 vs 2). Each
            click advances exactly one card. Hidden entirely at the matching
            end, so there is never a dead button to click. */}
        {canLeft && (
          <button
            type="button"
            aria-label="Previous certificate"
            onClick={() => nudge(-1)}
            className="cert-arrow"
            style={{ ...ARROW_STYLE, left: "16px" }}
          >
            <ChevronLeft size={18} />
          </button>
        )}
        {canRight && (
          <button
            type="button"
            aria-label="Next certificate"
            onClick={() => nudge(1)}
            className="cert-arrow"
            style={{ ...ARROW_STYLE, right: "16px" }}
          >
            <ChevronRight size={18} />
          </button>
        )}

        {/* Right fade hint */}
        <div style={{
          position: "absolute",
          right: 0,
          top: 0,
          bottom: "1rem",
          width: "80px",
          background: "linear-gradient(to left, var(--background, #000) 0%, transparent 100%)",
          pointerEvents: "none",
          zIndex: 2,
        }} className="cert-fade-hint" />
      </div>

      <style>{`
        .cert-scroll::-webkit-scrollbar { display: none; }
        .cert-arrow:hover, .cert-arrow:focus-visible {
          opacity: 1 !important;
          background: rgba(255,255,255,0.2) !important;
        }
        .light .cert-arrow:hover, .light .cert-arrow:focus-visible {
          background: rgba(255,255,255,0.2) !important;
        }
        .light .cert-fade-hint {
          background: linear-gradient(to left, #e0e0e0 0%, transparent 100%) !important;
        }

        /* Certificates section is kept permanently dark regardless of theme —
           these .light overrides now force the same dark palette as the base
           (dark-mode) styles, rather than switching to a light one. The
           "06 — Certificates" section LABEL is the one exception: it falls
           through to the shared rule in index.css that all seven section
           labels use, so it matches "07 — Contact" (and the other five)
           exactly in light mode instead of being the only one left white. */

        .light .cert-card {
          background: transparent !important;
          background-color: transparent !important;
          border: 1px solid rgba(0,0,0,0.15) !important;
        }
        .light .cert-card:hover { border-color: rgba(0,0,0,0.35) !important; }
        .light .cert-bracket { border-color: rgba(0,0,0,0.6) !important; }

        .light .cert-media {
          background: transparent !important;
        }

        .light .cert-frame {
          background: transparent !important;
          border: 1px dashed rgba(0,0,0,0.08) !important;
        }
        .light .cert-noimg { color: rgba(0,0,0,0.25) !important; }

        .light .cert-title { color: #000000 !important; }
        .light .cert-org   { color: rgba(0,0,0,0.5) !important; }
        .light .cert-date  { color: #000000 !important; }
        .light .cert-text  {
          background: transparent !important;
          background-color: transparent !important;
        }

        .light .cert-arrow {
          background: rgba(255,255,255,0.1) !important;
          border: 1px solid rgba(255,255,255,0.2) !important;
          color: #ffffff !important;
        }

        /* Tablet/mobile: card takes (near) full width so effectively one shows
           at a time; the prev/next arrows (.cert-arrow, always rendered, never
           hidden) become the primary way to move between cards. No horizontal
           overflow: width is capped and box-sizing is border-box. Tilt/rotate
           removed — straightened flat, desktop keeps the ±2deg tilt. */
        @media (max-width: 1023px) {
          .cert-card {
            /* width:100%, not a vw-calc — the card is a flex item inside
               .cert-scroll, and .cert-scroll's own left/right padding already
               matches .cert-header's padding at every breakpoint below. A
               100% width (no separate card margin) fills exactly the space
               between those paddings, so the card's edges land flush with
               the heading's edges instead of double-indenting past them. */
            width: 100% !important;
            margin-left: 0 !important;
            margin-right: 0 !important;
            max-width: 100% !important;
            height: auto !important;
            box-sizing: border-box !important;
            transform: none !important;
          }
          .cert-media {
            width: 100% !important;
            height: auto !important;
            aspect-ratio: 16 / 9 !important;
          }
        }
        /* Tablet (768-1023px). */
        @media (max-width: 1023px) and (min-width: 768px) {
          .cert-media {
            height: 340px !important;
          }
          .cert-title {
            font-size: 1.125rem !important;
          }
          .cert-org, .cert-date {
            font-size: 0.875rem !important;
          }
        }
        /* Mobile (<768px). */
        @media (max-width: 767px) {
          .cert-media {
            height: 280px !important;
          }
          .cert-title {
            font-size: 1.125rem !important;
          }
          .cert-org, .cert-date {
            font-size: 0.875rem !important;
          }
          .cert-section {
            padding-top: 32px !important;
            padding-bottom: 32px !important;
          }
        }
      `}</style>
    </div>
    </section>
  );
}
