// Dark Space Theme — Shooting Stars every 7 seconds
import { useEffect } from "react";

export default function ShootingStars() {
  useEffect(() => {
    const createStar = () => {
      const star = document.createElement("div");
      star.className = "shooting-star";
      const startX = Math.random() * window.innerWidth;
      const startY = Math.random() * window.innerHeight * 0.5;
      const angle = 30 + Math.random() * 20;
      const length = 150 + Math.random() * 100;

      star.style.cssText = `
        left: ${startX}px;
        top: ${startY}px;
        width: ${length}px;
        height: 2px;
        background: linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.8), rgba(0,212,255,0.6));
        border-radius: 0;
        transform: rotate(${angle}deg);
        transform-origin: left center;
        opacity: 0;
        animation: shoot 1s ease-out forwards;
      `;

      const style = document.createElement("style");
      style.textContent = `
        @keyframes shoot {
          0% { opacity: 0; transform: rotate(${angle}deg) translateX(0); }
          10% { opacity: 1; }
          100% { opacity: 0; transform: rotate(${angle}deg) translateX(${length * 2}px); }
        }
      `;
      document.head.appendChild(style);
      document.body.appendChild(star);

      setTimeout(() => {
        star.remove();
        style.remove();
      }, 1200);
    };

    createStar();
    const interval = setInterval(createStar, 7000);
    return () => clearInterval(interval);
  }, []);

  return null;
}
