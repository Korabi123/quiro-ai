"use client";

import confetti from "canvas-confetti";

import { useEffect } from "react";

export function ConfettiSideCannons() {
  const handleClick = () => {
    const end = Date.now() + 1.5 * 1000;
    const colors = ["#ffd43e", "#ea721b", "#2f2722", "#d22626"];

    const frame = () => {
      if (Date.now() > end) return;

      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        startVelocity: 60,
        origin: { x: 0, y: 0.5 },
        colors: colors,
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        startVelocity: 60,
        origin: { x: 1, y: 0.5 },
        colors: colors,
      });

      requestAnimationFrame(frame);
    };

    frame();
  };

  useEffect(() => { handleClick(); }, []);

  return (
    <div className="relative" />
  );
}
