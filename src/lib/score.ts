export function scoreColor(score: number, max: number): string {
  if (max <= 0) return "#f87171";
  const ratio = score / max;
  if (ratio >= 0.8) return "#4ade80";
  if (ratio >= 0.6) return "#facc15";
  if (ratio >= 0.4) return "#fb923c";
  return "#f87171";
}
