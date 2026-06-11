"use client";

import { useEffect, useRef, useState } from "react";
import { easeOutCubic } from "@/lib/dial-rotation";

/**
 * Index fractionnel pour faire tourner l'anneau de crans.
 * Pas d'animation au premier rendu — évite le flash au chargement.
 */
export function useDialRotation(targetIndex: number, durationMs: number): number {
  const [rotationIndex, setRotationIndex] = useState(targetIndex);
  const animatedRef = useRef(targetIndex);
  const rafRef = useRef<number | null>(null);
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    const to = targetIndex;

    if (!hasAnimatedRef.current) {
      hasAnimatedRef.current = true;
      animatedRef.current = to;
      setRotationIndex(to);
      return;
    }

    const from = animatedRef.current;

    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    if (Math.abs(from - to) < 0.0001) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      animatedRef.current = to;
      setRotationIndex(to);
      return;
    }

    const start = performance.now();

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const value = from + (to - from) * easeOutCubic(t);
      animatedRef.current = value;
      setRotationIndex(value);

      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        animatedRef.current = to;
        setRotationIndex(to);
        rafRef.current = null;
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [targetIndex, durationMs]);

  return rotationIndex;
}
