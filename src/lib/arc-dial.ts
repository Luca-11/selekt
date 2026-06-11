export const ARC_SPAN_DEG = 140;
export const GHOST_SPAN_DEG = 200;
export const VISIBLE_SLOTS = 7;
export const STEP_DEG = ARC_SPAN_DEG / (VISIBLE_SLOTS - 1);

export const DIAL_DURATION = {
  scroll: 400,
  drag: 180,
  keyboard: 180,
} as const;

/** Delta wheel cumulé (px) avant de passer à la marque suivante. */
export const WHEEL_STEP_THRESHOLD = 340;

/** Délai sans scroll avant de remettre l'accumulateur à zéro. */
export const WHEEL_IDLE_RESET_MS = 300;

/** Intervalle minimum entre deux pas — aligné sur l'animation scroll. */
export const WHEEL_MIN_STEP_MS = 520;

export type DialMotion = keyof typeof DIAL_DURATION;

export function brandAngle(
  index: number,
  activeIndex: number,
  needleAngle: number,
): number {
  return needleAngle + (index - activeIndex) * STEP_DEG;
}

/** Position d'un cran sur l'arc — activeIndex peut être fractionnel pendant l'animation. */
export function notchAngle(
  index: number,
  rotationIndex: number,
  needleAngle: number,
): number {
  return brandAngle(index, rotationIndex, needleAngle);
}

/** Arrondi stable SSR/client pour les attributs SVG (sin/cos varient légèrement entre moteurs JS). */
export function roundSvg(n: number): number {
  return Math.round(n * 1e5) / 1e5;
}

export function polarToCartesian(
  cx: number,
  cy: number,
  radius: number,
  angleDeg: number,
): { x: number; y: number } {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: roundSvg(cx + radius * Math.cos(rad)),
    y: roundSvg(cy + radius * Math.sin(rad)),
  };
}

export type NotchZone = "active" | "ghost" | "hidden";

export function notchZone(angleDeg: number, needleAngle: number): NotchZone {
  const dist = Math.abs(angleDeg - needleAngle);
  const activeHalf = ARC_SPAN_DEG / 2 + STEP_DEG * 0.55;
  const ghostHalf = GHOST_SPAN_DEG / 2;
  if (dist <= activeHalf) return "active";
  if (dist <= ghostHalf) return "ghost";
  return "hidden";
}

export function isNotchVisible(angleDeg: number, needleAngle: number): boolean {
  return notchZone(angleDeg, needleAngle) !== "hidden";
}

export function clampIndex(index: number, length: number): number {
  if (length <= 0) return 0;
  return Math.max(0, Math.min(length - 1, index));
}
