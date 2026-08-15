// Scans the document for .reveal / .reveal-left / .reveal-right elements and
// adds .visible once each enters the viewport. Call once at the app root.
import { useEffect } from "react";

export function useReveal(threshold = 0.1) {
  useEffect(() => {
    const els = document.querySelectorAll(".reveal, .reveal-left, .reveal-right");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [threshold]);
}
