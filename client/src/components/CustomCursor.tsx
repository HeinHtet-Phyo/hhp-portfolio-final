// Custom Cursor — Motionfolio-style mix-blend-difference dot
// Uses RAF + direct DOM mutation for zero React re-renders
import { useEffect, useRef, useState, memo } from "react";

const hasPointer = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(hover: hover) and (pointer: fine)").matches;

const CustomCursor = memo(function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const posRef = useRef({ x: 0, y: 0 });
  const hoveredRef = useRef(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (!hasPointer()) return;

    let rafId: number | null = null;

    const onMouseMove = (e: MouseEvent) => {
      posRef.current = { x: e.clientX, y: e.clientY };
      if (rafId === null) {
        rafId = requestAnimationFrame(() => {
          if (dotRef.current) {
            const offset = 5; // half of 10px
            dotRef.current.style.transform = `translate3d(${posRef.current.x - offset}px, ${posRef.current.y - offset}px, 0)`;
          }
          rafId = null;
        });
      }
    };

    const updateHovered = (next: boolean) => {
      if (hoveredRef.current === next) return;
      hoveredRef.current = next;
      setHovered(next);
    };

    const onOver = (e: MouseEvent) => {
      if ((e.target as Element).closest("a, button, [role='button'], .cursor-hover")) {
        updateHovered(true);
      }
    };

    const onOut = (e: MouseEvent) => {
      if ((e.target as Element).closest("a, button, [role='button'], .cursor-hover")) {
        updateHovered(false);
      }
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    document.addEventListener("mouseover", onOver, { passive: true });
    document.addEventListener("mouseout", onOut, { passive: true });

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("mouseout", onOut);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);

  if (!hasPointer()) return null;

  return (
    <div
      ref={dotRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: 10,
        height: 10,
        pointerEvents: "none",
        zIndex: 9999,
        mixBlendMode: "difference",
        willChange: "transform",
      }}
      className="hidden md:block"
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "white",
          borderRadius: "50%",
          transform: hovered ? "scale(5)" : "scale(1)",
          transition: "transform 0.15s ease-out",
        }}
      />
    </div>
  );
});

export default CustomCursor;
