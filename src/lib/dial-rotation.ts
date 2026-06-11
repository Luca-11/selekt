import { DIAL_DURATION, type DialMotion } from "@/lib/arc-dial";

export function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

export function durationForMotion(motion: DialMotion): number {
  return DIAL_DURATION[motion];
}
